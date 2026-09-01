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
  SectionHeader,
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
  typography,
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
type StatusFilter = 'all' | 'in-progress' | 'completed' | 'unstarted';

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
      // Silently refresh progress when returning to Learn tab
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

  // Course selector items
  const courseOptions = useMemo(() => {
    const totalLessons = courses.reduce(
      (acc, c) => acc + c.topics.reduce((tAcc, t) => tAcc + t.lessons.length, 0),
      0
    );
    const items = [
      {
        id: 'all',
        name: 'All Languages',
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

  // Filtered courses and topics
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
              // Difficulty match
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

              // Search query match
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

  // Calculate statistics for selected course
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
        <ScreenHeader />
        <LoadingState message="Loading your curriculum..." />
      </TabScreen>
    );
  }

  if (error) {
    return (
      <TabScreen>
        <ScreenHeader />
        <ErrorState title="Couldn't load lessons" onRetry={load} />
      </TabScreen>
    );
  }

  if (courses.length === 0) {
    return (
      <TabScreen>
        <ScreenHeader />
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
      <ScreenHeader />

      {/* Course / Language Selector Bar */}
      <View style={styles.filterSection}>
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
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={16}
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
          <Ionicons name="search-outline" size={18} color={colors.text.muted} />
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

      {/* Progress Overview Banner */}
      <Card style={styles.progressBanner}>
        <View style={styles.progressBannerTop}>
          <View style={styles.progressBannerInfo}>
            <AppText variant="h3">
              {selectedCourseId === 'all' ? 'Overall Learning Path' : courses.find(c => c.course.id === selectedCourseId)?.course.name}
            </AppText>
            <AppText variant="caption" muted>
              {currentCourseStats.completed} of {currentCourseStats.total} lessons completed ({currentCourseStats.percentage}%)
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
          <Ionicons name="search" size={36} color={colors.text.muted} />
          <AppText variant="h3" style={{ marginTop: spacing.sm }}>
            No matching lessons
          </AppText>
          <AppText variant="bodySmall" muted style={{ textAlign: 'center' }}>
            Try choosing a different level or clearing your search filter.
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
                                : colors.accent.secondary,
                            },
                          ]}
                        />
                        <AppText variant="h3" style={styles.topicName}>
                          {topic.name}
                        </AppText>
                      </View>

                      <View style={styles.topicHeaderRight}>
                        <AppText variant="caption" muted>
                          {topicCompletedCount}/{topic.lessons.length} done
                        </AppText>
                        <Ionicons
                          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                          size={18}
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
                                        size={13}
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

function ScreenHeader() {
  return (
    <SectionHeader
      title="Learn"
      subtitle="Structured coding tracks, concepts and interactive lessons."
      icon="book-outline"
    />
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    filterSection: {
      gap: spacing.sm,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },

    courseScroll: {
      gap: spacing.xs,
      paddingVertical: 2,
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
    },

    courseChipActive: {
      borderColor: colors.accent.primary,
      backgroundColor: colors.accent.soft,
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
      paddingHorizontal: 6,
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
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.sm,
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
      fontWeight: '500',
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
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },

    searchInput: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 14,
      paddingVertical: 6,
    },

    progressBanner: {
      gap: spacing.sm,
      marginTop: spacing.xs,
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
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
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
      marginTop: spacing.sm,
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
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent.soft,
    },

    topicSection: {
      gap: spacing.xs,
    },

    topicHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      paddingHorizontal: 2,
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
      fontWeight: '600',
    },

    topicHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    lessonsContainer: {
      gap: spacing.xs,
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
      width: 38,
      height: 38,
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
      gap: 3,
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
      marginTop: 3,
    },

    metaTime: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    lessonChevron: {
      marginLeft: spacing.xs,
    },

    flex: {
      flex: 1,
    },
  });
