// ---------------------------------------------------------------------------
// GitHub integration — GitHub API service (Phase 8).
//
// Thin network I/O layer over the GitHub REST API + OAuth device-flow endpoints.
// It owns ONLY: composing HTTP requests, reading the stored token from the
// secure store, parsing responses through the pure apiParser/deviceFlow modules,
// and surfacing normalized errors. It never talks to SQLite and never caches —
// the sync service is responsible for persistence.
// ---------------------------------------------------------------------------

import {
  GITHUB_API_BASE,
  GITHUB_CLIENT_ID,
  GITHUB_DEVICE_CODE_PATH,
  GITHUB_DEVICE_GRANT,
  GITHUB_SCOPES,
  GITHUB_TOKEN_PATH,
  isGitHubConfigured,
} from '../config';
import { loadGitHubCredentials } from '../secureTokenStore';
import {
  parseCommit,
  parseRateLimit,
  parseRelease,
  parseRepository,
  parseUser,
  type GitHubCommitJson,
  type GitHubReleaseJson,
  type GitHubRepoJson,
  type GitHubUserJson,
  type RateLimitInfo,
} from '../apiParser';
import {
  parseDeviceCodeResponse,
  parseTokenPollResponse,
  type DeviceCode,
  type TokenPollResult,
} from '../deviceFlow';
import { errorFromStatus, notConnectedError } from '../errorMapping';
import type {
  GitHubAccount,
  GitHubCommit,
  GitHubErrorInfo,
  GitHubRelease,
  GitHubRepository,
} from '../types';

const ACCEPT_JSON = 'application/vnd.github+json';
const X_GITHUB_API_VERSION = '2022-11-28';

export type ApiCall<T> = { ok: true; data: T; rateLimit: RateLimitInfo } | { ok: false; error: GitHubErrorInfo; rateLimit: RateLimitInfo };

async function rawRequest(
  url: string,
  init: RequestInit = {},
  token: string | null
): Promise<{ status: number; body: unknown; rateLimit: RateLimitInfo }> {
  const headers: Record<string, string> = {
    Accept: ACCEPT_JSON,
    'X-GitHub-Api-Version': X_GITHUB_API_VERSION,
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(url, { ...init, headers });
  const rateLimit = parseRateLimit({
    'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining') ?? undefined,
    'x-ratelimit-reset': response.headers.get('x-ratelimit-reset') ?? undefined,
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { status: response.status, body, rateLimit };
}

async function authCall<T>(
  build: (token: string) => Promise<ApiCall<T>>,
  token: string | null
): Promise<ApiCall<T>> {
  const result = await build(token ?? '');
  return result;
}

// ---------------------------------------------------------------------------
// OAuth device flow
// ---------------------------------------------------------------------------

export type DeviceStartResult =
  | { status: 'success'; device: DeviceCode }
  | { status: 'not_configured'; error: GitHubErrorInfo }
  | { status: 'error'; error: GitHubErrorInfo };

/** Requests the device + user code from GitHub for the device-flow sign-in. */
export async function startDeviceFlow(): Promise<DeviceStartResult> {
  if (!isGitHubConfigured()) {
    return {
      status: 'not_configured',
      error: {
        kind: 'not_configured',
        message:
          'GitHub is not configured for this build. A maintainer must register a GitHub OAuth App with Device Flow enabled and set its public client_id (see the "Connect GitHub" help screen).',
        retryable: false,
      },
    };
  }

  try {
    const response = await fetch(GITHUB_DEVICE_CODE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: GITHUB_CLIENT_ID, scope: GITHUB_SCOPES }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.status !== 200) {
      return {
        status: 'error',
        error: errorFromStatus(response.status, undefined, false),
      };
    }
    const parsed = parseDeviceCodeResponse(body as Record<string, unknown>);
    if (!parsed.ok) {
      return {
        status: 'error',
        error: { kind: 'device_flow', message: parsed.reason, retryable: true },
      };
    }
    return { status: 'success', device: parsed.device };
  } catch {
    return {
      status: 'error',
      error: errorFromStatus(null, undefined, true),
    };
  }
}

/**
 * Polls GitHub for the access token after the user completes the device flow.
 * Should be called repeatedly at the device's `intervalSeconds`; only a
 * `success` result persists credentials.
 */
export async function pollDeviceToken(
  deviceCode: string
): Promise<TokenPollResult> {
  try {
    const response = await fetch(GITHUB_TOKEN_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: GITHUB_DEVICE_GRANT,
      }),
    });
    const body = await response.json().catch(() => ({}));
    return parseTokenPollResponse(body as Record<string, unknown>);
  } catch {
    return { status: 'error', message: 'Network error while reaching GitHub.' };
  }
}

