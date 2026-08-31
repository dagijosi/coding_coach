// ---------------------------------------------------------------------------
// GitHub integration — application service (Phase 8).
//
// The single entry point the UI and the Coach use. It composes:
//   - secureTokenStore (credentials, keychain-only)
//   - githubRepository (local cache)
//   - githubApi (network)
//   - syncService (incremental sync)
//   - ghInsights / ghCoachAdapter (deterministic summaries)
//
// The UI NEVER calls the GitHub API directly; every screen goes through here.
// ---------------------------------------------------------------------------

import * as api from './api/githubApi';
import { clearGitHubCredentials, saveGitHubCredentials } from './secureTokenStore';
import { runSync, readSyncState, getSyncStatus } from './sync/syncService';
import { buildGitHubInsights, type GitHubInsights } from './insights/ghInsights';
import {
  githubSummaryForCoach,
  matchesGithubIntent,
  type CoachGithubResult,
} from './coach/ghCoachAdapter';
import type {
  GitHubAccount,
  GitHubCommit,
  GitHubRelease,
  GitHubErrorInfo,
  GitHubRepository,
  GitHubSyncState,
  GitHubUpdates,
  SyncResult,
} from './types';
import * as repo from './repository/githubRepository';
import type { DeviceCode } from './deviceFlow';
import type { TokenPollResult } from './deviceFlow';

export type { GitHubInsights } from './insights/ghInsights';
export type {
  CoachGithubResult,
  CoachGithubInput,
} from './coach/ghCoachAdapter';
export { matchesGithubIntent };
export type { DeviceCode, TokenPollResult };
export type {
  GitHubAccount,
  GitHubRepository,
  GitHubCommit,
  GitHubRelease,
  GitHubSyncState,
  GitHubUpdates,
  GitHubConnectionStatus,
  GitHubErrorInfo,
  GitHubErrorKind,
  SyncResult,
} from './types';

/** Bounded number of recent commits/releases loaded for the updates view. */
const COMMITS_VIEW_LIMIT = 40;
const RELEASES_VIEW_LIMIT = 25;

// ---------------------------------------------------------------------------
// Account + connect
// ---------------------------------------------------------------------------

export async function getGitHubAccount(): Promise<GitHubAccount | null> {
  return repo.getAccount();
}

/** Begins the device flow; returns the DeviceCode to present to the user. */
export async function beginDeviceFlow(): Promise<
  { status: 'success'; device: DeviceCode } | { status: 'not_configured' | 'error'; error: GitHubErrorInfo }
> {
  return api.startDeviceFlow();
}

/**
 * Polls GitHub for the access token. On success, stores credentials in the
 * keychain and records the account identity locally.
 */
export async function completeDeviceFlow(
  deviceCode: string
): Promise<{ ok: true; account: GitHubAccount } | { ok: false; error: GitHubErrorInfo }> {
  const raw = await api.pollDeviceToken(deviceCode);
  if (raw.status !== 'success') {
    return {
      ok: false,
      error: {
        kind: raw.status === 'access_denied' || raw.status === 'expired_token' ? 'device_flow' : 'device_flow',
        message: tokenPollMessage(raw),
        retryable:
          raw.status === 'authorization_pending' ||
          raw.status === 'slow_down' ||
          raw.status === 'error',
      },
    };
  }

  // Persist credentials to the keychain (never SQLite).
  const expiresAt = raw.expiresInSeconds != null
    ? Math.floor(Date.now() / 1000) + raw.expiresInSeconds
    : undefined;
  const scopes = ['public_repo', 'read:user'];

  // Identify the user to bind the account row.
  await saveGitHubCredentials({
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken ?? undefined,
    expiresAt,
    login: '',
  });

  const userCall = await api.fetchCurrentUser(scopes);
  if (!userCall.ok) {
    await clearGitHubCredentials();
    return { ok: false, error: userCall.error };
  }
  const account = userCall.data;
  account.scopes = scopes;

  await saveGitHubCredentials({
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken ?? undefined,
    expiresAt,
    login: account.login,
  });
  await repo.saveAccount(account);
  return { ok: true, account };
}

export async function disconnectGitHub(): Promise<void> {
  // Clear cached activity + identity, then drop the keychain credentials.
  await repo.clearGitHubData();
  await clearGitHubCredentials();
}

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

export async function getRepositories(): Promise<GitHubRepository[]> {
  return repo.getRepositories();
}

