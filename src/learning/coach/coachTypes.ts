// ---------------------------------------------------------------------------
// Coach response engine — type model (Phase 7 Step 2).
//
// The engine is deterministic and content-aware: it builds responses purely
// from the existing Coding Coach content and the learner's progress/mastery
// records. It does not imitate an LLM, never hallucinates facts that are not
// present in the data, and stays fully offline.
// ---------------------------------------------------------------------------

import type { Lesson, Problem, Challenge, Concept } from '@/types/learning';
import type { ProgressSummary } from '@/types/progress';
import type { TopicMastery } from '@/learning/mastery/masteryTypes';
import type { WeakArea } from '@/learning/weakareas/weakAreaTypes';

export type CoachIntent =
  | 'greeting'
  | 'definition'
  | 'explanation'
  | 'hint'
  | 'help'
  | 'example'
  | 'practice'
  | 'progress'
  | 'weakArea'
  | 'lessonHelp'
  | 'problemHelp'
  | 'unknown';

export type SuggestedActionType =
  | 'open_lesson'
  | 'practice_problem'
  | 'try_challenge'
  | 'review_concept'
  | 'view_progress';

/**
 * A reference to something the learner can do next. The UI decides how to
 * render and execute the action; the engine only supplies IDs.
 */
export type SuggestedAction = {
  type: SuggestedActionType;
  targetId: string;
  title: string;
};

/**
 * A structured, content-aware response from the coach. `message` is the plain
 * text shown to the learner; the optional `related*` fields and `actions`
 * carry references the UI may use to offer navigation.
 */
export type CoachResponse = {
  intent: CoachIntent;
  message: string;
  relatedLesson: { id: string; title: string } | null;
  relatedConcept: { id: string; name: string } | null;
  relatedProblem: { id: string; title: string } | null;
  relatedChallenge: { id: string; title: string } | null;
  actions: SuggestedAction[];
  /**
   * When a hint was revealed, the id of the hint that was shown. Used by the
   * persistence layer to record hint progression markers in the conversation
   * history.
   */
  revealedHintId?: string;
};

// ---------------------------------------------------------------------------
// Pure-engine input (structures passed by the service from repositories)
// ---------------------------------------------------------------------------

/**
 * A single question the learner just asked. `history` is the already-stored
 * conversation (used only for hint progression), not a semantic memory store.
 */
export type CoachRequest = {
  message: string;
  history?: readonly ConversationMessageLike[];
};

export type ConversationMessageLike = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/**
 * Every piece of data the engine needs, loaded by the service from the
 * existing repositories. The engine is React/DB-free: it only reads this map
 * and the learner's current context.
 */
export type CoachData = {
  context: {
    currentLessonId: string;
    currentLessonTitle: string;
    topicName: string;
  } | null;
  concepts: Concept[];
  lessons: Lesson[];
  problems: Problem[];
  challenges: Challenge[];
  progressSummary: ProgressSummary;
  topicMastery: TopicMastery[];
  weakAreas: WeakArea[];
  solvedProblemIds: ReadonlySet<string>;
  completedChallengeIds: ReadonlySet<string>;
};

export type BuildCoachResponseOptions = {
  /** Limit on conversational context used for hint progression. */
  hintWindow?: number;
};
