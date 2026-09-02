import type { Problem } from '@/types/learning';

export const architectureProblems: Problem[] = [
  // ── Problem 1: The Dependency Rule ──
  {
    id: 'problem-arch-dependency-rule',
    lessonId: 'lesson-arch-six-layers',
    title: 'Clean Architecture Dependency Direction',
    description: 'Identify the valid direction of source code dependencies in Clean Architecture.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 1,
    prompt: 'According to Clean Architecture and the Dependency Rule, which statement is TRUE?',
    choices: [
      'Domain entities should directly import React components for rendering',
      'High-level domain business logic must never import low-level infrastructure or UI libraries',
      'The database layer should contain user authentication business rules',
      'Repositories must always depend on concrete SQLite drivers',
    ],
    answer: 1,
    hints: [
      { id: 'hint-parch-1-1', content: 'Dependencies must point inward toward business rules.', order: 1 },
    ],
    explanation: 'The Dependency Rule states that high-level policy (domain logic) must not know anything about low-level details (UI, database, network).',
  },

  // ── Problem 2: Repository Benefits ──
  {
    id: 'problem-arch-repo-mocking',
    lessonId: 'lesson-arch-repository',
    title: 'Why use the Repository Pattern?',
    description: 'Recognize the primary benefits of isolating data access behind repository interfaces.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 2,
    prompt: 'What is the primary advantage of programming against a UserRepository interface instead of calling SQLite directly in business use cases?',
    choices: [
      'It makes SQL queries execute 10x faster automatically',
      'It enables deterministic unit testing with in-memory mocks without booting a real database',
      'It eliminates the need for database migrations',
      'It reduces JavaScript bundle size to zero',
    ],
    answer: 1,
    hints: [
      { id: 'hint-parch-2-1', content: 'Think about test isolation and decoupling from I/O.', order: 1 },
    ],
    explanation: 'By abstracting data access behind an interface, you can substitute an InMemoryUserRepository in unit tests, making them instant and deterministic.',
  },

  // ── Problem 3: SOLID Open/Closed ──
  {
    id: 'problem-arch-ocp',
    lessonId: 'lesson-arch-solid',
    title: 'Open/Closed Principle in Practice',
    description: 'Understand how to refactor switch-case cascades to obey OCP.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 3,
    prompt: 'How should a 50-case switch statement calculating different shipping methods be refactored to satisfy the Open/Closed Principle?',
    choices: [
      'Replace the switch statement with nested if/else statements',
      'Use the Strategy Pattern where each shipping method implements a common ShippingCalculator interface',
      'Move the switch statement into a global singleton helper file',
      'Use eval() to dynamically compute shipping costs',
    ],
    answer: 1,
    hints: [
      { id: 'hint-parch-3-1', content: 'You should be able to add a new shipping method without modifying existing files.', order: 1 },
    ],
    explanation: 'The Strategy pattern allows adding new shipping calculators by simply creating a new class implementing the interface, leaving existing code untouched.',
  },

  // ── Problem 4: Entities vs Value Objects ──
  {
    id: 'problem-arch-entity-vo',
    lessonId: 'lesson-arch-ddd',
    title: 'Distinguishing Entities and Value Objects',
    description: 'Categorize domain models into Entities or Value Objects.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 4,
    prompt: 'Which of the following is a Value Object in a banking domain?',
    choices: [
      'BankAccount (identified by account number)',
      'Money(amount: 50, currency: "USD") (immutable with no unique identity)',
      'Customer (identified by customer ID)',
      'CreditCardAccount',
    ],
    answer: 1,
    hints: [
      { id: 'hint-parch-4-1', content: 'Value Objects are interchangeable and defined only by their values.', order: 1 },
    ],
    explanation: 'Money(50, "USD") has no unique ID; two instances with the same amount and currency are completely identical and interchangeable.',
  },

  // ── Problem 5: Anti-Corruption Layer ──
  {
    id: 'problem-arch-acl-role',
    lessonId: 'lesson-arch-api-boundaries',
    title: 'Purpose of an Anti-Corruption Layer',
    description: 'Understand why external API DTOs should not be used as domain models.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 5,
    prompt: 'What is the risk of using backend REST API response DTOs directly throughout your UI components and business logic without an Anti-Corruption Layer?',
    choices: [
      'Any backend API field rename or deprecation forces code modifications across dozens of frontend files',
      'It causes React to fail compilation',
      'It violates the JavaScript specification',
      'It disables browser caching',
    ],
    answer: 0,
    hints: [
      { id: 'hint-parch-5-1', content: 'Consider coupling to third-party or changing backend schemas.', order: 1 },
    ],
    explanation: 'Without an Anti-Corruption mapper, changes in the external API schema leak everywhere. An ACL confines the change to a single mapper function.',
  },

  // ── Problem 6: When NOT to Use Patterns ──
  {
    id: 'problem-arch-overengineering',
    lessonId: 'lesson-arch-overengineering',
    title: 'Pragmatism & Overengineering',
    description: 'Recognize when clean architecture becomes accidental complexity.',
    type: 'true-false',
    difficulty: 'advanced',
    order: 6,
    prompt: 'True or False: Every small project or simple CRUD feature should be structured with a full 6-layer Clean Architecture (Controllers, UseCases, Repositories, DTOs, Mappers, Entities).',
    choices: ['True', 'False'],
    answer: 1,
    hints: [
      { id: 'hint-parch-6-1', content: 'Think about YAGNI and the cost of indirection.', order: 1 },
    ],
    explanation: 'False. Applying heavy layered abstractions to simple CRUD applications introduces accidental complexity and overhead with no tangible benefit.',
  },
];