/**
 * Loads a single repository plus its cached commits and releases (offline).
 * `fullName` is `"owner/name"`, which equals the repository primary key.
 */
export async function getRepositoryDetail(fullName: string): Promise<{
  repository: GitHubRepository | null;
  commits: GitHubCommit[];
  releases: GitHubRelease[];
}> {
  const [repository, commits, releases] = await Promise.all([
    repo.getRepositoryByFullName(fullName),
    repo.getCommits(fullName, 100),
    repo.getReleases(fullName, 50),
  ]);
  return { repository, commits, releases };
}

export async function setRepositorySelected(
  fullName: string,
  selected: boolean
): Promise<void> {
  await repo.setRepositorySelected(fullName, selected);
}

export async function refreshRepositoryList(): Promise<
  { ok: true; repositories: GitHubRepository[] } | { ok: false; error: GitHubErrorInfo }
> {
  const call = await api.fetchRepositories();
  if (!call.ok) {
    return { ok: false, error: call.error };
  }
  const local = await repo.getRepositories();
  const localMap = new Map(local.map((r) => [r.fullName, r]));
  const merged = call.data.map((r) => ({
    ...r,
    selected: localMap.get(r.fullName)?.selected ?? true,
    syncedAt: localMap.get(r.fullName)?.syncedAt ?? null,
  }));
  await repo.upsertRepositories(merged);
  return { ok: true, repositories: await repo.getRepositories() };
}

// ---------------------------------------------------------------------------
// Updates + sync
// ---------------------------------------------------------------------------

export async function getGitHubUpdates(): Promise<GitHubUpdates> {
  const [account, repositories, commits, releases, syncState] = await Promise.all([
    repo.getAccount(),
    repo.getRepositories(),
    repo.getRecentCommits(COMMITS_VIEW_LIMIT),
    repo.getRecentReleases(RELEASES_VIEW_LIMIT),
    repo.getSyncState(),
  ]);

  return {
    account: account ?? nullAccount(),
    repositories,
    commits,
    releases,
    syncState,
    hasCachedData:
      (account !== null && repositories.length > 0) ||
      commits.length > 0 ||
      releases.length > 0,
  };
}

export async function getSyncState(): Promise<GitHubSyncState> {
  return readSyncState();
}

export async function getSyncAvailability(): Promise<{
  syncing: boolean;
  rateLimited: boolean;
  rateLimitResetAt: number | null;
}> {
  return getSyncStatus();
}

export async function syncGitHub(): Promise<SyncResult> {
  return runSync();
}

// ---------------------------------------------------------------------------
// Insights + Coach
// ---------------------------------------------------------------------------

export async function getGitHubInsights(): Promise<GitHubInsights | null> {
  const account = await repo.getAccount();
  if (!account) return null;
  const [repositories, commits, releases] = await Promise.all([
    repo.getRepositories(),
    repo.getRecentCommits(COMMITS_VIEW_LIMIT),
    repo.getRecentReleases(RELEASES_VIEW_LIMIT),
  ]);
  return buildGitHubInsights({ account, repositories, commits, releases });
}

export async function getCoachGithubSummary(): Promise<CoachGithubResult> {
  const account = await repo.getAccount();
  const [repositories, commits, releases] = await Promise.all([
    repo.getRepositories(),
    repo.getRecentCommits(COMMITS_VIEW_LIMIT),
    repo.getRecentReleases(RELEASES_VIEW_LIMIT),
  ]);
  return githubSummaryForCoach({ account, repositories, commits, releases });
}

function nullAccount(): GitHubAccount {
  return {
    login: '',
    name: null,
    nodeId: '',
    avatarUrl: null,
    scopes: [],
    connectedAt: '',
    lastSyncAt: null,
  };
}

function tokenPollMessage(raw: TokenPollResult & { status: string }): string {
  switch (raw.status) {
    case 'slow_down':
      return 'GitHub is busy, slow down the polling and try again.';
    case 'access_denied':
      return 'You did not authorize the connection.';
    case 'expired_token':
      return 'The device code expired. Start the connection again.';
    case 'device_flow_disabled':
      return 'Device Flow is disabled for the GitHub app. Enable it in the app settings.';
    case 'bad_credentials':
      return 'The GitHub app credentials are invalid. Check the app client_id.';
    default:
      return (raw as { message?: string }).message ?? 'GitHub did not complete the sign-in.';
  }
}
