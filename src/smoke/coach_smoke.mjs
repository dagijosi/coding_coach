// Smoke tests for Phase 7 Step 2 — Coach Response Engine.
//
// The pure engine modules (coachEngine.ts, intent.ts, contentMatch.ts,
// hintProgression.ts, practiceSelection.ts, coachTypes.ts) are REQUIRED and
// imported directly via the project's TypeScript transpile-and-run harness
// (same as the Phase 6 smoke tests). The loader (coachService.ts) only reads
// repositories whose SQL is already covered elsewhere, so the scenarios here
// exercise the engine's deterministic decision logic with schema-realistic
// content and learner data.
import * as assertModule from 'node:assert';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);

const REPO = 'D:\\Projects\\Personal\\pp\\coding-coach';
const assert = assertModule.strict ?? assertModule;

function transpile(relPath) {
  const abs = `${REPO}\\${relPath}`;
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

// Load pure engine modules. All type-only imports are stripped by the
// transpiler, so only the relative value imports need explicit deps.
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
// Content fixtures matching the real schema relationships
// ---------------------------------------------------------------------------
const LESSON_VARIABLES = {
  id: 'lesson-variables', topicId: 'topic-fundamentals', title: 'Variables',
  description: 'Learn how JavaScript stores values in named containers.',
  language: 'javascript', difficulty: 'beginner', estimatedMinutes: 15,
  order: 1, prerequisites: [],
  content: [
    { type: 'text', content: 'A variable is a named place to store a value.' },
  ],
};
const LESSON_FUNCTIONS = {
  id: 'lesson-functions', topicId: 'topic-functions', title: 'Functions',
  description: 'Learn how to define and call functions.',
  language: 'javascript', difficulty: 'beginner', estimatedMinutes: 15,
  order: 2, prerequisites: [], content: [],
};

const CONCEPT_VARIABLE = {
  id: 'concept-variable', lessonId: 'lesson-variables', name: 'What is a variable?',
  summary: 'A variable is a named container for storing a value in memory.', order: 1,
};
const CONCEPT_LET_CONST = {
  id: 'concept-let-const', lessonId: 'lesson-variables', name: 'let vs const',
  summary: 'const creates a binding that cannot be reassigned; let allows reassignment.', order: 2,
};

const PROBLEM_PRINT = {
  id: 'problem-variables-print', lessonId: 'lesson-variables',
  title: 'Which value is printed?', description: 'Predict what the code prints.',
  type: 'predict-output', difficulty: 'beginner', order: 1,
  prompt: 'const name = \'Dagi\';\nconsole.log(name);',
  choices: ['Hello', 'Dagi', 'undefined'], answer: 1,
  hints: [
    { id: 'hint-print-1', content: 'Look at the value assigned to name.', order: 1 },
    { id: 'hint-print-2', content: 'console.log outputs what name holds.', order: 2 },
  ],
  explanation: 'The variable name holds the string Dagi, so it prints Dagi.',
};
const PROBLEM_BUG = {
  id: 'problem-variables-bug', lessonId: 'lesson-variables', title: 'Find the bug',
  description: 'This code tries to create a constant.', type: 'debugging',
  difficulty: 'beginner', order: 2, prompt: 'const name = \'Dagi\';\nname = \'Ada\';',
  choices: ['Fine', 'Cannot reassign const', 'Use var'], answer: 1,
  hints: [
    { id: 'hint-bug-1', content: 'Remember what const guarantees.', order: 1 },
    { id: 'hint-bug-2', content: 'Reassigning const throws.', order: 2 },
  ],
  explanation: 'const cannot be reassigned; this throws a TypeError.',
};

const CHALLENGE_PRINT = {
  id: 'challenge-print', lessonId: 'lesson-variables', title: 'Print a variable',
  description: 'Write a function that prints a variable.', difficulty: 'easy', order: 1,
  functionName: 'printVar', starterCode: 'function printVar() {}',
  testCases: [{ id: 'tc1', args: [], expected: 'Dagi' }],
  hints: [{ id: 'hint-ch-1', content: 'Use a variable.', order: 1 }],
  explanation: 'Declare a variable and print it.',
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
    progress: Object.assign({
      totalLessons: 2, completedLessons: 0, inProgressLessons: 1,
      totalProblems: 2, solvedProblems: 0, totalChallenges: 1,
      completedChallenges: 0, totalAttempts: 0, successfulAttempts: 0,
      successRate: 0, totalXP: 0, currentStreak: 0, longestStreak: 0,
    }, progress),
    currentLessonStatus: 'in-progress',
  }, overrides);
}

