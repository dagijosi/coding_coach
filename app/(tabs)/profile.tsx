import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
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
  useTheme,
  useThemedStyles,
  type ThemeColors,
  type ThemeMode,
} from '@/theme';
import {
  checkAppUpdates,
  downloadAndInstallApk,
  getCurrentAppVersion,
  installDownloadedApk,
  openDownloadUrl,
  pauseActiveDownload,
  resumeActiveDownload,
  type DownloadProgress,
  type ReleaseInfo,
} from '@/services/updateService';
import {
  getNotificationPreferences,
  getSystemNotificationPermissionStatus,
  requestSystemNotificationPermission,
  saveNotificationPreferences,
  type NotificationPreferences,
  type PermissionStatus,
} from '@/services/permissionService';
import {
  scheduleDailyStudyReminder,
  sendTestNotification,
} from '@/services/notificationService';

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
        <HeaderHero />
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
        <HeaderHero />
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
      {/* Modern Hero Header */}
      <HeaderHero />

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
            <Ionicons name="flame" size={17} color={colors.status.warning} />
            <AppText variant="caption" style={styles.miniBadgeValue}>
              {progression.currentStreak}d Streak
            </AppText>
          </View>
          <View style={styles.miniBadgeDivider} />
          <View style={styles.miniBadgeItem}>
            <Ionicons name="trophy" size={17} color={colors.status.info} />
            <AppText variant="caption" style={styles.miniBadgeValue}>
              {progression.longestStreak}d Best
            </AppText>
          </View>
          <View style={styles.miniBadgeDivider} />
          <View style={styles.miniBadgeItem}>
            <Ionicons
              name={progression.hasActivityToday ? 'checkmark-circle' : 'time-outline'}
              size={17}
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
                  <Ionicons name="trending-up" size={17} color={colors.status.success} />
                  <View style={styles.flex}>
                    <AppText variant="caption" muted>
                      Strongest Area
                    </AppText>
                    <AppText variant="bodySmall" style={{ fontWeight: '600' }} numberOfLines={1}>
                      {overall.strongestTopic.topicName} ({overall.strongestTopic.masteryScore}%)
                    </AppText>
                  </View>
                </View>
              ) : null}

              {overall.weakestTopic ? (
                <View style={styles.highlightItem}>
                  <Ionicons name="trending-down" size={17} color={colors.status.warning} />
                  <View style={styles.flex}>
                    <AppText variant="caption" muted>
                      Focus Area
                    </AppText>
                    <AppText variant="bodySmall" style={{ fontWeight: '600' }} numberOfLines={1}>
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
              <Ionicons name="layers-outline" size={19} color={colors.accent.secondary} />
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
                        <AppText variant="caption" style={{ color: colors.accent.primary, fontWeight: '700' }}>
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
          <NotificationPermissionSettings />
          <GitHubSettings />
          <AppUpdateSettings />
        </View>
      )}
    </TabScreen>
  );
}

