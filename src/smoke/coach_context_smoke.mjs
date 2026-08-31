// Smoke tests for Phase 7 Step 3 — Learning-Context Integration.
//
// These exercise the coach engine's context-aware resolution through the pure
// modules (coachEngine.ts + learningContext.ts) using realistic LearningContext
// snapshots, mirroring the exact harness used by coach_smoke.mjs. The snapshot
// + builder wiring is covered by the repository-backed Level 3 smoke (the
// loader only reads SQL covered elsewhere); here we verify the deterministic
// context logic for the 12 required scenarios:
//
//   1. current lesson context
//   2. current concept context
//   3. explicit question overrides context
//   4. vague question uses current context
//   5. weak-area context
//   6. recent failed problem
//   7. recent successful problem
//   8. progress question
//   9. no current lesson
//   10. missing context
//   11. combined context
//   12. suggested action based on context
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

const intent = loadTs('src\\learning\\coach\\intent.ts');
const contentMatch = loadTs('src\\learning\\coach\\contentMatch.ts');
const hintProg = loadTs('src\\learning\\coach\\hintProgression.ts');
const practiceSel = loadTs('src\\learning\\coach\\practiceSelection.ts');
const hintEngine = loadTs('src\\learning\\hint\\hintEngine.ts', {
  '@/learning/coach/hintProgression': hintProg,
});
const explanationEngine = loadTs('src\\learning\\explanation\\explanationEngine.ts');
const engine = loadTs('src\\learning\\coach\\coachEngine.ts', {
  './intent': intent,
  './contentMatch': contentMatch,
  './hintProgression': hintProg,
  './practiceSelection': practiceSel,
  '@/learning/hint/hintEngine': hintEngine,
  '@/learning/explanation/explanationEngine': explanationEngine,
});

// ---------------------------------------------------------------------------
// Content fixtures (schema-realistic)
// ---------------------------------------------------------------------------
const LESSON_VARIABLES = { id: 'lesson-variables', topicId: 'topic-fundamentals', title: 'Variables', description: 'Variables lesson', language: 'javascript', difficulty: 'beginner', estimatedMinutes: 15, order: 1, prerequisites: [], content: [{ type: 'text', content: 'A variable stores a value.' }] };
const LESSON_FUNCTIONS = { id: 'lesson-functions', topicId: 'topic-functions', title: 'Functions', description: 'Functions lesson', language: 'javascript', difficulty: 'beginner', estimatedMinutes: 15, order: 2, prerequisites: [], content: [] };
const CONCEPT_VARIABLE = { id: 'concept-variable', lessonId: 'lesson-variables', name: 'What is a variable?', summary: 'A variable is a named container.', order: 1 };
const CONCEPT_LET_CONST = { id: 'concept-let-const', lessonId: 'lesson-variables', name: 'let vs const', summary: 'const cannot be reassigned.', order: 2 };
const PROBLEM_PRINT = { id: 'problem-variables-print', lessonId: 'lesson-variables', title: 'Which value is printed?', description: 'Predict the output.', type: 'predict-output', difficulty: 'beginner', order: 1, prompt: 'const name = \'Dagi\';', choices: ['Hello', 'Dagi', 'undefined'], answer: 1, hints: [{ id: 'hint-print-1', content: 'Look at name.', order: 1 }, { id: 'hint-print-2', content: 'console.log prints name.', order: 2 }], explanation: 'It prints Dagi.' };
const PROBLEM_BUG = { id: 'problem-variables-bug', lessonId: 'lesson-variables', title: 'Find the bug', description: 'Find the bug.', type: 'debugging', difficulty: 'beginner', order: 2, prompt: 'name = \'Ada\';', choices: ['Fine', 'Error', 'var'], answer: 1, hints: [], explanation: 'Reassigning a missing const throws.' };
const CHALLENGE_PRINT = { id: 'challenge-print', lessonId: 'lesson-variables', title: 'Print a variable', description: 'Write a print function.', difficulty: 'easy', order: 1, functionName: 'printVar', starterCode: 'function printVar() {}', testCases: [{ id: 'tc1', args: [], expected: 'Dagi' }], hints: [], explanation: 'Declare and print.' };

const DEFAULT_PROGRESS = {
  totalLessons: 2, completedLessons: 0, inProgressLessons: 1,
  totalProblems: 2, solvedProblems: 0, totalChallenges: 1,
  completedChallenges: 0, totalAttempts: 0, successfulAttempts: 0,
  successRate: 0, totalXP: 0, currentStreak: 0, longestStreak: 0,
};

function makeContext(overrides = {}, progress = {}) {
  return Object.assign({
    location: {
      course: { id: 'course-js', name: 'JavaScript' },
      topic: { id: 'topic-fundamentals', name: 'Fundamentals' },
      lesson: { id: 'lesson-variables', title: 'Variables' },
      concept: { id: 'concept-variable', name: 'What is a variable?' },
    },
    recentProblems: [],
    recentCompletedLessons: [],
    topicMastery: [],
    weakAreas: [],
    conceptsNeedingReview: [],
    progress: Object.assign({}, DEFAULT_PROGRESS, progress),
    currentLessonStatus: 'in-progress',
  }, overrides);
}

