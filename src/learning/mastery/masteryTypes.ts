// ---------------------------------------------------------------------------
// Mastery types — the single model set for topic/skill mastery.
//
// These are the ONLY mastery models the app should consume (see the Phase 6
// Step 3 consistency rule). Screens must not re-derive their own mastery
// percentages; they read the results produced by src/learning/mastery/mastery.ts
// via the progress repository.
// ---------------------------------------------------------------------------

export type MasteryLevel =
  | 'not_started'
  | 'beginner'
  | 'developing'
  | 'proficient'
  | 'mastered';

/**
 * Raw, evidence-based inputs for the mastery calculation. All counts come
 * straight from the existing SQLite tables; nothing is invented.
 */
export type MasteryEvidence = {
  lessonsCompleted: number;
  lessonsTotal: number;
  problemsSolved: number;
  problemsTotal: number;
  challengesSolved: number;
  challengesTotal: number;
  problemAttempts: Array<{ success: boolean; attemptedAt: string }>;
  challengeAttempts: Array<{ success: boolean; attemptedAt: string }>;
  lastActivityAt: string | null;
};

export type TopicMastery = {
  topicId: string;
  topicName: string;
  masteryScore: number;
  level: MasteryLevel;
  lessonsCompleted: number;
  lessonsTotal: number;
  problemsSolved: number;
  problemsTotal: number;
  challengesSolved: number;
  challengesTotal: number;
  attempts: number;
  successfulAttempts: number;
  lastActivityAt: string | null;
};

export type ConceptMastery = {
  conceptId: string;
  conceptName: string;
  topicId: string;
  topicName: string;
  lessonId: string;
  masteryScore: number;
  level: MasteryLevel;
  attempts: number;
  successfulAttempts: number;
  lastActivityAt: string | null;
};

export type OverallMastery = {
  score: number;
  topicsStarted: number;
  topicsCompleted: number;
  topicsMastered: number;
  strongestTopic: TopicMastery | null;
  weakestTopic: TopicMastery | null;
};