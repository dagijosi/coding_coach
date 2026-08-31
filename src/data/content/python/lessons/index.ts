import type { Lesson } from '@/types/learning';

// ── Lesson 1: Variables & Types ───────────────────────────────────────────────
export const pyVariablesLesson: Lesson = {
  id: 'lesson-py-variables',
  topicId: 'topic-py-fundamentals',
  title: 'Variables & Types',
  description: 'Learn how Python stores data and discovers types dynamically.',
  language: 'python',
  difficulty: 'beginner',
  estimatedMinutes: 15,
  order: 1,
  prerequisites: [],
  content: [
    { type: 'heading', content: 'Variables in Python' },
    {
      type: 'text',
      content:
        'Python variables are created the moment you assign a value. No need to declare a type — Python figures it out automatically (dynamic typing).',
    },
    {
      type: 'code',
      language: 'python',
      content: `name = "Alice"    # str
age  = 30         # int
pi   = 3.14       # float
active = True     # bool

print(type(name))   # <class 'str'>
print(type(age))    # <class 'int'>`,
    },
    { type: 'heading', content: 'Multiple Assignment' },
    {
      type: 'code',
      language: 'python',
      content: `x, y, z = 1, 2, 3      # unpack
a = b = c = 0          # all equal
x, y = y, x            # swap without temp variable`,
    },
    { type: 'heading', content: 'Naming Rules' },
    {
      type: 'text',
      content:
        'Variable names must start with a letter or underscore. Use snake_case (lower_with_underscores) by convention in Python — unlike JavaScript which uses camelCase.',
    },
  ],
};

// ── Lesson 2: Strings & Input ─────────────────────────────────────────────────
export const pyStringsLesson: Lesson = {
  id: 'lesson-py-strings',
  topicId: 'topic-py-fundamentals',
  title: 'Strings & Input',
  description: 'Work with text using Python\'s rich string methods and f-strings.',
  language: 'python',
  difficulty: 'beginner',
  estimatedMinutes: 18,
  order: 2,
  prerequisites: ['lesson-py-variables'],
  content: [
    { type: 'heading', content: 'String Basics' },
    {
      type: 'code',
      language: 'python',
      content: `greeting = "Hello, World!"

print(len(greeting))          # 13
print(greeting.upper())       # "HELLO, WORLD!"
print(greeting.lower())       # "hello, world!"
print(greeting.replace("World", "Python"))  # "Hello, Python!"`,
    },
    { type: 'heading', content: 'f-Strings (Formatted Strings)' },
    {
      type: 'text',
      content:
        'f-strings (prefix with f) allow you to embed expressions directly in string literals. They are the modern, readable way to format strings.',
    },
    {
      type: 'code',
      language: 'python',
      content: `name = "Alice"
age = 28
intro = f"My name is {name} and I am {age} years old."
print(intro)   # "My name is Alice and I am 28 years old."

# Expressions work too
print(f"Next year I'll be {age + 1}")`,
    },
    { type: 'heading', content: 'String Slicing' },
    {
      type: 'code',
      language: 'python',
      content: `s = "Python"
print(s[0])      # 'P'  (first character)
print(s[-1])     # 'n'  (last character)
print(s[0:3])    # 'Pyt' (index 0,1,2)
print(s[::-1])   # 'nohtyP' (reversed)`,
    },
    { type: 'heading', content: 'User Input' },
    {
      type: 'code',
      language: 'python',
      content: `name = input("Enter your name: ")
age  = int(input("Enter your age: "))  # input() always returns str; cast it
print(f"Hello {name}, you are {age}")`,
    },
  ],
};

