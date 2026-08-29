// ---------------------------------------------------------------------------
// Level system — deterministic, integer-safe, independent of React.
//
// Level 1 starts at 0 XP. The XP required to advance grows progressively:
// each level boundary is at the cumulative sum of a linear step, so moving
// from level L to L+1 requires `BASE * L` additional XP.
//
//   getXPForLevel(L) = BASE * (L-1) * L / 2
//      L=1 -> 0
//      L=2 -> 100
//      L=3 -> 300
//      L=4 -> 600
//      L=5 -> 1000
//
// All functions handle xp >= 0 and level >= 1 correctly.
// ---------------------------------------------------------------------------

export const LEVEL_BASE_XP = 100;

export type LevelProgress = {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpIntoLevel: number;
  xpRequiredForLevel: number;
  percentage: number;
};

/** Cumulative XP required to reach the start of `level` (level >= 1). */
export function getXPForLevel(level: number): number {
  const safe = Math.max(1, Math.floor(level));
  return Math.floor((LEVEL_BASE_XP * (safe - 1) * safe) / 2);
}

/** The level a given total XP corresponds to (xp = 0 => level 1). */
export function getLevelFromXP(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  let level = 1;
  while (getXPForLevel(level + 1) <= safe) {
    level += 1;
  }
  return level;
}

/** XP earned inside the current level (xp - start of current level). */
export function getXPIntoLevel(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  const level = getLevelFromXP(safe);
  return safe - getXPForLevel(level);
}

/** XP still needed to reach the next level boundary. */
export function getXPToNextLevel(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  const level = getLevelFromXP(safe);
  return getXPForLevel(level + 1) - safe;
}

/** Full progression snapshot for a given total XP. */
export function getLevelProgress(xp: number): LevelProgress {
  const safe = Math.max(0, Math.floor(xp));
  const level = getLevelFromXP(safe);
  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForLevel(level + 1);
  const xpIntoLevel = safe - xpForCurrentLevel;
  const xpRequiredForLevel = xpForNextLevel - xpForCurrentLevel;

  return {
    level,
    currentXP: safe,
    xpForCurrentLevel,
    xpForNextLevel,
    xpIntoLevel,
    xpRequiredForLevel,
    percentage:
      xpRequiredForLevel > 0
        ? xpIntoLevel / xpRequiredForLevel
        : 0,
  };
}
