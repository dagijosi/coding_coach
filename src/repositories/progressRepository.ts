import { getDatabase } from '@/database';
import type {
  LessonProgress,
  LessonStatus,
} from '@/types/learning';
import type {
  TopicMastery,
  UserProgress,
} from '@/types/progress';

// ---------------------------------------------------------------------------
// XP
//
// Single source of truth for how much XP each action is worth. All XP that a
// learner earns flows through the award path in this module; screens never
// compute XP themselves.
// ---------------------------------------------------------------------------

export const LEARNING_XP = {
  lessonComplete: 50,
  problemSolved: 10,
  challengeComplete: 25,
} as const;

// ---------------------------------------------------------------------------
// Low-level helpers (private)
// ---------------------------------------------------------------------------

async function awardXp(db: Awaited<ReturnType<typeof getDatabase>>, amount: number) {
  await db.runAsync(
    `
      UPDATE user_progress
      SET xp = xp + ?
      WHERE id = 1
    `,
    amount
  );
}

/**
 * Records a learning activity on a given date and advances the streak.
 *
 * Streak rules (local calendar day):
 *  - no prior activity            -> streak = 1
 *  - last activity was yesterday  -> streak = current + 1
 *  - last activity is today       -> streak unchanged
 *  - last activity is older       -> streak resets to 1
 */
async function touchActivity(db: Awaited<ReturnType<typeof getDatabase>>) {
  const now = new Date();
  const today = startOfDay(now).getTime();

  const row = await db.getFirstAsync<{
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
  }>(
    `
      SELECT current_streak, longest_streak, last_activity_date
      FROM user_progress
      WHERE id = 1
    `
  );

  const lastIso = row?.last_activity_date ?? null;
  let nextStreak = 1;

  if (lastIso) {
    const lastMs = startOfDay(new Date(lastIso)).getTime();
    const dayDiff = Math.round((today - lastMs) / 86400000);

    if (dayDiff === 0) {
      nextStreak = row?.current_streak ?? 1;
    } else if (dayDiff === 1) {
      nextStreak = (row?.current_streak ?? 0) + 1;
    } else {
      nextStreak = 1;
    }
  }

  const longest = Math.max(row?.longest_streak ?? 0, nextStreak);

  await db.runAsync(
    `
      UPDATE user_progress
      SET
        current_streak = ?,
        longest_streak = ?,
        last_activity_date = ?
      WHERE id = 1
    `,
    nextStreak,
    longest,
    now.toISOString()
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// ---------------------------------------------------------------------------
// User progress
// ---------------------------------------------------------------------------

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
    lastActivityDate: row?.last_activity_date ?? null,
  };
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
}): Promise<number> {
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

  // A failed attempt earns no XP.
  if (!correct) {
    return 0;
  }

  // Only the first correct solve earns problem XP.
  const prior = await db.getFirstAsync<{ count: number }>(
    `
      SELECT COUNT(*) AS count
      FROM problem_attempts
      WHERE problem_id = ? AND correct = 1
    `,
    problemId
  );

  if ((prior?.count ?? 0) > 1) {
    return 0;
  }

  await awardXp(db, LEARNING_XP.problemSolved);
  await touchActivity(db);
  return LEARNING_XP.problemSolved;
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

export async function getAttemptedProblemIds(): Promise<string[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ problem_id: string }>(
    `
      SELECT DISTINCT problem_id
      FROM problem_attempts
    `
  );

  return rows.map((row) => row.problem_id);
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
}): Promise<number> {
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

  // A failed attempt earns no XP.
  if (!passed) {
    return 0;
  }

  // Only the first successful completion earns challenge XP.
  const prior = await db.getFirstAsync<{ count: number }>(
    `
      SELECT COUNT(*) AS count
      FROM challenge_attempts
      WHERE challenge_id = ? AND passed = 1
    `,
    challengeId
  );

  if ((prior?.count ?? 0) > 1) {
    return 0;
  }

  await awardXp(db, LEARNING_XP.challengeComplete);
  await touchActivity(db);
  return LEARNING_XP.challengeComplete;
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

export async function getAttemptedChallengeIds(): Promise<string[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ challenge_id: string }>(
    `
      SELECT DISTINCT challenge_id
      FROM challenge_attempts
    `
  );

  return rows.map((row) => row.challenge_id);
}

export type RecentChallengeAttempt = {
  challengeId: string;
  title: string;
  passed: boolean;
  testsPassed: number;
  testsTotal: number;
  attemptedAt: string;
};

/**
 * Most recent challenge attempts, newest first, limited to `limit` entries.
 * Used to power the compact practice history and to determine what to resume.
 */
export async function getRecentChallengeAttempts(
  limit = 6
): Promise<RecentChallengeAttempt[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    challenge_id: string;
    title: string | null;
    passed: number;
    tests_passed: number;
    tests_total: number;
    attempted_at: string;
  }>(
    `
      SELECT
        ca.challenge_id,
        c.title AS title,
        ca.passed,
        ca.tests_passed,
        ca.tests_total,
        ca.attempted_at
      FROM challenge_attempts ca
      LEFT JOIN challenges c ON c.id = ca.challenge_id
      ORDER BY ca.attempted_at DESC
      LIMIT ?
    `,
    limit
  );

  return rows.map((row) => ({
    challengeId: row.challenge_id,
    title: row.title ?? 'Unknown challenge',
    passed: row.passed === 1,
    testsPassed: row.tests_passed,
    testsTotal: row.tests_total,
    attemptedAt: row.attempted_at,
  }));
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

