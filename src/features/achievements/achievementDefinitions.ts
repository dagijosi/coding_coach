import { Ionicons } from '@expo/vector-icons';

export type AchievementCategory = 'learning' | 'practice' | 'streak' | 'special';

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: keyof typeof Ionicons.glyphMap;
  xpReward: number;
  badgeTint: 'success' | 'warning' | 'error' | 'default';
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_lesson',
    title: 'Hello, World!',
    description: 'Completed your first interactive coding lesson.',
    category: 'learning',
    icon: 'sparkles',
    xpReward: 50,
    badgeTint: 'success',
  },
  {
    id: 'lesson_5',
    title: 'Code Apprentice',
    description: 'Completed 5 lessons across any curriculum track.',
    category: 'learning',
    icon: 'book',
    xpReward: 100,
    badgeTint: 'default',
  },
  {
    id: 'lesson_10',
    title: 'Curriculum Master',
    description: 'Completed 10 comprehensive programming lessons.',
    category: 'learning',
    icon: 'trophy',
    xpReward: 200,
    badgeTint: 'warning',
  },
  {
    id: 'first_challenge',
    title: 'Problem Solver',
    description: 'Passed your first coding challenge with all tests green.',
    category: 'practice',
    icon: 'code-slash',
    xpReward: 50,
    badgeTint: 'success',
  },
  {
    id: 'challenge_5',
    title: 'Algorithm Ace',
    description: 'Solved 5 algorithmic coding challenges.',
    category: 'practice',
    icon: 'terminal',
    xpReward: 150,
    badgeTint: 'warning',
  },
  {
    id: 'streak_3',
    title: 'Momentum Builder',
    description: 'Kept your study streak active for 3 consecutive days.',
    category: 'streak',
    icon: 'flame',
    xpReward: 75,
    badgeTint: 'warning',
  },
  {
    id: 'streak_7',
    title: 'Unstoppable Habit',
    description: 'Achieved an impressive 7-day practice streak.',
    category: 'streak',
    icon: 'flash',
    xpReward: 250,
    badgeTint: 'error',
  },
  {
    id: 'first_bookmark',
    title: 'Code Archivist',
    description: 'Saved your first reusable code snippet bookmark.',
    category: 'special',
    icon: 'bookmark',
    xpReward: 30,
    badgeTint: 'default',
  },
  {
    id: 'polyglot',
    title: 'Polyglot Explorer',
    description: 'Completed lessons across Python and JavaScript/TypeScript.',
    category: 'learning',
    icon: 'globe-outline',
    xpReward: 120,
    badgeTint: 'success',
  },
];
