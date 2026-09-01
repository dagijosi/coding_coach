import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { AppState, type AppStateStatus, Platform } from 'react-native';

export type ReleaseInfo = {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string | null;
  changelogUrl: string;
  publishedAt: string | null;
  htmlUrl: string;
};

export type DownloadProgress = {
  percent: number; // 0 to 1
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  formattedProgress: string; // e.g. "12.4 MB / 52.8 MB (23%)"
  isPaused?: boolean;
};

export type DownloadProgressCallback = (progress: DownloadProgress) => void;

const REPO_OWNER = 'dagijosi';
const REPO_NAME = 'coding_coach';
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
const LOCAL_APK_NAME = 'coding-coach-update.apk';

let activeDownload: FileSystem.DownloadResumable | null = null;
let lastProgressCallback: DownloadProgressCallback | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let lastDownloadUrl: string | null = null;
let isManuallyPaused = false;

/**
 * Returns the current runtime app version declared in app.config.ts / Constants.
 */
export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.7';
}

/**
 * Parses and cleans release notes so users see readable change summaries
 * instead of raw GitHub compare links or verbose PR URLs.
 */
export function cleanReleaseNotes(body: string | undefined | null, latestVersion: string): string {
  if (!body || typeof body !== 'string') {
    return '• Bug fixes and performance improvements\n• Stability and UI enhancements';
  }

  // Remove the compare link line from the notes
  let cleaned = body
    .replace(/\*\*Full Changelog\*\*:\s*https?:\/\/[^\s]+/gi, '')
    .replace(/https?:\/\/github\.com\/[^\s]+\/compare\/[^\s\)]+/gi, '')
    .replace(/\[Full Changelog\]\(https?:\/\/[^\s\)]+\)/gi, '')
    .trim();

  // If there are PR entries like "* fix: foo in https://github.com/..." clean up the URL part
  cleaned = cleaned.replace(/\s+in\s+https?:\/\/github\.com\/[^\s]+/gi, '');

  // Convert markdown header "## What's Changed" -> "What's Changed:"
  cleaned = cleaned.replace(/^#+\s*(.+)$/gm, '$1:');

  // Convert markdown bullets "* " to bullet points "• "
  cleaned = cleaned.replace(/^(\s*)\*\s+/gm, '$1• ');

  // Collapse multiple empty lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  // If the notes are empty or only punctuation after removing compare links, provide sensible summary
  if (!cleaned || cleaned === ':' || cleaned.toLowerCase() === "what's changed:") {
    return `• Bug fixes and performance improvements\n• Stability and UI enhancements\n• Updates for v${latestVersion}`;
  }

  return cleaned;
}

/**
 * Extracts compare/changelog URL from body or falls back to release HTML URL.
 */
export function extractChangelogUrl(body: string | undefined | null, htmlUrl: string): string {
  if (body) {
    const match = body.match(/https?:\/\/github\.com\/[^\s]+\/compare\/[^\s\)]+/i);
    if (match && match[0]) {
      return match[0].replace(/[\)\.\,\;]+$/, '');
    }
  }
  return htmlUrl;
}

