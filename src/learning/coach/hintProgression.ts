// ---------------------------------------------------------------------------
// Hint progression (Phase 7 Step 2) — pure, deterministic.
//
// Given a problem/challenge's ordered hints and the learner's conversation
// history, returns the single next hint to show. Once all hints have been
// revealed the coach moves to the explanation (still not the answer directly,
// to keep the Socratic intent). The history is sourced from the existing
// conversation store — it is a simple ordered list, not a memory/embedding
// system.
// ---------------------------------------------------------------------------

import type { Hint } from '@/types/learning';
import type { ConversationMessageLike } from './coachTypes';

function hintIdsFromHistory(
  history: readonly ConversationMessageLike[],
  targetId: string
): Set<string> {
  const ids = new Set<string>();
  const marker = `hint:${targetId}:`;
  for (const msg of history) {
    if (msg.role !== 'assistant') {
      continue;
    }
    if (!msg.content.startsWith(marker)) {
      continue;
    }
    // The marker is the first line of a persisted hint response.
    const firstLine = msg.content.split(/\r?\n/)[0] ?? '';
    const id = firstLine.slice(marker.length).trim();
    if (id.length > 0) {
      ids.add(id);
    }
  }
  return ids;
}

/**
 * The id used when a hint message is persisted by the service, so progression
 * can be re-derived from the history.
 */
export function hintMessageId(targetId: string, hintId: string): string {
  return `hint:${targetId}:${hintId}`;
}

export type HintProgressionResult =
  | { kind: 'hint'; hint: Hint; index: number; total: number }
  | { kind: 'all-hints-shown'; explanation: string }
  | { kind: 'none'; reason: string };

/**
 * Resolves the next hint to show for a target's ordered hint list, given the
 * conversation history.
 *
 * - No hints at all            -> 'none'
 * - Some hints unseen          -> 'hint' (the first unseen, in order)
 * - All hints already shown    -> 'all-hints-shown' (moves to explanation)
 */
export function nextHintFor(
  targetId: string,
  hints: Hint[],
  history: readonly ConversationMessageLike[]
): HintProgressionResult {
  if (hints.length === 0) {
    return { kind: 'none', reason: 'no-hints' };
  }

  const shown = hintIdsFromHistory(history, targetId);
  const ordered = [...hints].sort((a, b) => a.order - b.order);

  const firstUnseen = ordered.find((h) => !shown.has(h.id));
  if (firstUnseen) {
    return {
      kind: 'hint',
      hint: firstUnseen,
      index: ordered.indexOf(firstUnseen) + 1,
      total: ordered.length,
    };
  }

  return { kind: 'all-hints-shown', explanation: '' };
}
