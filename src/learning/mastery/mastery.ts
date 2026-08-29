// ---------------------------------------------------------------------------
// Mastery calculation — deterministic, evidence-based, React-free.
//
// Mastery is derived ONLY from the learner's actual learning activity stored
// in SQLite. Opening/reading a lesson is weak evidence; solving problems and
// passing challenges carry more weight.
//
// FORMULA (one central, documented rule):
//
//   raw = lessonCoverage * 0.25
//       + problemPerformance  * 0.40
//       + challengePerformance * 0.35
//
//   lessonCoverage       = lessonsCompleted / lessonsTotal
//   problemPerformance   = 0.5 * problemsSolved/problemsTotal   (coverage)
//                        + 0.5 * weightedProblemAccuracy         (accuracy)
//   challengePerformance = 0.5 * challengesSolved/challengesTotal (coverage)
//                        + 0.5 * weightedChallengeAccuracy        (accuracy)
//
//   score = round(clamp01(raw) * 100), always within [0, 100].
//
// Rationale for the weights: problems (0.40) and challenges (0.35) demonstrate
// skill and therefore carry more evidence than lesson completion (0.25).
//
// RECENCY RULE:
//   Each attempt is weighted by how recently it happened:
//     age <=  30 days  -> weight 1.00
//     age in (30,180]  -> weight falls linearly 1.00 -> 0.50
//     age  > 180 days  -> weight 0.50 (floor; old success never fully disappears)
//   Weighted accuracy = weighted successes / weighted attempts (0 when none).
//   This makes recent correct answers count roughly twice as much as very old
//   ones without letting stale data collapse a score to zero.
//
// All calculations are pure given a fixed `now`, so they are trivially
// testable and identical everywhere in the app.
// ---------------------------------------------------------------------------

import type {
  ConceptMastery,
  MasteryEvidence,
  MasteryLevel,
  OverallMastery,
  TopicMastery,
} from './masteryTypes';

export const MASTERY_WEIGHTS = {
  lessonCoverage: 0.25,
  problemPerformance: 0.4,
  challengePerformance: 0.35,
} as const;

export const MASTERY_THRESHOLDS = {
  not_started: 0,
  beginner: 25,
  developing: 50,
  proficient: 75,
  mastered: 90,
} as const;

export const RECENT_WINDOW_DAYS = 30;
export const STALE_WINDOW_DAYS = 180;
export const STALE_WEIGHT_FLOOR = 0.5;

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Recency weighting
// ---------------------------------------------------------------------------

/** Recency weight for an attempt timestamp, in (0.5, 1]. */
export function attemptWeight(attemptedAt: string, now: Date): number {
  const ageDays =
    (now.getTime() - new Date(attemptedAt).getTime()) / DAY_MS;

  if (ageDays <= RECENT_WINDOW_DAYS) {
    return 1;
  }
  if (ageDays <= STALE_WINDOW_DAYS) {
    return (
      STALE_WEIGHT_FLOOR +
      (1 - STALE_WEIGHT_FLOOR) *
        ((STALE_WINDOW_DAYS - ageDays) /
          (STALE_WINDOW_DAYS - RECENT_WINDOW_DAYS))
    );
  }
  return STALE_WEIGHT_FLOOR;
}

/** Recency-weighted success rate of attempts, or 0 when there are none. */
export function weightedAccuracy(
  attempts: ReadonlyArray<{ success: boolean; attemptedAt: string }>,
  now: Date
): number {
  if (attempts.length === 0) {
    return 0;
  }
  const weight = (a: { success: boolean; attemptedAt: string }) =>
    attemptWeight(a.attemptedAt, now);
  const total = attempts.reduce((sum, a) => sum + weight(a), 0);
  if (total === 0) {
    return 0;
  }
  const successful = attempts.reduce(
    (sum, a) => sum + (a.success ? weight(a) : 0),
    0
  );
  return successful / total;
}

function coverage(done: number, total: number): number {
  return total > 0 ? done / total : 0;
}

// ---------------------------------------------------------------------------
// Score + level
// ---------------------------------------------------------------------------

/** Deterministic 0-100 mastery score from raw evidence. */
export function computeMasteryScore(
  evidence: MasteryEvidence,
  now: Date
): number {
  const lessonComponent =
    MASTERY_WEIGHTS.lessonCoverage *
    coverage(evidence.lessonsCompleted, evidence.lessonsTotal);

  const problemAccuracy = weightedAccuracy(evidence.problemAttempts, now);
  const problemComponent =
    MASTERY_WEIGHTS.problemPerformance *
    (0.5 * coverage(evidence.problemsSolved, evidence.problemsTotal) +
      0.5 * problemAccuracy);

  const challengeAccuracy = weightedAccuracy(
    evidence.challengeAttempts,
    now
  );
  const challengeComponent =
    MASTERY_WEIGHTS.challengePerformance *
    (0.5 * coverage(evidence.challengesSolved, evidence.challengesTotal) +
      0.5 * challengeAccuracy);

  const raw = lessonComponent + problemComponent + challengeComponent;
  const clamped = Math.min(1, Math.max(0, raw));
  return Math.round(clamped * 100);
}

