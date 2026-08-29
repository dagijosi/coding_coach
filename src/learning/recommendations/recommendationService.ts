// ---------------------------------------------------------------------------
// Recommendation service — application-layer API.
//
// Loads the existing progress + mastery + content data through the existing
// repositories and hands it to the pure engine (recommendationEngine.ts).
// No progress or mastery is re-derived here; no network/LLM/analytics calls
// are made. Everything is computed locally from SQLite.
// ---------------------------------------------------------------------------

import { getChallenges } from '@/repositories/challengeRepository';
import { getLessons } from '@/repositories/lessonRepository';
import { getProblems } from '@/repositories/problemRepository';
import { getTopics } from '@/repositories/topicRepository';
import {
  getCompletedChallengeIds,
  getContinueLearningLessonId,
  getDailyChallengeState,
  getLessonProgress,
  getSolvedProblemIds,
  getTopicMastery,
} from '@/repositories/progressRepository';
import { pickDailyItem } from '@/utils/dailyChallenge';

import { DEFAULT_RECOMMENDATION_LIMIT } from './recommendationTypes';
import type { LearningRecommendation } from './recommendationTypes';
import { buildRecommendations } from './recommendationEngine';
import type {
  RecommendationChallenge,
  RecommendationContext,
  RecommendationLesson,
  RecommendationProblem,
} from './recommendationEngine';

export type {
  RecommendationContext,
  RecommendationLesson,
  RecommendationProblem,
  RecommendationChallenge,
} from './recommendationEngine';
export { buildRecommendations } from './recommendationEngine';
export {
  DEFAULT_RECOMMENDATION_LIMIT,
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_TYPES,
} from './recommendationTypes';
export type {
  LearningRecommendation,
  RecommendationTargetType,
  RecommendationType,
} from './recommendationTypes';

async function loadRecommendationContext(
  now: Date
): Promise<RecommendationContext> {
  const [
    topics,
    masteryList,
    lessonProgressList,
    lessons,
    problems,
    challenges,
    solvedProblemIds,
    completedChallengeIds,
    resumeLessonId,
  ] = await Promise.all([
    getTopics(),
    getTopicMastery(now),
    getLessonProgress(),
    getLessons(),
    getProblems(),
    getChallenges(),
    getSolvedProblemIds(),
    getCompletedChallengeIds(),
    getContinueLearningLessonId(),
  ]);

  const topicIdByLesson = new Map<string, string>(
    lessons.map((l) => [l.id, l.topicId])
  );

  // Path order is the existing course -> topic -> lesson ordering.
  const pathLessons: RecommendationLesson[] = lessonProgressList.map(
    (p, index) => ({
      lessonId: p.lessonId,
      topicId: topicIdByLesson.get(p.lessonId) ?? '',
      title: p.lessonName,
      pathOrder: index,
      status: p.status,
    })
  );

  const problemList: RecommendationProblem[] = problems.map((p) => ({
    id: p.id,
    lessonId: p.lessonId,
    title: p.title,
    order: p.order,
  }));

  // Keep content order so the daily pick matches isTodaysDailyChallenge.
  const challengeList: RecommendationChallenge[] = challenges.map((c) => ({
    id: c.id,
    lessonId: c.lessonId,
    title: c.title,
    order: c.order,
  }));

  const topicMastery = new Map(
    masteryList.map((m) => [m.topicId, m])
  );

  let daily: RecommendationContext['daily'] = null;
  const dailyChallengeId = pickDailyItem(
    challengeList.map((c) => c.id),
    now
  );
  if (dailyChallengeId) {
    const state = await getDailyChallengeState(dailyChallengeId, now);
    daily = { challengeId: dailyChallengeId, state };
  }

  return {
    topics,
    topicMastery,
    lessons: pathLessons,
    problems: problemList,
    challenges: challengeList,
    solvedProblemIds: new Set(solvedProblemIds),
    completedChallengeIds: new Set(completedChallengeIds),
    resumeLessonId,
    daily,
  };
}

/**
 * The priority-ordered list of personalized recommendations, limited to
 * `limit` items (default 5). Deterministic for a fixed database state.
 */
export async function getRecommendations(
  limit = DEFAULT_RECOMMENDATION_LIMIT,
  now = new Date()
): Promise<LearningRecommendation[]> {
  const context = await loadRecommendationContext(now);
  return buildRecommendations(context, { limit });
}

/** The single best next step, or null when there is nothing to recommend. */
export async function getNextRecommendation(
  now = new Date()
): Promise<LearningRecommendation | null> {
  const top = await getRecommendations(1, now);
  return top[0] ?? null;
}

/** Topic-strength recommendations (practice_topic / review_topic) only. */
export async function getWeakTopicRecommendations(
  limit = 3,
  now = new Date()
): Promise<LearningRecommendation[]> {
  const all = await getRecommendations(100, now);
  return all
    .filter(
      (r) => r.type === 'practice_topic' || r.type === 'review_topic'
    )
    .slice(0, limit);
}

/** The resume-in-progress recommendation, when one exists. */
export async function getContinueLearningRecommendation(
  now = new Date()
): Promise<LearningRecommendation | null> {
  const all = await getRecommendations(100, now);
  return all.find((r) => r.type === 'continue_lesson') ?? null;
}