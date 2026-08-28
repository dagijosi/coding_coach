import type { Problem } from '@/types/learning';

export const variablesProblems: Problem[] = [
  {
    id: 'problem-variables-print',
    lessonId: 'lesson-variables',
    title: 'Which value is printed?',
    description:
      'Predict what the following code will print to the console.',
    type: 'predict-output',
    difficulty: 'beginner',
    order: 1,
    prompt:
      "const name = 'Dagi';\nconsole.log(name);",
    choices: ['Hello', 'Dagi', 'undefined'],
    answer: 1,
    hints: [
      {
        id: 'hint-print-1',
        content:
          'Look at the value assigned to the name variable.',
        order: 1,
      },
      {
        id: 'hint-print-2',
        content:
          'console.log outputs the value that name holds.',
        order: 2,
      },
    ],
    explanation:
      'The variable name holds the string Dagi, so console.log(name) prints Dagi.',
  },
  {
    id: 'problem-variables-bug',
    lessonId: 'lesson-variables',
    title: 'Find the bug',
    description:
      'This code tries to create a constant that cannot be reassigned, but it has a problem. Which statement is true?',
    type: 'debugging',
    difficulty: 'beginner',
    order: 2,
    prompt:
      "const name = 'Dagi';\nname = 'Ada';",
    choices: [
      'This is fine and works.',
      "name cannot be reassigned because it is declared with const.",
      'You must use the variable keyword instead.',
    ],
    answer: 1,
    hints: [
      {
        id: 'hint-bug-1',
        content:
          'Remember what const guarantees about a binding.',
        order: 1,
      },
      {
        id: 'hint-bug-2',
        content:
          'Reassigning a const binding throws an error at runtime.',
        order: 2,
      },
    ],
    explanation:
      'const creates a binding that cannot be reassigned. Trying to assign a new value to name throws a TypeError.',
  },
];
