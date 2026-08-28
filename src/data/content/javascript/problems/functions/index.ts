import type { Problem } from '@/types/learning';

export const functionsProblems: Problem[] = [
  {
    id: 'problem-functions-return',
    lessonId: 'lesson-functions',
    title: 'What does the function return?',
    description:
      'Predict what this function returns when called.',
    type: 'predict-output',
    difficulty: 'beginner',
    order: 1,
    prompt:
      `function double(n) {
  return n * 2;
}

double(4);`,
    choices: ['4', '8', 'undefined'],
    answer: 1,
    hints: [
      {
        id: 'hint-fn-return-1',
        content:
          'The function multiplies its input by 2.',
        order: 1,
      },
      {
        id: 'hint-fn-return-2',
        content:
          'double(4) computes 4 * 2.',
        order: 2,
      },
    ],
    explanation:
      'double(n) returns n * 2, so double(4) returns 8.',
  },
];
