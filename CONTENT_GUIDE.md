# 📚 Guide: How to Add & Edit Lessons, Practice Problems & Challenges

This guide explains how to add new learning content to **Coding Coach** without needing to touch complex SQL, migrations, or UI code.

---

## 📁 Where Content Lives

All learning content is organized modularly under `src/data/content/javascript/`:

| Content Type | Location | Purpose |
|---|---|---|
| **Lessons** | `src/data/content/javascript/lessons/` | Course lessons & theory text |
| **Concepts** | `src/data/content/javascript/concepts/` | Key takeaways for each lesson |
| **Problems (MCQ & Output)** | `src/data/content/javascript/problems/` | Multiple-choice & debugging questions |
| **Challenges (Interactive Code)** | `src/data/content/javascript/challenges/` | Code problems executed in the sandbox |
| **Topics & Courses** | `src/data/content/javascript/topics/` | Curriculum grouping |

---

## 1. Adding a Multiple-Choice / Output Problem

Add a new problem object into `src/data/content/javascript/problems/<topic>/index.ts`:

```typescript
{
  id: 'problem-arrays-push',
  lessonId: 'lesson-arrays',
  title: 'What does .push() return?',
  description: 'Predict the return value of array.push().',
  type: 'predict-output', // or 'multiple-choice' | 'debugging'
  difficulty: 'easy',     // 'beginner' | 'easy' | 'medium' | 'hard'
  order: 1,
  prompt: 'const arr = [1, 2];\nconst res = arr.push(3);\nconsole.log(res);',
  choices: ['[1, 2, 3]', '3', 'undefined', 'true'],
  answer: 1, // Index in choices array (0-indexed, so 1 = '3')
  hints: [
    {
      id: 'hint-push-1',
      content: '.push() modifies the array in place, but returns a number.',
      order: 1,
    },
    {
      id: 'hint-push-2',
      content: 'It returns the new length of the array.',
      order: 2,
    },
  ],
  explanation: 'array.push() adds an element to the end and returns the new length of the array (3).',
}
```

---

## 2. Adding an Interactive Code Challenge

Add a new challenge into `src/data/content/javascript/challenges/<topic>/index.ts`:

```typescript
{
  id: 'challenge-double-number',
  lessonId: 'lesson-functions',
  title: 'Double a number',
  description: 'Write a function that accepts a number and returns its double.',
  difficulty: 'easy',
  order: 1,
  functionName: 'double',
  starterCode: `function double(num) {
  // Return num multiplied by 2
}`,
  testCases: [
    { id: 'test-1', args: [2], expected: 4 },
    { id: 'test-2', args: [0], expected: 0 },
    { id: 'test-3', args: [-5], expected: -10 },
  ],
  hints: [
    {
      id: 'hint-double-1',
      content: 'Use the multiplication operator (*).',
      order: 1,
    },
  ],
  explanation: 'Multiply the input parameter num by 2 using `num * 2` and return the result.',
}
```

---

## 3. Applying Your Content to the App (Important!)

When you add or edit content:

1. Open `src/database/contentVersion.ts`.
2. Increment `CONTENT_VERSION` (e.g. from `1` to `2`):
   ```typescript
   export const CONTENT_VERSION = 2;
   ```
3. Whenever the app launches, it will detect that `CONTENT_VERSION` increased and automatically update SQLite with all new lessons, problems, and challenges — **without deleting the user's XP, streaks, or completion history**.

---

## 4. Automatic Validation

Before committing, you can check that your IDs and test cases are valid:

```bash
npm run typecheck
npm test
```
