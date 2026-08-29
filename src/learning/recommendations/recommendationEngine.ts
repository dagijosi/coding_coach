// ---------------------------------------------------------------------------
// Recommendation engine — deterministic, rule-based, React/DB-free.
//
// This module decides WHAT to recommend from plain context data (progress +
// mastery + content hierarchy) produced by recommendationService.ts. It does
// not talk to SQLite, expo-sqlite, the network, or any random source:
//
//   - no Math.random() / random selection
//   - no AI / LLM decisions
//   - no wall-clock time (the only time-dependent data, the daily challenge,
//     is resolved by the caller and passed in as `daily`)
//
// The same context input always yields the same recommendations.
// ---------------------------------------------------------------------------

import {
  CHALLENGE_READY_MASTERY_MIN,
  DEFAULT_RECOMMENDATION_LIMIT,
  RECOMMENDATION_PRIORITIES,
  REVIEW_TOPIC_MASTERY_MAX,
  WEAK_TOPIC_MASTERY_MAX,
} from './recommendationTypes';
import type {
  LearningRecommendation,
  RecommendationType,
} from './recommendationTypes';
import type { TopicMastery } from '../mastery/masteryTypes';
import type { WeakArea } from '../weakareas/weakAreaTypes';
import type { DailyChallengeState } from '@/repositories/progressRepository';
import type { LessonStatus, Topic } from '@/types/learning';

// ---------------------------------------------------------------------------
// Context shapes (produced by the service from the existing repositories)
// ---------------------------------------------------------------------------

export type RecommendationLesson = {
  lessonId: string;
  topicId: string;
  title: string;
  pathOrder: number;
  status: LessonStatus;
};

export type RecommendationProblem = {
  id: string;
  lessonId: string;
  title: string;
  order: number;
};

export type RecommendationChallenge = {
  id: string;
  lessonId: string;
  title: string;
  order: number;
};

export type RecommendationContext = {
  /** All topics in course -> topic order. */
  topics: Topic[];
  /** Step 3 mastery keyed by topicId. */
  topicMastery: Map<string, TopicMastery>;
  /** Every lesson in path order (course -> topic -> lesson). */
  lessons: RecommendationLesson[];
  /** Every problem; order is arbitrary (the engine re-sorts by path). */
  problems: RecommendationProblem[];
  /** Every challenge in content order (the daily-pick basis). */
  challenges: RecommendationChallenge[];
  /** Problem ids that have at least one correct attempt. */
  solvedProblemIds: ReadonlySet<string>;
  /** Challenge ids that have at least one passed attempt. */
  completedChallengeIds: ReadonlySet<string>;
  /**
   * The lesson the learner should resume from progressRepository
   * getContinueLearningLessonId(): the most recently started in-progress
   * lesson, else the first not-yet-completed lesson. Null when the path is
   * fully complete.
   */
  resumeLessonId: string | null;
  /** Today's daily challenge selection and its derived state, if any. */
  daily: { challengeId: string; state: DailyChallengeState } | null;
  /**
   * Weak areas from the Step 5 detector (weakAreaService.getWeakAreas()).
   * Optional so the engine works standalone; when present, the practice_topic
   * reason reflects the weak-area signal (e.g. a low success rate) instead of
   * the generic mastery wording.
   */
  weakAreas?: readonly WeakArea[];
};

