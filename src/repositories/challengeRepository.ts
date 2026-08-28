import { getDatabase } from '@/database';
import type {
  Challenge,
  Hint,
  TestCase,
} from '@/types/learning';

type ChallengeRow = {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  difficulty: string;
  order: number;
  function_name: string;
  starter_code: string;
  explanation: string;
};

type HintRow = {
  id: string;
  content: string;
  order: number;
};

type TestCaseRow = {
  id: string;
  args: string;
  expected: string;
  order: number;
};

async function loadHints(
  challengeId: string
): Promise<Hint[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<HintRow>(
    `
      SELECT id, content, "order"
      FROM hints
      WHERE owner_type = 'challenge'
        AND owner_id = ?
      ORDER BY "order" ASC
    `,
    challengeId
  );

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    order: row.order,
  }));
}

async function loadTestCases(
  challengeId: string
): Promise<TestCase[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<TestCaseRow>(
    `
      SELECT id, args, expected, "order"
      FROM test_cases
      WHERE challenge_id = ?
      ORDER BY "order" ASC
    `,
    challengeId
  );

  return rows.map((row) => ({
    id: row.id,
    args: JSON.parse(row.args),
    expected: JSON.parse(row.expected),
  }));
}

async function mapChallenge(
  row: ChallengeRow
): Promise<Challenge> {
  const [hints, testCases] = await Promise.all([
    loadHints(row.id),
    loadTestCases(row.id),
  ]);

  return {
    id: row.id,
    lessonId: row.lesson_id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty as Challenge['difficulty'],
    order: row.order,
    functionName: row.function_name,
    starterCode: row.starter_code,
    testCases,
    hints,
    explanation: row.explanation,
  };
}

export async function getChallenges(): Promise<Challenge[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<ChallengeRow>(
    `
      SELECT *
      FROM challenges
      ORDER BY "order" ASC
    `
  );

  return Promise.all(rows.map(mapChallenge));
}

export async function getChallengeById(
  id: string
): Promise<Challenge | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<ChallengeRow>(
    `
      SELECT *
      FROM challenges
      WHERE id = ?
    `,
    id
  );

  return row ? mapChallenge(row) : null;
}

export async function getChallengesByLesson(
  lessonId: string
): Promise<Challenge[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<ChallengeRow>(
    `
      SELECT *
      FROM challenges
      WHERE lesson_id = ?
      ORDER BY "order" ASC
    `,
    lessonId
  );

  return Promise.all(rows.map(mapChallenge));
}
