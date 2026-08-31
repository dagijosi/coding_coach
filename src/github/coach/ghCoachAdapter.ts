// ---------------------------------------------------------------------------
// GitHub integration — coach adapter (Phase 8).
//
// PURE, dependency-free bridge that feeds the locally-cached GitHub activity
// into the existing offline Coach. It turns cached records into a short,
// deterministic, human-readable summary. It never fetches the network and never
// invents facts the cache does not contain. When there is no cached activity it
// returns a clear "connect / sync first" message instead of hallucinating.
// ---------------------------------------------------------------------------

import type {
  GitHubAccount,
  GitHubCommit,
  GitHubRelease,
  GitHubRepository,
} from '../types';
import { buildGitHubInsights, type GitHubInsights } from '../insights/ghInsights';

export type CoachGithubInput = {
  account: GitHubAccount | null;
  repositories: GitHubRepository[];
  commits: GitHubCommit[];
  releases: GitHubRelease[];
};

export type CoachGithubResult = {
  /** true when the learner is connected AND has selected repos. */
  available: boolean;
  /** true when at least one commit/release is cached and displayable. */
  hasActivity: boolean;
  /** The deterministic message for the coach to show. */
  message: string;
  insights: GitHubInsights | null;
};

/** Keywords that trigger the GitHub activity response in the coach. */
export const GITHUB_TRIGGER_WORDS = [
  'github',
  'repositor',
  'repo',
  'commit',
  'release',
  'releases',
  'pull request',
  'latest changes',
  'what did i push',
];

/** Whether a normalized (lowercased) message asks about GitHub activity. */
export function matchesGithubIntent(message: string): boolean {
  const text = message.trim().toLowerCase();
  return GITHUB_TRIGGER_WORDS.some((word) => text.includes(word));
}

/**
 * Builds the deterministic coach summary from the local cache. Returns
 * `available: false` with a helpful message when no account or no selected
 * repos exist yet; otherwise a factual summary of cached commits/releases.
 */
export function githubSummaryForCoach(input: CoachGithubInput): CoachGithubResult {
  const selected = input.repositories.filter((r) => r.selected);
  const hasAccount = input.account !== null;

  if (!hasAccount || selected.length === 0) {
    return {
      available: false,
      hasActivity: false,
      message: hasAccount
        ? "You haven't selected any GitHub repositories to track yet. Open GitHub in your account settings, pick repositories, and sync — then I can summarise your activity."
        : 'Connect a GitHub account (via the GitHub screen in your settings) and sync once. Then I can summarise your recent commits and releases offline.',
      insights: null,
    };
  }

  const insights = buildGitHubInsights({
    account: input.account!,
    repositories: input.repositories,
    commits: input.commits,
    releases: input.releases,
  });

  if (!insights.hasActivity && insights.totalCommits === 0 && insights.totalReleases === 0) {
    return {
      available: true,
      hasActivity: false,
      message:
        'Your GitHub is connected, but there is no cached activity yet. Run "Sync now" on the GitHub screen to pull your recent commits and releases.',
      insights,
    };
  }

  const lines: string[] = [];
  if (insights.totalCommits > 0) {
    lines.push(`You have ${insights.totalCommits} recent commit${insights.totalCommits === 1 ? '' : 's'} across ${insights.activeRepos.length} repo${insights.activeRepos.length === 1 ? '' : 's'}.`);
  }
  if (insights.totalReleases > 0) {
    lines.push(`You have ${insights.totalReleases} recent release${insights.totalReleases === 1 ? '' : 's'}.`);
  }

  for (const repo of insights.activeRepos.slice(0, 3)) {
    const parts: string[] = [repo.fullName];
    if (repo.commitCount > 0) {
      parts.push(`${repo.commitCount} commits`);
    }
    if (repo.releaseCount > 0) {
      parts.push(`${repo.releaseCount} release${repo.releaseCount === 1 ? '' : 's'}`);
    }
    lines.push(`\u2022 ${parts.join(' \u00b7 ')}${repo.latestCommitMessage ? ` \u2014 "${firstLine(repo.latestCommitMessage)}"` : ''}`);
  }

  if (insights.mostRecentReleaseTag) {
    lines.push(
      `Latest release: ${insights.mostRecentReleaseTag}${insights.mostRecentReleaseAt ? ` (${formatDate(insights.mostRecentReleaseAt)})` : ''}`
    );
  }

  lines.push('This is from your last offline sync. Open GitHub to refresh it.');

  return {
    available: true,
    hasActivity: true,
    message: `Here is a snapshot of your GitHub activity:\n\n${lines.map((l) => `- ${l}`).join('\n')}`,
    insights,
  };
}

function firstLine(message: string): string {
  const idx = message.indexOf('\n');
  return (idx === -1 ? message : message.slice(0, idx)).trim();
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  } catch {
    return '';
  }
}
