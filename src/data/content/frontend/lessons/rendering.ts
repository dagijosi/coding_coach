import type { Lesson } from '@/types/learning';

// ── Lesson 4: Rendering & Reconciliation ───────────────────────────────────────
export const renderingReconciliationLesson: Lesson = {
  id: 'lesson-react-reconciliation',
  topicId: 'topic-react-internals',
  title: 'Rendering & Reconciliation',
  description:
    'Deep dive into the Render phase vs Commit phase, the Fiber tree architecture, diffing heuristics, and key stability.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 4,
  prerequisites: ['lesson-react-state'],
  content: [
    { type: 'heading', content: 'The Two Phases: Render vs Commit' },
    {
      type: 'text',
      content:
        'React divides UI updates into two distinct phases:\n\n1. **Render Phase**: React invokes component functions to calculate what the UI should look like (constructing JSX elements and Fiber nodes). This phase is purely computational, asynchronous, and can be paused or aborted in concurrent mode.\n2. **Commit Phase**: React applies the computed mutations to the actual host DOM (e.g. `appendChild`, `setAttribute`) and executes layout/effects synchronously.',
    },
    { type: 'heading', content: 'Fiber Nodes & The Work Loop' },
    {
      type: 'text',
      content:
        'A Fiber is a lightweight JavaScript object representing a unit of work with references to its `child`, `sibling`, and `return` (parent). React maintains a **current** fiber tree (what is on screen) and builds a **workInProgress** fiber tree during rendering before swapping them in commit (double buffering).',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// Simplified conceptual model of a Fiber Node
interface FiberNode {
  tag: number;            // Component type (FunctionComponent, HostComponent, etc.)
  key: null | string;     // Unique identifier for diffing
  elementType: any;       // e.g. function UserProfile() or 'div'
  stateNode: any;         // Real DOM node or instance reference
  return: FiberNode | null;  // Parent fiber
  child: FiberNode | null;   // First child fiber
  sibling: FiberNode | null; // Next sibling fiber
  memoizedProps: any;     // Props used to render previous output
  pendingProps: any;      // New incoming props
  memoizedState: any;     // Hook linked-list state
  flags: number;          // Bitmask of side-effects (Placement, Update, Deletion)
  alternate: FiberNode | null; // Pointer between current <-> workInProgress
}`,
    },
    { type: 'heading', content: 'Diffing Heuristics & The Key Prop' },
    {
      type: 'text',
      content:
        'React relies on an O(n) heuristic diffing algorithm based on two core assumptions:\n1. Two elements of different types (e.g., `<div>` vs `<span>`, or `<Header>` vs `<Sidebar>`) will produce completely different trees. React destroys the old tree and mounts a new one from scratch.\n2. The developer provides a stable `key` prop across renders for lists of children.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// ⚠️ ANTI-PATTERN: Using array index as key when list order changes
{items.map((item, index) => (
  // If items are prepended or sorted, React reuses DOM nodes for wrong data, causing input state glitches!
  <TodoItem key={index} text={item.text} />
))}

// ✅ BEST PRACTICE: Use permanent, unique entity IDs
{items.map((item) => (
  <TodoItem key={item.id} text={item.text} />
))}`,
    },
  ],
};

