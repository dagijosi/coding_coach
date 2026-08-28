import type { Lesson } from '@/types/learning';

export const functionsLesson: Lesson = {
  id: 'lesson-functions',
  topicId: 'topic-fundamentals',
  title: 'Functions',
  description:
    'Learn how to group code into reusable functions.',
  language: 'javascript',
  difficulty: 'beginner',
  estimatedMinutes: 20,
  order: 2,
  prerequisites: ['lesson-variables'],
  content: [
    {
      type: 'heading',
      content: 'Introduction',
    },
    {
      type: 'text',
      content:
        'A function is a reusable block of code that performs a specific task. You can call it with inputs and get back a result.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `function sum(a, b) {
  return a + b;
}`,
    },
    {
      type: 'text',
      content:
        'The function above takes two numbers and returns their sum. The return keyword sends the result back to the caller.',
    },
  ],
};
