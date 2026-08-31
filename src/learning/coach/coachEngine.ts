// ---------------------------------------------------------------------------
// Coach response engine (Phase 7 Step 2) — pure, deterministic, React/DB-free.
//
// Turns a learner's question and the loaded Coding Coach data into a
// structured CoachResponse. This module:
//
//   - detects intent (intent.ts)
//   - matches real content (contentMatch.ts)
//   - applies per-intent response strategies
//   - tracks hint progression (hintProgression.ts)
//   - selects practice content (practiceSelection.ts)
//
// It never invents facts, never calls the network, never uses randomness or
// AI. The same CoachRequest + CoachData always yields the same response.
// ---------------------------------------------------------------------------

import { detectIntent, extractTopic } from './intent';
import {
  bestConceptFor,
  lessonForConcept,
  matchConcepts,
  matchLessons,
} from './contentMatch';
import { selectPractice } from './practiceSelection';
import { commandHint } from '@/learning/hint/hintEngine';
import {
  explainConcept as buildConceptExplanation,
  explainProblem as buildProblemExplanation,
} from '@/learning/explanation/explanationEngine';
import type {
  BuildCoachResponseOptions,
  CoachData,
  CoachIntent,
  CoachRequest,
  CoachResponse,
  ConversationMessageLike,
} from './coachTypes';
import type { Concept, Lesson, Problem } from '@/types/learning';

function emptyResponse(intent: CoachIntent): CoachResponse {
  return {
    intent,
    message: '',
    relatedLesson: null,
    relatedConcept: null,
    relatedProblem: null,
    relatedChallenge: null,
    actions: [],
  };
}

function baseMessage(data: CoachData): string {
  const c = data.context;
  const lessonTitle = c.location.lesson?.title;
  const topicName = c.location.topic?.name;
  if (lessonTitle) {
    return `I can help with "${lessonTitle}"${topicName ? ` in ${topicName}` : ''}. `;
  }
  return 'I can help with the topics and lessons in Coding Coach. ';
}

/** Current lesson id from the learner's snapshot (null-safe). */
function currentLessonId(data: CoachData): string | null {
  return data.context.location.lesson?.id ?? null;
}

/** Current concept resolved via the context priority (explicit > current). */
function currentConcept(data: CoachData): Concept | null {
  const conceptRef = data.context.location.concept;
  if (!conceptRef) {
    return null;
  }
  return data.concepts.find((c) => c.id === conceptRef.id) ?? null;
}

/**
 * Returns a one-line personalization note about the learner's most recent
 * problem attempt in the current lesson, backed by real attempt data. Only
 * speaks when the snapshot actually has a matching record — no fabricated
 * praise or blame.
 */
function recentProblemNote(data: CoachData, targetProblemId: string): string {
  const lessonId = currentLessonId(data);
  const recent = data.context.recentProblems
    .filter((r) => !lessonId || data.problems.find((p) => p.id === r.problemId && p.lessonId === lessonId))
    .sort((a, b) => (a.attemptedAt < b.attemptedAt ? -1 : a.attemptedAt > b.attemptedAt ? 1 : 0));
  const last = recent.length > 0 ? recent[recent.length - 1] : null;
  if (!last) {
    return '';
  }
  if (!last.success) {
    return `You didn't get the last one — let's try again with this.\n\n`;
  }
  if (targetProblemId === last.problemId && !data.solvedProblemIds.has(last.problemId)) {
    return `Nice work on "${last.title}"! Here's another.\n\n`;
  }
  return `Nice work on that last problem. Keep it up!\n\n`;
}

/**
 * Appends one context-aware suggested action derived from the learner's
 * snapshot (Section 11). Priority:
 *   1. a weak concept in the current lesson -> review_concept
 *   2. an unfinished lesson -> continue_lesson
 *   3. completed concept + weak problem performance -> practice_problem
 *   4. a strong concept -> try_challenge
 * Only pushes an action it can support with real context data; returns whether
 * one was added.
 */
