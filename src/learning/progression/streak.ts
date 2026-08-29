// ---------------------------------------------------------------------------
// Streak system — pure, deterministic, timezone-safe.
//
// A streak counts consecutive local calendar days on which the learner had
// qualifying activity (completing a lesson, solving a problem, or completing
// a challenge). Opening the app alone does NOT count.
//
// The helpers here operate on the set of local date keys ('YYYY-MM-DD') for
// qualifying activity, so they are trivially testable and free of UI/React
// dependencies. Calendar math uses local time, not raw timestamps.
//
// Current streak semantics:
//   - activity today               -> run ending today
//   - no activity today, but yes   -> the run is still alive (today isn't
//     activity yesterday              over yet), count the run ending yesterday
//   - otherwise                    -> 0 (a qualifying day was missed)
// ---------------------------------------------------------------------------

/** Local calendar key for a date, e.g. `2024-01-05`. Ignores the time of day. */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The date key that falls `offsetDays` days before `todayKey`. */
export function previousDayKey(todayKey: string): string {
  const dt = dateFromKey(todayKey);
  dt.setDate(dt.getDate() - 1);
  return dateKey(dt);
}

function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  hasActivityToday: boolean;
  hasActivityYesterday: boolean;
};

/**
 * Computes current/longest streaks and today/yesterday activity from a set of
 * qualifying-activity local date keys. `todayKey` defaults to today's local
 * date and can be overridden for testing.
 */
export function computeStreaks(
  activityDateKeys: ReadonlySet<string>,
  todayKey = dateKey(new Date())
): StreakResult {
  const set = new Set(activityDateKeys);

  const hasActivityToday = set.has(todayKey);
  const hasActivityYesterday = set.has(previousDayKey(todayKey));

  // Longest run of consecutive qualifying days anywhere in the history.
  let longestStreak = 0;
  let run = 0;
  for (const key of sortedKeys(set)) {
    run = set.has(previousDayKey(key)) ? run + 1 : 1;
    if (run > longestStreak) {
      longestStreak = run;
    }
  }

  // Current streak: the run ending at today, or at yesterday if we have not
  // yet studied today (the day is not over).
  let currentStreak = 0;
  if (hasActivityToday) {
    currentStreak = runEndingAt(set, todayKey);
  } else if (hasActivityYesterday) {
    currentStreak = runEndingAt(set, previousDayKey(todayKey));
  }

  return {
    currentStreak,
    longestStreak,
    hasActivityToday,
    hasActivityYesterday,
  };
}

function sortedKeys(set: ReadonlySet<string>): string[] {
  return [...set].sort();
}

function runEndingAt(set: ReadonlySet<string>, endKey: string): number {
  let count = 0;
  let key = endKey;
  while (set.has(key)) {
    count += 1;
    key = previousDayKey(key);
  }
  return count;
}