// ── Lesson 5: Memoization & When NOT To Use It ─────────────────────────────────
export const memoizationLesson: Lesson = {
  id: 'lesson-react-memoization',
  topicId: 'topic-react-internals',
  title: 'Memoization & When NOT To Use It',
  description:
    'Master React.memo, useMemo, and useCallback. Understand referential equality, the cost of memoization, and anti-patterns.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 5,
  prerequisites: ['lesson-react-reconciliation'],
  content: [
    { type: 'heading', content: 'Referential Equality & Re-renders' },
    {
      type: 'text',
      content:
        'In JavaScript, `{}` !== `{}` and `(() => {})` !== `(() => {})`. Every time a parent component re-renders, any new object/array literals or inline arrow functions are created with new memory references. If passed to child components, shallow equality checks (`Object.is`) fail.',
    },
    { type: 'heading', content: 'React.memo, useCallback & useMemo' },
    {
      type: 'code',
      language: 'typescript',
      content: `import React, { useState, useMemo, useCallback } from 'react';

interface ExpensiveListProps {
  items: string[];
  onSelect: (item: string) => void;
}

// 1. React.memo prevents re-render IF props are shallowly equal (Object.is)
const ExpensiveList = React.memo(function ExpensiveList({ items, onSelect }: ExpensiveListProps) {
  console.log('Rendering ExpensiveList');
  return (
    <ul>
      {items.map((item) => (
        <li key={item} onClick={() => onSelect(item)}>{item}</li>
      ))}
    </ul>
  );
});

export function Dashboard(): JSX.Element {
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState('');

  // 2. useMemo caches computationally heavy operations
  const filteredItems = useMemo(() => {
    return ['React', 'TypeScript', 'Node', 'GraphQL'].filter((tech) =>
      tech.toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter]);

  // 3. useCallback preserves stable function identity across renders
  const handleSelect = useCallback((item: string) => {
    console.log('Selected:', item);
  }, []); // Empty deps = stable forever

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <ExpensiveList items={filteredItems} onSelect={handleSelect} />
    </div>
  );
}`,
    },
    { type: 'heading', content: 'When NOT to Memoize (The Overhead Trap)' },
    {
      type: 'text',
      content:
        'Memoization is NOT free! Every `useMemo` and `useCallback` requires allocating a dependency array on every render and executing dependency equality checks. \n\n**Do NOT memoize when:**\n- The calculation is cheap (e.g. `2 + 2` or simple string formatting).\n- The child component is not wrapped in `React.memo` (the child will re-render anyway).\n- Component composition (`children` or passing JSX) can solve the re-render problem with zero runtime cost.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// ❌ OVER-MEMOIZATION ANTI-PATTERN:
const fullName = useMemo(() => \`\${user.firstName} \${user.lastName}\`, [user]);
const handleClick = useCallback(() => console.log('hi'), []); // passed to native <button>

// ✅ BETTER: Direct calculation & moving state down or lifting JSX up:
const fullName = \`\${user.firstName} \${user.lastName}\`;

function ParentWithState({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {/* children does not re-render when count changes! */}
      {children}
    </div>
  );
}`,
    },
  ],
};

// ── Lesson 6: Concurrent Rendering ─────────────────────────────────────────────
export const concurrentRenderingLesson: Lesson = {
  id: 'lesson-react-concurrent',
  topicId: 'topic-react-internals',
  title: 'Concurrent Rendering',
  description:
    'Understand non-blocking transitions with startTransition, useTransition, and useDeferredValue to eliminate UI freezing.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 25,
  order: 6,
  prerequisites: ['lesson-react-reconciliation'],
  content: [
    { type: 'heading', content: 'What is Concurrent React?' },
    {
      type: 'text',
      content:
        'Before React 18, rendering was strictly synchronous: once React began computing a render tree, the main thread was blocked until completion, causing input lag and dropped frames. Concurrent React allows rendering to be **interruptible**. React can yield back to the browser to handle urgent user interactions (typing, clicking) before resuming heavy background rendering.',
    },
    { type: 'heading', content: 'Urgent vs Non-Urgent (Transition) Updates' },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useState, useTransition, useDeferredValue } from 'react';

export function SearchFilter(): JSX.Element {
  const [inputVal, setInputVal] = useState('');
  const [resultsQuery, setResultsQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Urgent update: Input updates immediately without lag
    setInputVal(e.target.value);

    // 2. Non-urgent update: Heavy list re-render is marked interruptible
    startTransition(() => {
      setResultsQuery(e.target.value);
    });
  };

  return (
    <div>
      <input value={inputVal} onChange={handleChange} placeholder="Search 10,000 items..." />
      {isPending && <p className="spinner">Updating results...</p>}
      <HeavyResultsList query={resultsQuery} />
    </div>
  );
}`,
    },
    { type: 'heading', content: 'useDeferredValue' },
    {
      type: 'text',
      content:
        '`useDeferredValue` accepts a value and returns a deferred copy of it that lags behind urgent renders. It is ideal when you receive props from a parent and cannot wrap the state setter directly in `startTransition`.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useDeferredValue, useMemo } from 'react';

export function ItemList({ search }: { search: string }): JSX.Element {
  // Deferred value will show stale value while new render is prepared in background
  const deferredSearch = useDeferredValue(search);
  const isStale = search !== deferredSearch;

  const items = useMemo(() => {
    return generateHeavyList(deferredSearch);
  }, [deferredSearch]);

  return (
    <div style={{ opacity: isStale ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}`,
    },
  ],
};

