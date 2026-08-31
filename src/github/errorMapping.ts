// ---------------------------------------------------------------------------
// GitHub integration — error mapping (Phase 8).
//
// PURE, dependency-free mapping of HTTP status codes + rate-limit metadata into
// the stable, user-safe GitHubErrorInfo used across the UI. No raw tokens or
// internal URLs are ever placed in the message.
// ---------------------------------------------------------------------------

import type { GitHubErrorInfo } from './types';
import type { RateLimitInfo } from './apiParser';

/**
 * Builds a user-facing error from an HTTP response status (and optional
 * rate-limit header info). A 401/403 with an exhausted rate limit is reported
 * as rate_limited; other 4xx are surfaced as bad credentials/unknown; 5xx and
 * network failures are retryable.
 */
export function errorFromStatus(
  status: number | null,
  rateLimit?: RateLimitInfo,
  isNetwork: boolean = false
): GitHubErrorInfo {
  if (isNetwork) {
    return {
      kind: 'network',
      message: 'Could not reach GitHub. Check your connection and try again.',
      retryable: true,
    };
  }

  if (rateLimit && rateLimit.remaining === 0 && rateLimit.resetAtSeconds != null) {
    return {
      kind: 'rate_limited',
      message: `GitHub API rate limit reached. Try again after ${formatReset(rateLimit.resetAtSeconds)}.`,
      retryable: true,
      rateLimitResetAt: rateLimit.resetAtSeconds,
    };
  }

  if (status === 401) {
    return {
      kind: 'bad_credentials',
      message:
        'GitHub rejected the saved access. Sign out and connect again, or use a new access token.',
      retryable: true,
    };
  }

  if (status === 403) {
    return {
      kind: 'rate_limited',
      message: 'GitHub is refusing this request. Please sync again later.',
      retryable: true,
      rateLimitResetAt: rateLimit?.resetAtSeconds ?? undefined,
    };
  }

  if (status !== null && status >= 500) {
    return {
      kind: 'network',
      message: 'GitHub is temporarily unavailable. Try again shortly.',
      retryable: true,
    };
  }

  return {
    kind: status === 404 || status === 422 ? 'unknown' : 'unknown',
    message:
      status === 404
        ? 'The requested GitHub resource could not be found.'
        : 'GitHub returned an unexpected response. Please try again.',
    retryable: status !== null && status < 500,
  };
}

/** Not-connected error used when no valid token is available for a sync. */
export function notConnectedError(): GitHubErrorInfo {
  return {
    kind: 'bad_credentials',
    message: 'No GitHub account is connected. Connect an account before syncing.',
    retryable: true,
  };
}

function formatReset(unixSeconds: number): string {
  try {
    const date = new Date(unixSeconds * 1000);
    return isNaN(date.getTime()) ? 'later' : date.toLocaleTimeString();
  } catch {
    return 'later';
  }
}
