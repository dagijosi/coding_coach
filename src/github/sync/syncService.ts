// ---------------------------------------------------------------------------
// GitHub integration — sync service (Phase 8).
//
// Orchestrates the incremental, offline-safe synchronization of cached GitHub
// activity:
//
//   1. reads the connected account + local sync state
//   2. builds a plan (syncPlanner) — which selected repos / resources to fetch
//   3. executes each fetch task through the GitHub API service
//   4. persists results into the local cache (upsert / replace-per-repo)
//   5. records success/error + rate-limit info in github_sync_state
//
// It never deletes all local data on a sync: commits/releases are upserted so
// previously-synced activity stays available offline. A rate-limited plan is
// surfaced as a clear, non-retry-until-reset result.
// ---------------------------------------------------------------------------

import * as api from '../api/githubApi';
import { loadGitHubCredentials } from '../secureTokenStore';
import { notConnectedError } from '../errorMapping';
import { planIncrementalSync, type SyncPlan, type SyncTask } from './syncPlanner';
import type { GitHubErrorInfo, GitHubSyncState, SyncResult } from '../types';
import * as repo from '../repository/githubRepository';

export type { SyncPlan, SyncTask };

/** Tracked repos are those the learner selected; a unit of work per task. */
export type SyncContext = {
  /** Number of selected repos to sync (0 when none selected). */
  repoCount: number;
};

function nowISO(): string {
  return new Date().toISOString();
}

function initResult(): SyncResult {
  return {
    success: false,
    committed: { repositories: 0, commits: 0, releases: 0 },
    error: null,
    skippedReason: null,
  };
}

/**
 * Runs one incremental sync. Safe to call repeatedly: it is idempotent and
 * guarded against overlapping runs via the stored `syncing` flag.
 */
