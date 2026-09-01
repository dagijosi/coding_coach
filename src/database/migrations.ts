import type { SQLiteDatabase } from 'expo-sqlite';

import {
  SCHEMA_SQL,
  SCHEMA_TABLES,
  SCHEMA_VERSION,
} from './schema';

// ---------------------------------------------------------------------------
// Versioned migration framework
// ---------------------------------------------------------------------------
//
// The schema version is tracked with `PRAGMA user_version`. On every app
// launch the runner:
//
//   1. reads the current user_version;
//   2. brings the database to the latest schema, running only the migrations
//      that are still pending;
//   3. stores the new version.
//
// Migrations are therefore incremental and nondestructive: user progress is
// preserved across upgrades. A fresh install creates the full schema in one
// step. An untouched pre-versioning install (Phase-2, user_version = 0) is
// detected by the presence of its content tables and simply "adopted" without
// dropping anything, so streaks/XP/attempts carry over.
//
// To add a future schema change, append a function here, bump SCHEMA_VERSION,
// and provide the matching migration in `getMigration`. The runner will apply
// it once to already-initialised installs.

type Migration = (db: SQLiteDatabase) => Promise<void>;

const MIGRATIONS: Record<number, Migration> = {
  // Future migrations keyed by the version they bring the database UP TO.
  // e.g.  3: async (db) => { await db.execAsync(`ALTER TABLE ...`); },
  2: async (db) => {
    await db.execAsync(`
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
    `);
  },
  // Phase 8 — GitHub activity cache. Adds the GitHub tables to existing
  // installs. Nondestructive: only adds new tables, never touches learning
  // data, progress or conversations. Credentials are not stored here.
  3: async (db) => {
    await db.execAsync(`
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

      INSERT OR IGNORE INTO github_sync_state (id, last_synced_count)
      VALUES (1, 0);
    `);
  },
  // Phase 9 — Achievements, Bookmarks, and Spaced-Repetition Review Queue.
  4: async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY NOT NULL,
        unlocked_at TEXT NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS saved_snippets (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        language TEXT NOT NULL,
        code TEXT NOT NULL,
        lesson_id TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS review_schedule (
        id TEXT PRIMARY KEY NOT NULL,
        item_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        interval_days INTEGER NOT NULL DEFAULT 1,
        ease_factor REAL NOT NULL DEFAULT 2.5,
        repetitions INTEGER NOT NULL DEFAULT 0,
        due_at TEXT NOT NULL,
        last_reviewed_at TEXT
      );
    `);
  },
};

async function currentVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  return row?.user_version ?? 0;
}

async function setVersion(db: SQLiteDatabase, version: number) {
  await db.execAsync(`PRAGMA user_version = ${version}`);
}

async function tableExists(
  db: SQLiteDatabase,
  name: string
): Promise<boolean> {
  const row = await db.getFirstAsync<{ count: number }>(
    `
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
    `,
    name
  );
  return (row?.count ?? 0) > 0;
}

/**
 * Ensures the lightweight metadata table exists. This is the only table that
 * pre-versioning (legacy) installs lack, so it is created idempotently during
 * adoption/upgrade rather than assumed present.
 */
async function createAppMeta(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

/**
 * Creates the full schema and baseline rows for a brand-new install.
 */
async function createSchema(db: SQLiteDatabase) {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(SCHEMA_SQL);
    await txn.runAsync(
      `
        INSERT OR IGNORE INTO user_progress (
          id, xp, current_streak, longest_streak
        )
        VALUES (1, 0, 0, 0)
      `
    );
  });
}

/**
 * Brings the database schema up to the current `SCHEMA_VERSION`.
 *
 * Safe to call on every launch: it is a no-op when already current, and it
 * never destroys user progress on already-initialised installs.
 */
export async function runMigrations(db: SQLiteDatabase) {
  const version = await currentVersion(db);

  // A versioned database still at the target is already up to date.
  if (version >= SCHEMA_VERSION) {
    return;
  }

  // Fresh install: no schema has ever been created.
  if (version === 0 && !(await tableExists(db, 'courses'))) {
    await createSchema(db);
    await setVersion(db, SCHEMA_VERSION);
    return;
  }

  // Legacy unversioned install: the Phase-2 schema is already present and
  // matches the current schema (no column changes have shipped yet), so we
  // adopt it as-is and preserve all progress. The metadata table is ensured
  // idempotently (legacy installs lack it). Future pending migrations will
  // run on top of this.
  if (version === 0) {
    await createAppMeta(db);
    await setVersion(db, SCHEMA_VERSION);
    return;
  }

  // Versioned install that is behind: apply each pending migration in order.
  for (let target = version + 1; target <= SCHEMA_VERSION; target++) {
    const migration = MIGRATIONS[target];
    if (!migration) {
      throw new Error(`No migration registered for schema version ${target}`);
    }

    await db.withExclusiveTransactionAsync(async (txn) => {
      await createAppMeta(txn);
      await migration(txn);
      await setVersion(txn, target);
    });
  }
}

/**
 * Drops every application table (used by reset). Foreign keys are disabled
 * during the operation so child/parent order does not matter, avoiding the
 * brittle hand-written DROP list of the previous implementation.
 */
export async function dropAllTables(db: SQLiteDatabase) {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('PRAGMA foreign_keys = OFF;');
    for (const table of SCHEMA_TABLES) {
      await txn.execAsync(`DROP TABLE IF EXISTS ${table};`);
    }
  });
}

/**
 * Destroys the current schema and recreates it from scratch at the latest
 * version. Used by reset/recovery, where losing progress is the explicit
 * intent. The caller is responsible for reseeding content afterwards.
 */
export async function rebuildSchema(db: SQLiteDatabase) {
  await dropAllTables(db);
  await createSchema(db);
  await setVersion(db, SCHEMA_VERSION);
}
