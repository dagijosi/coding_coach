import type { Lesson } from '@/types/learning';

// ── Lesson 9: Suspense & Error Boundaries ──────────────────────────────────────
export const suspenseLesson: Lesson = {
  id: 'lesson-react-suspense',
  topicId: 'topic-data-fetching',
  title: 'Suspense & Error Boundaries',
  description:
    'Declarative loading and error states in React. Build resilient component architectures with suspense waterfalls prevention.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 25,
  order: 9,
  prerequisites: ['lesson-react-reconciliation'],
  content: [
    { type: 'heading', content: 'What is Suspense?' },
    {
      type: 'text',
      content:
        'React `<Suspense>` lets you declaratively coordinate loading states for asynchronous operations (code splitting with `React.lazy()`, RSC data fetching, or Suspense-enabled libraries like TanStack Query). When a child suspends (throws a Promise), React walks up the tree to the nearest Suspense boundary and renders its `fallback`.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `import React, { Suspense, lazy } from 'react';

// Code-split heavy component loaded on demand
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

function LoadingSkeleton(): JSX.Element {
  return <div className="skeleton-card">Loading analytics...</div>;
}

export function PageView(): JSX.Element {
  return (
    <div>
      <h1>Operational Overview</h1>
      <Suspense fallback={<LoadingSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}`,
    },
    { type: 'heading', content: 'Catching Runtime Crashes with Error Boundaries' },
    {
      type: 'text',
      content:
        'Error boundaries are components that catch JavaScript errors anywhere in their child component tree, log the error, and display a fallback UI instead of crashing the entire React app.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error!, this.handleReset);
      }
      return this.props.fallback;
    }
    return this.props.children;
  }
}`,
    },
  ],
};

// ── Lesson 10: TanStack Query (React Query) ────────────────────────────────────
export const tanstackQueryLesson: Lesson = {
  id: 'lesson-tanstack-query',
  topicId: 'topic-data-fetching',
  title: 'TanStack Query (React Query)',
  description:
    'Manage server state with useQuery, useMutation, query keys, automatic retries, background refetching, and deduping.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 10,
  prerequisites: ['lesson-react-suspense'],
  content: [
    { type: 'heading', content: 'Client State vs Server State' },
    {
      type: 'text',
      content:
        '- **Client State**: Ephemeral UI state owned locally (modal open/closed, current form draft, active tab).\n- **Server State**: Data persisted remotely, not owned by the frontend, shared among multiple users, and potentially out of date (asynchronous, requires caching & invalidation).\n\nTanStack Query replaces messy `useEffect` + `useState` fetching patterns with a battle-tested server-state engine.',
    },
    { type: 'heading', content: 'Query Keys & useQuery with TypeScript' },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useQuery } from '@tanstack/react-query';

interface Project {
  id: string;
  name: string;
  stars: number;
}

async function fetchProject(projectId: string): Promise<Project> {
  const res = await fetch(\`/api/projects/\${projectId}\`);
  if (!res.ok) throw new Error('Network error loading project');
  return res.json();
}

export function ProjectDetails({ projectId }: { projectId: string }): JSX.Element {
  // Query Keys should be hierarchical arrays: ['resource', id, filters]
  const { data, isLoading, isError, error } = useQuery<Project, Error>({
    queryKey: ['projects', projectId],
    queryFn: () => fetchProject(projectId),
    staleTime: 1000 * 60 * 5, // Data remains "fresh" for 5 minutes
    gcTime: 1000 * 60 * 30,    // Cache retained in memory for 30 minutes
  });

  if (isLoading) return <p>Loading project...</p>;
  if (isError) return <p>Error: {error.message}</p>;
  if (!data) return <p>No data</p>;

  return (
    <div>
      <h2>{data.name}</h2>
      <p>⭐ Stars: {data.stars}</p>
    </div>
  );
}`,
    },
    { type: 'heading', content: 'Mutations & Query Invalidation' },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useMutation, useQueryClient } from '@tanstack/react-query';

export function AddProjectForm(): JSX.Element {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newProjectName: string) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName }),
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate projects queries to trigger automatic refetch in UI!
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return (
    <button onClick={() => mutation.mutate('New AI App')} disabled={mutation.isPending}>
      {mutation.isPending ? 'Creating...' : 'Create Project'}
    </button>
  );
}`,
    },
  ],
};

// ── Lesson 11: Caching Strategies ──────────────────────────────────────────────
export const cachingStrategiesLesson: Lesson = {
  id: 'lesson-caching-strategies',
  topicId: 'topic-data-fetching',
  title: 'Caching Strategies & Data Freshness',
  description:
    'stale-while-revalidate (SWR), cache invalidation patterns, HTTP caching headers (ETag, max-age), and normalized cache trees.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 11,
  prerequisites: ['lesson-tanstack-query'],
  content: [
    { type: 'heading', content: 'The Stale-While-Revalidate (SWR) Pattern' },
    {
      type: 'text',
      content:
        'SWR serves cached (stale) data immediately to guarantee instant UI rendering, while concurrently sending a network request in the background to validate and update the cache with fresh data.',
    },
    { type: 'heading', content: 'StaleTime vs GcTime (CacheTime)' },
    {
      type: 'text',
      content:
        '- **staleTime**: The duration (in ms) until data is considered stale. While fresh, TanStack Query will NEVER execute a background network refetch.\n- **gcTime (Garbage Collection Time)**: The duration inactive queries remain preserved in memory before being garbage collected.',
    },
    {
      type: 'code',
      language: 'typescript',
      content: `// 💡 Golden Rule for Configuration:
