import { getDatabase } from '@/database';
import type { Concept } from '@/types/learning';

type ConceptRow = {
  id: string;
  lesson_id: string;
  name: string;
  summary: string;
  order: number;
};

function mapConcept(row: ConceptRow): Concept {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    name: row.name,
    summary: row.summary,
    order: row.order,
  };
}

export async function getConceptsByLesson(
  lessonId: string
): Promise<Concept[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<ConceptRow>(
    `
      SELECT *
      FROM concepts
      WHERE lesson_id = ?
      ORDER BY "order" ASC
    `,
    lessonId
  );

  return rows.map(mapConcept);
}

export async function getConcepts(): Promise<Concept[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<ConceptRow>(
    `
      SELECT *
      FROM concepts
      ORDER BY "order" ASC
    `
  );

  return rows.map(mapConcept);
}
