export type UserProgress = {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
};

export type TopicMastery = {
  topic: string;
  attempts: number;
  correctAttempts: number;
  mastery: number;
};
