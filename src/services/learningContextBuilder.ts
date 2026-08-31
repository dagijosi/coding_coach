// ---------------------------------------------------------------------------
// LearningContextBuilder (Phase 7 Step 3) — application-layer service.
//
// Assembles the current learner context snapshot from the existing
// repositories. This is the ONLY place that maps raw repository results into
// the LearningContext shape the coach engine personalizes on. It:
//
//   - resolves the current course/topic/lesson/concept location
//   - includes a bounded recent-activity window (not the whole DB)
//   - reuses the existing Phase 6 mastery + weak-area calculations
//
// No raw SQL lives in the engine; no duplicate progress systems are created.
// ---------------------------------------------------------------------------

import { getConcepts } from '@/repositories/conceptRepository';
import { getCourses } from '@/repositories/courseRepository';
import { getLessons } from '@/repositories/lessonRepository';
import { getTopics } from '@/repositories/topicRepository';
import {
  getConceptMastery,
  getLessonProgressById,
  getProgressSummary,
  getRecentActivity,
  getTopicMastery,
} from '@/repositories/progressRepository';
import { getWeakAreas } from '@/learning/weakareas/weakAreaService';
import { PROGRESS_REVIEW_MASTERY_MAX } from '@/learning/coach/coachConstants';
import type {
  LearningContext,
  LessonStatus as ContextLessonStatus,
  RecentProblemRecord,
} from '@/learning/coach/learningContextTypes';

/** Bound the recent-activities window so a build is cheap on mobile. */
const RECENT_ACTIVITY_LIMIT = 8;

/**
 * Builds the current LearningContext snapshot.
 *
 * `lessonId` is the lesson the learner is currently inside, or null when they
 * are not in a lesson (e.g. browsing the hub or between lessons). When null,
 * the location's deeper fields are left null and the coach falls back to
 * general guidance.
 */
export async function buildLearningContext(
  lessonId: string | null,
  now = new Date()
): Promise<LearningContext> {
  const [
    courses,
    topics,
    lessons,
    concepts,
    progress,
    topicMastery,
    conceptMastery,
    weakAreas,
    recentActivity,
    lessonProgress,
  ] = await Promise.all([
    getCourses(),
    getTopics(),
    getLessons(),
    getConcepts(),
    getProgressSummary(),
    getTopicMastery(now),
    getConceptMastery(now),
    getWeakAreas(now),
    getRecentActivity(RECENT_ACTIVITY_LIMIT),
    lessonId ? getLessonProgressById(lessonId) : Promise.resolve(null),
  ]);

  // ---- Resolve current location -------------------------------
  const lesson = lessons.find((l) => l.id === lessonId) ?? null;
  const topic = lesson
    ? (topics.find((t) => t.id === lesson.topicId) ?? null)
    : null;
  const course = topic
    ? (courses.find((c) => c.id === topic.courseId) ?? null)
    : null;
  const concept = lesson
    ? (concepts.find((c) => c.lessonId === lesson.id) ?? null)
    : null;

  // ---- Recent problems (bounded, most-recent first) ------------
  const recentProblems: RecentProblemRecord[] = recentActivity
    .filter((a) => a.kind === 'problem')
    .map((a) => ({
      problemId: a.id,
      title: a.title,
      success: a.success,
      attemptedAt: a.attemptedAt,
    }));

  const recentCompletedLessons = recentActivity
    .filter((a) => a.kind === 'lesson' && a.success)
    .map((a) => a.title);

  // ---- Concepts needing review (from Phase 6 weak/mastery) -----
  const conceptReviewRecords = conceptMastery
    .filter((c) => c.masteryScore < PROGRESS_REVIEW_MASTERY_MAX)
    .map((c) => ({
      conceptId: c.conceptId,
      conceptName: c.conceptName,
      topicId: c.topicId,
      topicName: c.topicName,
      masteryScore: c.masteryScore,
    }));

  const currentLessonStatus: ContextLessonStatus | null =
    lessonProgress === null
      ? null
      : lessonProgress.status === 'completed'
        ? 'completed'
        : lessonProgress.status === 'in-progress'
          ? 'in-progress'
          : 'not-started';

  return {
    location: {
      course: course ? { id: course.id, name: course.name } : null,
      topic: topic ? { id: topic.id, name: topic.name } : null,
      lesson: lesson ? { id: lesson.id, title: lesson.title } : null,
      concept: concept ? { id: concept.id, name: concept.name } : null,
    },
    recentProblems,
    recentCompletedLessons,
    topicMastery,
    weakAreas,
    conceptsNeedingReview: conceptReviewRecords,
    progress,
    currentLessonStatus,
  };
}