// ── Lesson 3: Control Flow ────────────────────────────────────────────────────
export const pyControlFlowLesson: Lesson = {
  id: 'lesson-py-control-flow',
  topicId: 'topic-py-fundamentals',
  title: 'Control Flow',
  description: 'Direct your program with if/elif/else and for/while loops.',
  language: 'python',
  difficulty: 'beginner',
  estimatedMinutes: 20,
  order: 3,
  prerequisites: ['lesson-py-variables'],
  content: [
    { type: 'heading', content: 'if / elif / else' },
    {
      type: 'text',
      content:
        'Python uses indentation (not braces) to define code blocks. elif is short for "else if". There is no switch statement — use if/elif chains or match (Python 3.10+).',
    },
    {
      type: 'code',
      language: 'python',
      content: `score = 82

if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
else:
    print("F")`,
    },
    { type: 'heading', content: 'for Loops' },
    {
      type: 'text',
      content:
        'Python\'s for loop iterates over any iterable — a list, string, range, or dictionary. Use range() to loop a set number of times.',
    },
    {
      type: 'code',
      language: 'python',
      content: `for i in range(5):        # 0 1 2 3 4
    print(i)

fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit.upper())`,
    },
    { type: 'heading', content: 'while Loop & break/continue' },
    {
      type: 'code',
      language: 'python',
      content: `count = 0
while count < 5:
    if count == 3:
        count += 1
        continue     # skip 3
    print(count)
    count += 1
# prints 0 1 2 4`,
    },
  ],
};

// ── Lesson 4: Lists & Tuples ──────────────────────────────────────────────────
export const pyListsLesson: Lesson = {
  id: 'lesson-py-lists',
  topicId: 'topic-py-intermediate',
  title: 'Lists & Tuples',
  description: 'Store ordered collections of data with lists and immutable tuples.',
  language: 'python',
  difficulty: 'intermediate',
  estimatedMinutes: 22,
  order: 4,
  prerequisites: ['lesson-py-control-flow'],
  content: [
    { type: 'heading', content: 'Lists' },
    {
      type: 'code',
      language: 'python',
      content: `nums = [3, 1, 4, 1, 5, 9]

nums.append(2)          # add to end
nums.insert(0, 0)       # insert at index
nums.remove(1)          # remove first occurrence
popped = nums.pop()     # remove & return last

nums.sort()             # sort in place
print(sorted(nums))     # return sorted copy`,
    },
    { type: 'heading', content: 'List Comprehensions' },
    {
      type: 'text',
      content:
        'List comprehensions create new lists in a single, readable line. They replace many for-loop patterns.',
    },
    {
      type: 'code',
      language: 'python',
      content: `squares = [x**2 for x in range(1, 6)]
# [1, 4, 9, 16, 25]

evens = [x for x in range(20) if x % 2 == 0]
# [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]`,
    },
    { type: 'heading', content: 'Tuples — Immutable Lists' },
    {
      type: 'code',
      language: 'python',
      content: `point = (3, 7)        # immutable
x, y = point          # unpack

# tuples are faster and hashable — use as dict keys
coords = {(0, 0): "origin", (1, 0): "x-axis"}`,
    },
  ],
};

