import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

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

const REPO_OWNER = 'dagijosi';
const REPO_NAME = 'coding_coach';
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

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
  const currentVersion =
    Constants.expoConfig?.version ?? '1.0.0';

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CodingCoachApp',
      },
    });

    if (response.status === 404) {
      const defaultHtmlUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseName: 'No releases published yet',
        releaseNotes: 'You are running the latest version.',
        downloadUrl: null,
        changelogUrl: defaultHtmlUrl,
        publishedAt: null,
        htmlUrl: defaultHtmlUrl,
      };
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const tag = (data.tag_name || '').replace(/^v/, '');
    const latestVersion = tag || currentVersion;

    const apkAsset = Array.isArray(data.assets)
      ? data.assets.find((asset: { name?: string; browser_download_url?: string }) =>
          asset.name?.endsWith('.apk')
        )
      : null;

    const downloadUrl = apkAsset
      ? apkAsset.browser_download_url
      : data.html_url || `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;

    const htmlUrl = data.html_url || `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;
    const changelogUrl = extractChangelogUrl(data.body, htmlUrl);
    const releaseNotes = cleanReleaseNotes(data.body, latestVersion);
    const hasUpdate = isNewerVersion(latestVersion, currentVersion);

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

/**
 * Directly attempts to open the APK download URL or fallback URL.
 * Note: Linking.canOpenURL is intentionally avoided for standard web URLs
 * as it returns false on Android 11+ without explicit package queries.
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
 * Returns true if remote is strictly newer than current.
 */
export function isNewerVersion(remote: string, current: string): boolean {
  const parse = (v: string) =>
    v.replace(/^v/, '').split('.').map((segment) => {
      const n = parseInt(segment, 10);
      return Number.isNaN(n) ? 0 : n;
    });

  const rParts = parse(remote);
  const cParts = parse(current);
  const len = Math.max(rParts.length, cParts.length);

  for (let i = 0; i < len; i++) {
    const r = rParts[i] ?? 0;
    const c = cParts[i] ?? 0;
    if (r > c) return true;
    if (r < c) return false;
  }

  return false;
}