export async function checkAppUpdates(): Promise<ReleaseInfo> {
  const currentVersion = getCurrentAppVersion();

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CodingCoachApp',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const data = await response.json();
    const tagName: string = data.tag_name || '';
    const latestVersion = tagName.replace(/^v/i, '').trim();

    const hasUpdate = isNewerVersion(latestVersion, currentVersion);

    // Look for APK asset in the release
    let downloadUrl: string | null = null;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const apkAsset = data.assets.find(
        (asset: { name?: string; browser_download_url?: string }) =>
          typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.apk')
      );
      if (apkAsset?.browser_download_url) {
        downloadUrl = apkAsset.browser_download_url;
      }
    }

    const htmlUrl = data.html_url || `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;
    const changelogUrl = extractChangelogUrl(data.body, htmlUrl);
    const releaseNotes = cleanReleaseNotes(data.body, latestVersion);

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseName: data.name || data.tag_name || `v${latestVersion}`,
      releaseNotes,
      downloadUrl,
      changelogUrl,
      publishedAt: data.published_at || null,
      htmlUrl,
    };
  } catch (error) {
    const defaultHtmlUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseName: 'Unable to check updates',
      releaseNotes: error instanceof Error ? error.message : 'Network error',
      downloadUrl: null,
      changelogUrl: defaultHtmlUrl,
      publishedAt: null,
      htmlUrl: defaultHtmlUrl,
    };
  }
}

function handleProgressEvent(dp: FileSystem.DownloadProgressData) {
  const progress =
    dp.totalBytesExpectedToWrite > 0
      ? dp.totalBytesWritten / dp.totalBytesExpectedToWrite
      : 0;

  const writtenMb = (dp.totalBytesWritten / (1024 * 1024)).toFixed(1);
  const totalMb =
    dp.totalBytesExpectedToWrite > 0
      ? (dp.totalBytesExpectedToWrite / (1024 * 1024)).toFixed(1)
      : '?';

  const percent = Math.min(1, Math.max(0, progress));

  lastProgressCallback?.({
    percent,
    totalBytesWritten: dp.totalBytesWritten,
    totalBytesExpectedToWrite: dp.totalBytesExpectedToWrite,
    formattedProgress: `${writtenMb} MB / ${totalMb} MB (${Math.round(percent * 100)}%)`,
    isPaused: isManuallyPaused,
  });
}

function setupAppStateListener() {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
    if (nextState === 'background' || nextState === 'inactive') {
      // Pause download gracefully when app is backgrounded so state is saved
      if (activeDownload && !isManuallyPaused) {
        try {
          await activeDownload.pauseAsync();
        } catch {
          // Ignore background pause errors
        }
      }
    } else if (nextState === 'active') {
      // Auto-resume download when app returns to foreground
      if (activeDownload && !isManuallyPaused) {
        try {
          const result = await activeDownload.resumeAsync();
          if (result && result.uri) {
            await installDownloadedApk(result.uri);
          }
        } catch {
          // Will be retried on next user interaction
        }
      }
    }
  });
}

/**
 * Downloads the APK directly inside the app with resumable progress updates,
 * persisting byte offsets across app minimizes, then triggers Android native package installer.
 */
export async function downloadAndInstallApk(
  downloadUrl: string,
  onProgress?: DownloadProgressCallback
): Promise<{ success: boolean; error?: string }> {
  try {
    lastProgressCallback = onProgress ?? null;
    lastDownloadUrl = downloadUrl;
    isManuallyPaused = false;
    setupAppStateListener();

    const localUri = `${FileSystem.documentDirectory}${LOCAL_APK_NAME}`;

    // If an active resumable download for the same URL exists, resume it!
    if (activeDownload) {
      const result = await activeDownload.resumeAsync();
      if (!result || !result.uri) {
        throw new Error('APK download was interrupted.');
      }
      return await installDownloadedApk(result.uri);
    }

    activeDownload = FileSystem.createDownloadResumable(
      downloadUrl,
      localUri,
      {},
      handleProgressEvent
    );

    const result = await activeDownload.downloadAsync();
    if (!result || !result.uri) {
      throw new Error('APK download was interrupted.');
    }

    // Launch Android Package Installer
    return await installDownloadedApk(result.uri);
  } catch (error) {
    console.error('[updateService] Download or install failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unable to complete update download.',
    };
  } finally {
    activeDownload = null;
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
  }
}

/**
 * Manually pauses active in-app download without losing progress.
 */
export async function pauseActiveDownload(): Promise<void> {
  isManuallyPaused = true;
  if (activeDownload) {
    try {
      await activeDownload.pauseAsync();
    } catch (e) {
      console.warn('[updateService] Pause failed:', e);
    }
  }
}

/**
 * Manually resumes active in-app download from where it was paused.
 */
export async function resumeActiveDownload(
  onProgress?: DownloadProgressCallback
): Promise<{ success: boolean; error?: string }> {
  if (!activeDownload && lastDownloadUrl) {
    return downloadAndInstallApk(lastDownloadUrl, onProgress);
  }

  if (activeDownload) {
    isManuallyPaused = false;
    lastProgressCallback = onProgress ?? lastProgressCallback;
    try {
      const result = await activeDownload.resumeAsync();
      if (result?.uri) {
        return await installDownloadedApk(result.uri);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resume download.',
      };
    }
  }

  return { success: false, error: 'No active download to resume.' };
}

/**
 * Launches the native Android package installer for a local file URI.
 */
export async function installDownloadedApk(
  fileUri?: string
): Promise<{ success: boolean; error?: string }> {
  const targetUri = fileUri ?? `${FileSystem.documentDirectory}${LOCAL_APK_NAME}`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(targetUri);
    if (!fileInfo.exists) {
      return { success: false, error: 'Downloaded update file not found.' };
    }

    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(targetUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      });
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('[updateService] Failed to launch installer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Could not launch package installer.',
    };
  }
}

/**
 * Downloads via Android System Notification Tray / Browser.
 * This runs completely in the background via Android OS Download Manager,
 * allowing the user to close the app or use other apps freely.
 */
export async function openDownloadUrl(url: string | null, fallbackUrl?: string | null): Promise<boolean> {
  const target = url || fallbackUrl;
  if (!target) return false;

  try {
    await Linking.openURL(target);
    return true;
  } catch (error) {
    console.warn('[updateService] Linking.openURL failed for target:', target, error);
    if (fallbackUrl && fallbackUrl !== target) {
      try {
        await Linking.openURL(fallbackUrl);
        return true;
      } catch (fallbackError) {
        console.error('[updateService] Linking.openURL failed for fallback:', fallbackUrl, fallbackError);
      }
    }
    return false;
  }
}

/**
 * Compare two semver strings (e.g. "1.0.1" vs "1.0.0").
 */
export function isNewerVersion(latest: string, current: string): boolean {
  const parseParts = (v: string): number[] => {
    return v
      .replace(/^v/i, '')
      .split('.')
      .map((part) => {
        const n = parseInt(part, 10);
        return isNaN(n) ? 0 : n;
      });
  };

  const lParts = parseParts(latest);
  const cParts = parseParts(current);

  const len = Math.max(lParts.length, cParts.length);
  for (let i = 0; i < len; i++) {
    const l = lParts[i] ?? 0;
    const c = cParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}
