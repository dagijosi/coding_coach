// ---------------------------------------------------------------------------
// GitHub integration — local repository (Phase 8).
//
// Typed SQLite access for the GitHub cache. This is the ONLY layer that talks
// to the GitHub tables. It stores public activity only; credentials never pass
// through here (see secureTokenStore.ts). All reads work fully offline.
// ---------------------------------------------------------------------------

import { getDatabase } from '@/database';

import type {
  GitHubAccount,
  GitHubCommit,
  GitHubErrorInfo,
  GitHubRelease,
  GitHubRepository,
  GitHubSyncState,
} from '../types';

type AccountRow = {
  id: number;
  login: string;
  name: string | null;
  node_id: string;
  avatar_url: string | null;
  scopes: string;
  connected_at: string;
  last_sync_at: string | null;
};

type RepoRow = {
  id: string;
  owner: string;
  name: string;
  full_name: string;
  node_id: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updated_at: string | null;
  pushed_at: string | null;
  default_branch: string | null;
  url: string;
  selected: number;
  synced_at: string | null;
};

type CommitRow = {
  id: string;
  repo_id: string;
  sha: string;
  message: string;
  author_name: string | null;
  author_email: string | null;
  author_date: string | null;
  url: string;
  synced_at: string;
};

type ReleaseRow = {
  id: string;
  repo_id: string;
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string | null;
  url: string;
  synced_at: string;
};

type SyncStateRow = {
  id: number;
  last_sync_at: string | null;
  last_error_kind: string | null;
  last_error_message: string | null;
  last_error_retryable: number | null;
  last_error_rate_limit_reset_at: number | null;
  last_synced_count: number;
  rate_limit_reset_at: number | null;
  rate_limit_remaining: number | null;
  syncing: number;
};

function mapAccount(row: AccountRow): GitHubAccount {
  return {
    login: row.login,
    name: row.name,
    nodeId: row.node_id,
    avatarUrl: row.avatar_url,
    scopes: row.scopes ? row.scopes.split(',').filter(Boolean) : [],
    connectedAt: row.connected_at,
    lastSyncAt: row.last_sync_at,
  };
}

function mapRepo(row: RepoRow): GitHubRepository {
  return {
    id: row.id,
    owner: row.owner,
    name: row.name,
    fullName: row.full_name,
    nodeId: row.node_id,
    description: row.description,
    language: row.language,
    stars: row.stars,
    forks: row.forks,
    updatedAt: row.updated_at,
    pushedAt: row.pushed_at,
    defaultBranch: row.default_branch,
    url: row.url,
    selected: row.selected === 1,
    syncedAt: row.synced_at,
  };
}

function mapCommit(row: CommitRow): GitHubCommit {
  return {
    id: row.id,
    repoId: row.repo_id,
    sha: row.sha,
    message: row.message,
    authorName: row.author_name,
    authorEmail: row.author_email,
    authorDate: row.author_date,
    url: row.url,
    syncedAt: row.synced_at,
  };
}

function mapRelease(row: ReleaseRow): GitHubRelease {
  return {
    id: row.id,
    repoId: row.repo_id,
    tagName: row.tag_name,
    name: row.name,
    body: row.body,
    publishedAt: row.published_at,
    url: row.url,
    syncedAt: row.synced_at,
  };
}

function mapSyncState(row: SyncStateRow | null): GitHubSyncState {
  const errorInfo: GitHubErrorInfo | null =
    row?.last_error_kind && row?.last_error_message != null
      ? {
          kind: row.last_error_kind as GitHubErrorInfo['kind'],
          message: row.last_error_message,
          retryable: row.last_error_retryable === 1,
          rateLimitResetAt:
            row.last_error_rate_limit_reset_at ?? undefined,
        }
      : null;
  return {
    lastSyncAt: row?.last_sync_at ?? null,
    lastError: errorInfo,
    lastSyncedCount: row?.last_synced_count ?? 0,
    rateLimitResetAt: row?.rate_limit_reset_at ?? null,
    rateLimitRemaining: row?.rate_limit_remaining ?? null,
    syncing: row?.syncing === 1,
  };
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export async function saveAccount(account: GitHubAccount): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO github_account
       (id, login, name, node_id, avatar_url, scopes, connected_at, last_sync_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    account.login,
    account.name,
    account.nodeId,
    account.avatarUrl,
    account.scopes.join(','),
    account.connectedAt,
    account.lastSyncAt
  );
}

