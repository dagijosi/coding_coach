import type { Concept } from '@/types/learning';

export const variablesConcepts: Concept[] = [
  {
    id: 'concept-variable',
    lessonId: 'lesson-variables',
    name: 'What is a variable?',
    summary:
      'A variable is a named container for storing a value in memory.',
    order: 1,
  },
  {
    id: 'concept-let-const',
    lessonId: 'lesson-variables',
    name: 'let vs const',
    summary:
      'const creates a binding that cannot be reassigned; let allows reassignment.',
    order: 2,
  },
  {
    id: 'concept-scope',
    lessonId: 'lesson-variables',
    name: 'Scope',
    summary:
      'Where a variable is declared determines where it can be used.',
    order: 3,
  },
];
