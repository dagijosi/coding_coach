import type { Challenge } from '@/types/learning';

export const extendedChallenges: Challenge[] = [
  // ── Data Types ──
  {
    id: 'challenge-dt-type-checker',
    lessonId: 'lesson-data-types',
    title: 'Type Checker',
    description: 'Write a function that returns the type name of any value as a string. For null return "null" (not "object").',
    difficulty: 'beginner',
    order: 1,
    functionName: 'getType',
    starterCode: `function getType(value) {
  // Write your code here
}`,
    testCases: [
      { id: 'tc-dt-1', args: [42], expected: 'number' },
      { id: 'tc-dt-2', args: ['hello'], expected: 'string' },
      { id: 'tc-dt-3', args: [true], expected: 'boolean' },
      { id: 'tc-dt-4', args: [null], expected: 'null' },
      { id: 'tc-dt-5', args: [undefined], expected: 'undefined' },
    ],
    hints: [
      { id: 'hint-chal-dt-1', content: 'Use typeof for most types. But typeof null returns "object" — handle null separately.', order: 1 },
      { id: 'hint-chal-dt-2', content: 'Check if value === null first, then return "null". Otherwise use typeof.', order: 2 },
    ],
    explanation: 'if (value === null) return "null"; else return typeof value; — handles the null quirk.',
  },

  // ── Control Flow ──
  {
    id: 'challenge-cf-fizzbuzz',
    lessonId: 'lesson-control-flow',
    title: 'FizzBuzz',
    description: 'Return "Fizz" if n is divisible by 3, "Buzz" if by 5, "FizzBuzz" if by both, otherwise return n.',
    difficulty: 'beginner',
    order: 2,
    functionName: 'fizzBuzz',
    starterCode: `function fizzBuzz(n) {
  // Write your code here
}`,
    testCases: [
      { id: 'tc-cf-1', args: [3], expected: 'Fizz' },
      { id: 'tc-cf-2', args: [5], expected: 'Buzz' },
      { id: 'tc-cf-3', args: [15], expected: 'FizzBuzz' },
      { id: 'tc-cf-4', args: [7], expected: 7 },
      { id: 'tc-cf-5', args: [30], expected: 'FizzBuzz' },
    ],
    hints: [
      { id: 'hint-chal-cf-1', content: 'Check divisibility with %. Check both conditions together first.', order: 1 },
      { id: 'hint-chal-cf-2', content: 'Check n % 15 === 0 for FizzBuzz first, then n % 3, then n % 5, else n.', order: 2 },
    ],
    explanation: 'Check 15 first (divisible by both), then 3, then 5, else return n.',
  },

  // ── Scope ──
  {
    id: 'challenge-scope-adder',
    lessonId: 'lesson-scope',
    title: 'Closure Adder Factory',
    description: 'Write makeAdder(x) that returns a function which adds x to its argument.',
    difficulty: 'beginner',
    order: 3,
    functionName: 'makeAdder',
    starterCode: `function makeAdder(x) {
  // Return a function that adds x to its argument
}`,
    testCases: [
      { id: 'tc-scope-1', args: [5], expected: null },
      { id: 'tc-scope-2', args: [10], expected: null },
    ],
    hints: [
      { id: 'hint-chal-scope-1', content: 'Return a function from makeAdder. That inner function should use x from the outer scope.', order: 1 },
      { id: 'hint-chal-scope-2', content: 'return function(y) { return x + y; }', order: 2 },
    ],
    explanation: 'makeAdder captures x via closure. The returned function adds its argument y to the captured x.',
  },

  // ── Arrays ──
  {
    id: 'challenge-arr-flatten',
    lessonId: 'lesson-arrays',
    title: 'Flatten One Level',
    description: 'Flatten a nested array one level deep without using Array.flat().',
    difficulty: 'intermediate',
    order: 4,
    functionName: 'flattenOne',
    starterCode: `function flattenOne(arr) {
  // Flatten arr one level deep
}`,
    testCases: [
      { id: 'tc-arr-1', args: [[[1, 2], [3, 4]]], expected: [1, 2, 3, 4] },
      { id: 'tc-arr-2', args: [[[1], [2], [3]]], expected: [1, 2, 3] },
      { id: 'tc-arr-3', args: [[[1, [2]], [3]]], expected: [1, [2], 3] },
    ],
    hints: [
      { id: 'hint-chal-arr-1', content: 'Use reduce with spread to concatenate inner arrays.', order: 1 },
      { id: 'hint-chal-arr-2', content: 'arr.reduce((acc, sub) => [...acc, ...sub], [])', order: 2 },
    ],
    explanation: 'Use reduce: accumulate results by spreading each sub-array into the accumulator.',
  },

  // ── Objects ──
  {
    id: 'challenge-obj-pick',
    lessonId: 'lesson-objects',
    title: 'Pick Properties',
    description: 'Write pick(obj, keys) that returns a new object with only the specified keys.',
    difficulty: 'intermediate',
    order: 5,
    functionName: 'pick',
    starterCode: `function pick(obj, keys) {
  // Return a new object with only the given keys
}`,
    testCases: [
      { id: 'tc-obj-1', args: [{ a: 1, b: 2, c: 3 }, ['a', 'c']], expected: { a: 1, c: 3 } },
      { id: 'tc-obj-2', args: [{ x: 10, y: 20 }, ['x']], expected: { x: 10 } },
      { id: 'tc-obj-3', args: [{ a: 1 }, ['b']], expected: {} },
    ],
    hints: [
      { id: 'hint-chal-obj-1', content: 'Iterate over keys and build a new object.', order: 1 },
      { id: 'hint-chal-obj-2', content: 'keys.reduce((acc, k) => obj.hasOwnProperty(k) ? {...acc, [k]: obj[k]} : acc, {})', order: 2 },
    ],
    explanation: 'Use reduce to build a new object with only the keys that exist in obj.',
  },

  // ── Async ──
  {
    id: 'challenge-async-retry',
    lessonId: 'lesson-async',
    title: 'Retry with Delay',
    description: 'Write retry(fn, times) that calls fn() and retries up to times times if it throws. Returns the result of the first success.',
    difficulty: 'intermediate',
    order: 6,
    functionName: 'retry',
    starterCode: `async function retry(fn, times) {
  // Try fn(), retry up to 'times' times if it rejects
}`,
    testCases: [
      { id: 'tc-async-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-chal-async-1', content: 'Use a for loop. Try await fn() and catch errors. If you run out of retries, throw the last error.', order: 1 },
      { id: 'hint-chal-async-2', content: 'for (let i = 0; i <= times; i++) { try { return await fn(); } catch(e) { if (i === times) throw e; } }', order: 2 },
    ],
    explanation: 'Loop up to times times. On success return the result. On final failure rethrow.',
  },

  // ── Classes ──
  {
    id: 'challenge-class-stack',
    lessonId: 'lesson-classes',
    title: 'Implement a Stack',
    description: 'Implement a Stack class with push(item), pop(), peek(), and a size getter.',
    difficulty: 'advanced',
    order: 7,
    functionName: 'Stack',
    starterCode: `class Stack {
  constructor() {
    // initialise storage
  }

  push(item) {
    // add item to top
  }

  pop() {
    // remove and return top item
  }

  peek() {
    // return top item without removing
  }

  get size() {
    // return number of items
  }
}`,
    testCases: [
      { id: 'tc-cls-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-chal-cls-1', content: 'Use an array internally. push adds to the end, pop removes from the end.', order: 1 },
      { id: 'hint-chal-cls-2', content: 'this.items = []; size returns this.items.length; peek returns this.items[this.items.length - 1]', order: 2 },
    ],
    explanation: 'Store items in a private array. push/pop map to array push/pop. peek accesses the last element. size returns length.',
  },

  // ── Error Handling ──
  {
    id: 'challenge-err-safe-parse',
    lessonId: 'lesson-error-handling',
    title: 'Safe JSON Parse',
    description: 'Write safeParseJSON(str) that returns the parsed object on success, or null if the JSON is invalid (instead of throwing).',
    difficulty: 'advanced',
    order: 8,
    functionName: 'safeParseJSON',
    starterCode: `function safeParseJSON(str) {
  // Return parsed JSON or null on error
}`,
    testCases: [
      { id: 'tc-err-1', args: ['{"a":1}'], expected: { a: 1 } },
      { id: 'tc-err-2', args: ['"hello"'], expected: 'hello' },
      { id: 'tc-err-3', args: ['invalid json'], expected: null },
      { id: 'tc-err-4', args: ['{broken'], expected: null },
    ],
    hints: [
      { id: 'hint-chal-err-1', content: 'JSON.parse throws SyntaxError on invalid input. Use try/catch.', order: 1 },
      { id: 'hint-chal-err-2', content: 'try { return JSON.parse(str); } catch { return null; }', order: 2 },
    ],
    explanation: 'Wrap JSON.parse in try/catch. Return the parsed value on success or null when SyntaxError is caught.',
  },

  // ── Algorithms ──
  {
    id: 'challenge-algo-two-sum',
    lessonId: 'lesson-algorithms',
    title: 'Two Sum',
    description: 'Given an array of numbers and a target, return the indices of two numbers that add up to the target. Each input has exactly one solution.',
    difficulty: 'advanced',
    order: 9,
    functionName: 'twoSum',
    starterCode: `function twoSum(nums, target) {
  // Return [i, j] where nums[i] + nums[j] === target
}`,
    testCases: [
      { id: 'tc-algo-1', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { id: 'tc-algo-2', args: [[3, 2, 4], 6], expected: [1, 2] },
      { id: 'tc-algo-3', args: [[3, 3], 6], expected: [0, 1] },
    ],
    hints: [
      { id: 'hint-chal-algo-1', content: 'Use a Map to store each number\'s index. For each number, check if target - number is already in the map.', order: 1 },
      { id: 'hint-chal-algo-2', content: 'const seen = new Map(); for each (num, i): complement = target - num; if seen.has(complement) return [seen.get(complement), i]; seen.set(num, i)', order: 2 },
    ],
    explanation: 'Use a hash map to achieve O(n) time. For each element, check if its complement (target - element) has already been seen.',
  },
];
