// ---------------------------------------------------------------------------
// ExplanationEngine (Phase 7 Step 4) — pure, deterministic, React/DB-free.
//
// Builds explanations from existing Coding Coach content and learner data.
// Every section shown is backed by a real stored field; the engine never
// fabricates examples, mistakes, or reasoning. Answers are withheld until the
// learner explicitly asks for the solution.
// ---------------------------------------------------------------------------

import type { CodeTestResult } from '@/code/types';
import type { ConceptRef, LessonRef, ProblemRef, ExplanationResult } from './explanationTypes';

function practiceAction(problem: ProblemRef): ExplanationResult['actions'] {
  return [
    { type: 'practice_problem', targetId: problem.id, title: `Practice "${problem.title}"` },
  ];
}

/**
 * A concept explanation using a teaching structure, but only including
 * sections the stored content actually supports.
 */
export function explainConcept(input: {
  concept: ConceptRef;
  lesson: LessonRef | null;
  relatedProblem: ProblemRef | null;
}): ExplanationResult {
  const { concept, lesson, relatedProblem } = input;

  const whatItIs = concept.summary.trim();
  const whyItMatters = lesson && lesson.description.trim().length > 0 ? lesson.description.trim() : null;
  const textBlocks = lesson
    ? lesson.content.filter((b) => b.type === 'text' && b.content.trim().length > 0).map((b) => b.content.trim())
    : [];
  const simpleExample = textBlocks.length > 0 ? textBlocks[0] : null;
  const commonMistake = textBlocks.length > 1 ? textBlocks[1] : null;

  const sections: ExplanationResult['message'][] = [];
  if (whatItIs) {
    sections.push(`What it is\n\n${whatItIs}`);
  }
  if (whyItMatters) {
    sections.push(`Why it matters\n\n${whyItMatters}`);
  }
  if (simpleExample) {
    sections.push(`A closer look\n\n${simpleExample}`);
  }
  if (commonMistake) {
    sections.push(`Watch out\n\n${commonMistake}`);
  }

  const actions = relatedProblem ? practiceAction(relatedProblem) : [];
  if (lesson) {
    actions.push({ type: 'open_lesson', targetId: lesson.id, title: `Open "${lesson.title}"` });
  }

  const message =
    sections.length > 0
      ? sections.join('\n\n')
      : `I only have a short note on "${concept.name}". Try opening its lesson for more detail.`;

  return { message, actions };
}

/** A lesson explanation built from its description and text content. */
export function explainLesson(input: {
  lesson: LessonRef;
  concept: ConceptRef | null;
  relatedProblem: ProblemRef | null;
}): ExplanationResult {
  const { lesson, concept, relatedProblem } = input;
  const textBlocks = lesson.content
    .filter((b) => b.type === 'text' && b.content.trim().length > 0)
    .map((b) => b.content.trim());
  const parts = [`${lesson.title}\n\n${lesson.description || 'This lesson covers an on-topic idea.'}`];
  if (textBlocks.length > 0) {
    parts.push(textBlocks.join('\n\n'));
  }
  if (concept) {
    parts.push(`Key concept: ${concept.name} — ${concept.summary}`);
  }
  const actions: ExplanationResult['actions'] = [];
  if (relatedProblem) {
    actions.push({ type: 'practice_problem', targetId: relatedProblem.id, title: `Practice "${relatedProblem.title}"` });
  }
  actions.push({ type: 'open_lesson', targetId: lesson.id, title: `Open "${lesson.title}"` });
  return { message: parts.join('\n\n'), actions };
}

/**
 * A problem explanation: what it tests, the concept involved, and the prompt.
 * Withholds the answer unless requested.
 */
