// ---------------------------------------------------------------------------
// Dashboard insights (Phase 6 Step 6) — pure, deterministic, React/DB-free.
//
// Turns the existing progress + mastery + weak-area numbers into short,
// evidence-backed sentences for the Progress screen. Insights only ever state
// facts derivable from the input; a brand-new learner gets an empty list (the
// screen shows an empty state instead). No fabricated numbers, no guesses.
// ---------------------------------------------------------------------------

import { MASTERY_THRESHOLDS } from './mastery/mastery';
import type { WeakArea } from './weakareas/weakAreaTypes';

export type DashboardInsight = {
  id: string;
  text: string;
};

export type InsightsInput = {
  progression: {
    totalXP: number;
    xpToNextLevel: number;
    currentStreak: number;
  };
  progress: {
    totalLessons: number;
    completedLessons: number;
    problemsAttempted: number;
    /** Problem-only accuracy as a 0..1 fraction (getLearningStats.accuracy). */
    problemAccuracy: number;
  };
  overall: {
    /** Overall mastery 0-100, averaged over started topics. */
    score: number;
    topicsStarted: number;
    strongestTopic: {
      topicName: string;
      masteryScore: number;
    } | null;
  };
  weakAreas: ReadonlyArray<Pick<WeakArea, 'kind' | 'targetName'>>;
};

/**
 * The insight sentences for a learner, in a fixed, deterministic order. Empty
 * for a learner with no activity.
 */
export function buildInsights(input: InsightsInput): DashboardInsight[] {
  const hasActivity =
    input.progress.completedLessons > 0 ||
    input.progress.problemsAttempted > 0 ||
    input.progression.totalXP > 0 ||
    input.overall.topicsStarted > 0;

  if (!hasActivity) {
    return [];
  }

  const insights: DashboardInsight[] = [];

  if (input.progress.completedLessons > 0 && input.progress.totalLessons > 0) {
    insights.push({
      id: 'lessons',
      text: `You have completed ${input.progress.completedLessons} of ${input.progress.totalLessons} lessons.`,
    });
  }

  if (input.progress.problemsAttempted > 0) {
    insights.push({
      id: 'accuracy',
      text: `You have a ${Math.round(input.progress.problemAccuracy * 100)}% problem success rate.`,
    });
  }

  if (input.progression.currentStreak >= 2) {
    insights.push({
      id: 'streak',
      text: `You're on a ${input.progression.currentStreak}-day streak — keep it going.`,
    });
  }

  if (input.progression.totalXP > 0 && input.progression.xpToNextLevel > 0) {
    insights.push({
      id: 'level',
      text: `${input.progression.xpToNextLevel} XP to your next level.`,
    });
  }

  if (input.overall.topicsStarted > 0 && input.overall.score > 0) {
    insights.push({
      id: 'mastery',
      text: `Your overall mastery is ${input.overall.score}% across ${input.overall.topicsStarted} started topic${input.overall.topicsStarted === 1 ? '' : 's'}.`,
    });
  }

  const strongest = input.overall.strongestTopic;
  if (strongest && strongest.masteryScore >= MASTERY_THRESHOLDS.proficient) {
    insights.push({
      id: 'strongest',
      text: `${strongest.topicName} is your strongest topic.`,
    });
  }

  const firstWeak = input.weakAreas[0];
  if (firstWeak) {
    insights.push({
      id: 'practice',
      text:
        firstWeak.kind === 'topic'
          ? `Practice ${firstWeak.targetName} to improve your weakest topic.`
          : `Practice ${firstWeak.targetName} to improve a weak concept.`,
    });
  }

  return insights;
}