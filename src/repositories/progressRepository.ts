import { getDatabase } from '@/database';
import type {
  LessonProgress,
  LessonStatus,
} from '@/types/learning';
import type {
  TopicMastery,
  UserProgress,
} from '@/types/progress';

export async function getUserProgress(): Promise<UserProgress> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    xp: number;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
  }>(
    `
      SELECT
        xp,
        current_streak,
        longest_streak,
        last_activity_date
      FROM user_progress
      WHERE id = 1
    `
  );

  return {
    xp: row?.xp ?? 0,
    currentStreak: row?.current_streak ?? 0,
    longestStreak: row?.longest_streak ?? 0,
    lastActivityDate:
      row?.last_activity_date ?? null,
  };
}

export async function addXP(amount: number) {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE user_progress
      SET xp = xp + ?
      WHERE id = 1
    `,
    amount
  );
}

// ---------------------------------------------------------------------------
// Problems
// ---------------------------------------------------------------------------

export async function recordProblemAttempt({
  problemId,
  answer,
  correct,
}: {
  problemId: string;
  answer: number;
  correct: boolean;
}) {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO problem_attempts (
        problem_id,
        answer,
        correct,
        attempted_at
      )
      VALUES (?, ?, ?, ?)
    `,
    problemId,
    answer,
    correct ? 1 : 0,
    new Date().toISOString()
  );

  if (correct) {
    await addXP(10);
    return 10;
  }

  return 0;
}

export type ProblemsStats = {
  solved: number;
  attempted: number;
};

export async function getProblemsStats(): Promise<ProblemsStats> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ solved: number; attempted: number }>(
    `
      SELECT
        COUNT(DISTINCT CASE WHEN correct = 1 THEN problem_id END) AS solved,
        COUNT(DISTINCT problem_id) AS attempted
      FROM problem_attempts
    `
  );

  return {
    solved: row?.solved ?? 0,
    attempted: row?.attempted ?? 0,
  };
}

export async function getSolvedProblemIds(): Promise<string[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ problem_id: string }>(
    `
      SELECT DISTINCT problem_id
      FROM problem_attempts
      WHERE correct = 1
    `
  );

  return rows.map((row) => row.problem_id);
}

export async function getCompletedChallengeIds(): Promise<string[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ challenge_id: string }>(
    `
      SELECT DISTINCT challenge_id
      FROM challenge_attempts
      WHERE passed = 1
    `
  );

  return rows.map((row) => row.challenge_id);
}

export async function getAccuracy(): Promise<number> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ correct: number; total: number }>(
    `
      SELECT
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS correct,
        COUNT(*) AS total
      FROM problem_attempts
    `
  );

  const total = row?.total ?? 0;
  if (total === 0) {
    return 0;
  }

  return (row?.correct ?? 0) / total;
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export async function recordChallengeAttempt({
  challengeId,
  testsPassed,
  testsTotal,
  passed,
}: {
  challengeId: string;
  testsPassed: number;
  testsTotal: number;
  passed: boolean;
}) {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO challenge_attempts (
        challenge_id,
        tests_passed,
        tests_total,
        passed,
        attempted_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    challengeId,
    testsPassed,
    testsTotal,
    passed ? 1 : 0,
    new Date().toISOString()
  );

  if (passed) {
    await addXP(25);
    return 25;
  }

  return 0;
}

export async function getChallengesCompleted(): Promise<number> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ count: number }>(
    `
      SELECT COUNT(DISTINCT challenge_id) AS count
      FROM challenge_attempts
      WHERE passed = 1
    `
  );

  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export async function startLesson(
  lessonId: string
) {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT OR IGNORE INTO lesson_progress (
        lesson_id,
        status,
        started_at,
        progress
      )
      VALUES (?, 'in-progress', ?, 0.1)
    `,
    lessonId,
    new Date().toISOString()
  );
}

export async function completeLesson(
  lessonId: string
): Promise<number> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.runAsync(
    `
      INSERT INTO lesson_progress (
        lesson_id,
        status,
        started_at,
        completed_at,
        progress
      )
      VALUES (?, 'completed', ?, ?, 1)

      ON CONFLICT(lesson_id)
      DO UPDATE SET
        status = 'completed',
        completed_at = excluded.completed_at,
        progress = 1
    `,
    lessonId,
    now,
    now
  );

  await addXP(50);

  return 50;
}

export async function getLessonProgressById(
  lessonId: string
): Promise<LessonProgress> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    lesson_id: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    progress: number;
  }>(
    `
      SELECT *
      FROM lesson_progress
      WHERE lesson_id = ?
    `,
    lessonId
  );

  if (!row) {
    return {
      lessonId,
      status: 'not-started',
      startedAt: null,
      completedAt: null,
      progress: 0,
    };
  }

  return {
    lessonId: row.lesson_id,
    status: row.status as LessonStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    progress: row.progress,
  };
}

export async function getCompletedLessonsCount(): Promise<number> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ count: number }>(
    `
      SELECT COUNT(*) AS count
      FROM lesson_progress
      WHERE status = 'completed'
    `
  );

  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export async function getTopicPerformance(): Promise<TopicMastery[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    topic: string;
    attempts: number;
    correct_attempts: number;
    mastery: number;
  }>(
    `
      SELECT
        t.name AS topic,
        COUNT(pa.id) AS attempts,
        SUM(pa.correct) AS correct_attempts,
        CAST(SUM(pa.correct) AS REAL) / COUNT(pa.id) AS mastery
      FROM problem_attempts pa
      JOIN problems p ON p.id = pa.problem_id
      JOIN lessons l ON l.id = p.lesson_id
      JOIN topics t ON t.id = l.topic_id
      GROUP BY t.id
    `
  );

  return rows.map((row) => ({
    topic: row.topic,
    attempts: row.attempts,
    correctAttempts: row.correct_attempts,
    mastery: row.mastery,
  }));
}
