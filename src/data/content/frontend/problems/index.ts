import type { Problem } from '@/types/learning';

export const frontendProblems: Problem[] = [
  // ── Fundamentals Problems ──
  {
    id: 'problem-fe-jsx-class',
    lessonId: 'lesson-react-components',
    title: 'JSX Class Attribute',
    description: 'Identify the correct attribute name for CSS classes in JSX.',
    type: 'multiple-choice',
    difficulty: 'beginner',
    order: 1,
    prompt: 'Which attribute is used to apply a CSS class to an element in JSX?',
    choices: ['class', 'className', 'classList', 'styleClass'],
    answer: 1,
    hints: [
      { id: 'hint-pfe-1-1', content: 'JSX uses standard DOM property names.', order: 1 },
      { id: 'hint-pfe-1-2', content: 'class is a reserved keyword in JavaScript.', order: 2 },
    ],
    explanation: 'In JSX, className is used because "class" is a reserved keyword in JavaScript.',
  },
  {
    id: 'problem-fe-props-readonly',
    lessonId: 'lesson-react-props',
    title: 'Props Mutability',
    description: 'Understand the immutability of React props.',
    type: 'true-false',
    difficulty: 'beginner',
    order: 2,
    prompt: 'True or False: A React component can directly mutate its own props (e.g., props.count = 5).',
    choices: ['True', 'False'],
    answer: 1,
    hints: [
      { id: 'hint-pfe-2-1', content: 'React components must act like pure functions with respect to their props.', order: 1 },
    ],
    explanation: 'Props are strictly read-only. Modifying props directly violates React’s unidirectional data flow.',
  },
  {
    id: 'problem-fe-state-batching',
    lessonId: 'lesson-react-state',
    title: 'Predict State Update Output',
    description: 'Predict the console output when calling setState multiple times synchronously.',
    type: 'predict-output',
    difficulty: 'easy',
    order: 3,
    prompt: `const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
};
// If initial count is 0, what is count on next render?`,
    choices: ['0', '1', '3', 'undefined'],
    answer: 1,
    hints: [
      { id: 'hint-pfe-3-1', content: 'In a single render snapshot, count is fixed at 0.', order: 1 },
      { id: 'hint-pfe-3-2', content: 'To increment 3 times, use the updater function setCount(prev => prev + 1).', order: 2 },
    ],
    explanation: 'Each setCount(count + 1) reads count as 0 from the current closure snapshot, so setCount(0 + 1) runs three times, resulting in 1.',
  },

  // ── Rendering & Reconciliation ──
  {
    id: 'problem-fe-key-index-bug',
    lessonId: 'lesson-react-reconciliation',
    title: 'Why array index keys cause bugs',
    description: 'Analyze when using array index as a key leads to state corruption.',
    type: 'multiple-choice',
    difficulty: 'medium',
    order: 4,
    prompt: 'When does using an array index as a React key cause serious UI/state bugs?',
    choices: [
      'Only when rendering static unchanging lists',
      'When items can be reordered, inserted at the beginning, or filtered',
      'Whenever TypeScript strict mode is enabled',
      'Only when server-side rendering is used',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pfe-4-1', content: 'Think about what happens to the index of item #2 when item #0 is deleted.', order: 1 },
    ],
    explanation: 'When items are reordered or prepended, index keys remain 0, 1, 2... causing React to match old DOM/state instances with new data.',
  },
  {
    id: 'problem-fe-fiber-phases',
    lessonId: 'lesson-react-reconciliation',
    title: 'Fiber Render vs Commit Phase',
    description: 'Identify the differences between Render and Commit phases.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 5,
    prompt: 'Which phase of React rendering directly touches and mutates the real DOM?',
    choices: [
      'The Render Phase (asynchronous & interruptible)',
      'The Reconciliation Diffing Loop',
      'The Commit Phase (synchronous)',
      'The Compilation / Babel Phase',
    ],
    answer: 2,
    hints: [
      { id: 'hint-pfe-5-1', content: 'Render calculates differences; Commit applies them.', order: 1 },
    ],
    explanation: 'The Commit phase is synchronous and applies all calculated DOM mutations (appendChild, removeChild, etc.) to the host browser DOM.',
  },

  // ── Memoization ──
  {
    id: 'problem-fe-usememo-trap',
    lessonId: 'lesson-react-memoization',
    title: 'Memoization Referential Equality',
    description: 'Understand when React.memo fails without useCallback.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 6,
    prompt: 'Why would a component wrapped in React.memo still re-render when its parent re-renders?',
    choices: [
      'React.memo only works in production builds',
      'The parent passed an inline object literal or unmemoized arrow function prop',
      'React.memo is deprecated in React 18',
      'The child component has internal useState',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pfe-6-1', content: 'React.memo does a shallow comparison (Object.is) on each prop.', order: 1 },
    ],
    explanation: 'Inline arrow functions and object literals receive fresh memory addresses on every parent render, causing React.memo shallow equality checks to fail.',
  },

  // ── Concurrent Rendering ──
  {
    id: 'problem-fe-start-transition-usage',
    lessonId: 'lesson-react-concurrent',
    title: 'startTransition Priority',
    description: 'Identify the main purpose of startTransition.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 7,
    prompt: 'What does wrapping a state update inside startTransition() achieve?',
    choices: [
      'It makes the state update execute synchronously before anything else',
      'It marks the update as non-urgent, allowing urgent user input (typing/clicks) to interrupt it',
      'It automatically caches the result in localStorage',
      'It moves the computation into a Web Worker thread',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pfe-7-1', content: 'Transitions distinguish urgent updates from heavy rendering.', order: 1 },
    ],
    explanation: 'startTransition tells React the update is interruptible, keeping the UI responsive to user input while background rendering occurs.',
  },

  // ── React Server Components ──
  {
    id: 'problem-fe-rsc-bundle',
    lessonId: 'lesson-react-server-components',
    title: 'RSC Client Bundle Footprint',
    description: 'Understand the bundle impact of React Server Components.',
    type: 'true-false',
    difficulty: 'advanced',
    order: 8,
    prompt: 'True or False: Heavy NPM packages imported inside a React Server Component (without "use client") are shipped to the client JavaScript bundle.',
    choices: ['True', 'False'],
    answer: 1,
    hints: [
      { id: 'hint-pfe-8-1', content: 'Server components execute exclusively on the server.', order: 1 },
    ],
    explanation: 'False. Dependencies of Server Components remain entirely on the server and add zero bytes to the client JavaScript bundle.',
  },

  // ── TanStack Query & Caching ──
  {
    id: 'problem-fe-stale-vs-gc',
    lessonId: 'lesson-caching-strategies',
    title: 'staleTime vs gcTime',
    description: 'Differentiate between staleTime and gcTime in TanStack Query.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 9,
    prompt: 'If a query has staleTime: 60000 (1 min) and the user refocuses the tab after 30 seconds, what happens?',
    choices: [
      'TanStack Query triggers an immediate background network refetch',
      'No network request is made because the cached data is still fresh (< 1 min)',
      'The cache is immediately wiped from memory',
      'An error is thrown',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pfe-9-1', content: 'Data within staleTime is considered fresh.', order: 1 },
    ],
    explanation: 'While data is fresh (within staleTime), TanStack Query serves the cache immediately and skips background network refetches.',
  },

  // ── Optimistic Updates ──
  {
    id: 'problem-fe-optimistic-rollback',
    lessonId: 'lesson-optimistic-updates',
    title: 'Optimistic Update Rollback',
    description: 'Understand how rollback is handled in TanStack Query mutations.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 10,
    prompt: 'Where should the previous cache snapshot be captured for rolling back an optimistic mutation on failure?',
    choices: [
      'In the onSuccess callback',
      'In the onMutate callback (returned as context)',
      'In onSettled',
      'In the component cleanup return function',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pfe-10-1', content: 'onMutate executes BEFORE the network request fires.', order: 1 },
    ],
    explanation: 'onMutate snapshots the previous cache state before modifying it and returns it in context, allowing onError to restore it if the API fails.',
  },

  // ── Advanced TypeScript ──
  {
    id: 'problem-fe-infer-keyword',
    lessonId: 'lesson-ts-conditional-types',
    title: 'The infer Keyword in TypeScript',
    description: 'Determine the purpose of infer in conditional types.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 11,
    prompt: 'What does the infer keyword do in a TypeScript conditional type like: T extends Promise<infer U> ? U : T ?',
    choices: [
      'It forces TypeScript to cast T to any',
      'It declares a type variable to be extracted dynamically from the matching type pattern',
      'It converts the Promise into a synchronous function',
      'It throws a compile-time error if T is not a Promise',
    ],
    answer: 1,
    hints: [
      { id: 'hint-pfe-11-1', content: 'infer introduces a pattern matching variable inside extends.', order: 1 },
    ],
    explanation: 'infer introduces a type variable (U) to extract the resolved value type wrapped inside the Promise.',
  },
  {
    id: 'problem-fe-zod-runtime',
    lessonId: 'lesson-ts-type-safe-apis',
    title: 'Why TypeScript Needs Runtime Validation (Zod)',
    description: 'Recognize why compile-time types are insufficient for network boundaries.',
    type: 'multiple-choice',
    difficulty: 'advanced',
    order: 12,
    prompt: 'Why is `const data = await res.json() as UserProfile` considered dangerous in production TypeScript apps?',
    choices: [
      'Type assertions (as) are completely erased at runtime, so if the backend returns invalid/missing data, the app will crash at runtime',
      'TypeScript does not support async/await',
      'JSON parsing is not supported in TypeScript',
      'The "as" keyword slows down runtime execution',
    ],
    answer: 0,
    hints: [
      { id: 'hint-pfe-12-1', content: 'Type assertions bypass compiler checking without performing runtime validation.', order: 1 },
    ],
    explanation: 'Type assertions (as ...) provide false confidence: TypeScript compiles it, but at runtime no check is performed, leaving your app vulnerable to backend schema changes.',
  },
];
