import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
  SectionHeader,
} from '@/components/ui';
import { TabScreen } from '@/components/navigation';

import {
  getLearningStats,
  getOverallMastery,
  getProgressionSummary,
  getProgressSummary,
  getRecentActivity,
  getTopicMastery,
} from '@/repositories/progressRepository';
import type { LearningStats } from '@/repositories/progressRepository';
import { getWeakAreas } from '@/learning/weakareas/weakAreaService';
import type { WeakArea } from '@/learning/weakareas/weakAreaTypes';
import { buildInsights } from '@/learning/insights';
import type { DashboardInsight } from '@/learning/insights';
import type { TopicMastery } from '@/learning/mastery/masteryTypes';
import type { OverallMastery } from '@/learning/mastery/masteryTypes';
import type {
  ProgressionSummary,
  ProgressSummary,
  RecentActivityItem,
} from '@/types/progress';

import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
  type ThemeMode,
} from '@/theme';
import {
  checkAppUpdates,
  openDownloadUrl,
  type ReleaseInfo,
} from '@/services/updateService';

const LOCAL_PROFILE_NAME = 'Dagi';

function titleForLevel(level: number): string {
  if (level >= 10) return 'Senior JavaScript Engineer';
  if (level >= 7) return 'JavaScript Master';
  if (level >= 5) return 'JavaScript Builder';
  if (level >= 3) return 'JavaScript Learner';
  return 'JavaScript Beginner';
}

const RECENT_ACTIVITY_LIMIT = 8;

type DashboardData = {
  progression: ProgressionSummary;
  progress: ProgressSummary;
  stats: LearningStats;
  overall: OverallMastery;
  topicMastery: TopicMastery[];
  weakAreas: WeakArea[];
  recent: RecentActivityItem[];
  insights: DashboardInsight[];
};

function hasLearningActivity(data: DashboardData): boolean {
  return (
    data.progress.completedLessons > 0 ||
    data.progress.solvedProblems > 0 ||
    data.progress.completedChallenges > 0 ||
    data.progress.totalAttempts > 0 ||
    data.overall.topicsStarted > 0 ||
    data.progression.currentStreak > 0
  );
}

function topicBadge(
  topic: TopicMastery,
  weakTopicIds: ReadonlySet<string>
): { label: string; variant: 'success' | 'warning' | 'error' | 'default' } {
  if (weakTopicIds.has(topic.topicId)) {
    return { label: 'Needs practice', variant: 'error' };
  }
  if (topic.level === 'mastered' || topic.level === 'proficient') {
    return { label: 'Strong', variant: 'success' };
  }
  if (topic.masteryScore > 0) {
    return { label: 'In progress', variant: 'warning' };
  }
  return { label: 'Not started', variant: 'default' };
}

function topicCompletion(topic: TopicMastery): number {
  return topic.lessonsTotal > 0 ? topic.lessonsCompleted / topic.lessonsTotal : 0;
}

function iconForActivity(kind: RecentActivityItem['kind']): keyof typeof Ionicons.glyphMap {
  if (kind === 'lesson') return 'book-outline';
  if (kind === 'challenge') return 'code-slash-outline';
  return 'help-circle-outline';
}

function relativeActivityTime(attemptedAt: string): string {
  const then = new Date(attemptedAt);
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.max(
    0,
    Math.round((startOfDay(new Date()) - startOfDay(then)) / 86400000)
  );
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString();
}

