import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Badge,
  Button,
  FadeInView,
  IconButton,
  Screen,
} from '@/components/ui';
import { useToast } from '@/components/toast';

import { getLessonById } from '@/repositories/lessonRepository';
import { getProblemsByLesson } from '@/repositories/problemRepository';
import { getChallengesByLesson } from '@/repositories/challengeRepository';
import {
  completeLesson,
  startLesson,
} from '@/repositories/progressRepository';
import type { Lesson, LessonContent } from '@/types/lesson';
import type { Challenge, Problem } from '@/types/learning';

import {
  radius,
  shadows,
  spacing,
  typography,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [completing, setCompleting] = useState(false);

  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;

    Promise.all([
      getLessonById(id),
      getProblemsByLesson(id),
      getChallengesByLesson(id),
    ])
      .then(([lessonData, problemsData, challengesData]) => {
        if (!lessonData) {
          setLoadError(true);
          return;
        }
        setLesson(lessonData);
        setProblems(problemsData);
        setChallenges(challengesData);
        startLesson(lessonData.id).catch(() => {
          // Non-blocking: marking in-progress should not block reading.
        });
      })
      .catch(() => setLoadError(true));
  }, [id]);

  if (loadError) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={colors.text.muted}
          />
          <AppText style={styles.centerText}>
            Couldn't load this lesson
          </AppText>
          <Button
            title="Try Again"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  if (!lesson) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <AppText muted>Loading lesson...</AppText>
        </View>
      </Screen>
    );
  }

  const accentColor = difficultyColor(
    lesson.difficulty,
    colors
  );

  const handleComplete = async () => {
    setCompleting(true);

    try {
      const xp = await completeLesson(lesson.id);

      showToast(`Lesson complete! +${xp} XP`, 'success');

      setTimeout(() => router.back(), 650);
    } catch {
      showToast(
        'Could not save your progress. Please try again.',
        'error'
      );
      setCompleting(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <IconButton
            name="arrow-back"
            onPress={() => router.back()}
          />

          <Badge
            label={lesson.difficulty}
            variant={
              lesson.difficulty === 'hard'
                ? 'error'
                : lesson.difficulty === 'medium'
                ? 'warning'
                : 'success'
            }
          />
        </View>
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <FadeInView>
          <View
            style={[
              styles.hero,
              { borderLeftColor: accentColor },
            ]}
          >
            <AppText variant="h1">
              {lesson.title}
            </AppText>

            <AppText muted style={styles.heroDesc}>
              {lesson.description}
            </AppText>

            <View style={styles.metadata}>
              <View style={styles.metadataItem}>
                <View
                  style={[
                    styles.metadataIcon,
                    { backgroundColor: accentColor + '22' },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={accentColor}
                  />
                </View>
                <AppText variant="bodySmall" muted>
                  {lesson.estimatedMinutes} min
                </AppText>
              </View>

              <View style={styles.metadataItem}>
                <View
                  style={[
                    styles.metadataIcon,
                    { backgroundColor: accentColor + '22' },
                  ]}
                >
                  <Ionicons
                    name="code-slash-outline"
                    size={16}
                    color={accentColor}
                  />
                </View>
                <AppText variant="bodySmall" muted>
                  {lesson.language}
                </AppText>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Lesson content */}
        {lesson.content.map((block, index) => (
          <FadeInView
            key={index}
            delay={Math.min(index * 60, 240)}
          >
            <LessonBlock block={block} />
          </FadeInView>
        ))}

        {/* Practice section */}
        {(problems.length > 0 || challenges.length > 0) && (
          <FadeInView>
            <View style={styles.practice}>
              <View style={styles.practiceHeader}>
                <Ionicons
                  name="fitness-outline"
                  size={20}
                  color={colors.accent.primary}
                />
                <AppText variant="h2">Try it yourself</AppText>
              </View>

              {problems.map((problem) => (
                <Pressable
                  key={problem.id}
                  onPress={() =>
                    router.push(`/problem/${problem.id}`)
                  }
                  style={({ pressed }) => [
                    styles.practiceRow,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.practiceIcon}>
                    <Ionicons
                      name="help-circle-outline"
                      size={22}
                      color={colors.accent.secondary}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="h3">{problem.title}</AppText>
                    <AppText variant="bodySmall" muted>
                      {problem.type.replace('-', ' ')}
                    </AppText>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.text.secondary}
                  />
                </Pressable>
              ))}

              {challenges.map((challenge) => (
                <Pressable
                  key={challenge.id}
                  onPress={() =>
                    router.push(`/challenge/${challenge.id}`)
                  }
                  style={({ pressed }) => [
                    styles.practiceRow,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.practiceIcon}>
                    <Ionicons
                      name="code-slash"
                      size={22}
                      color={colors.accent.primary}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="h3">{challenge.title}</AppText>
                    <AppText variant="bodySmall" muted>
                      Code challenge
                    </AppText>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.text.secondary}
                  />
                </Pressable>
              ))}
            </View>
          </FadeInView>
        )}
      </ScrollView>

      {/* Fixed footer */}
      <View style={[styles.finish, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={completing ? 'Saving...' : 'Complete Lesson'}
          loading={completing}
          onPress={handleComplete}
        />
      </View>
    </View>
  );
}

function LessonBlock({
  block,
}: {
  block: LessonContent;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  switch (block.type) {
    case 'heading':
      return (
        <View style={styles.block}>
          <AppText variant="h2">
            {block.content}
          </AppText>
        </View>
      );

    case 'text':
      return (
        <View style={styles.block}>
          <AppText variant="body" style={styles.textBlock}>
            {block.content}
          </AppText>
        </View>
      );

    case 'code':
      return (
        <View style={styles.block}>
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <View style={styles.codeLang}>
                <Ionicons
                  name="code-slash"
                  size={13}
                  color={colors.accent.secondary}
                />
                <AppText variant="caption" style={styles.codeLangText}>
                  {block.language ?? 'code'}
                </AppText>
              </View>
            </View>

            <View style={styles.code}>
              <AppText variant="code">
                {block.content}
              </AppText>
            </View>
          </View>
        </View>
      );

    default:
      return null;
  }
}

function difficultyColor(
  difficulty: Lesson['difficulty'],
  colors: ThemeColors
): string {
  if (difficulty === 'hard') return colors.difficulty.hard;
  if (difficulty === 'medium') return colors.difficulty.medium;
  return colors.difficulty.easy;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.lg,
    },

    centerText: {
      color: colors.text.secondary,
    },

    header: {
      backgroundColor: colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
    },

    scroll: {
      flex: 1,
    },

    container: {
      padding: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },

    hero: {
      padding: spacing.lg,
      borderLeftWidth: 3,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      ...shadows.medium,
    },

    heroDesc: {
      marginTop: spacing.sm,
    },

    metadata: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginTop: spacing.lg,
    },

    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    metadataIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },

    block: {
      marginTop: spacing.sm,
    },

    textBlock: {
      color: colors.text.secondary,
      lineHeight: typography.body.lineHeight,
    },

    codeCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      overflow: 'hidden',
    },

    codeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      backgroundColor: colors.background.tertiary,
    },

    codeLang: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    codeLangText: {
      color: colors.accent.secondary,
      fontWeight: '600',
    },

    code: {
      padding: spacing.md,
    },

    practice: {
      marginTop: spacing.xs,
      gap: spacing.sm,
    },

    practiceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },

    practiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    rowPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },

    practiceIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.secondary,
    },

    flex: {
      flex: 1,
    },

    finish: {
      paddingTop: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },
  });
