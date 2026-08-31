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
import { nextHintFor } from './hintProgression';
import { selectPractice } from './practiceSelection';
import type {
  BuildCoachResponseOptions,
  CoachData,
  CoachIntent,
  CoachRequest,
  CoachResponse,
} from './coachTypes';
import type { Concept, Lesson } from '@/types/learning';

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
  if (c) {
    return `I can help with "${c.currentLessonTitle}"${c.topicName ? ` in ${c.topicName}` : ''}. `;
  }
  return 'I can help with the topics and lessons in Coding Coach. ';
}

// ---------------------------------------------------------------------------
// Greeting
// ---------------------------------------------------------------------------
function strategyGreeting(data: CoachData): CoachResponse {
  const response = emptyResponse('greeting');
  response.message = `Hello! ${baseMessage(data)}Ask me to "explain a concept", "give me a hint", "give me a practice question", or "how am I doing?"`;
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
    response.message = `I can't explain "${topic || query}" because it isn't in Coding Coach yet. Try asking about a topic you've seen, like the concepts in your current lesson.`;
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
  response.message = `Here is what ${topic || concept.name} is about:\n\n${concept.summary}`;
  const lesson = lessonForConcept(data.lessons, concept);
  if (lesson) {
    response.relatedLesson = { id: lesson.id, title: lesson.title };
    const related = data.problems.find(
      (p) => p.lessonId === concept.lessonId
    );
    if (related) {
      response.message += `\n\nTo practice, try "${related.title}".`;
      response.relatedProblem = { id: related.id, title: related.title };
      response.actions.push({
        type: 'practice_problem',
        targetId: related.id,
        title: `Practice "${related.title}"`,
      });
    } else {
      response.actions.push({
        type: 'open_lesson',
        targetId: lesson.id,
        title: `Open "${lesson.title}"`,
      });
    }
  }
  return response;
}

// ---------------------------------------------------------------------------
// Hint
// ---------------------------------------------------------------------------
function strategyHint(data: CoachData, request: CoachRequest): CoachResponse {
  const response = emptyResponse('hint');

  // Prefer the current lesson's first problem.
  const target = currentProblem(data);
  if (!target) {
    const any = data.problems[0];
    if (!any) {
      response.message = 'There are no problems available to hint on right now.';
      return response;
    }
    return buildHint(response, data, any.id, any.hints, request);
  }

  return buildHint(response, data, target.id, target.hints, request);
}

function currentProblem(data: CoachData): {
  id: string;
  title: string;
  hints: CoachData['problems'][number]['hints'];
} | null {
  if (!data.context || !data.context.currentLessonId) {
    return null;
  }
  const inLesson = data.problems.find(
    (p) => p.lessonId === data.context!.currentLessonId
  );
  if (inLesson) {
    return { id: inLesson.id, title: inLesson.title, hints: inLesson.hints };
  }
  return data.problems[0] ?? null;
}

function buildHint(
  response: CoachResponse,
  data: CoachData,
  targetId: string,
  hints: CoachData['problems'][number]['hints'],
  request: CoachRequest
): CoachResponse {
  const progression = nextHintFor(targetId, hints, request.history ?? []);

  if (progression.kind === 'none') {
    response.message =
      'I have no hints stored for this item yet, so I can only suggest you reread the lesson and try again.';
    return response;
  }

  if (progression.kind === 'hint') {
    const problem = data.problems.find((p) => p.id === targetId);
    response.relatedProblem = problem
      ? { id: problem.id, title: problem.title }
      : null;
    response.message = `Here is hint ${progression.index} of ${progression.total} for "${targetTitle(data, targetId)}":\n\n${progression.hint.content}`;
    response.revealedHintId = progression.hint.id;
    response.relatedProblem && response.actions.push({
      type: 'practice_problem',
      targetId,
      title: `Try "${targetTitle(data, targetId)}"`,
    });
    return response;
  }

  // All hints shown — move toward the explanation, not the raw answer.
  const problem = data.problems.find((p) => p.id === targetId);
  if (problem) {
    response.relatedProblem = { id: problem.id, title: problem.title };
    response.message = `You've seen all the hints for "${problem.title}". Here is the explanation to help you understand it:\n\n${problem.explanation}`;
  } else {
    response.message =
      "You've seen all the available hints. Would you like to try tackling it again?";
  }
  return response;
}

function targetTitle(data: CoachData, targetId: string): string {
  const p = data.problems.find((x) => x.id === targetId);
  if (p) {
    return p.title;
  }
  const c = data.challenges.find((x) => x.id === targetId);
  return c ? c.title : targetId;
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
  const problem = data.problems[0];
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
    currentLessonId: data.context?.currentLessonId ?? '',
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
    response.message = `${selection.reason}\n\n${selection.problem.description}${selection.problem.prompt ? `\n${selection.problem.prompt}` : ''}`.trim();
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
  }
  response.actions.push({
    type: 'view_progress',
    targetId: 'progress',
    title: 'View your progress',
  });
  return response;
}

// ---------------------------------------------------------------------------
// Weak area
// ---------------------------------------------------------------------------
function strategyWeakArea(data: CoachData): CoachResponse {
  const response = emptyResponse('weakArea');
  if (data.weakAreas.length === 0) {
    response.message =
      'Based on your work so far, I have not identified a weak area yet. Keep practicing and I will help you focus where needed.';
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
    currentLessonId: data.context?.currentLessonId ?? '',
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
  return response;
}

// ---------------------------------------------------------------------------
// Lesson help
// ---------------------------------------------------------------------------
function strategyLessonHelp(data: CoachData): CoachResponse {
  const response = emptyResponse('lessonHelp');
  const c = data.context;
  if (c && c.currentLessonId) {
    const lesson = data.lessons.find((l) => l.id === c.currentLessonId);
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
      response.message = `Here is some help with "${c.currentLessonTitle}" (${c.topicName}):\n\n${textBlocks.join(' ') || lesson.description}`;
      response.actions.push({
        type: 'open_lesson',
        targetId: lesson.id,
        title: `Open "${lesson.title}"`,
      });
    } else {
      response.message = `We are in "${c.currentLessonTitle}" but I don't have its content details right now.`;
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
  const target = currentProblem(data);

  if (!target) {
    response.message =
      'I need to know which problem you are on. Open a problem first, then ask for help.';
    return response;
  }

  const problem = data.problems.find((p) => p.id === target.id);
  if (problem) {
    response.relatedProblem = { id: problem.id, title: problem.title };
    const hasHints = problem.hints.length > 0;
    response.message = `Let me help you with "${problem.title}".\n\n${problem.description}${problem.prompt ? `\n\n${problem.prompt}` : ''}`;
    if (hasHints) {
      response.message +=
        '\n\nSay "give me a hint" and I will walk you through it step by step without giving away the answer.';
    }
    response.actions.push({
      type: 'practice_problem',
      targetId: problem.id,
      title: `Work on "${problem.title}"`,
    });
  } else {
    response.message = 'I did not find the current problem. Please select a problem first.';
  }
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