const APPEARANCE_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function ProgressScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [
        progression,
        progress,
        stats,
        overall,
        topicMastery,
        weakAreas,
        recent,
      ] = await Promise.all([
        getProgressionSummary(),
        getProgressSummary(),
        getLearningStats(),
        getOverallMastery(),
        getTopicMastery(),
        getWeakAreas(),
        getRecentActivity(RECENT_ACTIVITY_LIMIT),
      ]);

      setData({
        progression,
        progress,
        stats,
        overall,
        topicMastery,
        weakAreas,
        recent,
        insights: buildInsights({
          progression: {
            totalXP: progression.totalXP,
            xpToNextLevel: progression.xpToNextLevel,
            currentStreak: progression.currentStreak,
          },
          progress: {
            totalLessons: progress.totalLessons,
            completedLessons: progress.completedLessons,
            problemsAttempted: stats.problemsAttempted,
            problemAccuracy: stats.accuracy,
          },
          overall: {
            score: overall.score,
            topicsStarted: overall.topicsStarted,
            strongestTopic: overall.strongestTopic
              ? {
                  topicName: overall.strongestTopic.topicName,
                  masteryScore: overall.strongestTopic.masteryScore,
                }
              : null,
          },
          weakAreas,
        }),
      });
      setError(false);
    } catch (e) {
      console.error('Failed to load progress dashboard:', e);
      setError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (error) {
    return (
      <TabScreen scroll={false}>
        <ErrorState
          full
          title="Couldn't load your dashboard"
          onRetry={load}
        />
      </TabScreen>
    );
  }

  if (!data) {
    return (
      <TabScreen scroll={false}>
        <LoadingState full message="Loading your progress..." />
      </TabScreen>
    );
  }

  const { progression, progress, overall, topicMastery, weakAreas, recent, insights } = data;
  const active = hasLearningActivity(data);
  const weakTopicIds = new Set(
    weakAreas.filter((a) => a.kind === 'topic').map((a) => a.targetId)
  );
  const levelTitle = titleForLevel(progression.level);

  return (
    <TabScreen>
      {/* Identity */}
      <SectionHeader
        title="Progress"
        subtitle="Your learning dashboard, stats and preferences."
        icon="stats-chart"
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
              Level {progression.level} · {levelTitle}
            </AppText>
          </View>
        </Card>

        <Card>
          <View style={styles.levelRow}>
            <AppText variant="h3">Level {progression.level}</AppText>
            <AppText variant="caption" muted>
              {progression.levelProgress.xpIntoLevel} /{' '}
              {progression.levelProgress.xpRequiredForLevel} XP
            </AppText>
          </View>
          <View style={styles.levelBar}>
            <ProgressBar progress={progression.levelProgress.percentage} />
          </View>
          <AppText variant="caption" muted style={styles.levelHint}>
            {progression.xpToNextLevel > 0
              ? `${progression.xpToNextLevel} XP to Level ${progression.level + 1}`
              : 'Top level reached'}
          </AppText>

          <View style={styles.streakRow}>
            <MiniStat
              icon="flame"
              color={colors.status.warning}
              value={`${progression.currentStreak}`}
              label="Day streak"
            />
            <MiniStat
              icon="trophy"
              color={colors.status.info}
              value={`${progression.longestStreak}`}
              label="Longest"
            />
            <MiniStat
              icon={
                progression.hasActivityToday
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              color={
                progression.hasActivityToday
                  ? colors.status.success
                  : colors.text.muted
              }
              value={progression.hasActivityToday ? 'Yes' : 'No'}
              label="Studied today"
            />
          </View>
        </Card>
      </View>

      {!active ? (
        <View style={styles.section}>
          <Card>
            <EmptyState
              icon="sparkles-outline"
              title="Start your first lesson"
              message="Complete a lesson, solve a problem or take on a challenge — your progress, streaks and insights will appear here."
            />
            <Button
              title="Start learning"
              onPress={() => router.push('/learn')}
            />
          </Card>
        </View>
      ) : (
        <>
          {/* Overview */}
          <View style={styles.section}>
            <SectionHeader title="Overview" icon="analytics-outline" />

            <View style={styles.grid}>
              <StatTile
                icon="book"
                color={colors.status.info}
                value={`${progress.completedLessons}/${progress.totalLessons}`}
                label="Lessons done"
              />
              <StatTile
                icon="grid-outline"
                color={colors.accent.primary}
                value={progress.solvedProblems}
                label="Problems solved"
              />
              <StatTile
                icon="code-slash"
                color={colors.accent.secondary}
                value={progress.completedChallenges}
                label="Challenges done"
              />
              <StatTile
                icon="checkmark-circle"
                color={colors.status.success}
                value={`${Math.round(progress.successRate)}%`}
                label="Success rate"
              />
            </View>
          </View>

          {/* Mastery */}
          <View style={styles.section}>
            <SectionHeader title="Mastery" icon="speedometer-outline" />
            <Card>
              <View style={styles.masteryHeader}>
                <AppText variant="body">Overall mastery</AppText>
                <AppText variant="body" style={{ color: colors.accent.primary }}>
                  {overall.score}%
                </AppText>
              </View>
              <View style={styles.masteryBar}>
                <ProgressBar progress={overall.score / 100} />
              </View>
              {overall.strongestTopic ? (
                <View style={styles.masteryRow}>
                  <Ionicons
                    name="trending-up"
                    size={16}
                    color={colors.status.success}
                  />
                  <AppText variant="bodySmall" style={styles.flex} numberOfLines={1}>
                    {overall.strongestTopic.topicName}
                  </AppText>
                  <AppText variant="bodySmall" style={{ color: colors.status.success }}>
                    {overall.strongestTopic.masteryScore}%
                  </AppText>
                </View>
              ) : null}
              {overall.weakestTopic ? (
                <View style={styles.masteryRow}>
                  <Ionicons
                    name="trending-down"
                    size={16}
                    color={colors.status.error}
                  />
                  <AppText variant="bodySmall" style={styles.flex} numberOfLines={1}>
                    {overall.weakestTopic.topicName}
                  </AppText>
                  <AppText variant="bodySmall" style={{ color: colors.status.error }}>
                    {overall.weakestTopic.masteryScore}%
                  </AppText>
                </View>
              ) : null}
            </Card>
          </View>

          {/* Topic progress */}
          <View style={styles.section}>
            <SectionHeader
              title="Topic progress"
              subtitle="Mastery and completion per topic."
              icon="layers-outline"
            />
            <Card>
              {topicMastery.length === 0 ? (
                <AppText variant="bodySmall" muted>
                  No topics found.
                </AppText>
              ) : (
                <View style={styles.topicList}>
                  {topicMastery.map((topic) => {
                    const badge = topicBadge(topic, weakTopicIds);
                    return (
                      <View key={topic.topicId} style={styles.topicRow}>
                        <View style={styles.topicNameRow}>
                          <AppText variant="bodySmall" style={styles.flex} numberOfLines={2}>
                            {topic.topicName}
                          </AppText>
                          <AppText variant="bodySmall">
                            {topic.masteryScore}%
                          </AppText>
                        </View>
                        <View style={styles.topicBar}>
                          <ProgressBar progress={topicCompletion(topic)} />
                        </View>
                        <View style={styles.topicMetaRow}>
                          <AppText variant="caption" muted>
                            {topic.lessonsCompleted}/{topic.lessonsTotal} lessons
                          </AppText>
                          <Badge label={badge.label} variant={badge.variant} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </View>

          {/* Insights */}
          {insights.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Insights"
                subtitle="What the data says about your learning."
                icon="bulb-outline"
              />
              <Card>
                <View style={styles.insightList}>
                  {insights.map((insight) => (
                    <View key={insight.id} style={styles.insightRow}>
                      <Ionicons
                        name="sparkles"
                        size={15}
                        color={colors.accent.secondary}
                      />
                      <AppText variant="bodySmall" style={styles.flex}>
                        {insight.text}
                      </AppText>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          ) : null}

          {/* Recent activity */}
          <View style={styles.section}>
            <SectionHeader
              title="Recent activity"
              subtitle="Your latest completed lessons and attempts."
              icon="time-outline"
            />
            <Card>
              {recent.length === 0 ? (
                <AppText variant="bodySmall" muted>
                  Nothing yet — your latest activity will appear here.
                </AppText>
              ) : (
                <View style={styles.activityList}>
                  {recent.map((item) => (
                    <View key={item.id} style={styles.activityRow}>
                      <Ionicons
                        name={iconForActivity(item.kind)}
                        size={19}
                        color={
                          item.success
                            ? colors.status.success
                            : colors.text.muted
                        }
                      />
                      <View style={styles.flex}>
                        <AppText variant="bodySmall" numberOfLines={1}>
                          {item.title}
                        </AppText>
                        <AppText variant="caption" muted>
                          {relativeActivityTime(item.attemptedAt)}
                        </AppText>
                      </View>
                      <Ionicons
                        name={
                          item.success ? 'checkmark-circle' : 'close-circle'
                        }
                        size={18}
                        color={
                          item.success
                            ? colors.status.success
                            : colors.text.muted
                        }
                      />
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </View>
        </>
      )}

      {/* Settings & Updates */}
      <View style={styles.section}>
        <SectionHeader title="Settings & Updates" icon="settings-outline" />
        <AppearanceSettings />
        <GitHubSettings />
        <AppUpdateSettings />
      </View>
    </TabScreen>
  );
}

function GitHubSettings() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Card onPress={() => router.push('/github')}>
      <View style={[styles.githubRow, { borderColor: colors.border.default }]}>
        <View style={styles.githubIcon}>
          <Ionicons name="logo-github" size={22} color={colors.accent.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="h3">GitHub</AppText>
          <AppText variant="caption" muted>
            Connect, sync &amp; browse your activity offline
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
      </View>
    </Card>
  );
}

function AppUpdateSettings() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [info, setInfo] = useState<ReleaseInfo | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await checkAppUpdates();
      setInfo(res);
      setChecked(true);
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!info) return;
    setDownloading(true);
    try {
      const ok = await openDownloadUrl(info.downloadUrl, info.htmlUrl);
      if (!ok) {
        Alert.alert(
          'Download APK',
          'Could not automatically start download. Please visit GitHub Releases to download the APK.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open GitHub', onPress: () => openDownloadUrl(info.htmlUrl) },
          ]
        );
      }
    } catch {
      Alert.alert('Error', 'Unable to open download URL.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <View style={styles.topicHeader}>
        <Ionicons
          name="cloud-download-outline"
          size={18}
          color={colors.accent.secondary}
        />
        <AppText variant="h3">App &amp; Updates</AppText>
      </View>

      <View style={styles.updateContainer}>
        <View style={styles.versionRow}>
          <View style={styles.flex}>
            <AppText variant="body">Coding Coach</AppText>
            <AppText variant="caption" muted>
              Current Version: v{info?.currentVersion ?? '1.0.2'}
            </AppText>
          </View>
          <Button
            title={checking ? 'Checking...' : 'Check for Updates'}
            variant="secondary"
            loading={checking}
            disabled={checking}
            onPress={handleCheck}
          />
        </View>

        {checked && info && (
          <View style={styles.updateResult}>
            {info.hasUpdate ? (
              <View style={[styles.updateCard, { borderColor: colors.status.success }]}>
                <View style={styles.updateHeader}>
                  <Ionicons
                    name="arrow-up-circle"
                    size={24}
                    color={colors.status.success}
                  />
                  <View style={styles.flex}>
                    <AppText variant="h3">
                      {info.releaseName || `Version ${info.latestVersion} Available`}
                    </AppText>
                    {info.publishedAt && (
                      <AppText variant="caption" muted>
                        Released: {new Date(info.publishedAt).toLocaleDateString()}
                      </AppText>
                    )}
                  </View>
                  <Badge label="NEW" variant="success" />
                </View>

                {info.releaseNotes ? (
                  <View style={styles.notesContainer}>
                    <AppText variant="caption" style={{ fontWeight: '700', color: colors.text.primary, marginBottom: 4 }}>
                      Release Highlights
                    </AppText>
                    <AppText variant="bodySmall" muted style={styles.releaseNotes}>
                      {info.releaseNotes}
                    </AppText>
                  </View>
                ) : null}

                <View style={styles.updateActions}>
                  <Button
                    title={downloading ? 'Starting download...' : `Download & Install APK (v${info.latestVersion})`}
                    variant="success"
                    loading={downloading}
                    disabled={downloading}
                    onPress={handleDownload}
                  />

                  {info.changelogUrl ? (
                    <Pressable
                      style={styles.changelogLink}
                      onPress={() => openDownloadUrl(info.changelogUrl)}
                      accessibilityRole="button"
                    >
                      <Ionicons name="open-outline" size={14} color={colors.accent.primary} />
                      <AppText variant="caption" style={{ color: colors.accent.primary, fontWeight: '600' }}>
                        View Full Changelog on GitHub
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={styles.upToDateContainer}>
                <View style={styles.upToDateRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.status.success}
                  />
                  <AppText variant="bodySmall" muted>
                    You're on the latest version (v{info.currentVersion}).
                  </AppText>
                </View>

                {info.htmlUrl ? (
                  <Pressable
                    style={styles.changelogLink}
                    onPress={() => openDownloadUrl(info.htmlUrl)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="logo-github" size={14} color={colors.text.muted} />
                    <AppText variant="caption" muted>
                      View GitHub Releases
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        )}
      </View>
    </Card>
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
  value: string | number;
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

function MiniStat({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string | number;
  label: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={18} color={color} />
      <AppText variant="h3">{value}</AppText>
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </View>
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

    levelHint: {
      marginTop: spacing.sm,
    },

    streakRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },

    miniStat: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
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

    masteryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    masteryBar: {
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },

    masteryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },

    topicHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },

    topicList: {
      gap: spacing.md,
    },

    topicRow: {
      gap: spacing.xs,
    },

    topicNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    topicBar: {
      marginTop: spacing.xs,
    },

    topicMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },

    insightList: {
      gap: spacing.md,
    },

    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },

    activityList: {
      gap: spacing.md,
    },

    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    flex: {
      flex: 1,
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

    githubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderTopWidth: 1,
      paddingTop: spacing.md,
    },

    githubIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },

    updateContainer: {
      gap: spacing.md,
      paddingTop: spacing.xs,
    },

    versionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },

    updateResult: {
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },

    updateCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
    },

    updateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    notesContainer: {
      padding: spacing.sm,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.sm,
    },

    releaseNotes: {
      lineHeight: 20,
    },

    updateActions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },

    changelogLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },

    upToDateContainer: {
      gap: spacing.xs,
    },

    upToDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}