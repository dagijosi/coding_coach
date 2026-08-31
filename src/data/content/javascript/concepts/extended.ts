import type { Concept } from '@/types/learning';

export const dataTypesConcepts: Concept[] = [
  {
    id: 'concept-primitives',
    lessonId: 'lesson-data-types',
    name: 'Primitive Types',
    summary:
      'The 7 primitives are: string, number, boolean, null, undefined, symbol, and bigint. They are immutable and compared by value.',
    order: 1,
  },
  {
    id: 'concept-typeof',
    lessonId: 'lesson-data-types',
    name: 'typeof operator',
    summary:
      'typeof returns a string describing a value\'s type. Note: typeof null returns "object" — a historical bug in JavaScript.',
    order: 2,
  },
  {
    id: 'concept-coercion',
    lessonId: 'lesson-data-types',
    name: 'Type Coercion',
    summary:
      'JavaScript silently converts types in loose comparisons (==). Always use === to compare without coercion.',
    order: 3,
  },
];

export const controlFlowConcepts: Concept[] = [
  {
    id: 'concept-if-else',
    lessonId: 'lesson-control-flow',
    name: 'if / else if / else',
    summary:
      'Branch execution based on boolean conditions. Conditions are evaluated top to bottom; the first truthy branch runs.',
    order: 1,
  },
  {
    id: 'concept-for-while',
    lessonId: 'lesson-control-flow',
    name: 'for and while loops',
    summary:
      'for loops iterate a known number of times. while loops run until a condition becomes false. Both support break and continue.',
    order: 2,
  },
  {
    id: 'concept-switch',
    lessonId: 'lesson-control-flow',
    name: 'switch statement',
    summary:
      'switch compares a value against multiple cases using strict equality. Always include break to prevent fall-through.',
    order: 3,
  },
];

export const scopeConcepts: Concept[] = [
  {
    id: 'concept-block-scope',
    lessonId: 'lesson-scope',
    name: 'Block Scope',
    summary:
      'Variables declared with let or const are scoped to the nearest {} block. They cannot be accessed outside that block.',
    order: 1,
  },
  {
    id: 'concept-closure',
    lessonId: 'lesson-scope',
    name: 'Closure',
    summary:
      'A closure is a function that retains access to variables from its enclosing scope even after that scope has finished executing.',
    order: 2,
  },
  {
    id: 'concept-hoisting',
    lessonId: 'lesson-scope',
    name: 'Hoisting',
    summary:
      'Function declarations and var declarations are hoisted to the top of their scope. let and const are hoisted but not initialized — accessing them before declaration is a ReferenceError.',
    order: 3,
  },
];

export const arraysConcepts: Concept[] = [
  {
    id: 'concept-array-methods',
    lessonId: 'lesson-arrays',
    name: 'map, filter, reduce',
    summary:
      'These three methods transform arrays without mutating the original. map transforms each element, filter selects elements, reduce accumulates into a single value.',
    order: 1,
  },
  {
    id: 'concept-spread-destructure',
    lessonId: 'lesson-arrays',
    name: 'Spread & Destructuring',
    summary:
      'Spread (...) expands an array into individual elements. Destructuring lets you extract elements into named variables in one line.',
    order: 2,
  },
  {
    id: 'concept-immutability',
    lessonId: 'lesson-arrays',
    name: 'Mutating vs Non-Mutating',
    summary:
      'Methods like push/pop/sort mutate the original array. map/filter/slice return new arrays. Prefer non-mutating methods for predictable state.',
    order: 3,
  },
];

export const objectsConcepts: Concept[] = [
  {
    id: 'concept-object-literal',
    lessonId: 'lesson-objects',
    name: 'Object Literals',
    summary:
      'Objects are key-value maps. Keys are strings (or symbols), values can be any type including functions (called methods).',
    order: 1,
  },
  {
    id: 'concept-optional-chaining',
    lessonId: 'lesson-objects',
    name: 'Optional Chaining (?.) and Nullish Coalescing (??)',
    summary:
      '?. safely accesses nested properties without crashing on null/undefined. ?? provides a fallback value when the left side is null or undefined.',
    order: 2,
  },
  {
    id: 'concept-object-methods',
    lessonId: 'lesson-objects',
    name: 'Object.keys / values / entries',
    summary:
      'These static methods return arrays of an object\'s keys, values, or key-value pairs, enabling easy iteration over object properties.',
    order: 3,
  },
];

