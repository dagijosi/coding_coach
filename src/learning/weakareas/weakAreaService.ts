// ---------------------------------------------------------------------------
// Weak-area service — application-layer API (Phase 6 Step 5).
//
// Loads the existing mastery + content + progress records through the existing
// repositories and hands them to the pure weakArea.ts logic. Nothing is
// re-derived here and nothing is fabricated: the outputs are deterministic for
// a fixed database state.
// ---------------------------------------------------------------------------

import { getLessons } from '@/repositories/lessonRepository';
import {
  getChallengePracticeData,
  getConceptMastery,
  getLessonProgress,
  getProblemPracticeData,
  getTopicMastery,
} from '@/repositories/progressRepository';
import type { LessonStatus } from '@/types/learning';
import {
  buildPracticeEvidence,
  buildTargetedPractice,
  detectWeakAreas,
} from './weakArea';
import type {
  PracticeLessonStatus,
  TargetedPracticeEvidence,
  TargetedPracticeItem,
  WeakArea,
} from './weakAreaTypes';

export {
  buildPracticeEvidence,
  buildTargetedPractice,
  detectWeakAreas,
  isWeakConcept,
  isWeakTopic,
  successRateFor,
} from './weakArea';
export { MIN_WEAK_ATTEMPTS, WEAK_SUCCESS_RATE_THRESHOLD } from './weakAreaTypes';
export type {
  ChallengePracticeRow,
  LessonPracticeRow,
  PracticeLessonStatus,
  ProblemPracticeRow,
  TargetedPracticeEvidence,
  TargetedPracticeItem,
  TargetedPracticeKind,
  WeakArea,
  WeakAreaKind,
} from './weakAreaTypes';
export type { WeakAreaEvidence } from './weakArea';

/**
 * Every weak topic and concept, ordered by deterministic urgency (priority 1
 * is the most urgent). Empty when the learner has no weak areas.
 */
export async function getWeakAreas(now = new Date()): Promise<WeakArea[]> {
  const [topics, concepts] = await Promise.all([
    getTopicMastery(now),
    getConceptMastery(now),
  ]);
  return detectWeakAreas({ topics, concepts });
}

async function loadPracticeEvidence(): Promise<TargetedPracticeEvidence> {
  const [lessons, lessonProgress, problemData, challengeData] =
    await Promise.all([
      getLessons(),
      getLessonProgress(),
      getProblemPracticeData(),
      getChallengePracticeData(),
    ]);

  const titleByLesson = new Map(
    lessonProgress.map((p) => [p.lessonId, p.lessonName])
  );
  const statusByLesson = new Map(
    lessonProgress.map((p) => [p.lessonId, p.status])
  );

  const practiceLessons: Array<{
    lessonId: string;
    title: string;
    status: PracticeLessonStatus;
    order: number;
    topicId: string;
  }> = lessons.map((lesson) => ({
    lessonId: lesson.id,
    title: titleByLesson.get(lesson.id) ?? lesson.title,
    status: (statusByLesson.get(lesson.id) ?? 'not-started') as LessonStatus,
    order: lesson.order,
    topicId: lesson.topicId,
  }));

  return buildPracticeEvidence({
    lessons: practiceLessons,
    problems: problemData,
    challenges: challengeData,
  });
}

/**
 * The priority-ordered targeted practice list for every weak topic area.
 * Empty when there is no weak topic with practiceable content.
 */
export async function getTargetedPractice(
  now = new Date()
): Promise<TargetedPracticeItem[]> {
  const [weakAreas, evidence] = await Promise.all([
    getWeakAreas(now),
    loadPracticeEvidence(),
  ]);
  return buildTargetedPractice(weakAreas, evidence);
}

/** Targeted practice items restricted to one topic. */
export async function getWeakAreaPractice(
  topicId: string,
  now = new Date()
): Promise<TargetedPracticeItem[]> {
  const items = await getTargetedPractice(now);
  return items.filter((item) => item.topicId === topicId);
}