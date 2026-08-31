import type { Concept } from '@/types/learning';

export const pythonConcepts: Concept[] = [
  // Variables
  { id: 'concept-py-dynamic-typing', lessonId: 'lesson-py-variables', name: 'Dynamic Typing', summary: 'Python determines a variable\'s type at runtime. You never declare types explicitly — just assign a value.', order: 1 },
  { id: 'concept-py-snake-case', lessonId: 'lesson-py-variables', name: 'snake_case Convention', summary: 'Python variables use snake_case (words separated by underscores). This differs from JavaScript\'s camelCase.', order: 2 },
  { id: 'concept-py-swap', lessonId: 'lesson-py-variables', name: 'Tuple Swap', summary: 'Python allows swapping two variables in one line: x, y = y, x — no temporary variable needed.', order: 3 },

  // Strings
  { id: 'concept-py-fstring', lessonId: 'lesson-py-strings', name: 'f-Strings', summary: 'f-strings (f"...{expr}...") embed expressions directly in strings. They are the fastest and most readable way to format text in Python 3.6+.', order: 1 },
  { id: 'concept-py-slicing', lessonId: 'lesson-py-strings', name: 'String Slicing', summary: 'str[start:stop:step] extracts substrings. Negative indices count from the end. s[::-1] reverses a string.', order: 2 },
  { id: 'concept-py-input', lessonId: 'lesson-py-strings', name: 'input() always returns str', summary: 'input() always returns a string. Use int(), float(), or other constructors to convert to the correct type.', order: 3 },

  // Control Flow
  { id: 'concept-py-indentation', lessonId: 'lesson-py-control-flow', name: 'Indentation as Syntax', summary: 'Python uses indentation (4 spaces) instead of braces to define blocks. Inconsistent indentation causes IndentationError.', order: 1 },
  { id: 'concept-py-range', lessonId: 'lesson-py-control-flow', name: 'range()', summary: 'range(n) produces integers 0 to n-1. range(start, stop, step) gives full control. It is lazy — use list(range(n)) to materialise.', order: 2 },
  { id: 'concept-py-for-in', lessonId: 'lesson-py-control-flow', name: 'for...in loops any iterable', summary: 'Python\'s for loop iterates over any iterable: lists, strings, dicts, generators. No index needed unless you use enumerate().', order: 3 },

  // Lists
  { id: 'concept-py-list-comp', lessonId: 'lesson-py-lists', name: 'List Comprehensions', summary: '[expr for item in iterable if condition] creates a new list in one line. More Pythonic than a for loop with append().', order: 1 },
  { id: 'concept-py-tuple-immutable', lessonId: 'lesson-py-lists', name: 'Tuples are Immutable', summary: 'Tuples cannot be modified after creation. They are hashable and can be used as dictionary keys — lists cannot.', order: 2 },
  { id: 'concept-py-negative-index', lessonId: 'lesson-py-lists', name: 'Negative Indexing', summary: 'lst[-1] is the last element, lst[-2] the second-to-last, etc. Works on any sequence (strings, tuples, lists).', order: 3 },

  // Dicts
  { id: 'concept-py-dict-get', lessonId: 'lesson-py-dicts', name: 'dict.get() with default', summary: 'dict.get(key, default) returns the default value instead of raising KeyError when the key is missing.', order: 1 },
  { id: 'concept-py-dict-comp', lessonId: 'lesson-py-dicts', name: 'Dict Comprehensions', summary: '{k: v for k, v in iterable} builds a dictionary in one readable expression — the dict equivalent of list comprehensions.', order: 2 },
  { id: 'concept-py-set-ops', lessonId: 'lesson-py-dicts', name: 'Set Operations', summary: 'Sets support union (|), intersection (&), difference (-), and symmetric difference (^). Membership test (in) is O(1) — much faster than lists.', order: 3 },

  // Functions
  { id: 'concept-py-default-args', lessonId: 'lesson-py-functions', name: 'Default Arguments', summary: 'Parameters with default values are optional. Place required parameters before optional ones. Never use mutable defaults (like []) — use None instead.', order: 1 },
  { id: 'concept-py-args-kwargs', lessonId: 'lesson-py-functions', name: '*args and **kwargs', summary: '*args collects extra positional arguments as a tuple. **kwargs collects extra keyword arguments as a dict. Together they allow flexible APIs.', order: 2 },
  { id: 'concept-py-lambda', lessonId: 'lesson-py-functions', name: 'Lambda Functions', summary: 'lambda x: expr creates a small anonymous function. Use for short callbacks in sorted(), map(), filter(). For complex logic, use def.', order: 3 },

  // OOP
  { id: 'concept-py-init', lessonId: 'lesson-py-oop', name: '__init__ constructor', summary: '__init__(self, ...) is called when a new instance is created. self refers to the instance itself and must be the first parameter.', order: 1 },
  { id: 'concept-py-inheritance', lessonId: 'lesson-py-oop', name: 'super()', summary: 'super().__init__() calls the parent class\'s constructor. Use it to avoid duplicating initialisation code in subclasses.', order: 2 },
  { id: 'concept-py-property', lessonId: 'lesson-py-oop', name: '@property decorator', summary: '@property turns a method into an attribute-style access. Use @prop.setter to allow assignment. This is Python\'s idiomatic getters/setters.', order: 3 },

  // Decorators/Generators
  { id: 'concept-py-decorator', lessonId: 'lesson-py-decorators', name: 'Decorators', summary: 'A decorator wraps a function to add behaviour (logging, timing, caching). @decorator_name is syntactic sugar for func = decorator(func).', order: 1 },
  { id: 'concept-py-generator', lessonId: 'lesson-py-decorators', name: 'Generators and yield', summary: 'A generator function uses yield to produce values one at a time. It pauses execution between yields, making it memory-efficient for large sequences.', order: 2 },
  { id: 'concept-py-lazy', lessonId: 'lesson-py-decorators', name: 'Lazy Evaluation', summary: 'Generators compute values only when requested (lazy). This is crucial for large datasets or infinite sequences — no memory wasted on unused values.', order: 3 },

  // Algorithms
  { id: 'concept-py-exception', lessonId: 'lesson-py-algorithms', name: 'Exception Hierarchy', summary: 'All Python exceptions inherit from BaseException. Catch specific exceptions (ValueError, TypeError) before catching the general Exception class.', order: 1 },
  { id: 'concept-py-custom-exception', lessonId: 'lesson-py-algorithms', name: 'Custom Exceptions', summary: 'Subclass Exception to create domain-specific errors. Add extra fields for context. Raise them with raise MyError(...) and catch with except MyError.', order: 2 },
  { id: 'concept-py-complexity', lessonId: 'lesson-py-algorithms', name: 'Algorithm Complexity', summary: 'Merge sort runs in O(n log n) — much better than bubble sort\'s O(n²). Choose algorithms based on Big O, not just what "feels" fast.', order: 3 },
];
