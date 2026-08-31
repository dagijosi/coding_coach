// ---------------------------------------------------------------------------
// GitHub integration — type model (Phase 8).
//
// Domain types for the GitHub feature: the connected account, tracked
// repositories, commits, releases, sync state, and the deterministic insights
// built from cached data. Everything persisted matches one of the local SQLite
// tables; nothing here depends on the network. GitHub data is cached locally so
// that all previously-synced activity stays readable offline.
//
// IMPORTANT (security): OAuth credentials are NEVER part of these types and are
// NEVER written to SQLite. Access/refresh tokens live only in the OS-secure
// keychain via expo-secure-store (see secureTokenStore.ts).
// ---------------------------------------------------------------------------

/** The local connection lifecycle for the GitHub account. */
export type GitHubConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'synchronizing'
  | 'error';

/** The user-facing error variant surfaced in the UI (no raw tokens/URLs). */
export type GitHubErrorKind =
  | 'not_configured'
  | 'network'
  | 'rate_limited'
  | 'bad_credentials'
  | 'device_flow'
  | 'unknown';

/** Readable reason attached to an error state, plus a retry-safe hint. */
export type GitHubErrorInfo = {
  kind: GitHubErrorKind;
  message: string;
  /** true when the caller can simply try again (e.g. transient network). */
  retryable: boolean;
  /** Unix seconds when the GitHub rate limit resets (only for rate_limited). */
  rateLimitResetAt?: number;
};

/**
 * The identity of the connected GitHub account. Mirrors `github_account`
 * (a single-row table, id = 1).
 */
export type GitHubAccount = {
  login: string;
  name: string | null;
  nodeId: string;
  avatarUrl: string | null;
  /** Scopes granted at connect time (read-only intent, e.g. public_repo). */
  scopes: string[];
  connectedAt: string;
  lastSyncAt: string | null;
};

/** Local store row for a tracked repository. Mirrors `github_repositories`. */
export type GitHubRepository = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  nodeId: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string | null;
  pushedAt: string | null;
  defaultBranch: string | null;
  url: string;
  /** Whether the learner opted to track (include in sync + display). */
  selected: boolean;
  /** ISO timestamp of the last time this repo's data was fetched. */
  syncedAt: string | null;
};

/** A cached commit. Mirrors `github_commits` (PK = sha). */
export type GitHubCommit = {
  id: string;
  repoId: string;
  sha: string;
  message: string;
  authorName: string | null;
  authorEmail: string | null;
  authorDate: string | null;
  url: string;
  syncedAt: string;
};

/** A cached release. Mirrors `github_releases` (PK = node id). */
export type GitHubRelease = {
  id: string;
  repoId: string;
  tagName: string;
  name: string | null;
  body: string | null;
  publishedAt: string | null;
  url: string;
  syncedAt: string;
};

/**
 * Consolidated sync bookkeeping. Mirrors `github_sync_state` (single row,
 * id = 1). Tracks rate-limit pressure so the UI can surface "resets at X"
 * and the sync service can avoid hammering a metered API.
 */
export type GitHubSyncState = {
  lastSyncAt: string | null;
  lastError: GitHubErrorInfo | null;
  /** Commits/records fetched across the last completed sync. */
  lastSyncedCount: number;
  /** Unix seconds until which the GitHub rate limit is exhausted. */
  rateLimitResetAt: number | null;
  /** Remaining API calls (from the last response headers). */
  rateLimitRemaining: number | null;
  /** true when a sync is currently running (guards against overlap). */
  syncing: boolean;
};

/** The aggregated, deterministic "updates" summary shown to the learner. */
export type GitHubUpdates = {
  account: GitHubAccount;
  repositories: GitHubRepository[];
  /** Recent commits across selected repos, newest first (bounded). */
  commits: GitHubCommit[];
  /** Recent releases across selected repos, newest first (bounded). */
  releases: GitHubRelease[];
  syncState: GitHubSyncState;
  /** Whether the shown data is stale (i.e. could be refreshed by a sync). */
  hasCachedData: boolean;
};

/** Everything a smoke test / reviewer needs about a sync run. */
export type SyncResult = {
  success: boolean;
  /** Records committed to the local cache during this run. */
  committed: {
    repositories: number;
    commits: number;
    releases: number;
  };
  error: GitHubErrorInfo | null;
  skippedReason: string | null;
};
