import { getDatabase } from '@/database';
import { calculateSM2 } from './srsAlgorithm';
import { getLessonById } from '@/repositories/lessonRepository';

export type ReviewQueueItem = {
  id: string;
  itemId: string;
  itemType: string;
  title: string;
  language?: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt: string | null;
};

type ScheduleRow = {
  id: string;
  item_id: string;
  item_type: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  due_at: string;
  last_reviewed_at: string | null;
};

export async function getDueReviews(): Promise<ReviewQueueItem[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  try {
    const rows = await db.getAllAsync<ScheduleRow>(
      'SELECT * FROM review_schedule WHERE due_at <= ? ORDER BY due_at ASC',
      now
    );

    const items: ReviewQueueItem[] = [];

    for (const r of rows) {
      let title = r.item_id;
      let language: string | undefined;

      if (r.item_type === 'lesson') {
        const l = await getLessonById(r.item_id);
        if (l) {
          title = l.title;
          language = l.language;
        }
      }

      items.push({
        id: r.id,
        itemId: r.item_id,
        itemType: r.item_type,
        title,
        language,
        intervalDays: r.interval_days,
        easeFactor: r.ease_factor,
        repetitions: r.repetitions,
        dueAt: r.due_at,
        lastReviewedAt: r.last_reviewed_at,
      });
    }

    return items;
  } catch (e) {
    console.error('Failed to get due reviews:', e);
    return [];
  }
}

export async function scheduleInitialReview(
  itemId: string,
  itemType: 'lesson' | 'concept' = 'lesson'
): Promise<void> {
  const db = await getDatabase();
  const id = `rev_${itemId}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    await db.runAsync(
      `INSERT OR IGNORE INTO review_schedule 
       (id, item_id, item_type, interval_days, ease_factor, repetitions, due_at, last_reviewed_at) 
       VALUES (?, ?, ?, 1, 2.5, 0, ?, NULL)`,
      id,
      itemId,
      itemType,
      tomorrow.toISOString()
    );
  } catch (e) {
    console.warn('Failed to schedule review item:', e);
  }
}

export async function recordReviewResult(
  itemId: string,
  quality: number
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  try {
    const row = await db.getFirstAsync<ScheduleRow>(
      'SELECT * FROM review_schedule WHERE item_id = ?',
      itemId
    );

    if (row) {
      const sm2 = calculateSM2(
        row.repetitions,
        row.ease_factor,
        row.interval_days,
        quality
      );

      await db.runAsync(
        `UPDATE review_schedule 
         SET interval_days = ?, ease_factor = ?, repetitions = ?, due_at = ?, last_reviewed_at = ? 
         WHERE item_id = ?`,
        sm2.nextIntervalDays,
        sm2.nextEaseFactor,
        sm2.nextRepetitions,
        sm2.nextDueAt,
        now,
        itemId
      );
    }
  } catch (e) {
    console.error('Failed to record review result:', e);
  }
}
