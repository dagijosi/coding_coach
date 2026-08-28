import { getDatabase } from '@/database';
import type {
  Hint,
  Problem,
} from '@/types/learning';

type ProblemRow = {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  order: number;
  prompt: string | null;
  choices: string | null;
  answer: number | null;
  explanation: string;
};

type HintRow = {
  id: string;
  content: string;
  order: number;
};

async function loadHints(
  problemId: string
): Promise<Hint[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<HintRow>(
    `
      SELECT id, content, "order"
      FROM hints
      WHERE owner_type = 'problem'
        AND owner_id = ?
      ORDER BY "order" ASC
    `,
    problemId
  );

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    order: row.order,
  }));
}

async function mapProblem(
  row: ProblemRow
): Promise<Problem> {
  const hints = await loadHints(row.id);

  return {
    id: row.id,
    lessonId: row.lesson_id,
    title: row.title,
    description: row.description,
    type: row.type as Problem['type'],
    difficulty: row.difficulty as Problem['difficulty'],
    order: row.order,
    prompt: row.prompt ?? undefined,
    choices: row.choices ? JSON.parse(row.choices) : undefined,
    answer: row.answer ?? undefined,
    hints,
    explanation: row.explanation,
  };
}

export async function getProblems(): Promise<Problem[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<ProblemRow>(
    `
      SELECT *
      FROM problems
      ORDER BY "order" ASC
    `
  );

  return Promise.all(rows.map(mapProblem));
}

export async function getProblemsByLesson(
  lessonId: string
): Promise<Problem[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<ProblemRow>(
    `
      SELECT *
      FROM problems
      WHERE lesson_id = ?
      ORDER BY "order" ASC
    `,
    lessonId
  );

  return Promise.all(rows.map(mapProblem));
}

export async function getProblemById(
  id: string
): Promise<Problem | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<ProblemRow>(
    `
      SELECT *
      FROM problems
      WHERE id = ?
    `,
    id
  );

  return row ? mapProblem(row) : null;
}