export type BuildRecommendationsOptions = {
  limit?: number;
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

const NO_ORDER = Number.MAX_SAFE_INTEGER;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function pct(score: number): string {
  return `${Math.round(score)}%`;
}

function makeCandidate(
  type: RecommendationType,
  targets: {
    topicId?: string | null;
    lessonId?: string | null;
    problemId?: string | null;
    challengeId?: string | null;
  },
  copy: {
    title: string;
    description: string;
    reason: string;
    confidence: number;
  }
): LearningRecommendation {
  const problemId = targets.problemId ?? null;
  const challengeId = targets.challengeId ?? null;
  const lessonId = targets.lessonId ?? null;
  const topicId = targets.topicId ?? null;

  const targetType = problemId
    ? 'problem'
    : challengeId
    ? 'challenge'
    : lessonId
    ? 'lesson'
    : 'topic';
  const targetId = problemId ?? challengeId ?? lessonId ?? topicId ?? '';

  return {
    id: `${type}:${targetId}`,
    type,
    title: copy.title,
    description: copy.description,
    priority: RECOMMENDATION_PRIORITIES[type],
    confidence: copy.confidence,
    reason: copy.reason,
    targetType,
    targetId,
    topicId,
    lessonId,
    problemId,
    challengeId,
  };
}

/**
 * Builds the full, priority-ordered recommendation list from context.
 *
 * Candidate generation (each type yields at most ONE candidate, so dedupe is
 * structural):
 *
 *   1. continue_lesson  resume the first unfinished (in-progress) lesson
 *   2. next_lesson      the first not-yet-completed lesson, when on track
 *   3. practice_topic   weakest started topic below `developing` (50)
 *   4. review_topic     fully-completed topic still below `proficient` (75)
 *   5. practice_problem first unsolved problem in a started lesson
 *   6. practice_challenge an unpassed challenge whose lesson is completed and
 *                       whose topic mastery is at least `developing` (50)
 *   7. daily_challenge  today's daily challenge (unless already completed, or
 *                       the same challenge is already the practice suggestion)
 */
export function buildRecommendations(
  context: RecommendationContext,
  options?: BuildRecommendationsOptions
): LearningRecommendation[] {
  const limit =
    options?.limit === undefined
      ? DEFAULT_RECOMMENDATION_LIMIT
      : Math.max(0, options.limit);

  const candidates: LearningRecommendation[] = [];

  const lessonBy = new Map<string, RecommendationLesson>(
    context.lessons.map((l) => [l.lessonId, l])
  );
  const lessonPathOrder = new Map<string, number>(
    context.lessons.map((l) => [l.lessonId, l.pathOrder])
  );
  const orderOf = (lessonId: string | null | undefined): number =>
    lessonId
      ? (lessonPathOrder.get(lessonId) ?? NO_ORDER)
      : NO_ORDER;

  const topicOfLesson = (lessonId: string): string | null =>
    lessonBy.get(lessonId)?.topicId ?? null;
  const masteryOf = (topicId: string | null | undefined) =>
    topicId ? (context.topicMastery.get(topicId) ?? null) : null;

  const topicFirstLessonOrder = new Map<string, number>();
  for (const lesson of context.lessons) {
    const current = topicFirstLessonOrder.get(lesson.topicId) ?? NO_ORDER;
    if (lesson.pathOrder < current) {
      topicFirstLessonOrder.set(lesson.topicId, lesson.pathOrder);
    }
  }
  const topicOrderOf = (topicId: string | null | undefined): number =>
    topicId
      ? (topicFirstLessonOrder.get(topicId) ?? NO_ORDER)
      : NO_ORDER;

  const sortedProblems = [...context.problems].sort(
    (a, b) =>
      orderOf(a.lessonId) - orderOf(b.lessonId) ||
      a.order - b.order ||
      a.id.localeCompare(b.id)
  );
  const sortedChallenges = [...context.challenges].sort(
    (a, b) =>
      orderOf(a.lessonId) - orderOf(b.lessonId) ||
      a.order - b.order ||
      a.id.localeCompare(b.id)
  );

  // --- 1/2. Resume: continue the in-progress lesson, else the next lesson ----
  const resumeLesson = context.resumeLessonId
    ? (lessonBy.get(context.resumeLessonId) ?? null)
    : null;

  if (resumeLesson) {
    if (resumeLesson.status === 'in-progress') {
      const topic = masteryOf(resumeLesson.topicId);
      candidates.push(
        makeCandidate(
          'continue_lesson',
          { lessonId: resumeLesson.lessonId, topicId: resumeLesson.topicId },
          {
            title: `Continue ${resumeLesson.title}`,
            description: 'Pick up where you left off.',
            reason: `You started "${resumeLesson.title}"${topic ? ` in ${topic.topicName}` : ''} and haven't completed it yet.`,
            confidence: 1,
          }
        )
      );
    } else {
      const resumeIndex = context.lessons.findIndex(
        (l) => l.lessonId === resumeLesson.lessonId
      );
      const previous = resumeIndex > 0 ? context.lessons[resumeIndex - 1] : null;
      const previousCompleted = previous?.status === 'completed';
      candidates.push(
        makeCandidate(
          'next_lesson',
          { lessonId: resumeLesson.lessonId, topicId: resumeLesson.topicId },
          {
            title: `Start ${resumeLesson.title}`,
            description: 'Keep moving along your learning path.',
            reason: previousCompleted
              ? `You completed "${previous.title}", so "${resumeLesson.title}" is next.`
              : 'This is the first lesson waiting for you on your learning path.',
            confidence: previousCompleted ? 0.95 : 0.85,
          }
        )
      );
    }
  }

  // --- 3. Weak topic practice -----------------------------------------------
  const practiceCandidates = [...context.topicMastery.values()]
    .filter(
      (m) =>
        m.masteryScore > 0 &&
        m.masteryScore < WEAK_TOPIC_MASTERY_MAX &&
        m.lessonsCompleted < m.lessonsTotal
    )
    .sort(
      (a, b) =>
        a.masteryScore - b.masteryScore ||
        topicOrderOf(a.topicId) - topicOrderOf(b.topicId) ||
        a.topicId.localeCompare(b.topicId)
    );
  const weakestTopic = practiceCandidates[0] ?? null;

  if (weakestTopic) {
    const weakArea = context.weakAreas?.find(
      (a) => a.kind === 'topic' && a.targetId === weakestTopic.topicId
    );
    candidates.push(
      makeCandidate(
        'practice_topic',
        { topicId: weakestTopic.topicId },
        {
          title: `Practice ${weakestTopic.topicName}`,
          description: 'Focused practice on your weakest started topic.',
          reason: weakArea
            ? weakArea.reason
            : `Your mastery in "${weakestTopic.topicName}" is ${pct(weakestTopic.masteryScore)} — below the target level.`,
          confidence: round2(
            0.5 + (WEAK_TOPIC_MASTERY_MAX - weakestTopic.masteryScore) / 100
          ),
        }
      )
    );
  }

  // --- 4. Review a completed-but-weak topic ---------------------------------
  const reviewCandidates = [...context.topicMastery.values()]
    .filter(
      (m) =>
        m.masteryScore > 0 &&
        m.masteryScore < REVIEW_TOPIC_MASTERY_MAX &&
        m.lessonsTotal > 0 &&
        m.lessonsCompleted === m.lessonsTotal &&
        m.topicId !== weakestTopic?.topicId
    )
    .sort(
      (a, b) =>
        a.masteryScore - b.masteryScore ||
        topicOrderOf(a.topicId) - topicOrderOf(b.topicId) ||
        a.topicId.localeCompare(b.topicId)
    );
  const reviewTopic = reviewCandidates[0] ?? null;

  if (reviewTopic) {
    candidates.push(
      makeCandidate(
        'review_topic',
        { topicId: reviewTopic.topicId },
        {
          title: `Review ${reviewTopic.topicName}`,
          description: 'Reinforce a topic you have already completed.',
          reason: `You completed all lessons in "${reviewTopic.topicName}" but your mastery is still ${pct(reviewTopic.masteryScore)}.`,
          confidence: round2(
            0.6 + (REVIEW_TOPIC_MASTERY_MAX - reviewTopic.masteryScore) / 200
          ),
        }
      )
    );
  }

  // --- 5. Unsolved problem in a started lesson ------------------------------
  const startedLessonIds = new Set(
    context.lessons
      .filter(
        (l) => l.status === 'in-progress' || l.status === 'completed'
      )
      .map((l) => l.lessonId)
  );
  const unsolvedProblem = sortedProblems.find(
    (p) => startedLessonIds.has(p.lessonId) && !context.solvedProblemIds.has(p.id)
  ) ?? null;

  if (unsolvedProblem) {
    candidates.push(
      makeCandidate(
        'practice_problem',
        {
          problemId: unsolvedProblem.id,
          lessonId: unsolvedProblem.lessonId,
          topicId: topicOfLesson(unsolvedProblem.lessonId),
        },
        {
          title: `Try ${unsolvedProblem.title}`,
          description: 'Solve a problem you have not solved yet.',
          reason: `You haven't solved "${unsolvedProblem.title}" yet.`,
          confidence: 0.7,
        }
      )
    );
  }

  // --- 6. Challenge the learner is ready for --------------------------------
  const readyChallenge = sortedChallenges.find((ch) => {
    const lesson = lessonBy.get(ch.lessonId);
    if (!lesson || lesson.status !== 'completed') {
      return false;
    }
    if (context.completedChallengeIds.has(ch.id)) {
      return false;
    }
    const mastery = masteryOf(lesson.topicId);
    if (!mastery || mastery.masteryScore < CHALLENGE_READY_MASTERY_MIN) {
      return false;
    }
    return true;
  }) ?? null;

  if (readyChallenge) {
    candidates.push(
      makeCandidate(
        'practice_challenge',
        {
          challengeId: readyChallenge.id,
          lessonId: readyChallenge.lessonId,
          topicId: topicOfLesson(readyChallenge.lessonId),
        },
        {
          title: `Attempt ${readyChallenge.title}`,
          description: 'Put your skills to the test with a challenge.',
          reason: `You completed the lesson for "${readyChallenge.title}" and have enough mastery to take it on.`,
          confidence: 0.8,
        }
      )
    );
  }

  // --- 7. Today's daily challenge (deduped against practice_challenge) ------
  if (context.daily && context.daily.state !== 'completed') {
    const dailyChallenge = context.challenges.find(
      (c) => c.id === context.daily?.challengeId
    ) ?? null;

    if (dailyChallenge) {
      const alreadySuggested = candidates.some(
        (c) =>
          c.type === 'practice_challenge' &&
          c.challengeId === dailyChallenge.id
      );
      if (!alreadySuggested) {
        candidates.push(
          makeCandidate(
            'daily_challenge',
            {
              challengeId: dailyChallenge.id,
              lessonId: dailyChallenge.lessonId,
              topicId: topicOfLesson(dailyChallenge.lessonId),
            },
            {
              title: "Complete today's challenge",
              description: "Earn today's daily challenge bonus.",
              reason: `Today's daily challenge "${dailyChallenge.title}" is ready for you.`,
              confidence: 0.85,
            }
          )
        );
      }
    }
  }

  // --- Order deterministically: priority, then path position, then id --------
  const orderKey = (c: LearningRecommendation): number =>
    c.lessonId
      ? orderOf(c.lessonId)
      : c.topicId
      ? topicOrderOf(c.topicId)
      : NO_ORDER;

  return [...candidates]
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        orderKey(a) - orderKey(b) ||
        a.id.localeCompare(b.id)
    )
    .slice(0, limit);
}

/** Single recommendation of type `type`, or null when none exists. */
export function findRecommendation(
  recommendations: LearningRecommendation[],
  type: RecommendationType
): LearningRecommendation | null {
  return recommendations.find((r) => r.type === type) ?? null;
}