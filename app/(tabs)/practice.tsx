import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import {
  AppText,
  Badge,
  EmptyState,
  ErrorState,
  FadeInView,
  SectionHeader,
  SkeletonCard,
} from '@/components/ui';
import { TabScreen } from '@/components/navigation';

import { getChallenges } from '@/repositories/challengeRepository';
import { getLessons } from '@/repositories/lessonRepository';
import { getTopics } from '@/repositories/topicRepository';
import {
  getAttemptedChallengeIds,
  getCompletedChallengeIds,
  getRecentChallengeAttempts,
  type RecentChallengeAttempt,
} from '@/repositories/progressRepository';

import {
  buildPracticeIndex,
  getChallengeStatus,
  selectResumeChallenge,
  type PracticeChallenge,
  type ChallengeStatus,
} from '@/practice/practiceLogic';

import { openChallengeById } from '@/utils/navigation';
import type { Challenge } from '@/types/learning';
import { hexWithAlpha } from '@/utils/color';

import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type DifficultyFilter = 'all' | Challenge['difficulty'];

const DIFFICULTIES: DifficultyFilter[] = [
  'all',
  'beginner',
  'easy',
  'medium',
  'hard',
];

const DIFFICULTY_TINT: Record<
  Challenge['difficulty'],
  'success' | 'warning' | 'error'
> = {
  beginner: 'success',
  easy: 'success',
  medium: 'warning',
  hard: 'error',
  intermediate: 'warning',
  advanced: 'error',
};

