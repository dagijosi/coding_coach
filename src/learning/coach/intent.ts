// ---------------------------------------------------------------------------
// Intent detection (Phase 7 Step 2) — pure, deterministic, React/DB-free.
//
// Maps a learner's message to one of the supported intents using simple
// keyword rules. This is intentionally NOT an NLP system: it is a small,
// maintainable matcher whose output is predictable for any input.
//
// Rules are checked in priority order; the first match wins. The fallback is
// `unknown`.
// ---------------------------------------------------------------------------

import type { CoachIntent } from './coachTypes';

const GREETING = [
  'hi',
  'hello',
  'hey',
  'good morning',
  'good afternoon',
  'good evening',
  'howdy',
  'yo',
];

const HINT = ['hint', 'nudge', 'clue', 'stuck', 'give me a hint', 'help me start'];

const PRACTICE = [
  'practice',
  'question',
  'exercise',
  'quiz',
  'another problem',
  'more problems',
  'give me a problem',
  'give me a question',
  'challenge me',
];

const PROGRESS = [
  'how am i doing',
  'my progress',
  'what have i completed',
  'how have i been doing',
  'progress',
  'how far',
  'what did i complete',
  'displayed my progress',
];

const WEAK_AREA = [
  'weak',
  'weakest',
  'struggle',
  'struggling',
  'what should i practice',
  'what should i work on',
  'what am i bad at',
];

const LESSON_HELP = [
  'lesson',
  'what is the lesson',
  'current lesson',
  'this lesson',
];

const PROBLEM_HELP = [
  'this problem',
  'the problem',
  'this question',
  'problem help',
  'current problem',
];

const DEFINITION = [
  'what is',
  'what are',
  'what does',
  'define',
  'definition',
  'meaning of',
];

const EXPLANATION = [
  'explain',
  'what is',
  'explain how',
  'how does',
  'how do',
  'how to',
  'tell me about',
  'explain why',
];

const HELP = [
  'help',
  'i do not understand',
  "i don't understand",
  'i dont understand',
  'confused',
  'can you help',
];

const EXAMPLE = [
  'example',
  'show me an example',
  'illustration',
  'for instance',
];

const SOLUTION = [
  'show me the answer',
  'give me the solution',
  'show me the solution',
  'what is the answer',
  'the answer',
  'the solution',
  'solution please',
  'answer please',
];

function hasAny(text: string, words: readonly string[]): boolean {
  // Word-boundary aware: "hi" must match as a whole word, not inside "hint".
  const wordRe = new RegExp(`(?:^|[^a-z0-9])(${words.join('|')})(?=$|[^a-z0-9])`);
  return wordRe.test(text);
}

/**
 * Resolves a message to a single intent. The message is lowercased and
 * trimmed before matching. Deterministic: the same message always maps to the
 * same intent.
 */
export function detectIntent(message: string): CoachIntent {
  const text = message.trim().toLowerCase();

  if (text.length === 0) {
    return 'unknown';
  }

  if (hasAny(text, GREETING)) {
    return 'greeting';
  }

  if (hasAny(text, HINT)) {
    return 'hint';
  }

  if (hasAny(text, WEAK_AREA)) {
    return 'weakArea';
  }

  if (hasAny(text, PROGRESS)) {
    return 'progress';
  }

  if (hasAny(text, PRACTICE)) {
    return 'practice';
  }

  if (hasAny(text, PROBLEM_HELP)) {
    return 'problemHelp';
  }

  if (hasAny(text, SOLUTION)) {
    return 'solution';
  }

  if (hasAny(text, LESSON_HELP)) {
    return 'lessonHelp';
  }

  if (hasAny(text, DEFINITION)) {
    return 'definition';
  }

  if (hasAny(text, EXPLANATION)) {
    return 'explanation';
  }

  if (hasAny(text, EXAMPLE)) {
    return 'example';
  }

  if (hasAny(text, HELP)) {
    return 'help';
  }

  return 'unknown';
}

/**
 * The noun a definition/explanation request is about. Looks for the first
 * two-word "what is X" / "explain X" pattern and strips leading articles so
 * "what is a variable?" yields "variable" (not "a variable").
 */
export function extractTopic(message: string): string {
  const text = message.trim().toLowerCase();

  let phrase = '';

  const whatIs = /what (is|are)\s+([a-z0-9_-]+)(\s+[a-z0-9_-]+)?/.exec(text);
  if (whatIs) {
    phrase = (whatIs[2] + (whatIs[3] ?? '')).trim();
  } else {
    const define =
      /(?:define|definition of|meaning of)\s+([a-z0-9_-]+)(\s+[a-z0-9_-]+)?/.exec(
        text
      );
    if (define) {
      phrase = (define[1] + (define[2] ?? '')).trim();
    } else {
      const explain =
        /explain\s+([a-z0-9_-]+)(\s+[a-z0-9_-]+)?/.exec(text);
      if (explain) {
        phrase = (explain[1] + (explain[2] ?? '')).trim();
      }
    }
  }

  // Strip a leading article so the bare noun is matched against content.
  return phrase.replace(/^(a|an|the)\s+/, '');
}
