import { getDatabase } from './database';
import { jsLearningContent } from '@/data/content/javascript';

export async function seedDatabase() {
  const db = await getDatabase();

  const content = jsLearningContent;

  // ----- courses -----
  for (const course of content.courses) {
    await db.runAsync(
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
    await db.runAsync(
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
    await db.runAsync(
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
    await db.runAsync(
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
    await db.runAsync(
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
      await db.runAsync(
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
    await db.runAsync(
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
      await db.runAsync(
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
      await db.runAsync(
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
}
