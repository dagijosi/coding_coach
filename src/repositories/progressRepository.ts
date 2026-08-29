import { getDatabase } from '@/database';
import { pickDailyItem } from '@/utils/dailyChallenge';
import type {
  LessonProgress,
  LessonStatus,
} from '@/types/learning';
import type {
  LessonProgressSummary,
  ProgressSummary,
  ProgressionSummary,
  RecentActivityItem,
  TopicProgress,
  TopicStrengths,
  UserProgress,
} from '@/types/progress';
import type {
  ConceptMastery,
  MasteryEvidence,
  OverallMastery,
  TopicMastery,
} from '@/learning/mastery/masteryTypes';
import {
  buildConceptMastery,
  buildTopicMastery,
  computeOverallMastery,
  sortStrongest,
  sortWeakest,
} from '@/learning/mastery/mastery';
import {
  getLevelFromXP,
  getLevelProgress,
  getXPToNextLevel,
} from '@/learning/progression/level';
import {
  computeStreaks,
  dateKey,
} from '@/learning/progression/streak';
import {
  LEARNING_XP,
  XP_RULES,
} from '@/learning/progression/xp';

export { LEARNING_XP, XP_RULES } from '@/learning/progression/xp';
export type { XPEvent, XPEventType } from '@/learning/progression/xp';
export {
  getLevelFromXP,
  getLevelProgress,
  getLevelProgress as getLevelInfo,
  getXPForLevel,
  getXPIntoLevel,
  getXPToNextLevel,
  type LevelProgress,
} from '@/learning/progression/level';
export {
  computeStreaks,
  dateKey,
  type StreakResult,
} from '@/learning/progression/streak';
export type {
  ConceptMastery,
  MasteryEvidence,
  MasteryLevel,
  OverallMastery,
  TopicMastery,
} from '@/learning/mastery/masteryTypes';
export {
  MASTERY_THRESHOLDS,
  MASTERY_WEIGHTS,
  RECENT_WINDOW_DAYS,
  STALE_WINDOW_DAYS,
  STALE_WEIGHT_FLOOR,
  attemptWeight,
  buildConceptMastery,
  buildTopicMastery,
  computeMasteryScore,
  computeOverallMastery,
  masteryLevelForScore,
  sortStrongest,
  sortWeakest,
  weightedAccuracy,
} from '@/learning/mastery/mastery';

// ---------------------------------------------------------------------------
// XP
//
// The XP economy is defined centrally in src/learning/progression/xp.ts and
// re-exported here for backward compatibility. All XP a learner earns flows
// through the award path in this module; screens never compute XP themselves.
// ---------------------------------------------------------------------------

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

  const inserted = await db.runAsync(
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

  const attemptId = inserted.lastInsertRowId;

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

  let awarded = LEARNING_XP.challengeComplete;
  await awardXp(db, awarded);
  await touchActivity(db);

  // If this is today's daily challenge, award the daily bonus on top (once per
  // day, guarded inside awardDailyChallengeXp).
  if (await isTodaysDailyChallenge(challengeId)) {
    awarded += await awardDailyChallengeXp(db, challengeId, attemptId);
  }

  return awarded;
}

/**
 * True when `challengeId` is the challenge selected for the current local day.
 * Uses the same `pickDailyItem` selection as the dashboard, kept consistent
 * with the ordered challenge list (ORDER BY "order").
 */
