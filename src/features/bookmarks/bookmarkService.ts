import { getDatabase } from '@/database';
import type { SavedSnippet } from './bookmarkTypes';

type SnippetRow = {
  id: string;
  title: string;
  language: string;
  code: string;
  lesson_id: string | null;
  created_at: string;
};

function mapRow(row: SnippetRow): SavedSnippet {
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    code: row.code,
    lessonId: row.lesson_id,
    createdAt: row.created_at,
  };
}

export async function getSavedSnippets(): Promise<SavedSnippet[]> {
  const db = await getDatabase();
  try {
    const rows = await db.getAllAsync<SnippetRow>(
      'SELECT id, title, language, code, lesson_id, created_at FROM saved_snippets ORDER BY created_at DESC'
    );
    return rows.map(mapRow);
  } catch (e) {
    console.error('Failed to get saved snippets:', e);
    return [];
  }
}

export async function saveSnippet(snippet: {
  title: string;
  language: string;
  code: string;
  lessonId?: string | null;
}): Promise<SavedSnippet> {
  const db = await getDatabase();
  const id = `snip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO saved_snippets (id, title, language, code, lesson_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    snippet.title,
    snippet.language,
    snippet.code,
    snippet.lessonId ?? null,
    now
  );

  return {
    id,
    title: snippet.title,
    language: snippet.language,
    code: snippet.code,
    lessonId: snippet.lessonId,
    createdAt: now,
  };
}

export async function deleteSnippet(id: string): Promise<boolean> {
  const db = await getDatabase();
  try {
    await db.runAsync('DELETE FROM saved_snippets WHERE id = ?', id);
    return true;
  } catch {
    return false;
  }
}

export async function isSnippetSaved(code: string): Promise<boolean> {
  const db = await getDatabase();
  try {
    const row = await db.getFirstAsync<SnippetRow>(
      'SELECT id FROM saved_snippets WHERE code = ?',
      code
    );
    return Boolean(row);
  } catch {
    return false;
  }
}
