import type { Concept } from '@/types/learning';

export const architectureConcepts: Concept[] = [
  // ── Lesson 1: The 6-Layer Architecture Pipeline ──
  {
    id: 'concept-arch-pipeline',
    lessonId: 'lesson-arch-six-layers',
    name: 'Unidirectional Data Pipeline',
    summary:
      'Feature -> UI -> State -> Domain -> Repository -> Data Source flows downward. Higher layers depend on contracts, never concrete implementations.',
    order: 1,
  },
  {
    id: 'concept-arch-pure-domain',
    lessonId: 'lesson-arch-six-layers',
    name: 'Framework-Agnostic Domain Logic',
    summary:
      'Domain rules must never import React, UI frameworks, or database drivers, making them 100% portable and easy to unit test.',
    order: 2,
  },

  // ── Lesson 2: Separation of Concerns ──
  {
    id: 'concept-arch-cohesion-coupling',
    lessonId: 'lesson-arch-separation',
    name: 'High Cohesion & Low Coupling',
    summary:
      'Keep related domain rules closely grouped (high cohesion) while minimizing direct knowledge between subsystems (low coupling).',
    order: 1,
  },
  {
    id: 'concept-arch-dependency-rule',
    lessonId: 'lesson-arch-separation',
    name: 'The Inward Dependency Rule',
    summary:
      'Source code dependencies must point inward toward business rules. Outer infrastructure layers adapt to inner domain ports.',
    order: 2,
  },

  // ── Lesson 3: Repository Pattern ──
  {
    id: 'concept-arch-repo-abstraction',
    lessonId: 'lesson-arch-repository',
    name: 'In-Memory Collection Semantics',
    summary:
      'Repositories provide collection-like access (findById, save, delete) that isolates domain logic from storage implementation details.',
    order: 1,
  },

  // ── Lesson 4: SOLID Principles ──
  {
    id: 'concept-arch-srp',
    lessonId: 'lesson-arch-solid',
    name: 'Single Responsibility (SRP)',
    summary:
      'Every module, class, or function should have exactly one reason to change, separating business calculation from I/O.',
    order: 1,
  },
  {
    id: 'concept-arch-dip',
    lessonId: 'lesson-arch-solid',
    name: 'Dependency Inversion (DIP)',
    summary:
      'High-level modules should depend on abstract interfaces rather than concrete low-level implementations.',
    order: 2,
  },

  // ── Lesson 5: Dependency Injection ──
  {
    id: 'concept-arch-composition-root',
    lessonId: 'lesson-arch-di-ioc',
    name: 'Composition Root',
    summary:
      'A single location at application startup where concrete dependency graphs are instantiated and injected into services.',
    order: 1,
  },

  // ── Lesson 6: DDD Essentials ──
  {
    id: 'concept-arch-entity-vs-vo',
    lessonId: 'lesson-arch-ddd',
    name: 'Entities vs Value Objects',
    summary:
      'Entities have persistent identity (ID); Value Objects are immutable and defined entirely by their structural values.',
    order: 1,
  },
  {
    id: 'concept-arch-invariants',
    lessonId: 'lesson-arch-ddd',
    name: 'Domain Invariants & Aggregates',
    summary:
      'Aggregates enforce business rules and consistency boundaries on child entities on every write operation.',
    order: 2,
  },

  // ── Lesson 7: Design Patterns ──
  {
    id: 'concept-arch-adapter-pattern',
    lessonId: 'lesson-arch-structural-patterns',
    name: 'The Adapter Pattern',
    summary:
      'Wraps third-party SDKs and legacy classes in a uniform interface tailored to your application domain needs.',
    order: 1,
  },

  // ── Lesson 8: Behavioral Patterns ──
  {
    id: 'concept-arch-strategy-pattern',
    lessonId: 'lesson-arch-behavioral-patterns',
    name: 'The Strategy Pattern',
    summary:
      'Encapsulates algorithms into swappable strategy objects, eliminating giant conditional switch statements.',
    order: 1,
  },

  // ── Lesson 9: API Boundaries ──
  {
    id: 'concept-arch-acl',
    lessonId: 'lesson-arch-api-boundaries',
    name: 'Anti-Corruption Layer (ACL)',
    summary:
      'Mappers between wire DTOs and domain entities prevent backend changes from breaking frontend business logic.',
    order: 1,
  },

  // ── Lesson 10: Overengineering ──
  {
    id: 'concept-arch-premature-abstraction',
    lessonId: 'lesson-arch-overengineering',
    name: 'The Wrong Abstraction Trap',
    summary:
      'Duplication is cheaper than the wrong abstraction. Apply patterns only when real domain complexity demands them.',
    order: 1,
  },

  // ── Lesson 11: Feature Slicing ──
  {
    id: 'concept-arch-vertical-slices',
    lessonId: 'lesson-arch-feature-slicing',
    name: 'Vertical Feature Slicing',
    summary:
      'Organizing code by feature domains ensures localized changes, easy deletion, and seamless team collaboration.',
    order: 1,
  },

  // ── Lesson 12: System Evolution ──
  {
    id: 'concept-arch-strangler-fig',
    lessonId: 'lesson-arch-system-evolution',
    name: 'Strangler Fig Pattern',
    summary:
      'Replace legacy monolithic code incrementally behind feature flags and routing proxies instead of high-risk rewrites.',
    order: 1,
  },
];
