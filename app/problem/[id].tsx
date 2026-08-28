import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
  Card,
  FadeInView,
  IconButton,
  Screen,
} from '@/components/ui';
import { useToast } from '@/components/toast';

import { getProblemById } from '@/repositories/problemRepository';
import { recordProblemAttempt } from '@/repositories/progressRepository';
import type { Problem } from '@/types/problem';
import type { Hint } from '@/types/learning';

import { animations, radius, spacing, useTheme, useThemedStyles, type ThemeColors } from '@/theme';

export default function ProblemScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [checking, setChecking] = useState(false);

  const insets = useSafeAreaInsets();

  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;

    getProblemById(id)
      .then(setProblem)
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
            Couldn't load this problem
          </AppText>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!problem) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <AppText muted>Loading problem...</AppText>
        </View>
      </Screen>
    );
  }

  const correct = selected === problem.answer;

  const hint: Hint | null =
    showHint && problem.hints.length > 0
      ? problem.hints[0]
      : null;

  const handleCheck = async () => {
    if (selected === null || problem.answer === undefined) return;

    setChecking(true);
    const isCorrect = selected === problem.answer;

    try {
      const xp = await recordProblemAttempt({
        problemId: problem.id,
        answer: selected,
        correct: isCorrect,
      });

      setSubmitted(true);

      if (isCorrect) {
        showToast(
          xp > 0 ? `Correct! +${xp} XP` : 'Correct!',
          'xp'
        );
      } else {
        showToast('Not quite — review the explanation below', 'info');
      }
    } catch {
      showToast('Could not record your answer. Try again.', 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <IconButton name="arrow-back" onPress={() => router.back()} />
        <Badge
          label={problem.difficulty}
          variant={
            problem.difficulty === 'hard'
              ? 'error'
              : problem.difficulty === 'medium'
              ? 'warning'
              : 'success'
          }
        />
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <AppText variant="h1">{problem.title}</AppText>

          <AppText muted style={styles.desc}>
            {problem.description}
          </AppText>

          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Ionicons
                name="bulb-outline"
                size={16}
                color={colors.text.secondary}
              />
              <AppText variant="bodySmall" muted>
                {problem.type.replace('-', ' ')}
              </AppText>
            </View>
          </View>

          <Card>
            <AppText variant="h3">Your task</AppText>
            <AppText style={styles.question}>{problem.description}</AppText>
          </Card>
        </FadeInView>

        {/* Prompt code if any */}
        {problem.prompt ? (
          <FadeInView>
            <View style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <Ionicons
                  name="code-slash"
                  size={13}
                  color={colors.accent.secondary}
                />
                <AppText variant="caption" style={styles.codeLangText}>
                  {problem.type.replace('-', ' ')}
                </AppText>
              </View>
              <View style={styles.code}>
                <AppText variant="code">{problem.prompt}</AppText>
              </View>
            </View>
          </FadeInView>
        ) : null}

        {/* Choices */}
        {problem.choices ? (
          <FadeInView style={styles.choices}>
            {problem.choices.map((choice, index) => {
              const isSelected = selected === index;
              const isCorrectShown = submitted && index === problem.answer;
              const isWrongPick =
                submitted && isSelected && index !== problem.answer;

              return (
                <PressableChoice
                  key={`${index}-${choice}`}
                  label={choice}
                  letter={String.fromCharCode(65 + index)}
                  state={
                    isCorrectShown
                      ? 'correct'
                      : isWrongPick
                      ? 'wrong'
                      : isSelected
                      ? 'selected'
                      : 'idle'
                  }
                  disabled={submitted}
                  onPress={() => {
                    if (!submitted) {
                      setSelected(index);
                    }
                  }}
                />
              );
            })}
          </FadeInView>
        ) : null}

        {/* Hint toggle */}
        {!submitted && problem.hints.length > 0 && (
          <FadeInView>
            <Button
              title={showHint ? 'Hide Hint' : 'Show Hint'}
              variant="ghost"
              onPress={() => setShowHint((v) => !v)}
            />

            {hint ? (
              <View style={styles.hintCard}>
                <View style={styles.hintHeader}>
                  <Ionicons
                    name="bulb-outline"
                    size={16}
                    color={colors.status.warning}
                  />
                  <AppText variant="h3" style={styles.hintTitle}>
                    Hint
                  </AppText>
                </View>
                <AppText variant="bodySmall" style={styles.hintBody}>
                  {hint.content}
                </AppText>
              </View>
            ) : null}
          </FadeInView>
        )}

        {/* Check Answer */}
        {!submitted && selected !== null && (
          <FadeInView>
            <Button title="Check Answer" loading={checking} onPress={handleCheck} />
          </FadeInView>
        )}

        {/* Feedback */}
        {submitted && (
          <FeedbackPanel
            correct={correct}
            explanation={problem.explanation}
            onDone={() => router.back()}
          />
        )}
      </ScrollView>
    </View>
  );
}

function FeedbackPanel({
  correct,
  explanation,
  onDone,
}: {
  correct: boolean;
  explanation: string;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: animations.normal,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: animations.fast,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.feedback,
        correct ? styles.feedbackCorrect : styles.feedbackWrong,
        { opacity, transform: [{ scale }] },
      ]}
    >
      <View style={styles.feedbackHeader}>
        <Ionicons
          name={correct ? 'checkmark-circle' : 'close-circle'}
          size={22}
          color={correct ? colors.status.success : colors.status.error}
        />
        <AppText variant="h3" style={styles.feedbackTitle}>
          {correct ? 'Correct!' : 'Not quite'}
        </AppText>
      </View>

      <AppText variant="bodySmall" style={styles.feedbackBody}>
        {explanation}
      </AppText>

      <Button title="Back to Practice" onPress={onDone} />
    </Animated.View>
  );
}

