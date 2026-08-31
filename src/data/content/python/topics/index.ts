import type { Topic } from '@/types/learning';

export const pythonTopics: Topic[] = [
  {
    id: 'topic-py-fundamentals',
    courseId: 'course-python',
    name: 'Python Fundamentals',
    description: 'Variables, data types, operators, strings, and control flow in Python.',
    order: 1,
  },
  {
    id: 'topic-py-intermediate',
    courseId: 'course-python',
    name: 'Intermediate Python',
    description: 'Lists, dictionaries, functions, comprehensions, and file I/O.',
    order: 2,
  },
  {
    id: 'topic-py-advanced',
    courseId: 'course-python',
    name: 'Advanced Python',
    description: 'OOP, decorators, generators, error handling, and algorithm design.',
    order: 3,
  },
];
