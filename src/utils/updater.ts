import { APP_BUILD_NUMBER, APP_VERSION, GITHUB_REPO } from '../version';

export interface UpdateCheckResult {
  checked: boolean;
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  latestBuildNumber: number;
  apkDownloadUrl: string;
  releasePageUrl: string;
  releaseNotes: string;
  error?: string;
}

/**
 * Compares two version strings like "1.0.2" and "1.0.1"
 * Returns 1 if a > b, -1 if a < b, 0 if equal
 */
export function compareVersions(a: string, b: string): number {
  const cleanA = a.replace(/^v/i, '').trim().split('.').map((n) => parseInt(n, 10) || 0);
  const cleanB = b.replace(/^v/i, '').trim().split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(cleanA.length, cleanB.length);
  for (let i = 0; i < len; i++) {
    const valA = cleanA[i] || 0;
    const valB = cleanB[i] || 0;
    if (valA > valB) return 1;
    if (valA < valB) return -1;
  }
  return 0;
}

/**
 * Checks GitHub Releases API for a newer APK release
 */
export async function checkGitHubReleaseUpdate(
  customRepo?: string
): Promise<UpdateCheckResult> {
  const repo = (customRepo || GITHUB_REPO || '').trim();
  const fallbackResult: UpdateCheckResult = {
    checked: false,
    hasUpdate: false,
    currentVersion: APP_VERSION,
    latestVersion: APP_VERSION,
    latestBuildNumber: APP_BUILD_NUMBER,
    apkDownloadUrl: '',
    releasePageUrl: repo ? `https://github.com/${repo}/releases` : '',
    releaseNotes: '',
  };

  if (!repo || !repo.includes('/')) {
    return fallbackResult;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        ...fallbackResult,
        checked: true,
      };
    }

    const data = await response.json();
    const rawTag: string = data.tag_name || data.name || '';
    const latestVersion = rawTag.replace(/^v/i, '').trim() || APP_VERSION;
    const parts = latestVersion.split('.');
    const latestBuildNumber = parseInt(parts[parts.length - 1], 10) || APP_BUILD_NUMBER;

    // খুঁজে দেখা হচ্ছে রিলিজে .apk ফাইল যুক্ত আছে কিনা
    let apkDownloadUrl = '';
    if (Array.isArray(data.assets)) {
      const apkAsset = data.assets.find(
        (asset: { name?: string; browser_download_url?: string }) =>
          asset.name && asset.name.toLowerCase().endsWith('.apk')
      );
      if (apkAsset && apkAsset.browser_download_url) {
        apkDownloadUrl = apkAsset.browser_download_url;
      }
    }

    const releasePageUrl = data.html_url || `https://github.com/${repo}/releases/latest`;
    if (!apkDownloadUrl) {
      apkDownloadUrl = releasePageUrl;
    }

    const hasUpdate =
      compareVersions(latestVersion, APP_VERSION) > 0 ||
      latestBuildNumber > APP_BUILD_NUMBER;

    return {
      checked: true,
      hasUpdate,
      currentVersion: APP_VERSION,
      latestVersion,
      latestBuildNumber,
      apkDownloadUrl,
      releasePageUrl,
      releaseNotes: data.body || 'নতুন সংস্করণে পারফরম্যান্স ও ফিচার উন্নত করা হয়েছে।',
    };
  } catch {
    return {
      ...fallbackResult,
      error: 'ইন্টারনেট সংযোগ পাওয়া যায়নি (অফলাইন মোড)',
    };
  }
}
