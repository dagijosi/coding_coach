import { getDatabase } from '@/database';
import type { Course } from '@/types/learning';

type CourseRow = {
  id: string;
  name: string;
  language: string;
  description: string;
  order: number;
};

function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    language: row.language,
    description: row.description,
    order: row.order,
  };
}

export async function getCourses(): Promise<Course[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<CourseRow>(
    `
      SELECT *
      FROM courses
      ORDER BY "order" ASC
    `
  );

  return rows.map(mapCourse);
}

export async function getCourseById(
  id: string
): Promise<Course | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<CourseRow>(
    `
      SELECT *
      FROM courses
      WHERE id = ?
    `,
    id
  );

  return row ? mapCourse(row) : null;
}
