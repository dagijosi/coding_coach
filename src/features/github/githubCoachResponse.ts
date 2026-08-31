// ---------------------------------------------------------------------------
// GitHub ↔ Coach bridge (Phase 8).
//
// A bolt-on that lets the existing offline Coach answer GitHub-activity
// questions using ONLY the locally-cached data. It lives in the feature layer
// (not the learning engine) so GitHub stays isolated from the pure learning
// system: the engine never imports GitHub, and GitHub never invents facts.
//
// When the learner's message mentions GitHub/repos/commits/releases, we build a
// deterministic CoachResponse from the cache. If GitHub isn't set up or there's
// no activity, we return a helpful guidance response (never a hallucination).
// ---------------------------------------------------------------------------

import { matchesGithubIntent, getCoachGithubSummary } from '@/github/githubService';
import type { CoachGithubResult } from '@/github/githubService';
import type { CoachResponse } from '@/learning/coach/coachTypes';

/**
 * Optimistic check used to short-circuit before hitting the DB/engine.
 * Pure and cheap — call it first; only call buildGithubCoachResponse when this
 * returns true.
 */
export { matchesGithubIntent };

/**
 * Loads the cached GitHub summary and, if the message is GitHub-related,
 * returns a ready-to-persist CoachResponse. Returns null when the message is
 * not about GitHub (so the caller falls through to the normal coach).
 */
export async function buildGithubCoachResponse(
  message: string,
  summary?: CoachGithubResult
): Promise<CoachResponse | null> {
  if (!matchesGithubIntent(message)) {
    return null;
  }
  const result = summary ?? (await getCoachGithubSummary());
  return makeGithubCoachResponse(result);
}

/** Pure: turns a cached summary into a structured CoachResponse. */
export function makeGithubCoachResponse(result: CoachGithubResult): CoachResponse {
  const available = result.available;
  return {
    intent: 'github',
    message: result.message,
    relatedLesson: null,
    relatedConcept: null,
    relatedProblem: null,
    relatedChallenge: null,
    actions: available
      ? [{ type: 'open_github', targetId: '/github', title: 'Open GitHub' }]
      : [],
  };
}
