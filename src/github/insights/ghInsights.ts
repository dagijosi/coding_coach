// ---------------------------------------------------------------------------
// GitHub integration — insight builder (Phase 8).
//
// PURE, dependency-free, deterministic summaries computed from the local GitHub
// cache. Used by the GitHub Updates UI and the Coach adapter. Never fetches the
// network and never hallucinates: every number/text is derived from cached
// records only.
// ---------------------------------------------------------------------------

import type {
  GitHubAccount,
  GitHubCommit,
  GitHubRelease,
  GitHubRepository,
} from '../types';

export type GitHubRepoSummary = {
  fullName: string;
  language: string | null;
  stars: number;
  /** Latest commit message among this repo's cached commits, or null. */
  latestCommitMessage: string | null;
  latestCommitAt: string | null;
  commitCount: number;
  releaseCount: number;
  lastReleaseTag: string | null;
  /** Repo-level pushed date (from the repo record); null when unknown. */
  pushedAt: string | null;
};

export type GitHubInsights = {
  totalRepos: number;
  selectedRepos: number;
  totalCommits: number;
  totalReleases: number;
  /** Repos that have any cached activity, newest-first by pushed date. */
  activeRepos: GitHubRepoSummary[];
  /** Most recent release tag across all selected repos, or null. */
  mostRecentReleaseTag: string | null;
  mostRecentReleaseAt: string | null;
  /** True when there is at least one piece of cached activity to show. */
  hasActivity: boolean;
};

/** Builds deterministic insights from the local cache. */
export function buildGitHubInsights(input: {
  account: GitHubAccount;
  repositories: GitHubRepository[];
  commits: GitHubCommit[];
  releases: GitHubRelease[];
}): GitHubInsights {
  const selected = input.repositories.filter((r) => r.selected);

  const commitsByRepo = new Map<string, GitHubCommit[]>();
  for (const c of input.commits) {
    const list = commitsByRepo.get(c.repoId) ?? [];
    list.push(c);
    commitsByRepo.set(c.repoId, list);
  }

  const releasesByRepo = new Map<string, GitHubRelease[]>();
  for (const r of input.releases) {
    const list = releasesByRepo.get(r.repoId) ?? [];
    list.push(r);
    releasesByRepo.set(r.repoId, list);
  }

  let totalCommits = 0;
  let totalReleases = 0;
  const activeRepos: GitHubRepoSummary[] = [];

  for (const repo of selected) {
    const repoCommits = commitsByRepo.get(repo.id) ?? [];
    const repoReleases = releasesByRepo.get(repo.id) ?? [];
    totalCommits += repoCommits.length;
    totalReleases += repoReleases.length;

    const sorted = [...repoCommits].sort(byAuthorDateDesc);
    const latest = sorted[0] ?? null;
    const latestRelease = [...repoReleases].sort(byPublishedAtDesc)[0] ?? null;

    activeRepos.push({
      fullName: repo.fullName,
      language: repo.language,
      stars: repo.stars,
      latestCommitMessage: latest?.message ?? null,
      latestCommitAt: latest?.authorDate ?? null,
      commitCount: repoCommits.length,
      releaseCount: repoReleases.length,
      lastReleaseTag: latestRelease?.tagName ?? null,
      pushedAt: repo.pushedAt,
    });
  }

  // Newest-first by the most recent commit date (fall back to pushed date).
  activeRepos.sort(
    (a, b) =>
      cmp(b.latestCommitAt ?? b.pushedAt, null) - cmp(a.latestCommitAt ?? a.pushedAt, null)
  );

  const allReleases = [...input.releases].sort(byPublishedAtDesc);
  const mostRecent = allReleases[0] ?? null;

  return {
    totalRepos: input.repositories.length,
    selectedRepos: selected.length,
    totalCommits,
    totalReleases,
    activeRepos,
    mostRecentReleaseTag: mostRecent?.tagName ?? null,
    mostRecentReleaseAt: mostRecent?.publishedAt ?? null,
    hasActivity: totalCommits > 0 || totalReleases > 0 || selected.length > 0,
  };
}

function byAuthorDateDesc(a: GitHubCommit, b: GitHubCommit): number {
  return cmp(b.authorDate, a.authorDate);
}

function byPublishedAtDesc(a: GitHubRelease, b: GitHubRelease): number {
  return cmp(b.publishedAt, a.publishedAt);
}

/** Compare two nullable ISO strings, most-recent first; null sorts last. */
function cmp(a: string | null, b: string | null): number {
  const av = a ? Date.parse(a) : -Infinity;
  const bv = b ? Date.parse(b) : -Infinity;
  if (Number.isNaN(av)) return 1;
  if (Number.isNaN(bv)) return -1;
  return av - bv;
}
