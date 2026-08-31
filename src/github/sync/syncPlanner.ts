// ---------------------------------------------------------------------------
// GitHub integration — sync planner (Phase 8).
//
// PURE, dependency-free function that turns the current local cache state into
// an ordered list of GitHub API fetch tasks. Keeping the "what to fetch next"
// decision here makes incremental sync deterministic and unit-testable without
// the network or SQLite.
//
// Incremental strategy: commits/releases are append-only by nature (a SHA or a
// release node id is immutable), so re-fetching the most recent bounded page
// per repo and upserting (INSERT OR IGNORE) is safe and idempotent — existing
// records are preserved, new ones accumulate, and nothing is deleted wholesale.
// ---------------------------------------------------------------------------

/** The minimal repository shape the planner needs. */
export type PlanRepository = {
  id: string;
  fullName: string;
  selected: boolean;
  syncedAt: string | null;
};

export type SyncResource = 'commits' | 'releases';

export type SyncTask = {
  repo: PlanRepository;
  resource: SyncResource;
  /** Bounded page size to fetch (keeps each sync cheap on mobile). */
  fetchCount: number;
};

export type SyncPlan = {
  tasks: SyncTask[];
  /**
   * Non-null when the plan cannot proceed (e.g. GitHub is rate-limited until a
   * reset time). The caller should surface this and NOT retry until then.
   */
  blockedReason: string | null;
  rateLimited: boolean;
  rateLimitResetAtSeconds: number | null;
  /** Number of selected repos the learner is actively tracking. */
  pendingRepoCount: number;
};

export type PlanInput = {
  repositories: PlanRepository[];
  /** Unix seconds of the stored rate-limit reset, or null. */
  rateLimitResetAtSeconds: number | null;
  /** Unix seconds "now" (injectable for deterministic tests). */
  nowSeconds: number;
};

/** Per-repo bounded page sizes. */
export const COMMITS_PER_REPO = 25;
export const RELEASES_PER_REPO = 10;

/**
 * Builds the sync plan.
 *
 * - If GitHub is still rate-limited (reset time is in the future), the plan is
 *   blocked with a human-readable message and NO tasks — preventing repeated
 *   hitting of a metered API.
 * - Otherwise each SELECTED repo yields a commits task (and a releases task).
 * - Skipped/untracked repos contribute nothing.
 */
export function planIncrementalSync(input: PlanInput): SyncPlan {
  const selected = input.repositories.filter((r) => r.selected);

  // Rate-limit guard: do not issue requests while the limit is still exhausted.
  if (input.rateLimitResetAtSeconds != null) {
    const remainingSeconds = input.rateLimitResetAtSeconds - input.nowSeconds;
    if (remainingSeconds > 0) {
      return {
        tasks: [],
        blockedReason: `GitHub is rate-limited. Sync will resume automatically at ${formatResetTime(input.rateLimitResetAtSeconds)}.`,
        rateLimited: true,
        rateLimitResetAtSeconds: input.rateLimitResetAtSeconds,
        pendingRepoCount: selected.length,
      };
    }
  }

  const tasks: SyncTask[] = [];
  for (const repo of selected) {
    tasks.push({ repo, resource: 'commits', fetchCount: COMMITS_PER_REPO });
    tasks.push({ repo, resource: 'releases', fetchCount: RELEASES_PER_REPO });
  }

  return {
    tasks,
    blockedReason: null,
    rateLimited: false,
    rateLimitResetAtSeconds: null,
    pendingRepoCount: selected.length,
  };
}

function formatResetTime(unixSeconds: number): string {
  try {
    const date = new Date(unixSeconds * 1000);
    return isNaN(date.getTime()) ? 'later' : date.toLocaleTimeString();
  } catch {
    return 'later';
  }
}
