import type { Problem } from '@/types/learning';

export const pythonProblems: Problem[] = [
  // Variables
  {
    id: 'problem-py-var-swap',
    lessonId: 'lesson-py-variables',
    title: 'Variable swap output',
    description: 'What does this Python code print after the swap?',
    type: 'predict-output',
    difficulty: 'beginner',
    order: 1,
    prompt: 'a, b = 5, 10\na, b = b, a\nprint(a, b)',
    choices: ['5 10', '10 5', '10 10', 'Error'],
    answer: 1,
    hints: [
      { id: 'hint-py-var-1', content: 'Python evaluates the right side fully before assigning.', order: 1 },
      { id: 'hint-py-var-2', content: 'b, a means b=10 goes to a, a=5 goes to b. So a=10, b=5.', order: 2 },
    ],
    explanation: 'a, b = b, a swaps the two values. a becomes 10 (old b) and b becomes 5 (old a). Prints "10 5".',
  },
  {
    id: 'problem-py-var-type',
    lessonId: 'lesson-py-variables',
    title: 'Dynamic typing result',
    description: 'What does type(x) return after these two lines?',
    type: 'predict-output',
    difficulty: 'beginner',
    order: 2,
    prompt: 'x = 42\nx = "hello"\nprint(type(x).__name__)',
    choices: ['int', 'str', 'object', 'Error'],
    answer: 1,
    hints: [
      { id: 'hint-py-type-1', content: 'Python is dynamically typed. Reassigning x changes its type.', order: 1 },
    ],
    explanation: 'x was first an int (42), then reassigned to a string ("hello"). In Python, a variable can change type. type(x).__name__ returns "str".',
  },

  // Strings
  {
    id: 'problem-py-str-slice',
    lessonId: 'lesson-py-strings',
    title: 'String slice result',
    description: 'What does this slicing expression produce?',
    type: 'predict-output',
    difficulty: 'beginner',
    order: 1,
    prompt: 's = "Python"\nprint(s[1:4])',
    choices: ['"Pyt"', '"yth"', '"ytho"', '"ython"'],
    answer: 1,
    hints: [
      { id: 'hint-py-str-1', content: 's[start:stop] includes start but excludes stop.', order: 1 },
      { id: 'hint-py-str-2', content: 'Index 1 is "y", index 4 is "o" (excluded). So you get indices 1,2,3.', order: 2 },
    ],
    explanation: 's[1:4] extracts characters at indices 1, 2, 3: "y", "t", "h" → "yth".',
  },
  {
    id: 'problem-py-str-fstring',
    lessonId: 'lesson-py-strings',
    title: 'f-string expression',
    description: 'What does this f-string print?',
    type: 'predict-output',
    difficulty: 'beginner',
    order: 2,
    prompt: 'n = 5\nprint(f"{n} squared is {n**2}")',
    choices: ['"n squared is n**2"', '"5 squared is 25"', '"5 squared is n**2"', 'Error'],
    answer: 1,
    hints: [
      { id: 'hint-py-fstr-1', content: 'f-strings evaluate the expressions inside {}.', order: 1 },
    ],
    explanation: '{n} becomes 5, {n**2} becomes 25. Prints "5 squared is 25".',
  },

  // Control Flow
  {
    id: 'problem-py-cf-range',
    lessonId: 'lesson-py-control-flow',
    title: 'range() iteration',
    description: 'How many times does this loop run?',
    type: 'predict-output',
    difficulty: 'beginner',
    order: 1,
    prompt: 'count = 0\nfor i in range(2, 10, 3):\n    count += 1\nprint(count)',
    choices: ['2', '3', '4', '8'],
    answer: 1,
    hints: [
      { id: 'hint-py-range-1', content: 'range(2, 10, 3) produces: 2, 5, 8. Count those values.', order: 1 },
    ],
    explanation: 'range(2, 10, 3) generates 2, 5, 8 — three values. The loop runs 3 times, so count = 3.',
  },

  // Lists
  {
    id: 'problem-py-list-comp',
    lessonId: 'lesson-py-lists',
    title: 'List comprehension output',
    description: 'What list does this comprehension produce?',
    type: 'predict-output',
    difficulty: 'intermediate',
    order: 1,
    prompt: 'result = [x*2 for x in range(4) if x % 2 == 0]\nprint(result)',
    choices: ['[0, 2, 4, 6]', '[0, 4]', '[0, 2, 4]', '[2, 6]'],
    answer: 1,
    hints: [
      { id: 'hint-py-lc-1', content: 'First filter: range(4) is 0,1,2,3. Keep only even: 0,2.', order: 1 },
      { id: 'hint-py-lc-2', content: 'Then transform: 0*2=0, 2*2=4. Result: [0, 4].', order: 2 },
    ],
    explanation: 'range(4) = [0,1,2,3]. Filter even: [0,2]. Multiply by 2: [0,4].',
  },

  // Dicts
  {
    id: 'problem-py-dict-get',
    lessonId: 'lesson-py-dicts',
    title: 'dict.get() with missing key',
    description: 'What does this print?',
    type: 'predict-output',
    difficulty: 'intermediate',
    order: 1,
    prompt: 'd = {"a": 1, "b": 2}\nprint(d.get("c", 99))',
    choices: ['None', 'KeyError', '99', '0'],
    answer: 2,
    hints: [
      { id: 'hint-py-dg-1', content: 'dict.get(key, default) returns default if key is missing — no KeyError.', order: 1 },
    ],
    explanation: '"c" is not in d. get("c", 99) returns the default 99.',
  },

  // Functions
  {
    id: 'problem-py-fn-lambda',
    lessonId: 'lesson-py-functions',
    title: 'Lambda sort key',
    description: 'What is the order after sorting?',
    type: 'predict-output',
    difficulty: 'intermediate',
    order: 1,
    prompt: 'words = ["banana", "fig", "apple"]\nwords.sort(key=lambda w: len(w))\nprint(words)',
    choices: ['["apple", "banana", "fig"]', '["fig", "apple", "banana"]', '["banana", "fig", "apple"]', '["apple", "fig", "banana"]'],
    answer: 1,
    hints: [
      { id: 'hint-py-lam-1', content: 'Sorting by len(w): fig=3, apple=5, banana=6.', order: 1 },
    ],
    explanation: 'Sorted by length: fig(3), apple(5), banana(6) → ["fig", "apple", "banana"].',
  },

  // OOP
  {
    id: 'problem-py-oop-super',
    lessonId: 'lesson-py-oop',
    title: 'super() call',
    description: 'What does child.greet() print?',
    type: 'predict-output',
    difficulty: 'advanced',
    order: 1,
    prompt: 'class Parent:\n    def __init__(self):\n        self.name = "Parent"\n\nclass Child(Parent):\n    def __init__(self):\n        super().__init__()\n        self.name = "Child"\n\n    def greet(self):\n        return f"Hello from {self.name}"\n\nchild = Child()\nprint(child.greet())',
    choices: ['"Hello from Parent"', '"Hello from Child"', 'Error', '"Hello from None"'],
    answer: 1,
    hints: [
      { id: 'hint-py-super-1', content: 'super().__init__() sets self.name = "Parent". Then Child\'s __init__ sets self.name = "Child".', order: 1 },
    ],
    explanation: 'super().__init__() sets name to "Parent", then Child\'s __init__ overwrites it to "Child". greet() returns "Hello from Child".',
  },

  // Decorators
  {
    id: 'problem-py-gen-next',
    lessonId: 'lesson-py-decorators',
    title: 'Generator next() value',
    description: 'What does the second call to next() return?',
    type: 'predict-output',
    difficulty: 'advanced',
    order: 1,
    prompt: 'def counter():\n    n = 0\n    while True:\n        yield n\n        n += 1\n\ng = counter()\nnext(g)\nprint(next(g))',
    choices: ['0', '1', '2', 'StopIteration'],
    answer: 1,
    hints: [
      { id: 'hint-py-gen-1', content: 'First next(g) yields 0. Then execution pauses. Second call resumes, increments to 1, yields 1.', order: 1 },
    ],
    explanation: 'First next(g): yields 0, pauses. Second next(g): resumes, n becomes 1, yields 1. Prints 1.',
  },

  // Algorithms
  {
    id: 'problem-py-algo-bin',
    lessonId: 'lesson-py-algorithms',
    title: 'Binary search result',
    description: 'What index does binary_search return for target=7?',
    type: 'predict-output',
    difficulty: 'advanced',
    order: 1,
    prompt: '# binary_search([1,3,5,7,9], 7)\n# returns the index of 7',
    choices: ['2', '3', '4', '-1'],
    answer: 1,
    hints: [
      { id: 'hint-py-bs-1', content: 'The list [1,3,5,7,9] — index 0 is 1, index 3 is 7.', order: 1 },
    ],
    explanation: 'In [1,3,5,7,9], element 7 is at index 3.',
  },
];