function appendContextAction(data: CoachData, response: CoachResponse): boolean {
  const ctx = data.context;

  // 1. Weak concept (from real mastery data).
  if (ctx.conceptsNeedingReview.length > 0) {
    const first = ctx.conceptsNeedingReview[0];
    response.actions.push({
      type: 'review_concept',
      targetId: first.conceptId,
      title: `Review "${first.conceptName}"`,
    });
    return true;
  }

  // 2. Current lesson not yet completed -> continue it.
  const lessonId = currentLessonId(data);
  const ls = ctx.currentLessonStatus;
  if (lessonId && ls !== 'completed') {
    response.actions.push({
      type: 'continue_lesson',
      targetId: lessonId,
      title:
        ls === 'in-progress'
          ? 'Continue your current lesson'
          : 'Start your current lesson',
    });
    return true;
  }

  // 3. A strong concept -> suggest a challenge.
  const strong = ctx.topicMastery.find((t) => t.level === 'mastered');
  if (strong) {
    const lesson = data.lessons.find((l) => l.topicId === strong.topicId);
    if (lesson) {
      const challenge = data.challenges.find(
        (c) => c.lessonId === lesson.id && !data.completedChallengeIds.has(c.id)
      );
      if (challenge) {
        response.actions.push({
          type: 'try_challenge',
          targetId: challenge.id,
          title: `Try the "${challenge.title}" challenge`,
        });
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Greeting
// ---------------------------------------------------------------------------
function strategyGreeting(data: CoachData): CoachResponse {
  const response = emptyResponse('greeting');
  response.message = `Hello! ${baseMessage(data)}Ask me to "explain a concept", "give me a hint", "give me a practice question", or "how am I doing?"`;
  appendContextAction(data, response);
  return response;
}

// ---------------------------------------------------------------------------
// Definition
// ---------------------------------------------------------------------------
function strategyDefinition(
  data: CoachData,
  query: string
): CoachResponse {
  const response = emptyResponse('definition');
  const topic = extractTopic(query);
  const concept = topic
    ? bestConceptFor(data.concepts, topic)
    : null;

  if (!concept) {
    const anyConcept = conceptHint(data.concepts, data.lessons, query);
    if (anyConcept) {
      return anyConcept;
    }
    response.message = `I don't have a definition for "${topic || query}" yet. I can only define the concepts currently in Coding Coach.`;
    return response;
  }

  response.relatedConcept = { id: concept.id, name: concept.name };
  response.message = `Here is what "${topic || concept.name}" means:\n\n${concept.summary}`;

  const lesson = lessonForConcept(data.lessons, concept);
  if (lesson) {
    response.relatedLesson = { id: lesson.id, title: lesson.title };
    response.message += `\n\nYou can find this in the lesson "${lesson.title}"`;
    response.actions.push({
      type: 'open_lesson',
      targetId: lesson.id,
      title: `Open "${lesson.title}"`,
    });
  }
  return response;
}

function conceptHint(
  concepts: Concept[],
  lessons: Lesson[],
  query: string
): CoachResponse | null {
  const matched = matchConcepts(concepts, query);
  if (matched.length === 0) {
    return null;
  }
  const concept = matched[0];
  const response = emptyResponse('definition');
  response.relatedConcept = { id: concept.id, name: concept.name };
  response.message = `Here is what that means:\n\n${concept.summary}`;
  const lesson = lessonForConcept(lessons, concept);
  if (lesson) {
    response.relatedLesson = { id: lesson.id, title: lesson.title };
    response.message += `\n\nYou can find this in the lesson "${lesson.title}"`;
    response.actions.push({
      type: 'open_lesson',
      targetId: lesson.id,
      title: `Open "${lesson.title}"`,
    });
  }
  return response;
}

// ---------------------------------------------------------------------------
// Explanation
// ---------------------------------------------------------------------------
function strategyExplanation(
  data: CoachData,
  query: string
): CoachResponse {
  const response = emptyResponse('explanation');
  const topic = extractTopic(query);
  const concept = topic
    ? bestConceptFor(data.concepts, topic)
    : null;

  if (!concept) {
    const matchedConcepts = matchConcepts(data.concepts, query);
    if (matchedConcepts.length > 0) {
      return explainConcept(data, matchedConcepts[0], topic);
    }
    const lessons = matchLessons(data.lessons, query);
    if (lessons.length > 0) {
      const lesson = lessons[0];
      response.relatedLesson = { id: lesson.id, title: lesson.title };
      response.message = `The lesson "${lesson.title}" covers that.\n\n${lesson.description}`;
      response.actions.push({
        type: 'open_lesson',
        targetId: lesson.id,
        title: `Open "${lesson.title}"`,
      });
      return response;
    }
    // Nothing explicit matched — fall back to the learner's current context.
    const current = currentConcept(data);
    if (current) {
      return explainConcept(data, current, current.name);
    }
    const curLessonTitle = data.context.location.lesson?.title;
    response.message = curLessonTitle
      ? `I can't explain "${topic || query}" specifically, but we're in "${curLessonTitle}" — try asking about one of its concepts, like "${curLessonTitle}".`
      : `I can't explain "${topic || query}" because it isn't in Coding Coach yet. Try asking about a topic you've seen, like the concepts in your current lesson.`;
    return response;
  }

  // Explanation builds on the definition with a related example problem.
  response.intent = 'explanation';
  response.relatedConcept = { id: concept.id, name: concept.name };
  response.message = `${concept.summary}`;

  const lesson = lessonForConcept(data.lessons, concept);
  if (lesson) {
    response.relatedLesson = { id: lesson.id, title: lesson.title };
  }

  const related = data.problems.find(
    (p) => p.lessonId === concept.lessonId
  );
  if (related) {
    response.message += `\n\nHere is an example problem for practice:\n"${related.title}" — ${related.description}`;
    response.relatedProblem = { id: related.id, title: related.title };
    response.actions.push({
      type: 'practice_problem',
      targetId: related.id,
      title: `Practice "${related.title}"`,
    });
  } else if (lesson) {
    response.actions.push({
      type: 'open_lesson',
      targetId: lesson.id,
      title: `Open "${lesson.title}"`,
    });
  }
  return response;
}

function explainConcept(
  data: CoachData,
  concept: Concept,
  topic: string
): CoachResponse {
  const response = emptyResponse('explanation');
  response.relatedConcept = { id: concept.id, name: concept.name };
  const lesson = lessonForConcept(data.lessons, concept);
  const related =
    data.problems.find((p) => p.lessonId === concept.lessonId) ?? null;

  // Build the teaching-structure message from stored content (ExplanationEngine).
  const built = buildConceptExplanation({
    concept,
    lesson,
    relatedProblem: related,
  });
  response.message = `Here is what ${topic || concept.name} is about:\n\n${built.message}`;
  response.actions = built.actions;
  if (lesson) {
    response.relatedLesson = { id: lesson.id, title: lesson.title };
  }
  if (related) {
    response.relatedProblem = { id: related.id, title: related.title };
  }
  return response;
}

// ---------------------------------------------------------------------------
// Hint + solution (Phase 7 Step 4 — HintEngine)
// ---------------------------------------------------------------------------
function strategyHint(data: CoachData, request: CoachRequest): CoachResponse {
  const response = emptyResponse('hint');

  // Prefer the current lesson's problem; fall back to the first problem.
  const target = currentProblem(data) ?? data.problems[0] ?? null;
  if (!target) {
    response.message = 'There are no problems available to hint on right now.';
    return response;
  }
  return buildHintResponse(response, data, target, 'hint', request.history ?? []);
}

function strategySolution(data: CoachData, request: CoachRequest): CoachResponse {
  const response = emptyResponse('solution');
  const target = currentProblem(data) ?? data.problems[0] ?? null;
  if (!target) {
    response.message =
      "I need to know which problem you're on before I can show a solution. Open a problem, then ask again.";
    return response;
  }
  const built = buildHintResponse(response, data, target, 'solution', request.history ?? []);
  if (target) {
    built.relatedProblem = { id: target.id, title: target.title };
  }
  return built;
}

function currentProblem(data: CoachData): Problem | null {
  const lessonId = currentLessonId(data);
  if (lessonId) {
    const inLesson = data.problems.find((p) => p.lessonId === lessonId);
    if (inLesson) {
      return inLesson;
    }
  }
  return data.problems[0] ?? null;
}

/** The concept whose lesson a problem belongs to (context integration). */
function conceptForProblem(data: CoachData, problem: Problem): Concept | null {
  return data.concepts.find((c) => c.lessonId === problem.lessonId) ?? null;
}

/** Attempt status for a problem from real progress data. */
function attemptStatusFor(
  data: CoachData,
  problemId: string
): 'unsolved-failed' | 'solved' | 'not-attempted' {
  const rec = data.problemPractice.get(problemId);
  if (!rec) {
    return 'not-attempted';
  }
  if (rec.failed && !rec.solved) {
    return 'unsolved-failed';
  }
  if (rec.solved) {
    return 'solved';
  }
  return 'not-attempted';
}

function buildHintResponse(
  response: CoachResponse,
  data: CoachData,
  problem: Problem,
  kind: 'hint' | 'solution',
  history: readonly ConversationMessageLike[]
): CoachResponse {
  const concept = conceptForProblem(data, problem);
  const lesson = data.lessons.find((l) => l.id === problem.lessonId) ?? null;

  const result = commandHint({
    target: {
      id: problem.id,
      title: problem.title,
      hints: problem.hints,
      explanation: problem.explanation,
    },
    kind,
    history,
    attempt: attemptStatusFor(data, problem.id),
    concept: concept ? { id: concept.id, name: concept.name, summary: concept.summary } : null,
    lessonId: lesson?.id ?? null,
    solved: data.solvedProblemIds.has(problem.id),
  });

  response.relatedProblem = { id: problem.id, title: problem.title };
  response.hintLevel = result.hintLevel;
  response.message = result.message;
  response.actions = result.actions;

  if (result.kind === 'hint') {
    response.revealedHintId = result.revealedHintId;
  }
  return response;
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------
function strategyHelp(data: CoachData): CoachResponse {
  const response = emptyResponse('help');
  response.message = `${baseMessage(data)}Here is what I can help with:\n- "what is X?" for a definition\n- "explain X" for a fuller explanation\n- "give me a hint" for the next hint on the current problem\n- "give me a practice question" for something to solve\n- "how am I doing?" for your progress\n- "what should I practice?" for your weakest areas`;
  return response;
}

// ---------------------------------------------------------------------------
// Example
// ---------------------------------------------------------------------------
function strategyExample(data: CoachData): CoachResponse {
  const response = emptyResponse('example');
  const problem =
    data.problems.find((p) => p.lessonId === currentLessonId(data)) ??
    data.problems[0];
  if (problem) {
    response.relatedProblem = { id: problem.id, title: problem.title };
    response.message = `Here is an example:\n\n"${problem.title}"\n${problem.description}\n${problem.prompt ?? ''}`.trim();
    response.actions.push({
      type: 'practice_problem',
      targetId: problem.id,
      title: `Try "${problem.title}"`,
    });
  } else {
    response.message = 'I do not have an example stored for this yet. Try asking about a concept in your current lesson.';
  }
  return response;
}

// ---------------------------------------------------------------------------
// Practice
// ---------------------------------------------------------------------------
function strategyPractice(data: CoachData): CoachResponse {
  const response = emptyResponse('practice');
  const selection = selectPractice({
    lessons: data.lessons,
    problems: data.problems,
    challenges: data.challenges,
    currentLessonId: currentLessonId(data) ?? '',
    solvedProblemIds: data.solvedProblemIds,
    completedChallengeIds: data.completedChallengeIds,
    weakAreas: data.weakAreas,
  });

  if (selection.kind === 'none') {
    response.message = selection.reason;
    return response;
  }

  if (selection.kind === 'problem') {
    response.relatedProblem = {
      id: selection.problem.id,
      title: selection.problem.title,
    };
    const opening = recentProblemNote(data, selection.problem.id);
    response.message = `${opening}${selection.reason}\n\n${selection.problem.description}${selection.problem.prompt ? `\n${selection.problem.prompt}` : ''}`.trim();
    response.actions.push({
      type: 'practice_problem',
      targetId: selection.problem.id,
      title: `Practice "${selection.problem.title}"`,
    });
    return response;
  }

  response.relatedChallenge = {
    id: selection.challenge.id,
    title: selection.challenge.title,
  };
  response.message = `${selection.reason}\n\n${selection.challenge.description}`.trim();
  response.actions.push({
    type: 'try_challenge',
    targetId: selection.challenge.id,
    title: `Try "${selection.challenge.title}"`,
  });
  return response;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------
function strategyProgress(data: CoachData): CoachResponse {
  const response = emptyResponse('progress');
  const p = data.progressSummary;
  const hasActivity =
    p.completedLessons > 0 ||
    p.solvedProblems > 0 ||
    p.completedChallenges > 0 ||
    p.totalAttempts > 0 ||
    p.totalXP > 0 ||
    p.currentStreak > 0;

  if (!hasActivity) {
    response.message =
      'You have not started yet. Open a lesson to begin your learning journey, and I can track your progress from there.';
  } else {
    const lines: string[] = [];
    if (p.totalLessons > 0) {
      lines.push(`You have completed ${p.completedLessons} of ${p.totalLessons} lessons`);
    }
    if (p.totalProblems > 0 && (p.solvedProblems > 0 || p.totalAttempts > 0)) {
      lines.push(`You have solved ${p.solvedProblems} of ${p.totalProblems} problems`);
    }
    if (p.completedChallenges > 0) {
      lines.push(`You have completed ${p.completedChallenges} challenges`);
    }
    if (p.totalAttempts > 0) {
      lines.push(`Your overall success rate is ${Math.round(p.successRate)}%`);
    }
    if (p.totalXP > 0) {
      lines.push(`You have earned ${p.totalXP} XP`);
    }
    if (p.currentStreak > 0) {
      lines.push(`You are on a ${p.currentStreak}-day streak`);
    }
    response.message = `Here is your progress so far:\n\n${lines.map((l) => `- ${l}`).join('\n')}`;
    // Personalize with an honest note when a strong topic exists.
    const strong = data.topicMastery.find((t) => t.level === 'mastered');
    if (strong) {
      response.message += `\n\nYou are doing well with "${strong.topicName}" — keep it up!`;
    }
  }
  response.actions.push({
    type: 'view_progress',
    targetId: 'progress',
    title: 'View your progress',
  });
  appendContextAction(data, response);
  return response;
}

// ---------------------------------------------------------------------------
// Weak area
// ---------------------------------------------------------------------------
function strategyWeakArea(data: CoachData): CoachResponse {
  const response = emptyResponse('weakArea');
  const conceptReview =
    data.context.conceptsNeedingReview.length > 0
      ? data.context.conceptsNeedingReview[0]
      : null;

  // A weak concept from real mastery data is worth surfacing even when no
  // topic-level weak area has been detected yet.
  if (data.weakAreas.length === 0) {
    if (conceptReview) {
      response.message = `Your mastery of "${conceptReview.conceptName}" (${conceptReview.masteryScore}%) is below the review threshold — worth revisiting.`;
      response.actions.push({
        type: 'review_concept',
        targetId: conceptReview.conceptId,
        title: `Review "${conceptReview.conceptName}"`,
      });
    } else {
      response.message =
        'Based on your work so far, I have not identified a weak area yet. Keep practicing and I will help you focus where needed.';
    }
    response.actions.push({
      type: 'view_progress',
      targetId: 'progress',
      title: 'View your progress',
    });
    return response;
  }

  const first = data.weakAreas[0];
  const header = first.kind === 'topic' ? first.targetName : first.topicName ?? first.targetName;
  response.message = `Your weakest area right now is "${first.targetName}".`;

  const practice = selectPractice({
    lessons: data.lessons,
    problems: data.problems,
    challenges: data.challenges,
    currentLessonId: currentLessonId(data) ?? '',
    solvedProblemIds: data.solvedProblemIds,
    completedChallengeIds: data.completedChallengeIds,
    weakAreas: [first],
  });

  if (practice.kind === 'problem') {
    response.message += `\n\nTry the practice problem "${practice.problem.title}" next.`;
    response.relatedProblem = {
      id: practice.problem.id,
      title: practice.problem.title,
    };
    response.actions.push({
      type: 'practice_problem',
      targetId: practice.problem.id,
      title: `Practice "${practice.problem.title}"`,
    });
  } else if (practice.kind === 'challenge') {
    response.message += `\n\nTry the challenge "${practice.challenge.title}" next.`;
    response.relatedChallenge = {
      id: practice.challenge.id,
      title: practice.challenge.title,
    };
    response.actions.push({
      type: 'try_challenge',
      targetId: practice.challenge.id,
      title: `Try "${practice.challenge.title}"`,
    });
  }

  if (header !== first.targetName && header) {
    response.message += `\n\n(Related topic: ${header})`;
  }

  // Context-aware personalization: a weak concept from the snapshot warrants a
  // "review this concept" suggestion, backed by real mastery data.
  const conceptReviewNote =
    data.context.conceptsNeedingReview.length > 0
      ? data.context.conceptsNeedingReview[0]
      : null;
  if (conceptReviewNote) {
    response.message += `\n\nYour mastery of "${conceptReviewNote.conceptName}" is ${conceptReviewNote.masteryScore}% — worth revisiting.`;
    response.actions.push({
      type: 'review_concept',
      targetId: conceptReviewNote.conceptId,
      title: `Review "${conceptReviewNote.conceptName}"`,
    });
  }
  return response;
}

// ---------------------------------------------------------------------------
// Lesson help
// ---------------------------------------------------------------------------
function strategyLessonHelp(data: CoachData): CoachResponse {
  const response = emptyResponse('lessonHelp');
  const lessonRef = data.context.location.lesson;
  const topicName = data.context.location.topic?.name;
  if (lessonRef) {
    const lesson = data.lessons.find((l) => l.id === lessonRef.id);
    // Build an explanation-style summary from the lesson's content.
    const textBlocks = lesson
      ? lesson.content
          .filter((b) => b.type === 'text')
          .map((b) => b.content)
      : [];
    response.relatedLesson = lesson
      ? { id: lesson.id, title: lesson.title }
      : null;
    if (lesson) {
      response.message = `Here is some help with "${lessonRef.title}"${topicName ? ` (${topicName})` : ''}:\n\n${textBlocks.join(' ') || lesson.description}`;
      response.actions.push({
        type: 'open_lesson',
        targetId: lesson.id,
        title: `Open "${lesson.title}"`,
      });
    } else {
      response.message = `We are in "${lessonRef.title}" but I don't have its content details right now.`;
    }
  } else {
    response.message =
      'I need to know which lesson you are on to help specifically. Open a lesson first, then ask again.';
  }
  return response;
}

// ---------------------------------------------------------------------------
// Problem help
// ---------------------------------------------------------------------------
function strategyProblemHelp(data: CoachData): CoachResponse {
  const response = emptyResponse('problemHelp');
  const problem = currentProblem(data);

  if (!problem) {
    response.message =
      'I need to know which problem you are on. Open a problem first, then ask for help.';
    return response;
  }

  response.relatedProblem = { id: problem.id, title: problem.title };
  const concept = conceptForProblem(data, problem);
  const built = buildProblemExplanation({
    problem,
    concept: concept ? { id: concept.id, name: concept.name, summary: concept.summary } : null,
    showPrompt: true,
  });
  response.message = built.message;
  if (problem.hints.length > 0) {
    response.message +=
      '\n\nSay "give me a hint" and I will walk you through it step by step without giving away the answer.';
  }
  response.actions = built.actions;
  return response;
}

// ---------------------------------------------------------------------------
// Unknown fallback
// ---------------------------------------------------------------------------
function strategyUnknown(data: CoachData, query: string): CoachResponse {
  const response = emptyResponse('unknown');
  response.message =
    "I'm not sure about that yet. I can currently help with the topics and lessons available in Coding Coach.";

  const suggested = [
    ...matchConcepts(data.concepts, query),
  ];
  const lesson = suggested.length > 0
    ? lessonForConcept(data.lessons, suggested[0])
    : null;
  if (lesson) {
    response.relatedLesson = { id: lesson.id, title: lesson.title };
    response.message += `\n\nFor example, "${lesson.title}" covers topics you might be asking about.`;
    response.actions.push({
      type: 'open_lesson',
      targetId: lesson.id,
      title: `Open "${lesson.title}"`,
    });
    return response;
  }
  response.message += '\n\nTry asking about a concept, asking for a hint, or asking how you are doing.';
  return response;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------
export function buildCoachResponse(
  data: CoachData,
  request: CoachRequest,
  _options?: BuildCoachResponseOptions
): CoachResponse {
  const intent = detectIntent(request.message);

  switch (intent) {
    case 'greeting':
      return strategyGreeting(data);
    case 'definition':
      return strategyDefinition(data, request.message);
    case 'explanation':
      return strategyExplanation(data, request.message);
    case 'hint':
      return strategyHint(data, request);
    case 'solution':
      return strategySolution(data, request);
    case 'help':
      return strategyHelp(data);
    case 'example':
      return strategyExample(data);
    case 'practice':
      return strategyPractice(data);
    case 'progress':
      return strategyProgress(data);
    case 'weakArea':
      return strategyWeakArea(data);
    case 'lessonHelp':
      return strategyLessonHelp(data);
    case 'problemHelp':
      return strategyProblemHelp(data);
    case 'unknown':
    default:
      return strategyUnknown(data, request.message);
  }
}