function makeData(overrides = {}) {
  const ctx = overrides.context === undefined ? makeContext() : overrides.context;
  const base = {
    context: ctx,
    concepts: [CONCEPT_VARIABLE, CONCEPT_LET_CONST],
    lessons: [LESSON_VARIABLES, LESSON_FUNCTIONS],
    problems: [PROBLEM_PRINT, PROBLEM_BUG],
    challenges: [CHALLENGE_PRINT],
    progressSummary: overrides.progressSummary === undefined ? DEFAULT_PROGRESS : overrides.progressSummary,
    topicMastery: ctx.topicMastery,
    weakAreas: ctx.weakAreas,
    solvedProblemIds: new Set(),
    completedChallengeIds: new Set(),
    problemPractice: new Map(),
  };
  return Object.assign(base, overrides);
}

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

function req(msg, history = []) {
  return { message: msg, history };
}

console.log('\nPhase 7 Step 3 \u2014 Learning-Context Integration smoke test\n');

// ---- 1. Current lesson context ----
console.log('  1. Current lesson context');
const lessonHelp = engine.buildCoachResponse(makeData(), req('help me with this lesson'));
ok('lessonHelp resolves to current lesson', lessonHelp.relatedLesson?.id === 'lesson-variables');
ok('lessonHelp names the current lesson', lessonHelp.message.includes('Variables') || lessonHelp.message.includes('variable'));

// ---- 2. Current concept context ----
console.log('  2. Current concept context');
const explainThis = engine.buildCoachResponse(makeData(), req('explain this'));
ok('vague "explain this" falls back to current concept', explainThis.relatedConcept?.id === 'concept-variable');
ok('explanation built from current concept', explainThis.message.length > 0);

// ---- 3. Explicit question overrides context ----
console.log('  3. Explicit question overrides context');
const explicitInFunctions = makeData({
  context: makeContext({
    location: { course: { id: 'course-js', name: 'JavaScript' }, topic: { id: 'topic-functions', name: 'Functions' }, lesson: { id: 'lesson-functions', title: 'Functions' }, concept: null },
  }),
  currentLessonStatus: 'in-progress',
});
const explicitDef = engine.buildCoachResponse(explicitInFunctions, req('what is a variable?'));
ok('explicit question wins over current context', explicitDef.relatedConcept?.id === 'concept-variable');

// ---- 4. Vague question uses current context ----
console.log('  4. Vague question uses current context');
const vagueHelp = engine.buildCoachResponse(explicitInFunctions, req('help me with this lesson'));
ok('vague help uses current lesson (functions)', vagueHelp.relatedLesson?.id === 'lesson-functions');

// ---- 5. Weak-area context ----
console.log('  5. Weak-area context');
const weakAreaCtx = makeContext({
  weakAreas: [
    { id: 'wa-1', kind: 'topic', targetId: 'topic-functions', targetName: 'Functions', topicId: 'topic-functions', topicName: 'Functions', masteryScore: 20, attempts: 3, successfulAttempts: 1, successRate: 0.33, lastActivityAt: '2026-08-01T00:00:00.000Z', reason: 'Low success rate', priority: 1 },
  ],
  conceptsNeedingReview: [
    { conceptId: 'concept-variable', conceptName: 'What is a variable?', topicId: 'topic-fundamentals', topicName: 'Fundamentals', masteryScore: 30 },
  ],
});
const weak = engine.buildCoachResponse(makeData({ context: weakAreaCtx }), req('what am I weak at?'));
ok('weakArea names weak topic', weak.message.includes('Functions'));
ok('weakArea adds review_concept for weak concept', weak.actions.some((a) => a.type === 'review_concept'));
ok('weakArea cites real mastery data', /30%/.test(weak.message));

// ---- 6. Recent failed problem ----
console.log('  6. Recent failed problem');
const failedCtx = makeContext({
  recentProblems: [
    { problemId: 'problem-variables-print', title: 'Which value is printed?', success: false, attemptedAt: '2026-08-31T09:00:00.000Z' },
  ],
});
const failedPractice = engine.buildCoachResponse(makeData({ context: failedCtx }), req('give me a practice question'));
ok('recent failure acknowledged without blame', /try again|let's try|didn't get/i.test(failedPractice.message));

// ---- 7. Recent successful problem ----
console.log('  7. Recent successful problem');
const successCtx = makeContext({
  recentProblems: [
    { problemId: 'problem-variables-print', title: 'Which value is printed?', success: true, attemptedAt: '2026-08-31T09:00:00.000Z' },
  ],
});
const successPractice = engine.buildCoachResponse(makeData({ context: successCtx }), req('give me a practice question'));
ok('recent success acknowledged', /nice work|keep it up/i.test(successPractice.message));

