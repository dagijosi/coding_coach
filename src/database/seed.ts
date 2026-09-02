import {
  CONTENT_VERSION,
  setStoredContentVersion,
  shouldSeedContent,
} from './contentVersion';
import { jsLearningContent } from '@/data/content/javascript';
import { pythonLearningContent } from '@/data/content/python';
import { typescriptLearningContent } from '@/data/content/typescript';
import { frontendLearningContent } from '@/data/content/frontend';
import { architectureLearningContent } from '@/data/content/architecture';
import { aiEngineeringLearningContent } from '@/data/content/ai-engineering';
import type { SQLiteDatabase } from 'expo-sqlite';

// Merge all language courses into one content bundle
const allContent = {
  courses:    [...jsLearningContent.courses,    ...pythonLearningContent.courses,    ...typescriptLearningContent.courses,    ...frontendLearningContent.courses,    ...architectureLearningContent.courses,    ...aiEngineeringLearningContent.courses],
  topics:     [...jsLearningContent.topics,     ...pythonLearningContent.topics,     ...typescriptLearningContent.topics,     ...frontendLearningContent.topics,     ...architectureLearningContent.topics,     ...aiEngineeringLearningContent.topics],
  lessons:    [...jsLearningContent.lessons,    ...pythonLearningContent.lessons,    ...typescriptLearningContent.lessons,    ...frontendLearningContent.lessons,    ...architectureLearningContent.lessons,    ...aiEngineeringLearningContent.lessons],
  concepts:   [...jsLearningContent.concepts,   ...pythonLearningContent.concepts,   ...typescriptLearningContent.concepts,   ...frontendLearningContent.concepts,   ...architectureLearningContent.concepts,   ...aiEngineeringLearningContent.concepts],
  problems:   [...jsLearningContent.problems,   ...pythonLearningContent.problems,   ...typescriptLearningContent.problems,   ...frontendLearningContent.problems,   ...architectureLearningContent.problems,   ...aiEngineeringLearningContent.problems],
  challenges: [...jsLearningContent.challenges, ...pythonLearningContent.challenges, ...typescriptLearningContent.challenges, ...frontendLearningContent.challenges, ...architectureLearningContent.challenges, ...aiEngineeringLearningContent.challenges],
};


/**
 * Writes the bundled learning content into the database.
 *
 * Runs inside a single transaction so content either updates completely or not
 * at all. Content is only written when its version changed (see
 * `shouldSeedContent`), so an already-seeded install skips this on launch.
 */
async function insertContent(db: SQLiteDatabase) {
  const content = allContent;

  await db.withExclusiveTransactionAsync(async (txn) => {
    // ----- courses -----
    for (const course of content.courses) {
      await txn.runAsync(
        `
          INSERT OR REPLACE INTO courses (
            id, name, language, description, "order"
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        course.id,
        course.name,
        course.language,
        course.description,
        course.order
      );
    }

    // ----- topics -----
    for (const topic of content.topics) {
      await txn.runAsync(
        `
          INSERT OR REPLACE INTO topics (
            id, course_id, name, description, "order"
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        topic.id,
        topic.courseId,
        topic.name,
        topic.description,
        topic.order
      );
    }

    // ----- lessons -----
    for (const lesson of content.lessons) {
      await txn.runAsync(
        `
          INSERT OR REPLACE INTO lessons (
            id, topic_id, title, description, language,
            difficulty, estimated_minutes, "order",
            prerequisites, content
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        lesson.id,
        lesson.topicId,
        lesson.title,
        lesson.description,
        lesson.language,
        lesson.difficulty,
        lesson.estimatedMinutes,
        lesson.order,
        JSON.stringify(lesson.prerequisites),
        JSON.stringify(lesson.content)
      );
    }

    // ----- concepts -----
    for (const concept of content.concepts) {
      await txn.runAsync(
        `
          INSERT OR REPLACE INTO concepts (
            id, lesson_id, name, summary, "order"
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        concept.id,
        concept.lessonId,
        concept.name,
        concept.summary,
        concept.order
      );
    }

    // ----- problems (+ hints) -----
    for (const problem of content.problems) {
      await txn.runAsync(
        `
          INSERT OR REPLACE INTO problems (
            id, lesson_id, title, description, type,
            difficulty, "order", prompt, choices, answer,
            explanation
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        problem.id,
        problem.lessonId,
        problem.title,
        problem.description,
        problem.type,
        problem.difficulty,
        problem.order,
        problem.prompt ?? null,
        problem.choices ? JSON.stringify(problem.choices) : null,
        problem.answer ?? null,
        problem.explanation
      );

      for (const hint of problem.hints) {
        await txn.runAsync(
          `
            INSERT OR REPLACE INTO hints (
              id, owner_type, owner_id, content, "order"
            )
            VALUES (?, 'problem', ?, ?, ?)
          `,
          hint.id,
          problem.id,
          hint.content,
          hint.order
        );
      }
    }

    // ----- challenges (+ hints + test cases) -----
    for (const challenge of content.challenges) {
      await txn.runAsync(
        `
          INSERT OR REPLACE INTO challenges (
            id, lesson_id, title, description, difficulty,
            "order", function_name, starter_code, explanation
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        challenge.id,
        challenge.lessonId,
        challenge.title,
        challenge.description,
        challenge.difficulty,
        challenge.order,
        challenge.functionName,
        challenge.starterCode,
        challenge.explanation
      );

      for (const hint of challenge.hints) {
        await txn.runAsync(
          `
            INSERT OR REPLACE INTO hints (
              id, owner_type, owner_id, content, "order"
            )
            VALUES (?, 'challenge', ?, ?, ?)
          `,
          hint.id,
          challenge.id,
          hint.content,
          hint.order
        );
      }

      for (const testCase of challenge.testCases) {
        await txn.runAsync(
          `
            INSERT OR REPLACE INTO test_cases (
              id, challenge_id, args, expected, "order"
            )
            VALUES (?, ?, ?, ?, ?)
          `,
          testCase.id,
          challenge.id,
          JSON.stringify(testCase.args),
          JSON.stringify(testCase.expected),
          challenge.testCases.indexOf(testCase)
        );
      }
    }
  });
}

/**
 * Ensures the bundled content is present and up to date.
 *
 * This is the only content entry point called during startup. It is a fast
 * no-op when content is already current.
 */
export async function seedDatabase(db: SQLiteDatabase) {
  if (!(await shouldSeedContent(db))) {
    return;
  }

  await insertContent(db);
  await setStoredContentVersion(db, CONTENT_VERSION);
}
