// ---------------------------------------------------------------------------
// GitHub integration — OAuth device-flow parsing (Phase 8).
//
// PURE, dependency-free state machine for the GitHub OAuth device flow
// (RFC 8628). It parses the device-code response and token-poll responses so
// the network layer stays a thin I/O wrapper while every decision is
// deterministic and unit-testable.
//
// Flow:
//   1. POST /login/device/code  (client_id, scope)
//        -> { device_code, user_code, verification_uri, expires_in, interval }
//   2. User opens verification_uri and enters user_code (we show both).
//   3. Poll POST /login/oauth/access_token (client_id, device_code, grant_type)
//        -> 200 with access_token (+ optional refresh_token)
//        -> 400 with { error: 'authorization_pending' | 'slow_down' | ... }
// ---------------------------------------------------------------------------

export type DeviceCode = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string | null;
  expiresInSeconds: number;
  /** Polling interval in seconds (per RFC 8628). */
  intervalSeconds: number;
};

/** Result of a single token-poll. */
export type TokenPollResult =
  | { status: 'success'; accessToken: string; refreshToken: string | null; expiresInSeconds: number | null }
  | { status: 'authorization_pending' }
  | { status: 'slow_down'; nextIntervalSeconds: number }
  | { status: 'access_denied' }
  | { status: 'expired_token' }
  | { status: 'device_flow_disabled' }
  | { status: 'bad_credentials' }
  | { status: 'error'; message: string };

/** Unknown device-flow error strings map to these stable kinds. */
export type DeviceFlowErrorKind =
  | 'authorization_pending'
  | 'slow_down'
  | 'access_denied'
  | 'expired_token'
  | 'device_flow_disabled'
  | 'bad_credentials'
  | 'unknown';

/** Marks a field optional-tolerant so callers can feed raw JSON directly. */
export type DeviceCodeResponseLike = {
  device_code?: unknown;
  user_code?: unknown;
  verification_uri?: unknown;
  verification_uri_complete?: unknown;
  expires_in?: unknown;
  interval?: unknown;
};

/** Parses the POST /login/device/code response body into a DeviceCode. */
export function parseDeviceCodeResponse(
  json: DeviceCodeResponseLike
): { ok: true; device: DeviceCode } | { ok: false; reason: string } {
  const deviceCode = json.device_code;
  const userCode = json.user_code;
  const verificationUri = json.verification_uri;
  if (
    typeof deviceCode !== 'string' ||
    deviceCode.length === 0 ||
    typeof userCode !== 'string' ||
    userCode.length === 0 ||
    typeof verificationUri !== 'string' ||
    verificationUri.length === 0
  ) {
    return {
      ok: false,
      reason: 'GitHub did not return a usable device code. Check that the OAuth app has Device Flow enabled.',
    };
  }

  return {
    ok: true,
    device: {
      deviceCode,
      userCode,
      verificationUri,
      verificationUriComplete:
        typeof json.verification_uri_complete === 'string'
          ? json.verification_uri_complete
          : null,
      expiresInSeconds: toNumber(json.expires_in, 900),
      intervalSeconds: toNumber(json.interval, 5),
    },
  };
}

/** Maps a GitHub token-poll error code to a stable TokenPollResult. */
export function mapTokenPollError(error: string | unknown): TokenPollResult {
  if (error === 'authorization_pending') {
    return { status: 'authorization_pending' };
  }
  if (error === 'slow_down') {
    return { status: 'slow_down', nextIntervalSeconds: 5 };
  }
  if (error === 'access_denied') {
    return { status: 'access_denied' };
  }
  if (error === 'expired_token') {
    return { status: 'expired_token' };
  }
  if (error === 'device_flow_disabled') {
    return { status: 'device_flow_disabled' };
  }
  if (error === 'incorrect_client_credentials' || error === 'incorrect_device_code') {
    return { status: 'bad_credentials' };
  }
  return { status: 'error', message: String(error) };
}

/** Parses the POST /login/oauth/access_token response body. */
export function parseTokenPollResponse(
  json: Record<string, unknown>
): TokenPollResult {
  const accessToken = json.access_token;
  if (typeof accessToken === 'string' && accessToken.length > 0) {
    const refreshToken =
      typeof json.refresh_token === 'string' && json.refresh_token.length > 0
        ? json.refresh_token
        : null;
    return {
      status: 'success',
      accessToken,
      refreshToken,
      expiresInSeconds:
        typeof json.expires_in === 'number' ? json.expires_in : null,
    };
  }

  if (json.error !== undefined) {
    return mapTokenPollError(json.error);
  }

  if (json.error_description !== undefined) {
    return { status: 'error', message: String(json.error_description) };
  }

  return { status: 'error', message: 'GitHub returned an unexpected token response.' };
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}