export const asyncConcepts: Concept[] = [
  {
    id: 'concept-promise',
    lessonId: 'lesson-async',
    name: 'Promises',
    summary:
      'A Promise represents a future value. It is either pending, fulfilled (resolved), or rejected. Chain .then() for success and .catch() for errors.',
    order: 1,
  },
  {
    id: 'concept-async-await',
    lessonId: 'lesson-async',
    name: 'async / await',
    summary:
      'async marks a function as asynchronous. await pauses execution until a Promise resolves. Use try/catch for error handling in async functions.',
    order: 2,
  },
  {
    id: 'concept-promise-all',
    lessonId: 'lesson-async',
    name: 'Promise.all and allSettled',
    summary:
      'Promise.all runs multiple Promises in parallel and resolves when ALL succeed (or rejects on first failure). Promise.allSettled waits for all, regardless of success or failure.',
    order: 3,
  },
];

export const classesConcepts: Concept[] = [
  {
    id: 'concept-class-constructor',
    lessonId: 'lesson-classes',
    name: 'class and constructor',
    summary:
      'A class defines a blueprint for objects. The constructor() method initialises each new instance. Use new ClassName() to create an instance.',
    order: 1,
  },
  {
    id: 'concept-inheritance',
    lessonId: 'lesson-classes',
    name: 'Inheritance with extends',
    summary:
      'A subclass inherits all methods from the parent class. Call super() in the constructor to initialise the parent. Override methods to specialise behaviour.',
    order: 2,
  },
  {
    id: 'concept-private-fields',
    lessonId: 'lesson-classes',
    name: 'Private Fields (#)',
    summary:
      'Fields prefixed with # are private to the class — they cannot be read or written from outside. Use getter/setter methods to control access.',
    order: 3,
  },
];

export const errorHandlingConcepts: Concept[] = [
  {
    id: 'concept-try-catch',
    lessonId: 'lesson-error-handling',
    name: 'try / catch / finally',
    summary:
      'Code in try runs normally. If an error is thrown, catch handles it. finally runs unconditionally after both — ideal for cleanup.',
    order: 1,
  },
  {
    id: 'concept-custom-error',
    lessonId: 'lesson-error-handling',
    name: 'Custom Error Classes',
    summary:
      'Extend the built-in Error class to create semantic errors with extra fields. Use instanceof in catch blocks to handle specific error types differently.',
    order: 2,
  },
  {
    id: 'concept-throw',
    lessonId: 'lesson-error-handling',
    name: 'throw statement',
    summary:
      'throw stops execution and passes an error up the call stack. You can throw any value, but throwing an Error instance is best practice because it includes a stack trace.',
    order: 3,
  },
];

export const algorithmsConcepts: Concept[] = [
  {
    id: 'concept-big-o',
    lessonId: 'lesson-algorithms',
    name: 'Big O Notation',
    summary:
      'Big O measures how runtime or memory scales with input size. O(1) is constant, O(log n) is logarithmic, O(n) is linear, O(n²) is quadratic.',
    order: 1,
  },
  {
    id: 'concept-binary-search',
    lessonId: 'lesson-algorithms',
    name: 'Binary Search',
    summary:
      'Binary search finds a target in a sorted array in O(log n) by repeatedly halving the search range.',
    order: 2,
  },
  {
    id: 'concept-recursion',
    lessonId: 'lesson-algorithms',
    name: 'Recursion',
    summary:
      'A recursive function calls itself with a smaller input until reaching a base case. Every recursive function needs a base case to prevent infinite loops.',
    order: 3,
  },
];
