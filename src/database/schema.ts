/**
 * Central, versioned definition of the local database schema.
 *
 * This is the single source of truth for the table layout. It powers the
 * fresh-install DDL (`SCHEMA_SQL`), the ordered reset list (`SCHEMA_TABLES`),
 * and the incrementing `SCHEMA_VERSION` used by the migration runner.
 *
 * Keeping the schema in one place prepares the data layer for later features
 * (personalization, chatbot history, etc.): new compatibility tables get added
 * here and shipped as versioned migrations, never as ad-hoc DDL scattered
 * across the app.
 */

/**
 * Bumped only when the schema changes. The migration runner compares this to
 * `PRAGMA user_version` and applies pending migrations to bring an install up
 * to date without destroying user progress.
 */
export const SCHEMA_VERSION = 3;

export const SCHEMA_TABLES: string[] = [
  'app_meta',
  'test_cases',
  'hints',
  'challenges',
  'problems',
  'concepts',
  'lessons',
  'topics',
  'courses',
  'lesson_progress',
  'problem_attempts',
  'challenge_attempts',
  'user_progress',
  'conversations',
  'conversation_messages',
  'github_account',
  'github_repositories',
  'github_commits',
  'github_releases',
  'github_sync_state',
];

/**
 * Fresh-install DDL.
 *
 * NOTE: this must remain forward-compatible with the earliest schema a device
 * can contain, because an untouched Phase-2 install has no schema version and
 * is treated as "schema already present" (see `migrations.ts`).
 */
export const SCHEMA_SQL = `
  -- ---------------------- app metadata ----------------------
  -- Lightweight key/value store keeping track of what has been initialised
  -- (schema, seeded content version, feature flags). Reserved as the hook for
  -- later personalization/chatbot settings without adding new tables yet.
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

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

  -- ---------------------- learner summary ----------------------
  CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TEXT
  );

  -- ---------------------- chatbot (Phase 7) ----------------------
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversation_messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      ON DELETE CASCADE
  );

  -- ---------------------- GitHub (Phase 8) ----------------------
  -- Offline-first cache of the learner's GitHub activity. OAuth credentials
  -- are NEVER stored here — only public activity, kept available offline.
  --
  -- github_account: single row (id = 1) describing the connected identity.
  CREATE TABLE IF NOT EXISTS github_account (
    id INTEGER PRIMARY KEY NOT NULL,
    login TEXT NOT NULL,
    name TEXT,
    node_id TEXT NOT NULL,
    avatar_url TEXT,
    scopes TEXT NOT NULL,
    connected_at TEXT NOT NULL,
    last_sync_at TEXT
  );

  -- github_repositories: repositories the learner chooses to track.
  CREATE TABLE IF NOT EXISTS github_repositories (
    id TEXT PRIMARY KEY NOT NULL,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL UNIQUE,
    node_id TEXT NOT NULL,
    description TEXT,
    language TEXT,
    stars INTEGER NOT NULL DEFAULT 0,
    forks INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT,
    pushed_at TEXT,
    default_branch TEXT,
    url TEXT NOT NULL,
    selected INTEGER NOT NULL DEFAULT 1,
    synced_at TEXT
  );

  -- github_commits: cached commits per tracked repository (primary key = sha,
  -- scoped by repo so identical SHAs across forks do not collide).
  CREATE TABLE IF NOT EXISTS github_commits (
    id TEXT PRIMARY KEY NOT NULL,
    repo_id TEXT NOT NULL,
    sha TEXT NOT NULL,
    message TEXT NOT NULL,
    author_name TEXT,
    author_email TEXT,
    author_date TEXT,
    url TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    FOREIGN KEY (repo_id) REFERENCES github_repositories(id)
      ON DELETE CASCADE
  );

  -- github_releases: cached releases per tracked repository.
  CREATE TABLE IF NOT EXISTS github_releases (
    id TEXT PRIMARY KEY NOT NULL,
    repo_id TEXT NOT NULL,
    tag_name TEXT NOT NULL,
    name TEXT,
    body TEXT,
    published_at TEXT,
    url TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    FOREIGN KEY (repo_id) REFERENCES github_repositories(id)
      ON DELETE CASCADE
  );

  -- github_sync_state: single row (id = 1) with sync + rate-limit bookkeeping.
  CREATE TABLE IF NOT EXISTS github_sync_state (
    id INTEGER PRIMARY KEY NOT NULL,
    last_sync_at TEXT,
    last_error_kind TEXT,
    last_error_message TEXT,
    last_error_retryable INTEGER,
    last_error_rate_limit_reset_at INTEGER,
    last_synced_count INTEGER NOT NULL DEFAULT 0,
    rate_limit_reset_at INTEGER,
    rate_limit_remaining INTEGER,
    syncing INTEGER NOT NULL DEFAULT 0
  );
`;
