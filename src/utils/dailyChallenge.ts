export function getDayOfYear(
  date: Date = new Date()
): number {
  const start = new Date(
    date.getFullYear(),
    0,
    0
  );

  const diff = date.getTime() - start.getTime();

  return Math.floor(diff / 86400000);
}

export function pickDailyItem<T>(
  items: T[],
  date: Date = new Date()
): T | null {
  if (items.length === 0) {
    return null;
  }

  const index = getDayOfYear(date) % items.length;

  return items[index];
}