/** Maps a 0-100 score to the central mastery level bands. */
export function masteryLevelForScore(score: number): MasteryLevel {
  if (score >= MASTERY_THRESHOLDS.mastered) return 'mastered';
  if (score >= MASTERY_THRESHOLDS.proficient) return 'proficient';
  if (score >= MASTERY_THRESHOLDS.developing) return 'developing';
  if (score >= MASTERY_THRESHOLDS.beginner) return 'beginner';
  return 'not_started';
}

export function topicAttempts(evidence: MasteryEvidence): number {
  return evidence.problemAttempts.length + evidence.challengeAttempts.length;
}

export function topicSuccessfulAttempts(evidence: MasteryEvidence): number {
  return (
    evidence.problemAttempts.filter((a) => a.success).length +
    evidence.challengeAttempts.filter((a) => a.success).length
  );
}

// ---------------------------------------------------------------------------
// Model builders
// ---------------------------------------------------------------------------

/** Builds the full TopicMastery model from raw evidence. */
export function buildTopicMastery(
  topicId: string,
  topicName: string,
  evidence: MasteryEvidence,
  now: Date
): TopicMastery {
  const masteryScore = computeMasteryScore(evidence, now);
  return {
    topicId,
    topicName,
    masteryScore,
    level: masteryLevelForScore(masteryScore),
    lessonsCompleted: evidence.lessonsCompleted,
    lessonsTotal: evidence.lessonsTotal,
    problemsSolved: evidence.problemsSolved,
    problemsTotal: evidence.problemsTotal,
    challengesSolved: evidence.challengesSolved,
    challengesTotal: evidence.challengesTotal,
    attempts: topicAttempts(evidence),
    successfulAttempts: topicSuccessfulAttempts(evidence),
    lastActivityAt: evidence.lastActivityAt,
  };
}

/** Builds the ConceptMastery model from a topic + its lesson-level evidence. */
export function buildConceptMastery(
  conceptId: string,
  conceptName: string,
  topicId: string,
  topicName: string,
  lessonId: string,
  evidence: MasteryEvidence,
  now: Date
): ConceptMastery {
  const masteryScore = computeMasteryScore(evidence, now);
  return {
    conceptId,
    conceptName,
    topicId,
    topicName,
    lessonId,
    masteryScore,
    level: masteryLevelForScore(masteryScore),
    attempts: topicAttempts(evidence),
    successfulAttempts: topicSuccessfulAttempts(evidence),
    lastActivityAt: evidence.lastActivityAt,
  };
}

// ---------------------------------------------------------------------------
// Ordering (deterministic)
// ---------------------------------------------------------------------------

/** Highest mastery first. Ties break by topic name then id (ascending). */
export function sortStrongest(topics: TopicMastery[]): TopicMastery[] {
  return [...topics].sort(
    (a, b) =>
      b.masteryScore - a.masteryScore ||
      a.topicName.localeCompare(b.topicName) ||
      a.topicId.localeCompare(b.topicId)
  );
}

/** Lowest mastery first (started topics only). Ties break by name then id. */
export function sortWeakest(topics: TopicMastery[]): TopicMastery[] {
  return [...topics].sort(
    (a, b) =>
      a.masteryScore - b.masteryScore ||
      a.topicName.localeCompare(b.topicName) ||
      a.topicId.localeCompare(b.topicId)
  );
}

// ---------------------------------------------------------------------------
// Overall mastery
// ---------------------------------------------------------------------------

/**
 * Overall mastery across the learner's topics.
 *
 * Unpracticed topics (score 0) do NOT pull the average down — that would let
 * untouched content dominate. The average is computed over started topics and
 * `topicsStarted` is reported so callers can contextualize coverage.
 */
export function computeOverallMastery(
  topics: TopicMastery[]
): OverallMastery {
  const started = topics.filter((t) => t.masteryScore > 0);

  const score =
    started.length === 0
      ? 0
      : Math.round(
          started.reduce((sum, t) => sum + t.masteryScore, 0) /
            started.length
        );

  const strongest =
    started.length === 0 ? null : sortStrongest(started)[0];

  const weakest = started.length === 0 ? null : sortWeakest(started)[0];

  return {
    score,
    topicsStarted: started.length,
    topicsCompleted: topics.filter(
      (t) => t.lessonsTotal > 0 && t.lessonsCompleted === t.lessonsTotal
    ).length,
    topicsMastered: topics.filter((t) => t.level === 'mastered').length,
    strongestTopic: strongest,
    weakestTopic: weakest,
  };
}