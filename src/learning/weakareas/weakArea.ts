// ---------------------------------------------------------------------------
// Weak-area detection & targeted practice — pure, deterministic, React/DB-free.
//
// This module answers two questions from plain evidence (the Step 3 mastery
// models plus the existing content hierarchy):
//
//   1. Which topics / concepts is the learner struggling with?
//   2. What existing content should they practice first?
//
// Classification is conservative:
//   - Untouched content (no evidence) is NEVER a weak area.
//   - A started topic is weak when its mastery is below the `developing` band
//     (50) OR when its recent success rate is consistently below
//     WEAK_SUCCESS_RATE_THRESHOLD (0.6) across at least MIN_WEAK_ATTEMPTS.
//   - A concept is weak only when the learner has attempted its problems and
//     is struggling there (same success-rate rule or mastery below developing).
//
// Targeted practice picks ONE problem item, the first unpassed challenge of a
// completed lesson, and one lesson item per weak topic — always from existing
// content, never from anything solved/passed already.
// ---------------------------------------------------------------------------

import { MASTERY_THRESHOLDS } from '../mastery/mastery';
import type { ConceptMastery, TopicMastery } from '../mastery/masteryTypes';
import {
  MIN_WEAK_ATTEMPTS,
  WEAK_SUCCESS_RATE_THRESHOLD,
  type ChallengePracticeRow,
  type LessonPracticeRow,
  type ProblemPracticeRow,
  type TargetedPracticeEvidence,
  type TargetedPracticeItem,
  type TargetedPracticeKind,
  type WeakArea,
} from './weakAreaTypes';

const NO_ORDER = Number.MAX_SAFE_INTEGER;

// ---------------------------------------------------------------------------
// Weak-area detection
// ---------------------------------------------------------------------------

export type WeakAreaEvidence = {
  topics: TopicMastery[];
  concepts: ConceptMastery[];
};

/** 0..1 plain success rate; 0 when there are no attempts. */
export function successRateFor(successful: number, attempts: number): number {
  return attempts > 0 ? successful / attempts : 0;
}

/** A topic is weak only when it has been started (evidence, not guessing). */
export function isWeakTopic(topic: TopicMastery): boolean {
  if (topic.masteryScore <= 0) {
    return false;
  }
  const lowMastery = topic.masteryScore < MASTERY_THRESHOLDS.developing;
  const lowSuccessRate =
    topic.attempts >= MIN_WEAK_ATTEMPTS &&
    successRateFor(topic.successfulAttempts, topic.attempts) <
      WEAK_SUCCESS_RATE_THRESHOLD;
  return lowMastery || lowSuccessRate;
}

/** A concept is weak only when the learner attempted and struggled with it. */
export function isWeakConcept(concept: ConceptMastery): boolean {
  if (concept.attempts <= 0) {
    return false;
  }
  const lowMastery = concept.masteryScore < MASTERY_THRESHOLDS.developing;
  const lowSuccessRate =
    concept.attempts >= MIN_WEAK_ATTEMPTS &&
    successRateFor(concept.successfulAttempts, concept.attempts) <
      WEAK_SUCCESS_RATE_THRESHOLD;
  return lowMastery || lowSuccessRate;
}

function topicWeaknessReason(topic: TopicMastery): string {
  const lowSuccessRate =
    topic.attempts >= MIN_WEAK_ATTEMPTS &&
    successRateFor(topic.successfulAttempts, topic.attempts) <
      WEAK_SUCCESS_RATE_THRESHOLD;
  return lowSuccessRate
    ? `Your recent problem success rate in "${topic.topicName}" is low.`
    : `Mastery in "${topic.topicName}" is ${topic.masteryScore}% — below the target level.`;
}

function conceptWeaknessReason(concept: ConceptMastery): string {
  const successRate =
    successRateFor(concept.successfulAttempts, concept.attempts) <
    WEAK_SUCCESS_RATE_THRESHOLD;
  return concept.attempts >= MIN_WEAK_ATTEMPTS && successRate
    ? `Low success rate on problems in "${concept.conceptName}".`
    : `Mastery in "${concept.conceptName}" is ${concept.masteryScore}% — below the target level.`;
}

function makeTopicWeakArea(topic: TopicMastery): WeakArea {
  return {
    id: `topic:${topic.topicId}`,
    kind: 'topic',
    targetId: topic.topicId,
    targetName: topic.topicName,
    topicId: topic.topicId,
    topicName: topic.topicName,
    masteryScore: topic.masteryScore,
    attempts: topic.attempts,
    successfulAttempts: topic.successfulAttempts,
    successRate: successRateFor(topic.successfulAttempts, topic.attempts),
    lastActivityAt: topic.lastActivityAt,
    reason: topicWeaknessReason(topic),
    priority: 0,
  };
}