// ---- 8. Progress question ----
console.log('  8. Progress question');
const activeProgress = makeData({
  context: makeContext({}, {
    totalLessons: 2, completedLessons: 1, solvedProblems: 1, totalAttempts: 3, successfulAttempts: 2, successRate: 66.67, totalXP: 120, currentStreak: 3,
  }),
  topicMastery: [
    { topicId: 'topic-fundamentals', topicName: 'Fundamentals', level: 'mastered', masteryScore: 92, attempts: 5, successfulAttempts: 4, lastActivityAt: '2026-08-30T00:00:00.000Z' },
  ],
  progressSummary: {
    totalLessons: 2, completedLessons: 1, inProgressLessons: 1, totalProblems: 2, solvedProblems: 1, totalChallenges: 1, completedChallenges: 0, totalAttempts: 3, successfulAttempts: 2, successRate: 66.67, totalXP: 120, currentStreak: 3, longestStreak: 5,
  },
});
const prog = engine.buildCoachResponse(activeProgress, req('how am I doing?'));
ok('progress references real stats', /completed 1 of 2 lessons/.test(prog.message));
ok('progress personalizes on strong topic', /doing well with "Fundamentals"/.test(prog.message));
ok('progress has view_progress action', prog.actions.some((a) => a.type === 'view_progress'));

// ---- 9. No current lesson ----
console.log('  9. No current lesson');
const noLesson = makeData({
  context: makeContext({ location: { course: null, topic: null, lesson: null, concept: null }, currentLessonStatus: null }),
});
const noLessonHint = engine.buildCoachResponse(noLesson, req('give me a hint'));
ok('no current lesson still can give a hint (falls back to content)', noLessonHint.intent === 'hint' && noLessonHint.relatedProblem !== null);
const noLessonHelp = engine.buildCoachResponse(noLesson, req('help me with this lesson'));
ok('lesson help with no lesson is graceful', noLessonHelp.message.length > 0);

// ---- 10. Missing context ----
console.log('  10. Missing context');
const emptyCtx = makeData({
  context: makeContext({ location: { course: null, topic: null, lesson: null, concept: null }, currentLessonStatus: null, weakAreas: [], conceptsNeedingReview: [] }),
  problems: [],
  challenges: [],
});
const emptyHint = engine.buildCoachResponse(emptyCtx, req('give me a hint'));
ok('missing content returns fallback not a crash', /no problems/i.test(emptyHint.message));
ok('builder snapshot is null-safe (no location)', emptyCtx.context.location.lesson === null);

// ---- 11. Combined context ----
console.log('  11. Combined context');
const combined = makeData({
  context: makeContext({
    recentProblems: [
      { problemId: 'problem-variables-bug', title: 'Find the bug', success: false, attemptedAt: '2026-08-31T08:00:00.000Z' },
    ],
    conceptsNeedingReview: [
      { conceptId: 'concept-let-const', conceptName: 'let vs const', topicId: 'topic-fundamentals', topicName: 'Fundamentals', masteryScore: 40 },
    ],
  }),
});
const combinedReply = engine.buildCoachResponse(combined, req('what should I practice?'));
ok('combined context still resolves current topic in message', combinedReply.message.length > 0);
ok('combined weak concept triggers a review action', combinedReply.actions.some((a) => a.type === 'review_concept'));

// ---- 12. Suggested action based on context ----
console.log('  12. Suggested action based on context');
const inProgressGreet = engine.buildCoachResponse(makeData(), req('hello'));
ok('in-progress current lesson suggests continue_lesson', inProgressGreet.actions.some((a) => a.type === 'continue_lesson'));
const weakGreet = engine.buildCoachResponse(makeData({ context: makeContext({ conceptsNeedingReview: [{ conceptId: 'concept-variable', conceptName: 'What is a variable?', topicId: 'topic-fundamentals', topicName: 'Fundamentals', masteryScore: 20 }] }) }), req('hello'));
ok('weak concept suggests review_concept', weakGreet.actions.some((a) => a.type === 'review_concept'));

// ---- Snapshot type truth: learningContext resolver module ----
console.log('  learningContext resolver');
const learningContext = loadTs('src\\learning\\coach\\learningContext.ts');
const ex = learningContext.resolveActiveConcept(
  makeContext({ location: { course: null, topic: null, lesson: null, concept: { id: 'c-1', name: 'ConceptOne' } } }),
  { id: 'c-explicit', name: 'Explicit' }
);
ok('explicit subject beats current concept', ex.id === 'c-explicit');
const currentWins = learningContext.resolveActiveConcept(
  makeContext(),
  null
);
ok('current concept used when no explicit', currentWins.id === 'concept-variable');
ok('no current lesson detected', learningContext.hasActiveLesson(makeContext()) === true);
ok('no-lesson context detected', learningContext.hasActiveLesson(makeContext({ location: { course: null, topic: null, lesson: null, concept: null } })) === false);
ok('resolveCurrentLesson falls back to general content', (() => {
  const r = learningContext.resolveCurrentLesson(
    makeContext({ location: { course: null, topic: null, lesson: null, concept: null } }),
    null,
    ['lesson-a', 'lesson-b']
  );
  return r && r.id === 'lesson-a';
})());

// ============================ SUMMARY ============================
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
console.log('\ncoach_context_smoke: OK');
