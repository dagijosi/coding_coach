import type { Challenge } from '@/types/learning';

export const typescriptChallenges: Challenge[] = [
  {
    id: 'challenge-ts-typed-identity',
    lessonId: 'lesson-ts-basic-types',
    title: 'Typed Identity Function',
    description: 'Write a function identity<T>(x: T): T that returns its argument unchanged with full TypeScript generics.',
    difficulty: 'beginner',
    order: 1,
    functionName: 'identity',
    starterCode: `function identity<T>(x: T): T {
  // Return x unchanged
}`,
    testCases: [
      { id: 'tc-ts-id-1', args: [42], expected: 42 },
      { id: 'tc-ts-id-2', args: ['hello'], expected: 'hello' },
      { id: 'tc-ts-id-3', args: [true], expected: true },
    ],
    hints: [
      { id: 'hint-ts-id-1', content: 'Just return x. TypeScript ensures the type is preserved through the generic.', order: 1 },
    ],
    explanation: 'return x; — the generic T ensures the return type matches the input type.',
  },
  {
    id: 'challenge-ts-user-greeter',
    lessonId: 'lesson-ts-interfaces',
    title: 'Typed User Greeter',
    description: 'Define a User interface with name (string) and optional age (number). Write greetUser(user: User): string that returns a greeting.',
    difficulty: 'beginner',
    order: 2,
    functionName: 'greetUser',
    starterCode: `interface User {
  name: string;
  age?: number;
}

function greetUser(user: User): string {
  // Return "Hello, {name}!" or "Hello, {name}! You are {age} years old." if age provided
}`,
    testCases: [
      { id: 'tc-ts-usr-1', args: [{ name: 'Alice' }], expected: 'Hello, Alice!' },
      { id: 'tc-ts-usr-2', args: [{ name: 'Bob', age: 30 }], expected: 'Hello, Bob! You are 30 years old.' },
    ],
    hints: [
      { id: 'hint-ts-usr-1', content: 'Check if user.age is defined before including it in the message.', order: 1 },
    ],
    explanation: 'if (user.age !== undefined) return the full message; else return the short greeting.',
  },
  {
    id: 'challenge-ts-typed-filter',
    lessonId: 'lesson-ts-functions',
    title: 'Typed filter Function',
    description: 'Write a generic typedFilter<T>(arr: T[], pred: (x: T) => boolean): T[] function.',
    difficulty: 'beginner',
    order: 3,
    functionName: 'typedFilter',
    starterCode: `function typedFilter<T>(arr: T[], pred: (x: T) => boolean): T[] {
  // Filter arr keeping items where pred returns true
}`,
    testCases: [
      { id: 'tc-ts-flt-1', args: [[1,2,3,4,5], (x: number) => x % 2 === 0], expected: [2, 4] },
      { id: 'tc-ts-flt-2', args: [['a','bb','ccc'], (s: string) => s.length > 1], expected: ['bb','ccc'] },
    ],
    hints: [
      { id: 'hint-ts-flt-1', content: 'Use the built-in array filter: return arr.filter(pred);', order: 1 },
    ],
    explanation: 'return arr.filter(pred); — the generic T ensures full type safety.',
  },
  {
    id: 'challenge-ts-shape-area',
    lessonId: 'lesson-ts-unions',
    title: 'Shape Area Calculator',
    description: 'Using discriminated unions, write area(shape) that calculates the area of Circle, Rectangle, or Triangle.',
    difficulty: 'intermediate',
    order: 4,
    functionName: 'area',
    starterCode: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

function area(shape: Shape): number {
  // Calculate and return the area
}`,
    testCases: [
      { id: 'tc-ts-shp-1', args: [{ kind: 'rectangle', width: 4, height: 5 }], expected: 20 },
      { id: 'tc-ts-shp-2', args: [{ kind: 'triangle', base: 6, height: 4 }], expected: 12 },
    ],
    hints: [
      { id: 'hint-ts-shp-1', content: 'Use switch(shape.kind) to handle each case.', order: 1 },
    ],
    explanation: 'switch on shape.kind: circle=πr², rectangle=w*h, triangle=0.5*b*h.',
  },
  {
    id: 'challenge-ts-generic-stack',
    lessonId: 'lesson-ts-generics',
    title: 'Generic Stack',
    description: 'Implement a generic Stack<T> class with push(item), pop(): T|undefined, and size getter.',
    difficulty: 'intermediate',
    order: 5,
    functionName: 'Stack',
    starterCode: `class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    // Add to top
  }

  pop(): T | undefined {
    // Remove and return top
  }

  get size(): number {
    // Return count
    return 0;
  }
}`,
    testCases: [
      { id: 'tc-ts-stk-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-ts-stk-1', content: 'push: this.items.push(item). pop: return this.items.pop(). size: return this.items.length.', order: 1 },
    ],
    explanation: 'Use the private items array. push/pop delegate to array. size returns length.',
  },
  {
    id: 'challenge-ts-deep-readonly',
    lessonId: 'lesson-ts-utility-types',
    title: 'DeepReadonly Utility Type',
    description: 'Create a DeepReadonly<T> mapped type that makes all properties (including nested objects) readonly.',
    difficulty: 'intermediate',
    order: 6,
    functionName: 'DeepReadonly',
    starterCode: `type DeepReadonly<T> = {
  // Make all properties readonly, recursively for object values
};`,
    testCases: [
      { id: 'tc-ts-dr-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-ts-dr-1', content: 'Use readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]', order: 1 },
    ],
    explanation: 'readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] — recursively freeze nested objects.',
  },
  {
    id: 'challenge-ts-abstract-logger',
    lessonId: 'lesson-ts-classes',
    title: 'Abstract Logger',
    description: 'Create an abstract Logger class with abstract log(msg: string): void. Implement ConsoleLogger and FileLogger subclasses.',
    difficulty: 'advanced',
    order: 7,
    functionName: 'Logger',
    starterCode: `abstract class Logger {
  abstract log(msg: string): void;

  info(msg: string): void {
    this.log(\`[INFO] \${msg}\`);
  }

  error(msg: string): void {
    this.log(\`[ERROR] \${msg}\`);
  }
}

class ConsoleLogger extends Logger {
  log(msg: string): void {
    // Write your implementation
  }
}`,
    testCases: [
      { id: 'tc-ts-log-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-ts-log-1', content: 'ConsoleLogger.log should call console.log(msg).', order: 1 },
    ],
    explanation: 'ConsoleLogger delegates to console.log. The abstract base provides shared info/error prefix logic.',
  },
  {
    id: 'challenge-ts-event-emitter',
    lessonId: 'lesson-ts-advanced-types',
    title: 'Typed Event Emitter',
    description: 'Write a type-safe EventEmitter<Events> class with on<K>(event, listener) and emit<K>(event, data) methods.',
    difficulty: 'advanced',
    order: 8,
    functionName: 'EventEmitter',
    starterCode: `type Listener<T> = (data: T) => void;

class EventEmitter<Events extends Record<string, unknown>> {
  private map = new Map<keyof Events, Set<Listener<unknown>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    // Register listener
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    // Call all listeners for event
  }
}`,
    testCases: [
      { id: 'tc-ts-ee-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-ts-ee-1', content: 'on: if no Set for event, create one. Then add listener. emit: get the Set and forEach call each listener.', order: 1 },
    ],
    explanation: 'Use a Map<K, Set<Listener>> to store listeners. on adds to the set, emit calls each listener with the data.',
  },
  {
    id: 'challenge-ts-builder',
    lessonId: 'lesson-ts-design-patterns',
    title: 'Query Builder',
    description: 'Implement a QueryBuilder with from(table), where(condition), limit(n), and build(): string methods using the builder pattern.',
    difficulty: 'advanced',
    order: 9,
    functionName: 'QueryBuilder',
    starterCode: `class QueryBuilder {
  private table = '';
  private conditions: string[] = [];
  private limitVal?: number;

  from(table: string): this {
    // Set table, return this
    return this;
  }

  where(condition: string): this {
    // Add condition, return this
    return this;
  }

  limit(n: number): this {
    // Set limit, return this
    return this;
  }

  build(): string {
    // Build and return SQL string
    return '';
  }
}`,
    testCases: [
      { id: 'tc-ts-qb-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-ts-qb-1', content: 'Each method sets a field then returns this. build() assembles the SQL string.', order: 1 },
    ],
    explanation: 'Set fields in each method, return this. build() creates: SELECT * FROM table [WHERE c1 AND c2] [LIMIT n].',
  },
];