export function explainProblem(input: {
  problem: ProblemRef;
  concept: ConceptRef | null;
  showPrompt: boolean;
}): ExplanationResult {
  const { problem, concept } = input;
  const parts = [`"${problem.title}" — ${problem.type.replace('-', ' ')}`];
  parts.push(problem.description);
  if (input.showPrompt && problem.prompt) {
    parts.push(`Prompt:\n${problem.prompt}`);
  }
  if (concept) {
    parts.push(`This tests "${concept.name}" (${concept.summary}).`);
  }
  parts.push('Try reasoning it through — ask me for a hint and I will guide you step by step.');
  return { message: parts.join('\n\n'), actions: practiceAction(problem) };
}

/** Explanation after an incorrect attempt. Withholds the answer. */
export function explainIncorrect(input: {
  problem: ProblemRef;
  concept: ConceptRef | null;
}): ExplanationResult {
  const { problem, concept } = input;
  const parts = [`That isn't quite right for "${problem.title}".`];
  if (concept) {
    parts.push(`This problem is about "${concept.name}": ${concept.summary}.`);
  }
  parts.push(`The stored walkthrough explains the reasoning once you've seen the hints. Try again — or ask me for the next hint.`);
  const actions = practiceAction(problem);
  if (input.concept) {
    actions.push({ type: 'review_concept', targetId: input.concept.id, title: `Review "${input.concept.name}"` });
  }
  return { message: parts.join('\n\n'), actions };
}

/** Short confirmation after a correct attempt, with honest performance note. */
export function explainCorrect(input: {
  problem: ProblemRef;
  concept: ConceptRef | null;
  succeeded: boolean;
}): ExplanationResult {
  const { problem, concept } = input;
  if (!input.succeeded) {
    return { message: 'Nice work on that one.', actions: practiceAction(problem) };
  }
  const parts = [`Nice work — that's correct.`];
  if (concept) {
    parts.push(`You applied "${concept.name}" correctly.`);
  }
  parts.push(`Here is the reasoning for "${problem.title}":\n${problem.explanation}`);
  const actions = practiceAction(problem);
  if (concept) {
    actions.push({ type: 'try_challenge', targetId: '', title: 'Try a challenge' });
  }
  return { message: parts.join('\n\n'), actions };
}

/**
 * Explanation of a Code Engine test run. Only claims what the test results
 * actually show: which tests passed/failed and their actual vs expected
 * values. Connects a failing test to the concept and offers the next hint.
 */
export function explainTestResult(input: {
  problem: ProblemRef | null;
  concept: ConceptRef | null;
  tests: CodeTestResult[];
}): ExplanationResult {
  const { problem, concept, tests } = input;
  if (tests.length === 0) {
    return { message: 'No test output was captured for this run, so I can only suggest you check your logic and retry.', actions: [] };
  }

  const failed = tests.filter((t) => !t.passed);
  const passedCount = tests.length - failed.length;

  const parts: string[] = [];
  parts.push(`Your solution didn't pass every test: ${passedCount} of ${tests.length} passed.`);

  const failures = failed.slice(0, 3).map((t) => {
    let line = `- This test didn't pass.`;
    if (t.actualValue !== undefined && t.expectedValue !== undefined) {
      line += ` Expected ${JSON.stringify(t.expectedValue)}, got ${JSON.stringify(t.actualValue)}.`;
    } else if (t.error) {
      line += ` It errored: ${t.error}`;
    }
    return line;
  });
  if (failures.length > 0) {
    parts.push(failures.join('\n'));
  }
  if (concept) {
    parts.push(`This is exercising "${concept.name}": ${concept.summary}.`);
  }
  parts.push('Look at the cases that failed and check what your code returns for those inputs.');

  const actions: ExplanationResult['actions'] = [];
  if (problem) {
    actions.push({ type: 'practice_problem', targetId: problem.id, title: `Retry "${problem.title}"` });
  }
  if (concept) {
    actions.push({ type: 'review_concept', targetId: concept.id, title: `Review "${concept.name}"` });
  }
  return { message: parts.join('\n\n'), actions };
}