export default function PracticeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [index, setIndex] = useState<ReturnType<typeof buildPracticeIndex> | null>(null);
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<RecentChallengeAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [filter, setFilter] = useState<DifficultyFilter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [challenges, lessons, topics, attempted, completed, attempts] =
        await Promise.all([
          getChallenges(),
          getLessons(),
          getTopics(),
          getAttemptedChallengeIds(),
          getCompletedChallengeIds(),
          getRecentChallengeAttempts(),
        ]);

      setIndex(buildPracticeIndex(challenges, lessons, topics));
      setAttemptedIds(new Set(attempted));
      setCompletedIds(new Set(completed));
      setRecent(attempts);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        getChallenges(),
        getLessons(),
        getTopics(),
        getAttemptedChallengeIds(),
        getCompletedChallengeIds(),
        getRecentChallengeAttempts(),
      ])
        .then(([challenges, lessons, topics, attempted, completed, attempts]) => {
          setIndex(buildPracticeIndex(challenges, lessons, topics));
          setAttemptedIds(new Set(attempted));
          setCompletedIds(new Set(completed));
          setRecent(attempts);
        })
        .catch(() => {});
    }, [])
  );

  const statusOf = useMemo(
    () => (id: string): ChallengeStatus =>
      getChallengeStatus(id, completedIds, attemptedIds),
    [completedIds, attemptedIds]
  );

  const resumeId = useMemo(() => {
    if (!index) return null;
    return selectResumeChallenge(
      index,
      completedIds,
      attemptedIds,
      recent[0]?.challengeId ?? null
    );
  }, [index, completedIds, attemptedIds, recent]);

  const resumeChallenge = resumeId ? index?.byId.get(resumeId) : null;

  const filteredGroups = useMemo(() => {
    if (!index) return [];
    return index.topicGroups
      .map((group) => ({
        ...group,
        challenges: group.challenges.filter((item) =>
          filter === 'all' || item.challenge.difficulty === filter
        ),
      }))
      .filter((group) => group.challenges.length > 0);
  }, [index, filter]);

  const stats = useMemo(() => {
    const total = index?.ordered.length ?? 0;
    const solved = completedIds.size;
    const attempted = attemptedIds.size;
    const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, solved, attempted, percent };
  }, [index, completedIds, attemptedIds]);

  if (loading) {
    return (
      <TabScreen>
        <Header />
        <View style={{ marginTop: spacing.md }}>
          <SkeletonCard rows={2} />
          <SkeletonCard rows={3} />
          <SkeletonCard rows={2} />
        </View>
      </TabScreen>
    );
  }

  if (error) {
    return (
      <TabScreen>
        <Header />
        <ErrorState title="Couldn't load practice" onRetry={load} />
      </TabScreen>
    );
  }

  const isEmpty = !index || index.ordered.length === 0;
  const allCompleted =
    !isEmpty &&
    index!.ordered.every((item) => completedIds.has(item.challenge.id));

  return (
    <TabScreen>
      <Header />

      {isEmpty ? (
        <EmptyState
          icon="code-slash-outline"
          title="No practice problems yet"
          message="Complete a lesson to unlock coding practice."
        />
      ) : (
        <>
          {/* Practice Stats Bar */}
          <PracticeStatsBar
            total={stats.total}
            solved={stats.solved}
            attempted={stats.attempted}
            percent={stats.percent}
          />

          {allCompleted ? (
            <FadeInView>
              <View style={styles.allDone}>
                <Ionicons
                  name="trophy"
                  size={22}
                  color={colors.status.success}
                />
                <View style={styles.allDoneBody}>
                  <AppText variant="body" style={styles.allDoneTitle}>
                    All practice problems completed
                  </AppText>
                  <AppText variant="caption" muted>
                    Nice work — review any problem to practice again.
                  </AppText>
                </View>
              </View>
            </FadeInView>
          ) : resumeChallenge ? (
            <FadeInView>
              <SectionHeader
                title="Continue practicing"
                subtitle="Jump back into a problem"
              />
              <ContinueRow
                challenge={resumeChallenge.challenge}
                onPress={() => openChallengeById(resumeChallenge.challenge.id)}
              />
            </FadeInView>
          ) : null}

          {/* Filters */}
          <View style={styles.filters}>
            {DIFFICULTIES.map((value) => (
              <FilterChip
                key={value}
                label={value === 'all' ? 'All' : capitalize(value)}
                active={filter === value}
                onPress={() => setFilter(value)}
              />
            ))}
          </View>

          {/* Challenges by topic */}
          {filteredGroups.length === 0 ? (
            <EmptyState
              icon="filter-outline"
              title="No problems in this filter"
              message="Try a different difficulty."
            />
          ) : (
            <View style={styles.groups}>
              {filteredGroups.map((group) => (
                <FadeInView key={group.topicId} style={styles.group}>
                  <SectionHeader
                    title={group.topicName}
                    subtitle={`${group.challenges.length} problem${
                      group.challenges.length === 1 ? '' : 's'
                    }`}
                  />
                  <View style={styles.list}>
                    {group.challenges.map((item) => (
                      <ChallengeRow
                        key={item.challenge.id}
                        item={item}
                        status={statusOf(item.challenge.id)}
                        onPress={() =>
                          openChallengeById(item.challenge.id)
                        }
                      />
                    ))}
                  </View>
                </FadeInView>
              ))}
            </View>
          )}

          {/* Recent attempts */}
          {recent.length > 0 && (
            <FadeInView style={styles.recentWrap}>
              <SectionHeader
                title="Recently attempted"
                subtitle="Your latest submissions"
              />
              <View style={styles.list}>
                {recent.map((attempt, i) => (
                  <AttemptRow
                    key={`${attempt.challengeId}-${i}`}
                    attempt={attempt}
                    onPress={() => openChallengeById(attempt.challengeId)}
                  />
                ))}
              </View>
            </FadeInView>
          )}
        </>
      )}
    </TabScreen>
  );
}

function Header() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.heroHeader}>
      <View style={styles.heroHeaderBadge}>
        <Ionicons name="code-slash" size={13} color={colors.accent.primary} />
        <AppText variant="caption" style={styles.heroBadgeText}>
          CHALLENGES &amp; PROBLEMS
        </AppText>
      </View>
      <AppText variant="h1" style={styles.heroTitle}>
        Coding Practice
      </AppText>
      <AppText variant="bodySmall" muted style={styles.heroSubtitle}>
        Strengthen problem solving with interactive coding challenges.
      </AppText>
    </View>
  );
}

function ContinueRow({
  challenge,
  onPress,
}: {
  challenge: Challenge;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.continue,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.continueIcon}>
        <Ionicons
          name="play"
          size={20}
          color={colors.accent.primary}
        />
      </View>
      <View style={styles.continueBody}>
        <AppText variant="body" style={styles.continueTitle}>
          {challenge.title}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {challenge.description}
        </AppText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.text.muted}
      />
    </Pressable>
  );
}

