import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

export type ReleaseInfo = {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string | null;
  publishedAt: string | null;
  htmlUrl: string;
};

const REPO_OWNER = 'dagijosi';
const REPO_NAME = 'coding_coach';
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

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
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseName: 'No releases published yet',
        releaseNotes: '',
        downloadUrl: null,
        publishedAt: null,
        htmlUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`,
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

    const hasUpdate = isNewerVersion(latestVersion, currentVersion);

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseName: data.name || data.tag_name || `v${latestVersion}`,
      releaseNotes: data.body || 'New improvements and bug fixes.',
      downloadUrl,
      publishedAt: data.published_at || null,
      htmlUrl: data.html_url,
    };
  } catch (error) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseName: 'Unable to check updates',
      releaseNotes: error instanceof Error ? error.message : 'Network error',
      downloadUrl: null,
      publishedAt: null,
      htmlUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`,
    };
  }
}

export async function openDownloadUrl(url: string | null): Promise<void> {
  if (!url) return;
  const supported = await Linking.canOpenURL(url).catch(() => true);
  if (supported) {
    await Linking.openURL(url);
  }
}

/**
 * Compare two semver strings (e.g. "1.0.1" vs "1.0.0").
 * Returns true if remote is strictly newer than current.
 */
export function isNewerVersion(remote: string, current: string): boolean {
  const parse = (v: string) =>
    v.split('.').map((segment) => {
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