async function isTodaysDailyChallenge(challengeId: string): Promise<boolean> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM challenges ORDER BY "order" ASC`
  );

  if (rows.length === 0) {
    return false;
  }

  const dailyId = pickDailyItem(rows.map((r) => r.id), new Date());
  return dailyId === challengeId;
}

/**
 * Awards the daily-challenge completion XP exactly once per qualifying
 * completion. Takes the database handle to stay on the same transaction-less
 * store as the rest of the award path.
 *
 * A challenge earns the daily bonus only when it has not already been
 * completed on the current local day before this attempt (`attemptId` is
 * excluded from the count so the just-inserted row never matches). Re-passing
 * the same challenge on the same day awards nothing.
 */
async function awardDailyChallengeXp(
  db: Awaited<ReturnType<typeof getDatabase>>,
  challengeId: string,
  attemptId: number
): Promise<number> {
  const prior = await db.getFirstAsync<{ completed_today: number }>(
    `
      SELECT COUNT(*) AS completed_today
      FROM challenge_attempts
      WHERE challenge_id = ? AND passed = 1
        AND date(attempted_at, 'localtime') = date(?, 'localtime')
        AND id != ?
    `,
    challengeId,
    new Date().toISOString(),
    attemptId
  );

  if ((prior?.completed_today ?? 0) > 0) {
    return 0;
  }

  await awardXp(db, XP_RULES.daily_challenge_completed);
  await touchActivity(db);
  return XP_RULES.daily_challenge_completed;
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
// Daily challenge
// ---------------------------------------------------------------------------

export type DailyChallengeState = 'completed' | 'attempted' | 'not-started';

/**
 * Derives the learner's state for the given day's daily challenge from the
 * existing challenge attempt history (no extra tracking table required).
 *
 *  - 'completed'   a passed attempt exists on the same calendar day
 *  - 'attempted'   an attempt (any outcome) exists on the same calendar day
 *  - 'not-started' no attempt on the same calendar day
 *
 * Because it is derived from SQLite, the state survives app restarts.
 */
export async function getDailyChallengeState(
  challengeId: string,
  date: Date
): Promise<DailyChallengeState> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    last_passed_at: string | null;
    last_attempted_at: string | null;
  }>(
    `
      SELECT
        MAX(CASE WHEN passed = 1 THEN attempted_at END) AS last_passed_at,
        MAX(attempted_at) AS last_attempted_at
      FROM challenge_attempts
      WHERE challenge_id = ?
    `,
    challengeId
  );

  const todayKey = toDateKey(date);

  if (
    row?.last_passed_at &&
    toDateKey(new Date(row.last_passed_at)) === todayKey
  ) {
    return 'completed';
  }

  if (
    row?.last_attempted_at &&
    toDateKey(new Date(row.last_attempted_at)) === todayKey
  ) {
    return 'attempted';
  }

  return 'not-started';
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}



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
 * Persists the learner's current position within a lesson so they can resume
 * where they left off after leaving/reopening. Stores the current step as a
 * fraction (stepIndex + 1) / totalSteps in the existing `progress` column.
 *
 * A completed lesson is never rolled back: its `progress` stays at 1 and its
 * status stays 'completed'.
 */
export async function updateLessonStep(
  lessonId: string,
  stepIndex: number,
  totalSteps: number
) {
  const db = await getDatabase();

  const progress =
    totalSteps > 0 ? (stepIndex + 1) / totalSteps : 0;

  await db.runAsync(
    `
      INSERT INTO lesson_progress (
        lesson_id,
        status,
        started_at,
        progress
      )
      VALUES (?, 'in-progress', ?, ?)
      ON CONFLICT(lesson_id)
      DO UPDATE SET
        progress = CASE
          WHEN lesson_progress.status = 'completed'
            THEN lesson_progress.progress
          ELSE excluded.progress
        END
    `,
    lessonId,
    new Date().toISOString(),
    progress
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
// Topic & skill mastery (Phase 6 Step 3)
//
// Evidence-based mastery derived from the existing SQLite tables (lesson
// completion, problem solves, challenge passes + attempt timestamps). All
// scoring and leveling is centralized in src/learning/mastery/mastery.ts —
// screens must consume these results, never re-derive their own percentages.
// ---------------------------------------------------------------------------

type TopicEvidenceRow = {
  topic_id: string;
  topic_name: string;
  lessons_total: number;
  lessons_completed: number;
  problems_total: number;
  problems_solved: number;
  challenges_total: number;
  challenges_solved: number;
};

type TopicAttemptRow = {
  topic_id: string;
  kind: 'problem' | 'challenge';
  ok: number;
  at: string;
};

async function loadTopicEvidence(): Promise<Array<{ topicId: string; topicName: string; evidence: MasteryEvidence }>> {
  const db = await getDatabase();

  const [aggregates, attempts, completions] = await Promise.all([
    db.getAllAsync<TopicEvidenceRow>(
      `
        SELECT
          t.id AS topic_id,
          t.name AS topic_name,
          COUNT(DISTINCT l.id) AS lessons_total,
          COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN l.id END) AS lessons_completed,
          COUNT(DISTINCT p.id) AS problems_total,
          COUNT(DISTINCT CASE WHEN pa.correct = 1 THEN p.id END) AS problems_solved,
          COUNT(DISTINCT ch.id) AS challenges_total,
          COUNT(DISTINCT CASE WHEN ca.passed = 1 THEN ch.id END) AS challenges_solved
        FROM topics t
        LEFT JOIN lessons l ON l.topic_id = t.id
        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
        LEFT JOIN problems p ON p.lesson_id = l.id
        LEFT JOIN problem_attempts pa ON pa.problem_id = p.id
        LEFT JOIN challenges ch ON ch.lesson_id = l.id
        LEFT JOIN challenge_attempts ca ON ca.challenge_id = ch.id
        GROUP BY t.id, t.name
        ORDER BY t."order" ASC, t.name ASC
      `
    ),
    db.getAllAsync<TopicAttemptRow>(
      `
        SELECT t.id AS topic_id, pa.attempted_at AS at, pa.correct AS ok, 'problem' AS kind
        FROM problem_attempts pa
        JOIN problems p ON p.id = pa.problem_id
        JOIN lessons l ON l.id = p.lesson_id
        JOIN topics t ON t.id = l.topic_id
        UNION ALL
        SELECT t.id, ca.attempted_at, ca.passed, 'challenge'
        FROM challenge_attempts ca
        JOIN challenges ch ON ch.id = ca.challenge_id
        JOIN lessons l ON l.id = ch.lesson_id
        JOIN topics t ON t.id = l.topic_id
      `
    ),
    db.getAllAsync<{ topic_id: string; at: string }>(
      `
        SELECT t.id AS topic_id, lp.completed_at AS at
        FROM lesson_progress lp
        JOIN lessons l ON l.id = lp.lesson_id
        JOIN topics t ON t.id = l.topic_id
        WHERE lp.status = 'completed' AND lp.completed_at IS NOT NULL
      `
    ),
  ]);

  const attemptsByTopic = new Map<string, TopicAttemptRow[]>();
  for (const row of attempts) {
    const list = attemptsByTopic.get(row.topic_id) ?? [];
    list.push(row);
    attemptsByTopic.set(row.topic_id, list);
  }

  const completionDatesByTopic = new Map<string, string[]>();
  for (const row of completions) {
    const list = completionDatesByTopic.get(row.topic_id) ?? [];
    list.push(row.at);
    completionDatesByTopic.set(row.topic_id, list);
  }

  return aggregates.map((agg) => {
    const topicAttempts =
      attemptsByTopic.get(agg.topic_id) ?? [];

    const problemAttempts = topicAttempts
      .filter((a) => a.kind === 'problem')
      .map((a) => ({ success: a.ok === 1, attemptedAt: a.at }));
    const challengeAttempts = topicAttempts
      .filter((a) => a.kind === 'challenge')
      .map((a) => ({ success: a.ok === 1, attemptedAt: a.at }));

    const allActivity = [
      ...topicAttempts.map((a) => a.at),
      ...(completionDatesByTopic.get(agg.topic_id) ?? []),
    ];
    const lastActivityAt =
      allActivity.length === 0
        ? null
        : new Date(
            allActivity
              .map((at) => new Date(at).getTime())
              .reduce((max, t) => Math.max(max, t), 0)
          ).toISOString();

    const evidence: MasteryEvidence = {
      lessonsCompleted: agg.lessons_completed,
      lessonsTotal: agg.lessons_total,
      problemsSolved: agg.problems_solved,
      problemsTotal: agg.problems_total,
      challengesSolved: agg.challenges_solved,
      challengesTotal: agg.challenges_total,
      problemAttempts,
      challengeAttempts,
      lastActivityAt,
    };

    return {
      topicId: agg.topic_id,
      topicName: agg.topic_name,
      evidence,
    };
  });
}

/** Evidence-based mastery for every topic, in content order. */
export async function getTopicMastery(
  now = new Date()
): Promise<TopicMastery[]> {
  const rows = await loadTopicEvidence();
  return rows.map((r) => buildTopicMastery(r.topicId, r.topicName, r.evidence, now));
}

/**
 * The strongest `limit` topics by mastery score (started topics only). Scores
 * tie-break on topic name, then id — deterministic.
 */
export async function getStrongestTopics(
  limit = 3,
  now = new Date()
): Promise<TopicMastery[]> {
  const started = (await getTopicMastery(now)).filter(
    (t) => t.masteryScore > 0
  );
  return sortStrongest(started).slice(0, limit);
}

/**
 * The weakest `limit` started topics by mastery score. Ties break on topic
 * name, then id — deterministic.
 */
export async function getWeakestTopics(
  limit = 3,
  now = new Date()
): Promise<TopicMastery[]> {
  const started = (await getTopicMastery(now)).filter(
    (t) => t.masteryScore > 0
  );
  return sortWeakest(started).slice(0, limit);
}

/** Topics with no learning evidence at all (mastery 0), in content order. */
export async function getUnpracticedTopics(
  now = new Date()
): Promise<TopicMastery[]> {
  return (await getTopicMastery(now)).filter(
    (t) => t.masteryScore === 0
  );
}

/**
 * Overall mastery across topics. Averaged over started topics only so that
 * unpracticed content does not drag the figure toward zero.
 */
export async function getOverallMastery(
  now = new Date()
): Promise<OverallMastery> {
  return computeOverallMastery(await getTopicMastery(now));
}

// ---------------------------------------------------------------------------
// Concept mastery
//
// Concepts map 1:1 to lessons (concepts.lesson_id). Evidence for a concept is
// therefore the lesson's completion plus the problems/challenges of that same
// lesson. This is a real, schema-backed relationship — nothing is invented.
// ---------------------------------------------------------------------------

type ConceptRow = {
  concept_id: string;
  concept_name: string;
  lesson_id: string;
  topic_id: string;
  topic_name: string;
};

type LessonEvidenceRow = {
  lesson_id: string;
  lessons_completed: number;
  lessons_total: number;
  problems_total: number;
  problems_solved: number;
  challenges_total: number;
  challenges_solved: number;
};

type LessonAttemptRow = {
  lesson_id: string;
  kind: 'problem' | 'challenge';
  ok: number;
  at: string;
};

/** Evidence-based mastery for every concept, in course/topic/lesson order. */
export async function getConceptMastery(
  now = new Date()
): Promise<ConceptMastery[]> {
  const db = await getDatabase();

  const [concepts, lessonStats, attempts, completions] = await Promise.all([
    db.getAllAsync<ConceptRow>(
      `
        SELECT
          c.id AS concept_id,
          c.name AS concept_name,
          c.lesson_id AS lesson_id,
          t.id AS topic_id,
          t.name AS topic_name
        FROM concepts c
        JOIN lessons l ON l.id = c.lesson_id
        JOIN topics t ON t.id = l.topic_id
        ORDER BY t."order" ASC, l."order" ASC, c."order" ASC
      `
    ),
    db.getAllAsync<LessonEvidenceRow>(
      `
        SELECT
          l.id AS lesson_id,
          COUNT(DISTINCT p.id) AS problems_total,
          COUNT(DISTINCT CASE WHEN pa.correct = 1 THEN p.id END) AS problems_solved,
          COUNT(DISTINCT ch.id) AS challenges_total,
          COUNT(DISTINCT CASE WHEN ca.passed = 1 THEN ch.id END) AS challenges_solved,
          CASE WHEN lp.status = 'completed' THEN 1 ELSE 0 END AS lessons_completed,
          1 AS lessons_total
        FROM lessons l
        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
        LEFT JOIN problems p ON p.lesson_id = l.id
        LEFT JOIN problem_attempts pa ON pa.problem_id = p.id
        LEFT JOIN challenges ch ON ch.lesson_id = l.id
        LEFT JOIN challenge_attempts ca ON ca.challenge_id = ch.id
        GROUP BY l.id
      `
    ),
    db.getAllAsync<LessonAttemptRow>(
      `
        SELECT l.id AS lesson_id, pa.attempted_at AS at, pa.correct AS ok, 'problem' AS kind
        FROM problem_attempts pa
        JOIN problems p ON p.id = pa.problem_id
        JOIN lessons l ON l.id = p.lesson_id
        UNION ALL
        SELECT l.id, ca.attempted_at, ca.passed, 'challenge'
        FROM challenge_attempts ca
        JOIN challenges ch ON ch.id = ca.challenge_id
        JOIN lessons l ON l.id = ch.lesson_id
      `
    ),
    db.getAllAsync<{ lesson_id: string; at: string }>(
      `
        SELECT lp.lesson_id AS lesson_id, lp.completed_at AS at
        FROM lesson_progress lp
        WHERE lp.status = 'completed' AND lp.completed_at IS NOT NULL
      `
    ),
  ]);

  const statsByLesson = new Map<string, LessonEvidenceRow>();
  for (const row of lessonStats) {
    statsByLesson.set(row.lesson_id, row);
  }

  const attemptsByLesson = new Map<string, LessonAttemptRow[]>();
  for (const row of attempts) {
    const list = attemptsByLesson.get(row.lesson_id) ?? [];
    list.push(row);
    attemptsByLesson.set(row.lesson_id, list);
  }

  const completionDatesByLesson = new Map<string, string[]>();
  for (const row of completions) {
    const list = completionDatesByLesson.get(row.lesson_id) ?? [];
    list.push(row.at);
    completionDatesByLesson.set(row.lesson_id, list);
  }

  const mastery: ConceptMastery[] = [];

  for (const c of concepts) {
    const stats = statsByLesson.get(c.lesson_id) ?? {
      lesson_id: c.lesson_id,
      lessons_completed: 0,
      lessons_total: 1,
      problems_total: 0,
      problems_solved: 0,
      challenges_total: 0,
      challenges_solved: 0,
    };
    const lessonAttempts = attemptsByLesson.get(c.lesson_id) ?? [];

    const problemAttempts = lessonAttempts
      .filter((a) => a.kind === 'problem')
      .map((a) => ({ success: a.ok === 1, attemptedAt: a.at }));
    const challengeAttempts = lessonAttempts
      .filter((a) => a.kind === 'challenge')
      .map((a) => ({ success: a.ok === 1, attemptedAt: a.at }));

    const allActivity = [
      ...lessonAttempts.map((a) => a.at),
      ...(completionDatesByLesson.get(c.lesson_id) ?? []),
    ];
    const lastActivityAt =
      allActivity.length === 0
        ? null
        : new Date(
            allActivity
              .map((at) => new Date(at).getTime())
              .reduce((max, t) => Math.max(max, t), 0)
          ).toISOString();

    const evidence: MasteryEvidence = {
      lessonsCompleted: stats.lessons_completed,
      lessonsTotal: stats.lessons_total,
      problemsSolved: stats.problems_solved,
      problemsTotal: stats.problems_total,
      challengesSolved: stats.challenges_solved,
      challengesTotal: stats.challenges_total,
      problemAttempts,
      challengeAttempts,
      lastActivityAt,
    };

    mastery.push(
      buildConceptMastery(
        c.concept_id,
        c.concept_name,
        c.topic_id,
        c.topic_name,
        c.lesson_id,
        evidence,
        now
      )
    );
  }

  return mastery;
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

// ---------------------------------------------------------------------------
// Progress aggregation (Phase 6 Step 1)
//
// Central layer that answers the headline progress questions: how much has the
// learner completed, how many attempts were made/successful, what topics and
// lessons have been worked on, and overall success rate. Everything is derived
// deterministically from the SQLite tables, is safe on an empty database, and
// is never computed from UI state.
// ---------------------------------------------------------------------------

function failureSafeRate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : (numerator / denominator) * 100;
}

/**
 * High-level, single-number summary of the learner's progress across the whole
 * path. Includes overall success rate and XP/streak on top of the raw counts.
 */
export async function getProgressSummary(): Promise<ProgressSummary> {
  const db = await getDatabase();

  const [
    content,
    eles,
    solvedProblems,
    completedChallenges,
    attempts,
    user,
  ] = await Promise.all([
    db.getFirstAsync<{ lessons: number; problems: number; challenges: number }>(
      `
        SELECT
          (SELECT COUNT(*) FROM lessons) AS lessons,
          (SELECT COUNT(*) FROM problems) AS problems,
          (SELECT COUNT(*) FROM challenges) AS challenges
      `
    ),
    db.getFirstAsync<{
      completed: number;
      in_progress: number;
    }>(
      `
        SELECT
          COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed,
          COUNT(CASE WHEN status = 'in-progress' THEN 1 END) AS in_progress
        FROM lesson_progress
      `
    ),
    db.getFirstAsync<{ count: number }>(
      `
        SELECT COUNT(DISTINCT problem_id) AS count
        FROM problem_attempts
        WHERE correct = 1
      `
    ),
    db.getFirstAsync<{ count: number }>(
      `
        SELECT COUNT(DISTINCT challenge_id) AS count
        FROM challenge_attempts
        WHERE passed = 1
      `
    ),
    db.getFirstAsync<{ total: number; successful: number }>(
      `
        SELECT
          (SELECT COUNT(*) FROM problem_attempts)
            + (SELECT COUNT(*) FROM challenge_attempts) AS total,
          (SELECT COUNT(*) FROM problem_attempts WHERE correct = 1)
            + (SELECT COUNT(*) FROM challenge_attempts WHERE passed = 1) AS successful
      `
    ),
    db.getFirstAsync<{ xp: number; current_streak: number; longest_streak: number }>(
      `
        SELECT xp, current_streak, longest_streak
        FROM user_progress
        WHERE id = 1
      `
    ),
  ]);

  const totalAttempts = attempts?.total ?? 0;
  const successfulAttempts = attempts?.successful ?? 0;

  return {
    totalLessons: content?.lessons ?? 0,
    completedLessons: eles?.completed ?? 0,
    inProgressLessons: eles?.in_progress ?? 0,
    totalProblems: content?.problems ?? 0,
    solvedProblems: solvedProblems?.count ?? 0,
    totalChallenges: content?.challenges ?? 0,
    completedChallenges: completedChallenges?.count ?? 0,
    totalAttempts,
    successfulAttempts,
    successRate: failureSafeRate(successfulAttempts, totalAttempts),
    totalXP: user?.xp ?? 0,
    currentStreak: user?.current_streak ?? 0,
    longestStreak: user?.longest_streak ?? 0,
  };
}

/**
 * Overall success rate as a percentage. Zero when there have been no attempts.
 */
export async function getOverallSuccessRate(): Promise<number> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ total: number; successful: number }>(
    `
      SELECT
        (SELECT COUNT(*) FROM problem_attempts)
          + (SELECT COUNT(*) FROM challenge_attempts) AS total,
        (SELECT COUNT(*) FROM problem_attempts WHERE correct = 1)
          + (SELECT COUNT(*) FROM challenge_attempts WHERE passed = 1) AS successful
    `
  );

  return failureSafeRate(row?.successful ?? 0, row?.total ?? 0);
}

/**
 * Per-topic progress, ordered by topic order then name.
 *
 * Success rate is problem-attempt based, matching the existing topic mastery
 * used across the app, so strengths/weaknesses stay consistent everywhere.
 */
export async function getTopicProgress(): Promise<TopicProgress[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    topic_id: string;
    topic_name: string;
    total_lessons: number;
    completed_lessons: number;
    total_problems: number;
    solved_problems: number;
    total_attempts: number;
    successful_attempts: number;
  }>(
    `
      SELECT
        t.id AS topic_id,
        t.name AS topic_name,
        COUNT(DISTINCT l.id) AS total_lessons,
        COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN l.id END) AS completed_lessons,
        COUNT(DISTINCT p.id) AS total_problems,
        COUNT(DISTINCT CASE WHEN pa.correct = 1 THEN p.id END) AS solved_problems,
        COUNT(pa.id) AS total_attempts,
        COUNT(CASE WHEN pa.correct = 1 THEN 1 END) AS successful_attempts
      FROM topics t
      LEFT JOIN lessons l ON l.topic_id = t.id
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
      LEFT JOIN problems p ON p.lesson_id = l.id
      LEFT JOIN problem_attempts pa ON pa.problem_id = p.id
      GROUP BY t.id, t.name
      ORDER BY t."order" ASC, t.name ASC
    `
  );

  return rows.map((row) => {
    const totalAttempts = row.total_attempts;
    const successfulAttempts = row.successful_attempts;
    return {
      topicId: row.topic_id,
      topicName: row.topic_name,
      totalLessons: row.total_lessons,
      completedLessons: row.completed_lessons,
      totalProblems: row.total_problems,
      solvedProblems: row.solved_problems,
      totalAttempts,
      successfulAttempts,
      successRate: failureSafeRate(successfulAttempts, totalAttempts),
      completionPercentage: failureSafeRate(
        row.completed_lessons,
        row.total_lessons
      ),
    };
  });
}

/**
 * The weakest and strongest topics by problem-attempt success rate, considering
 * only topics that have been attempted. Both are null when nothing has been
 * attempted. Returns deterministic results (weakest = lowest success rate).
 */
export async function getTopicStrengths(): Promise<TopicStrengths> {
  const topics = (await getTopicProgress()).filter(
    (t) => t.totalAttempts > 0
  );

  if (topics.length === 0) {
    return { weakest: null, strongest: null };
  }

  const sorted = [...topics].sort(
    (a, b) => a.successRate - b.successRate
  );

  return {
    weakest: sorted[0],
    strongest: sorted[sorted.length - 1],
  };
}

/**
 * Aggregated summary for a single lesson: status, completion time, and the
 * attempt/success counts for its problems and challenges.
 */
export async function getLessonProgressSummary(
  lessonId: string
): Promise<LessonProgressSummary | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    lesson_id: string;
    title: string;
    status: string;
    completed_at: string | null;
    problems_attempted: number;
    problems_solved: number;
    challenges_attempted: number;
    challenges_solved: number;
  }>(
    `
      SELECT
        l.id AS lesson_id,
        l.title AS title,
        lp.status AS status,
        lp.completed_at AS completed_at,
        COUNT(DISTINCT pa.id) AS problems_attempted,
        COUNT(DISTINCT CASE WHEN pa.correct = 1 THEN pa.id END) AS problems_solved,
        COUNT(DISTINCT ca.id) AS challenges_attempted,
        COUNT(DISTINCT CASE WHEN ca.passed = 1 THEN ca.id END) AS challenges_solved
      FROM lessons l
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
      LEFT JOIN problems p ON p.lesson_id = l.id
      LEFT JOIN problem_attempts pa ON pa.problem_id = p.id
      LEFT JOIN challenges c ON c.lesson_id = l.id
      LEFT JOIN challenge_attempts ca ON ca.challenge_id = c.id
      WHERE l.id = ?
      GROUP BY l.id
    `,
    lessonId
  );

  if (!row) {
    return null;
  }

  const attempted = row.problems_attempted + row.challenges_attempted;
  const successful = row.problems_solved + row.challenges_solved;

  return {
    lessonId: row.lesson_id,
    lessonName: row.title,
    status: (row.status ?? 'not-started') as LessonStatus,
    completedAt: row.completed_at,
    problemsAttempted: row.problems_attempted,
    problemsSolved: row.problems_solved,
    challengesAttempted: row.challenges_attempted,
    challengesSolved: row.challenges_solved,
    successRate: failureSafeRate(successful, attempted),
  };
}

/**
 * Aggregated summaries for every lesson in the content hierarchy, in
 * course -> topic -> lesson order.
 */
export async function getLessonProgress(): Promise<LessonProgressSummary[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{ lesson_id: string }>(
    `
      SELECT l.id AS lesson_id
      FROM lessons l
      LEFT JOIN topics t ON t.id = l.topic_id
      LEFT JOIN courses c ON c.id = t.course_id
      ORDER BY c."order" ASC, t."order" ASC, l."order" ASC
    `
  );

  const summaries: LessonProgressSummary[] = [];
  for (const row of rows) {
    const summary = await getLessonProgressSummary(row.lesson_id);
    if (summary) {
      summaries.push(summary);
    }
  }

  return summaries;
}

/**
 * Recent learning activity, newest first, combining problem and challenge
 * attempts with their titles. Empty when there has been no activity.
 */
export async function getRecentActivity(
  limit = 10
): Promise<RecentActivityItem[]> {
  const db = await getDatabase();

  const problemRows = db.getAllAsync<{
    attempted_at: string;
    correct: number;
    title: string;
  }>(
    `
      SELECT pa.attempted_at, pa.correct, p.title AS title
      FROM problem_attempts pa
      JOIN problems p ON p.id = pa.problem_id
    `
  );

  const challengeRows = db.getAllAsync<{
    attempted_at: string;
    passed: number;
    title: string;
  }>(
    `
      SELECT ca.attempted_at, ca.passed, c.title AS title
      FROM challenge_attempts ca
      JOIN challenges c ON c.id = ca.challenge_id
    `
  );

  const [problems, challenges] = await Promise.all([
    problemRows,
    challengeRows,
  ]);

  const items: RecentActivityItem[] = [
    ...problems.map((row) => ({
      id: `problem-${row.attempted_at}`,
      kind: 'problem' as const,
      title: row.title,
      success: row.correct === 1,
      attemptedAt: row.attempted_at,
    })),
    ...challenges.map((row) => ({
      id: `challenge-${row.attempted_at}`,
      kind: 'challenge' as const,
      title: row.title,
      success: row.passed === 1,
      attemptedAt: row.attempted_at,
    })),
  ];

  items.sort(
    (a, b) =>
      new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
  );

  return items.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Progression (Phase 6 Step 2)
//
// Level + streak + XP surfaced from the same SQLite data, layered on top of
// the Step 1 aggregation and reusing the existing attempt/completion records.
// ---------------------------------------------------------------------------

/**
 * The distinct local calendar dates on which the learner had qualifying
 * activity (completed a lesson, solved a problem, or completed a challenge).
 * Opening the app alone does not qualify. Derived entirely from the existing
 * completion/attempt tables — no duplicate tracking.
 */
export async function getQualifyingActivityDates(): Promise<string[]> {
  const db = await getDatabase();

  const [lessons, problems, challenges] = await Promise.all([
    db.getAllAsync<{ at: string }>(
      `
        SELECT completed_at AS at
        FROM lesson_progress
        WHERE status = 'completed' AND completed_at IS NOT NULL
      `
    ),
    db.getAllAsync<{ at: string }>(
      `
        SELECT attempted_at AS at
        FROM problem_attempts
        WHERE correct = 1
      `
    ),
    db.getAllAsync<{ at: string }>(
      `
        SELECT attempted_at AS at
        FROM challenge_attempts
        WHERE passed = 1
      `
    ),
  ]);

  const keys = new Set<string>();
  for (const row of [...lessons, ...problems, ...challenges]) {
    keys.add(dateKey(new Date(row.at)));
  }

  return [...keys];
}

async function getStreaks(): Promise<ReturnType<typeof computeStreaks>> {
  const dates = await getQualifyingActivityDates();
  return computeStreaks(new Set(dates));
}

/**
 * Current consecutive-day streak derived from qualifying activity records.
 * Zero when there is no qualifying activity (or a qualifying day was missed).
 */
export async function calculateCurrentStreak(): Promise<number> {
  return (await getStreaks()).currentStreak;
}

/**
 * The longest consecutive-day streak the learner has ever achieved. Preserved
 * even when the current streak resets after a missed day.
 */
export async function calculateLongestStreak(): Promise<number> {
  return (await getStreaks()).longestStreak;
}

/** Whether the learner had qualifying activity today (local calendar day). */
export async function hasActivityToday(): Promise<boolean> {
  return (await getStreaks()).hasActivityToday;
}

/** Whether the learner had qualifying activity yesterday (local calendar day). */
export async function hasActivityYesterday(): Promise<boolean> {
  return (await getStreaks()).hasActivityYesterday;
}

/**
 * Full progression snapshot: total XP, deterministic level (with progress
 * bar data), and streaks computed from qualifying activity records.
 *
 * `ProgressionSummary` is layered on top of the stored XP/streak totals, so it
 * stays consistent with the rest of the app rather than introducing a
 * competing model.
 */
export async function getProgressionSummary(): Promise<ProgressionSummary> {
  const db = await getDatabase();

  const user = await db.getFirstAsync<{
    xp: number;
  }>(`SELECT xp FROM user_progress WHERE id = 1`);

  const totalXP = user?.xp ?? 0;
  const levelProgress = getLevelProgress(totalXP);
  const streaks = await getStreaks();

  return {
    totalXP,
    level: getLevelFromXP(totalXP),
    levelProgress,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    hasActivityToday: streaks.hasActivityToday,
    xpToNextLevel: getXPToNextLevel(totalXP),
  };
}
