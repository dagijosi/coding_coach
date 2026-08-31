import type { Problem } from '@/types/learning';

export const typescriptProblems: Problem[] = [
  // Basic Types
  {
    id: 'problem-ts-infer-type',
    lessonId: 'lesson-ts-basic-types',
    title: 'What type is inferred?',
    description: 'What type does TypeScript infer for the variable x?',
    type: 'multiple-choice',
    difficulty: 'beginner',
    order: 1,
    prompt: 'const x = [1, 2, 3];',
    choices: ['any[]', 'Array<unknown>', 'number[]', 'object'],
    answer: 2,
    hints: [
      { id: 'hint-ts-inf-1', content: 'TypeScript infers array types from their elements. All elements are numbers.', order: 1 },
    ],
    explanation: 'TypeScript infers [1, 2, 3] as number[] because all elements are number. No any is used.',
  },
  {
    id: 'problem-ts-any-vs-unknown',
    lessonId: 'lesson-ts-basic-types',
    title: 'unknown vs any narrowing',
    description: 'Which line causes a TypeScript compile error?',
    type: 'debugging',
    difficulty: 'beginner',
    order: 2,
    prompt: 'let a: any = "hello";\nlet b: unknown = "world";\n\na.toUpperCase();   // line A\nb.toUpperCase();   // line B',
    choices: ['Line A', 'Line B', 'Both lines', 'Neither line'],
    answer: 1,
    hints: [
      { id: 'hint-ts-unk-1', content: 'any disables checking. unknown requires a type check first.', order: 1 },
    ],
    explanation: 'Line A is fine — any disables all type checking. Line B is an error — unknown must be narrowed (e.g., if (typeof b === "string")) before calling string methods.',
  },

  // Interfaces
  {
    id: 'problem-ts-interface-optional',
    lessonId: 'lesson-ts-interfaces',
    title: 'Optional property access',
    description: 'What is the type of user.role in this context?',
    type: 'multiple-choice',
    difficulty: 'beginner',
    order: 1,
    prompt: 'interface User { name: string; role?: "admin" | "user"; }\nconst user: User = { name: "Alice" };\n// typeof user.role is?',
    choices: ['"admin" | "user"', '"admin" | "user" | undefined', 'string', 'undefined'],
    answer: 1,
    hints: [
      { id: 'hint-ts-opt-1', content: 'Optional fields (?) can be the declared type OR undefined.', order: 1 },
    ],
    explanation: 'Optional properties have type T | undefined. user.role is "admin" | "user" | undefined.',
  },

  // Functions
  {
    id: 'problem-ts-return-type',
    lessonId: 'lesson-ts-functions',
    title: 'Inferred return type',
    description: 'What return type does TypeScript infer for this function?',
    type: 'multiple-choice',
    difficulty: 'beginner',
    order: 1,
    prompt: 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}',
    choices: ['void', 'any', 'string', 'unknown'],
    answer: 2,
    hints: [
      { id: 'hint-ts-ret-1', content: 'TypeScript infers return type from the return expression. A template literal is a string.', order: 1 },
    ],
    explanation: 'Template literals always produce a string. TypeScript infers the return type as string.',
  },

  // Unions
  {
    id: 'problem-ts-narrowing',
    lessonId: 'lesson-ts-unions',
    title: 'Type narrowing in if block',
    description: 'Inside the if block, what is the type of value?',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    order: 1,
    prompt: 'function process(value: string | number) {\n  if (typeof value === "string") {\n    // value is ___?\n  }\n}',
    choices: ['string | number', 'string', 'number', 'unknown'],
    answer: 1,
    hints: [
      { id: 'hint-ts-narrow-1', content: 'TypeScript narrows the type inside conditionals based on type guards like typeof.', order: 1 },
    ],
    explanation: 'Inside the typeof value === "string" block, TypeScript narrows value to just string.',
  },
  {
    id: 'problem-ts-discriminated',
    lessonId: 'lesson-ts-unions',
    title: 'Discriminated union exhaustiveness',
    description: 'What happens if you add a new union member and forget to add it to the switch?',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    order: 2,
    prompt: '// Adding Triangle to Shape union\n// without adding case "triangle" to the switch',
    choices: ['Runtime error', 'TypeScript compile error with assertNever', 'Silent bug — falls through', 'TypeScript gives a warning'],
    answer: 1,
    hints: [
      { id: 'hint-ts-disc-1', content: 'Without assertNever in the default case, TypeScript cannot enforce exhaustiveness.', order: 1 },
    ],
    explanation: 'With assertNever in the default case, TypeScript raises a compile error when a new union member is not handled. Without it, there is a silent runtime bug.',
  },

  // Generics
  {
    id: 'problem-ts-generic-infer',
    lessonId: 'lesson-ts-generics',
    title: 'Generic type inference',
    description: 'What type is inferred for result?',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    order: 1,
    prompt: 'function first<T>(arr: T[]): T | undefined {\n  return arr[0];\n}\nconst result = first(["a", "b", "c"]);',
    choices: ['unknown', 'string | undefined', 'string', 'any'],
    answer: 1,
    hints: [
      { id: 'hint-ts-gen-inf-1', content: 'TypeScript infers T from the argument. What is T when the array is string[]?', order: 1 },
    ],
    explanation: 'TypeScript infers T = string from the string[] argument. The return type is T | undefined = string | undefined.',
  },

  // Utility Types
  {
    id: 'problem-ts-partial',
    lessonId: 'lesson-ts-utility-types',
    title: 'Partial<T> result',
    description: 'What is the type of Partial<{a: number; b: string}>?',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    order: 1,
    prompt: 'type T = Partial<{ a: number; b: string }>;',
    choices: ['{ a: number; b: string }', '{ a?: number; b?: string }', '{ a: number | undefined; b: string | undefined }', '{}'],
    answer: 1,
    hints: [
      { id: 'hint-ts-part-1', content: 'Partial makes every property optional using the ? modifier.', order: 1 },
    ],
    explanation: 'Partial<T> adds ? to every property. { a: number; b: string } becomes { a?: number; b?: string }.',
  },

  // Classes
  {
    id: 'problem-ts-private',
    lessonId: 'lesson-ts-classes',
    title: 'private access error',
    description: 'Which line causes a TypeScript error?',
    type: 'debugging',
    difficulty: 'advanced',
    order: 1,
    prompt: 'class Foo {\n  private x = 10;\n  getX() { return this.x; } // line A\n}\nconst f = new Foo();\nconsole.log(f.getX());    // line B\nconsole.log(f.x);         // line C',
    choices: ['Line A', 'Line B', 'Line C', 'No error'],
    answer: 2,
    hints: [
      { id: 'hint-ts-priv-1', content: 'private members can be accessed from within the class. Can they be accessed from outside?', order: 1 },
    ],
    explanation: 'Line A is fine — getX() is a class method accessing private x. Line B is fine — getX() is public. Line C is a TypeScript error — x is private and cannot be accessed outside the class.',
  },

  // Advanced Types
  {
    id: 'problem-ts-mapped',
    lessonId: 'lesson-ts-advanced-types',
    title: 'Mapped type result',
    description: 'What type does this produce?',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 1,
    prompt: 'type Flags<T> = { [K in keyof T]: boolean };\ntype Result = Flags<{ x: number; y: string }>;',
    choices: ['{ x: number; y: string }', '{ x: boolean; y: boolean }', '{ [x: string]: boolean }', '{ x: boolean } | { y: boolean }'],
    answer: 1,
    hints: [
      { id: 'hint-ts-mapped-1', content: 'Flags keeps the same keys as T but changes every value type to boolean.', order: 1 },
    ],
    explanation: 'Flags<T> iterates over keyof T and maps each value to boolean. Result is { x: boolean; y: boolean }.',
  },

  // Design Patterns
  {
    id: 'problem-ts-singleton',
    lessonId: 'lesson-ts-design-patterns',
    title: 'Singleton private constructor',
    description: 'Why is the constructor private in the Singleton pattern?',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 1,
    prompt: 'class Logger {\n  private static instance: Logger;\n  private constructor() {}\n  static getInstance() { ... }\n}',
    choices: ['To prevent subclassing', 'To prevent external instantiation with new', 'To improve performance', 'Required by TypeScript'],
    answer: 1,
    hints: [
      { id: 'hint-ts-sing-1', content: 'The goal is to control how instances are created. What does private constructor prevent?', order: 1 },
    ],
    explanation: 'private constructor prevents external code from calling new Logger(). Only getInstance() can create the instance, ensuring exactly one exists.',
  },
];
