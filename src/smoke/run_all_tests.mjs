import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_FILES = [
  'chat_smoke.mjs',
  'chat_ui_smoke.mjs',
  'coach_context_smoke.mjs',
  'coach_smoke.mjs',
  'github_smoke.mjs',
  'hint_explanation_smoke.mjs',
];

console.log('====================================================');
console.log('CODING COACH — FULL TEST SUITE RUNNER');
console.log('====================================================\n');

let totalSuites = 0;
let passedSuites = 0;
let failedSuites = 0;
const failures = [];

const startTime = Date.now();

for (const file of TEST_FILES) {
  totalSuites++;
  const filePath = join(__dirname, file);
  console.log(`▶ Running ${file}...`);

  const result = spawnSync(process.execPath, [filePath], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status === 0) {
    passedSuites++;
    console.log(`✔ ${file} PASSED\n`);
  } else {
    failedSuites++;
    failures.push(file);
    console.error(`✖ ${file} FAILED (exit code: ${result.status})\n`);
  }
}

const elapsedMs = Date.now() - startTime;

console.log('====================================================');
console.log(`TEST RESULTS SUMMARY (${(elapsedMs / 1000).toFixed(2)}s)`);
console.log(`Suites Run:    ${totalSuites}`);
console.log(`Suites Passed: ${passedSuites}`);
console.log(`Suites Failed: ${failedSuites}`);
console.log('====================================================');

if (failedSuites > 0) {
  console.error(`\nFailed test files:\n- ${failures.join('\n- ')}`);
  process.exit(1);
} else {
  console.log('\nALL TEST SUITES PASSED CLEANLY.');
  process.exit(0);
}
