// ---------------------------------------------------------------------------
// Coach shared constants (Phase 7 Step 3).
//
// Thresholds are derived from the central Step 3 mastery bands so the coach
// never drifts from the mastery system (same pattern as recommendationTypes).
// ---------------------------------------------------------------------------

import { MASTERY_THRESHOLDS } from '@/learning/mastery/mastery';

/**
 * A concept whose mastery is below this is flagged as "needing review" in the
 * learning context. Uses the `developing` band: anything not yet developing is
 * a candidate for review.
 */
export const PROGRESS_REVIEW_MASTERY_MAX = MASTERY_THRESHOLDS.developing;

/**
 * A concept whose mastery is at or above this is considered "strong" — a good
 * candidate for moving on to a challenge rather than more basic practice.
 */
export const COACH_STRONG_MASTERY_MIN = MASTERY_THRESHOLDS.proficient;