function PressableChoice({
  label,
  letter,
  state,
  disabled,
  onPress,
}: {
  label: string;
  letter: string;
  state: 'idle' | 'selected' | 'correct' | 'wrong';
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const background = {
    idle: colors.surface.secondary,
    selected: hexWithAlpha(colors.accent.primary, 0.14),
    correct: hexWithAlpha(colors.status.success, 0.16),
    wrong: hexWithAlpha(colors.status.error, 0.14),
  }[state];

  const borderColor = {
    idle: colors.border.default,
    selected: colors.accent.primary,
    correct: colors.status.success,
    wrong: colors.status.error,
  }[state];

  const tint = {
    idle: colors.text.muted,
    selected: colors.accent.primary,
    correct: colors.status.success,
    wrong: colors.status.error,
  }[state];

  const icon =
    state === 'correct' ? 'checkmark' : state === 'wrong' ? 'close' : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: background, borderColor },
        pressed && !disabled && styles.choicePressed,
      ]}
    >
      <View style={[styles.choiceLetter, { backgroundColor: tint + '1f' }]}>
        <AppText variant="bodySmall" style={{ color: tint, fontWeight: '700' }}>
          {letter}
        </AppText>
      </View>

      <AppText variant="body" style={styles.choiceLabel}>
        {label}
      </AppText>

      {icon ? (
        <Ionicons name={icon} size={18} color={tint} />
      ) : (
        <View
          style={[
            styles.choiceRadio,
            { borderColor: state === 'selected' ? colors.accent.primary : colors.border.strong },
          ]}
        />
      )}
    </Pressable>
  );
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },

    scroll: {
      flex: 1,
    },

    container: {
      padding: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },

    desc: {
      marginTop: spacing.xs,
    },

    metadata: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginVertical: spacing.md,
    },

    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    question: {
      marginTop: spacing.md,
      color: colors.text.secondary,
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
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      backgroundColor: colors.background.tertiary,
    },

    codeLangText: {
      color: colors.accent.secondary,
      fontWeight: '600',
    },

    code: {
      padding: spacing.md,
    },

    choices: {
      gap: spacing.sm,
    },

    choice: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
    },

    choicePressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },

    choiceLetter: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },

    choiceLabel: {
      flex: 1,
      color: colors.text.primary,
    },

    choiceRadio: {
      width: 18,
      height: 18,
      borderRadius: radius.full,
      borderWidth: 2,
    },

    hintCard: {
      marginTop: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: hexWithAlpha(colors.status.warning, 0.08),
      gap: spacing.sm,
    },

    hintHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    hintTitle: {
      color: colors.status.warning,
    },

    hintBody: {
      color: colors.text.secondary,
    },

    feedback: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.sm,
    },

    feedbackCorrect: {
      borderColor: hexWithAlpha(colors.status.success, 0.6),
      backgroundColor: hexWithAlpha(colors.status.success, 0.08),
    },

    feedbackWrong: {
      borderColor: hexWithAlpha(colors.status.error, 0.6),
      backgroundColor: hexWithAlpha(colors.status.error, 0.08),
    },

    feedbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    feedbackTitle: {
      color: colors.text.primary,
    },

    feedbackBody: {
      color: colors.text.secondary,
    },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}
