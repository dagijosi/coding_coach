// ---------------------------------------------------------------------------
// Practice selection (Phase 7 Step 2) — pure, deterministic.
//
// Picks an existing problem (or challenge) for a practice request. It never
// invents problems: it selects from the real content, preferring content the
// learner has not yet solved, biased toward the current lesson/topic and the
// weakest areas. A just-completed problem is only returned when no better
// alternative exists.
// ---------------------------------------------------------------------------

import type { Challenge, Lesson, Problem } from '@/types/learning';
import type { WeakArea } from '@/learning/weakareas/weakAreaTypes';

export type PracticeSelection =
  | {
      kind: 'problem';
      problem: Problem;
      reason: string;
    }
  | {
      kind: 'challenge';
      challenge: Challenge;
      reason: string;
    }
  | { kind: 'none'; reason: string };

type PickInput = {
  lessons: Lesson[];
  problems: Problem[];
  challenges: Challenge[];
  currentLessonId: string;
  solvedProblemIds: ReadonlySet<string>;
  completedChallengeIds: ReadonlySet<string>;
  weakAreas: WeakArea[];
};

function lessonTopicId(
  lessons: Lesson[],
  lessonId: string | null
): string | null {
  return lessonId
    ? (lessons.find((l) => l.id === lessonId)?.topicId ?? null)
    : null;
}

/**
 * The preferred practice selection. Deterministic ordering:
 *
 *   1. an unsolved problem in the current lesson
 *   2. an unsolved problem in a weak-area topic
 *   3. any unsolved problem (path order)
 *   4. an unpassed challenge in a weak-area topic (lesson completed)
 *   5. any remaining problem or challenge
 *
 * Falls back to an already-solved item only when nothing unsolved remains.
 */
export function selectPractice(input: PickInput): PracticeSelection {
  const unsolved = input.problems.filter(
    (p) => !input.solvedProblemIds.has(p.id)
  );
  const solved = input.problems.filter((p) =>
    input.solvedProblemIds.has(p.id)
  );

  const weakTopicIds = new Set<string>();
  for (const wa of input.weakAreas) {
    if (wa.targetId) {
      weakTopicIds.add(wa.targetId);
    }
    if (wa.topicId) {
      weakTopicIds.add(wa.topicId);
    }
  }

  // 1. Unsolved problem in the current lesson.
  if (input.currentLessonId) {
    const inLesson = unsolved.find(
      (p) => p.lessonId === input.currentLessonId
    );
    if (inLesson) {
      return {
        kind: 'problem',
        problem: inLesson,
        reason: `Here is a problem for the "current lesson": "${inLesson.title}".`,
      };
    }
  }

  // 2. Unsolved problem in a weak-area topic.
  if (weakTopicIds.size > 0) {
    const inWeak = unsolved.find((p) => {
      const topicId = lessonTopicId(input.lessons, p.lessonId);
      return topicId ? weakTopicIds.has(topicId) : false;
    });
    if (inWeak) {
      return {
        kind: 'problem',
        problem: inWeak,
        reason: `This problem targets a topic you are working on: "${inWeak.title}".`,
      };
    }
  }

  // 3. Any unsolved problem, in path order.
  if (unsolved.length > 0) {
    return {
      kind: 'problem',
      problem: unsolved[0],
      reason: `Here is a problem you have not solved yet: "${unsolved[0].title}".`,
    };
  }

  // 4. Unpassed challenge in a weak-area topic.
  if (weakTopicIds.size > 0) {
    const inWeak = input.challenges.find((c) => {
      if (input.completedChallengeIds.has(c.id)) {
        return false;
      }
      const topicId = lessonTopicId(input.lessons, c.lessonId);
      return topicId ? weakTopicIds.has(topicId) : false;
    });
    if (inWeak) {
      return {
        kind: 'challenge',
        challenge: inWeak,
        reason: `Try this challenge for a topic you are working on: "${inWeak.title}".`,
      };
    }
  }

  // 5. Any challenge not yet passed.
  const unpassed = input.challenges.find(
    (c) => !input.completedChallengeIds.has(c.id)
  );
  if (unpassed) {
    return {
      kind: 'challenge',
      challenge: unpassed,
      reason: `Try this challenge: "${unpassed.title}".`,
    };
  }

  // Fallback: everything is solved — offer a solved problem for review.
  if (solved.length > 0) {
    return {
      kind: 'problem',
      problem: solved[0],
      reason: `You have solved everything available. Here is "${solved[0].title}" again to review.`,
    };
  }

  return {
    kind: 'none',
    reason: 'No practice content is available.',
  };
}
