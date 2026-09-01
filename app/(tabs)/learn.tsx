import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
} from '@/components/ui';
import { TabScreen } from '@/components/navigation';

import { getCourses } from '@/repositories/courseRepository';
import { getTopicsByCourse } from '@/repositories/topicRepository';
import { getLessonsByTopic } from '@/repositories/lessonRepository';
import { getLessonProgressById } from '@/repositories/progressRepository';
import type { Course, Difficulty } from '@/types/learning';
import type { Lesson } from '@/types/lesson';
import type { LessonProgress } from '@/types/learning';

import {
  radius,
  shadows,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type TopicBundle = {
  id: string;
  name: string;
  description: string;
  order: number;
  lessons: Array<{ lesson: Lesson; progress: LessonProgress }>;
};

type CourseBundle = {
  course: Course;
  topics: TopicBundle[];
};

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

const DIFFICULTY_OPTIONS: Array<{ key: DifficultyFilter; label: string }> = [
  { key: 'all', label: 'All Levels' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

function iconForLanguage(lang: string): keyof typeof Ionicons.glyphMap {
  const l = lang.toLowerCase();
  if (l.includes('javascript') || l.includes('js')) return 'logo-javascript';
  if (l.includes('python') || l.includes('py')) return 'logo-python';
  if (l.includes('typescript') || l.includes('ts')) return 'code-slash-outline';
  return 'code-outline';
}

function difficultyVariant(diff: Difficulty) {
  if (diff === 'hard' || diff === 'advanced') return 'error' as const;
  if (diff === 'medium' || diff === 'intermediate') return 'warning' as const;
  return 'success' as const;
}

export default function LearnScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [courses, setCourses] = useState<CourseBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedTopics, setCollapsedTopics] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const allCourses = await getCourses();

      const bundles: CourseBundle[] = [];
      for (const course of allCourses) {
        const topics = await getTopicsByCourse(course.id);

        const topicBundles: TopicBundle[] = [];
        for (const topic of topics) {
          const lessons = await getLessonsByTopic(topic.id);
          const withProgress = await Promise.all(
            lessons.map(async (lesson) => ({
              lesson,
              progress: await getLessonProgressById(lesson.id),
            }))
          );
          topicBundles.push({
            id: topic.id,
            name: topic.name,
            description: topic.description,
            order: topic.order,
            lessons: withProgress,
          });
        }

        bundles.push({ course, topics: topicBundles });
      }

      setCourses(bundles);
      setError(false);
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
      load();
    }, [load])
  );

  const toggleTopicCollapse = (topicId: string) => {
    setCollapsedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const courseOptions = useMemo(() => {
    const totalLessons = courses.reduce(
      (acc, c) => acc + c.topics.reduce((tAcc, t) => tAcc + t.lessons.length, 0),
      0
    );
    const items = [
      {
        id: 'all',
        name: 'All Tracks',
        icon: 'apps-outline' as keyof typeof Ionicons.glyphMap,
        count: totalLessons,
      },
    ];

    for (const bundle of courses) {
      const count = bundle.topics.reduce(
        (tAcc, t) => tAcc + t.lessons.length,
        0
      );
      items.push({
        id: bundle.course.id,
        name: bundle.course.name,
        icon: iconForLanguage(bundle.course.language),
        count,
      });
    }

    return items;
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return courses
      .filter(
        (bundle) =>
          selectedCourseId === 'all' || bundle.course.id === selectedCourseId
      )
      .map((bundle) => {
        const filteredTopics = bundle.topics
          .map((topic) => {
            const filteredLessons = topic.lessons.filter(({ lesson }) => {
              if (selectedDifficulty !== 'all') {
                const d = lesson.difficulty.toLowerCase();
                if (selectedDifficulty === 'beginner' && d !== 'beginner' && d !== 'easy') {
                  return false;
                }
                if (
                  selectedDifficulty === 'intermediate' &&
                  d !== 'medium' &&
                  d !== 'intermediate'
                ) {
                  return false;
                }
                if (
                  selectedDifficulty === 'advanced' &&
                  d !== 'hard' &&
                  d !== 'advanced'
                ) {
                  return false;
                }
              }

              if (query) {
                const titleMatch = lesson.title.toLowerCase().includes(query);
                const descMatch = lesson.description.toLowerCase().includes(query);
                const topicMatch = topic.name.toLowerCase().includes(query);
                if (!titleMatch && !descMatch && !topicMatch) {
                  return false;
                }
              }

              return true;
            });

            return {
              ...topic,
              lessons: filteredLessons,
            };
          })
          .filter((topic) => topic.lessons.length > 0);

        return {
          ...bundle,
          topics: filteredTopics,
        };
      })
      .filter((bundle) => bundle.topics.length > 0);
  }, [courses, selectedCourseId, selectedDifficulty, searchQuery]);

  const currentCourseStats = useMemo(() => {
    const targetCourses =
      selectedCourseId === 'all'
        ? courses
        : courses.filter((c) => c.course.id === selectedCourseId);

    let total = 0;
    let completed = 0;

    for (const c of targetCourses) {
      for (const t of c.topics) {
        for (const l of t.lessons) {
          total++;
          if (l.progress.status === 'completed') {
            completed++;
          }
        }
      }
    }

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [courses, selectedCourseId]);

  if (loading) {
    return (
      <TabScreen>
        <HeaderHero />
        <LoadingState message="Loading your curriculum..." />
      </TabScreen>
    );
  }

  if (error) {
    return (
      <TabScreen>
        <HeaderHero />
        <ErrorState title="Couldn't load lessons" onRetry={load} />
      </TabScreen>
    );
  }

  if (courses.length === 0) {
    return (
      <TabScreen>
        <HeaderHero />
        <EmptyState
          icon="book-outline"
          title="No courses yet"
          message="Courses will appear here soon."
        />
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      {/* Modern Hero Header */}
      <HeaderHero />

      {/* Filter and Search Bar */}
      <View style={styles.filterSection}>
        {/* Track Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseScroll}
        >
          {courseOptions.map((opt) => {
            const isSelected = selectedCourseId === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setSelectedCourseId(opt.id)}
                style={({ pressed }) => [
                  styles.courseChip,
                  isSelected && styles.courseChipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={17}
                  color={isSelected ? colors.accent.primary : colors.text.secondary}
                />
                <AppText
                  variant="bodySmall"
                  style={[
                    styles.courseChipText,
                    isSelected && styles.courseChipTextActive,
                  ]}
                >
                  {opt.name}
                </AppText>
                <View
                  style={[
                    styles.chipCountBadge,
                    isSelected && styles.chipCountBadgeActive,
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={[
                      styles.chipCountText,
                      isSelected && styles.chipCountTextActive,
                    ]}
                  >
                    {opt.count}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Difficulty Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.difficultyScroll}
        >
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isSelected = selectedDifficulty === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSelectedDifficulty(opt.key)}
                style={[
                  styles.diffPill,
                  isSelected && styles.diffPillActive,
                ]}
              >
                <AppText
                  variant="caption"
                  style={[
                    styles.diffPillText,
                    isSelected && styles.diffPillTextActive,
                  ]}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quick Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={19} color={colors.accent.secondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search lessons or topics..."
            placeholderTextColor={colors.text.muted}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.text.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Track Progress Overview Banner */}
      <Card style={styles.progressBanner}>
        <View style={styles.progressBannerTop}>
          <View style={styles.progressBannerInfo}>
            <AppText variant="h3">
              {selectedCourseId === 'all'
                ? 'Curriculum Progress'
                : courses.find((c) => c.course.id === selectedCourseId)?.course.name}
            </AppText>
            <AppText variant="caption" muted>
              {currentCourseStats.completed} of {currentCourseStats.total} completed ({currentCourseStats.percentage}%)
            </AppText>
          </View>
          <View style={styles.percentBadge}>
            <AppText variant="h3" style={{ color: colors.accent.primary }}>
              {currentCourseStats.percentage}%
            </AppText>
          </View>
        </View>
        <ProgressBar progress={currentCourseStats.percentage / 100} />
      </Card>

      {/* Filtered Course List */}
      {filteredCourses.length === 0 ? (
        <View style={styles.emptyFiltered}>
          <Ionicons name="search" size={40} color={colors.text.muted} />
          <AppText variant="h3" style={{ marginTop: spacing.sm }}>
            No matching lessons found
          </AppText>
          <AppText variant="bodySmall" muted style={{ textAlign: 'center' }}>
            Try adjusting your search keywords or level filter.
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredCourses.map((bundle) => (
            <View key={bundle.course.id} style={styles.courseBlock}>
              {/* Course Title Header (shown if "All" is active) */}
              {selectedCourseId === 'all' && (
                <View style={styles.courseHeader}>
                  <View style={styles.courseIconBox}>
                    <Ionicons
                      name={iconForLanguage(bundle.course.language)}
                      size={22}
                      color={colors.accent.primary}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="h2">{bundle.course.name}</AppText>
                    <AppText variant="bodySmall" muted numberOfLines={1}>
                      {bundle.course.description}
                    </AppText>
                  </View>
                </View>
              )}

              {/* Topics */}
              {bundle.topics.map((topic) => {
                const isCollapsed = collapsedTopics.has(topic.id);
                const topicCompletedCount = topic.lessons.filter(
                  (l) => l.progress.status === 'completed'
                ).length;
                const isTopicAllDone =
                  topic.lessons.length > 0 &&
                  topicCompletedCount === topic.lessons.length;

                return (
                  <View key={topic.id} style={styles.topicSection}>
                    {/* Collapsible Topic Header */}
                    <Pressable
                      onPress={() => toggleTopicCollapse(topic.id)}
                      style={({ pressed }) => [
                        styles.topicHeaderBtn,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View style={styles.topicHeaderLeft}>
                        <View
                          style={[
                            styles.topicDot,
                            {
                              backgroundColor: isTopicAllDone
                                ? colors.status.success
                                : colors.accent.primary,
                            },
                          ]}
                        />
                        <AppText variant="h3" style={styles.topicName}>
                          {topic.name}
                        </AppText>
                      </View>

                      <View style={styles.topicHeaderRight}>
                        <Badge
                          label={`${topicCompletedCount}/${topic.lessons.length}`}
                          variant={isTopicAllDone ? 'success' : 'default'}
                        />
                        <Ionicons
                          name={isCollapsed ? 'chevron-down-circle-outline' : 'chevron-up-circle-outline'}
                          size={20}
                          color={colors.text.muted}
                        />
                      </View>
                    </Pressable>

                    {/* Lesson Cards inside Topic */}
                    {!isCollapsed && (
                      <View style={styles.lessonsContainer}>
                        {topic.lessons.map(({ lesson, progress }) => {
                          const isDone = progress.status === 'completed';
                          const inProg = progress.status === 'in-progress';

                          return (
                            <Card
                              key={lesson.id}
                              onPress={() =>
                                router.push(`/lesson/${lesson.id}`)
                              }
                              style={[
                                styles.lessonCard,
                                isDone && styles.lessonCardDone,
                              ]}
                            >
                              <View style={styles.lessonRow}>
                                <View
                                  style={[
                                    styles.lessonIconBox,
                                    isDone
                                      ? styles.iconBoxDone
                                      : inProg
                                      ? styles.iconBoxInProg
                                      : styles.iconBoxIdle,
                                  ]}
                                >
                                  <Ionicons
                                    name={
                                      isDone
                                        ? 'checkmark-circle'
                                        : inProg
                                        ? 'play'
                                        : 'book-outline'
                                    }
                                    size={20}
                                    color={
                                      isDone
                                        ? colors.status.success
                                        : inProg
                                        ? colors.accent.primary
                                        : colors.text.muted
                                    }
                                  />
                                </View>

                                <View style={styles.lessonContent}>
                                  <View style={styles.lessonTitleRow}>
                                    <AppText
                                      variant="h3"
                                      style={[
                                        styles.lessonTitle,
                                        isDone && { color: colors.text.secondary },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {lesson.title}
                                    </AppText>
                                    <StatusBadge status={progress.status} />
                                  </View>

                                  <AppText
                                    variant="bodySmall"
                                    muted
                                    numberOfLines={2}
                                    style={styles.lessonDesc}
                                  >
                                    {lesson.description}
                                  </AppText>

                                  <View style={styles.lessonMeta}>
                                    <Badge
                                      label={lesson.difficulty}
                                      variant={difficultyVariant(lesson.difficulty)}
                                    />
                                    <View style={styles.metaTime}>
                                      <Ionicons
                                        name="time-outline"
                                        size={14}
                                        color={colors.text.muted}
                                      />
                                      <AppText variant="caption" muted>
                                        {lesson.estimatedMinutes} min
                                      </AppText>
                                    </View>
                                  </View>
                                </View>

                                <Ionicons
                                  name="chevron-forward"
                                  size={18}
                                  color={colors.text.muted}
                                  style={styles.lessonChevron}
                                />
                              </View>
                            </Card>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
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
        <Ionicons name="sparkles" size={13} color={colors.accent.primary} />
        <AppText variant="caption" style={styles.heroBadgeText}>
          CURRICULUM
        </AppText>
      </View>
      <AppText variant="h1" style={styles.heroTitle}>
        Explore &amp; Learn
      </AppText>
      <AppText variant="bodySmall" muted style={styles.heroSubtitle}>
        Build technical mastery with structured lessons and live code experiments.
      </AppText>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: LessonProgress['status'];
}) {
  if (status === 'completed') {
    return <Badge label="Done" variant="success" />;
  }
  if (status === 'in-progress') {
    return <Badge label="In progress" variant="warning" />;
  }
  return null;
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

    filterSection: {
      gap: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },

    courseScroll: {
      gap: spacing.xs,
      paddingVertical: 4,
    },

    courseChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.default,
      ...shadows.small,
    },

    courseChipActive: {
      borderColor: colors.accent.primary,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.12),
    },

    courseChipText: {
      color: colors.text.secondary,
      fontWeight: '600',
    },

    courseChipTextActive: {
      color: colors.accent.primary,
      fontWeight: '700',
    },

    chipCountBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
    },

    chipCountBadgeActive: {
      backgroundColor: colors.surface.primary,
    },

    chipCountText: {
      fontSize: 10,
      color: colors.text.muted,
      fontWeight: '700',
    },

    chipCountTextActive: {
      color: colors.accent.primary,
      fontWeight: '700',
    },

    difficultyScroll: {
      gap: spacing.xs,
      paddingVertical: 2,
    },

    diffPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: 'transparent',
    },

    diffPillActive: {
      backgroundColor: colors.surface.primary,
      borderColor: colors.accent.primary,
    },

    diffPillText: {
      color: colors.text.secondary,
      fontWeight: '600',
      fontSize: 12,
    },

    diffPillTextActive: {
      color: colors.accent.primary,
      fontWeight: '700',
    },

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginTop: 2,
    },

    searchInput: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 14,
      paddingVertical: 8,
    },

    progressBanner: {
      gap: spacing.sm,
      marginTop: spacing.xs,
      padding: spacing.md,
    },

    progressBannerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    progressBannerInfo: {
      flex: 1,
      gap: 2,
    },

    percentBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      borderRadius: radius.md,
      backgroundColor: colors.accent.soft,
    },

    emptyFiltered: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.xs,
    },

    list: {
      gap: spacing.lg,
      marginTop: spacing.xs,
    },

    courseBlock: {
      gap: spacing.md,
    },

    courseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },

    courseIconBox: {
      width: 42,
      height: 42,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent.soft,
    },

    topicSection: {
      gap: spacing.sm,
    },

    topicHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    topicHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },

    topicDot: {
      width: 8,
      height: 8,
      borderRadius: radius.full,
    },

    topicName: {
      color: colors.text.primary,
      fontWeight: '700',
      flex: 1,
    },

    topicHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    lessonsContainer: {
      gap: spacing.sm,
      paddingLeft: 4,
    },

    lessonCard: {
      padding: spacing.md,
    },

    lessonCardDone: {
      opacity: 0.88,
    },

    lessonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    lessonIconBox: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    iconBoxDone: {
      backgroundColor: colors.surface.secondary,
    },

    iconBoxInProg: {
      backgroundColor: colors.accent.soft,
    },

    iconBoxIdle: {
      backgroundColor: colors.surface.secondary,
    },

    lessonContent: {
      flex: 1,
      gap: 4,
    },

    lessonTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },

    lessonTitle: {
      flex: 1,
    },

    lessonDesc: {
      lineHeight: 18,
    },

    lessonMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 4,
    },

    metaTime: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    lessonChevron: {
      marginLeft: spacing.xs,
    },

    flex: {
      flex: 1,
    },
  });
