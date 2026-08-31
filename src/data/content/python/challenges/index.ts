import type { Challenge } from '@/types/learning';

export const pythonChallenges: Challenge[] = [
  {
    id: 'challenge-py-celsius',
    lessonId: 'lesson-py-variables',
    title: 'Celsius to Fahrenheit',
    description: 'Write a function celsius_to_fahrenheit(c) that converts Celsius to Fahrenheit. Formula: F = (C × 9/5) + 32.',
    difficulty: 'beginner',
    order: 1,
    functionName: 'celsius_to_fahrenheit',
    starterCode: `def celsius_to_fahrenheit(c):
    # Write your code here
    pass`,
    testCases: [
      { id: 'tc-py-c1', args: [0], expected: 32.0 },
      { id: 'tc-py-c2', args: [100], expected: 212.0 },
      { id: 'tc-py-c3', args: [-40], expected: -40.0 },
    ],
    hints: [
      { id: 'hint-py-cel-1', content: 'Apply the formula F = (C * 9/5) + 32.', order: 1 },
    ],
    explanation: 'return (c * 9/5) + 32',
  },
  {
    id: 'challenge-py-palindrome',
    lessonId: 'lesson-py-strings',
    title: 'Palindrome Check',
    description: 'Write is_palindrome(s) that returns True if s reads the same forwards and backwards (ignore case).',
    difficulty: 'beginner',
    order: 2,
    functionName: 'is_palindrome',
    starterCode: `def is_palindrome(s):
    # Write your code here
    pass`,
    testCases: [
      { id: 'tc-py-pal-1', args: ['racecar'], expected: true },
      { id: 'tc-py-pal-2', args: ['hello'], expected: false },
      { id: 'tc-py-pal-3', args: ['Madam'], expected: true },
      { id: 'tc-py-pal-4', args: ['A'], expected: true },
    ],
    hints: [
      { id: 'hint-py-pal-1', content: 'Convert to lowercase, then compare s with s reversed.', order: 1 },
      { id: 'hint-py-pal-2', content: 's[::-1] reverses a string.', order: 2 },
    ],
    explanation: 's = s.lower(); return s == s[::-1]',
  },
  {
    id: 'challenge-py-fizzbuzz',
    lessonId: 'lesson-py-control-flow',
    title: 'FizzBuzz List',
    description: 'Write fizzbuzz(n) that returns a list of FizzBuzz values from 1 to n (inclusive).',
    difficulty: 'beginner',
    order: 3,
    functionName: 'fizzbuzz',
    starterCode: `def fizzbuzz(n):
    # Return a list from 1 to n with FizzBuzz rules
    pass`,
    testCases: [
      { id: 'tc-py-fz-1', args: [5], expected: [1, 2, 'Fizz', 4, 'Buzz'] },
      { id: 'tc-py-fz-2', args: [15], expected: [1,2,'Fizz',4,'Buzz','Fizz',7,8,'Fizz','Buzz',11,'Fizz',13,14,'FizzBuzz'] },
    ],
    hints: [
      { id: 'hint-py-fz-1', content: 'Use a list comprehension or for loop over range(1, n+1).', order: 1 },
      { id: 'hint-py-fz-2', content: 'Check divisibility by 15 first, then 3, then 5, else the number.', order: 2 },
    ],
    explanation: 'Loop range(1, n+1). For each i: "FizzBuzz" if i%15==0, "Fizz" if i%3==0, "Buzz" if i%5==0, else i.',
  },
  {
    id: 'challenge-py-flatten',
    lessonId: 'lesson-py-lists',
    title: 'Flatten Nested List',
    description: 'Write flatten(lst) that flattens one level of nesting.',
    difficulty: 'intermediate',
    order: 4,
    functionName: 'flatten',
    starterCode: `def flatten(lst):
    # Flatten one level of nesting
    pass`,
    testCases: [
      { id: 'tc-py-flat-1', args: [[[1,2],[3,4]]], expected: [1,2,3,4] },
      { id: 'tc-py-flat-2', args: [[[1],[2],[3]]], expected: [1,2,3] },
    ],
    hints: [
      { id: 'hint-py-flat-1', content: 'Use a list comprehension with two for clauses.', order: 1 },
      { id: 'hint-py-flat-2', content: '[item for sublist in lst for item in sublist]', order: 2 },
    ],
    explanation: '[item for sublist in lst for item in sublist] — the inner loop iterates over each sublist.',
  },
  {
    id: 'challenge-py-word-count',
    lessonId: 'lesson-py-dicts',
    title: 'Word Frequency Counter',
    description: 'Write word_count(text) that returns a dict mapping each word to its frequency. Ignore case.',
    difficulty: 'intermediate',
    order: 5,
    functionName: 'word_count',
    starterCode: `def word_count(text):
    # Return dict of word frequencies
    pass`,
    testCases: [
      { id: 'tc-py-wc-1', args: ['the cat sat on the mat'], expected: { the: 2, cat: 1, sat: 1, on: 1, mat: 1 } },
      { id: 'tc-py-wc-2', args: ['Hello hello HELLO'], expected: { hello: 3 } },
    ],
    hints: [
      { id: 'hint-py-wc-1', content: 'Split the text into words, convert to lowercase, then count using a dict.', order: 1 },
      { id: 'hint-py-wc-2', content: 'Use dict.get(word, 0) + 1 to count.', order: 2 },
    ],
    explanation: 'Split, lowercase, then freq[w] = freq.get(w, 0) + 1 for each word.',
  },
  {
    id: 'challenge-py-memoize',
    lessonId: 'lesson-py-functions',
    title: 'Memoize Decorator',
    description: 'Write a memoize(func) decorator that caches function results by arguments.',
    difficulty: 'intermediate',
    order: 6,
    functionName: 'memoize',
    starterCode: `def memoize(func):
    # Return a wrapper that caches results
    pass`,
    testCases: [
      { id: 'tc-py-memo-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-py-memo-1', content: 'Create a cache = {} dict inside the wrapper. Use args as the key.', order: 1 },
      { id: 'hint-py-memo-2', content: 'if args not in cache: cache[args] = func(*args); return cache[args]', order: 2 },
    ],
    explanation: 'Create a wrapper function that stores results in a dict keyed by args. Return cached result on repeat calls.',
  },
  {
    id: 'challenge-py-linked-list',
    lessonId: 'lesson-py-oop',
    title: 'Linked List Node',
    description: 'Implement a Node class and a LinkedList class with append(val) and to_list() methods.',
    difficulty: 'advanced',
    order: 7,
    functionName: 'LinkedList',
    starterCode: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, val):
        # Add val to the end
        pass

    def to_list(self):
        # Return a Python list of values
        pass`,
    testCases: [
      { id: 'tc-py-ll-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-py-ll-1', content: 'For append: if head is None, set head. Otherwise traverse to the last node.', order: 1 },
      { id: 'hint-py-ll-2', content: 'For to_list: walk from head, collecting node.val into a list.', order: 2 },
    ],
    explanation: 'append: find the tail, set tail.next = Node(val). to_list: traverse the chain collecting .val.',
  },
  {
    id: 'challenge-py-fibonacci-gen',
    lessonId: 'lesson-py-decorators',
    title: 'Fibonacci Generator',
    description: 'Write a generator function fibonacci() that yields Fibonacci numbers indefinitely. Return the nth (0-indexed) Fibonacci number using next().',
    difficulty: 'advanced',
    order: 8,
    functionName: 'fibonacci',
    starterCode: `def fibonacci():
    # Yield Fibonacci numbers indefinitely
    pass`,
    testCases: [
      { id: 'tc-py-fib-1', args: [], expected: null },
    ],
    hints: [
      { id: 'hint-py-fib-1', content: 'Start with a=0, b=1. yield a, then set a, b = b, a+b in an infinite loop.', order: 1 },
    ],
    explanation: 'a, b = 0, 1; while True: yield a; a, b = b, a+b',
  },
  {
    id: 'challenge-py-binary-search',
    lessonId: 'lesson-py-algorithms',
    title: 'Binary Search',
    description: 'Implement binary_search(arr, target) returning the index of target or -1 if not found.',
    difficulty: 'advanced',
    order: 9,
    functionName: 'binary_search',
    starterCode: `def binary_search(arr, target):
    # Implement binary search
    pass`,
    testCases: [
      { id: 'tc-py-bs-1', args: [[1,3,5,7,9], 7], expected: 3 },
      { id: 'tc-py-bs-2', args: [[1,3,5,7,9], 4], expected: -1 },
      { id: 'tc-py-bs-3', args: [[2,4,6,8,10], 2], expected: 0 },
    ],
    hints: [
      { id: 'hint-py-bsrch-1', content: 'Use low=0, high=len(arr)-1. Find mid = (low+high)//2.', order: 1 },
      { id: 'hint-py-bsrch-2', content: 'If arr[mid]==target return mid. If too small, low=mid+1. If too big, high=mid-1.', order: 2 },
    ],
    explanation: 'Classic binary search: halve the search space each step until found or low>high.',
  },
];
