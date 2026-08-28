import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  AppText,
  Card,
  ErrorState,
  LoadingState,
  SectionHeader,
  ProgressBar,
} from '@/components/ui';
import { TabScreen } from '@/components/navigation';

import {
  getTopicPerformance,
  getChallengesCompleted,
  getCompletedLessonsCount,
  getProblemsStats,
  getUserProgress,
} from '@/repositories/progressRepository';
import type { TopicMastery, UserProgress } from '@/types/progress';

import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
  type ThemeMode,
} from '@/theme';

const LOCAL_PROFILE_NAME = 'Dagi';

function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function titleForLevel(level: number): string {
  if (level >= 10) return 'Senior JavaScript Engineer';
  if (level >= 7) return 'JavaScript Master';
  if (level >= 5) return 'JavaScript Builder';
  if (level >= 3) return 'JavaScript Learner';
  return 'JavaScript Beginner';
}

type ProfileData = {
  progress: UserProgress;
  lessonsCompleted: number;
  problemsSolved: number;
  challengesCompleted: number;
  mastery: TopicMastery[];
};

const APPEARANCE_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const progress = await getUserProgress();
      const lessonsCompleted = await getCompletedLessonsCount();
      const problems = await getProblemsStats();
      const challengesCompleted = await getChallengesCompleted();
      const mastery = await getTopicPerformance();

      setData({
        progress,
        lessonsCompleted,
        problemsSolved: problems.solved,
        challengesCompleted,
        mastery,
      });
      setError(false);
    } catch (e) {
      console.error('Failed to load profile:', e);
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <TabScreen scroll={false}>
        <ErrorState
          full
          title="Couldn't load your profile"
          onRetry={load}
        />
      </TabScreen>
    );
  }

  if (!data) {
    return (
      <TabScreen scroll={false}>
        <LoadingState full message="Loading profile..." />
      </TabScreen>
    );
  }

  const level = levelFromXp(data.progress.xp);
  const title = titleForLevel(level);
  const xpIntoLevel = data.progress.xp % 100;
  const levelProgress = xpIntoLevel / 100;

  const attemptedTopics = data.mastery.filter((t) => t.attempts > 0);
  const sortedByMastery = [...attemptedTopics].sort(
    (a, b) => a.mastery - b.mastery
  );
  const weakTopics = sortedByMastery.slice(0, 3);
  const strongTopics = [...sortedByMastery].reverse().slice(0, 3);

  return (
    <TabScreen>
      {/* Identity */}
      <SectionHeader
        title="Profile"
        subtitle="Your learning progress and preferences."
        icon="person-outline"
      />

      <View style={styles.section}>
        <Card style={styles.identityCard}>
          <View style={styles.avatar}>
            <AppText variant="h1" style={styles.avatarText}>
              {LOCAL_PROFILE_NAME.charAt(0).toUpperCase()}
            </AppText>
          </View>

          <View style={styles.identityInfo}>
            <AppText variant="caption" muted>
              Developer
            </AppText>
            <AppText variant="h1">{LOCAL_PROFILE_NAME}</AppText>
            <AppText variant="bodySmall" style={styles.levelText}>
              Level {level} · {title}
            </AppText>
          </View>
        </Card>

        <Card>
          <View style={styles.levelRow}>
            <AppText variant="h3">Level {level}</AppText>
            <AppText variant="caption" muted>
              {xpIntoLevel} / 100 XP
            </AppText>
          </View>
          <View style={styles.levelBar}>
            <ProgressBar progress={levelProgress} />
          </View>
        </Card>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <SectionHeader title="Statistics" icon="stats-chart" />

        <View style={styles.grid}>
          <StatTile
            icon="grid-outline"
            color={colors.accent.primary}
            value={data.problemsSolved}
            label="Problems solved"
          />
          <StatTile
            icon="code-slash"
            color={colors.accent.secondary}
            value={data.challengesCompleted}
            label="Challenges done"
          />
          <StatTile
            icon="book"
            color={colors.status.info}
            value={data.lessonsCompleted}
            label="Lessons done"
          />
          <StatTile
            icon="flash"
            color={colors.status.warning}
            value={data.progress.xp}
            label="Total XP"
          />
        </View>
      </View>

      {/* Learning */}
      <View style={styles.section}>
        <SectionHeader title="Learning" icon="school-outline" />

        <TopicList
          icon="trending-up"
          title="Weak topics"
          color={colors.status.error}
          topics={weakTopics}
          emptyText="No topics attempted yet."
        />

        <TopicList
          icon="trending-up"
          title="Strong topics"
          color={colors.status.success}
          topics={strongTopics}
          emptyText="No strong topics yet — keep learning!"
        />
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <SectionHeader title="Settings" icon="settings-outline" />
        <AppearanceSettings />
      </View>
    </TabScreen>
  );
}

function StatTile({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Card style={styles.tile}>
      <Ionicons name={icon} size={22} color={color} />
      <AppText variant="h2">{value}</AppText>
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </Card>
  );
}

function TopicList({
  icon,
  title,
  color,
  topics,
  emptyText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  topics: TopicMastery[];
  emptyText: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Card>
      <View style={styles.topicHeader}>
        <Ionicons name={icon} size={18} color={color} />
        <AppText variant="h3">{title}</AppText>
      </View>

      {topics.length === 0 ? (
        <AppText variant="bodySmall" muted>
          {emptyText}
        </AppText>
      ) : (
        <View style={styles.topicList}>
          {topics.map((topic) => (
            <View key={topic.topic} style={styles.topicRow}>
              <AppText variant="bodySmall" style={styles.flex}>
                {topic.topic}
              </AppText>
              <AppText variant="bodySmall" style={{ color }}>
                {Math.round(topic.mastery * 100)}%
              </AppText>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function AppearanceSettings() {
  const { colors, mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Card>
      <View style={styles.topicHeader}>
        <Ionicons
          name="color-palette-outline"
          size={18}
          color={colors.accent.secondary}
        />
        <AppText variant="h3">Appearance</AppText>
      </View>

      <View style={styles.settingList}>
        {APPEARANCE_OPTIONS.map((option) => {
          const active = mode === option.mode;
          return (
            <Pressable
              key={option.mode}
              onPress={() => setMode(option.mode)}
              style={({ pressed }) => [
                styles.settingRow,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={active ? colors.accent.primary : colors.text.muted}
              />
              <AppText style={styles.flex}>{option.label}</AppText>
              {active && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.accent.primary}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },

    identityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },

    avatar: {
      width: 72,
      height: 72,
      borderRadius: radius.full,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.18),
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      color: colors.accent.primary,
    },

    identityInfo: {
      flex: 1,
      gap: spacing.xs,
    },

    levelText: {
      color: colors.accent.secondary,
      marginTop: spacing.xs,
    },

    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    levelBar: {
      marginTop: spacing.md,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },

    tile: {
      flexBasis: '47%',
      flexGrow: 1,
      gap: spacing.xs,
    },

    topicHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },

    topicList: {
      gap: spacing.sm,
    },

    topicRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    flex: {
      flex: 1,
      gap: spacing.xs,
    },

    settingList: {
      gap: spacing.sm,
    },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}
