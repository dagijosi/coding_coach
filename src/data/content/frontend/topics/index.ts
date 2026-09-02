import type { Topic } from '@/types/learning';

export const frontendTopics: Topic[] = [
  {
    id: 'topic-react-fundamentals',
    courseId: 'course-frontend',
    name: 'React & TypeScript Fundamentals',
    description:
      'Typed components, JSX, props, state, and events — the essential foundations of modern React.',
    order: 1,
  },
  {
    id: 'topic-react-internals',
    courseId: 'course-frontend',
    name: 'React Internals & Rendering',
    description:
      'Deep dive into the Virtual DOM, Fiber, reconciliation, memoization pitfalls, concurrent rendering, RSC, and profiling.',
    order: 2,
  },
  {
    id: 'topic-data-fetching',
    courseId: 'course-frontend',
    name: 'Data Fetching & Async Patterns',
    description:
      'Suspense, error boundaries, TanStack Query architecture, robust caching strategies, and optimistic UI updates.',
    order: 3,
  },
  {
    id: 'topic-advanced-typescript',
    courseId: 'course-frontend',
    name: 'Advanced TypeScript for React',
    description:
      'Generic components/hooks, conditional types, infer, mapped types, branded types, and type-safe API schemas with Zod.',
    order: 4,
  },
  {
    id: 'topic-architecture-a11y',
    courseId: 'course-frontend',
    name: 'Architecture, State & Accessibility',
    description:
      'State management paradigms (Zustand), advanced hook composition, accessibility (WCAG/ARIA), and scalable frontend architecture.',
    order: 5,
  },
];
