/**
 * Update Service Logic Smoke Test
 * Tests release notes cleaning, compare URL extraction, and semver comparison.
 */

function cleanReleaseNotes(body, latestVersion) {
  if (!body || typeof body !== 'string') {
    return '• Bug fixes and performance improvements\n• Stability and UI enhancements';
  }

  let cleaned = body
    .replace(/\*\*Full Changelog\*\*:\s*https?:\/\/[^\s]+/gi, '')
    .replace(/https?:\/\/github\.com\/[^\s]+\/compare\/[^\s\)]+/gi, '')
    .replace(/\[Full Changelog\]\(https?:\/\/[^\s\)]+\)/gi, '')
    .trim();

  cleaned = cleaned.replace(/\s+in\s+https?:\/\/github\.com\/[^\s]+/gi, '');
  cleaned = cleaned.replace(/^#+\s*(.+)$/gm, '$1:');
  cleaned = cleaned.replace(/^(\s*)\*\s+/gm, '$1• ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  if (!cleaned || cleaned === ':' || cleaned.toLowerCase() === "what's changed:") {
    return `• Bug fixes and performance improvements\n• Stability and UI enhancements\n• Updates for v${latestVersion}`;
  }

  return cleaned;
}

function extractChangelogUrl(body, htmlUrl) {
  if (body) {
    const match = body.match(/https?:\/\/github\.com\/[^\s]+\/compare\/[^\s\)]+/i);
    if (match && match[0]) {
      return match[0].replace(/[\)\.\,\;]+$/, '');
    }
  }
  return htmlUrl;
}

function isNewerVersion(remote, current) {
  const parse = (v) =>
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

let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed++;
  console.error(`  ✗ FAIL: ${name} (${detail})`);
}

console.log('\nUpdate Service & Release Notes parser smoke test');

// Test isNewerVersion
if (isNewerVersion('1.0.1', '1.0.0') === true) ok('1.0.1 is newer than 1.0.0'); else fail('1.0.1 newer');
if (isNewerVersion('1.1.0', '1.0.9') === true) ok('1.1.0 is newer than 1.0.9'); else fail('1.1.0 newer');
if (isNewerVersion('v1.0.2', '1.0.1') === true) ok('v1.0.2 is newer than 1.0.1'); else fail('v1.0.2 newer');
if (isNewerVersion('1.0.0', '1.0.0') === false) ok('1.0.0 is not newer than 1.0.0'); else fail('same version not newer');
if (isNewerVersion('1.0.0', '1.0.1') === false) ok('1.0.0 is not newer than 1.0.1'); else fail('older version not newer');

// Test cleanReleaseNotes with raw compare link (GitHub's default auto-notes without PRs)
const rawCompareOnly = '**Full Changelog**: https://github.com/dagijosi/coding_coach/compare/v1.0.0...v1.0.1';
const cleanedCompare = cleanReleaseNotes(rawCompareOnly, '1.0.1');
if (!cleanedCompare.includes('https://github.com')) ok('Strips raw compare link'); else fail('Compare link not stripped');
if (cleanedCompare.includes('v1.0.1')) ok('Includes bullet point summary for v1.0.1'); else fail('Missing v1.0.1 summary');

// Test cleanReleaseNotes with markdown headers and PR links
const markdownBody = `## What's Changed
* fix: lesson completion bug by @dagijosi in https://github.com/dagijosi/coding_coach/pull/1
* feat: add offline github sync by @dagijosi in https://github.com/dagijosi/coding_coach/pull/2

**Full Changelog**: https://github.com/dagijosi/coding_coach/compare/v1.0.0...v1.0.1`;

const cleanedMarkdown = cleanReleaseNotes(markdownBody, '1.0.1');
if (cleanedMarkdown.includes("What's Changed:")) ok('Converts markdown header to clean label'); else fail('Header not converted');
if (!cleanedMarkdown.includes('in https://github.com/')) ok('Strips raw pull request URL'); else fail('PR URL not stripped');
if (cleanedMarkdown.includes('by @dagijosi')) ok('Keeps PR author/text'); else fail('Author not kept');
if (cleanedMarkdown.includes('• fix: lesson completion bug')) ok('Converts bullets to unicode bullets'); else fail('Bullets not converted');

// Test extractChangelogUrl
const changelogUrl = extractChangelogUrl(rawCompareOnly, 'https://github.com/dagijosi/coding_coach/releases');
if (changelogUrl === 'https://github.com/dagijosi/coding_coach/compare/v1.0.0...v1.0.1') ok('Extracts compare URL from body'); else fail('Changelog URL not extracted');

const fallbackChangelog = extractChangelogUrl('', 'https://github.com/dagijosi/coding_coach/releases');
if (fallbackChangelog === 'https://github.com/dagijosi/coding_coach/releases') ok('Falls back to HTML URL when no compare URL'); else fail('Fallback failed');

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('update_smoke: OK');
}
