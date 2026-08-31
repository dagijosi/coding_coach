import type { Lesson } from '@/types/learning';

// ── Lesson 9: Classes & OOP ───────────────────────────────────────────────────
export const classesLesson: Lesson = {
  id: 'lesson-classes',
  topicId: 'topic-advanced',
  title: 'Classes & Object-Oriented Programming',
  description: 'Model your domain with classes, inheritance, and encapsulation.',
  language: 'javascript',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  order: 9,
  prerequisites: ['lesson-objects', 'lesson-functions'],
  content: [
    { type: 'heading', content: 'Defining a Class' },
    {
      type: 'text',
      content:
        'A class is a blueprint for creating objects with shared structure and behaviour. The constructor method runs when you create a new instance.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `class Animal {
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }

  speak() {
    return \`\${this.name} says \${this.sound}!\`;
  }
}

const dog = new Animal('Rex', 'Woof');
console.log(dog.speak()); // "Rex says Woof!"`,
    },
    { type: 'heading', content: 'Inheritance with extends' },
    {
      type: 'code',
      language: 'javascript',
      content: `class Dog extends Animal {
  constructor(name) {
    super(name, 'Woof');  // call parent constructor
    this.tricks = [];
  }

  learn(trick) {
    this.tricks.push(trick);
  }

  perform() {
    return this.tricks.map(t => \`\${this.name} does \${t}\`).join(', ');
  }
}

const buddy = new Dog('Buddy');
buddy.learn('sit');
buddy.learn('roll over');
console.log(buddy.perform()); // "Buddy does sit, Buddy does roll over"`,
    },
    { type: 'heading', content: 'Private Fields (#)' },
    {
      type: 'code',
      language: 'javascript',
      content: `class BankAccount {
  #balance = 0;  // private — cannot be accessed outside

  deposit(amount) {
    if (amount > 0) this.#balance += amount;
  }

  get balance() {
    return this.#balance;
  }
}

const account = new BankAccount();
account.deposit(100);
console.log(account.balance); // 100
// account.#balance; // ✗ SyntaxError`,
    },
  ],
};

// ── Lesson 10: Error Handling ─────────────────────────────────────────────────
export const errorHandlingLesson: Lesson = {
  id: 'lesson-error-handling',
  topicId: 'topic-advanced',
  title: 'Error Handling',
  description: 'Write robust code that gracefully handles failures with try/catch and custom errors.',
  language: 'javascript',
  difficulty: 'advanced',
  estimatedMinutes: 20,
  order: 10,
  prerequisites: ['lesson-async', 'lesson-classes'],
  content: [
    { type: 'heading', content: 'try / catch / finally' },
    {
      type: 'text',
      content:
        'Wrap code that might fail in a try block. catch receives the error. finally always runs, whether or not there was an error.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `function divide(a, b) {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

try {
  console.log(divide(10, 2));  // 5
  console.log(divide(10, 0));  // throws
} catch (err) {
  console.error('Caught:', err.message); // "Caught: Division by zero"
} finally {
  console.log('Always runs');
}`,
    },
    { type: 'heading', content: 'Custom Error Classes' },
    {
      type: 'code',
      language: 'javascript',
      content: `class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

function validateAge(age) {
  if (typeof age !== 'number') throw new ValidationError('age', 'must be a number');
  if (age < 0 || age > 150) throw new ValidationError('age', 'out of range');
  return true;
}

try {
  validateAge('thirty');
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(\`\${err.field}: \${err.message}\`); // "age: must be a number"
  }
}`,
    },
    { type: 'heading', content: 'Error Handling in async/await' },
    {
      type: 'code',
      language: 'javascript',
      content: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  } catch (err) {
    // Handle network errors and HTTP errors
    console.error('Fetch failed:', err.message);
    return null;
  }
}`,
    },
  ],
};

// ── Lesson 11: Algorithms & Data Structures ───────────────────────────────────
export const algorithmsLesson: Lesson = {
  id: 'lesson-algorithms',
  topicId: 'topic-advanced',
  title: 'Algorithms & Data Structures',
  description: 'Master sorting, searching, recursion, and efficient data structures.',
  language: 'javascript',
  difficulty: 'advanced',
  estimatedMinutes: 35,
  order: 11,
  prerequisites: ['lesson-arrays', 'lesson-classes'],
  content: [
    { type: 'heading', content: 'Big O Notation' },
    {
      type: 'text',
      content:
        'Big O describes how the time or space an algorithm needs grows with the input size. O(1) is constant, O(n) is linear, O(n²) is quadratic. Always aim for the smallest Big O when writing loops.',
    },
    { type: 'heading', content: 'Binary Search — O(log n)' },
    {
      type: 'code',
      language: 'javascript',
      content: `function binarySearch(sortedArr, target) {
  let low = 0, high = sortedArr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sortedArr[mid] === target) return mid;
    if (sortedArr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1; // not found
}

const arr = [1, 3, 5, 7, 9, 11];
console.log(binarySearch(arr, 7));  // 3
console.log(binarySearch(arr, 4));  // -1`,
    },
    { type: 'heading', content: 'Recursion & the Stack' },
    {
      type: 'code',
      language: 'javascript',
      content: `// Factorial using recursion
function factorial(n) {
  if (n <= 1) return 1;          // base case
  return n * factorial(n - 1);   // recursive case
}

console.log(factorial(5)); // 120 (5 * 4 * 3 * 2 * 1)`,
    },
    { type: 'heading', content: 'Stack & Queue with Arrays' },
    {
      type: 'code',
      language: 'javascript',
      content: `// Stack — Last In First Out (LIFO)
const stack = [];
stack.push('a');       // add to top
stack.push('b');
stack.pop();           // remove from top → 'b'

// Queue — First In First Out (FIFO)
const queue = [];
queue.push('a');       // enqueue
queue.push('b');
queue.shift();         // dequeue → 'a'`,
    },
    { type: 'heading', content: 'Hash Maps with Map' },
    {
      type: 'code',
      language: 'javascript',
      content: `// Count word frequencies in O(n)
function wordFrequency(words) {
  const freq = new Map();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return freq;
}

const freq = wordFrequency(['cat', 'dog', 'cat', 'bird', 'dog', 'cat']);
console.log(freq.get('cat')); // 3`,
    },
  ],
};