const DEFAULT_PROGRESS = makeContext().progress;

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

console.log('\nPhase 7 Step 2 \u2014 Coach Response Engine smoke test\n');

// ---- 1. Greeting ----
console.log('  Greeting');
const greeting = engine.buildCoachResponse(
  makeData(),
  req('hello there')
);
ok('greeting intent', greeting.intent === 'greeting');
ok('greeting mentions help options', /explain|hint|practice|doing/i.test(greeting.message));

// ---- 2. Concept definition ----
console.log('  Concept definition');
const def = engine.buildCoachResponse(makeData(), req('what is a variable?'));
ok('definition intent', def.intent === 'definition');
ok('definition has related concept', def.relatedConcept?.id === 'concept-variable');
ok('definition contains real summary', def.message.includes('named container'));
ok('definition suggests lesson', def.relatedLesson?.id === 'lesson-variables');
ok('definition has open_lesson action', def.actions.some((a) => a.type === 'open_lesson'));

// ---- 3. Concept explanation ----
console.log('  Concept explanation');
const expl = engine.buildCoachResponse(makeData(), req('explain functions'));
ok('explanation intent', expl.intent === 'explanation');
ok('explanation returns content', expl.message.length > 0);
const explConcept = engine.buildCoachResponse(makeData(), req('explain let vs const'));
ok('explanation with concept', explConcept.relatedConcept?.id === 'concept-let-const');
ok('explanation suggests a practice problem', explConcept.actions.some((a) => a.type === 'practice_problem'));

// ---- 4. Hint request (first hint) ----
console.log('  Hint request');
const hint1 = engine.buildCoachResponse(makeData(), req('give me a hint'));
ok('hint intent', hint1.intent === 'hint');
ok('hint reveals hint 1 of 2', /hint 1 of 2/.test(hint1.message));
ok('hint does NOT reveal the answer', !hint1.message.includes('prints Dagi'));
ok('hint exposes revealedHintId', hint1.revealedHintId === 'hint-print-1');

// ---- 11. Multiple hints (progression) ----
console.log('  Multiple hints progression');
const historyAfterHint1 = [
  { role: 'user', content: 'give me a hint' },
  { role: 'assistant', content: `${hintProg.hintMessageId('problem-variables-print', 'hint-print-1')}\n${hint1.message}` },
];
const hint2 = engine.buildCoachResponse(makeData(), req('give me a hint', historyAfterHint1));
ok('second hint is hint 2 of 2', /hint 2 of 2/.test(hint2.message));
ok('second hint reveals different content', hint2.revealedHintId === 'hint-print-2');

const historyAfterHint2 = [
  ...historyAfterHint1,
  { role: 'assistant', content: `${hintProg.hintMessageId('problem-variables-print', 'hint-print-2')}\n${hint2.message}` },
];
const hint3 = engine.buildCoachResponse(makeData(), req('give me a hint', historyAfterHint2));
ok('after all hints, moves to explanation', /explanation|understand/i.test(hint3.message));
ok('explanation mentions the real explanation', hint3.message.includes('prints Dagi') || hint3.message.includes('Dagi'));

// ---- 5. Practice request ----
console.log('  Practice request');
const practice = engine.buildCoachResponse(makeData(), req('give me a practice question'));
ok('practice intent', practice.intent === 'practice');
ok('practice returns a real problem', practice.relatedProblem?.id === 'problem-variables-print');
ok('practice has practice_problem action', practice.actions.some((a) => a.type === 'practice_problem'));

