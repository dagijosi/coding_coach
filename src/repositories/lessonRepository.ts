import { getDatabase } from '@/database';
import type { Lesson } from '@/types/learning';

type LessonRow = {
  id: string;
  topic_id: string;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  estimated_minutes: number;
  order: number;
  prerequisites: string;
  content: string;
};

function mapLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    topicId: row.topic_id,
    title: row.title,
    description: row.description,
    language: row.language,
    difficulty: row.difficulty as Lesson['difficulty'],
    estimatedMinutes: row.estimated_minutes,
    order: row.order,
    prerequisites: JSON.parse(row.prerequisites),
    content: JSON.parse(row.content),
  };
}

export async function getLessons(): Promise<Lesson[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<LessonRow>(
    `
      SELECT *
      FROM lessons
      ORDER BY "order" ASC
    `
  );

  return rows.map(mapLesson);
}

export async function getLessonsByTopic(
  topicId: string
): Promise<Lesson[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<LessonRow>(
    `
      SELECT *
      FROM lessons
      WHERE topic_id = ?
      ORDER BY "order" ASC
    `,
    topicId
  );

  return rows.map(mapLesson);
}

export async function getLessonById(
  id: string
): Promise<Lesson | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<LessonRow>(
    `
      SELECT *
      FROM lessons
      WHERE id = ?
    `,
    id
  );

  return row ? mapLesson(row) : null;
}
