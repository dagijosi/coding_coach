import type { LevelProgress } from '@/learning/progression/level';
import type { LessonStatus } from './learning';

export type UserProgress = {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
};

// ---------------------------------------------------------------------------
// Progress aggregation (Phase 6)
//
// Single model set for the progress data foundation. All of these are computed
// by the progress repository from the SQLite tables — never from UI state.
// ---------------------------------------------------------------------------

export type ProgressSummary = {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  totalProblems: number;
  solvedProblems: number;
  totalChallenges: number;
  completedChallenges: number;
  totalAttempts: number;
  successfulAttempts: number;
  successRate: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
};

export type TopicProgress = {
  topicId: string;
  topicName: string;
  totalLessons: number;
  completedLessons: number;
  totalProblems: number;
  solvedProblems: number;
  totalAttempts: number;
  successfulAttempts: number;
  successRate: number;
  completionPercentage: number;
};

export type LessonProgressSummary = {
  lessonId: string;
  lessonName: string;
  status: LessonStatus;
  completedAt: string | null;
  problemsAttempted: number;
  problemsSolved: number;
  challengesAttempted: number;
  challengesSolved: number;
  successRate: number;
};

export type TopicStrengths = {
  weakest: TopicProgress | null;
  strongest: TopicProgress | null;
};

export type RecentActivityItem = {
  id: string;
  kind: 'problem' | 'challenge';
  title: string;
  success: boolean;
  attemptedAt: string;
};

// ---------------------------------------------------------------------------
// Progression (Phase 6 Step 2)
//
// Level + streak view layered on top of ProgressSummary. `ProgressionSummary`
// is intentionally compatible with and derived from `ProgressSummary` rather
// than a competing model.
// ---------------------------------------------------------------------------

export type ProgressionSummary = {
  totalXP: number;
  level: number;
  levelProgress: LevelProgress;
  currentStreak: number;
  longestStreak: number;
  hasActivityToday: boolean;
  xpToNextLevel: number;
};