// ── Lesson 7: React Server Components (RSC) ────────────────────────────────────
export const serverComponentsLesson: Lesson = {
  id: 'lesson-react-server-components',
  topicId: 'topic-react-internals',
  title: 'React Server Components (RSC)',
  description:
    'Understand the paradigm shift of RSC: zero client bundle size, streaming HTML, server actions, and the client/server boundary.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 7,
  prerequisites: ['lesson-react-reconciliation'],
  content: [
    { type: 'heading', content: 'RSC vs Traditional SSR' },
    {
      type: 'text',
      content:
        '- **Traditional SSR**: Renders HTML on the server on initial request, but still sends the entire JavaScript bundle to the browser to hydrate every component.\n- **React Server Components (RSC)**: Components execute *exclusively on the server*. Their dependencies (libraries, DB drivers, secrets) are **never sent to the client bundle** (0kb bundle footprint). They output a serialized JSON stream representation of the component tree.',
    },
    { type: 'heading', content: 'Server Component Architecture' },
    {
      type: 'code',
      language: 'typescript',
      content: `// app/users/page.tsx (Runs exclusively on the server — async supported natively!)
import db from '@/lib/db';
import { UserCardClient } from './UserCardClient';

interface User {
  id: string;
  name: string;
  email: string;
}

export default async function UsersPage(): Promise<JSX.Element> {
  // Direct DB query on server — no useEffect, no API route boilerplate!
  const users: User[] = await db.query('SELECT id, name, email FROM users');

  return (
    <main>
      <h1>Registered Users (Server Rendered)</h1>
      <ul>
        {users.map((user) => (
          // We can pass server data down to interactive client components
          <UserCardClient key={user.id} user={user} />
        ))}
      </ul>
    </main>
  );
}`,
    },
    { type: 'heading', content: 'The "use client" Boundary' },
    {
      type: 'text',
      content:
        '`"use client"` does NOT mean a component runs only in the browser; it marks the boundary where code is bundled for both SSR and client hydration. Use it only when the component requires browser APIs, state (`useState`), or event listeners (`onClick`).',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `'use client'; // Marks this file and its imports as interactive Client Components

import { useState } from 'react';

interface UserCardProps {
  user: { id: string; name: string; email: string };
}

export function UserCardClient({ user }: UserCardProps): JSX.Element {
  const [likes, setLikes] = useState(0);

  return (
    <li>
      <span>{user.name} ({user.email})</span>
      <button onClick={() => setLikes((l) => l + 1)}>👍 {likes}</button>
    </li>
  );
}`,
    },
  ],
};

// ── Lesson 8: Performance Profiling ────────────────────────────────────────────
export const performanceProfilingLesson: Lesson = {
  id: 'lesson-react-profiling',
  topicId: 'topic-react-internals',
  title: 'Performance Profiling & Bottlenecks',
  description:
    'Identify wasted renders, layout thrashing, long tasks, and optimize production React apps with DevTools & the Profiler API.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 25,
  order: 8,
  prerequisites: ['lesson-react-memoization'],
  content: [
    { type: 'heading', content: 'React DevTools Profiler & Flamegraphs' },
    {
      type: 'text',
      content:
        'The React Profiler records every commit during user interaction:\n- **Flamegraph View**: Represents component hierarchy. Yellow/Orange bars indicate components that took long to render. Gray bars indicate components that did not re-render.\n- **Ranked View**: Sorts components by actual render duration, immediately highlighting your biggest bottlenecks.\n- Check *"Why did this render?"* in DevTools settings to see exactly which props or hooks changed.',
    },
    { type: 'heading', content: 'Programmatic Profiling with <Profiler>' },
    {
      type: 'code',
      language: 'typescript',
      content: `import React, { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id, // the "id" prop of the Profiler tree that just committed
  phase, // either "mount" (initial render) or "update" (re-render)
  actualDuration, // time spent rendering the committed update
  baseDuration, // estimated time to render the entire subtree without memoization
  startTime, // when React began rendering this update
  commitTime // when React committed this update
) => {
  if (actualDuration > 16) {
    console.warn(\`[Slow Render] \${id} (\${phase}): \${actualDuration.toFixed(2)}ms\`);
  }
};

export function AppDashboard(): JSX.Element {
  return (
    <Profiler id="DataGridProfiler" onRender={onRenderCallback}>
      <DataGrid />
    </Profiler>
  );
}`,
    },
    { type: 'heading', content: 'Core Web Vitals & Frontend Metrics' },
    {
      type: 'text',
      content:
        '- **LCP (Largest Contentful Paint)**: Render time of the largest visible content element (< 2.5s).\n- **INP (Interaction to Next Paint)**: Measures UI responsiveness to user clicks/keys (< 200ms).\n- **CLS (Cumulative Layout Shift)**: Visual stability measure (< 0.1).',
    },
  ],
};
