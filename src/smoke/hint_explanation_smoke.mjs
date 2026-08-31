// Smoke tests for Phase 7 Step 4 — Hint & Explanation Engine.
//
// Exercises the pure HintEngine and ExplanationEngine directly plus the coach
// engine integration, using the same transpile-and-run harness. Covers:
//   1 first hint      5  failed attempt      9  lesson explanation    13 missing hint
//   2 second hint     6  repeated failure   10 problem explanation   14 missing concept
//   3 final hint      7  successful attempt 11 explicit solution     15 context-aware explanation
//   4 repeated request 8 concept explanation 12 missing solution      16 suggested actions
import * as assertModule from 'node:assert';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = resolve(__dirname, '../..');
const require = createRequire(import.meta.url);
const assert = assertModule.strict ?? assertModule;

function transpile(relPath) {
  const parts = relPath.split(/[/\\]/);
  const abs = join(REPO, ...parts);
  const src = readFileSync(abs, 'utf8');
  const ts = require('typescript');
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

const hintProg = loadTs('src\\learning\\coach\\hintProgression.ts');
const hintEngine = loadTs('src\\learning\\hint\\hintEngine.ts', {
  '@/learning/coach/hintProgression': hintProg,
});
const explanation = loadTs('src\\learning\\explanation\\explanationEngine.ts');
const intentMod = loadTs('src\\learning\\coach\\intent.ts');

let passed = 0;
let failed = 0;
function ok(label, cond, detail = '') {
  if (cond) { passed++; console.log(`  \u2713 ${label}${detail ? ' \u2014 ' + detail : ''}`); }
  else { failed++; console.error(`  \u2717 ${label}${detail ? ' \u2014 ' + detail : ''}`); }
}

// ---- Fixtures -------------------------------------------------------------
const variableConcept = {
  id: 'concept-variable', name: 'What is a variable?',
  summary: 'A variable is a named container for storing a value in memory.',
};
const letConstConcept = {
  id: 'concept-let-const', name: 'let vs const',
  summary: 'const cannot be reassigned; let allows reassignment.',
};
const PROBLEM = {
  id: 'problem-bug', title: 'Find the bug',
  hints: [
    { id: 'h-1', content: 'Think about which binding is being reassigned.', order: 1 },
    { id: 'h-2', content: 'const bindings cannot be reassigned.', order: 2 },
    { id: 'h-3', content: 'Replace const with let to allow reassignment.', order: 3 },
  ],
  explanation: 'const cannot be reassigned, so the code throws. Using let fixes it.',
};
const PROBLEM_NO_SOLUTION = {
  id: 'problem-nosol', title: 'Mystery problem',
  hints: [{ id: 'nh-1', content: 'Look closely at the values involved.', order: 1 }],
  explanation: '',
};
const PROBLEM_NO_HINTS = {
  id: 'problem-nohints', title: 'No hints problem',
  hints: [],
  explanation: 'There is no stored walkthrough either.',
};

function baseCmd(overrides = {}) {
  return Object.assign({
    target: PROBLEM,
    kind: 'hint',
    history: [],
    attempt: 'not-attempted',
    concept: variableConcept,
    lessonId: 'lesson-variables',
    solved: false,
  }, overrides);
}

const LESSON_REF = {
  id: 'lesson-variables', topicId: 'topic-fundamentals', title: 'Variables',
  description: 'Learn how JavaScript stores values in named containers.',
  content: [
    { type: 'heading', content: 'Variables' },
    { type: 'text', content: 'A variable is a named place to store a value.' },
    { type: 'text', content: 'A common mistake is reassigning a const binding.' },
  ],
};
const PROBLEM_REF = {
  id: 'problem-bug', lessonId: 'lesson-variables', title: 'Find the bug',
  description: 'This code tries to update a constant.', type: 'debugging',
  prompt: 'const x = 1; x = 2;', explanation: 'const cannot be reassigned.',
};

console.log('\nPhase 7 Step 4 \u2014 Hint & Explanation Engine smoke test\n');

// ---- 1. First hint ----
console.log('  1. First hint');
const first = hintEngine.commandHint(baseCmd());
ok('first hint kind = hint', first.kind === 'hint');
ok('first hint reveals h-1', first.revealedHintId === 'h-1');
ok('first hint is conceptual', first.hintLevel === 'conceptual');
ok('first hint labels position', first.kind === 'hint' && first.index === 1 && first.total === 3);

// ---- 2. Second hint ----
console.log('  2. Second hint');
const history1 = [{ role: 'assistant', content: hintProg.hintMessageId('problem-bug', 'h-1') }];
const second = hintEngine.commandHint(baseCmd({ history: history1 }));
ok('second hint reveals h-2', second.revealedHintId === 'h-2');
ok('second hint is more specific', second.hintLevel === 'specific');

// ---- 3. Final hint + explanation ----
console.log('  3. Final hint');
const history12 = [...history1, { role: 'assistant', content: hintProg.hintMessageId('problem-bug', 'h-2') }];
const third = hintEngine.commandHint(baseCmd({ history: history12 }));
ok('third hint reveals h-3', third.revealedHintId === 'h-3');
ok('final hint is implementation level', third.hintLevel === 'implementation');

// ---- 4. Repeated hint request (all shown -> explanation) ----
console.log('  4. Repeated hint request');
const historyAll = [...history12, { role: 'assistant', content: hintProg.hintMessageId('problem-bug', 'h-3') }];
const allShown = hintEngine.commandHint(baseCmd({ history: historyAll }));
ok('after all hints, moves to explanation', allShown.kind === 'all-hints-shown');
ok('all-shown includes stored explanation', allShown.message.includes('const cannot be reassigned'));

// ---- 5. Failed problem attempt ----
console.log('  5. Failed problem attempt');
const failedCmd = hintEngine.commandHint(baseCmd({ attempt: 'unsolved-failed' }));
ok('failed attempt adds guidance prefix', /tricky|review/i.test(failedCmd.message));
ok('failed attempt offers review concept action', failedCmd.actions.some((a) => a.type === 'review_concept'));

// ---- 6. Repeated failed attempts (stronger signal) ----
console.log('  6. Repeated failed attempts');
const repeated = hintEngine.commandHint(baseCmd({
  attempt: 'unsolved-failed',
  concept: letConstConcept,
  history: [ { role: 'assistant', content: hintProg.hintMessageId('problem-bug', 'h-1') } ],
}));
ok('repeated failure surfaces the key concept', repeated.message.includes('const binds')
  || repeated.message.includes('reassign')
  || repeated.revealedHintId === 'h-2');

// ---- 7. Successful attempt ----
console.log('  7. Successful attempt');
const solved = hintEngine.commandHint(baseCmd({ attempt: 'solved', solved: true }));
ok('solved problem avoids another hint', solved.kind === 'already-solved');
ok('solved response is encouraging, not a hint', /nice work|solved/i.test(solved.message));

// ---- 8. Concept explanation ----
console.log('  8. Concept explanation');
const conceptExpl = explanation.explainConcept({
  concept: variableConcept, lesson: LESSON_REF, relatedProblem: PROBLEM_REF,
});
ok('concept explanation has "what it is"', /What it is/.test(conceptExpl.message));
ok('concept explanation includes the summary', conceptExpl.message.includes('named container'));
ok('concept explanation suggests practice', conceptExpl.actions.some((a) => a.type === 'practice_problem'));

// ---- 9. Lesson explanation ----
console.log('  9. Lesson explanation');
const lessonExpl = explanation.explainLesson({
  lesson: LESSON_REF, concept: variableConcept, relatedProblem: PROBLEM_REF,
});
ok('lesson explanation opens with lesson title', lessonExpl.message.includes('Variables'));
ok('lesson explanation includes key concept', lessonExpl.message.includes('named container'));

// ---- 10. Problem explanation ----
console.log('  10. Problem explanation');
const problemExpl = explanation.explainProblem({
  problem: PROBLEM_REF, concept: variableConcept, showPrompt: true,
});
ok('problem explanation describes the problem', /Find the bug/i.test(problemExpl.message));
ok('problem explanation links the concept', problemExpl.message.includes('named container'));
ok('problem explanation withholds the answer', !problemExpl.message.includes('const cannot be reassigned'));
ok('problem explanation prompts reasoning', /hint/i.test(problemExpl.message));

const incorrectExpl = explanation.explainIncorrect({ problem: PROBLEM_REF, concept: variableConcept });
ok('incorrect-answer explanation is honest', /isn't quite right|not quite/i.test(incorrectExpl.message));
ok('incorrect explanation offers review concept', incorrectExpl.actions.some((a) => a.type === 'review_concept'));

const correctExpl = explanation.explainCorrect({ problem: PROBLEM_REF, concept: variableConcept, succeeded: true });
ok('correct-answer explanation confirms and explains', /correct|Nice work/i.test(correctExpl.message));

// ---- 11. Explicit solution request ----
console.log('  11. Explicit solution request');
const solution = hintEngine.commandHint(baseCmd({ kind: 'solution' }));
ok('explicit solution reveals stored walkthrough', solution.kind === 'solution');
ok('solution message includes stored explanation', /const cannot be reassigned/.test(solution.message));
ok('solution offers retry action', solution.actions.some((a) => a.type === 'retry_problem'));
ok('intent detects solution request', intentMod.detectIntent('show me the answer') === 'solution');

// ---- 12. Missing solution ----
console.log('  12. Missing solution');
const missingSolution = hintEngine.commandHint(baseCmd({ target: PROBLEM_NO_SOLUTION, kind: 'solution' }));
ok('missing solution is honest', /don't have a full written solution/i.test(missingSolution.message));
ok('missing solution falls back to strongest hint', /Look closely/i.test(missingSolution.message));

// ---- 13. Missing hint ----
console.log('  13. Missing hint');
const missingHint = hintEngine.commandHint(baseCmd({ target: PROBLEM_NO_HINTS }));
ok('no stored hints explained honestly', /don't have stored hints/i.test(missingHint.message));
ok('no-hints uses concept for guidance', missingHint.message.includes('named container'));

// ---- 14. Missing concept ----
console.log('  14. Missing concept');
const noConceptHint = hintEngine.commandHint(baseCmd({ concept: null }));
ok('hint still works without concept data', noConceptHint.kind === 'hint');
const noConceptExpl = explanation.explainConcept({
  concept: variableConcept, lesson: null, relatedProblem: null,
});
ok('concept explanation degrades gracefully', noConceptExpl.message.length > 0);
const noTarget = hintEngine.commandHint({ ...baseCmd(), target: { id: 'x', title: 'x', hints: [], explanation: '' }, concept: null, lessonId: null });
ok('empty target handled without crash', noTarget.message.length > 0);

// ---- 15. Context-aware explanation ----
console.log('  15. Context-aware explanation');
const contextExpl = explanation.explainProblem({
  problem: PROBLEM_REF, concept: letConstConcept, showPrompt: false,
});
ok('context-aware explanation names the current concept', contextExpl.message.includes('const cannot be reassigned'));

// ---- 16. Suggested actions ----
console.log('  16. Suggested actions');
const actionHint = hintEngine.commandHint(baseCmd({ attempt: 'unsolved-failed' }));
const types = actionHint.actions.map((a) => a.type);
ok('failed-attempt hint returns multiple actions', types.includes('practice_problem') && types.includes('review_concept'));
ok('actions carry id references', actionHint.actions.every((a) => typeof a.targetId === 'string' && a.targetId.length > 0));

// ---- Test-result explanation (section 10) ----
console.log('  Test-result explanation');
const testResult = explanation.explainTestResult({
  problem: PROBLEM_REF, concept: variableConcept,
  tests: [
    { testCaseId: 't1', passed: true, actualValue: 1, expectedValue: 1, executionTimeMs: 1 },
    { testCaseId: 't2', passed: false, actualValue: 4, expectedValue: 5, executionTimeMs: 1 },
  ],
});
ok('test result reports pass count', /1 of 2 passed/.test(testResult.message));
ok('test result reports expected vs actual honestly', testResult.message.includes('Expected 5')
  && testResult.message.includes('got 4'));
ok('test result links concept and offers next step', testResult.message.includes('named container')
  && testResult.actions.some((a) => a.type === 'practice_problem'));

// ============================ SUMMARY ============================
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) { process.exit(1); }
console.log('\nhint_explanation_smoke: OK');
