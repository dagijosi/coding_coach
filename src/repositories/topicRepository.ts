import { getDatabase } from '@/database';
import type { Topic } from '@/types/learning';

type TopicRow = {
  id: string;
  course_id: string;
  name: string;
  description: string;
  order: number;
};

function mapTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    description: row.description,
    order: row.order,
  };
}

export async function getTopics(): Promise<Topic[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<TopicRow>(
    `
      SELECT *
      FROM topics
      ORDER BY "order" ASC
    `
  );

  return rows.map(mapTopic);
}

export async function getTopicsByCourse(
  courseId: string
): Promise<Topic[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<TopicRow>(
    `
      SELECT *
      FROM topics
      WHERE course_id = ?
      ORDER BY "order" ASC
    `,
    courseId
  );

  return rows.map(mapTopic);
}

export async function getTopicById(topicId: string): Promise<Topic | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<TopicRow>(
    `
      SELECT *
      FROM topics
      WHERE id = ?
    `,
    topicId
  );

  return row ? mapTopic(row) : null;
}
