export type Difficulty =
  | 'beginner'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'intermediate'
  | 'advanced';

// ---------------------------------------------------------------------------
// Content hierarchy
//
//   course
//     └── topic (courseId)
//           └── lesson (topicId)
//                 ├── concept (lessonId)
//                 ├── problem (lessonId)
//                 └── challenge (lessonId)
// ---------------------------------------------------------------------------

export type Course = {
  id: string;
  name: string;
  language: string;
  description: string;
  order: number;
};

export type Topic = {
  id: string;
  courseId: string;
  name: string;
  description: string;
  order: number;
};

export type Lesson = {
  id: string;
  topicId: string;
  title: string;
  description: string;
  language: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  order: number;
  prerequisites: string[];
  content: LessonContent[];
};

export type LessonContent =
  | {
      type: 'heading';
      content: string;
    }
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'code';
      language?: string;
      content: string;
    };

export type Concept = {
  id: string;
  lessonId: string;
  name: string;
  summary: string;
  order: number;
};

export type ProblemType =
  | 'multiple-choice'
  | 'predict-output'
  | 'debugging'
  | 'code-completion'
  | 'true-false';

export type Problem = {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  type: ProblemType;
  difficulty: Difficulty;
  order: number;
  prompt?: string;
  choices?: string[];
  answer?: number;
  hints: Hint[];
  explanation: string;
};

export type Challenge = {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  functionName: string;
  starterCode: string;
  testCases: TestCase[];
  hints: Hint[];
  explanation: string;
};

export type Hint = {
  id: string;
  content: string;
  order: number;
};

export type TestCase = {
  id: string;
  args: unknown[];
  expected: unknown;
};

// ---------------------------------------------------------------------------
// Progress (kept separate from content)
// ---------------------------------------------------------------------------

export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

export type LessonProgress = {
  lessonId: string;
  status: LessonStatus;
  startedAt: string | null;
  completedAt: string | null;
  progress: number;
};

export type ProblemAttempt = {
  id: number;
  problemId: string;
  answer: number;
  correct: boolean;
  attemptedAt: string;
};

export type ChallengeAttempt = {
  id: number;
  challengeId: string;
  testsPassed: number;
  testsTotal: number;
  passed: boolean;
  attemptedAt: string;
};