function makeConceptWeakArea(concept: ConceptMastery): WeakArea {
  return {
    id: `concept:${concept.conceptId}`,
    kind: 'concept',
    targetId: concept.conceptId,
    targetName: concept.conceptName,
    topicId: concept.topicId,
    topicName: concept.topicName,
    masteryScore: concept.masteryScore,
    attempts: concept.attempts,
    successfulAttempts: concept.successfulAttempts,
    successRate: successRateFor(
      concept.successfulAttempts,
      concept.attempts
    ),
    lastActivityAt: concept.lastActivityAt,
    reason: conceptWeaknessReason(concept),
    priority: 0,
  };
}

/**
 * Deterministic urgency ranking. Lower success rate first, then lower mastery,
 * then more attempts, then more recent activity, then name and id. The result
 * is stable for a fixed database state.
 */
const compareWeakAreas = (a: WeakArea, b: WeakArea): number =>
  a.successRate - b.successRate ||
  a.masteryScore - b.masteryScore ||
  b.attempts - a.attempts ||
  (b.lastActivityAt ?? '').localeCompare(a.lastActivityAt ?? '') ||
  a.targetName.localeCompare(b.targetName) ||
  a.targetId.localeCompare(b.targetId);

/**
 * All weak areas, topic areas first by kind-agnostic urgency, then concept
 * areas. `priority` counts from 1. Empty when there is no weak evidence.
 */
export function detectWeakAreas(evidence: WeakAreaEvidence): WeakArea[] {
  const areas: WeakArea[] = [
    ...evidence.topics.filter(isWeakTopic).map(makeTopicWeakArea),
    ...evidence.concepts.filter(isWeakConcept).map(makeConceptWeakArea),
  ];
  return [...areas]
    .sort(compareWeakAreas)
    .map((area, index) => ({ ...area, priority: index + 1 }));
}

// ---------------------------------------------------------------------------
// Targeted practice
// ---------------------------------------------------------------------------

const PRACTICE_TIER: Record<TargetedPracticeKind, number> = {
  'failed-problem': 40,
  problem: 30,
  challenge: 20,
  lesson: 10,
};

/**
 * Groups the lean practice rows by topic and orders every group
 * deterministically (lesson order, then item order, then id).
 */
export function buildPracticeEvidence(input: {
  lessons: LessonPracticeRow[];
  problems: ProblemPracticeRow[];
  challenges: ChallengePracticeRow[];
}): TargetedPracticeEvidence {
const lessonBy = new Map<string, LessonPracticeRow>(
      input.lessons.map((l) => [l.lessonId, l])
    );

  const lessonsByTopic = new Map<string, LessonPracticeRow[]>();
  for (const lesson of [...input.lessons].sort(
    (a, b) =>
      a.order - b.order || a.lessonId.localeCompare(b.lessonId)
  )) {
    const list = lessonsByTopic.get(lesson.topicId) ?? [];
    list.push(lesson);
    lessonsByTopic.set(lesson.topicId, list);
  }

  const byLessonOrder = (a: ProblemPracticeRow, b: ProblemPracticeRow): number =>
    (lessonBy.get(a.lessonId)?.order ?? NO_ORDER) -
      (lessonBy.get(b.lessonId)?.order ?? NO_ORDER) ||
    a.order - b.order ||
    a.problemId.localeCompare(b.problemId);

  const problemsByTopic = new Map<string, ProblemPracticeRow[]>();
  for (const row of input.problems) {
    const lesson = lessonBy.get(row.lessonId);
    if (!lesson) {
      continue;
    }
    const list = problemsByTopic.get(lesson.topicId) ?? [];
    list.push(row);
    problemsByTopic.set(lesson.topicId, list);
  }
  for (const list of problemsByTopic.values()) {
    list.sort(byLessonOrder);
  }

  const challengesByTopic = new Map<string, ChallengePracticeRow[]>();
  for (const row of input.challenges) {
    const lesson = lessonBy.get(row.lessonId);
    if (!lesson) {
      continue;
    }
    const list = challengesByTopic.get(lesson.topicId) ?? [];
    list.push(row);
    challengesByTopic.set(lesson.topicId, list);
  }
  for (const list of challengesByTopic.values()) {
    list.sort(
      (a, b) =>
        (lessonBy.get(a.lessonId)?.order ?? NO_ORDER) -
          (lessonBy.get(b.lessonId)?.order ?? NO_ORDER) ||
        a.order - b.order ||
        a.challengeId.localeCompare(b.challengeId)
    );
  }

  return { problemsByTopic, challengesByTopic, lessonsByTopic };
}

