import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  AppText,
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  ProgressBar,
  SectionHeader,
} from '@/components/ui';
import { TabScreen } from '@/components/navigation';

import { getLessons } from '@/repositories/lessonRepository';
import { getTopics } from '@/repositories/topicRepository';
import { getChallenges } from '@/repositories/challengeRepository';
import {
  getCompletedLessonsCount,
  getContinueLearningLessonId,
  getLessonProgressById,
  getUserProgress,
} from '@/repositories/progressRepository';
import type { Lesson } from '@/types/lesson';
import type { Challenge } from '@/types/learning';
import type { UserProgress } from '@/types/progress';

import { pickDailyItem } from '@/utils/dailyChallenge';

import {
  colors,
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [topicName, setTopicName] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [lessonsTotal, setLessonsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const lessons = await getLessons();
      const topics = await getTopics();
      const challenges = await getChallenges();
      const user = await getUserProgress();
      const completed = await getCompletedLessonsCount();
      const resumeId = await getContinueLearningLessonId();

      const first = lessons.find((l) => l.id === resumeId) ?? null;
      setLesson(first);
      setTopicName(
        first
          ? topics.find((t) => t.id === first.topicId)?.name ?? null
          : null
      );
      setChallenges(challenges);
      setProgress(user);
      setLessonsCompleted(completed);
      setLessonsTotal(lessons.length);

      if (first) {
        const p = await getLessonProgressById(first.id);
        setLessonProgress(p.progress);
      }
    } catch (error) {
      console.error('Failed to load home data:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <TabScreen>
        <LoadingState message="Loading your dashboard..." />
      </TabScreen>
    );
  }

  if (error) {
    return (
      <TabScreen>
        <ErrorState title="Couldn't load your dashboard" onRetry={load} />
      </TabScreen>
    );
  }

  const xp = progress?.xp ?? 0;
  const streak = progress?.currentStreak ?? 0;
  const overallProgress =
    lessonsTotal === 0 ? 0 : lessonsCompleted / lessonsTotal;

  const today = new Date();
  const challenge = pickDailyItem(challenges, today);

  return (
    <TabScreen>
      {/* Greeting */}
      <View style={styles.header}>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" muted>
            {greeting()} 👋
          </AppText>
          <AppText variant="h1">Coding Coach</AppText>
          <AppText variant="bodySmall" muted>
            Keep building your coding skills.
          </AppText>
        </View>

        <View style={styles.streak}>
          <Ionicons
            name="flame"
            size={20}
            color={colors.status.warning}
          />
          <AppText variant="body" style={styles.streakText}>
            {streak}
          </AppText>
        </View>
      </View>

      {/* Your Progress */}
      <View style={styles.section}>
        <SectionHeader title="Your Progress" icon="trending-up" />
        <Card>
          <View style={styles.progressHeader}>
            <AppText variant="h2">
              {Math.round(overallProgress * 100)}%
            </AppText>
            <AppText variant="caption" muted>
              of the path complete
            </AppText>
          </View>

          <View style={styles.progressBar}>
            <ProgressBar progress={overallProgress} />
          </View>

          <View style={styles.statsRow}>
            <MiniStat
              icon="book-outline"
              value={String(lessonsCompleted)}
              label="Lessons"
            />
            <MiniStat icon="flash-outline" value={String(xp)} label="XP" />
            <MiniStat
              icon="flame-outline"
              value={String(streak)}
              label="Streak"
            />
          </View>
        </Card>
      </View>

      {/* Continue Learning */}
      <View style={styles.section}>
        <SectionHeader title="Continue Learning" icon="play" />
        <Card>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons
                name="book-outline"
                size={26}
                color={colors.accent.primary}
              />
            </View>

            <View style={styles.flex}>
              <AppText variant="h3">
                {lesson?.title ?? 'No lessons yet'}
              </AppText>
              <AppText muted>
                {topicName ?? 'Start learning below'}
              </AppText>
            </View>

            {lesson && (
              <Badge
                label={`${Math.round(lessonProgress * 100)}%`}
                variant="success"
              />
            )}
          </View>

          {lesson && (
            <>
              <View style={styles.progressBar}>
                <ProgressBar progress={lessonProgress} />
              </View>

              <Button
                title="Continue →"
                onPress={() => router.push(`/lesson/${lesson.id}`)}
              />
            </>
          )}
        </Card>
      </View>

      {/* Daily Challenge */}
      <View style={styles.section}>
        <SectionHeader
          title="Daily Challenge"
          subtitle={today.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        />
        <Card
          onPress={() =>
            challenge &&
            router.push(`/challenge/${challenge.id}`)
          }
        >
          <View style={styles.row}>
            <View style={styles.lightningIcon}>
              <Ionicons
                name="flash"
                size={24}
                color={colors.status.warning}
              />
            </View>

            <View style={styles.flex}>
              <AppText variant="h3">
                {challenge?.title ?? 'No challenges yet'}
              </AppText>
              <AppText muted numberOfLines={1}>
                {challenge
                  ? challenge.description
                  : 'Challenges coming soon'}
              </AppText>
            </View>

            {challenge && (
              <Badge
                label={challenge.difficulty.toUpperCase()}
                variant={
                  challenge.difficulty === 'hard'
                    ? 'error'
                    : challenge.difficulty === 'medium'
                    ? 'warning'
                    : 'success'
                }
              />
            )}
          </View>

          {challenge && (
            <View style={styles.cardFooter}>
              <AppText variant="caption" muted>
                Solve today's challenge
              </AppText>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.text.secondary}
              />
            </View>
          )}
        </Card>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick actions" icon="grid-outline" />
        <View style={styles.quickRow}>
          <QuickAction
            icon="book-outline"
            label="Learn"
            color={colors.accent.secondary}
            onPress={() => router.push('/learn')}
          />
          <QuickAction
            icon="code-slash-outline"
            label="Practice"
            color={colors.accent.primary}
            onPress={() => router.push('/practice')}
          />
          <QuickAction
            icon="person-outline"
            label="Me"
            color={colors.status.info}
            onPress={() => router.push('/profile')}
          />
        </View>
      </View>
    </TabScreen>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={20} color={colors.accent.primary} />
      <AppText variant="h3">{value}</AppText>
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: color + '1f' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <AppText variant="bodySmall">{label}</AppText>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xl,
    },

    streak: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.full,
    },

    streakText: {
      color: colors.status.warning,
      fontWeight: '700',
    },

    section: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },

    progressHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },

    progressBar: {
      marginVertical: spacing.md,
    },

    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },

    miniStat: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.md,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    flex: {
      flex: 1,
      gap: spacing.xs,
    },

    iconBox: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.surface.secondary,
    },

    lightningIcon: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: hexWithAlpha(colors.status.warning, 0.15),
    },

    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },

    quickRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    quickAction: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    quickIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}
