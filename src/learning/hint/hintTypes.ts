// ---------------------------------------------------------------------------
// Hint & Explanation engines — type model (Phase 7 Step 4).
//
// Pure, deterministic, React/DB-free. All inputs are content/learner data that
// already exists in Coding Coach; nothing is invented, nothing calls the
// network, and no AI is involved.
// ---------------------------------------------------------------------------

import type { Hint } from '@/types/learning';
import type { SuggestedAction, ConversationMessageLike } from '@/learning/coach/coachTypes';

/**
 * A progressive teaching level attached to an existing hint, derived from its
 * position in the ordered hint list:
 *
 *   conceptual     — broad direction ("Think about what a variable is")
 *   specific       — more focused guidance ("Check which binding can change")
 *   implementation — concrete steps ("Use `let`, not `const`, here")
 *
 * This is a label on content that already exists in the database; the engine
 * never synthesizes new hint text.
 */
export type HintLevel = 'conceptual' | 'specific' | 'implementation';

/** How the last stored attempt for the current target went. */
export type AttemptStatus = 'unsolved-failed' | 'solved' | 'not-attempted';

/**
 * The request the engine is answering about a single problem/challenge.
 * `solution` = the learner explicitly asked to be shown the answer.
 */
export type HintCommandKind = 'hint' | 'solution';

export type HintTarget = {
  id: string;
  title: string;
  hints: Hint[];
  /** The stored walkthrough/explanation (revealed only after progression). */
  explanation: string;
};

export type HintCommandInput = {
  target: HintTarget;
  kind: HintCommandKind;
  history: readonly ConversationMessageLike[];
  /** Attempt-aware signal for the target problem (from real progress data). */
  attempt: AttemptStatus;
  /** Current concept (from the Step 3 learning context), if any. */
  concept: { id: string; name: string; summary: string } | null;
  /** The lesson the target belongs to (for open/continue actions), if known. */
  lessonId: string | null;
  /** Whether the learner has already solved this target. */
  solved: boolean;
};

export type HintCommandResult =
  | {
      kind: 'hint';
      message: string;
      hintLevel: HintLevel;
      index: number;
      total: number;
      revealedHintId: string;
      actions: SuggestedAction[];
    }
  | {
      kind: 'all-hints-shown';
      message: string;
      hintLevel: HintLevel;
      actions: SuggestedAction[];
    }
  | {
      kind: 'no-hints';
      message: string;
      hintLevel: HintLevel;
      actions: SuggestedAction[];
    }
  | {
      kind: 'solution';
      message: string;
      hintLevel: HintLevel;
      actions: SuggestedAction[];
    }
  | {
      kind: 'already-solved';
      message: string;
      hintLevel: HintLevel;
      actions: SuggestedAction[];
    };
