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
  shadows,
  spacing,
  typography,
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
  if (level >= 10) return 'Senior Software Engineer';
  if (level >= 7) return 'Master Developer';
  if (level >= 5) return 'Proficient Builder';
  if (level >= 3) return 'Rising Learner';
  return 'Code Explorer';
}

const RECENT_ACTIVITY_LIMIT = 10;

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

type ProfileTab = 'mastery' | 'insights' | 'settings';

const PROFILE_TABS: Array<{
  id: ProfileTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'mastery', label: 'Mastery & Stats', icon: 'speedometer-outline' },
  { id: 'insights', label: 'Insights & History', icon: 'bulb-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];

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
    return { label: 'Needs Practice', variant: 'error' };
  }
  if (topic.level === 'mastered' || topic.level === 'proficient') {
    return { label: 'Strong', variant: 'success' };
  }
  if (topic.masteryScore > 0) {
    return { label: 'In Progress', variant: 'warning' };
  }
  return { label: 'Not Started', variant: 'default' };
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
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

const APPEARANCE_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { mode: 'light', label: 'Light Theme', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark Theme', icon: 'moon-outline' },
  { mode: 'system', label: 'System Default', icon: 'phone-portrait-outline' },
];

export default function ProgressScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [activeTab, setActiveTab] = useState<ProfileTab>('mastery');
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
          title="Couldn't load your profile"
          onRetry={load}
        />
      </TabScreen>
    );
  }

  if (!data) {
    return (
      <TabScreen scroll={false}>
        <LoadingState full message="Loading your dashboard..." />
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
      {/* Top Header */}
      <SectionHeader
        title="Profile & Dashboard"
        subtitle="Track your XP, mastery growth and learning activity."
        icon="person-circle-outline"
      />

      {/* Hero Profile Card */}
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <AppText variant="h1" style={styles.avatarText}>
                {LOCAL_PROFILE_NAME.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <AppText variant="h1">{LOCAL_PROFILE_NAME}</AppText>
              <Badge
                label={`Level ${progression.level}`}
                variant="success"
              />
            </View>
            <AppText variant="bodySmall" style={styles.levelTitleText}>
              {levelTitle}
            </AppText>
            <AppText variant="caption" muted>
              Total {progression.totalXP} XP Earned
            </AppText>
          </View>
        </View>

        {/* Level XP Progress Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpMeta}>
            <AppText variant="caption" style={{ fontWeight: '600', color: colors.text.primary }}>
              Level {progression.level} Progress
            </AppText>
            <AppText variant="caption" muted>
              {progression.levelProgress.xpIntoLevel} /{' '}
              {progression.levelProgress.xpRequiredForLevel} XP
            </AppText>
          </View>
          <ProgressBar progress={progression.levelProgress.percentage} />
          <AppText variant="caption" muted style={styles.xpHint}>
            {progression.xpToNextLevel > 0
              ? `${progression.xpToNextLevel} XP to reach Level ${progression.level + 1}`
              : 'Top tier achieved!'}
          </AppText>
        </View>

        {/* Quick Mini Badges */}
        <View style={styles.miniBadgesRow}>
          <View style={styles.miniBadgeItem}>
            <Ionicons name="flame" size={16} color={colors.status.warning} />
            <AppText variant="caption" style={styles.miniBadgeValue}>
              {progression.currentStreak}d Streak
            </AppText>
          </View>
          <View style={styles.miniBadgeDivider} />
          <View style={styles.miniBadgeItem}>
            <Ionicons name="trophy" size={16} color={colors.status.info} />
            <AppText variant="caption" style={styles.miniBadgeValue}>
              {progression.longestStreak}d Best
            </AppText>
          </View>
          <View style={styles.miniBadgeDivider} />
          <View style={styles.miniBadgeItem}>
            <Ionicons
              name={progression.hasActivityToday ? 'checkmark-circle' : 'time-outline'}
              size={16}
              color={progression.hasActivityToday ? colors.status.success : colors.text.muted}
            />
            <AppText variant="caption" style={styles.miniBadgeValue}>
              {progression.hasActivityToday ? 'Active Today' : 'Pending'}
            </AppText>
          </View>
        </View>
      </Card>

      {/* Segmented Sub-Tab Switcher */}
      <View style={styles.tabSwitcher}>
        {PROFILE_TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tabBtn,
                isSelected && styles.tabBtnActive,
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isSelected ? colors.accent.primary : colors.text.muted}
              />
              <AppText
                variant="bodySmall"
                style={[
                  styles.tabBtnText,
                  isSelected && styles.tabBtnTextActive,
                ]}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Tab 1: Mastery & Stats */}
      {activeTab === 'mastery' && (
        <View style={styles.tabContent}>
          {/* Quick 2x2 Stats Grid */}
          <View style={styles.grid}>
            <StatTile
              icon="book-outline"
              color={colors.status.info}
              value={`${progress.completedLessons}/${progress.totalLessons}`}
              label="Lessons Done"
            />
            <StatTile
              icon="checkmark-done-circle-outline"
              color={colors.accent.primary}
              value={progress.solvedProblems}
              label="Problems Solved"
            />
            <StatTile
              icon="code-slash-outline"
              color={colors.accent.secondary}
              value={progress.completedChallenges}
              label="Challenges Done"
            />
            <StatTile
              icon="pie-chart-outline"
              color={colors.status.success}
              value={`${Math.round(progress.successRate)}%`}
              label="Accuracy Rate"
            />
          </View>

          {/* Overall Mastery Gauge */}
          <Card style={styles.masteryCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="speedometer-outline" size={20} color={colors.accent.primary} />
              <AppText variant="h3" style={styles.flex}>
                Overall Mastery Score
              </AppText>
              <AppText variant="h2" style={{ color: colors.accent.primary }}>
                {overall.score}%
              </AppText>
            </View>

            <View style={styles.masteryBar}>
              <ProgressBar progress={overall.score / 100} />
            </View>

            <View style={styles.topicHighlights}>
              {overall.strongestTopic ? (
                <View style={styles.highlightItem}>
                  <Ionicons name="trending-up" size={16} color={colors.status.success} />
                  <View style={styles.flex}>
                    <AppText variant="caption" muted>
                      Strongest Area
                    </AppText>
                    <AppText variant="bodySmall" numberOfLines={1}>
                      {overall.strongestTopic.topicName} ({overall.strongestTopic.masteryScore}%)
                    </AppText>
                  </View>
                </View>
              ) : null}

              {overall.weakestTopic ? (
                <View style={styles.highlightItem}>
                  <Ionicons name="trending-down" size={16} color={colors.status.warning} />
                  <View style={styles.flex}>
                    <AppText variant="caption" muted>
                      Focus Area
                    </AppText>
                    <AppText variant="bodySmall" numberOfLines={1}>
                      {overall.weakestTopic.topicName} ({overall.weakestTopic.masteryScore}%)
                    </AppText>
                  </View>
                </View>
              ) : null}
            </View>
          </Card>

          {/* Topic Progress List */}
          <Card>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="layers-outline" size={18} color={colors.accent.secondary} />
              <AppText variant="h3" style={styles.flex}>
                Topic Mastery Breakdown
              </AppText>
            </View>

            {topicMastery.length === 0 ? (
              <AppText variant="bodySmall" muted style={{ marginTop: spacing.sm }}>
                Start your first topic in the Learn tab to track mastery breakdown.
              </AppText>
            ) : (
              <View style={styles.topicList}>
                {topicMastery.map((topic) => {
                  const badge = topicBadge(topic, weakTopicIds);
                  return (
                    <View key={topic.topicId} style={styles.topicRow}>
                      <View style={styles.topicNameRow}>
                        <AppText variant="bodySmall" style={[styles.flex, { fontWeight: '600' }]} numberOfLines={1}>
                          {topic.topicName}
                        </AppText>
                        <Badge label={badge.label} variant={badge.variant} />
                      </View>

                      <View style={styles.topicBar}>
                        <ProgressBar progress={topicCompletion(topic)} />
                      </View>

                      <View style={styles.topicMetaRow}>
                        <AppText variant="caption" muted>
                          {topic.lessonsCompleted} of {topic.lessonsTotal} lessons
                        </AppText>
                        <AppText variant="caption" style={{ color: colors.accent.primary, fontWeight: '600' }}>
                          {topic.masteryScore}% Mastery
                        </AppText>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        </View>
      )}

      {/* Tab 2: Insights & History */}
      {activeTab === 'insights' && (
        <View style={styles.tabContent}>
          {/* AI Learning Insights */}
          <Card>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="bulb-outline" size={20} color={colors.accent.primary} />
              <AppText variant="h3" style={styles.flex}>
                AI Coach Insights
              </AppText>
            </View>

            {insights.length === 0 ? (
              <AppText variant="bodySmall" muted style={{ marginTop: spacing.sm }}>
                Complete a few lessons or challenges to generate personalized coach insights.
              </AppText>
            ) : (
              <View style={styles.insightList}>
                {insights.map((insight) => (
                  <View key={insight.id} style={styles.insightRow}>
                    <View style={styles.insightIconBox}>
                      <Ionicons name="sparkles" size={14} color={colors.accent.primary} />
                    </View>
                    <AppText variant="bodySmall" style={styles.insightText}>
                      {insight.text}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Recent Activity Timeline */}
          <Card>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="time-outline" size={20} color={colors.accent.secondary} />
              <AppText variant="h3" style={styles.flex}>
                Recent Learning Activity
              </AppText>
            </View>

            {recent.length === 0 ? (
              <AppText variant="bodySmall" muted style={{ marginTop: spacing.sm }}>
                No recent activity recorded yet.
              </AppText>
            ) : (
              <View style={styles.activityList}>
                {recent.map((item) => (
                  <View key={item.id} style={styles.activityRow}>
                    <View
                      style={[
                        styles.activityIconBox,
                        {
                          backgroundColor: item.success
                            ? hexWithAlpha(colors.status.success, 0.12)
                            : hexWithAlpha(colors.text.muted, 0.12),
                        },
                      ]}
                    >
                      <Ionicons
                        name={iconForActivity(item.kind)}
                        size={18}
                        color={item.success ? colors.status.success : colors.text.muted}
                      />
                    </View>

                    <View style={styles.flex}>
                      <AppText variant="bodySmall" style={{ fontWeight: '600' }} numberOfLines={1}>
                        {item.title}
                      </AppText>
                      <AppText variant="caption" muted>
                        {item.kind.toUpperCase()} · {relativeActivityTime(item.attemptedAt)}
                      </AppText>
                    </View>

                    <Ionicons
                      name={item.success ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={item.success ? colors.status.success : colors.text.muted}
                    />
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      )}

      {/* Tab 3: Settings & Updates */}
      {activeTab === 'settings' && (
        <View style={styles.tabContent}>
          <AppearanceSettings />
          <GitHubSettings />
          <AppUpdateSettings />
        </View>
      )}
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
  value: string | number;
  label: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Card style={styles.tile}>
      <View style={[styles.tileIconBox, { backgroundColor: hexWithAlpha(color, 0.12) }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </Card>
  );
}

function AppearanceSettings() {
  const { colors, mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Card>
      <View style={styles.cardHeaderRow}>
        <Ionicons
          name="color-palette-outline"
          size={18}
          color={colors.accent.secondary}
        />
        <AppText variant="h3">App Appearance</AppText>
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
                active && styles.settingRowActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={active ? colors.accent.primary : colors.text.muted}
              />
              <AppText
                style={[
                  styles.flex,
                  active && { color: colors.accent.primary, fontWeight: '600' },
                ]}
              >
                {option.label}
              </AppText>
              {active && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
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

function GitHubSettings() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Card onPress={() => router.push('/github')}>
      <View style={styles.githubRow}>
        <View style={styles.githubIcon}>
          <Ionicons name="logo-github" size={22} color={colors.accent.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="h3">GitHub Offline &amp; Sync</AppText>
          <AppText variant="caption" muted>
            Connect account, sync repositories &amp; backup progress
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
      <View style={styles.cardHeaderRow}>
        <Ionicons
          name="cloud-download-outline"
          size={18}
          color={colors.accent.secondary}
        />
        <AppText variant="h3">App Version &amp; Updates</AppText>
      </View>

      <View style={styles.updateContainer}>
        <View style={styles.versionRow}>
          <View style={styles.flex}>
            <AppText variant="body" style={{ fontWeight: '600' }}>
              Coding Coach
            </AppText>
            <AppText variant="caption" muted>
              Current Version: v{info?.currentVersion ?? '1.0.2'}
            </AppText>
          </View>
          <Button
            title={checking ? 'Checking...' : 'Check Updates'}
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
                    title={downloading ? 'Starting download...' : `Download APK (v${info.latestVersion})`}
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
                    You are on the latest version (v{info.currentVersion}).
                  </AppText>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    heroCard: {
      gap: spacing.md,
      marginTop: spacing.xs,
    },

    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    avatarContainer: {
      position: 'relative',
    },

    avatar: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.16),
      borderWidth: 2,
      borderColor: colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      color: colors.accent.primary,
      fontWeight: '700',
    },

    onlineBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: radius.full,
      backgroundColor: colors.status.success,
      borderWidth: 2,
      borderColor: colors.surface.primary,
    },

    heroInfo: {
      flex: 1,
      gap: 2,
    },

    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    levelTitleText: {
      color: colors.accent.secondary,
      fontWeight: '600',
    },

    xpSection: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },

    xpMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    xpHint: {
      marginTop: 2,
    },

    miniBadgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: hexWithAlpha(colors.border.default, 0.6),
    },

    miniBadgeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    miniBadgeDivider: {
      width: 1,
      height: 16,
      backgroundColor: colors.border.default,
    },

    miniBadgeValue: {
      fontWeight: '600',
      color: colors.text.secondary,
    },

    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.lg,
      padding: 4,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      gap: 4,
    },

    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },

    tabBtnActive: {
      backgroundColor: colors.surface.primary,
      ...shadows.small,
    },

    tabBtnText: {
      fontSize: 12,
      color: colors.text.muted,
      fontWeight: '600',
    },

    tabBtnTextActive: {
      color: colors.text.primary,
      fontWeight: '700',
    },

    tabContent: {
      gap: spacing.md,
    },

    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
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
      padding: spacing.md,
    },

    tileIconBox: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },

    masteryCard: {
      gap: spacing.sm,
    },

    masteryBar: {
      marginVertical: spacing.xs,
    },

    topicHighlights: {
      gap: spacing.sm,
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: hexWithAlpha(colors.border.default, 0.6),
    },

    highlightItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    topicList: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },

    topicRow: {
      gap: 4,
    },

    topicNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    topicBar: {
      marginTop: 2,
    },

    topicMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },

    insightList: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },

    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: 2,
    },

    insightIconBox: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.accent.soft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },

    insightText: {
      flex: 1,
      lineHeight: 19,
    },

    activityList: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },

    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 4,
    },

    activityIconBox: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    settingList: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
    },

    settingRowActive: {
      backgroundColor: colors.surface.secondary,
    },

    githubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    githubIcon: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },

    updateContainer: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },

    versionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },

    updateResult: {
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
      paddingTop: spacing.xs,
    },

    upToDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    flex: {
      flex: 1,
    },
  });