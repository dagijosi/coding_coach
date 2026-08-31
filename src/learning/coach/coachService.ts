// ---------------------------------------------------------------------------
// Coach service (Phase 7 Step 2) — application-layer API.
//
// Implements the CodingCoachAssistant abstraction from Phase 7 Step 1. It
// loads the existing content + progress + mastery + weak-area data through the
// existing repositories, hands it to the pure coachEngine.ts, and returns a
// structured CoachResponse. No AI, no network, no LLM — fully offline and
// deterministic for a fixed database state.
// ---------------------------------------------------------------------------

import type { CodingCoachAssistant } from '@/assistant/CodingCoachAssistant';
import type { AssistantContext, AssistantResponse } from '@/assistant/CodingCoachAssistant';
import { getChallenges } from '@/repositories/challengeRepository';
import { getConcepts } from '@/repositories/conceptRepository';
import { getLessons } from '@/repositories/lessonRepository';
import { getProblems } from '@/repositories/problemRepository';
import {
  getCompletedChallengeIds,
  getProgressSummary,
  getSolvedProblemIds,
  getTopicMastery,
} from '@/repositories/progressRepository';
import { getWeakAreas } from '@/learning/weakareas/weakAreaService';

import { buildCoachResponse } from './coachEngine';
import type {
  CoachData,
  CoachRequest,
  CoachResponse,
} from './coachTypes';
import { hintMessageId } from './hintProgression';

export {
  buildCoachResponse,
} from './coachEngine';
export { detectIntent, extractTopic } from './intent';
export { selectPractice } from './practiceSelection';
export { nextHintFor, hintMessageId } from './hintProgression';
export {
  bestConceptFor,
  lessonForConcept,
  matchChallenges,
  matchConcepts,
  matchLessons,
  matchProblems,
} from './contentMatch';
export type {
  BuildCoachResponseOptions,
  CoachData,
  CoachIntent,
  CoachRequest,
  CoachResponse,
  SuggestedAction,
  SuggestedActionType,
} from './coachTypes';
export type { HintProgressionResult } from './hintProgression';
export type { PracticeSelection } from './practiceSelection';

/**
 * Converts the Step 1 AssistantContext into the pure engine's CoachData by
 * loading the remaining content/evidence it needs through the repositories.
 */
export async function loadCoachData(
  context: AssistantContext,
  now = new Date()
): Promise<CoachData> {
  const [
    concepts,
    lessons,
    problems,
    challenges,
    solvedProblemIds,
    completedChallengeIds,
    topicMastery,
  ] = await Promise.all([
    getConcepts(),
    getLessons(),
    getProblems(),
    getChallenges(),
    getSolvedProblemIds(),
    getCompletedChallengeIds(),
    getTopicMastery(now),
  ]);

  return {
    context: context.currentLessonId
      ? {
          currentLessonId: context.currentLessonId,
          currentLessonTitle: context.currentLessonTitle,
          topicName: context.topicName,
        }
      : null,
    concepts,
    lessons,
    problems,
    challenges,
    progressSummary: context.progressSummary,
    topicMastery,
    weakAreas: context.weakAreas,
    solvedProblemIds: new Set(solvedProblemIds),
    completedChallengeIds: new Set(completedChallengeIds),
  };
}

/**
 * A concrete CodingCoachAssistant that generates deterministic coaching
 * responses from the real Coding Coach content and the learner's data.
 */
export class CoachResponseEngine implements CodingCoachAssistant {
  getStatus(): 'available' {
    return 'available';
  }

  async respond(context: AssistantContext): Promise<AssistantResponse> {
    // The assistant abstraction receives the learner's current lesson info
    // plus progress/mastery/weak-area context, but not the raw question text
    // (that arrives via a separate channel). We still produce a useful,
    // context-aware status response here. Message content is normally built
    // from loadCoachData + buildCoachResponse; see respondToRequest for the
    // full pipeline.
    return {
      status: 'success',
      content: `I'm ready to help with "${context.currentLessonTitle}". Ask me to explain a concept, give you a hint, or give you something to practice.`,
    };
  }
}

/**
 * The full request pipeline: load content + learner data, build a structured
 * response, and return it. `history` is passed through so hint progression can
 * be derived from the already-stored conversation.
 */
export async function respondToRequest(
  context: AssistantContext,
  message: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  now = new Date()
): Promise<CoachResponse> {
  const data = await loadCoachData(context, now);
  const request: CoachRequest = { message, history };
  return buildCoachResponse(data, request);
}

/**
 * Returns the assistant-message body to persist for a produced response.
 *
 * Hint responses are prefixed with a machine-readable marker line so that
 * hint progression can be re-derived from the stored conversation history (see
 * hintProgression.ts). The UI layer strips marker lines before display.
 */
export function persistenceBody(
  response: CoachResponse,
  hintTargetId: string | null
): string {
  if (
    response.intent === 'hint' &&
    response.revealedHintId &&
    hintTargetId
  ) {
    return `${hintMessageId(hintTargetId, response.revealedHintId)}\n${response.message}`;
  }
  return response.message;
}

