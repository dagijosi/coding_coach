import type { Lesson } from '@/types/learning';

// ── Lesson 3: Data Types ──────────────────────────────────────────────────────
export const dataTypesLesson: Lesson = {
  id: 'lesson-data-types',
  topicId: 'topic-fundamentals',
  title: 'Data Types',
  description: 'Explore the seven primitive types and objects in JavaScript.',
  language: 'javascript',
  difficulty: 'beginner',
  estimatedMinutes: 18,
  order: 3,
  prerequisites: ['lesson-variables'],
  content: [
    { type: 'heading', content: 'JavaScript Data Types' },
    {
      type: 'text',
      content:
        'Every value in JavaScript has a type. Knowing the types helps you avoid bugs and write clearer code. There are 7 primitive types and one complex type: object.',
    },
    { type: 'heading', content: 'Primitives' },
    {
      type: 'code',
      language: 'javascript',
      content: `let name = 'Alice';          // string
let age  = 30;               // number
let pi   = 3.14;             // number (floats too)
let isActive = true;         // boolean
let nothing = null;          // null (intentional empty)
let notDefined;              // undefined
let id = Symbol('uid');      // symbol (unique key)`,
    },
    { type: 'heading', content: 'typeof operator' },
    {
      type: 'text',
      content:
        'Use typeof to inspect a value\'s type at runtime. It always returns a string.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `console.log(typeof 42);        // "number"
console.log(typeof 'hi');      // "string"
console.log(typeof true);      // "boolean"
console.log(typeof undefined); // "undefined"
console.log(typeof null);      // "object"  ← historical quirk!
console.log(typeof {});        // "object"
console.log(typeof []);        // "object"  ← arrays are objects`,
    },
    { type: 'heading', content: 'Type Coercion' },
    {
      type: 'text',
      content:
        'JavaScript automatically converts types in some situations. This is called coercion. Always use === (strict equality) to avoid unexpected results.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `console.log(1 + '2');    // "12"  (number coerced to string)
console.log(1 == '1');   // true  (loose equality coerces)
console.log(1 === '1');  // false (strict equality, no coercion)`,
    },
  ],
};

// ── Lesson 4: Control Flow ────────────────────────────────────────────────────
export const controlFlowLesson: Lesson = {
  id: 'lesson-control-flow',
  topicId: 'topic-fundamentals',
  title: 'Control Flow',
  description: 'Make decisions and repeat actions with if/else, switch, and loops.',
  language: 'javascript',
  difficulty: 'beginner',
  estimatedMinutes: 20,
  order: 4,
  prerequisites: ['lesson-variables', 'lesson-data-types'],
  content: [
    { type: 'heading', content: 'Making Decisions with if / else' },
    {
      type: 'text',
      content:
        'Control flow lets your program choose different paths based on conditions. The most common tool is if / else.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `const score = 72;

if (score >= 90) {
  console.log('A');
} else if (score >= 80) {
  console.log('B');
} else if (score >= 70) {
  console.log('C');
} else {
  console.log('F');
}`,
    },
    { type: 'heading', content: 'Loops: for and while' },
    {
      type: 'text',
      content:
        'Loops repeat a block of code. A for loop is used when you know how many times to repeat. A while loop runs as long as a condition is true.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `// for loop — counts 0 to 4
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// while loop — stops when done is true
let done = false;
let count = 0;
while (!done) {
  count++;
  if (count === 3) done = true;
}`,
    },
    { type: 'heading', content: 'switch statement' },
    {
      type: 'code',
      language: 'javascript',
      content: `const day = 'Monday';

switch (day) {
  case 'Monday':
    console.log('Start of the work week!');
    break;
  case 'Friday':
    console.log('Almost weekend!');
    break;
  default:
    console.log('Midweek');
}`,
    },
  ],
};

// ── Lesson 5: Scope & Closures ────────────────────────────────────────────────
export const scopeLesson: Lesson = {
  id: 'lesson-scope',
  topicId: 'topic-fundamentals',
  title: 'Scope & Closures',
  description: 'Understand where variables live and how closures capture their environment.',
  language: 'javascript',
  difficulty: 'beginner',
  estimatedMinutes: 22,
  order: 5,
  prerequisites: ['lesson-functions'],
  content: [
    { type: 'heading', content: 'What is Scope?' },
    {
      type: 'text',
      content:
        'Scope is the region of code where a variable is accessible. JavaScript has three kinds: global, function, and block scope.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `const globalVar = 'I am everywhere';

function example() {
  const fnVar = 'I am inside the function';
  if (true) {
    let blockVar = 'I am only in this block';
    console.log(blockVar);   // ✓
  }
  // console.log(blockVar); // ✗ ReferenceError
}`,
    },
    { type: 'heading', content: 'Closures' },
    {
      type: 'text',
      content:
        'A closure is a function that "remembers" the variables from the scope it was created in, even after that scope has finished executing.',
    },
    {
      type: 'code',
      language: 'javascript',
      content: `function makeCounter() {
  let count = 0;           // captured by the closure
  return function() {
    count++;
    return count;
  };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3`,
    },
    { type: 'heading', content: 'Why Closures Matter' },
    {
      type: 'text',
      content:
        'Closures are used everywhere: event handlers, callbacks, factories, and module patterns all rely on closures to keep state private and scoped.',
    },
  ],
};
