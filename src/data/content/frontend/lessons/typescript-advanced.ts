import type { Lesson } from '@/types/learning';

// ── Lesson 13: Generics in React ───────────────────────────────────────────────
export const genericsReactLesson: Lesson = {
  id: 'lesson-ts-generics',
  topicId: 'topic-advanced-typescript',
  title: 'Generics in React Components & Hooks',
  description:
    'Build highly reusable, strictly typed generic components (DataGrid, Dropdowns) and custom hooks with type parameter constraints.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 13,
  prerequisites: ['lesson-react-props'],
  content: [
    { type: 'heading', content: 'Why Generics in React?' },
    {
      type: 'text',
      content:
        'Generic components allow a single component implementation to operate over diverse data structures while preserving full type safety, autocomplete, and compile-time validation for callers.',
    },
    { type: 'heading', content: 'Generic List Component' },
    {
      type: 'code',
      language: 'typescript',
      content: `import React from 'react';

// Constrain T to require an id field
interface GenericListProps<T extends { id: string | number }> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onSelect?: (item: T) => void;
  keyExtractor?: (item: T) => string | number;
}

export function GenericList<T extends { id: string | number }>({
  items,
  renderItem,
  onSelect,
  keyExtractor = (item) => item.id,
}: GenericListProps<T>): JSX.Element {
  return (
    <ul className="generic-list">
      {items.map((item) => (
        <li
          key={keyExtractor(item)}
          onClick={() => onSelect?.(item)}
          className="generic-list__item"
        >
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// ✅ Type-safe usage: TypeScript automatically infers T as { id: number; username: string }!
<GenericList
  items={[{ id: 1, username: 'dan_abramov' }]}
  renderItem={(user) => <span>@{user.username}</span>}
  onSelect={(user) => console.log(user.username)}
/>;`,
    },
    { type: 'heading', content: 'Generic Custom Hooks' },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useState, useCallback } from 'react';

export function useSelection<T extends { id: string | number }>(initialItems: T[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const toggle = useCallback((item: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (item: T) => selectedIds.has(item.id),
    [selectedIds]
  );

  return { selectedIds, toggle, isSelected };
}`,
    },
  ],
};

// ── Lesson 14: Conditional Types & Infer ───────────────────────────────────────
export const conditionalTypesLesson: Lesson = {
  id: 'lesson-ts-conditional-types',
  topicId: 'topic-advanced-typescript',
  title: 'Conditional Types & Infer',
  description:
    'Master T extends U ? X : Y, the infer keyword, distributive conditional types, and utility type mechanics.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 14,
  prerequisites: ['lesson-ts-generics'],
  content: [
    { type: 'heading', content: 'Conditional Types Syntax' },
    {
      type: 'text',
      content:
        'Conditional types let you select types dynamically based on relationships between types: `T extends U ? TrueType : FalseType`.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `type IsString<T> = T extends string ? 'yes' : 'no';

type A = IsString<string>; // 'yes'
type B = IsString<number>; // 'no'

// NonNullable utility implementation:
type MyNonNullable<T> = T extends null | undefined ? never : T;
type Clean = MyNonNullable<string | null | undefined>; // string`,
    },
    { type: 'heading', content: 'Type Inference with the infer Keyword' },
    {
      type: 'text',
      content:
        'The `infer` keyword allows you to introduce a type variable within a conditional type to extract sub-types (e.g. array element types, Promise resolved types, function return types).',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// 1. Extract element type of an array
type ElementOf<T> = T extends (infer E)[] ? E : T;
type Num = ElementOf<number[]>; // number

// 2. Unpack Promise type (Awaited<T>)
type UnpackPromise<T> = T extends Promise<infer R> ? R : T;
type User = UnpackPromise<Promise<{ id: string }>>; // { id: string }

// 3. Extract Component Props type
type ComponentPropsOf<T> = T extends React.ComponentType<infer P> ? P : never;`,
    },
  ],
};

// ── Lesson 15: Mapped Types & Template Literals ────────────────────────────────
export const mappedTypesLesson: Lesson = {
  id: 'lesson-ts-mapped-types',
  topicId: 'topic-advanced-typescript',
  title: 'Mapped Types & Template Literals',
  description:
    'Transform object types with [K in keyof T], +/- modifiers, key remapping with as, and template literal type metaprogramming.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 15,
  prerequisites: ['lesson-ts-conditional-types'],
  content: [
    { type: 'heading', content: 'Mapped Types Basics' },
    {
      type: 'text',
      content:
        'Mapped types create new types by iterating over properties using the `[K in keyof T]` syntax.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `interface User {
  id: string;
  name: string;
  age: number;
}

// 1. Make all fields optional (Partial<T>)
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// 2. Make all fields readonly and nullable
type NullableReadonly<T> = {
  readonly [K in keyof T]: T[K] | null;
};`,
    },
    { type: 'heading', content: 'Key Remapping with "as" and Template Literals' },
    {
      type: 'code',
      language: 'typescript',
      content: `// Generate typed getter methods for any state interface!
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};

interface AppConfig {
  theme: 'dark' | 'light';
  port: number;
}

type ConfigGetters = Getters<AppConfig>;
// Result:
// {
//   getTheme: () => 'dark' | 'light';
//   getPort: () => number;
// }`,
    },
  ],
};

// ── Lesson 16: Type-Safe APIs & Zod Validation ─────────────────────────────────
export const typeSafeApisLesson: Lesson = {
  id: 'lesson-ts-type-safe-apis',
  topicId: 'topic-advanced-typescript',
  title: 'Type-Safe APIs & Runtime Schema Validation',
  description:
    'Bridge the compile-time vs runtime trust gap with Zod schemas, branded types, and the satisfies operator.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 16,
  prerequisites: ['lesson-ts-mapped-types'],
  content: [
    { type: 'heading', content: 'The Runtime Type Trust Problem' },
    {
      type: 'text',
      content:
        'TypeScript types exist solely at compile-time and are completely erased during JavaScript execution. Casting API responses with `as User` is dangerous because if the backend changes or fails, your app will crash silently. Runtime schema validation (e.g. with **Zod**) guarantees payload correctness at the API boundary.',
    },
    { type: 'heading', content: 'Zod Schemas & Inferred Types' },
    {
      type: 'code',
      language: 'typescript',
      content: `import { z } from 'zod';

// 1. Define runtime validation schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'guest']),
  createdAt: z.string().datetime(),
});

// 2. Infer compile-time TypeScript type automatically!
export type User = z.infer<typeof UserSchema>;

// 3. Fully type-safe fetch wrapper
export async function fetchUser(userId: string): Promise<User> {
  const res = await fetch(\`/api/users/\${userId}\`);
  const json = await res.json();

  // Throws if backend response violates schema
  return UserSchema.parse(json);
}`,
    },
    { type: 'heading', content: 'Branded Types for Domain Safety' },
    {
      type: 'text',
      content:
        'Branded types prevent mixing up primitive strings or numbers that represent distinct domain entities (e.g. `UserId` vs `OrderId`).',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `type Brand<K, T> = K & { readonly __brand: T };

export type UserId = Brand<string, 'UserId'>;
export type OrderId = Brand<string, 'OrderId'>;

function shipOrder(userId: UserId, orderId: OrderId) {
  // Safe from argument transposition!
}

const userId = 'u_123' as UserId;
const orderId = 'ord_456' as OrderId;

shipOrder(userId, orderId); // ✅ OK
// shipOrder(orderId, userId); // ❌ Compile Error! Type 'OrderId' is not assignable to 'UserId'`,
    },
  ],
};
