// ---------------------------------------------------------------------------
// GitHub integration — public entry point (Phase 8).
//
// A convenience barrel for the GitHub feature. The application service
// (githubService) is the primary surface for the UI and Coach; the pure modules
// remain individually importable for testing. Nothing in here touches the
// GitHub API or SQLite directly.
// ---------------------------------------------------------------------------

export {
  buildGitHubInsights,
  type GitHubInsights,
} from './insights/ghInsights';
export {
  githubSummaryForCoach,
  matchesGithubIntent,
  type CoachGithubInput,
  type CoachGithubResult,
} from './coach/ghCoachAdapter';
export {
  parseDeviceCodeResponse,
  parseTokenPollResponse,
  mapTokenPollError,
  type DeviceCode,
  type TokenPollResult,
} from './deviceFlow';
export {
  parseUser,
  parseRepository,
  parseCommit,
  parseRelease,
  parseRateLimit,
  type GitHubUserJson,
  type GitHubRepoJson,
  type GitHubCommitJson,
  type GitHubReleaseJson,
  type RateLimitInfo,
} from './apiParser';

// The application service is imported wholesale to avoid circular deps.
import * as githubService from './githubService';
export default githubService;
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
