import type { Lesson } from '@/types/learning';

// ── Lesson 4: SOLID Principles in Modern TypeScript ────────────────────────────
export const solidPrinciplesLesson: Lesson = {
  id: 'lesson-arch-solid',
  topicId: 'topic-arch-solid-ddd',
  title: 'SOLID Principles in Modern TypeScript',
  description:
    'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion translated into modern TS.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 35,
  order: 4,
  prerequisites: ['lesson-arch-six-layers'],
  content: [
    { type: 'heading', content: 'S — Single Responsibility Principle (SRP)' },
    {
      type: 'text',
      content:
        'A class/function should have one, and only one, reason to change. Separate business calculations from formatting, network transport, and persistence.',
    },
    { type: 'heading', content: 'O — Open/Closed Principle (OCP)' },
    {
      type: 'text',
      content:
        'Software entities should be open for extension, but closed for modification. Use strategy objects or polymorphic interfaces instead of huge `switch (type)` statements.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// ❌ VIOLATION: Adding a new discount requires modifying the core function
function calculateDiscount(type: string, price: number) {
  if (type === 'VIP') return price * 0.8;
  if (type === 'SUMMER') return price * 0.9;
  // Adding BLACK_FRIDAY forces editing this function
}

// ✅ OCP: Open for extension via Strategy interfaces
export interface DiscountStrategy {
  apply(price: number): number;
}

export const VipDiscount: DiscountStrategy = { apply: (p) => p * 0.8 };
export const BlackFridayDiscount: DiscountStrategy = { apply: (p) => p * 0.5 };`,
    },
    { type: 'heading', content: 'L — Liskov Substitution Principle (LSP)' },
    {
      type: 'text',
      content:
        'Subtypes must be substitutable for their base types without altering program correctness. Avoid throwing `NotImplementedError` in overridden methods.',
    },
    { type: 'heading', content: 'I — Interface Segregation Principle (ISP)' },
    {
      type: 'text',
      content:
        'Clients should not be forced to depend on methods they do not use. Prefer multiple small, client-specific interfaces over one fat "God" interface.',
    },
    { type: 'heading', content: 'D — Dependency Inversion Principle (DIP)' },
    {
      type: 'text',
      content:
        'High-level modules should not import anything from low-level modules. Both should depend on abstractions (interfaces).',
    },
  ],
};

// ── Lesson 5: Dependency Injection & Inversion of Control ──────────────────────
export const dependencyInjectionLesson: Lesson = {
  id: 'lesson-arch-di-ioc',
  topicId: 'topic-arch-solid-ddd',
  title: 'Dependency Injection & Inversion of Control',
  description:
    'Decouple creation from execution using constructor injection and lightweight IoC composition roots without reflection frameworks.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 5,
  prerequisites: ['lesson-arch-solid'],
  content: [
    { type: 'heading', content: 'Direct Instantiation vs Injected Dependencies' },
    {
      type: 'text',
      content:
        'When a class executes `this.client = new HttpClient()`, it is tightly coupled to that concrete class and cannot be unit-tested without global monkey-patching. With Dependency Injection, dependencies are provided from the outside (via constructor or arguments).',
    },
    { type: 'heading', content: 'Composition Root Pattern' },
    {
      type: 'code',
      language: 'typescript',
      content: `// 1. Abstractions
export interface NotificationService {
  send(to: string, message: string): Promise<void>;
}

// 2. High-level service depends on interface
export class OrderService {
  constructor(
    private notifier: NotificationService,
    private logger: (msg: string) => void
  ) {}

  async processOrder(orderId: string, customerEmail: string) {
    this.logger(\`Processing order \${orderId}\`);
    await this.notifier.send(customerEmail, 'Your order was placed!');
  }
}

// 3. Composition Root (e.g. app startup / DI container)
export function createProductionServices() {
  const notifier: NotificationService = {
    send: async (to, msg) => { /* Real SendGrid call */ },
  };
  return new OrderService(notifier, console.log);
}`,
    },
  ],
};

// ── Lesson 6: Domain-Driven Design (DDD) Essentials ───────────────────────────
export const dddEssentialsLesson: Lesson = {
  id: 'lesson-arch-ddd',
  topicId: 'topic-arch-solid-ddd',
  title: 'Domain-Driven Design (DDD) Essentials',
  description:
    'Entities vs Value Objects, Aggregates, Domain Invariants, and Ubiquitous Language to model complex software.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 32,
  order: 6,
  prerequisites: ['lesson-arch-solid'],
  content: [
    { type: 'heading', content: 'Entities vs Value Objects' },
    {
      type: 'text',
      content:
        '- **Entity**: An object defined by its distinct identity (`id`) that persists across changes (e.g., `User`, `Order`). Two users with the same name are NOT the same user.\n- **Value Object**: An immutable object defined entirely by its attributes with NO identity (e.g., `Money(10, "USD")`, `EmailAddress("a@b.com")`, `GeoLocation`). Two $10 bills are interchangeable.',
    },
    { type: 'heading', content: 'Enforcing Domain Invariants' },
    {
      type: 'code',
      language: 'typescript',
      content: `// Value Object ensuring valid invariant on instantiation
export class Email {
  private readonly value: string;

  constructor(raw: string) {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      throw new Error(\`Invalid email address: \${raw}\`);
    }
    this.value = trimmed;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

// Aggregate Root protecting child state integrity
export class OrderAggregate {
  private items: { sku: string; quantity: number }[] = [];
  private status: 'draft' | 'paid' | 'shipped' = 'draft';

  addItem(sku: string, quantity: number) {
    if (this.status !== 'draft') {
      throw new Error('Cannot modify order that has already been placed');
    }
    if (quantity <= 0) throw new Error('Quantity must be positive');
    this.items.push({ sku, quantity });
  }
}`,
    },
  ],
};
