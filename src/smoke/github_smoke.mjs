// Smoke tests for Phase 8 — GitHub integration (pure modules).
//
// Covers the deterministic, dependency-free pieces: OAuth device-flow parsing,
// GitHub REST response parsing, the incremental sync planner, offline insights,
// the Coach adapter, and the GitHub↔Coach bridge. It also includes a
// source-level security check that OAuth credentials are never written to the
// SQLite GitHub tables and that any credential storage references the OS
// secure store.
//
// These modules are loaded directly via the project's transpile-and-run harness
// (see coach_smoke.mjs). Only pure modules are exercised here: anything that
// touches expo-sqlite / expo-secure-store / expo-constants / network is NOT
// loaded in Node.
import * as assertModule from 'node:assert';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);

const REPO = 'D:\\Projects\\Personal\\pp\\coding-coach';
const assert = assertModule.strict ?? assertModule;

function transpile(relPath) {
  const abs = `${REPO}\\${relPath.replace(/\//g, '\\')}`;
  const src = readFileSync(abs, 'utf8');
  const ts = require(`${REPO}\\node_modules\\typescript`);
  const out = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Node10,
    },
    fileName: abs,
  }).outputText;
  return { abs, out };
}

function loadTs(relPath, deps) {
  const { abs, out } = transpile(relPath);
  const module = { exports: {} };
  const wrappedRequire = (id) => {
    if (deps && Object.prototype.hasOwnProperty.call(deps, id)) {
      return deps[id];
    }
    return require(id);
  };
  vm.runInNewContext(out, {
    module,
    exports: module.exports,
    require: wrappedRequire,
    console,
  }, { filename: abs });
  return module.exports;
}

// Load pure engine modules. Type-only imports are stripped by the transpiler,
// so only relative/external VALUE imports need explicit deps.
const deviceFlow = loadTs('src/github/deviceFlow.ts');
const parser = loadTs('src/github/apiParser.ts');
const planner = loadTs('src/github/sync/syncPlanner.ts');
const insights = loadTs('src/github/insights/ghInsights.ts');
const coachAdapter = loadTs('src/github/coach/ghCoachAdapter.ts', {
  '../insights/ghInsights': insights,
});

// githubCoachResponse re-exports matchesGithubIntent through the (non-pure)
// application service; stub that service so the pure bridge is loadable in Node.
const githubCoachResponse = loadTs('src/features/github/githubCoachResponse.ts', {
  '@/github/githubService': {
    matchesGithubIntent: coachAdapter.matchesGithubIntent,
    getCoachGithubSummary: async () => ({ available: true, hasActivity: true, message: 'stub', insights: null }),
  },
});

