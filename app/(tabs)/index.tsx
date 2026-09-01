import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

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
  getDailyChallengeState,
  getLessonProgressById,
  getUserProgress,
  LEARNING_XP,
} from '@/repositories/progressRepository';
import type { DailyChallengeState } from '@/repositories/progressRepository';
import type { Lesson } from '@/types/lesson';
import type { Challenge } from '@/types/learning';
import type { UserProgress } from '@/types/progress';

import { pickDailyItem } from '@/utils/dailyChallenge';

import {
  radius,
  shadows,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [topicName, setTopicName] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [lessonsTotal, setLessonsTotal] = useState(0);
  const [dailyState, setDailyState] =
    useState<DailyChallengeState>('not-started');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const prevStreak = useRef(0);
  const firstStreak = useRef(true);
  const streakPop = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [lessons, topics, chs, user, completed, resumeId] = await Promise.all([
        getLessons(),
        getTopics(),
        getChallenges(),
        getUserProgress(),
        getCompletedLessonsCount(),
        getContinueLearningLessonId(),
      ]);

      const first = lessons.find((l) => l.id === resumeId) ?? null;
      setLesson(first);
      setTopicName(
        first
          ? topics.find((t) => t.id === first.topicId)?.name ?? null
          : null
      );
      setChallenges(chs);
      setProgress(user);
      setLessonsCompleted(completed);
      setLessonsTotal(lessons.length);

      const today = new Date();
      const todayChallenge = pickDailyItem(chs, today);
      if (todayChallenge) {
        getDailyChallengeState(todayChallenge.id, today)
          .then(setDailyState)
          .catch(() => {});
      }

      if (user) {
        const current = user.currentStreak ?? 0;
        if (firstStreak.current) {
          firstStreak.current = false;
          prevStreak.current = current;
        } else if (current > prevStreak.current) {
          prevStreak.current = current;
          streakPop.setValue(0.85);
          Animated.timing(streakPop, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.elastic(1)),
            useNativeDriver: true,
          }).start();
        } else {
          prevStreak.current = current;
        }
      }

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
  }, [streakPop]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshOnFocus = useCallback(() => {
    Promise.all([
      getLessons(),
      getTopics(),
      getChallenges(),
      getUserProgress(),
      getCompletedLessonsCount(),
      getContinueLearningLessonId(),
    ])
      .then(([lessons, topics, chs, user, completed, resumeId]) => {
        const first = lessons.find((l) => l.id === resumeId) ?? null;
        setLesson(first);
        setTopicName(
          first ? topics.find((t) => t.id === first.topicId)?.name ?? null : null
        );
        setChallenges(chs);
        setProgress(user);
        setLessonsCompleted(completed);
        setLessonsTotal(lessons.length);

        if (first) {
          getLessonProgressById(first.id)
            .then((p) => setLessonProgress(p.progress))
            .catch(() => {});
        }

        if (user) {
          const current = user.currentStreak ?? 0;
          if (current > prevStreak.current) {
            prevStreak.current = current;
            streakPop.setValue(0.85);
            Animated.timing(streakPop, {
              toValue: 1,
              duration: 420,
              easing: Easing.out(Easing.elastic(1)),
              useNativeDriver: true,
            }).start();
          } else {
            prevStreak.current = current;
          }
        }

        if (chs.length > 0) {
          const today = new Date();
          const c = pickDailyItem(chs, today);
          if (c) {
            getDailyChallengeState(c.id, today)
              .then(setDailyState)
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [streakPop]);

  useFocusEffect(
    useCallback(() => {
      refreshOnFocus();
    }, [refreshOnFocus])
  );

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
  const level = Math.floor(xp / 100) + 1;
  const overallProgress =
    lessonsTotal === 0 ? 0 : lessonsCompleted / lessonsTotal;

  const today = new Date();
  const challenge = pickDailyItem(challenges, today);

  const langTrackName = lesson?.language === 'python'
    ? 'Python Track'
    : lesson?.language === 'typescript'
    ? 'TypeScript Track'
    : 'JavaScript Track';

  return (
    <TabScreen>
      {/* Top Hero Banner */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={12} color={colors.accent.primary} />
            <AppText variant="caption" style={styles.heroBadgeText}>
              {greeting().toUpperCase()} · LEVEL {level}
            </AppText>
          </View>
          <AppText variant="h1" style={styles.heroTitle}>
            Coding Coach
          </AppText>
          <AppText variant="bodySmall" muted style={styles.heroSubtitle}>
            Your offline personalized AI mentor &amp; curriculum.
          </AppText>
        </View>

        <View style={styles.headerRight}>
          <Animated.View
            style={[
              styles.streak,
              { transform: [{ scale: streakPop }] },
            ]}
          >
            <Ionicons
              name="flame"
              size={18}
              color={colors.status.warning}
            />
            <AppText variant="body" style={styles.streakText}>
              {streak}d
            </AppText>
          </Animated.View>

          <View style={styles.xpPill}>
            <Ionicons name="flash" size={13} color={colors.accent.primary} />
            <AppText variant="caption" style={styles.xpPillText}>
              {xp} XP
            </AppText>
          </View>
        </View>
      </View>

      {/* 1. Overall Path Progress */}
      <View style={styles.section}>
        <SectionHeader title="Your Progress" icon="trending-up" />
        <Card>
          <View style={styles.progressHeroRow}>
            <View style={styles.flex}>
              <View style={styles.progressHeader}>
                <AppText variant="h1" style={styles.progressBigPercent}>
                  {Math.round(overallProgress * 100)}%
                </AppText>
                <View style={styles.progressSubCol}>
                  <AppText variant="bodySmall" style={{ fontWeight: '700' }}>
                    Curriculum Mastered
                  </AppText>
                  <AppText variant="caption" muted>
                    {lessonsCompleted} of {lessonsTotal} lessons finished
                  </AppText>
                </View>
              </View>
            </View>
            <Badge
              label={overallProgress >= 1 ? 'COMPLETED' : `${lessonsCompleted}/${lessonsTotal}`}
              variant={overallProgress >= 1 ? 'success' : 'default'}
            />
          </View>

          <View style={styles.progressBar}>
            <ProgressBar progress={overallProgress} />
          </View>

          {/* 4 Stat Tiles */}
          <View style={styles.statsGrid}>
            <MiniStat
              icon="book-outline"
              value={`${lessonsCompleted}/${lessonsTotal}`}
              label="Lessons Done"
              accentColor={colors.accent.primary}
            />
            <MiniStat
              icon="flash-outline"
              value={String(xp)}
              label="Earned XP"
              accentColor={colors.status.warning}
            />
            <MiniStat
              icon="flame-outline"
              value={`${streak} days`}
              label="Active Streak"
              accentColor={colors.status.error}
            />
            <MiniStat
              icon="trophy-outline"
              value={`Lvl ${level}`}
              label="Developer Rank"
              accentColor={colors.status.info}
            />
          </View>
        </Card>
      </View>

      {/* 2. Continue Learning Hero Card */}
      <View style={styles.section}>
        <SectionHeader title="Continue Learning" icon="play" />
        <Card>
          <View style={styles.continueCardContent}>
            <View style={styles.continueTrackRow}>
              <View style={styles.langPill}>
                <Ionicons
                  name="code-slash"
                  size={12}
                  color={colors.accent.primary}
                />
                <AppText variant="caption" style={styles.langPillText}>
                  {langTrackName}
                </AppText>
              </View>
              {lesson && (
                <Badge
                  label={lesson.difficulty.toUpperCase()}
                  variant={
                    lesson.difficulty === 'hard'
                      ? 'error'
                      : lesson.difficulty === 'medium'
                      ? 'warning'
                      : 'success'
                  }
                />
              )}
            </View>

            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Ionicons
                  name={lesson?.language === 'python' ? 'logo-python' : 'book-outline'}
                  size={24}
                  color={colors.accent.primary}
                />
              </View>

              <View style={styles.flex}>
                <AppText variant="h3">
                  {lesson?.title ?? 'All lessons completed!'}
                </AppText>
                <AppText variant="caption" muted numberOfLines={1}>
                  {topicName ? `Topic: ${topicName}` : 'Explore more in Learn tab'}
                </AppText>
              </View>

              {lesson && (
                <Badge
                  label={`${Math.round(lessonProgress * 100)}%`}
                  variant="success"
                />
              )}
            </View>

            {lesson ? (
              <>
                <View style={styles.progressBar}>
                  <ProgressBar progress={lessonProgress} />
                </View>

                <Button
                  title="Continue Lesson →"
                  variant="primary"
                  onPress={() => router.push(`/lesson/${lesson.id}`)}
                />
              </>
            ) : (
              <Button
                title="Browse All Curriculum"
                variant="secondary"
                onPress={() => router.push('/learn')}
              />
            )}
          </View>
        </Card>
      </View>

      {/* 3. Daily Challenge Spotlight */}
      <View style={styles.section}>
        <SectionHeader
          title="Daily Challenge"
          subtitle={today.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        />
        <Card>
          <View style={styles.dailyCardContent}>
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
                <AppText variant="bodySmall" muted numberOfLines={2}>
                  {challenge?.description ?? 'Challenges coming soon'}
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
              <>
                <View style={styles.dailyMetaRow}>
                  <View style={styles.rewardRow}>
                    <Ionicons
                      name="flash"
                      size={14}
                      color={colors.status.warning}
                    />
                    <AppText variant="caption" style={styles.rewardText}>
                      +{LEARNING_XP.challengeComplete} XP Reward
                    </AppText>
                  </View>

                  {dailyState === 'completed' && (
                    <View style={styles.completedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color={colors.status.success}
                      />
                      <AppText variant="caption" style={styles.completedText}>
                        Completed Today
                      </AppText>
                    </View>
                  )}
                </View>

                <Button
                  title={
                    dailyState === 'completed'
                      ? 'View Solved Challenge'
                      : dailyState === 'attempted'
                      ? 'Continue Challenge'
                      : 'Start Challenge'
                  }
                  variant={dailyState === 'completed' ? 'secondary' : 'primary'}
                  onPress={() => router.push(`/challenge/${challenge.id}`)}
                />
              </>
            )}
          </View>
        </Card>
      </View>

      {/* 4. Quick Actions Grid */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" icon="grid-outline" />
        <View style={styles.quickGrid}>
          <QuickAction
            icon="book-outline"
            label="Curriculum"
            desc="Python &amp; JS tracks"
            color={colors.accent.primary}
            onPress={() => router.push('/learn')}
          />
          <QuickAction
            icon="code-slash-outline"
            label="Practice"
            desc="Interactive challenges"
            color={colors.status.success}
            onPress={() => router.push('/practice')}
          />
          <QuickAction
            icon="chatbubble-ellipses-outline"
            label="AI Coach"
            desc="Offline assistance"
            color={colors.accent.secondary}
            onPress={() => router.push('/coach')}
          />
          <QuickAction
            icon="person-outline"
            label="Profile"
            desc="Stats &amp; Settings"
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
  accentColor,
}: {
  icon: IconName;
  value: string;
  label: string;
  accentColor: string;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.miniStatCard}>
      <View
        style={[
          styles.miniStatIconWrap,
          { backgroundColor: hexWithAlpha(accentColor, 0.12) },
        ]}
      >
        <Ionicons name={icon} size={16} color={accentColor} />
      </View>
      <AppText variant="h3" style={styles.miniStatValue}>
        {value}
      </AppText>
      <AppText variant="caption" muted style={styles.miniStatLabel}>
        {label}
      </AppText>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  desc,
  color,
  onPress,
}: {
  icon: IconName;
  label: string;
  desc: string;
  color: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionCard,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.quickActionIconWrap,
          { backgroundColor: hexWithAlpha(color, 0.12) },
        ]}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.quickActionTexts}>
        <AppText variant="bodySmall" style={{ fontWeight: '700' }}>
          {label}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {desc}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={14} color={hexWithAlpha(color, 0.6)} />
    </Pressable>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.lg,
      paddingTop: spacing.xs,
    },

    headerLeft: {
      flex: 1,
      gap: 3,
    },

    headerRight: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },

    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
      backgroundColor: colors.accent.soft,
      marginBottom: 2,
    },

    heroBadgeText: {
      color: colors.accent.primary,
      fontWeight: '700',
      letterSpacing: 0.8,
      fontSize: 10,
    },

    heroTitle: {
      letterSpacing: -0.4,
    },

    heroSubtitle: {
      lineHeight: 18,
    },

    streak: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    streakText: {
      color: colors.status.warning,
      fontWeight: '700',
      fontSize: 13,
    },

    xpPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.12),
    },

    xpPillText: {
      color: colors.accent.primary,
      fontWeight: '700',
      fontSize: 11,
    },

    section: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },

    progressHeroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },

    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    progressBigPercent: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.accent.primary,
    },

    progressSubCol: {
      gap: 2,
    },

    progressBar: {
      marginVertical: spacing.md,
    },

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },

    miniStatCard: {
      flex: 1,
      minWidth: '45%',
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
      gap: 3,
    },

    miniStatIconWrap: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },

    miniStatValue: {
      fontSize: 16,
      fontWeight: '700',
    },

    miniStatLabel: {
      fontSize: 11,
    },

    continueCardContent: {
      gap: spacing.sm,
    },

    continueTrackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },

    langPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.1),
    },

    langPillText: {
      color: colors.accent.primary,
      fontWeight: '600',
      fontSize: 11,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    flex: {
      flex: 1,
      gap: 2,
    },

    iconBox: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.surface.secondary,
    },

    dailyCardContent: {
      gap: spacing.md,
    },

    lightningIcon: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: hexWithAlpha(colors.status.warning, 0.15),
    },

    dailyMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    rewardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    rewardText: {
      color: colors.status.warning,
      fontWeight: '700',
    },

    completedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: hexWithAlpha(colors.status.success, 0.15),
    },

    completedText: {
      color: colors.status.success,
      fontWeight: '700',
    },

    quickGrid: {
      gap: spacing.sm,
    },

    quickActionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      ...shadows.small,
    },

    quickActionIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    quickActionTexts: {
      flex: 1,
      gap: 2,
    },

    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
