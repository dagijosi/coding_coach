// ---------------------------------------------------------------------------
// Learning context resolution (Phase 7 Step 3) — pure, deterministic,
// React/DB-free.
//
// Pure helpers for interpreting a request against the learner's current
// context. The core rule (Section 7 of the spec):
//
//   1. Explicit subject in the user's message
//   2. Current concept
//   3. Current lesson
//   4. Current topic
//   5. Relevant weak area
//   6. General available content
//
// An explicit subject in the message always wins over the current context.
// ---------------------------------------------------------------------------

import type { LearningContext } from './learningContextTypes';

/**
 * The concept that should be treated as "active" for a question, applying the
 * context-priority rule. `explicitConcept` (the concept matched from an
 * explicit subject in the message) wins; otherwise the current concept; then
 * the current lesson's first concept; then null.
 */
export function resolveActiveConcept(
  ctx: LearningContext,
  explicitConcept: { id: string; name: string } | null
): { id: string; name: string } | null {
  if (explicitConcept) {
    return explicitConcept;
  }
  if (ctx.location.concept) {
    return ctx.location.concept;
  }
  return null;
}

/**
 * The lesson that should be treated as "current" for a question. Prefers the
 * explicit lesson (from the message) then the current lesson, and finally the
 * first available lesson (general content fallback).
 */
export function resolveCurrentLesson(
  ctx: LearningContext,
  explicitLessonId: string | null,
  allLessonIds: readonly string[]
): { id: string; title: string } | null {
  if (explicitLessonId) {
    // Caller ensures this id exists in allLessonIds.
    return ctx.location.lesson?.id === explicitLessonId
      ? ctx.location.lesson
      : { id: explicitLessonId, title: '' };
  }
  if (ctx.location.lesson) {
    return ctx.location.lesson;
  }
  if (allLessonIds.length > 0) {
    return { id: allLessonIds[0], title: '' };
  }
  return null;
}

/** True when the learner is currently inside a lesson (has a location). */
export function hasActiveLesson(ctx: LearningContext): boolean {
  return ctx.location.lesson !== null;
}
