import type { Lesson } from '@/types/learning';

export const variablesLesson: Lesson = {
  id: 'lesson-variables',
  topicId: 'topic-fundamentals',
  title: 'Variables',
  description:
    'Learn how JavaScript stores values in named containers.',
  language: 'javascript',
  difficulty: 'beginner',
  estimatedMinutes: 15,
  order: 1,
  prerequisites: [],
  content: [
    {
      type: 'heading',
      content: 'Introduction',
    },
    {
      type: 'text',
      content:
        'A variable is a named place where we can store a value. We use the keywords let and const to create variables in modern JavaScript.',
    },
    {
      type: 'heading',
      content: 'What is a variable?',
    },
    {
      type: 'text',
      content:
        'Think of a variable as a labeled box. You put a value inside, give it a name, and use that name to refer to the value later.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: "const name = 'Dagi';",
    },
    {
      type: 'text',
      content:
        'Here the variable name holds the string value Dagi.',
    },
    {
      type: 'heading',
      content: 'Example',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `const greeting = 'Hello';
let count = 0;
count = 1;`,
    },
    {
      type: 'text',
      content:
        'Use const for values that should never be reassigned, and let for values that change over time.',
    },
  ],
};
