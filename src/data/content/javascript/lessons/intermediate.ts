import type { Lesson } from '@/types/learning';

// ── Lesson 6: Arrays ──────────────────────────────────────────────────────────
export const arraysLesson: Lesson = {
  id: 'lesson-arrays',
  topicId: 'topic-intermediate',
  title: 'Arrays',
  description: 'Store, access, and transform ordered collections of data.',
  language: 'javascript',
  difficulty: 'intermediate',
  estimatedMinutes: 25,
  order: 6,
  prerequisites: ['lesson-control-flow'],
  content: [
    { type: 'heading', content: 'Creating Arrays' },
    {
      type: 'text',
      content:
        'An array is an ordered list of values. Each item has an index starting from 0.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `const fruits = ['apple', 'banana', 'cherry'];
console.log(fruits[0]);       // 'apple'
console.log(fruits.length);   // 3`,
    },
    { type: 'heading', content: 'Core Array Methods' },
    {
      type: 'code',
      language: 'javascript',
      content: `const nums = [1, 2, 3, 4, 5];

// map — transform each element
const doubled = nums.map(n => n * 2);     // [2,4,6,8,10]

// filter — keep elements that pass a test
const evens = nums.filter(n => n % 2 === 0); // [2,4]

// reduce — accumulate into one value
const sum = nums.reduce((acc, n) => acc + n, 0); // 15

// find — first match
const firstBig = nums.find(n => n > 3);   // 4`,
    },
    { type: 'heading', content: 'Mutating vs Non-Mutating' },
    {
      type: 'text',
      content:
        'Some methods change the original array (push, pop, splice). Others return a new array and leave the original unchanged (map, filter, slice). Prefer non-mutating methods when you want predictable code.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `const arr = [3, 1, 4, 1, 5];

// sort mutates! — make a copy first for safety
const sorted = [...arr].sort((a, b) => a - b); // [1,1,3,4,5]
console.log(arr); // still [3,1,4,1,5]`,
    },
    { type: 'heading', content: 'Spread and Destructuring' },
    {
      type: 'code',
      language: 'javascript',
      content: `const a = [1, 2];
const b = [3, 4];
const combined = [...a, ...b]; // [1,2,3,4]

const [first, second, ...rest] = combined;
console.log(first);  // 1
console.log(rest);   // [3,4]`,
    },
  ],
};

// ── Lesson 7: Objects ─────────────────────────────────────────────────────────
export const objectsLesson: Lesson = {
  id: 'lesson-objects',
  topicId: 'topic-intermediate',
  title: 'Objects',
  description: 'Model real-world data with key-value pairs and object methods.',
  language: 'javascript',
  difficulty: 'intermediate',
  estimatedMinutes: 25,
  order: 7,
  prerequisites: ['lesson-arrays'],
  content: [
    { type: 'heading', content: 'Creating Objects' },
    {
      type: 'text',
      content:
        'An object is a collection of key-value pairs. Keys are strings (or symbols), values can be anything.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `const person = {
  name: 'Alice',
  age: 28,
  greet() {
    return \`Hi, I'm \${this.name}\`;
  },
};

console.log(person.name);       // 'Alice'
console.log(person.greet());    // "Hi, I'm Alice"`,
    },
    { type: 'heading', content: 'Object Destructuring & Spread' },
    {
      type: 'code',
      language: 'javascript',
      content: `const { name, age } = person;   // destructure
console.log(name, age);          // 'Alice' 28

const updated = { ...person, age: 29 }; // spread + override`,
    },
    { type: 'heading', content: 'Object.keys / values / entries' },
    {
      type: 'code',
      language: 'javascript',
      content: `const car = { make: 'Toyota', model: 'Corolla', year: 2022 };

Object.keys(car);    // ['make', 'model', 'year']
Object.values(car);  // ['Toyota', 'Corolla', 2022]
Object.entries(car); // [['make','Toyota'], ['model','Corolla'], ['year',2022]]

// iterate
for (const [key, value] of Object.entries(car)) {
  console.log(\`\${key}: \${value}\`);
}`,
    },
    { type: 'heading', content: 'Optional Chaining & Nullish Coalescing' },
    {
      type: 'code',
      language: 'javascript',
      content: `const user = { profile: { bio: 'Developer' } };

// optional chaining (?.) — safe access without crashing
console.log(user?.profile?.bio);      // 'Developer'
console.log(user?.address?.city);     // undefined (not an error)

// nullish coalescing (??) — fallback for null/undefined
const city = user?.address?.city ?? 'Unknown';
console.log(city); // 'Unknown'`,
    },
  ],
};

// ── Lesson 8: Async JavaScript ────────────────────────────────────────────────
export const asyncLesson: Lesson = {
  id: 'lesson-async',
  topicId: 'topic-intermediate',
  title: 'Async JavaScript',
  description: 'Handle time-consuming operations with Promises and async/await.',
  language: 'javascript',
  difficulty: 'intermediate',
  estimatedMinutes: 30,
  order: 8,
  prerequisites: ['lesson-functions', 'lesson-objects'],
  content: [
    { type: 'heading', content: 'Why Async?' },
    {
      type: 'text',
      content:
        'JavaScript runs on a single thread. Asynchronous code lets slow tasks (network requests, timers, file reads) complete in the background without blocking the rest of the program.',
    },
    { type: 'heading', content: 'Promises' },
    {
      type: 'code',
      language: 'javascript',
      content: `function fetchUser(id) {
  return new Promise((resolve, reject) => {
    if (id > 0) {
      resolve({ id, name: 'Alice' }); // success
    } else {
      reject(new Error('Invalid id')); // failure
    }
  });
}

fetchUser(1)
  .then(user => console.log(user.name)) // 'Alice'
  .catch(err => console.error(err.message));`,
    },
    { type: 'heading', content: 'async / await' },
    {
      type: 'text',
      content:
        'async/await is syntactic sugar over Promises. It makes async code look synchronous and is much easier to read.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `async function loadUser(id) {
  try {
    const user = await fetchUser(id);
    console.log(user.name); // 'Alice'
    return user;
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

loadUser(1);`,
    },
    { type: 'heading', content: 'Running Promises in Parallel' },
    {
      type: 'code',
      language: 'javascript',
      content: `// Promise.all — runs all in parallel, waits for ALL
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
]);

// Promise.allSettled — waits for all, even if some fail
const results = await Promise.allSettled([
  fetchUser(1),
  fetchUser(-1), // will reject
]);
results.forEach(r => console.log(r.status)); // 'fulfilled' / 'rejected'`,
    },
  ],
};