export async function runSync(): Promise<SyncResult> {
  const result = initResult();

  // Connection guard.
  const creds = await loadGitHubCredentials();
  if (!creds) {
    const error = notConnectedError();
    result.error = error;
    await repo.markSyncFailed(error, { remaining: null, resetAtSeconds: null });
    return result;
  }

  const state = await repo.getSyncState();
  if (state.syncing) {
    result.skippedReason = 'A sync is already in progress.';
    result.success = true;
    return result;
  }

  const account = await repo.getAccount();
  if (!account) {
    const error = notConnectedError();
    result.error = error;
    await repo.markSyncFailed(error, { remaining: null, resetAtSeconds: null });
    return result;
  }

  const repositories = await repo.getRepositories();
  const selected = repositories.filter((r) => r.selected);

  // Build the plan (respects rate-limit windows, incremental by design).
  const plan = planIncrementalSync({
    repositories,
    rateLimitResetAtSeconds: state.rateLimitResetAt ?? null,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  result.skippedReason = plan.blockedReason;

  if (plan.rateLimited || plan.tasks.length === 0) {
    if (plan.rateLimited) {
      result.error = {
        kind: 'rate_limited',
        message: plan.blockedReason ?? 'GitHub rate limit reached.',
        retryable: true,
        rateLimitResetAt: plan.rateLimitResetAtSeconds ?? undefined,
      };
    } else {
      result.success = true;
      result.skippedReason =
        selected.length === 0
          ? 'No repositories are selected to sync.'
          : 'Nothing to sync.';
      result.committed = { repositories: selected.length, commits: 0, releases: 0 };
      await repo.markSyncSucceeded(nowISO(), 0, { remaining: null, resetAtSeconds: null });
      return result;
    }
    await repo.markSyncFailed(result.error, { remaining: null, resetAtSeconds: null });
    return result;
  }

  // Run the sync: upsert repos once, then the per-repo resources.
  await repo.markSyncStarted();
  let committedCommits = 0;
  let committedReleases = 0;
  let lastRateLimit: { remaining: number | null; resetAtSeconds: number | null } = {
    remaining: null,
    resetAtSeconds: null,
  };

  try {
    // Refresh repo metadata for selected repos (owner/name/stats/url).
    const reposCall = await api.fetchRepositories();
    if (reposCall.ok) {
      const merged = mergeSelected(reposCall.data, selected);
      await repo.upsertRepositories(merged);
      result.committed.repositories = merged.length;
      lastRateLimit = reposCall.rateLimit;
    } else if (
      reposCall.error.kind === 'rate_limited' ||
      reposCall.error.kind === 'network' ||
      reposCall.error.kind === 'bad_credentials'
    ) {
      throw reposCall.error;
    }

    const selectedRepos = await repo.getSelectedRepositories();
    const byName = new Map(selectedRepos.map((r) => [r.fullName, r]));

    for (const task of plan.tasks) {
      const local = byName.get(task.repo.fullName);
      if (!local) continue;

      if (task.resource === 'commits') {
        const call = await api.fetchCommits(local.fullName, task.fetchCount);
        if (call.ok) {
          // Stamp repoId (== local.id) so FK integrity holds, then persist.
          const stamped = call.data.map((c) => ({ ...c, repoId: local.id }));
          await repo.replaceCommitsForRepo(local.id, stamped);
          committedCommits += stamped.length;
          lastRateLimit = call.rateLimit;
        } else {
          throw call.error;
        }
      } else {
        const call = await api.fetchReleases(local.fullName, task.fetchCount);
        if (call.ok) {
          const stamped = call.data.map((r) => ({ ...r, repoId: local.id }));
          await repo.replaceReleasesForRepo(local.id, stamped);
          committedReleases += stamped.length;
          lastRateLimit = call.rateLimit;
        } else {
          throw call.error;
        }
      }
    }

    const syncedAt = nowISO();
    await repo.setAccountLastSyncAt(syncedAt);
    await repo.markSyncSucceeded(syncedAt, committedCommits + committedReleases, lastRateLimit);
    result.success = true;
    result.committed.commits = committedCommits;
    result.committed.releases = committedReleases;
    return result;
  } catch (error) {
    const err: GitHubErrorInfo = normalizeSyncError(error);
    result.error = err;
    await repo.markSyncFailed(err, lastRateLimit);
    return result;
  }
}

/**
 * Returns whether a sync is either running or blocked by an active rate limit.
 * The UI uses this to decide whether to disable the "Sync now" button and to
 * show a "resets at X" hint instead of allowing an immediate retry.
 */
export async function getSyncStatus(): Promise<{
  syncing: boolean;
  rateLimited: boolean;
  rateLimitResetAt: number | null;
}> {
  const state = await repo.getSyncState();
  const nowSec = Math.floor(Date.now() / 1000);
  const rateLimited =
    state.rateLimitResetAt != null && state.rateLimitResetAt > nowSec;
  return {
    syncing: state.syncing,
    rateLimited,
    rateLimitResetAt: state.rateLimitResetAt,
  };
}

export async function readSyncState(): Promise<GitHubSyncState> {
  return repo.getSyncState();
}

/** Refresh repo metadata while preserving the learner's selection flags. */
function mergeSelected(
  fresh: import('../types').GitHubRepository[],
  existingSelected: import('../types').GitHubRepository[]
): import('../types').GitHubRepository[] {
  const selectedSet = new Map(existingSelected.map((r) => [r.fullName, r]));
  const now = nowISO();
  return fresh.map((r) => {
    const prev = selectedSet.get(r.fullName);
    return {
      ...r,
      // Keep previous selection if the repo was already tracked; new repos
      // default to selected = true from the parser.
      selected: prev ? prev.selected : r.selected,
      syncedAt: now,
    };
  });
}

function normalizeSyncError(error: unknown): GitHubErrorInfo {
  if (
    error &&
    typeof error === 'object' &&
    'kind' in error &&
    'message' in error &&
    typeof (error as GitHubErrorInfo).message === 'string'
  ) {
    return error as GitHubErrorInfo;
  }
  return {
    kind: 'unknown',
    message: 'Syncing GitHub activity failed. Please try again.',
    retryable: true,
  };
}