/**
 * The targeted practice list for every weak TOPIC area, ordered by weak-area
 * priority and, within an area, by content preference:
 *
 *   1. a previously failed, still unsolved problem  (strongest signal)
 *   2. otherwise the first unsolved problem
 *   3. the first unpassed challenge whose lesson is completed
 *   4. otherwise a lesson to continue, review, or start
 *
 * Concept areas do not produce their own items — their topic is the unit of
 * practice — so no duplicate problem/challenge suggestions can appear. Each
 * item appears at most once. Empty when there are no weak topic areas.
 */
export function buildTargetedPractice(
  weakAreas: WeakArea[],
  evidence: TargetedPracticeEvidence
): TargetedPracticeItem[] {
  const items: TargetedPracticeItem[] = [];

  for (const area of weakAreas) {
    if (area.kind !== 'topic') {
      continue;
    }
    const topicName = area.topicName ?? area.targetName;
    const topicPractice: TargetedPracticeItem[] = [];

    const problems = evidence.problemsByTopic.get(area.targetId) ?? [];
    const failedProblem = problems.find((p) => !p.solved && p.failed);
    if (failedProblem) {
      topicPractice.push({
        id: `failed-problem:${failedProblem.problemId}`,
        kind: 'failed-problem',
        targetId: failedProblem.problemId,
        title: failedProblem.title,
        topicId: area.targetId,
        topicName,
        lessonId: failedProblem.lessonId,
        lessonTitle: null,
        reason: 'You struggled with this problem before. Try it again.',
        priority: 0,
      });
    } else {
      const unsolved = problems.find((p) => !p.solved);
      if (unsolved) {
        topicPractice.push({
          id: `problem:${unsolved.problemId}`,
          kind: 'problem',
          targetId: unsolved.problemId,
          title: unsolved.title,
          topicId: area.targetId,
          topicName,
          lessonId: unsolved.lessonId,
          lessonTitle: null,
          reason: `You haven't solved "${unsolved.title}" yet — give it a try.`,
          priority: 0,
        });
      }
    }

    const lessons = evidence.lessonsByTopic.get(area.targetId) ?? [];
    const lessonBy = new Map<string, LessonPracticeRow>(
      lessons.map((l) => [l.lessonId, l])
    );
    const readyChallenge = (
      evidence.challengesByTopic.get(area.targetId) ?? []
    ).find((c) => !c.passed && lessonBy.get(c.lessonId)?.status === 'completed');
    if (readyChallenge) {
      const lessonTitle = lessonBy.get(readyChallenge.lessonId)?.title ?? null;
      topicPractice.push({
        id: `challenge:${readyChallenge.challengeId}`,
        kind: 'challenge',
        targetId: readyChallenge.challengeId,
        title: readyChallenge.title,
        topicId: area.targetId,
        topicName,
        lessonId: readyChallenge.lessonId,
        lessonTitle,
        reason: lessonTitle
          ? `You covered "${lessonTitle}" — now put it together in this challenge.`
          : 'You are ready to take on this challenge.',
        priority: 0,
      });
    }

    const lesson =
      lessons.find((l) => l.status === 'in-progress') ??
      lessons.find((l) => l.status === 'completed') ??
      lessons[0];
    if (lesson) {
      const reason =
        lesson.status === 'in-progress'
          ? `Continue working on "${lesson.title}".`
          : lesson.status === 'completed'
          ? `Review "${lesson.title}" to solidify it.`
          : `Start with "${lesson.title}" to build a foundation.`;
      topicPractice.push({
        id: `lesson:${lesson.lessonId}`,
        kind: 'lesson',
        targetId: lesson.lessonId,
        title: lesson.title,
        topicId: area.targetId,
        topicName,
        lessonId: lesson.lessonId,
        lessonTitle: lesson.title,
        reason,
        priority: 0,
      });
    }

    topicPractice.sort(
      (a, b) =>
        PRACTICE_TIER[b.kind] - PRACTICE_TIER[a.kind] ||
        a.id.localeCompare(b.id)
    );
    items.push(...topicPractice);
  }

  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.targetId)) {
      return false;
    }
    seen.add(item.targetId);
    return true;
  });

  return unique.map((item, index) => ({ ...item, priority: index + 1 }));
}