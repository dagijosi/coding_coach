import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from '@/components/ui';

import { getCourses } from '@/repositories/courseRepository';
import { getTopicsByCourse } from '@/repositories/topicRepository';
import { getLessonsByTopic } from '@/repositories/lessonRepository';
import { getLessonProgressById } from '@/repositories/progressRepository';
import type { Course } from '@/types/learning';
import type { Lesson } from '@/types/lesson';
import type { LessonProgress } from '@/types/learning';

import {
  radius,
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

export default function LearnScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [courses, setCourses] = useState<CourseBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
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
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <Screen>
        <ScreenHeader />
        <LoadingState message="Loading your path..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ScreenHeader />
        <ErrorState title="Couldn't load lessons" onRetry={load} />
      </Screen>
    );
  }

  if (courses.length === 0) {
    return (
      <Screen>
        <ScreenHeader />
        <EmptyState
          icon="book-outline"
          title="No courses yet"
          message="Courses will appear here soon."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader />

      <View style={styles.list}>
        {courses.map((bundle) => (
          <View key={bundle.course.id} style={styles.course}>
            <View style={styles.courseHeader}>
              <View style={styles.iconBox}>
                <Ionicons
                  name="code-slash-outline"
                  size={24}
                  color={colors.accent.primary}
                />
              </View>
              <View style={styles.flex}>
                <AppText variant="h2">{bundle.course.name}</AppText>
                <AppText variant="bodySmall" muted>
                  {bundle.course.description}
                </AppText>
              </View>
            </View>

            {bundle.topics.map((topic) => (
              <View key={topic.id} style={styles.topic}>
                <View style={styles.topicTag}>
                  <Ionicons
                    name="ellipse"
                    size={8}
                    color={colors.accent.secondary}
                  />
                  <AppText variant="h3" style={styles.topicName}>
                    {topic.name}
                  </AppText>
                </View>

                {topic.lessons.length === 0 ? (
                  <AppText variant="bodySmall" muted>
                    No lessons in this topic yet.
                  </AppText>
                ) : (
                  topic.lessons.map(({ lesson, progress }) => (
                    <Card
                      key={lesson.id}
                      onPress={() =>
                        router.push(`/lesson/${lesson.id}`)
                      }
                    >
                      <View style={styles.row}>
                        <View style={styles.icon}>
                          <Ionicons
                            name={
                              progress.status === 'completed'
                                ? 'checkmark-circle'
                                : progress.status === 'in-progress'
                                ? 'play-circle'
                                : 'book-outline'
                            }
                            size={22}
                            color={
                              progress.status === 'completed'
                                ? colors.status.success
                                : colors.accent.secondary
                            }
                          />
                        </View>

                        <View style={styles.content}>
                          <View style={styles.titleRow}>
                            <AppText variant="h3" style={styles.title}>
                              {lesson.title}
                            </AppText>
                            <StatusBadge status={progress.status} />
                          </View>

                          <AppText variant="bodySmall" muted>
                            {lesson.description}
                          </AppText>

                          <View style={styles.meta}>
                            <Badge label={lesson.difficulty} />
                            <AppText variant="caption" muted>
                              {lesson.estimatedMinutes} min
                            </AppText>
                          </View>
                        </View>
                      </View>
                    </Card>
                  ))
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}

function ScreenHeader() {
  const styles = useThemedStyles(makeStyles);
  return (
    <SectionHeader
      title="Learn"
      subtitle="Build your coding knowledge step by step."
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
    list: {
      gap: spacing.xl,
      marginTop: spacing.lg,
    },

    course: {
      gap: spacing.lg,
    },

    courseHeader: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'center',
    },

    iconBox: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.secondary,
    },

    flex: {
      flex: 1,
      gap: spacing.xs,
    },

    topic: {
      gap: spacing.sm,
    },

    topicTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },

    topicName: {
      color: colors.accent.secondary,
    },

    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },

    icon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.secondary,
    },

    content: {
      flex: 1,
      gap: spacing.xs,
    },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    title: {
      flex: 1,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
  });
