// ---------------------------------------------------------------------------
// GitHub integration — REST response parsing (Phase 8).
//
// PURE, dependency-free mapping of GitHub API JSON into the local domain types
// (GitHubAccount, GitHubRepository, GitHubCommit, GitHubRelease) plus rate-limit
// metadata parsed from response headers. Keeping the mapping here makes it
// deterministic and unit-testable without any network or SQLite dependency.
// ---------------------------------------------------------------------------

import type {
  GitHubAccount,
  GitHubCommit,
  GitHubRelease,
  GitHubRepository,
} from './types';

export type GitHubUserJson = {
  login?: unknown;
  name?: unknown;
  node_id?: unknown;
  avatar_url?: unknown;
};

export type GitHubRepoJson = {
  id?: unknown;
  node_id?: unknown;
  owner?: { login?: unknown };
  name?: unknown;
  full_name?: unknown;
  description?: unknown | null;
  language?: unknown | null;
  stargazers_count?: unknown;
  forks_count?: unknown;
  updated_at?: unknown;
  pushed_at?: unknown;
  default_branch?: unknown;
  html_url?: unknown;
};

export type GitHubCommitJson = {
  sha?: unknown;
  html_url?: unknown;
  commit?: {
    message?: unknown;
    author?: { name?: unknown; email?: unknown; date?: unknown };
  };
};

export type GitHubReleaseJson = {
  id?: unknown;
  node_id?: unknown;
  tag_name?: unknown;
  name?: unknown | null;
  body?: unknown | null;
  published_at?: unknown;
  html_url?: unknown;
};

export type RateLimitInfo = {
  remaining: number | null;
  /** Unix seconds when the limit resets. */
  resetAtSeconds: number | null;
};

/** Historic reference date so deterministic + past times stay predictable. */
const FLAT_FALLBACK = new Date(0).toISOString();

/** Parses rate-limit info from a normalized header map (case-insensitive). */
export function parseRateLimit(headers: Record<string, string | undefined>): RateLimitInfo {
  const remainingHeader = firstHeader(headers, 'x-ratelimit-remaining');
  const resetHeader = firstHeader(headers, 'x-ratelimit-reset');
  const remaining =
    remainingHeader !== undefined && /^\d+$/.test(remainingHeader)
      ? Number(remainingHeader)
      : null;
  const resetAtSeconds =
    resetHeader !== undefined && /^\d+$/.test(resetHeader)
      ? Number(resetHeader)
      : null;
  return { remaining, resetAtSeconds };
}

export function parseUser(json: GitHubUserJson, scopes: string[], connectedAt: string): GitHubAccount {
  return {
    login: str(json.login, ''),
    name: strOrNull(json.name),
    nodeId: str(json.node_id, ''),
    avatarUrl: strOrNull(json.avatar_url),
    scopes,
    connectedAt,
    lastSyncAt: null,
  };
}

export function parseRepository(json: GitHubRepoJson): GitHubRepository {
  const fullName = str(json.full_name, '');
  const [owner = str(json.owner?.login, ''), name = str(json.name, '')] = splitFullName(fullName);
  const resolvedName = fullName || `${owner}/${name}`;
  return {
    // id is the globally-unique full_name ("owner/name"); commits/releases FK
    // to this same value so integrity holds without a node_id dependency.
    id: resolvedName,
    owner,
    name,
    fullName: resolvedName,
    nodeId: str(json.node_id, ''),
    description: strOrNull(json.description),
    language: strOrNull(json.language),
    stars: num(json.stargazers_count, 0),
    forks: num(json.forks_count, 0),
    updatedAt: dateStrOrNull(json.updated_at),
    pushedAt: dateStrOrNull(json.pushed_at),
    defaultBranch: strOrNull(json.default_branch),
    url: str(json.html_url, ''),
    selected: true,
    syncedAt: null,
  };
}

export function parseCommit(json: GitHubCommitJson, repoId: string, syncedAt: string): GitHubCommit {
  const sha = str(json.sha, '');
  const msg = str(json.commit?.message, '');
  return {
    // Primary key is repoId + sha to avoid cross-fork sha collisions.
    id: `${repoId}:${sha}`,
    repoId,
    sha,
    message: msg,
    authorName: strOrNull(json.commit?.author?.name),
    authorEmail: strOrNull(json.commit?.author?.email),
    authorDate: dateStrOrNull(json.commit?.author?.date),
    url: str(json.html_url, ''),
    syncedAt,
  };
}

export function parseRelease(json: GitHubReleaseJson, repoId: string, syncedAt: string): GitHubRelease {
  return {
    id: str(json.node_id, str(json.id, `${repoId}:${str(json.tag_name, '')}`)),
    repoId,
    tagName: str(json.tag_name, ''),
    name: strOrNull(json.name),
    body: strOrNull(json.body),
    publishedAt: dateStrOrNull(json.published_at),
    url: str(json.html_url, ''),
    syncedAt,
  };
}

function splitFullName(fullName: string): [string, string] {
  const idx = fullName.indexOf('/');
  if (idx === -1) {
    return ['', fullName];
  }
  return [fullName.slice(0, idx), fullName.slice(idx + 1)];
}

function firstHeader(
  headers: Record<string, string | undefined>,
  key: string
): string | undefined {
  if (key in headers) {
    return headers[key];
  }
  const lower = key.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) {
      return headers[k];
    }
  }
  return undefined;
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function dateStrOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

export { FLAT_FALLBACK };
