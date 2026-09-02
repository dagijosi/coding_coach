import type { Concept } from '@/types/learning';

export const frontendConcepts: Concept[] = [
  // ── Lesson 1: Components & JSX ──
  {
    id: 'concept-fe-jsx-rules',
    lessonId: 'lesson-react-components',
    name: 'JSX Compilation & Rules',
    summary:
      'JSX is syntactic sugar for React.createElement / jsxRuntime. It enforces single root elements, camelCase attributes (className), and self-closing tags.',
    order: 1,
  },
  {
    id: 'concept-fe-fragment',
    lessonId: 'lesson-react-components',
    name: 'React Fragments',
    summary:
      'Fragments (<>...</>) let you group a list of children without adding extra DOM nodes to the HTML tree.',
    order: 2,
  },

  // ── Lesson 2: Props & TypeScript ──
  {
    id: 'concept-fe-typed-props',
    lessonId: 'lesson-react-props',
    name: 'Typed Props Interfaces',
    summary:
      'Interfaces define the exact contract for component props, enabling IDE autocomplete and compile-time type validation.',
    order: 1,
  },
  {
    id: 'concept-fe-children-prop',
    lessonId: 'lesson-react-props',
    name: 'ReactNode & Children',
    summary:
      'React.ReactNode represents any valid renderable JSX entity (elements, strings, numbers, fragments, portals, or null).',
    order: 2,
  },

  // ── Lesson 3: State & Events ──
  {
    id: 'concept-fe-usestate-generics',
    lessonId: 'lesson-react-state',
    name: 'useState with Generics',
    summary:
      'Pass generic type parameters like useState<User | null>(null) when initial state is null or a complex union.',
    order: 1,
  },
  {
    id: 'concept-fe-synthetic-events',
    lessonId: 'lesson-react-state',
    name: 'Typed Synthetic Events',
    summary:
      'React wraps native browser events in cross-browser SyntheticEvent types (e.g. ChangeEvent<HTMLInputElement>, FormEvent).',
    order: 2,
  },

  // ── Lesson 4: Rendering & Reconciliation ──
  {
    id: 'concept-fe-render-vs-commit',
    lessonId: 'lesson-react-reconciliation',
    name: 'Render Phase vs Commit Phase',
    summary:
      'Render phase computes the Fiber tree and can be paused/aborted; Commit phase synchronously mutates the real DOM.',
    order: 1,
  },
  {
    id: 'concept-fe-fiber-architecture',
    lessonId: 'lesson-react-reconciliation',
    name: 'Fiber Linked-List Architecture',
    summary:
      'Fibers are units of work connected via child, sibling, and return pointers enabling interruptible rendering.',
    order: 2,
  },
  {
    id: 'concept-fe-diffing-keys',
    lessonId: 'lesson-react-reconciliation',
    name: 'Stable Key Heuristics',
    summary:
      'Keys must be unique and persistent across renders. Index keys break state preservation when arrays are reordered.',
    order: 3,
  },

  // ── Lesson 5: Memoization ──
  {
    id: 'concept-fe-referential-equality',
    lessonId: 'lesson-react-memoization',
    name: 'Referential Equality (Object.is)',
    summary:
      'React re-renders children when props fail shallow equality checks. Objects and functions get new references on every render unless memoized.',
    order: 1,
  },
  {
    id: 'concept-fe-memo-overhead',
    lessonId: 'lesson-react-memoization',
    name: 'Cost of Memoization',
    summary:
      'Memoization incurs memory and comparison overhead. Prefer component composition (children prop) over aggressive useMemo/useCallback.',
    order: 2,
  },

  // ── Lesson 6: Concurrent Rendering ──
  {
    id: 'concept-fe-start-transition',
    lessonId: 'lesson-react-concurrent',
    name: 'Transitions & Non-Blocking Updates',
    summary:
      'startTransition marks updates as non-urgent, allowing React to yield execution to immediate user keystrokes and clicks.',
    order: 1,
  },
  {
    id: 'concept-fe-deferred-value',
    lessonId: 'lesson-react-concurrent',
    name: 'useDeferredValue',
    summary:
      'Defers updating a part of the UI based on incoming props while urgent parent renders happen immediately.',
    order: 2,
  },

  // ── Lesson 7: React Server Components ──
  {
    id: 'concept-fe-rsc-bundle-size',
    lessonId: 'lesson-react-server-components',
    name: 'Zero-Bundle Server Components',
    summary:
      'Server components run strictly on the server, importing heavy backend dependencies without adding bytes to the client JS bundle.',
    order: 1,
  },
  {
    id: 'concept-fe-use-client-boundary',
    lessonId: 'lesson-react-server-components',
    name: 'The "use client" Directive',
    summary:
      'Defines the cutoff boundary where components must be bundled for client-side interactivity, state, and browser APIs.',
    order: 2,
  },

  // ── Lesson 8: Performance Profiling ──
  {
    id: 'concept-fe-flamegraphs',
    lessonId: 'lesson-react-profiling',
    name: 'Profiler Flamegraphs',
    summary:
      'Flamegraph charts show render duration and re-render triggers across component subtrees to quickly detect bottlenecks.',
    order: 1,
  },
  {
    id: 'concept-fe-web-vitals',
    lessonId: 'lesson-react-profiling',
    name: 'Core Web Vitals (LCP, INP, CLS)',
    summary:
      'Essential user-centric metrics: Largest Contentful Paint (<2.5s), Interaction to Next Paint (<200ms), Cumulative Layout Shift (<0.1).',
    order: 2,
  },

  // ── Lesson 9: Suspense & Error Boundaries ──
  {
    id: 'concept-fe-suspense-coordination',
    lessonId: 'lesson-react-suspense',
    name: 'Declarative Async Suspense',
    summary:
      'Suspense captures thrown Promises from child components and displays designated fallback UI until resolution.',
    order: 1,
  },
  {
    id: 'concept-fe-error-boundary-lifecycle',
    lessonId: 'lesson-react-suspense',
    name: 'Error Boundary Catch Mechanism',
    summary:
      'Class components implementing getDerivedStateFromError and componentDidCatch prevent entire tree crashes.',
    order: 2,
  },

  // ── Lesson 10: TanStack Query ──
  {
    id: 'concept-fe-query-keys',
    lessonId: 'lesson-tanstack-query',
    name: 'Hierarchical Query Keys',
    summary:
      'Deterministic array keys (e.g. [resource, id, filter]) act as unique cache addresses and allow granular partial invalidation.',
    order: 1,
  },
  {
    id: 'concept-fe-query-invalidation',
    lessonId: 'lesson-tanstack-query',
    name: 'Declarative Invalidation',
    summary:
      'Calling invalidateQueries marks matching cached data as stale and automatically triggers background refetches for active views.',
    order: 2,
  },

  // ── Lesson 11: Caching Strategies ──
  {
    id: 'concept-fe-stale-time-vs-gc-time',
    lessonId: 'lesson-caching-strategies',
    name: 'StaleTime vs GcTime',
    summary:
      'staleTime determines when a query triggers background refetches; gcTime determines when inactive cache memory is deleted.',
    order: 1,
  },
  {
    id: 'concept-fe-swr-pattern',
    lessonId: 'lesson-caching-strategies',
    name: 'Stale-While-Revalidate',
    summary:
      'Instant cache response first + seamless background network revalidation guarantees maximum perceived responsiveness.',
    order: 2,
  },

  // ── Lesson 12: Optimistic Updates ──
  {
    id: 'concept-fe-optimistic-lifecycle',
    lessonId: 'lesson-optimistic-updates',
    name: 'Optimistic Mutation Lifecycle',
    summary:
      'Cancel queries -> snapshot old state in onMutate -> write cache -> rollback in onError -> invalidate in onSettled.',
    order: 1,
  },

  // ── Lesson 13: Generics in React ──
  {
    id: 'concept-fe-generic-constraints',
    lessonId: 'lesson-ts-generics',
    name: 'Generic Constraints (T extends ...)',
    summary:
      'Enforce required properties on generic types while preserving specific parameter shapes without unsafe type assertions.',
    order: 1,
  },

  // ── Lesson 14: Conditional Types & Infer ──
  {
    id: 'concept-fe-infer-keyword',
    lessonId: 'lesson-ts-conditional-types',
    name: 'Type Extraction with infer',
    summary:
      'infer dynamically discovers and extracts sub-types within conditional branches (e.g. return types, promise payloads).',
    order: 1,
  },

  // ── Lesson 15: Mapped Types & Template Literals ──
  {
    id: 'concept-fe-mapped-key-remapping',
    lessonId: 'lesson-ts-mapped-types',
    name: 'Key Remapping with "as"',
    summary:
      'Combine mapped types with template literals [K in keyof T as `get${Capitalize<string & K>}`] to metaprogram typed interfaces.',
    order: 1,
  },

  // ── Lesson 16: Type-Safe APIs & Zod ──
  {
    id: 'concept-fe-runtime-validation',
    lessonId: 'lesson-ts-type-safe-apis',
    name: 'Runtime Schema Validation',
    summary:
      'TypeScript only checks compile-time types. Zod parses and validates untrusted API payloads at runtime before state entry.',
    order: 1,
  },
  {
    id: 'concept-fe-branded-types',
    lessonId: 'lesson-ts-type-safe-apis',
    name: 'Nominal Branded Types',
    summary:
      'Attach unique phantom symbol/brand properties to primitives to prevent accidental ID argument swaps.',
    order: 2,
  },

  // ── Lesson 17: State Architecture ──
  {
    id: 'concept-fe-state-taxonomy',
    lessonId: 'lesson-fe-state-architecture',
    name: '4-Tier State Taxonomy',
    summary:
      'Classify state into URL, Server, Local/UI, and Global Client state to avoid global store bloat and unnecessary renders.',
    order: 1,
  },

  // ── Lesson 18: Advanced Hooks ──
  {
    id: 'concept-fe-sync-external-store',
    lessonId: 'lesson-fe-advanced-hooks',
    name: 'useSyncExternalStore & Tearing',
    summary:
      'Safely subscribes to third-party stores and window APIs in concurrent mode without visual state tearing across renders.',
    order: 1,
  },

  // ── Lesson 19: Accessibility ──
  {
    id: 'concept-fe-a11y-first-rule',
    lessonId: 'lesson-fe-accessibility',
    name: 'First Rule of ARIA',
    summary:
      'Always prefer native semantic HTML elements (<button>, <dialog>, <nav>) before layering ARIA roles and attributes.',
    order: 1,
  },

  // ── Lesson 20: Frontend Architecture ──
  {
    id: 'concept-fe-feature-sliced-design',
    lessonId: 'lesson-fe-architecture',
    name: 'Feature-Sliced Domain Design',
    summary:
      'Structure codebases by domain layers (app -> pages -> widgets -> features -> entities -> shared) with strict unidirectional import rules.',
    order: 1,
  },
];