/** Refresh an expiring access token using a stored refresh token. */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenPollResult> {
  try {
    const response = await fetch(GITHUB_TOKEN_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    const body = await response.json().catch(() => ({}));
    return parseTokenPollResponse(body as Record<string, unknown>);
  } catch {
    return { status: 'error', message: 'Network error while refreshing access.' };
  }
}

// ---------------------------------------------------------------------------
// API resources (read-only)
// ---------------------------------------------------------------------------

export async function fetchCurrentUser(scopes: string[]): Promise<ApiCall<GitHubAccount>> {
  const token = (await loadGitHubCredentials())?.accessToken ?? null;
  if (!token) {
    return { ok: false, error: notConnectedError(), rateLimit: { remaining: null, resetAtSeconds: null } };
  }

  try {
    const { status, body, rateLimit } = await rawRequest(
      `${GITHUB_API_BASE}/user`,
      { method: 'GET' },
      token
    );
    if (status !== 200) {
      return { ok: false, error: errorFromStatus(status, rateLimit), rateLimit };
    }
    const account = parseUser(body as GitHubUserJson, scopes, new Date().toISOString());
    return { ok: true, data: account, rateLimit };
  } catch {
    return {
      ok: false,
      error: errorFromStatus(null, undefined, true),
      rateLimit: { remaining: null, resetAtSeconds: null },
    };
  }
}

export async function fetchRepositories(): Promise<ApiCall<GitHubRepository[]>> {
  const token = (await loadGitHubCredentials())?.accessToken ?? null;
  if (!token) {
    return { ok: false, error: notConnectedError(), rateLimit: { remaining: null, resetAtSeconds: null } };
  }

  try {
    const { status, body, rateLimit } = await rawRequest(
      `${GITHUB_API_BASE}/user/repos?per_page=100&sort=updated`,
      { method: 'GET' },
      token
    );
    if (status !== 200) {
      return { ok: false, error: errorFromStatus(status, rateLimit), rateLimit };
    }
    const list = Array.isArray(body) ? (body as GitHubRepoJson[]) : [];
    return { ok: true, data: list.map(parseRepository), rateLimit };
  } catch {
    return {
      ok: false,
      error: errorFromStatus(null, undefined, true),
      rateLimit: { remaining: null, resetAtSeconds: null },
    };
  }
}

export async function fetchCommits(
  fullName: string,
  perPage: number
): Promise<ApiCall<GitHubCommit[]>> {
  const token = (await loadGitHubCredentials())?.accessToken ?? null;
  if (!token) {
    return { ok: false, error: notConnectedError(), rateLimit: { remaining: null, resetAtSeconds: null } };
  }

  try {
    const encoded = encodeURIComponent(fullName);
    const { status, body, rateLimit } = await rawRequest(
      `${GITHUB_API_BASE}/repos/${encoded}/commits?per_page=${perPage}`,
      { method: 'GET' },
      token
    );
    if (status !== 200) {
      return { ok: false, error: errorFromStatus(status, rateLimit), rateLimit };
    }
    const syncedAt = new Date().toISOString();
    const list = Array.isArray(body) ? (body as GitHubCommitJson[]) : [];
    return {
      ok: true,
      data: list.map((c) => parseCommit(c, fullName, syncedAt)),
      rateLimit,
    };
  } catch {
    return {
      ok: false,
      error: errorFromStatus(null, undefined, true),
      rateLimit: { remaining: null, resetAtSeconds: null },
    };
  }
}

export async function fetchReleases(
  fullName: string,
  perPage: number
): Promise<ApiCall<GitHubRelease[]>> {
  const token = (await loadGitHubCredentials())?.accessToken ?? null;
  if (!token) {
    return { ok: false, error: notConnectedError(), rateLimit: { remaining: null, resetAtSeconds: null } };
  }

  try {
    const encoded = encodeURIComponent(fullName);
    const { status, body, rateLimit } = await rawRequest(
      `${GITHUB_API_BASE}/repos/${encoded}/releases?per_page=${perPage}`,
      { method: 'GET' },
      token
    );
    if (status !== 200) {
      return { ok: false, error: errorFromStatus(status, rateLimit), rateLimit };
    }
    const syncedAt = new Date().toISOString();
    const list = Array.isArray(body) ? (body as GitHubReleaseJson[]) : [];
    return {
      ok: true,
      data: list.map((r) => parseRelease(r, fullName, syncedAt)),
      rateLimit,
    };
  } catch {
    return {
      ok: false,
      error: errorFromStatus(null, undefined, true),
      rateLimit: { remaining: null, resetAtSeconds: null },
    };
  }
}
