// ---------------------------------------------------------------------------
// Learning context snapshot (Phase 7 Step 3) — pure, type-safe, serializable.
//
// A lightweight snapshot of WHERE the learner is and HOW they are doing, used
// by the coach engine to give context-aware responses. It is the single source
// of the learner's current state handed to the engine; everything here comes
// from the existing repositories — nothing is fabricated.
//
// The snapshot is assembled on demand (not persisted into conversation
// messages) and deliberately limited in size: only the current location, a
// bounded recent-activity window, and the mastery/weak-area summary that the
// coach personalizes on.
// ---------------------------------------------------------------------------

import type { ProgressSummary } from '@/types/progress';
import type { TopicMastery } from '@/learning/mastery/masteryTypes';
import type { WeakArea } from '@/learning/weakareas/weakAreaTypes';

/** Where the learner currently is inside the content hierarchy. */
export type LearningLocation = {
  course: { id: string; name: string } | null;
  topic: { id: string; name: string } | null;
  lesson: { id: string; title: string } | null;
  concept: { id: string; name: string } | null;
};

export type RecentProblemRecord = {
  problemId: string;
  title: string;
  success: boolean;
  attemptedAt: string;
};

export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

export type ConceptReviewRecord = {
  conceptId: string;
  conceptName: string;
  topicId: string;
  topicName: string;
  masteryScore: number;
};

/**
 * The bounded, serializable snapshot. `location` fields are null when the
 * learner is not deep enough in the hierarchy (e.g. not inside a lesson).
 */
export type LearningContext = {
  location: LearningLocation;
  /** Most recent problem attempts, most-recent first, bounded. */
  recentProblems: RecentProblemRecord[];
  /** Titles of recently completed lessons, most-recent first. */
  recentCompletedLessons: string[];
  /** Step 3 mastery, keyed by topic, from the existing repository. */
  topicMastery: TopicMastery[];
  /** Step 5 weak areas (topics + concepts), from the existing detector. */
  weakAreas: WeakArea[];
  /** Concepts whose mastery is below the review threshold. */
  conceptsNeedingReview: ConceptReviewRecord[];
  /** Aggregated progress (lessons/problems/challenges/XP/streak). */
  progress: ProgressSummary;
  /** Status of the current lesson, null when not in a lesson. */
  currentLessonStatus: LessonStatus | null;
};