export async function getAccount(): Promise<GitHubAccount | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AccountRow>(
    `SELECT * FROM github_account WHERE id = 1`
  );
  return row ? mapAccount(row) : null;
}

export async function setAccountLastSyncAt(iso: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE github_account SET last_sync_at = ? WHERE id = 1`,
    iso
  );
}

/** Removes the connected identity. Does not touch cached activity. */
export async function clearAccount(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM github_account WHERE id = 1`);
}

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

export async function upsertRepositories(
  repos: GitHubRepository[]
): Promise<void> {
  if (repos.length === 0) return;
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const repo of repos) {
      await txn.runAsync(
        `INSERT INTO github_repositories
           (id, owner, name, full_name, node_id, description, language,
            stars, forks, updated_at, pushed_at, default_branch, url,
            selected, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(full_name) DO UPDATE SET
           owner = excluded.owner,
           name = excluded.name,
           node_id = excluded.node_id,
           description = excluded.description,
           language = excluded.language,
           stars = excluded.stars,
           forks = excluded.forks,
           updated_at = excluded.updated_at,
           pushed_at = excluded.pushed_at,
           default_branch = excluded.default_branch,
           url = excluded.url,
           synced_at = excluded.synced_at`,
        repo.id,
        repo.owner,
        repo.name,
        repo.fullName,
        repo.nodeId,
        repo.description,
        repo.language,
        repo.stars,
        repo.forks,
        repo.updatedAt,
        repo.pushedAt,
        repo.defaultBranch,
        repo.url,
        repo.selected ? 1 : 0,
        repo.syncedAt
      );
    }
  });
}

export async function getRepositories(): Promise<GitHubRepository[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RepoRow>(
    `SELECT * FROM github_repositories ORDER BY full_name ASC`
  );
  return rows.map(mapRepo);
}

export async function getSelectedRepositories(): Promise<GitHubRepository[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RepoRow>(
    `SELECT * FROM github_repositories
     WHERE selected = 1
     ORDER BY pushed_at DESC, full_name ASC`
  );
  return rows.map(mapRepo);
}

export async function getRepositoryByFullName(
  fullName: string
): Promise<GitHubRepository | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RepoRow>(
    `SELECT * FROM github_repositories WHERE full_name = ?`,
    fullName
  );
  return row ? mapRepo(row) : null;
}

export async function setRepositorySelected(
  fullName: string,
  selected: boolean
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE github_repositories SET selected = ? WHERE full_name = ?`,
    selected ? 1 : 0,
    fullName
  );
}

// ---------------------------------------------------------------------------
// Commits
// ---------------------------------------------------------------------------

/** Replaces (delete + bulk insert) the commit cache for a single repo. */
export async function replaceCommitsForRepo(
  repoId: string,
  commits: GitHubCommit[]
): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`DELETE FROM github_commits WHERE repo_id = ?`, repoId);
    for (const commit of commits) {
      await txn.runAsync(
        `INSERT OR IGNORE INTO github_commits
           (id, repo_id, sha, message, author_name, author_email, author_date, url, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        commit.id,
        commit.repoId,
        commit.sha,
        commit.message,
        commit.authorName,
        commit.authorEmail,
        commit.authorDate,
        commit.url,
        commit.syncedAt
      );
    }
  });
}

export async function getCommits(
  repoId: string,
  limit = 50
): Promise<GitHubCommit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CommitRow>(
    `SELECT * FROM github_commits
     WHERE repo_id = ?
     ORDER BY author_date DESC
     LIMIT ?`,
    repoId,
    limit
  );
  return rows.map(mapCommit);
}

export async function getRecentCommits(limit = 30): Promise<GitHubCommit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CommitRow>(
    `SELECT c.* FROM github_commits c
     JOIN github_repositories r ON r.id = c.repo_id
     WHERE r.selected = 1
     ORDER BY c.author_date DESC
     LIMIT ?`,
    limit
  );
  return rows.map(mapCommit);
}

// ---------------------------------------------------------------------------
// Releases
// ---------------------------------------------------------------------------

