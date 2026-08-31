import type { Topic } from '@/types/learning';

export const jsTopics: Topic[] = [
  {
    id: 'topic-fundamentals',
    courseId: 'course-javascript',
    name: 'Fundamentals',
    description:
      'The building blocks of JavaScript: variables, types, operators, control flow, and functions.',
    order: 1,
  },
  {
    id: 'topic-intermediate',
    courseId: 'course-javascript',
    name: 'Intermediate JavaScript',
    description:
      'Arrays, objects, higher-order functions, closures, and asynchronous programming.',
    order: 2,
  },
  {
    id: 'topic-advanced',
    courseId: 'course-javascript',
    name: 'Advanced JavaScript',
    description:
      'Prototypes, classes, modules, error handling, algorithms, and design patterns.',
    order: 3,
  },
];
