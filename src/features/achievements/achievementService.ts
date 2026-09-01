import { getDatabase } from '@/database';
import {
  ACHIEVEMENTS,
  type AchievementDefinition,
} from './achievementDefinitions';
import {
  getCompletedLessonsCount,
  getCompletedChallengeIds,
  getUserProgress,
} from '@/repositories/progressRepository';
import { getLessons } from '@/repositories/lessonRepository';

type UnlockedRow = {
  id: string;
  unlocked_at: string;
  metadata: string | null;
};

export async function getUnlockedAchievements(): Promise<
  Array<{ id: string; unlockedAt: string }>
> {
  const db = await getDatabase();
  try {
    const rows = await db.getAllAsync<UnlockedRow>(
      'SELECT id, unlocked_at FROM user_achievements ORDER BY unlocked_at DESC'
    );
    return rows.map((r) => ({ id: r.id, unlockedAt: r.unlocked_at }));
  } catch {
    return [];
  }
}

export async function getAllAchievementsWithStatus(): Promise<
  Array<AchievementDefinition & { unlocked: boolean; unlockedAt?: string }>
> {
  const unlocked = await getUnlockedAchievements();
  const map = new Map(unlocked.map((u) => [u.id, u.unlockedAt]));

  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: map.has(a.id),
    unlockedAt: map.get(a.id),
  }));
}

/**
 * Evaluates current learner progress against locked achievement criteria,
 * unlocks any earned badges, and returns the newly unlocked achievements.
 */
export async function checkAndUnlockAchievements(): Promise<AchievementDefinition[]> {
  const db = await getDatabase();
  const unlocked = await getUnlockedAchievements();
  const unlockedIds = new Set(unlocked.map((u) => u.id));

  const [lessonsCompleted, challengesCompleted, userProgress, allLessons] =
    await Promise.all([
      getCompletedLessonsCount(),
      getCompletedChallengeIds(),
      getUserProgress(),
      getLessons(),
    ]);

  const streak = userProgress?.currentStreak ?? 0;
  const longestStreak = userProgress?.longestStreak ?? 0;
  const effectiveStreak = Math.max(streak, longestStreak);

  // Check language diversity for polyglot
  const completedLessonDetails = allLessons.filter((l) => l);
  const languagesCompleted = new Set(
    completedLessonDetails.map((l) => l.language?.toLowerCase()).filter(Boolean)
  );

  const newlyUnlocked: AchievementDefinition[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;

    let qualifies = false;

    switch (achievement.id) {
      case 'first_lesson':
        qualifies = lessonsCompleted >= 1;
        break;
      case 'lesson_5':
        qualifies = lessonsCompleted >= 5;
        break;
      case 'lesson_10':
        qualifies = lessonsCompleted >= 10;
        break;
      case 'first_challenge':
        qualifies = challengesCompleted.length >= 1;
        break;
      case 'challenge_5':
        qualifies = challengesCompleted.length >= 5;
        break;
      case 'streak_3':
        qualifies = effectiveStreak >= 3;
        break;
      case 'streak_7':
        qualifies = effectiveStreak >= 7;
        break;
      case 'polyglot':
        qualifies = languagesCompleted.size >= 2;
        break;
      default:
        break;
    }

    if (qualifies) {
      const now = new Date().toISOString();
      try {
        await db.runAsync(
          'INSERT OR IGNORE INTO user_achievements (id, unlocked_at) VALUES (?, ?)',
          achievement.id,
          now
        );
        newlyUnlocked.push(achievement);
      } catch (e) {
        console.warn('Failed to insert achievement unlock:', e);
      }
    }
  }

  return newlyUnlocked;
}
