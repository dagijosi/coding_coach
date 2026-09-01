/**
 * SuperMemo 2 (SM-2) Spaced-Repetition Memory Algorithm implementation.
 * Used to schedule optimal concept and lesson review intervals.
 */

export type SRSResult = {
  nextIntervalDays: number;
  nextEaseFactor: number;
  nextRepetitions: number;
  nextDueAt: string;
};

/**
 * Calculates the next SRS review interval based on learner response quality (1-5).
 * 5 = Perfect response with immediate recall
 * 4 = Correct response with slight hesitation
 * 3 = Correct response with serious difficulty
 * 2 = Incorrect response, but correct answer remembered upon seeing it
 * 1 = Complete blackout / incorrect
 */
export function calculateSM2(
  repetitions: number,
  easeFactor: number,
  intervalDays: number,
  quality: number
): SRSResult {
  const q = Math.max(1, Math.min(5, quality));

  let nextRepetitions = repetitions;
  let nextIntervalDays = intervalDays;
  let nextEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  if (q >= 3) {
    if (nextRepetitions === 0) {
      nextIntervalDays = 1;
    } else if (nextRepetitions === 1) {
      nextIntervalDays = 3;
    } else {
      nextIntervalDays = Math.round(intervalDays * nextEaseFactor);
    }
    nextRepetitions += 1;
  } else {
    nextRepetitions = 0;
    nextIntervalDays = 1;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + nextIntervalDays);

  return {
    nextIntervalDays,
    nextEaseFactor,
    nextRepetitions,
    nextDueAt: dueDate.toISOString(),
  };
}