/**
 * Marks a lesson as completed and awards completion XP.
 *
 * Completing an already-completed lesson again is a no-op for XP: only the
 * first completion grants the lesson XP (see LEARNING_XP).
 *
 * @returns the amount of XP awarded (0 if the lesson was already completed).
 */
export async function completeLesson(
  lessonId: string
): Promise<number> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  const existing = await db.getFirstAsync<{
    status: string;
    started_at: string | null;
  }>(
    `
      SELECT status, started_at
      FROM lesson_progress
      WHERE lesson_id = ?
    `,
    lessonId
  );

  const alreadyCompleted = existing?.status === 'completed';

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
    existing?.started_at ?? now,
    now
  );

  if (alreadyCompleted) {
    return 0;
  }

  await awardXp(db, LEARNING_XP.lessonComplete);
  await touchActivity(db);
  return LEARNING_XP.lessonComplete;
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

export async function getInProgressLessonIds(): Promise<string[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ lesson_id: string }>(
    `
      SELECT lesson_id
      FROM lesson_progress
      WHERE status = 'in-progress'
    `
  );

  return rows.map((row) => row.lesson_id);
}

/**
 * Returns the id of the lesson a learner should resume, or null when the whole
 * path is complete. Prefers the most recently started in-progress lesson;
 * otherwise returns the first not-yet-completed lesson in the hierarchy
 * (course -> topic -> lesson order).
 */
export async function getContinueLearningLessonId(): Promise<string | null> {
  const db = await getDatabase();

  const inProgress = await db.getFirstAsync<{ lesson_id: string }>(
    `
      SELECT lesson_id
      FROM lesson_progress
      WHERE status = 'in-progress'
      ORDER BY started_at DESC
      LIMIT 1
    `
  );

  if (inProgress) {
    return inProgress.lesson_id;
  }

  const next = await db.getFirstAsync<{ lesson_id: string }>(
    `
      SELECT l.id AS lesson_id
      FROM lessons l
      LEFT JOIN lesson_progress lp
        ON lp.lesson_id = l.id AND lp.status = 'completed'
      LEFT JOIN topics t ON t.id = l.topic_id
      LEFT JOIN courses c ON c.id = t.course_id
      WHERE lp.lesson_id IS NULL
      ORDER BY c."order" ASC, t."order" ASC, l."order" ASC
      LIMIT 1
    `
  );

  return next?.lesson_id ?? null;
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

// ---------------------------------------------------------------------------
// Consolidated statistics
// ---------------------------------------------------------------------------

export type LearningStats = {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  problemsSolved: number;
  problemsAttempted: number;
  challengesCompleted: number;
  challengesAttempted: number;
  accuracy: number;
};

/**
 * Single source of truth for the headline learning statistics shown across
 * screens. Keeps the numbers consistent everywhere instead of each screen
 * running its own queries.
 */
export async function getLearningStats(): Promise<LearningStats> {
  const db = await getDatabase();

  const [user, lessons, problems, challenges] = await Promise.all([
    db.getFirstAsync<{
      xp: number;
      current_streak: number;
      longest_streak: number;
    }>(
      `
        SELECT xp, current_streak, longest_streak
        FROM user_progress
        WHERE id = 1
      `
    ),
    db.getFirstAsync<{ completed: number }>(
      `
        SELECT
          COUNT(*) AS completed
        FROM lesson_progress
        WHERE status = 'completed'
      `
    ),
    db.getFirstAsync<{ solved: number; attempted: number }>(
      `
        SELECT
          COUNT(DISTINCT CASE WHEN correct = 1 THEN problem_id END) AS solved,
          COUNT(DISTINCT problem_id) AS attempted
        FROM problem_attempts
      `
    ),
    db.getFirstAsync<{ completed: number; attempted: number }>(
      `
        SELECT
          COUNT(DISTINCT CASE WHEN passed = 1 THEN challenge_id END) AS completed,
          COUNT(DISTINCT challenge_id) AS attempted
        FROM challenge_attempts
      `
    ),
  ]);

  const lessonTotalRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM lessons`
  );

  const accuracyRow = await db.getFirstAsync<{
    correct: number;
    total: number;
  }>(
    `
      SELECT
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS correct,
        COUNT(*) AS total
      FROM problem_attempts
    `
  );

  const totalAtt = accuracyRow?.total ?? 0;

  return {
    xp: user?.xp ?? 0,
    currentStreak: user?.current_streak ?? 0,
    longestStreak: user?.longest_streak ?? 0,
    lessonsCompleted: lessons?.completed ?? 0,
    lessonsTotal: lessonTotalRow?.total ?? 0,
    problemsSolved: problems?.solved ?? 0,
    problemsAttempted: problems?.attempted ?? 0,
    challengesCompleted: challenges?.completed ?? 0,
    challengesAttempted: challenges?.attempted ?? 0,
    accuracy: totalAtt === 0 ? 0 : (accuracyRow?.correct ?? 0) / totalAtt,
  };
}
