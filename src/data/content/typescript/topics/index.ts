import type { Topic } from '@/types/learning';

export const typescriptTopics: Topic[] = [
  {
    id: 'topic-ts-fundamentals',
    courseId: 'course-typescript',
    name: 'TypeScript Fundamentals',
    description: 'Static types, type inference, interfaces, and the TypeScript compiler.',
    order: 1,
  },
  {
    id: 'topic-ts-intermediate',
    courseId: 'course-typescript',
    name: 'Intermediate TypeScript',
    description: 'Union/intersection types, generics, enums, and utility types.',
    order: 2,
  },
  {
    id: 'topic-ts-advanced',
    courseId: 'course-typescript',
    name: 'Advanced TypeScript',
    description: 'Conditional types, mapped types, decorators, and design patterns with TypeScript.',
    order: 3,
  },
];
