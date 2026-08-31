// ---------------------------------------------------------------------------
// GitHub integration — secure token storage (Phase 8).
//
// The ONLY place OAuth credentials live. Access/refresh tokens are stored in
// the OS-secure keychain via expo-secure-store — never in SQLite, AsyncStorage,
// source code, or anywhere that can be trivially extracted from the install.
//
// The token payload is a JSON string in one SecureStore key. Keeping it in a
// single keychain entry is sufficient for the ~tens-of-bytes payload we hold
// (well under the ~2KB iOS keychain limit noted in the Expo docs) and avoids
// leaking per-field keys.
// ---------------------------------------------------------------------------

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'codingcoach.github.credentials';
/**
 * `WHEN_UNLOCKED_THIS_DEVICE_ONLY` keeps the secret readable while the device
 * is unlocked and prevents it migrating to another device via backup/restore.
 */
const ACCESSIBLE = SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;

/** Secrets as held in the keychain (opaque strings; never logged). */
export type StoredGitHubCredentials = {
  accessToken: string;
  /** Present when the GitHub app is configured with expiring access tokens. */
  refreshToken?: string;
  /** Unix seconds when the access token expires (only when expiring). */
  expiresAt?: number;
  /** The login this token belongs to (for sanity checks, not sensitive). */
  login: string;
};

/**
 * Persists the credentials to the OS keychain. Rejects on failure so the
 * caller can surface a security-safe error rather than silently proceeding
 * unauthenticated.
 */
export async function saveGitHubCredentials(
  creds: StoredGitHubCredentials
): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(creds), {
    keychainAccessible: ACCESSIBLE,
  });
}

/**
 * Reads credentials from the keychain, or null when none are stored / they
 * were invalidated. Invalid JSON is treated as absent (and cleared).
 */
export async function loadGitHubCredentials(): Promise<StoredGitHubCredentials | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY, {
    keychainAccessible: ACCESSIBLE,
  });
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StoredGitHubCredentials;
    if (!parsed.accessToken) {
      return null;
    }
    return parsed;
  } catch {
    // Corrupt payload — drop it to avoid surfacing garbage.
    await clearGitHubCredentials();
    return null;
  }
}

/** Removes credentials from the keychain (disconnect / sign out). */
export async function clearGitHubCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {
    // Best effort; a missing key is already a cleared state.
  });
}

/**
 * Returns true when an unexpired access token is available. A token is
 * considered valid offline (sync only actually needs the network), so this
 * only dictates whether the account appears "connected".
 */
export async function hasValidToken(now = new Date()): Promise<boolean> {
  const creds = await loadGitHubCredentials();
  if (!creds) {
    return false;
  }
  if (creds.expiresAt !== undefined && Date.now() <= creds.expiresAt * 1000) {
    return true;
  }
  // No expiry recorded (non-expiring tokens) => treat as valid.
  return creds.expiresAt === undefined || Date.now() <= creds.expiresAt * 1000;
}
