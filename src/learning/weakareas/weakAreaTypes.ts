// ---------------------------------------------------------------------------
// Weak-area detection & targeted practice (Phase 6 Step 5)
//
// Central type model for identifying the learner's weak areas and selecting the
// most useful existing practice content. Everything here is evidence-based —
// derived from the SQLite progress/mastery records — and deterministic: no
// randomness, no AI, no fabricated stats.
//
// A topic or concept only becomes a "weak area" once the learner has actually
// worked on it (see weakArea.ts for the exact classification rules). Untouched
// content is never called weak; it simply has no evidence yet.
// ---------------------------------------------------------------------------

/**
 * Secondary weak-area signal: a learner whose recent attempts on a topic or
 * concept succeed less than this share of the time is struggling with it, even
 * when the mastery score alone is not yet below the developing band.
 */
export const WEAK_SUCCESS_RATE_THRESHOLD = 0.6;

/**
 * Minimum number of attempts that count as "consistently low". A single
 * failed first attempt is not enough evidence to call an area weak.
 */
export const MIN_WEAK_ATTEMPTS = 2;

export type PracticeLessonStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed';

export type WeakAreaKind = 'topic' | 'concept';

/**
 * One weak area (a topic or a single concept within a topic). `priority` is a
 * deterministic urgency ranking: 1 is the highest-priority area to work on.
 */
export type WeakArea = {
  id: string;
  kind: WeakAreaKind;
  /** topicId for a topic area, conceptId for a concept area. */
  targetId: string;
  targetName: string;
  /** The owning topic, present for both kinds. */
  topicId: string | null;
  topicName: string | null;
  /** 0-100 central mastery score from the Step 3 mastery system. */
  masteryScore: number;
  attempts: number;
  successfulAttempts: number;
  /** 0..1; 0 when there are no attempts. */
  successRate: number;
  lastActivityAt: string | null;
  reason: string;
  /** 1 = the most urgent area; deterministic ordering (see weakArea.ts). */
  priority: number;
};

/**
 * Where a targeted-practice item points. One problem-slot item is produced per
 * area: a previously failed (still unsolved) problem is preferred and phrased
 * differently ("you struggled before") from a merely unsolved one. Challenges
 * are only suggested once their lesson is completed; the lesson item is the
 * forward/review fallback.
 */
export type TargetedPracticeKind =
  | 'failed-problem'
  | 'problem'
  | 'challenge'
  | 'lesson';

export type TargetedPracticeItem = {
  id: string;
  kind: TargetedPracticeKind;
  targetId: string;
  title: string;
  topicId: string;
  topicName: string;
  lessonId: string | null;
  lessonTitle: string | null;
  reason: string;
  priority: number;
};

// ---------------------------------------------------------------------------
// Practice evidence (mirrors the lean repository queries)
// ---------------------------------------------------------------------------

export type ProblemPracticeRow = {
  problemId: string;
  title: string;
  lessonId: string;
  order: number;
  solved: boolean;
  failed: boolean;
  attempted: boolean;
};

export type ChallengePracticeRow = {
  challengeId: string;
  title: string;
  lessonId: string;
  order: number;
  passed: boolean;
  attempted: boolean;
};

export type LessonPracticeRow = {
  lessonId: string;
  title: string;
  status: PracticeLessonStatus;
  order: number;
  topicId: string;
};

/**
 * Content indexed by topic, in deterministic order. Built by
 * `buildPracticeEvidence` (weakArea.ts) from the lean practice rows.
 */
export type TargetedPracticeEvidence = {
  problemsByTopic: ReadonlyMap<string, ProblemPracticeRow[]>;
  challengesByTopic: ReadonlyMap<string, ChallengePracticeRow[]>;
  lessonsByTopic: ReadonlyMap<string, LessonPracticeRow[]>;
};