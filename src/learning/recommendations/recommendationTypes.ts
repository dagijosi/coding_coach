// ---------------------------------------------------------------------------
// Personalized learning recommendations (Phase 6 Step 4)
//
// Central type model for the rule-based recommendation engine. The engine
// (recommendationEngine.ts) consumes the existing progress repository data,
// the Step 3 mastery results, and the existing content hierarchy; it NEVER
// re-derives progress or mastery itself.
//
// Recommendation target resolution for the app's existing routes:
//   lesson    -> /lesson/:id
//   problem   -> /problem/:id
//   challenge -> /challenge/:id
//   topic     -> the learn hub (/learn)
// ---------------------------------------------------------------------------

import { MASTERY_THRESHOLDS } from '../mastery/mastery';

export const RECOMMENDATION_TYPES = [
  'continue_lesson',
  'next_lesson',
  'practice_topic',
  'review_topic',
  'practice_problem',
  'practice_challenge',
  'daily_challenge',
] as const;

export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export type RecommendationTargetType =
  | 'lesson'
  | 'topic'
  | 'problem'
  | 'challenge';

/**
 * One deterministic, evidence-backed suggestion for what the learner should do
 * next. `priority` orders the list (higher first); `confidence` is a simple
 * 0..1 signal of how strongly the data supports the suggestion.
 */
export type LearningRecommendation = {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: number;
  confidence: number;
  reason: string;
  targetType: RecommendationTargetType;
  targetId: string;
  topicId: string | null;
  lessonId: string | null;
  problemId: string | null;
  challengeId: string | null;
};

/**
 * The single documented priority ordering. Higher values surface first.
 *
 *   100 continue_lesson   resume unfinished work you already started
 *    90 next_lesson       move forward along the learning path
 *    80 practice_topic    strengthen a weak (started) topic
 *    70 review_topic      reinforce a completed topic with low mastery
 *    60 practice_problem  solve an unsolved problem in a started lesson
 *    50 practice_challenge try a challenge you are already ready for
 *    40 daily_challenge   today's time-limited daily challenge
 *
 * The daily challenge is kept below learning-work recommendations because it
 * already has a dedicated card on the Home screen; it is an optional extra
 * rather than primary next-step guidance.
 */
export const RECOMMENDATION_PRIORITIES: Record<RecommendationType, number> = {
  continue_lesson: 100,
  next_lesson: 90,
  practice_topic: 80,
  review_topic: 70,
  practice_problem: 60,
  practice_challenge: 50,
  daily_challenge: 40,
};

/**
 * Recommendation thresholds, derived from the central Step 3 mastery bands so
 * the engine and the mastery system never drift apart.
 *
 *  - practice_topic:  started topic with mastery below `developing` (50)
 *                     and unfinished lessons.
 *  - review_topic:    every lesson completed but mastery below `proficient`
 *                     (75) — the material was covered but not solidified.
 *  - practice_challenge requires the lesson to be completed AND the topic
 *    mastery at least `developing` (50) so hard challenges are not suggested
 *    before the learner has the prerequisite knowledge.
 */
export const WEAK_TOPIC_MASTERY_MAX = MASTERY_THRESHOLDS.developing;
export const REVIEW_TOPIC_MASTERY_MAX = MASTERY_THRESHOLDS.proficient;
export const CHALLENGE_READY_MASTERY_MIN = MASTERY_THRESHOLDS.developing;

/** Default number of recommendations returned by getRecommendations. */
export const DEFAULT_RECOMMENDATION_LIMIT = 5;