// Fast changing data (e.g. stock tickers, live chats)
const liveQueryOptions = {
  staleTime: 0, // Immediately stale -> refetch on window focus
  refetchInterval: 5000, // Poll every 5s
};

// Static/Immutable data (e.g. user permissions, countries list)
const staticQueryOptions = {
  staleTime: Infinity, // Never stale
  gcTime: 1000 * 60 * 60 * 24, // 24 hours
};`,
    },
    { type: 'heading', content: 'HTTP Caching: Cache-Control & ETags' },
    {
      type: 'text',
      content:
        'Frontend caching works hand-in-hand with browser HTTP cache headers:\n- `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`\n- `ETag` (Entity Tag): A hash of the content. When browser sends `If-None-Match: "w/123"`, backend returns `304 Not Modified` with empty body if data did not change.',
    },
  ],
};

// ── Lesson 12: Optimistic Updates ──────────────────────────────────────────────
export const optimisticUpdatesLesson: Lesson = {
  id: 'lesson-optimistic-updates',
  topicId: 'topic-data-fetching',
  title: 'Optimistic UI Updates',
  description:
    'Deliver instant zero-latency UI responses by preemptively updating the local cache before network requests resolve, with rollback on failure.',
  language: 'typescript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 12,
  prerequisites: ['lesson-caching-strategies'],
  content: [
    { type: 'heading', content: 'Why Optimistic Updates Matter' },
    {
      type: 'text',
      content:
        'Waiting for server roundtrips (100ms - 2000ms) on simple actions like liking a post, bookmarking, or toggling a checkbox makes applications feel sluggish. Optimistic UI updates apply state changes immediately, assuming the server will succeed, while gracefully rolling back if an error occurs.',
    },
    { type: 'heading', content: 'The onMutate -> onError -> onSettled Lifecycle' },
    {
      type: 'code',
      language: 'typescript',
      content: `import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedTodo: Todo) => {
      const res = await fetch(\`/api/todos/\${updatedTodo.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTodo),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      return res.json();
    },
    // Step 1: When mutate is called
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot previous value for rollback
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // Optimistically update cache
      queryClient.setQueryData<Todo[]>(['todos'], (old = []) =>
        old.map((todo) => (todo.id === newTodo.id ? newTodo : todo))
      );

      // Return context object with snapshotted value
      return { previousTodos };
    },
    // Step 2: If mutation fails, rollback using snapshotted context
    onError: (err, newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },
    // Step 3: Always refetch after error or success to guarantee sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}`,
    },
  ],
};
