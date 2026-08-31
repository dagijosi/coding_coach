// ---------------------------------------------------------------------------
// GitHub integration — configuration (Phase 8).
//
// Holds the GitHub OAuth device-flow configuration. Device flow is chosen over
// the authorization-code flow because it needs NO redirect URI and NO
// client_secret: it only requires the OAuth app's PUBLIC `client_id`, which is
// safe to embed in a mobile binary (it is not a secret). Tokens are exchanged
// and stored entirely on-device (see secureTokenStore.ts), so no backend is
// required.
//
// The `client_id` is app-specific and can NOT be fabricated: it must come from
// a GitHub OAuth App the maintainer registers with "Device flow" enabled. It is
// read from `expo-constants` `extra.githubClientId` (injected at build time via
// app.config `extra`), falling back to a placeholder. When the placeholder is
// detected, the connect flow reports `not_configured` and explains the required
// manual setup instead of pretending to authenticate.
// ---------------------------------------------------------------------------

import Constants from 'expo-constants';

const PLACEHOLDER_CLIENT_ID = 'REPLACE_WITH_GITHUB_OAUTH_CLIENT_ID';

/**
 * The public GitHub OAuth app client_id. Only ever read at runtime; never
 * written anywhere. A placeholder (not a real credential) means the feature is
 * not configured yet and connecting must fail with `not_configured`.
 */
export const GITHUB_CLIENT_ID: string =
  (Constants.expoConfig?.extra?.githubClientId as string | undefined) ??
  PLACEHOLDER_CLIENT_ID;

/** true when no real client_id has been wired up for this build. */
export const isGitHubConfigured = (): boolean =>
  GITHUB_CLIENT_ID.length > 0 && GITHUB_CLIENT_ID !== PLACEHOLDER_CLIENT_ID;

/**
 * Read-only OAuth scopes. `public_repo` gives read access to public
 * repositories (commits/releases); `read:user` gives read-only access to the
 * user's public profile for identifying the account. No write scopes, no
 * gist, no admin — kept minimal per the feature spec.
 */
export const GITHUB_SCOPES = 'public_repo read:user';

/**
 * GitHub device-flow endpoints (see docs.github.com "Authorizing OAuth apps" →
 * device flow). The token endpoint returns the access token *without* a
 * client_secret when the device-flow grant is used.
 */
export const GITHUB_API_BASE = 'https://api.github.com';
export const GITHUB_LOGIN_BASE = 'https://github.com/login';
export const GITHUB_DEVICE_CODE_PATH = `${GITHUB_LOGIN_BASE}/device/code`;
export const GITHUB_TOKEN_PATH = `${GITHUB_LOGIN_BASE}/oauth/access_token`;
export const GITHUB_DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';
