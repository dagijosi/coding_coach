/**
 * Phase 7 Step 6 — Chat UI smoke test (pure, headless subset).
 *
 * Exercises the pure, testable helpers behind the Chat screen:
 *   - hint-progression marker stripping (display vs persisted content)
 *   - whitespace-only send rejection
 *   - suggested-action -> engine-prompt routing
 *
 * The React screen itself and the SQLite persistence path are covered by the
 * TypeScript/build checks and the Step 1 chat_smoke; this suite covers the
 * deterministic rules that drive the UI.
 *
 * Usage: node src/smoke/chat_ui_smoke.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require2 = createRequire(process.cwd() + '/x.mjs');
const REPO = process.cwd();

let passed = 0;
let failed = 0;

function ok(label, detail = '') {
  passed++;
  console.log(`  ✓ ${label}${detail ? ' — ' + detail : ''}`);
}

function fail(label, error) {
  failed++;
  console.error(`  ✗ ${label}: ${error.message || error}`);
}

function assert(cond, label, detail = '') {
  if (cond) ok(label, detail);
  else fail(label, new Error('assertion failed'));
}

function transpile(relPath) {
  const abs = REPO + '\\' + relPath;
  const src = fs.readFileSync(abs, 'utf8');
  const ts = require2(REPO + '\\node_modules\\typescript');
  return {
    abs,
    out: ts.transpileModule(src, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        moduleResolution: ts.ModuleResolutionKind.Node10,
      },
      fileName: abs,
    }).outputText,
  };
}

function loadTs(relPath, deps) {
  const { abs, out } = transpile(relPath);
  const module = { exports: {} };
  vm.runInNewContext(
    out,
    {
      module,
      exports: module.exports,
      require: (id) =>
        deps && Object.prototype.hasOwnProperty.call(deps, id)
          ? deps[id]
          : require2(id),
      console,
    },
    { filename: abs }
  );
  return module.exports;
}

const chat = loadTs('src\\features\\coach\\chatContent.ts');

console.log('\nHint marker stripping (§6 display vs §9 persistence)');
{
  const plain = 'Just a normal coach response.';
  assert(
    chat.stripHintMarker(plain) === plain,
    'no marker -> unchanged',
    'plain text passes through'
  );

  const marker = 'hint:problem-a:hint-2\nThink about the starting value.';
  assert(
    chat.stripHintMarker(marker) === 'Think about the starting value.',
    'marker first line removed',
    'only learner-facing text remains'
  );

  const markerMultiline =
    'hint:problem-a:hint-2\nThink about the starting value.\nThen re-read the loop.';
  assert(
    chat.stripHintMarker(markerMultiline) ===
      'Think about the starting value.\nThen re-read the loop.',
    'marker + multiline body preserved',
    'newlines after the marker survive'
  );

  const emptyMsg = '';
  assert(chat.stripHintMarker(emptyMsg) === '', 'empty content handled');
}

console.log('\nWhitespace-only send rejection (§13)');
{
  assert(chat.isUsableMessage('hello') === true, 'non-empty allowed');
  assert(chat.isUsableMessage('   ') === false, 'spaces rejected');
  assert(chat.isUsableMessage('\n\t') === false, 'newline/tab rejected');
  assert(chat.isUsableMessage('  hi  ') === true, 'trimmed text allowed');
  assert(chat.isUsableMessage('') === false, 'empty rejected');
}

console.log('\nSuggested action -> engine prompt routing (§6)');
{
  assert(
    chat.enginePromptForAction({ type: 'next_hint', targetId: 'p1' }) ===
      'Give me another hint',
    'next_hint routes to a hint request'
  );
  assert(
    chat.enginePromptForAction({ type: 'view_solution', targetId: 'p1' }) ===
      'Explain the solution',
    'view_solution routes to a solution request'
  );
  assert(
    chat.enginePromptForAction({ type: 'practice_problem', targetId: 'p1' }) ===
      null,
    'practice_problem is a UI/navigation action'
  );
  assert(
    chat.enginePromptForAction({ type: 'view_progress', targetId: '' }) === null,
    'view_progress is a UI/navigation action'
  );
  assert(
    chat.enginePromptForAction({ type: 'review_concept', targetId: 'c1' }) ===
      null,
    'review_concept handled by the UI layer'
  );
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('chat_ui_smoke: FAIL');
  process.exit(1);
} else {
  console.log('chat_ui_smoke: OK');
}