export async function replaceReleasesForRepo(
  repoId: string,
  releases: GitHubRelease[]
): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`DELETE FROM github_releases WHERE repo_id = ?`, repoId);
    for (const release of releases) {
      await txn.runAsync(
        `INSERT OR IGNORE INTO github_releases
           (id, repo_id, tag_name, name, body, published_at, url, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        release.id,
        release.repoId,
        release.tagName,
        release.name,
        release.body,
        release.publishedAt,
        release.url,
        release.syncedAt
      );
    }
  });
}

export async function getReleases(
  repoId: string,
  limit = 30
): Promise<GitHubRelease[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReleaseRow>(
    `SELECT * FROM github_releases
     WHERE repo_id = ?
     ORDER BY published_at DESC
     LIMIT ?`,
    repoId,
    limit
  );
  return rows.map(mapRelease);
}

export async function getRecentReleases(limit = 20): Promise<GitHubRelease[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReleaseRow>(
    `SELECT g.* FROM github_releases g
     JOIN github_repositories r ON r.id = g.repo_id
     WHERE r.selected = 1
     ORDER BY g.published_at DESC
     LIMIT ?`,
    limit
  );
  return rows.map(mapRelease);
}

// ---------------------------------------------------------------------------
// Sync state
// ---------------------------------------------------------------------------

function ensureSyncStateRow(db: Awaited<ReturnType<typeof getDatabase>>) {
  return db.runAsync(
    `INSERT OR IGNORE INTO github_sync_state (id, last_synced_count) VALUES (1, 0)`
  );
}

export async function getSyncState(): Promise<GitHubSyncState> {
  const db = await getDatabase();
  await ensureSyncStateRow(db);
  const row = await db.getFirstAsync<SyncStateRow>(
    `SELECT * FROM github_sync_state WHERE id = 1`
  );
  return mapSyncState(row);
}

export async function markSyncStarted(): Promise<void> {
  const db = await getDatabase();
  await ensureSyncStateRow(db);
  await db.runAsync(
    `UPDATE github_sync_state SET syncing = 1, last_error_kind = NULL, last_error_message = NULL WHERE id = 1`
  );
}

export async function markSyncSucceeded(
  iso: string,
  count: number,
  rateLimit: { remaining: number | null; resetAtSeconds: number | null }
): Promise<void> {
  const db = await getDatabase();
  await ensureSyncStateRow(db);
  await db.runAsync(
    `UPDATE github_sync_state
     SET syncing = 0, last_sync_at = ?, last_synced_count = ?,
         rate_limit_remaining = ?, rate_limit_reset_at = ?,
         last_error_kind = NULL, last_error_message = NULL,
         last_error_retryable = NULL, last_error_rate_limit_reset_at = NULL
     WHERE id = 1`,
    iso,
    count,
    rateLimit.remaining,
    rateLimit.resetAtSeconds
  );
}

export async function markSyncFailed(
  error: GitHubErrorInfo,
  rateLimit: { remaining: number | null; resetAtSeconds: number | null }
): Promise<void> {
  const db = await getDatabase();
  await ensureSyncStateRow(db);
  await db.runAsync(
    `UPDATE github_sync_state
     SET syncing = 0,
         last_error_kind = ?, last_error_message = ?,
         last_error_retryable = ?, last_error_rate_limit_reset_at = ?,
         rate_limit_remaining = ?, rate_limit_reset_at = ?
     WHERE id = 1`,
    error.kind,
    error.message,
    error.retryable ? 1 : 0,
    error.rateLimitResetAt ?? null,
    rateLimit.remaining,
    rateLimit.resetAtSeconds
  );
}

export async function markSyncIdle(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE github_sync_state SET syncing = 0 WHERE id = 1`);
}

// ---------------------------------------------------------------------------
// Disconnect / cleanup
// ---------------------------------------------------------------------------

/**
 * Removes all GitHub local data (account + repos + commits + releases) and
 * resets sync state to idle. Called on disconnect so no cached activity from a
 * previous account leaks into a re-connect.
 */
export async function clearGitHubData(): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(
      `DELETE FROM github_commits;
       DELETE FROM github_releases;
       DELETE FROM github_repositories;
       DELETE FROM github_account;
       INSERT OR REPLACE INTO github_sync_state
         (id, last_synced_count, syncing) VALUES (1, 0, 0);`
    );
  });
}