// Practice prefers unsolved over solved.
const solvedData = makeData({ solvedProblemIds: new Set(['problem-variables-print']) });
const practice2 = engine.buildCoachResponse(solvedData, req('give me another question'));
ok('practice avoids solved problem', practice2.relatedProblem?.id !== 'problem-variables-print');

// ---- 6. Progress request ----
console.log('  Progress request');
const activeProgress = makeData({
  progressSummary: {
    ...makeData().progressSummary,
    completedLessons: 1,
    totalLessons: 2,
    solvedProblems: 1,
    totalProblems: 2,
    totalAttempts: 3,
    successfulAttempts: 2,
    successRate: 66.67,
    totalXP: 120,
    currentStreak: 3,
  },
});
const prog = engine.buildCoachResponse(activeProgress, req('how am I doing?'));
ok('progress intent', prog.intent === 'progress');
ok('progress references real stats', /completed 1 of 2 lessons/.test(prog.message));
ok('progress references XP', /120 XP/.test(prog.message));
ok('progress has view_progress action', prog.actions.some((a) => a.type === 'view_progress'));

const fresh = engine.buildCoachResponse(
  makeData({ progressSummary: { ...makeData().progressSummary, totalLessons: 2, completedLessons: 0, totalProblems: 2, solvedProblems: 0, totalAttempts: 0, successfulAttempts: 0, successRate: 0, totalXP: 0, currentStreak: 0, longestStreak: 0 } }),
  req('how am I doing?')
);
ok('new learner gets a start message', /start|begin/i.test(fresh.message));

// ---- 7. Weak-area request ----
console.log('  Weak-area request');
const weakData = makeData({
  weakAreas: [
    { id: 'wa-1', kind: 'topic', targetId: 'topic-functions', targetName: 'Functions',
      topicId: 'topic-functions', topicName: 'Functions', masteryScore: 20,
      attempts: 3, successfulAttempts: 1, successRate: 0.33, lastActivityAt: '2026-08-01T00:00:00.000Z',
      reason: 'Low success rate', priority: 1 },
  ],
});
const weak = engine.buildCoachResponse(weakData, req('what am I weak at?'));
ok('weakArea intent', weak.intent === 'weakArea');
ok('weakArea names the weak topic', weak.message.includes('Functions'));
ok('weakArea suggests a specific problem', weak.relatedProblem || weak.relatedChallenge);
ok('weakArea has a practice action', weak.actions.some((a) => a.type === 'practice_problem' || a.type === 'try_challenge'));

// ---- 8. Unknown question ----
console.log('  Unknown question');
const unknown = engine.buildCoachResponse(makeData(), req('tell me the weather in Tokyo'));
ok('unknown intent', unknown.intent === 'unknown');
ok('unknown does not hallucinate', /not sure|I can currently help/.test(unknown.message));

