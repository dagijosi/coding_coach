import type { Topic } from '@/types/learning';

export const architectureTopics: Topic[] = [
  {
    id: 'topic-arch-layers',
    courseId: 'course-architecture',
    name: 'Clean Architecture & Layering',
    description:
      'The 6-layer pipeline: Feature -> UI -> State -> Domain -> Repository -> Data Source, with clean separation of concerns.',
    order: 1,
  },
  {
    id: 'topic-arch-solid-ddd',
    courseId: 'course-architecture',
    name: 'SOLID & Domain-Driven Design',
    description:
      'SOLID principles in TypeScript, Dependency Inversion, Dependency Injection, and DDD core concepts (Entities, Value Objects, Aggregates).',
    order: 2,
  },
  {
    id: 'topic-arch-patterns',
    courseId: 'course-architecture',
    name: 'Design Patterns & API Boundaries',
    description:
      'Factory, Strategy, Adapter, Observer, Facade, Anti-Corruption Layers, and resilient API contracts.',
    order: 3,
  },
  {
    id: 'topic-arch-tradeoffs',
    courseId: 'course-architecture',
    name: 'Architectural Tradeoffs & Pragmatism',
    description:
      'When NOT to use patterns, recognizing overengineering, premature abstractions, vertical vs horizontal slicing, and legacy evolution.',
    order: 4,
  },
];