function HeaderHero() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.heroHeader}>
      <View style={styles.heroHeaderBadge}>
        <Ionicons name="person-circle" size={13} color={colors.accent.primary} />
        <AppText variant="caption" style={styles.heroBadgeText}>
          DEVELOPER PROFILE
        </AppText>
      </View>
      <AppText variant="h1" style={styles.heroTitle}>
        Your Profile &amp; Stats
      </AppText>
      <AppText variant="bodySmall" muted style={styles.heroSubtitle}>
        Track your XP growth, mastery analytics, and update preferences.
      </AppText>
    </View>
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
                size={19}
                color={active ? colors.accent.primary : colors.text.muted}
              />
              <AppText
                style={[
                  styles.flex,
                  active && { color: colors.accent.primary, fontWeight: '700' },
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

function NotificationPermissionSettings() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [permStatus, setPermStatus] = useState<PermissionStatus>('undetermined');
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    notificationsEnabled: false,
    dailyReminderEnabled: true,
    dailyReminderHour: 19,
    dailyReminderMinute: 0,
    streakAlertsEnabled: true,
    updateAlertsEnabled: true,
    lastPromptedAt: null,
    permissionPromptCount: 0,
  });
  const [requesting, setRequesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadData = useCallback(async () => {
    const status = await getSystemNotificationPermissionStatus();
    setPermStatus(status);
    const p = await getNotificationPreferences();
    setPrefs(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRequestPermission = async () => {
    setRequesting(true);
    setTestResult(null);
    try {
      const res = await requestSystemNotificationPermission();
      setPermStatus(res.status);
      setPrefs((prev) => ({ ...prev, notificationsEnabled: res.granted }));
      if (res.granted) {
        await scheduleDailyStudyReminder();
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleToggleDailyReminder = async (value: boolean) => {
    const updated = await saveNotificationPreferences({ dailyReminderEnabled: value });
    setPrefs(updated);
    if (value && permStatus === 'granted') {
      await scheduleDailyStudyReminder();
    }
  };

  const handleToggleStreakAlerts = async (value: boolean) => {
    const updated = await saveNotificationPreferences({ streakAlertsEnabled: value });
    setPrefs(updated);
  };

  const handleToggleUpdateAlerts = async (value: boolean) => {
    const updated = await saveNotificationPreferences({ updateAlertsEnabled: value });
    setPrefs(updated);
  };

  const handleSendTest = async () => {
    setTestResult(null);
    const res = await sendTestNotification();
    setTestResult(res);
    const status = await getSystemNotificationPermissionStatus();
    setPermStatus(status);
  };

  const isGranted = permStatus === 'granted';

  return (
    <Card>
      <View style={styles.cardHeaderRow}>
        <Ionicons name="notifications-outline" size={18} color={colors.accent.primary} />
        <AppText variant="h3" style={styles.flex}>
          Notifications &amp; Permissions
        </AppText>
        <Badge
          label={isGranted ? 'ENABLED' : permStatus === 'denied' ? 'DENIED' : 'NOT SET'}
          variant={isGranted ? 'success' : permStatus === 'denied' ? 'error' : 'warning'}
        />
      </View>

      <View style={styles.notifContainer}>
        <AppText variant="bodySmall" muted>
          Configure daily learning reminders, streak protection alerts, and app release updates.
        </AppText>

        {!isGranted && (
          <View style={styles.permPromptCard}>
            <View style={styles.permPromptHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent.primary} />
              <View style={styles.flex}>
                <AppText variant="bodySmall" style={{ fontWeight: '700' }}>
                  Enable Study Reminders
                </AppText>
                <AppText variant="caption" muted>
                  Allow notification permission to receive your daily practice prompts.
                </AppText>
              </View>
            </View>
            <Button
              title={requesting ? 'Requesting...' : 'Grant Notification Permission'}
              loading={requesting}
              onPress={handleRequestPermission}
            />
          </View>
        )}

        {/* Toggles */}
        <View style={styles.notifTogglesList}>
          <View style={styles.notifToggleRow}>
            <View style={styles.flex}>
              <AppText variant="bodySmall" style={{ fontWeight: '600' }}>
                Daily Study Reminder (7:00 PM)
              </AppText>
              <AppText variant="caption" muted>
                Prompt to solve 1 interactive challenge per day
              </AppText>
            </View>
            <Switch
              value={prefs.dailyReminderEnabled}
              onValueChange={handleToggleDailyReminder}
              trackColor={{ false: colors.border.default, true: colors.accent.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.notifToggleRow}>
            <View style={styles.flex}>
              <AppText variant="bodySmall" style={{ fontWeight: '600' }}>
                Streak Saver Alerts
              </AppText>
              <AppText variant="caption" muted>
                Alert in the evening if your streak is at risk
              </AppText>
            </View>
            <Switch
              value={prefs.streakAlertsEnabled}
              onValueChange={handleToggleStreakAlerts}
              trackColor={{ false: colors.border.default, true: colors.accent.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.notifToggleRow}>
            <View style={styles.flex}>
              <AppText variant="bodySmall" style={{ fontWeight: '600' }}>
                New Updates &amp; Lessons
              </AppText>
              <AppText variant="caption" muted>
                Notify when new features or lessons become available
              </AppText>
            </View>
            <Switch
              value={prefs.updateAlertsEnabled}
              onValueChange={handleToggleUpdateAlerts}
              trackColor={{ false: colors.border.default, true: colors.accent.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Test Notification Button */}
        <View style={styles.notifTestSection}>
          <Button
            title="Send Test Notification"
            variant="secondary"
            onPress={handleSendTest}
          />
          {testResult && (
            <View
              style={[
                styles.testResultBox,
                {
                  backgroundColor: testResult.success
                    ? hexWithAlpha(colors.status.success, 0.1)
                    : hexWithAlpha(colors.status.error, 0.1),
                  borderColor: testResult.success
                    ? hexWithAlpha(colors.status.success, 0.4)
                    : hexWithAlpha(colors.status.error, 0.4),
                },
              ]}
            >
              <Ionicons
                name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={testResult.success ? colors.status.success : colors.status.error}
              />
              <AppText
                variant="caption"
                style={{
                  color: testResult.success ? colors.status.success : colors.status.error,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                {testResult.message}
              </AppText>
            </View>
          )}
        </View>
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
  const [isPaused, setIsPaused] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [info, setInfo] = useState<ReleaseInfo | null>(null);
  const [checked, setChecked] = useState(false);

  const currentVersion = getCurrentAppVersion();

  const handleCheck = async () => {
    setChecking(true);
    setDownloadError(null);
    try {
      const res = await checkAppUpdates();
      setInfo(res);
      setChecked(true);
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadAndInstall = async () => {
    if (!info?.downloadUrl) return;

    setDownloading(true);
    setIsPaused(false);
    setDownloadError(null);
    setDownloadComplete(false);
    setDownloadProgress({
      percent: 0,
      totalBytesWritten: 0,
      totalBytesExpectedToWrite: 0,
      formattedProgress: 'Starting resumable download...',
    });

    const res = await downloadAndInstallApk(info.downloadUrl, (progress) => {
      setDownloadProgress(progress);
    });

    setDownloading(false);

    if (res.success) {
      setDownloadComplete(true);
    } else {
      setDownloadError(res.error ?? 'Download paused or interrupted.');
    }
  };

  const handlePause = async () => {
    await pauseActiveDownload();
    setIsPaused(true);
  };

  const handleResume = async () => {
    setIsPaused(false);
    setDownloading(true);
    setDownloadError(null);
    const res = await resumeActiveDownload((progress) => {
      setDownloadProgress(progress);
    });
    setDownloading(false);
    if (res.success) {
      setDownloadComplete(true);
    } else {
      setDownloadError(res.error ?? 'Resume interrupted.');
    }
  };

  const handleReinstall = async () => {
    const res = await installDownloadedApk();
    if (!res.success) {
      setDownloadError(res.error ?? 'Could not launch package installer.');
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
              Current Version: v{currentVersion}
            </AppText>
          </View>
          <Button
            title={checking ? 'Checking...' : 'Check Updates'}
            variant="secondary"
            loading={checking}
            disabled={checking || downloading}
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

                {/* In-App Live Download Progress with Background Auto-Resume */}
                {downloading && (
                  <View style={styles.downloadProgressWrap}>
                    <View style={styles.downloadProgressHeader}>
                      <Ionicons name="cloud-download" size={16} color={colors.accent.primary} />
                      <AppText variant="bodySmall" style={{ fontWeight: '600', color: colors.accent.primary, flex: 1 }}>
                        {downloadProgress?.formattedProgress ?? 'Downloading APK...'}
                      </AppText>
                      <Pressable onPress={handlePause} style={{ padding: 4 }}>
                        <AppText variant="caption" style={{ color: colors.status.warning, fontWeight: '700' }}>
                          Pause
                        </AppText>
                      </Pressable>
                    </View>
                    <ProgressBar progress={downloadProgress?.percent ?? 0} />
                    <AppText variant="caption" muted style={{ fontSize: 10, marginTop: 3 }}>
                      ⚡ Background Auto-Resume Active: If you minimize the app, progress continues automatically upon return.
                    </AppText>
                  </View>
                )}

                {/* Paused State */}
                {isPaused && (
                  <View style={styles.downloadProgressWrap}>
                    <View style={styles.downloadProgressHeader}>
                      <Ionicons name="pause-circle" size={16} color={colors.status.warning} />
                      <AppText variant="bodySmall" style={{ fontWeight: '600', color: colors.status.warning, flex: 1 }}>
                        Download Paused at {downloadProgress?.formattedProgress ?? 'current progress'}
                      </AppText>
                      <Pressable onPress={handleResume} style={{ padding: 4 }}>
                        <AppText variant="caption" style={{ color: colors.status.success, fontWeight: '700' }}>
                          Resume
                        </AppText>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Download Complete Status */}
                {downloadComplete && (
                  <View style={styles.downloadCompleteCard}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.status.success} />
                    <AppText variant="bodySmall" style={{ color: colors.status.success, fontWeight: '600', flex: 1 }}>
                      APK downloaded! Installer opened.
                    </AppText>
                  </View>
                )}

                {/* Download Error / Interrupted */}
                {downloadError && (
                  <View style={styles.downloadErrorCard}>
                    <Ionicons name="alert-circle" size={18} color={colors.status.error} />
                    <AppText variant="caption" style={{ color: colors.status.error, flex: 1 }}>
                      {downloadError}
                    </AppText>
                  </View>
                )}

                <View style={styles.updateActions}>
                  {downloadComplete ? (
                    <Button
                      title="Install APK Now"
                      variant="success"
                      onPress={handleReinstall}
                    />
                  ) : isPaused ? (
                    <Button
                      title="Resume In-App Download"
                      variant="success"
                      onPress={handleResume}
                    />
                  ) : (
                    <Button
                      title={
                        downloading
                          ? `Downloading (${Math.round((downloadProgress?.percent ?? 0) * 100)}%)...`
                          : `Download & Update (v${info.latestVersion})`
                      }
                      variant="success"
                      loading={downloading}
                      disabled={downloading}
                      onPress={handleDownloadAndInstall}
                    />
                  )}

                  {/* Option 2: Download via System Manager in Notification Shade */}
                  {info.downloadUrl ? (
                    <Button
                      title="Download in Background (Notification Shade)"
                      variant="secondary"
                      onPress={() => openDownloadUrl(info.downloadUrl)}
                    />
                  ) : null}

                  <View style={styles.updateLinksRow}>
                    {info.changelogUrl ? (
                      <Pressable
                        style={styles.changelogLink}
                        onPress={() => openDownloadUrl(info.changelogUrl)}
                        accessibilityRole="button"
                      >
                        <Ionicons name="logo-github" size={13} color={colors.text.muted} />
                        <AppText variant="caption" muted>
                          View Full Changelog
                        </AppText>
                      </Pressable>
                    ) : null}
                  </View>
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
                    You are on the latest version (v{currentVersion}).
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

    heroCard: {
      gap: spacing.md,
      marginTop: spacing.xs,
      padding: spacing.lg,
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
      width: 66,
      height: 66,
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
      gap: 3,
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
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: hexWithAlpha(colors.border.default, 0.6),
    },

    miniBadgeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    miniBadgeDivider: {
      width: 1,
      height: 18,
      backgroundColor: colors.border.default,
    },

    miniBadgeValue: {
      fontWeight: '600',
      color: colors.text.secondary,
      fontSize: 12,
    },

    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.xl,
      padding: 4,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      gap: 4,
      ...shadows.small,
    },

    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
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
      width: 38,
      height: 38,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 3,
    },

    masteryCard: {
      gap: spacing.sm,
      padding: spacing.lg,
    },

    masteryBar: {
      marginVertical: spacing.xs,
    },

    topicHighlights: {
      gap: spacing.md,
      marginTop: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: hexWithAlpha(colors.border.default, 0.6),
    },

    highlightItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    topicList: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },

    topicRow: {
      gap: 6,
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
      gap: spacing.md,
      marginTop: spacing.sm,
    },

    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: 2,
    },

    insightIconBox: {
      width: 28,
      height: 28,
      borderRadius: radius.full,
      backgroundColor: colors.accent.soft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },

    insightText: {
      flex: 1,
      lineHeight: 20,
    },

    activityList: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },

    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 4,
    },

    activityIconBox: {
      width: 38,
      height: 38,
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
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
    },

    settingRowActive: {
      backgroundColor: colors.surface.secondary,
    },

    githubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.xs,
    },

    githubIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
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
      borderRadius: radius.lg,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
    },

    updateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    notesContainer: {
      padding: spacing.md,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.md,
    },

    releaseNotes: {
      lineHeight: 20,
    },

    downloadProgressWrap: {
      gap: spacing.xs,
      padding: spacing.md,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    downloadProgressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    downloadCompleteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: hexWithAlpha(colors.status.success, 0.1),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.status.success,
    },

    downloadErrorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: hexWithAlpha(colors.status.error, 0.1),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.status.error,
    },

    updateActions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },

    updateLinksRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
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

    notifContainer: {
      gap: spacing.md,
      marginTop: spacing.xs,
    },

    permPromptCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.08),
      borderWidth: 1,
      borderColor: hexWithAlpha(colors.accent.primary, 0.25),
      gap: spacing.sm,
    },

    permPromptHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    notifTogglesList: {
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
      paddingTop: spacing.sm,
    },

    notifToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },

    notifTestSection: {
      gap: spacing.xs,
      marginTop: spacing.xs,
    },

    testResultBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
    },

    flex: {
      flex: 1,
    },
  });