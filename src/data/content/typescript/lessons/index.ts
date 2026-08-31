import type { Lesson } from '@/types/learning';

// ── Lesson 1: Basic Types ─────────────────────────────────────────────────────
export const tsBasicTypesLesson: Lesson = {
  id: 'lesson-ts-basic-types',
  topicId: 'topic-ts-fundamentals',
  title: 'Basic Types & Type Inference',
  description: 'Add static type annotations to variables and understand how TypeScript infers types automatically.',
  language: 'typescript',
  difficulty: 'beginner',
  estimatedMinutes: 18,
  order: 1,
  prerequisites: [],
  content: [
    { type: 'heading', content: 'What is TypeScript?' },
    {
      type: 'text',
      content:
        'TypeScript is JavaScript with types. It adds a compile step that catches type errors before your code runs. The result is safer, more maintainable code at scale.',
    },
    { type: 'heading', content: 'Type Annotations' },
    {
      type: 'code',
      language: 'typescript',
      content: `let name: string = 'Alice';
let age: number = 28;
let active: boolean = true;
let scores: number[] = [95, 87, 92];
let pair: [string, number] = ['Alice', 28]; // tuple`,
    },
    { type: 'heading', content: 'Type Inference' },
    {
      type: 'text',
      content:
        'TypeScript can infer types from values. You don\'t always need to write the type — the compiler figures it out. But explicit annotations on function parameters improve readability.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `let city = 'Addis Ababa';   // inferred as string
// city = 42;              // ✗ Error: number not assignable to string

function double(n: number): number {
  return n * 2;
}

// TypeScript infers return type as number
function triple(n: number) {
  return n * 3;
}`,
    },
    { type: 'heading', content: 'any, unknown, never' },
    {
      type: 'code',
      language: 'typescript',
      content: `let x: any = 42;        // disables type checking — avoid
let y: unknown = 'hi';  // safe unknown — must narrow before use
// y.toUpperCase();      // ✗ Error until you check the type

function fail(msg: string): never {
  throw new Error(msg);  // never returns
}`,
    },
  ],
};

// ── Lesson 2: Interfaces & Type Aliases ───────────────────────────────────────
export const tsInterfacesLesson: Lesson = {
  id: 'lesson-ts-interfaces',
  topicId: 'topic-ts-fundamentals',
  title: 'Interfaces & Type Aliases',
  description: 'Define the shape of objects with interfaces and create reusable type aliases.',
  language: 'typescript',
  difficulty: 'beginner',
  estimatedMinutes: 20,
  order: 2,
  prerequisites: ['lesson-ts-basic-types'],
  content: [
    { type: 'heading', content: 'Interfaces' },
    {
      type: 'text',
      content:
        'An interface defines the required shape of an object. TypeScript uses structural typing — if an object has all the required fields, it satisfies the interface.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `interface User {
  id: number;
  name: string;
  email: string;
  role?: 'admin' | 'user';  // optional property
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const alice: User = { id: 1, name: 'Alice', email: 'a@x.com' };
console.log(greetUser(alice));`,
    },
    { type: 'heading', content: 'Type Aliases' },
    {
      type: 'code',
      language: 'typescript',
      content: `type Point = {
  x: number;
  y: number;
};

type ID = string | number;  // union type alias

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
}`,
    },
    { type: 'heading', content: 'Interface vs Type — When to Use Which' },
    {
      type: 'text',
      content:
        'Use interface for object shapes (especially when they may be extended). Use type for unions, intersections, primitives, and tuples. Both work for objects, and in most cases the choice is stylistic.',
    },
  ],
};

// ── Lesson 3: Functions in TypeScript ─────────────────────────────────────────
export const tsFunctionsLesson: Lesson = {
  id: 'lesson-ts-functions',
  topicId: 'topic-ts-fundamentals',
  title: 'Functions in TypeScript',
  description: 'Type function parameters, return values, overloads, and function types.',
  language: 'typescript',
  difficulty: 'beginner',
  estimatedMinutes: 20,
  order: 3,
  prerequisites: ['lesson-ts-interfaces'],
  content: [
    { type: 'heading', content: 'Typing Parameters & Return Values' },
    {
      type: 'code',
      language: 'typescript',
      content: `function add(a: number, b: number): number {
  return a + b;
}

// Optional and default parameters
function greet(name: string, greeting: string = 'Hello'): string {
  return \`\${greeting}, \${name}!\`;
}

// Rest parameters
function sum(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}`,
    },
    { type: 'heading', content: 'Function Types' },
    {
      type: 'code',
      language: 'typescript',
      content: `type Predicate<T> = (value: T) => boolean;
type Transform<T, U> = (input: T) => U;

const isEven: Predicate<number> = n => n % 2 === 0;
const toString: Transform<number, string> = n => \`\${n}\`;

// Higher-order functions
function filter<T>(arr: T[], fn: Predicate<T>): T[] {
  return arr.filter(fn);
}

console.log(filter([1,2,3,4,5], isEven)); // [2, 4]`,
    },
    { type: 'heading', content: 'void and never Return Types' },
    {
      type: 'code',
      language: 'typescript',
      content: `function log(msg: string): void {  // returns nothing
  console.log(msg);
}

function assertNever(x: never): never {  // type-safe exhaustion check
  throw new Error(\`Unexpected: \${x}\`);
}`,
    },
  ],
};

// ── Lesson 4: Union, Intersection & Literal Types ────────────────────────────
export const tsUnionLesson: Lesson = {
  id: 'lesson-ts-unions',
  topicId: 'topic-ts-intermediate',
  title: 'Unions, Intersections & Literals',
  description: 'Combine types with | and &, use literal types for exact values, and narrow types safely.',
  language: 'typescript',
  difficulty: 'intermediate',
  estimatedMinutes: 22,
  order: 4,
  prerequisites: ['lesson-ts-functions'],
  content: [
    { type: 'heading', content: 'Union Types (|)' },
    {
      type: 'code',
      language: 'typescript',
      content: `type Result = string | number | null;

function format(value: Result): string {
  if (value === null) return 'N/A';
  return String(value);
}`,
    },
    { type: 'heading', content: 'Discriminated Unions — Type-Safe Variants' },
    {
      type: 'code',
      language: 'typescript',
      content: `type Shape =
  | { kind: 'circle';    radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle';  base: number;  height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':    return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
    case 'triangle':  return 0.5 * shape.base * shape.height;
  }
}`,
    },
    { type: 'heading', content: 'Intersection Types (&) & Literal Types' },
    {
      type: 'code',
      language: 'typescript',
      content: `type Named  = { name: string };
type Aged   = { age: number };
type Person = Named & Aged;   // must have both

type Direction = 'north' | 'south' | 'east' | 'west'; // literal union
type Status = 200 | 201 | 400 | 404 | 500;             // numeric literals

const dir: Direction = 'north';
// const bad: Direction = 'up'; // ✗ Error`,
    },
  ],
};

// ── Lesson 5: Generics ────────────────────────────────────────────────────────
export const tsGenericsLesson: Lesson = {
  id: 'lesson-ts-generics',
  topicId: 'topic-ts-intermediate',
  title: 'Generics',
  description: 'Write reusable, type-safe functions and classes with generic type parameters.',
  language: 'typescript',
  difficulty: 'intermediate',
  estimatedMinutes: 25,
  order: 5,
  prerequisites: ['lesson-ts-unions'],
  content: [
    { type: 'heading', content: 'Why Generics?' },
    {
      type: 'text',
      content:
        'Generics let you write functions and classes that work with any type while still being fully type-safe. They are the primary way to avoid any in TypeScript.',
    },
    { type: 'heading', content: 'Generic Functions' },
    {
      type: 'code',
      language: 'typescript',
      content: `// Without generics — loses type information
function identity(x: any): any { return x; }

// With generics — preserves type
function identity<T>(x: T): T { return x; }

const num = identity(42);      // inferred as number
const str = identity('hello'); // inferred as string

// Generic with constraint
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

getLength('hello');       // 5
getLength([1, 2, 3]);     // 3
// getLength(42);         // ✗ Error: number has no length`,
    },
    { type: 'heading', content: 'Generic Interfaces & Classes' },
    {
      type: 'code',
      language: 'typescript',
      content: `interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  readonly size: number;
}

class ArrayStack<T> implements Stack<T> {
  private items: T[] = [];

  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  get size(): number { return this.items.length; }
}

const stack = new ArrayStack<number>();
stack.push(1);
stack.push(2);
console.log(stack.pop()); // 2`,
    },
  ],
};

// ── Lesson 6: Utility Types ───────────────────────────────────────────────────
export const tsUtilityTypesLesson: Lesson = {
  id: 'lesson-ts-utility-types',
  topicId: 'topic-ts-intermediate',
  title: 'Utility Types',
  description: 'Use built-in TypeScript utilities: Partial, Required, Readonly, Pick, Omit, Record, and more.',
  language: 'typescript',
  difficulty: 'intermediate',
  estimatedMinutes: 22,
  order: 6,
  prerequisites: ['lesson-ts-generics'],
  content: [
    { type: 'heading', content: 'Partial & Required' },
    {
      type: 'code',
      language: 'typescript',
      content: `interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser  = Partial<User>;   // all fields optional
type RequiredUser = Required<User>;  // all fields required

// Useful for update functions
function updateUser(id: number, patch: Partial<User>): void {
  // patch may have any subset of User's fields
}

updateUser(1, { name: 'New Name' });  // valid`,
    },
    { type: 'heading', content: 'Pick, Omit & Readonly' },
    {
      type: 'code',
      language: 'typescript',
      content: `type UserPreview = Pick<User, 'id' | 'name'>;     // only id & name
type PublicUser   = Omit<User, 'email'>;           // everything except email
type FrozenUser   = Readonly<User>;                // all fields immutable

const frozen: FrozenUser = { id: 1, name: 'Alice', email: 'a@x.com' };
// frozen.name = 'Bob';  // ✗ Error: cannot assign to readonly`,
    },
    { type: 'heading', content: 'Record & ReturnType' },
    {
      type: 'code',
      language: 'typescript',
      content: `type Role = 'admin' | 'user' | 'guest';
type RolePermissions = Record<Role, string[]>;

const perms: RolePermissions = {
  admin: ['read', 'write', 'delete'],
  user:  ['read', 'write'],
  guest: ['read'],
};

function getUser() { return { id: 1, name: 'Alice' }; }
type User = ReturnType<typeof getUser>;  // { id: number; name: string }`,
    },
  ],
};

// ── Lesson 7: Classes in TypeScript ──────────────────────────────────────────
export const tsClassesLesson: Lesson = {
  id: 'lesson-ts-classes',
  topicId: 'topic-ts-advanced',
  title: 'Classes in TypeScript',
  description: 'Use access modifiers, abstract classes, and implement interfaces with TypeScript classes.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 7,
  prerequisites: ['lesson-ts-utility-types'],
  content: [
    { type: 'heading', content: 'Access Modifiers' },
    {
      type: 'code',
      language: 'typescript',
      content: `class BankAccount {
  private balance: number;          // only accessible in this class
  protected owner: string;          // accessible in this class & subclasses
  public readonly id: string;       // accessible anywhere, immutable

  constructor(owner: string, initialBalance: number) {
    this.owner = owner;
    this.balance = initialBalance;
    this.id = crypto.randomUUID();
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.balance += amount;
  }

  get currentBalance(): number { return this.balance; }
}`,
    },
    { type: 'heading', content: 'Abstract Classes' },
    {
      type: 'code',
      language: 'typescript',
      content: `abstract class Shape {
  abstract area(): number;        // subclass MUST implement
  abstract perimeter(): number;

  describe(): string {
    return \`Area: \${this.area().toFixed(2)}, Perimeter: \${this.perimeter().toFixed(2)}\`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) { super(); }
  area(): number { return Math.PI * this.radius ** 2; }
  perimeter(): number { return 2 * Math.PI * this.radius; }
}

const c = new Circle(5);
console.log(c.describe());`,
    },
    { type: 'heading', content: 'Implementing Interfaces' },
    {
      type: 'code',
      language: 'typescript',
      content: `interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}

class Config implements Serializable {
  private data: Record<string, unknown> = {};

  serialize(): string {
    return JSON.stringify(this.data);
  }

  deserialize(raw: string): void {
    this.data = JSON.parse(raw);
  }

  set(key: string, value: unknown): void {
    this.data[key] = value;
  }
}`,
    },
  ],
};

// ── Lesson 8: Advanced Types ──────────────────────────────────────────────────
export const tsAdvancedTypesLesson: Lesson = {
  id: 'lesson-ts-advanced-types',
  topicId: 'topic-ts-advanced',
  title: 'Advanced Types',
  description: 'Master conditional types, mapped types, template literal types, and type guards.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 8,
  prerequisites: ['lesson-ts-generics', 'lesson-ts-classes'],
  content: [
    { type: 'heading', content: 'Type Guards & Narrowing' },
    {
      type: 'code',
      language: 'typescript',
      content: `type Cat = { meow(): void };
type Dog = { bark(): void };

function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

function makeSound(animal: Cat | Dog): void {
  if (isCat(animal)) {
    animal.meow();  // TypeScript knows it's Cat here
  } else {
    animal.bark();  // TypeScript knows it's Dog here
  }
}`,
    },
    { type: 'heading', content: 'Mapped Types' },
    {
      type: 'code',
      language: 'typescript',
      content: `// Make all values nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Make all values optional (reimplementing Partial)
type Optional<T> = { [K in keyof T]?: T[K] };

interface Config { host: string; port: number; debug: boolean; }
type NullableConfig = Nullable<Config>;
// { host: string | null; port: number | null; debug: boolean | null }`,
    },
    { type: 'heading', content: 'Conditional Types' },
    {
      type: 'code',
      language: 'typescript',
      content: `type IsArray<T> = T extends any[] ? true : false;

type A = IsArray<number[]>;  // true
type B = IsArray<string>;    // false

// Infer within conditional types
type UnpackArray<T> = T extends (infer U)[] ? U : T;
type C = UnpackArray<number[]>;  // number
type D = UnpackArray<string>;    // string (not an array, returns T)`,
    },
  ],
};

// ── Lesson 9: Design Patterns ─────────────────────────────────────────────────
export const tsDesignPatternsLesson: Lesson = {
  id: 'lesson-ts-design-patterns',
  topicId: 'topic-ts-advanced',
  title: 'Design Patterns in TypeScript',
  description: 'Apply Singleton, Observer, Factory, and Builder patterns with full TypeScript types.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 35,
  order: 9,
  prerequisites: ['lesson-ts-classes', 'lesson-ts-advanced-types'],
  content: [
    { type: 'heading', content: 'Singleton Pattern' },
    {
      type: 'code',
      language: 'typescript',
      content: `class Config {
  private static instance: Config | null = null;
  private settings: Map<string, unknown> = new Map();

  private constructor() {}  // prevent external instantiation

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  set<T>(key: string, value: T): void { this.settings.set(key, value); }
  get<T>(key: string): T | undefined { return this.settings.get(key) as T; }
}

const cfg = Config.getInstance();
cfg.set('theme', 'dark');`,
    },
    { type: 'heading', content: 'Observer Pattern' },
    {
      type: 'code',
      language: 'typescript',
      content: `type Listener<T> = (event: T) => void;

class EventEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<unknown>>>();

  on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn as Listener<unknown>);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }
}

type AppEvents = { login: { userId: string }; logout: void };
const emitter = new EventEmitter<AppEvents>();
emitter.on('login', ({ userId }) => console.log(\`\${userId} logged in\`));`,
    },
    { type: 'heading', content: 'Builder Pattern' },
    {
      type: 'code',
      language: 'typescript',
      content: `class QueryBuilder {
  private table = '';
  private conditions: string[] = [];
  private limitValue?: number;

  from(table: string): this { this.table = table; return this; }
  where(cond: string): this { this.conditions.push(cond); return this; }
  limit(n: number): this { this.limitValue = n; return this; }

  build(): string {
    let q = \`SELECT * FROM \${this.table}\`;
    if (this.conditions.length) q += \` WHERE \${this.conditions.join(' AND ')}\`;
    if (this.limitValue !== undefined) q += \` LIMIT \${this.limitValue}\`;
    return q;
  }
}

const query = new QueryBuilder()
  .from('users')
  .where('active = true')
  .where('age > 18')
  .limit(10)
  .build();`,
    },
  ],
};
