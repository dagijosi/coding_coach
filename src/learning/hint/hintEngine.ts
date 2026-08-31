// ---------------------------------------------------------------------------
// HintEngine (Phase 7 Step 4) — pure, deterministic, React/DB-free.
//
// The Socratic coach's hint layer. It composes the Step 2 hint progression
// (hintProgression.nextHintFor) with attempt/success awareness, a levels
// classification of the existing hints, an explicit-solution policy, and
// suggested actions. It NEVER writes to any store and NEVER invents hint text
// not present in the content model.
// ---------------------------------------------------------------------------

import { nextHintFor } from '@/learning/coach/hintProgression';
import type { SuggestedAction } from '@/learning/coach/coachTypes';
import type {
  HintCommandInput,
  HintCommandResult,
  HintLevel,
} from './hintTypes';

const TUTOR_OPENERS = [
  'Think about',
  'Try checking',
  'Look at',
  'Remember',
  "Let's break this down",
];

/**
 * Classifies an existing hint by its position in the ordered list. The list is
 * divided into thirds to give a conceptual -> specific -> implementation ramp.
 * This is a label; the hint's own `content` is never altered.
 */
export function hintLevelFor(index: number, total: number): HintLevel {
  if (total <= 1) {
    return 'conceptual';
  }
  const lastThirdStart = total - Math.max(1, Math.floor(total / 3));
  const firstThirdEnd = Math.floor(total / 3);
  if (index > lastThirdStart) {
    return 'implementation';
  }
  if (index > firstThirdEnd) {
    return 'specific';
  }
  return 'conceptual';
}

/**
 * Drafts the tutorial-styled hint line, prefixed with a random-of-none tutor
 * opener chosen deterministically from the learner's progress so the phrasing
 * stays consistent for a fixed state (i.e. always the first helper here).
 */
function draftHintLine(content: string): string {
  // Keep phrasing deterministic for a fixed snapshot: lead with a tutor phrase.
  return `${TUTOR_OPENERS[0]}:\n\n${content}`;
}

/**
 * Builds a "review this concept" action when the learner is struggling and a
 * relevant concept is known.
 */
function reviewAction(concept: { id: string; name: string } | null): SuggestedAction[] {
  if (!concept) {
    return [];
  }
  return [{ type: 'review_concept', targetId: concept.id, title: `Review "${concept.name}"` }];
}

export function commandHint(input: HintCommandInput): HintCommandResult {
  const { target, kind, history, attempt, concept } = input;

  // ---- Explicit solution request -----------------------------------------
  if (kind === 'solution') {
    const solutionText = target.explanation.trim();
    if (solutionText.length === 0) {
      // No stored solution: be honest and fall back to the strongest hint.
      const lastHint = [...target.hints].sort((a, b) => a.order - b.order).pop();
      if (lastHint) {
        return {
          kind: 'no-hints',
          message: `I don't have a full written solution stored for "${target.title}", so I can't show you the answer directly. Here is the most specific hint I have to help you work it out yourself:\n\n${lastHint.content}`,
          hintLevel: 'implementation',
          actions: [
            { type: 'practice_problem', targetId: target.id, title: `Try "${target.title}"` },
            ...reviewAction(concept),
          ],
        };
      }
      return {
        kind: 'no-hints',
        message: `I don't have a full written solution stored for "${target.title}", and there are no hints available either. Please reread the lesson and try again.`,
        hintLevel: 'implementation',
        actions: input.lessonId
          ? [{ type: 'open_lesson', targetId: input.lessonId, title: 'Review the lesson' }]
          : [],
      };
    }
    // A stored walkthrough exists — reveal it (section 11 allows revealing
    // stored content when the learner explicitly asks).
    return {
      kind: 'solution',
      message: `Here is the walkthrough for "${target.title}":\n\n${solutionText}`,
      hintLevel: 'implementation',
      actions: [
        { type: 'retry_problem', targetId: target.id, title: `Try "${target.title}" again` },
      ],
    };
  }

  // ---- Success awareness ---------------------------------------------------
  if (attempt === 'solved' && input.solved) {
    return {
      kind: 'already-solved',
      message: `You've already solved "${target.title}" — nice work. Rather than another hint, try moving on to the next practice.`,
      hintLevel: 'conceptual',
      actions: [
        { type: 'practice_problem', targetId: target.id, title: `Find another problem` },
      ],
    };
  }

  // ---- Progressive hint (normal path) -------------------------------------
  const progression = nextHintFor(target.id, target.hints, history);

  if (progression.kind === 'none') {
    // No stored hints — fall back to the concept (if any) for guidance.
    if (concept) {
      return {
        kind: 'no-hints',
        message: `I don't have stored hints for "${target.title}", but this is about "${concept.name}" (${concept.summary}). Revisit that idea and try again.`,
        hintLevel: 'conceptual',
        actions: [
          { type: 'practice_problem', targetId: target.id, title: `Try "${target.title}"` },
          ...reviewAction(concept),
        ],
      };
    }
    return {
      kind: 'no-hints',
      message: `I don't have stored hints for "${target.title}" yet, so I can only suggest you reread the lesson and try again.`,
      hintLevel: 'conceptual',
      actions: input.lessonId
        ? [{ type: 'open_lesson', targetId: input.lessonId, title: 'Review the lesson' }]
        : [],
    };
  }

  if (progression.kind === 'hint') {
    const level = hintLevelFor(progression.index, progression.total);
    const isStruggling = attempt === 'unsolved-failed';
    const attemptPrefix = isStruggling
      ? `It looks like this is a tricky one. Remember you can ask me to review the concept first.\n\n`
      : '';
    const conceptLine = isStruggling && concept
      ? `Think about the key idea: ${concept.summary}\n\n`
      : '';
    return {
      kind: 'hint',
      message: `${attemptPrefix}You're at hint ${progression.index} of ${progression.total} for "${target.title}". ${conceptLine}${draftHintLine(progression.hint.content)}`,
      hintLevel: level,
      index: progression.index,
      total: progression.total,
      revealedHintId: progression.hint.id,
      actions: [
        { type: 'practice_problem', targetId: target.id, title: `Try "${target.title}"` },
        ...(isStruggling ? reviewAction(concept) : []),
      ],
    };
  }

  // All hints have been shown — gently move to the stored explanation.
  return {
    kind: 'all-hints-shown',
    message: `You've seen every hint for "${target.title}". Here is the explanation to help you understand it:\n\n${target.explanation}`,
    hintLevel: 'implementation',
    actions: [
      { type: 'retry_problem', targetId: target.id, title: `Try "${target.title}" again` },
    ],
  };
}

