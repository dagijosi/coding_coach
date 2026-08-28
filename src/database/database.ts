import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (database) {
    return database;
  }

  database = await SQLite.openDatabaseAsync(
    'coding-coach.db'
  );

  await runMigrations(database);

  return database;
}

export async function resetDatabase() {
  if (database) {
    await database.closeAsync();
    database = null;
  }

  const freshDatabase =
    await SQLite.openDatabaseAsync(
      'coding-coach.db'
    );

  await freshDatabase.execAsync(`
    DROP TABLE IF EXISTS challenge_attempts;
    DROP TABLE IF EXISTS problem_attempts;
    DROP TABLE IF EXISTS lesson_progress;
    DROP TABLE IF EXISTS user_progress;
    DROP TABLE IF EXISTS test_cases;
    DROP TABLE IF EXISTS hints;
    DROP TABLE IF EXISTS challenges;
    DROP TABLE IF EXISTS problems;
    DROP TABLE IF EXISTS concepts;
    DROP TABLE IF EXISTS lessons;
    DROP TABLE IF EXISTS topics;
    DROP TABLE IF EXISTS courses;
  `);

  database = freshDatabase;

  await runMigrations(database);
}
