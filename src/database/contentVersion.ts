import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Bumped whenever the bundled learning content changes (new lessons,
 * challenges, fixes to existing content, etc.). The seeder compares this to
 * the stored `content.version` value and only rewrites content when it
 * changes, instead of re-inserting every row on every app launch.
 */
export const CONTENT_VERSION = 2;

const METADATA_KEY = 'content.version';

export async function getStoredContentVersion(
  db: SQLiteDatabase
): Promise<number | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    `
      SELECT value
      FROM app_meta
      WHERE key = ?
    `,
    METADATA_KEY
  );

  if (!row) {
    return null;
  }

  const parsed = Number(row.value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setStoredContentVersion(
  db: SQLiteDatabase,
  version: number
) {
  await db.runAsync(
    `
      INSERT INTO app_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    METADATA_KEY,
    String(version)
  );
}

/**
 * Whether the bundled content needs to be (re)seeded.
 */
export async function shouldSeedContent(
  db: SQLiteDatabase
): Promise<boolean> {
  const stored = await getStoredContentVersion(db);
  return stored !== CONTENT_VERSION;
}