function ChallengeRow({
  item,
  status,
  onPress,
}: {
  item: PracticeChallenge;
  status: ChallengeStatus;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const solved = status === 'solved';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        solved && styles.rowSolved,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowMain}>
        <View style={styles.rowTitleRow}>
          <AppText
            variant="body"
            style={[styles.rowTitle, solved && styles.textMuted]}
            numberOfLines={1}
          >
            {item.challenge.title}
          </AppText>
          <StateIcon status={status} />
        </View>
        <AppText variant="caption" muted numberOfLines={1}>
          {item.lessonTitle}
        </AppText>
      </View>

      <Badge
        label={capitalize(item.challenge.difficulty)}
        variant={DIFFICULTY_TINT[item.challenge.difficulty]}
      />
    </Pressable>
  );
}

function StateIcon({ status }: { status: ChallengeStatus }) {
  const { colors } = useTheme();

  if (status === 'solved') {
    return (
      <Ionicons
        name="checkmark-circle"
        size={20}
        color={colors.status.success}
      />
    );
  }
  if (status === 'attempted') {
    return (
      <Ionicons
        name="radio-button-on"
        size={18}
        color={colors.status.warning}
      />
    );
  }
  return null;
}

function AttemptRow({
  attempt,
  onPress,
}: {
  attempt: RecentChallengeAttempt;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={attempt.passed ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={
          attempt.passed
            ? colors.status.success
            : colors.status.error
        }
      />
      <View style={styles.rowMain}>
        <AppText variant="body" numberOfLines={1} style={styles.rowTitle}>
          {attempt.title}
        </AppText>
        <AppText variant="caption" muted>
          {attempt.passed
            ? `${attempt.testsPassed}/${attempt.testsTotal} passed`
            : 'Not solved'} · {formatDate(attempt.attemptedAt)}
        </AppText>
      </View>
    </Pressable>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: colors.accent.primary },
      ]}
    >
      <AppText
        variant="caption"
        style={[
          styles.chipLabel,
          active && { color: colors.text.inverse },
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function PracticeStatsBar({
  total,
  solved,
  attempted,
  percent,
}: {
  total: number;
  solved: number;
  attempted: number;
  percent: number;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.statsBar}>
      <View style={styles.statBox}>
        <AppText variant="h3" style={{ color: colors.accent.primary }}>
          {solved}/{total}
        </AppText>
        <AppText variant="caption" muted>
          Solved ({percent}%)
        </AppText>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.statBox}>
        <AppText variant="h3" style={{ color: colors.status.warning }}>
          {attempted}
        </AppText>
        <AppText variant="caption" muted>
          Attempted
        </AppText>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.statBox}>
        <AppText variant="h3" style={{ color: colors.text.secondary }}>
          {Math.max(0, total - solved)}
        </AppText>
        <AppText variant="caption" muted>
          Remaining
        </AppText>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    statsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },

    statBox: {
      alignItems: 'center',
      gap: 2,
    },

    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border.default,
    },

    heroHeader: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },

    heroHeaderBadge: {
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
      lineHeight: 19,
    },

    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
    },

    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    chipLabel: {
      color: colors.text.secondary,
      fontWeight: '600',
    },

    groups: {
      marginTop: spacing.lg,
      gap: spacing.lg,
    },

    group: {
      gap: spacing.sm,
    },

    list: {
      gap: spacing.sm,
    },

    continue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.default,
      marginTop: spacing.sm,
    },

    continueIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.secondary,
    },

    continueBody: {
      flex: 1,
      gap: 2,
    },

    continueTitle: {
      fontWeight: '600',
    },

    allDone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.status.success + '66',
      backgroundColor: colors.status.success + '10',
      marginTop: spacing.sm,
    },

    allDoneBody: {
      flex: 1,
      gap: 2,
    },

    allDoneTitle: {
      fontWeight: '600',
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    rowSolved: {
      opacity: 0.72,
    },

    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },

    rowMain: {
      flex: 1,
      gap: 2,
    },

    rowTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },

    rowTitle: {
      flexShrink: 1,
      color: colors.text.primary,
      fontWeight: '600',
    },

    textMuted: {
      color: colors.text.secondary,
    },

    recentWrap: {
      marginTop: spacing.xl,
    },
  });