// ── Lesson 5: Dictionaries & Sets ────────────────────────────────────────────
export const pyDictsLesson: Lesson = {
  id: 'lesson-py-dicts',
  topicId: 'topic-py-intermediate',
  title: 'Dictionaries & Sets',
  description: 'Use key-value mappings and unique-value sets for fast lookups.',
  language: 'python',
  difficulty: 'intermediate',
  estimatedMinutes: 22,
  order: 5,
  prerequisites: ['lesson-py-lists'],
  content: [
    { type: 'heading', content: 'Dictionaries' },
    {
      type: 'code',
      language: 'python',
      content: `person = {"name": "Alice", "age": 28, "city": "Addis Ababa"}

print(person["name"])               # "Alice"
print(person.get("job", "unknown")) # "unknown" (safe default)

person["age"] = 29                  # update
person["email"] = "a@example.com"  # add new key
del person["city"]                  # remove key

for key, value in person.items():
    print(f"{key}: {value}")`,
    },
    { type: 'heading', content: 'Dict Comprehensions' },
    {
      type: 'code',
      language: 'python',
      content: `words = ["hello", "world", "python"]
lengths = {w: len(w) for w in words}
# {'hello': 5, 'world': 5, 'python': 6}`,
    },
    { type: 'heading', content: 'Sets — Unique Collections' },
    {
      type: 'code',
      language: 'python',
      content: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # union:        {1,2,3,4,5,6}
print(a & b)   # intersection: {3,4}
print(a - b)   # difference:   {1,2}

# Remove duplicates from a list
unique = list(set([1, 2, 2, 3, 3, 3]))`,
    },
  ],
};

// ── Lesson 6: Functions & Lambdas ─────────────────────────────────────────────
export const pyFunctionsLesson: Lesson = {
  id: 'lesson-py-functions',
  topicId: 'topic-py-intermediate',
  title: 'Functions & Lambdas',
  description: 'Define reusable functions with default args, *args, **kwargs, and lambdas.',
  language: 'python',
  difficulty: 'intermediate',
  estimatedMinutes: 25,
  order: 6,
  prerequisites: ['lesson-py-lists', 'lesson-py-dicts'],
  content: [
    { type: 'heading', content: 'Defining Functions' },
    {
      type: 'code',
      language: 'python',
      content: `def greet(name, greeting="Hello"):
    """Return a greeting string."""
    return f"{greeting}, {name}!"

print(greet("Alice"))            # "Hello, Alice!"
print(greet("Bob", "Hi"))        # "Hi, Bob!"
print(greet(greeting="Hey", name="Carol"))  # keyword args`,
    },
    { type: 'heading', content: '*args and **kwargs' },
    {
      type: 'code',
      language: 'python',
      content: `def add(*numbers):      # any number of positional args
    return sum(numbers)

print(add(1, 2, 3, 4))  # 10

def display(**info):    # any number of keyword args
    for k, v in info.items():
        print(f"{k}={v}")

display(name="Alice", age=28)`,
    },
    { type: 'heading', content: 'Lambda Functions' },
    {
      type: 'text',
      content:
        'A lambda is a small anonymous function. Use them for short, one-expression operations — often passed to map(), filter(), or sorted().',
    },
    {
      type: 'code',
      language: 'python',
      content: `square = lambda x: x ** 2
print(square(5))  # 25

# Sort by second element of tuple
pairs = [(1, 'b'), (2, 'a'), (3, 'c')]
pairs.sort(key=lambda p: p[1])
print(pairs)  # [(2,'a'), (1,'b'), (3,'c')]`,
    },
  ],
};

// ── Lesson 7: OOP in Python ───────────────────────────────────────────────────
export const pyOopLesson: Lesson = {
  id: 'lesson-py-oop',
  topicId: 'topic-py-advanced',
  title: 'Object-Oriented Python',
  description: 'Build classes with constructors, inheritance, properties, and dunder methods.',
  language: 'python',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 7,
  prerequisites: ['lesson-py-functions'],
  content: [
    { type: 'heading', content: 'Classes and __init__' },
    {
      type: 'code',
      language: 'python',
      content: `class Animal:
    def __init__(self, name, sound):
        self.name = name
        self.sound = sound

    def speak(self):
        return f"{self.name} says {self.sound}!"

    def __repr__(self):
        return f"Animal({self.name!r})"

dog = Animal("Rex", "Woof")
print(dog.speak())   # "Rex says Woof!"
print(repr(dog))     # "Animal('Rex')"`,
    },
    { type: 'heading', content: 'Inheritance' },
    {
      type: 'code',
      language: 'python',
      content: `class Dog(Animal):
    def __init__(self, name):
        super().__init__(name, "Woof")
        self.tricks = []

    def learn(self, trick):
        self.tricks.append(trick)

    def perform(self):
        return ", ".join(self.tricks)

buddy = Dog("Buddy")
buddy.learn("sit")
buddy.learn("shake")
print(buddy.perform())  # "sit, shake"`,
    },
    { type: 'heading', content: '@property — Computed Attributes' },
    {
      type: 'code',
      language: 'python',
      content: `class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def radius(self):
        return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value

    @property
    def area(self):
        import math
        return math.pi * self._radius ** 2

c = Circle(5)
print(f"Area: {c.area:.2f}")  # Area: 78.54`,
    },
  ],
};

