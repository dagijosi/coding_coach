import type { Lesson } from '@/types/learning';

// ── Lesson 7: Creational & Structural Design Patterns ──────────────────────────
export const creationalStructuralLesson: Lesson = {
  id: 'lesson-arch-structural-patterns',
  topicId: 'topic-arch-patterns',
  title: 'Creational & Structural Patterns',
  description:
    'Factory Method, Builder, Adapter, Facade, and Decorator in idiomatic modern TypeScript.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 7,
  prerequisites: ['lesson-arch-solid'],
  content: [
    { type: 'heading', content: 'Adapter Pattern' },
    {
      type: 'text',
      content:
        'Converts the interface of an external third-party SDK into an interface your application expects without polluting your domain.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// Application's expected logging interface
export interface AppLogger {
  info(message: string, context?: Record<string, unknown>): void;
}

// Third-party legacy logger with mismatched signature
class LegacyPinoLogger {
  logWithLevel(lvl: number, str: string) { /* ... */ }
}

// Adapter bridges the gap cleanly
export class PinoLoggerAdapter implements AppLogger {
  constructor(private pino: LegacyPinoLogger) {}

  info(message: string, context?: Record<string, unknown>): void {
    const formatted = context ? \`\${message} \${JSON.stringify(context)}\` : message;
    this.pino.logWithLevel(1, formatted);
  }
}`,
    },
    { type: 'heading', content: 'Facade Pattern' },
    {
      type: 'text',
      content:
        'Provides a simplified, high-level interface to a complex subsystem of multiple classes (e.g. wrapping audio decoding, buffer allocation, and playback behind a single `playAudio(file)` call).',
    },
  ],
};

// ── Lesson 8: Behavioral Patterns & Event-Driven Flows ─────────────────────────
export const behavioralPatternsLesson: Lesson = {
  id: 'lesson-arch-behavioral-patterns',
  topicId: 'topic-arch-patterns',
  title: 'Behavioral Patterns & Event-Driven Flows',
  description:
    'Strategy, Observer / EventEmitter, Command, and Finite State Machines for complex interaction workflows.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 8,
  prerequisites: ['lesson-arch-structural-patterns'],
  content: [
    { type: 'heading', content: 'The Strategy Pattern' },
    {
      type: 'text',
      content:
        'Defines a family of algorithms, encapsulates each one, and makes them interchangeable at runtime.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// Dynamic authentication strategies
export interface AuthStrategy {
  authenticate(credentials: Record<string, string>): Promise<{ userId: string }>;
}

export class OAuthStrategy implements AuthStrategy {
  async authenticate(creds: Record<string, string>) {
    return { userId: 'oauth_' + creds.token };
  }
}

export class PasswordStrategy implements AuthStrategy {
  async authenticate(creds: Record<string, string>) {
    return { userId: 'pwd_' + creds.email };
  }
}

export class AuthContext {
  constructor(private strategy: AuthStrategy) {}
  setStrategy(strategy: AuthStrategy) { this.strategy = strategy; }
  login(creds: Record<string, string>) { return this.strategy.authenticate(creds); }
}`,
    },
    { type: 'heading', content: 'Type-Safe Observer / Event Bus' },
    {
      type: 'code',
      language: 'typescript',
      content: `type EventMap = {
  'user:registered': { userId: string; email: string };
  'order:placed': { orderId: string; total: number };
};

export class TypedEventEmitter {
  private listeners: { [K in keyof EventMap]?: ((payload: EventMap[K]) => void)[] } = {};

  on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void) {
    (this.listeners[event] ??= []).push(handler);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    this.listeners[event]?.forEach((h) => h(payload));
  }
}`,
    },
  ],
};

// ── Lesson 9: API Boundaries & Contract-Driven Design ──────────────────────────
export const apiBoundariesLesson: Lesson = {
  id: 'lesson-arch-api-boundaries',
  topicId: 'topic-arch-patterns',
  title: 'API Boundaries & Anti-Corruption Layers',
  description:
    'Protect your domain model from foreign API schemas using Data Transfer Objects (DTOs), mappers, and Anti-Corruption Layers (ACL).',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 9,
  prerequisites: ['lesson-arch-behavioral-patterns'],
  content: [
    { type: 'heading', content: 'DTO vs Domain Model vs UI Model' },
    {
      type: 'text',
      content:
        '- **DTO (Data Transfer Object)**: The raw, wire-format schema returned by the backend over HTTP (snake_cased, nullable, string timestamps).\n- **Domain Entity**: Rich, validated business model with behavior (camelCase, Date instances, domain methods).\n- **Anti-Corruption Layer (ACL)**: A dedicated mapper that translates external DTOs into internal domain models so external API changes never ripple through your app.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// 1. Raw DTO from external CRM API
interface ExternalCustomerDto {
  cust_id: number;
  first_nm: string;
  last_nm: string;
  created_ts: string;
}

// 2. Internal clean domain model
export interface Customer {
  id: string;
  fullName: string;
  registeredAt: Date;
}

// 3. Anti-Corruption Layer Mapper
export class CustomerMapper {
  static toDomain(dto: ExternalCustomerDto): Customer {
    return {
      id: String(dto.cust_id),
      fullName: \`\${dto.first_nm} \${dto.last_nm}\`.trim(),
      registeredAt: new Date(dto.created_ts),
    };
  }
}`,
    },
  ],
};
