import type { Challenge } from '@/types/learning';

export const frontendChallenges: Challenge[] = [
  // ── Challenge 1: Query Key Serializer (TanStack Query / Architecture) ──
  {
    id: 'challenge-fe-query-key-builder',
    lessonId: 'lesson-tanstack-query',
    title: 'Hierarchical Query Key Builder',
    description:
      'Write a function createQueryKey(resource, filters) that produces a standardized query key array. Filter keys should be sorted alphabetically to avoid duplicate cache entries for identical filter objects.',
    difficulty: 'medium',
    order: 1,
    functionName: 'createQueryKey',
    starterCode: `function createQueryKey(resource, filters) {
  // Return an array: [resource, normalizedFilters]
  // normalizedFilters should have its keys sorted alphabetically
}`,
    testCases: [
      {
        id: 'tc-fe-qk-1',
        args: ['users', { page: 1, status: 'active' }],
        expected: ['users', { page: 1, status: 'active' }],
      },
      {
        id: 'tc-fe-qk-2',
        args: ['posts', { status: 'published', authorId: '123' }],
        expected: ['posts', { authorId: '123', status: 'published' }],
      },
      {
        id: 'tc-fe-qk-3',
        args: ['metrics', {}],
        expected: ['metrics', {}],
      },
    ],
    hints: [
      {
        id: 'hint-fe-qk-1',
        content: 'Use Object.keys(filters).sort() to iterate keys in alphabetical order.',
        order: 1,
      },
      {
        id: 'hint-fe-qk-2',
        content: 'Construct a new object by inserting sorted keys, then return [resource, sortedObj].',
        order: 2,
      },
    ],
    explanation:
      'Sorting filter keys ensures that { status: "active", page: 1 } and { page: 1, status: "active" } generate the identical query key and share cache.',
  },

  // ── Challenge 2: Optimistic Array Updater ──
  {
    id: 'challenge-fe-optimistic-update',
    lessonId: 'lesson-optimistic-updates',
    title: 'Optimistic Array Item Updater',
    description:
      'Write a pure function applyOptimisticUpdate(items, updatedItem) that updates an item by its id in an array, or appends it if it does not exist yet. Must return a new array without mutating the original.',
    difficulty: 'easy',
    order: 2,
    functionName: 'applyOptimisticUpdate',
    starterCode: `function applyOptimisticUpdate(items, updatedItem) {
  // Return a new array with updatedItem replaced or appended
}`,
    testCases: [
      {
        id: 'tc-fe-opt-1',
        args: [
          [{ id: 1, text: 'Old' }, { id: 2, text: 'Keep' }],
          { id: 1, text: 'New' },
        ],
        expected: [{ id: 1, text: 'New' }, { id: 2, text: 'Keep' }],
      },
      {
        id: 'tc-fe-opt-2',
        args: [
          [{ id: 1, text: 'A' }],
          { id: 3, text: 'Added' },
        ],
        expected: [{ id: 1, text: 'A' }, { id: 3, text: 'Added' }],
      },
      {
        id: 'tc-fe-opt-3',
        args: [[], { id: 10, text: 'First' }],
        expected: [{ id: 10, text: 'First' }],
      },
    ],
    hints: [
      {
        id: 'hint-fe-opt-1',
        content: 'Check if an item with updatedItem.id exists using items.some(item => item.id === updatedItem.id).',
        order: 1,
      },
      {
        id: 'hint-fe-opt-2',
        content: 'If it exists, use items.map(...); otherwise return [...items, updatedItem].',
        order: 2,
      },
    ],
    explanation:
      'Use map for in-place replacement and the spread operator to append new items immutably.',
  },

  // ── Challenge 3: Type/Property Extractor ──
  {
    id: 'challenge-fe-extract-props',
    lessonId: 'lesson-ts-mapped-types',
    title: 'Clean Props Normalizer',
    description:
      'Write a function cleanComponentProps(props, allowedKeys) that returns a new object containing only the allowed keys that are not undefined.',
    difficulty: 'medium',
    order: 3,
    functionName: 'cleanComponentProps',
    starterCode: `function cleanComponentProps(props, allowedKeys) {
  // Return an object with only allowed non-undefined keys
}`,
    testCases: [
      {
        id: 'tc-fe-cp-1',
        args: [{ id: '1', className: 'btn', onClick: undefined, style: 'red' }, ['id', 'className']],
        expected: { id: '1', className: 'btn' },
      },
      {
        id: 'tc-fe-cp-2',
        args: [{ title: 'Hello', hidden: false, extra: 'discard' }, ['title', 'hidden']],
        expected: { title: 'Hello', hidden: false },
      },
      {
        id: 'tc-fe-cp-3',
        args: [{ a: undefined, b: 2 }, ['a', 'b']],
        expected: { b: 2 },
      },
    ],
    hints: [
      {
        id: 'hint-fe-cp-1',
        content: 'Iterate over allowedKeys, check if props[key] !== undefined, and assign to a result object.',
        order: 1,
      },
    ],
    explanation:
      'Loops through the allowed keys and picks properties that are defined to produce a clean props object.',
  },

  // ── Challenge 4: Simple Reducer State Machine ──
  {
    id: 'challenge-fe-reducer-machine',
    lessonId: 'lesson-fe-advanced-hooks',
    title: 'Async State Machine Reducer',
    description:
      'Write a pure reducer function asyncReducer(state, action) that manages an async flow with states: idle, loading, success, error. Actions: { type: "FETCH_START" }, { type: "FETCH_SUCCESS", payload: data }, { type: "FETCH_ERROR", error: message }',
    difficulty: 'medium',
    order: 4,
    functionName: 'asyncReducer',
    starterCode: `function asyncReducer(state, action) {
  // Return the new state based on action.type
}`,
    testCases: [
      {
        id: 'tc-fe-rd-1',
        args: [
          { status: 'idle', data: null, error: null },
          { type: 'FETCH_START' },
        ],
        expected: { status: 'loading', data: null, error: null },
      },
      {
        id: 'tc-fe-rd-2',
        args: [
          { status: 'loading', data: null, error: null },
          { type: 'FETCH_SUCCESS', payload: 'Users loaded' },
        ],
        expected: { status: 'success', data: 'Users loaded', error: null },
      },
      {
        id: 'tc-fe-rd-3',
        args: [
          { status: 'loading', data: null, error: null },
          { type: 'FETCH_ERROR', error: '404 Not Found' },
        ],
        expected: { status: 'error', data: null, error: '404 Not Found' },
      },
    ],
    hints: [
      {
        id: 'hint-fe-rd-1',
        content: 'Use a switch (action.type) statement.',
        order: 1,
      },
      {
        id: 'hint-fe-rd-2',
        content: 'Clear previous errors when starting a new fetch.',
        order: 2,
      },
    ],
    explanation:
      'A predictable state machine reducer guarantees no impossible states (e.g. status: "success" while error is present).',
  },
];
