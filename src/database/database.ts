import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations, rebuildSchema } from './migrations';
import { seedDatabase } from './seed';

let database: SQLiteDatabase | null = null;
let opening: Promise<SQLiteDatabase> | null = null;

const DB_NAME = 'coding-coach.db';

/**
 * Returns the opened database, applying schema migrations on first use.
 *
 * Safe to call anywhere, any number of times, including in parallel during
 * first render: a single shared promise deduplicates the open + migrate work.
 * Reasonably fast because migrations are a no-op once the schema is current
 * and content seeding is version-guarded.
 */
export async function getDatabase(): Promise<SQLiteDatabase> {
  if (database) {
    return database;
  }

  if (!opening) {
    opening = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      // WAL must be set outside any transaction (SQLite rejects changing
      // journal_mode from within one), so it is done here at open time.
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await runMigrations(db);
      database = db;
      return db;
    })();
  }

  return opening;
}

/**
 * Full offline-first startup sequence: open + migrate, then ensure content is
 * seeded. Returns true on success.
 *
 * This is the single entry point used by app startup. Everything it does is
 * local; it never requires network access.
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await seedDatabase(db);
    return Boolean(db);
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

/**
 * Wipes and recreates the whole database (schema + content + progress).
 *
 * Explicitly destructive: all user progress, XP and streak are lost. Used for
 * a deliberate "reset progress" / clean-slate flow. Afterwards the database is
 * fully re-initialised.
 */
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();

  await rebuildSchema(db);
  await seedDatabase(db);
}

/**
 * Last-resort recovery for a corrupt/unreadable database.
 *
 * Closes the current handle, deletes the database files, reopens a fresh
 * database and re-runs the full init (schema + seed). Loses all progress, but
 * guarantees the app can still start instead of dead-ending on a broken file.
 *
 * Only call when normal initialization has failed.
 */
export async function repairDatabase(): Promise<void> {
  if (database) {
    await database.closeAsync().catch(() => {
      // Best effort; the handle may already be unusable.
    });
    database = null;
  }
  opening = null;

  try {
    await SQLite.deleteDatabaseAsync(DB_NAME).catch(() => {
      // The file may not exist; ignore.
    });
  } finally {
    // Always re-open, even if deletion threw.
  }

  await initializeDatabase();
}