// ── Lesson 8: Decorators & Generators ────────────────────────────────────────
export const pyDecoratorsLesson: Lesson = {
  id: 'lesson-py-decorators',
  topicId: 'topic-py-advanced',
  title: 'Decorators & Generators',
  description: 'Extend function behaviour with decorators and generate infinite sequences efficiently.',
  language: 'python',
  difficulty: 'advanced',
  estimatedMinutes: 28,
  order: 8,
  prerequisites: ['lesson-py-functions', 'lesson-py-oop'],
  content: [
    { type: 'heading', content: 'Decorators' },
    {
      type: 'text',
      content:
        'A decorator is a function that wraps another function to add behaviour without modifying its source. The @decorator syntax is syntactic sugar.',
    },
    {
      type: 'code',
      language: 'python',
      content: `import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

@timer
def slow_add(a, b):
    time.sleep(0.1)
    return a + b

print(slow_add(3, 4))  # prints timing, then 7`,
    },
    { type: 'heading', content: 'Generators with yield' },
    {
      type: 'text',
      content:
        'Generators produce values lazily — one at a time — using yield. They are memory-efficient for large or infinite sequences.',
    },
    {
      type: 'code',
      language: 'python',
      content: `def fibonacci():
    a, b = 0, 1
    while True:           # infinite generator!
        yield a
        a, b = b, a + b

fib = fibonacci()
print([next(fib) for _ in range(8)])
# [0, 1, 1, 2, 3, 5, 8, 13]

# Generator expression (lazy list comprehension)
squares = (x**2 for x in range(1_000_000))  # uses almost no memory
print(next(squares))  # 0`,
    },
  ],
};

// ── Lesson 9: Error Handling & Algorithms ────────────────────────────────────
export const pyAlgorithmsLesson: Lesson = {
  id: 'lesson-py-algorithms',
  topicId: 'topic-py-advanced',
  title: 'Error Handling & Algorithms',
  description: 'Handle exceptions cleanly and implement classic algorithms in Python.',
  language: 'python',
  difficulty: 'advanced',
  estimatedMinutes: 32,
  order: 9,
  prerequisites: ['lesson-py-oop'],
  content: [
    { type: 'heading', content: 'try / except / finally' },
    {
      type: 'code',
      language: 'python',
      content: `def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

try:
    result = divide(10, 0)
except ValueError as e:
    print(f"Error: {e}")     # "Error: Cannot divide by zero"
except ZeroDivisionError:
    print("Zero division")
finally:
    print("Cleanup done")    # always runs`,
    },
    { type: 'heading', content: 'Custom Exceptions' },
    {
      type: 'code',
      language: 'python',
      content: `class InsufficientFundsError(Exception):
    def __init__(self, amount, balance):
        self.amount = amount
        self.balance = balance
        super().__init__(f"Cannot withdraw {amount}, balance is {balance}")

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFundsError(amount, balance)
    return balance - amount`,
    },
    { type: 'heading', content: 'Binary Search in Python' },
    {
      type: 'code',
      language: 'python',
      content: `def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

print(binary_search([1,3,5,7,9], 7))  # 3`,
    },
    { type: 'heading', content: 'Merge Sort — Divide & Conquer' },
    {
      type: 'code',
      language: 'python',
      content: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left  = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    # merge
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]

print(merge_sort([5, 2, 8, 1, 9]))  # [1, 2, 5, 8, 9]`,
    },
  ],
};
