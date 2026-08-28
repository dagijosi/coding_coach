import type { Challenge } from '@/types/learning';

export const variablesChallenges: Challenge[] = [
  {
    id: 'challenge-variables-counter',
    lessonId: 'lesson-variables',
    title: 'Build a counter',
    description:
      'Write a function that takes a count and returns the next count (count + 1).',
    difficulty: 'beginner',
    order: 1,
    functionName: 'increment',
    starterCode: `function increment(count) {
  // Write your code here
}`,
    testCases: [
      { id: 'counter-1', args: [0], expected: 1 },
      { id: 'counter-2', args: [5], expected: 6 },
      { id: 'counter-3', args: [99], expected: 100 },
    ],
    hints: [
      {
        id: 'hint-counter-1',
        content:
          'The function should return a value.',
        order: 1,
      },
      {
        id: 'hint-counter-2',
        content:
          'Add 1 to the count parameter.',
        order: 2,
      },
    ],
    explanation:
      'The function should return count + 1.',
  },
];
