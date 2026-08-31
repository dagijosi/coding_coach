import type { Concept } from '@/types/learning';

export const typescriptConcepts: Concept[] = [
  // Basic Types
  { id: 'concept-ts-annotation', lessonId: 'lesson-ts-basic-types', name: 'Type Annotations', summary: 'Type annotations (: type) tell TypeScript what type a variable or parameter holds. They are checked at compile time, not runtime.', order: 1 },
  { id: 'concept-ts-inference', lessonId: 'lesson-ts-basic-types', name: 'Type Inference', summary: 'TypeScript infers types from assigned values. let x = 5 makes x a number automatically — no annotation needed.', order: 2 },
  { id: 'concept-ts-unknown', lessonId: 'lesson-ts-basic-types', name: 'unknown vs any', summary: 'any disables type checking entirely. unknown is safer — you must narrow the type before using it. Prefer unknown over any.', order: 3 },

  // Interfaces
  { id: 'concept-ts-interface', lessonId: 'lesson-ts-interfaces', name: 'Interfaces', summary: 'An interface describes the shape of an object. TypeScript uses structural typing — if an object has all required fields, it satisfies the interface.', order: 1 },
  { id: 'concept-ts-optional', lessonId: 'lesson-ts-interfaces', name: 'Optional Properties (?)', summary: 'Properties marked with ? are optional. The type of an optional property is T | undefined. Access them with optional chaining or a null check.', order: 2 },
  { id: 'concept-ts-type-alias', lessonId: 'lesson-ts-interfaces', name: 'Type Aliases', summary: 'type X = ... creates a reusable name for any type — object shapes, unions, tuples. Use interface for extendable object shapes, type for everything else.', order: 3 },

  // Functions
  { id: 'concept-ts-fn-types', lessonId: 'lesson-ts-functions', name: 'Function Types', summary: 'A function type describes its parameters and return type: (a: A, b: B) => R. Use type aliases or inline annotations to type callbacks and higher-order functions.', order: 1 },
  { id: 'concept-ts-void', lessonId: 'lesson-ts-functions', name: 'void Return Type', summary: 'void means a function does not return a meaningful value. Unlike undefined, void disallows accidentally using the return value.', order: 2 },
  { id: 'concept-ts-overload', lessonId: 'lesson-ts-functions', name: 'Function Overloads', summary: 'Overloads allow one function to have multiple call signatures. Declare signatures above the implementation to give callers precise types.', order: 3 },

  // Unions
  { id: 'concept-ts-union', lessonId: 'lesson-ts-unions', name: 'Union Types', summary: 'A | B means a value can be either type A or type B. TypeScript narrows the type inside conditionals based on runtime checks.', order: 1 },
  { id: 'concept-ts-discriminated-union', lessonId: 'lesson-ts-unions', name: 'Discriminated Unions', summary: 'Add a common literal field (kind, type, tag) to each union member. TypeScript uses it to narrow the type exhaustively in switch statements.', order: 2 },
  { id: 'concept-ts-intersection', lessonId: 'lesson-ts-unions', name: 'Intersection Types (&)', summary: 'A & B means the type must satisfy BOTH A and B. Use intersections to combine multiple interfaces into one type.', order: 3 },

  // Generics
  { id: 'concept-ts-generic', lessonId: 'lesson-ts-generics', name: 'Generic Type Parameters', summary: 'Generics use <T> to parameterise types. T is replaced with a real type at the call site, making functions type-safe without losing flexibility.', order: 1 },
  { id: 'concept-ts-constraint', lessonId: 'lesson-ts-generics', name: 'extends Constraints', summary: '<T extends U> restricts T to types that satisfy U. This lets you safely access properties of T that are guaranteed by the constraint.', order: 2 },
  { id: 'concept-ts-generic-class', lessonId: 'lesson-ts-generics', name: 'Generic Classes & Interfaces', summary: 'Classes and interfaces can be parameterised with generics. This enables type-safe containers like Stack<T>, Map<K,V>, and Repository<T>.', order: 3 },

  // Utility Types
  { id: 'concept-ts-partial', lessonId: 'lesson-ts-utility-types', name: 'Partial & Required', summary: 'Partial<T> makes all fields optional. Required<T> makes all fields required. Both create new types without modifying the original.', order: 1 },
  { id: 'concept-ts-pick-omit', lessonId: 'lesson-ts-utility-types', name: 'Pick & Omit', summary: 'Pick<T, K> keeps only the listed keys. Omit<T, K> removes the listed keys. Use them to derive focused types from large interfaces.', order: 2 },
  { id: 'concept-ts-record', lessonId: 'lesson-ts-utility-types', name: 'Record<K, V>', summary: 'Record<K, V> creates an object type where every key K maps to value V. Useful for dictionaries and lookup tables with typed keys.', order: 3 },

  // Classes
  { id: 'concept-ts-access-mod', lessonId: 'lesson-ts-classes', name: 'Access Modifiers', summary: 'private: only in class. protected: in class and subclasses. public (default): anywhere. readonly: cannot be reassigned after initialisation.', order: 1 },
  { id: 'concept-ts-abstract', lessonId: 'lesson-ts-classes', name: 'Abstract Classes', summary: 'abstract classes cannot be instantiated directly. Abstract methods have no body — subclasses must provide implementations. Use for shared base logic with variable specifics.', order: 2 },
  { id: 'concept-ts-implements', lessonId: 'lesson-ts-classes', name: 'implements keyword', summary: 'A class implements an interface by providing all required members. TypeScript checks this at compile time, ensuring the contract is fulfilled.', order: 3 },

  // Advanced Types
  { id: 'concept-ts-type-guard', lessonId: 'lesson-ts-advanced-types', name: 'Type Guards', summary: 'A type guard is a function that returns x is T. When used in an if condition, TypeScript narrows the type in that branch automatically.', order: 1 },
  { id: 'concept-ts-mapped', lessonId: 'lesson-ts-advanced-types', name: 'Mapped Types', summary: '{ [K in keyof T]: ... } transforms every property of T. This is how Partial, Readonly, and Required are implemented in TypeScript\'s standard library.', order: 2 },
  { id: 'concept-ts-conditional', lessonId: 'lesson-ts-advanced-types', name: 'Conditional Types', summary: 'T extends U ? X : Y is a conditional type. Combined with infer, it extracts types from complex structures. The basis of ReturnType and UnwrapPromise.', order: 3 },

  // Design Patterns
  { id: 'concept-ts-singleton', lessonId: 'lesson-ts-design-patterns', name: 'Singleton Pattern', summary: 'Singleton ensures only one instance of a class exists. Use a private constructor and a static getInstance() method. Useful for config, loggers, and caches.', order: 1 },
  { id: 'concept-ts-observer', lessonId: 'lesson-ts-design-patterns', name: 'Observer Pattern', summary: 'Observer decouples event producers from consumers. Producers emit events; consumers subscribe with callbacks. TypeScript generics make event types explicit and safe.', order: 2 },
  { id: 'concept-ts-builder', lessonId: 'lesson-ts-design-patterns', name: 'Builder Pattern', summary: 'Builder constructs complex objects step by step with a fluent API (method chaining). Each method returns this to allow chaining. TypeScript ensures method types are correct.', order: 3 },
];