// ---- 9. Missing concept ----
console.log('  Missing concept');
const missingDef = engine.buildCoachResponse(makeData(), req('what is a quasar?'));
ok('missing concept returns fallback', /(do not|don't) have a definition|in Coding Coach/i.test(missingDef.message));
ok('missing definition no hallucinated fact', !missingDef.message.includes('quark'));

// ---- 10. Missing problem (no current lesson / no problems) ----
console.log('  Missing problem');
const noProbs = engine.buildCoachResponse(
  makeData({
    context: makeContext({ location: { course: null, topic: null, lesson: null, concept: null }, currentLessonStatus: null }),
    problems: [],
  }),
  req('give me a hint')
);
ok('hint with no problems returns fallback', /no problems/i.test(noProbs.message));

const noProbsPractice = engine.buildCoachResponse(
  makeData({ problems: [], challenges: [], solvedProblemIds: new Set() }),
  req('give me a practice question')
);
ok('practice with no content returns fallback', /no practice content/i.test(noProbsPractice.message));

// ---- 12. Suggested actions ----
console.log('  Suggested actions');
const withActions = engine.buildCoachResponse(makeData(), req('what is a variable?'));
const actionTypes = withActions.actions.map((a) => a.type);
ok('suggested action is open_lesson', actionTypes.includes('open_lesson'));
ok('action carries an id reference', withActions.actions[0].targetId.length > 0);

// ---- Intent detection unit checks ----
console.log('  Intent detection');
ok('detect greeting', intent.detectIntent('hey') === 'greeting');
ok('detect hint', intent.detectIntent('I need a hint') === 'hint');
ok('detect practice', intent.detectIntent('give me another problem') === 'practice');
ok('detect progress', intent.detectIntent('what have I completed?') === 'progress');
ok('detect weak area', intent.detectIntent('what should I practice?') === 'weakArea');
ok('detect definition', intent.detectIntent('what is a variable?') === 'definition');
ok('detect explanation', intent.detectIntent('explain functions') === 'explanation');
ok('detect unknown', intent.detectIntent('gibberish xyz') === 'unknown');

// ---- Hint progression unit checks ----
console.log('  Hint progression module');
const progUnit = hintProg.nextHintFor('problem-variables-print', PROBLEM_PRINT.hints, []);
ok('first hint returned', progUnit.kind === 'hint' && progUnit.hint.id === 'hint-print-1');
const allShown = hintProg.nextHintFor('problem-variables-print', PROBLEM_PRINT.hints, [
  { role: 'assistant', content: 'hint:problem-variables-print:hint-print-1' },
  { role: 'assistant', content: 'hint:problem-variables-print:hint-print-2' },
]);
ok('all hints shown detected', allShown.kind === 'all-hints-shown');
const noneHints = hintProg.nextHintFor('problem-x', [], []);
ok('no-hints detected', noneHints.kind === 'none');

// ---- Practice selection unit checks ----
console.log('  Practice selection module');
const selection = practiceSel.selectPractice({
  lessons: [LESSON_VARIABLES, LESSON_FUNCTIONS],
  problems: [PROBLEM_PRINT, PROBLEM_BUG],
  challenges: [CHALLENGE_PRINT],
  currentLessonId: 'lesson-variables',
  solvedProblemIds: new Set(),
  completedChallengeIds: new Set(),
  weakAreas: [],
});
ok('practice selection picks unsolved current-lesson problem', selection.kind === 'problem' && selection.problem.id === 'problem-variables-print');

// ---- Additional intents: help, example, lessonHelp, problemHelp ----
console.log('  Additional intents');
const help = engine.buildCoachResponse(makeData(), req('I do not understand this'));
ok('help intent', help.intent === 'help');
ok('help lists capabilities', /hint|practice|progress|explain/i.test(help.message));

const example = engine.buildCoachResponse(makeData(), req('show me an example'));
ok('example intent', example.intent === 'example');
ok('example returns a problem', example.relatedProblem?.id === 'problem-variables-print');

const lessonHelp = engine.buildCoachResponse(makeData(), req('help me with this lesson'));
ok('lessonHelp intent', lessonHelp.intent === 'lessonHelp');
ok('lessonHelp references current lesson', lessonHelp.relatedLesson?.id === 'lesson-variables');

const problemHelp = engine.buildCoachResponse(makeData(), req('help me with this problem'));
ok('problemHelp intent', problemHelp.intent === 'problemHelp');

// Hint marker round-trip enables progression from persisted history.
const marker = hintProg.hintMessageId('problem-variables-print', 'hint-print-1');
const persistedAs = `${marker}\n${hint1.message}`;
const reparse = engine.buildCoachResponse(
  makeData(),
  req('give me a hint', [
    { role: 'user', content: 'give me a hint' },
    { role: 'assistant', content: persistedAs },
  ])
);
ok('hint marker round-trip advances progression', reparse.intent === 'hint' && /hint 2 of 2/.test(reparse.message));

// ============================ SUMMARY ============================
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
console.log('\ncoach_smoke: OK');
