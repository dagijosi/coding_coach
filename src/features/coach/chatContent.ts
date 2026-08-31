// ---------------------------------------------------------------------------
// Chat content — pure, testable helpers for the Chat UI (Phase 7 Step 6).
//
// Kept React/DB-free so the controller stays thin and these rules can be
// covered by the Node smoke harness, matching the project's testing approach.
// ---------------------------------------------------------------------------

/** Hint-progression marker line prefix (see hintProgression.ts). */
export const HINT_MARKER_PREFIX = 'hint:';

/**
 * Strips a machine-readable hint marker (first line starts with `hint:`), if
 * any, leaving only the learner-facing text. Used for display (§6).
 */
export function stripHintMarker(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] ?? '';
  if (firstLine.startsWith(HINT_MARKER_PREFIX)) {
    return content.split(/\r?\n/).slice(1).join('\n').trim();
  }
  return content;
}

/** A message is only sendable when it has non-whitespace content (§13). */
export function isUsableMessage(raw: string): boolean {
  return raw.trim().length > 0;
}

/**
 * Maps a suggested action back to a coach request prompt when the action should
 * round-trip through the engine, or null when it is a navigation/UI action.
 */
export function enginePromptForAction(action: {
  type: string;
  targetId: string;
}): string | null {
  if (action.type === 'next_hint') {
    return 'Give me another hint';
  }
  if (action.type === 'view_solution') {
    return 'Explain the solution';
  }
  return null;
}
