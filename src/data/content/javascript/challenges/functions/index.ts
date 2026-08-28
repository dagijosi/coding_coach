import type { Challenge } from '@/types/learning';

export const functionsChallenges: Challenge[] = [
  {
    id: 'challenge-functions-sum',
    lessonId: 'lesson-functions',
    title: 'Sum Two Numbers',
    description:
      'Create a function that returns the sum of two numbers.',
    difficulty: 'beginner',
    order: 1,
    functionName: 'sum',
    starterCode: `function sum(a, b) {
  // Write your code here
}`,
    testCases: [
      { id: 'sum-1', args: [2, 3], expected: 5 },
      { id: 'sum-2', args: [5, 7], expected: 12 },
      { id: 'sum-3', args: [0, 4], expected: 4 },
    ],
    hints: [
      {
        id: 'hint-sum-1',
        content:
          'The function should return a value.',
        order: 1,
      },
      {
        id: 'hint-sum-2',
        content:
          'Use the + operator to add a and b.',
        order: 2,
      },
    ],
    explanation:
      'The function should return a + b.',
  },
];
