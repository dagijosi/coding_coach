import type { Lesson } from '@/types/learning';

// ── Lesson 1: The 6-Layer Architecture Pipeline ────────────────────────────────
export const sixLayersLesson: Lesson = {
  id: 'lesson-arch-six-layers',
  topicId: 'topic-arch-layers',
  title: 'The 6-Layer Architecture Pipeline',
  description:
    'Master the unidirectional data flow: Feature -> UI -> State -> Domain Logic -> Repository -> Data Source.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 1,
  prerequisites: [],
  content: [
    { type: 'heading', content: 'Why Layered Architecture?' },
    {
      type: 'text',
      content:
        'In amateur applications, UI components make direct database queries or HTTP calls, validate inputs, mutate global state, and handle error alerts in a single 500-line file. Layered architecture enforces unidirectional responsibility so each concern can be tested, refactored, or swapped in isolation.',
    },
    { type: 'heading', content: 'The 6 Layers Explained' },
    {
      type: 'text',
      content:
        '```\n[1. Feature Entry]     --> Defines the user scenario / route\n        ↓\n[2. UI Layer]          --> Pure presentation (JSX/React Components)\n        ↓\n[3. State / ViewModel] --> View-state orchestration (Hooks, Stores)\n        ↓\n[4. Domain Logic]      --> Pure business rules (Entities, Use Cases)\n        ↓\n[5. Repository]        --> Contract for data operations (CRUD, caching)\n        ↓\n[6. Data Source]       --> Real I/O (SQLite, REST API, GraphQL, LocalStorage)\n```',
    },
    { type: 'heading', content: 'Concrete Implementation in TypeScript' },
    {
      type: 'code',
      language: 'typescript',
      content: `// 4. DOMAIN LAYER: Pure TypeScript entity & invariant validation
export interface UserAccount {
  id: string;
  email: string;
  isVerified: boolean;
}

export function canUpgradeToPro(user: UserAccount): boolean {
  // Pure business rule with zero React or Database dependencies
  return user.isVerified;
}

// 5. REPOSITORY INTERFACE: Decoupled contract
export interface UserRepository {
  findById(id: string): Promise<UserAccount | null>;
  save(user: UserAccount): Promise<void>;
}

// 6. DATA SOURCE IMPLEMENTATION: Real SQLite or REST implementation
export class SqliteUserRepository implements UserRepository {
  constructor(private db: any) {}

  async findById(id: string): Promise<UserAccount | null> {
    const row = await this.db.getFirstAsync('SELECT * FROM users WHERE id = ?', id);
    return row ? { id: row.id, email: row.email, isVerified: Boolean(row.is_verified) } : null;
  }

  async save(user: UserAccount): Promise<void> {
    await this.db.runAsync('INSERT OR REPLACE INTO users VALUES (?, ?, ?)', user.id, user.email, user.isVerified ? 1 : 0);
  }
}`,
    },
  ],
};

// ── Lesson 2: Separation of Concerns & Module Boundaries ───────────────────────
export const separationOfConcernsLesson: Lesson = {
  id: 'lesson-arch-separation',
  topicId: 'topic-arch-layers',
  title: 'Separation of Concerns & Module Boundaries',
  description:
    'Design high cohesion and low coupling. Enforce strict import boundaries that prevent UI code from leaking into business logic.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 2,
  prerequisites: ['lesson-arch-six-layers'],
  content: [
    { type: 'heading', content: 'Cohesion vs Coupling' },
    {
      type: 'text',
      content:
        '- **High Cohesion**: Elements inside a module belong together and serve a single unified purpose.\n- **Low Coupling**: Modules know as little as possible about each other’s inner workings and communicate solely through minimal public interfaces.',
    },
    { type: 'heading', content: 'The Dependency Rule' },
    {
      type: 'text',
      content:
        '*Source code dependencies must point ONLY inwards toward higher-level domain policies.*\n\n- The Domain Layer must **NEVER** import React, JSX, SQLite, Axios, or browser APIs.\n- If your domain model needs to log or fetch, it depends on an abstract interface, not a concrete library.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// ❌ BAD: Domain logic importing UI framework or network client directly
import { AxiosInstance } from 'axios'; // Leaks infrastructure into domain!

// ✅ GOOD: Domain defines its own port/interface
export interface PaymentGateway {
  charge(amountInCents: number, token: string): Promise<{ transactionId: string }>;
}

export class CheckoutUseCase {
  constructor(private paymentGateway: PaymentGateway) {}

  async execute(amount: number, token: string) {
    if (amount <= 0) throw new Error('Invalid checkout amount');
    return this.paymentGateway.charge(amount, token);
  }
}`,
    },
  ],
};

// ── Lesson 3: The Repository Pattern ───────────────────────────────────────────
export const repositoryPatternLesson: Lesson = {
  id: 'lesson-arch-repository',
  topicId: 'topic-arch-layers',
  title: 'The Repository Pattern & Data Source Abstraction',
  description:
    'Isolate the domain from data access details. Swap databases, mock data for tests, and layer caching transparently.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 3,
  prerequisites: ['lesson-arch-separation'],
  content: [
    { type: 'heading', content: 'What is a Repository?' },
    {
      type: 'text',
      content:
        'A Repository mediates between the domain and data mapping layers, acting like an in-memory collection of domain objects. It completely encapsulates the details of how entities are stored, queried, serialized, and cached.',
    },
    { type: 'heading', content: 'Mocking Repositories for 100% Deterministic Testing' },
    {
      type: 'code',
      language: 'typescript',
      content: `// In-Memory Repository implementation for lightning-fast unit tests (0ms DB setup)
export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, UserAccount>();

  async findById(id: string): Promise<UserAccount | null> {
    return this.users.get(id) ?? null;
  }

  async save(user: UserAccount): Promise<void> {
    this.users.set(user.id, { ...user });
  }
}

// Unit test executes with zero SQLite or network dependency:
async function testUserUpgrade() {
  const repo = new InMemoryUserRepository();
  await repo.save({ id: 'u1', email: 'test@example.com', isVerified: true });

  const user = await repo.findById('u1');
  if (user && canUpgradeToPro(user)) {
    console.log('✅ Unit test passed!');
  }
}`,
    },
  ],
};
