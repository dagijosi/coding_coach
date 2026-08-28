import type { SQLiteDatabase } from 'expo-sqlite';

const LEGACY_TABLES = [
  'test_cases',
  'hints',
  'challenges',
  'problems',
  'concepts',
  'lessons',
  'topics',
  'courses',
  // progress (recreated with new shape)
  'problem_attempts',
  'challenge_attempts',
  'lesson_progress',
  // fully removed
  'question_attempts',
  'topic_mastery',
];

export async function runMigrations(db: SQLiteDatabase) {
  // Phase 2 content rebuild. Phase-1 dev data is throwaway, so the
  // content + progress tables are recreated cleanly. user_progress is kept
  // so streaks/XP survive across the upgrade.
  for (const table of LEGACY_TABLES) {
    await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- ---------------------- content ----------------------
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      language TEXT NOT NULL,
      description TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY NOT NULL,
      course_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY NOT NULL,
      topic_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      language TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      prerequisites TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    );

    CREATE TABLE IF NOT EXISTS concepts (
      id TEXT PRIMARY KEY NOT NULL,
      lesson_id TEXT NOT NULL,
      name TEXT NOT NULL,
      summary TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );

    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY NOT NULL,
      lesson_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      prompt TEXT,
      choices TEXT,
      answer INTEGER,
      explanation TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY NOT NULL,
      lesson_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      function_name TEXT NOT NULL,
      starter_code TEXT NOT NULL,
      explanation TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );

    CREATE TABLE IF NOT EXISTS hints (
      id TEXT PRIMARY KEY NOT NULL,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      content TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY NOT NULL,
      challenge_id TEXT NOT NULL,
      args TEXT NOT NULL,
      expected TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id)
    );

    -- ---------------------- progress (separate) ----------------------
    CREATE TABLE IF NOT EXISTS lesson_progress (
      lesson_id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL DEFAULT 'not-started',
      started_at TEXT,
      completed_at TEXT,
      progress REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );

    CREATE TABLE IF NOT EXISTS problem_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id TEXT NOT NULL,
      answer INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      attempted_at TEXT NOT NULL,
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    );

    CREATE TABLE IF NOT EXISTS challenge_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id TEXT NOT NULL,
      tests_passed INTEGER NOT NULL,
      tests_total INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      attempted_at TEXT NOT NULL,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id)
    );

    -- ---------------------- learner summary (kept) ----------------------
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_activity_date TEXT
    );
  `);

  await db.runAsync(`
    INSERT OR IGNORE INTO user_progress (
      id,
      xp,
      current_streak,
      longest_streak
    )
    VALUES (1, 0, 0, 0)
  `);
}
