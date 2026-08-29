// ---------------------------------------------------------------------------
// XP rules — single source of truth
//
// All XP a learner earns flows through these values. Screens and repositories
// import from here rather than hard-coding amounts, so the economy can be
// tuned in one place.
//
// Values are deliberately small and cumulative-friendly; a learner earns XP
// for completing a lesson, solving a problem, and completing a challenge.
// Completion XP is only ever awarded once per distinct completion (see the
// progress repository for duplicate-prevention details).
// ---------------------------------------------------------------------------

export const XP_RULES = {
  lesson_completed: 50,
  problem_solved: 10,
  challenge_completed: 25,
  daily_challenge_completed: 50,
} as const;

export type XPEventType = keyof typeof XP_RULES;

export const XP_EVENT_TYPES = Object.keys(XP_RULES) as XPEventType[];

/**
 * Backward-compatible alias used by existing screens (e.g. the home dashboard
 * shows the daily challenge reward). Derived from XP_RULES so there is only
 * one source of truth.
 */
export const LEARNING_XP = {
  lessonComplete: XP_RULES.lesson_completed,
  problemSolved: XP_RULES.problem_solved,
  challengeComplete: XP_RULES.challenge_completed,
  dailyChallengeComplete: XP_RULES.daily_challenge_completed,
} as const;

/**
 * Lightweight description of where XP came from. Used by the progression layer
 * for clarity/logging; the database already records enough information to
 * derive these events, so no extra table is required.
 */
export type XPEvent = {
  type: XPEventType;
  amount: number;
  sourceId: string;
  createdAt: string;
};

export function xpForEvent(type: XPEventType): number {
  return XP_RULES[type];
}