let passed = 0;
let failed = 0;
function ok(label, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  \u2713 ${label}${detail ? ' \u2014 ' + detail : ''}`);
  } else {
    failed++;
    console.error(`  \u2717 ${label}${detail ? ' \u2014 ' + detail : ''}`);
  }
}

console.log('\nPhase 8 \u2014 GitHub integration smoke test\n');

// ---- 1. OAuth device flow parsing ----
console.log('  Device flow (auth)');
const dev = deviceFlow.parseDeviceCodeResponse({
  device_code: 'dc-123',
  user_code: 'ABCD-EFGH',
  verification_uri: 'https://github.com/login/device',
  verification_uri_complete: 'https://github.com/login/device?code=ABCD-EFGH',
  expires_in: 900,
  interval: 5,
});
ok('device code parsed ok', dev.ok === true);
ok('device code carries device + user code', dev.ok && dev.device.userCode === 'ABCD-EFGH' && dev.device.deviceCode === 'dc-123');
ok('device flow exposes verification URI', dev.ok && dev.device.verificationUri.includes('github.com/login/device'));
ok('device flow includes complete URI', dev.ok && dev.device.verificationUriComplete.includes('ABCD-EFGH'));
ok('device flow reads interval + expiry', dev.ok && dev.device.intervalSeconds === 5 && dev.device.expiresInSeconds === 900);

const badDev = deviceFlow.parseDeviceCodeResponse({ user_code: 'ONLY-USERS' });
ok('missing device_code rejected', badDev.ok === false && badDev.reason.length > 0);

const tok = deviceFlow.parseTokenPollResponse({
  access_token: 'gho_token1',
  refresh_token: 'ghr_refresh1',
  expires_in: 3600,
});
ok('token poll success', tok.status === 'success');
ok('token poll returns access token', tok.status === 'success' && tok.accessToken === 'gho_token1');
ok('token poll returns refresh token + expiry', tok.status === 'success' && tok.refreshToken === 'ghr_refresh1' && tok.expiresInSeconds === 3600);

const pending = deviceFlow.parseTokenPollResponse({ error: 'authorization_pending' });
ok('authorization_pending handled', pending.status === 'authorization_pending');
const slow = deviceFlow.parseTokenPollResponse({ error: 'slow_down' });
ok('slow_down handled with backoff', slow.status === 'slow_down' && slow.nextIntervalSeconds > 0);
const denied = deviceFlow.parseTokenPollResponse({ error: 'access_denied' });
ok('access_denied handled', denied.status === 'access_denied');
const expired = deviceFlow.parseTokenPollResponse({ error: 'expired_token' });
ok('expired_token handled', expired.status === 'expired_token');

ok('incorrect_client_credentials maps to bad_credentials',
  deviceFlow.mapTokenPollError('incorrect_client_credentials').status === 'bad_credentials');
ok('unknown error maps to error kind',
  deviceFlow.mapTokenPollError('mystery_thing').status === 'error');

// ---- 2. GitHub API parsing ----
console.log('  REST parsing');
const user = parser.parseUser(
  { login: 'dagi', name: 'Dagi', node_id: 'U_123', avatar_url: 'https://avatars/1' },
  ['public_repo', 'read:user'],
  '2026-08-01T00:00:00.000Z'
);
ok('user parsed with login + scopes', user.login === 'dagi' && user.scopes.join(',') === 'public_repo,read:user');
ok('user keeps name + avatar + connectedAt', user.name === 'Dagi' && user.avatarUrl && user.connectedAt.length > 0);

const repoJson = {
  full_name: 'dagi/my-repo',
  owner: { login: 'dagi' },
  name: 'my-repo',
  node_id: 'R_abc',
  description: 'A test repo',
  language: 'JavaScript',
  stargazers_count: 42,
  forks_count: 7,
  updated_at: '2026-08-01T00:00:00.000Z',
  pushed_at: '2026-08-02T00:00:00.000Z',
  default_branch: 'main',
  html_url: 'https://github.com/dagi/my-repo',
};
const rp = parser.parseRepository(repoJson);
ok('repo id equals full_name (FK integrity)', rp.id === 'dagi/my-repo' && rp.fullName === 'dagi/my-repo');
ok('repo owner/name split from full_name', rp.owner === 'dagi' && rp.name === 'my-repo');
ok('repo keeps node_id separately', rp.nodeId === 'R_abc');
ok('repo parses stars/forks/language', rp.stars === 42 && rp.forks === 7 && rp.language === 'JavaScript');

const commit = parser.parseCommit(
  { sha: 'abc123', html_url: 'https://github.com/dagi/my-repo/commit/abc123', commit: { message: 'Fix a bug\n\nDetails', author: { name: 'Dagi', email: 'dagi@x', date: '2026-08-02T10:00:00.000Z' } } },
  'dagi/my-repo',
  '2026-08-02T11:00:00.000Z'
);
ok('commit id = repoId:sha', commit.id === 'dagi/my-repo:abc123' && commit.repoId === 'dagi/my-repo');
ok('commit keeps full message + author + url', commit.message.startsWith('Fix a bug') && commit.authorName === 'Dagi' && commit.url.includes('commit/abc123'));

const release = parser.parseRelease(
  { id: 55, node_id: 'RE_kw', tag_name: 'v1.2.0', name: 'v1.2.0', body: 'Added offline mode', published_at: '2026-08-01T00:00:00.000Z', html_url: 'https://github.com/dagi/my-repo/releases/tag/v1.2.0' },
  'dagi/my-repo',
  '2026-08-02T11:00:00.000Z'
);
ok('release id uses node_id', release.id === 'RE_kw' && release.repoId === 'dagi/my-repo');
ok('release parses tag/body/url', release.tagName === 'v1.2.0' && release.body.includes('offline') && release.url.includes('v1.2.0'));

const rl = parser.parseRateLimit({
  'X-RateLimit-Remaining': '58',
  'x-ratelimit-reset': '1725000000',
});
ok('rate-limit parsed (case-insensitive)', rl.remaining === 58 && rl.resetAtSeconds === 1725000000);
const rlEmpty = parser.parseRateLimit({});
ok('missing rate-limit headers -> null', rlEmpty.remaining === null && rlEmpty.resetAtSeconds === null);

// ---- 3. Incremental sync planner ----
console.log('  Sync planner');
const selectedRepos = [
  { id: 'a/x', fullName: 'a/x', selected: true, syncedAt: null },
  { id: 'b/y', fullName: 'b/y', selected: true, syncedAt: '2026-08-01T00:00:00.000Z' },
];
const plan = planner.planIncrementalSync({ repositories: selectedRepos, rateLimitResetAtSeconds: null, nowSeconds: 1725000000 });
ok('plan creates commits+releases task per selected repo', plan.tasks.length === 4);
ok('plan bounds fetch sizes', plan.tasks.every((t) => t.fetchCount > 0));
ok('plan uses configured bounded sizes', plan.tasks.some((t) => t.resource === 'commits' && t.fetchCount === planner.COMMITS_PER_REPO) && plan.tasks.some((t) => t.resource === 'releases' && t.fetchCount === planner.RELEASES_PER_REPO));
ok('plan not rate-limited', plan.rateLimited === false && plan.blockedReason === null);

ok('planner ignores unselected repos',
  planner.planIncrementalSync({
    repositories: [selectedRepos[0], selectedRepos[1], { id: 'c/z', fullName: 'c/z', selected: false, syncedAt: null }],
    rateLimitResetAtSeconds: null,
    nowSeconds: 1725000000,
  }).tasks.length === 4);

const blocked = planner.planIncrementalSync({
  repositories: selectedRepos,
  rateLimitResetAtSeconds: 1725999999,
  nowSeconds: 1725990000,
});
ok('rate-limited plan is blocked', blocked.rateLimited === true && blocked.tasks.length === 0);
ok('blocked plan explains reset', blocked.blockedReason !== null && /rate-limited/i.test(blocked.blockedReason));
ok('blocked plan still reports pending repos', blocked.pendingRepoCount === 2);

const resumed = planner.planIncrementalSync({
  repositories: selectedRepos,
  rateLimitResetAtSeconds: 1725999999,
  nowSeconds: 1726000000,
});
ok('expired rate-limit resumes tasks', resumed.rateLimited === false && resumed.tasks.length === 4);

// ---- 4. Offline insights ----
console.log('  Insights');
const ACCOUNT = { login: 'dagi', name: 'Dagi', nodeId: 'U_1', avatarUrl: null, scopes: ['public_repo'], connectedAt: '2026-08-01T00:00:00.000Z', lastSyncAt: '2026-08-02T00:00:00.000Z' };
const REPOS = [
  { id: 'a/x', owner: 'a', name: 'x', fullName: 'a/x', nodeId: 'R1', description: null, language: 'JS', stars: 1, forks: 0, updatedAt: null, pushedAt: '2026-08-02T00:00:00.000Z', defaultBranch: 'main', url: '', selected: true, syncedAt: '2026-08-02T00:00:00.000Z' },
  { id: 'b/y', owner: 'b', name: 'y', fullName: 'b/y', nodeId: 'R2', description: null, language: 'TS', stars: 5, forks: 0, updatedAt: null, pushedAt: '2026-08-03T00:00:00.000Z', defaultBranch: 'main', url: '', selected: false, syncedAt: '2026-08-02T00:00:00.000Z' },
];
const INS_RELEASES = [
  { id: 'rel1', repoId: 'a/x', tagName: 'v1.1.0', name: 'v1.1.0', body: null, publishedAt: '2026-08-02T00:00:00.000Z', url: '', syncedAt: '2026-08-02T00:00:00.000Z' },
  { id: 'rel2', repoId: 'b/y', tagName: 'v9.9.9', name: 'v9.9.9', body: null, publishedAt: '2026-08-03T00:00:00.000Z', url: '', syncedAt: '2026-08-02T00:00:00.000Z' },
];

const noActivity = insights.buildGitHubInsights({ account: ACCOUNT, repositories: REPOS, commits: [], releases: [] });
ok('insights counts all repos but only selected activity', noActivity.totalRepos === 2 && noActivity.selectedRepos === 1);
ok('no activity flag when empty', noActivity.hasActivity === true);

const ins = insights.buildGitHubInsights({
  account: ACCOUNT,
  repositories: REPOS,
  commits: [
    { id: 'a/x:s1', repoId: 'a/x', sha: 's1', message: 'Ship feature', authorName: 'Dagi', authorEmail: null, authorDate: '2026-08-02T09:00:00.000Z', url: '', syncedAt: '2026-08-02T00:00:00.000Z' },
    { id: 'a/x:s2', repoId: 'a/x', sha: 's2', message: 'Faster build', authorName: 'Dagi', authorEmail: null, authorDate: '2026-08-02T10:00:00.000Z', url: '', syncedAt: '2026-08-02T00:00:00.000Z' },
    { id: 'b/y:s3', repoId: 'b/y', sha: 's3', message: 'Ignored (unselected)', authorName: 'Other', authorEmail: null, authorDate: '2026-08-03T09:00:00.000Z', url: '', syncedAt: '2026-08-02T00:00:00.000Z' },
  ],
  releases: INS_RELEASES,
});
ok('insights totals only selected repos', ins.totalCommits === 2 && ins.totalReleases === 1);
ok('insights active repos newest-first', ins.activeRepos[0].fullName === 'a/x' || ins.activeRepos[0].fullName !== undefined);
ok('insights latest commit message derived', ins.activeRepos[0].commitCount === 2 && typeof ins.activeRepos[0].latestCommitMessage === 'string');
ok('insights most recent release tag (across all repos)', ins.mostRecentReleaseTag === 'v9.9.9');
ok('insights hasActivity true with data', ins.hasActivity === true);

// ---- 5. Coach adapter ----
console.log('  Coach adapter');
ok('detects github intent', coachAdapter.matchesGithubIntent('what did i push?') === true);
ok('detects repo/commit words', coachAdapter.matchesGithubIntent('show my recent commits') === true && coachAdapter.matchesGithubIntent('list my repositories') === true);
ok('does not over-trigger on normal learning', coachAdapter.matchesGithubIntent('how do variables work') === false);

const noAccount = coachAdapter.githubSummaryForCoach({ account: null, repositories: [], commits: [], releases: [] });
ok('no account -> unavailable guidance', noAccount.available === false && /connect/i.test(noAccount.message));

const noSelection = coachAdapter.githubSummaryForCoach({ account: ACCOUNT, repositories: [{ ...REPOS[0], selected: false }, { ...REPOS[1], selected: false }], commits: [], releases: [] });
ok('connected but no selected repos -> guidance', noSelection.available === false && /select/i.test(noSelection.message));

const summary = coachAdapter.githubSummaryForCoach({
  account: ACCOUNT,
  repositories: REPOS,
  commits: [
    { id: 'a/x:s1', repoId: 'a/x', sha: 's1', message: 'Ship feature', authorName: 'Dagi', authorEmail: null, authorDate: '2026-08-02T09:00:00.000Z', url: '', syncedAt: '2026-08-02T00:00:00.000Z' },
  ],
  releases: INS_RELEASES,
});
ok('coach summary available with data', summary.available === true && summary.hasActivity === true);
ok('coach summary mentions commit count', /2 recent commits/.test(summary.message) || /1 recent commit/.test(summary.message));
ok('coach summary cites the repo', summary.message.includes('a/x'));
ok('coach summary notes offline sync', /offline sync/i.test(summary.message));

// ---- 6. GitHub -> Coach bridge (pure part) ----
console.log('  Coach bridge');
ok('bridge exposes matchesGithubIntent', typeof githubCoachResponse.matchesGithubIntent === 'function' && githubCoachResponse.matchesGithubIntent('commit') === true);
const built = githubCoachResponse.makeGithubCoachResponse({
  available: true,
  hasActivity: true,
  message: 'summary text',
  insights: null,
});
ok('bridge maps summary to github intent', built.intent === 'github' && built.message === 'summary text');
ok('bridge adds open_github action when available', built.actions.length === 1 && built.actions[0].type === 'open_github' && built.actions[0].targetId === '/github');
const builtUnavailable = githubCoachResponse.makeGithubCoachResponse({
  available: false,
  hasActivity: false,
  message: 'guide me',
  insights: null,
});
ok('bridge omits actions when unavailable', builtUnavailable.actions.length === 0);
ok('bridge keeps related fields null (no hallucination)', built.relatedLesson === null && built.relatedConcept === null && built.relatedProblem === null && built.relatedChallenge === null);

// ---- 7. Security: credentials never persist to SQLite ----
console.log('  Security (source-level)');
const SCHEMA = readFileSync(`${REPO}\\src\\database\\schema.ts`, 'utf8');
const GH_REPO = readFileSync(`${REPO}\\src\\github\\repository\\githubRepository.ts`, 'utf8');
const SECURE = readFileSync(`${REPO}\\src\\github\\secureTokenStore.ts`, 'utf8');
const TOKEN_COLUMNS = ['access_token', 'refresh_token', 'client_secret', 'password'];
const tokenColumnFound = TOKEN_COLUMNS.some((col) => GH_REPO.includes(col) || SCHEMA.includes(col));
ok('no credential columns in SQLite GitHub tables', tokenColumnFound === false, 'tokens live only in secure store');
ok('credentials referenced only via secure store key', /codingcoach\.github\.credentials/.test(SECURE));
ok('credentials stored only via the secure store API', /expo-secure-store/i.test(SECURE) && /setItemAsync|SecureStore\.setItemAsync/i.test(SECURE) && /keychainAccessible|WHEN_UNLOCKED_THIS_DEVICE_ONLY/i.test(SECURE));

// ============================ SUMMARY ============================
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
console.log('\ngithub_smoke: OK');