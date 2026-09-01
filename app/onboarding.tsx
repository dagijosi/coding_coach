import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Card, ProgressBar } from '@/components/ui';
import {
  radius,
  shadows,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import { hexWithAlpha } from '@/utils/color';

export const ONBOARDING_KEY = 'coding_coach_onboarding_completed';

const TRACK_OPTIONS = [
  {
    id: 'python',
    title: 'Python Foundations',
    desc: 'Clean syntax, data structures, and algorithmic thinking',
    icon: 'logo-python' as const,
  },
  {
    id: 'typescript',
    title: 'TypeScript Core',
    desc: 'Type safety, modern ES features, and modular architecture',
    icon: 'code-slash' as const,
  },
  {
    id: 'javascript',
    title: 'JavaScript Essentials',
    desc: 'Functional programming, closures, and async patterns',
    icon: 'logo-javascript' as const,
  },
];

const LEVEL_OPTIONS = [
  {
    id: 'beginner',
    title: 'New to Coding',
    desc: 'Starting from scratch or brushing up on fundamental syntax',
    icon: 'sparkles-outline' as const,
  },
  {
    id: 'intermediate',
    title: 'Some Experience',
    desc: 'Familiar with variables and loops, looking to master algorithms',
    icon: 'code-working-outline' as const,
  },
  {
    id: 'advanced',
    title: 'Experienced Builder',
    desc: 'Strengthening problem solving and interview challenge skills',
    icon: 'trophy-outline' as const,
  },
];

const GOAL_OPTIONS = [
  { id: '5', title: 'Casual', desc: '5 mins • 1 lesson or problem / day', icon: 'cafe-outline' as const },
  { id: '15', title: 'Regular', desc: '15 mins • 2 lessons + challenge / day', icon: 'flame-outline' as const },
  { id: '30', title: 'Intensive', desc: '30 mins • Deep curriculum mastery', icon: 'flash-outline' as const },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTrack, setSelectedTrack] = useState('python');
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [selectedGoal, setSelectedGoal] = useState('15');
  const [finishing, setFinishing] = useState(false);

  const handleNext = async () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as 2 | 3);
    } else {
      setFinishing(true);
      try {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        await AsyncStorage.setItem(
          'user_preferences',
          JSON.stringify({ track: selectedTrack, level: selectedLevel, goalMinutes: selectedGoal })
        );
        router.replace('/(tabs)');
      } catch {
        router.replace('/(tabs)');
      }
    }
  };

  const stepProgress = step / 3;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.md }]}>
      {/* Top Header & Progress */}
      <View style={styles.topHeader}>
        <View style={styles.stepBadge}>
          <Ionicons name="sparkles" size={13} color={colors.accent.primary} />
          <AppText variant="caption" style={styles.stepBadgeText}>
            STEP {step} OF 3
          </AppText>
        </View>
        <View style={styles.progressWrap}>
          <ProgressBar progress={stepProgress} />
        </View>
      </View>

      {/* Step 1: Language / Track */}
      {step === 1 && (
        <View style={styles.content}>
          <View style={styles.titleBox}>
            <AppText variant="h1" style={styles.title}>
              Choose Your Primary Track
            </AppText>
            <AppText variant="bodySmall" muted>
              Select where you want to begin. You can explore all tracks anytime.
            </AppText>
          </View>

          <View style={styles.optionsList}>
            {TRACK_OPTIONS.map((opt) => {
              const active = selectedTrack === opt.id;
              return (
                <Card
                  key={opt.id}
                  onPress={() => setSelectedTrack(opt.id)}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                >
                  <View style={styles.optionRow}>
                    <View
                      style={[
                        styles.optionIconBox,
                        {
                          backgroundColor: active
                            ? hexWithAlpha(colors.accent.primary, 0.15)
                            : hexWithAlpha(colors.text.muted, 0.1),
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={24}
                        color={active ? colors.accent.primary : colors.text.muted}
                      />
                    </View>
                    <View style={styles.flex}>
                      <AppText
                        variant="h3"
                        style={[styles.optionTitle, active && { color: colors.accent.primary }]}
                      >
                        {opt.title}
                      </AppText>
                      <AppText variant="caption" muted numberOfLines={2}>
                        {opt.desc}
                      </AppText>
                    </View>
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={active ? colors.accent.primary : colors.text.muted}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      )}

      {/* Step 2: Experience Level */}
      {step === 2 && (
        <View style={styles.content}>
          <View style={styles.titleBox}>
            <AppText variant="h1" style={styles.title}>
              What's Your Experience Level?
            </AppText>
            <AppText variant="bodySmall" muted>
              This helps your offline AI Coach tailor challenge hints and explanations.
            </AppText>
          </View>

          <View style={styles.optionsList}>
            {LEVEL_OPTIONS.map((opt) => {
              const active = selectedLevel === opt.id;
              return (
                <Card
                  key={opt.id}
                  onPress={() => setSelectedLevel(opt.id)}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                >
                  <View style={styles.optionRow}>
                    <View
                      style={[
                        styles.optionIconBox,
                        {
                          backgroundColor: active
                            ? hexWithAlpha(colors.accent.primary, 0.15)
                            : hexWithAlpha(colors.text.muted, 0.1),
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={24}
                        color={active ? colors.accent.primary : colors.text.muted}
                      />
                    </View>
                    <View style={styles.flex}>
                      <AppText
                        variant="h3"
                        style={[styles.optionTitle, active && { color: colors.accent.primary }]}
                      >
                        {opt.title}
                      </AppText>
                      <AppText variant="caption" muted numberOfLines={2}>
                        {opt.desc}
                      </AppText>
                    </View>
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={active ? colors.accent.primary : colors.text.muted}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      )}

      {/* Step 3: Daily Goal */}
      {step === 3 && (
        <View style={styles.content}>
          <View style={styles.titleBox}>
            <AppText variant="h1" style={styles.title}>
              Set Your Daily Goal
            </AppText>
            <AppText variant="bodySmall" muted>
              Consistency builds technical mastery. Small daily habits create big results.
            </AppText>
          </View>

          <View style={styles.optionsList}>
            {GOAL_OPTIONS.map((opt) => {
              const active = selectedGoal === opt.id;
              return (
                <Card
                  key={opt.id}
                  onPress={() => setSelectedGoal(opt.id)}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                >
                  <View style={styles.optionRow}>
                    <View
                      style={[
                        styles.optionIconBox,
                        {
                          backgroundColor: active
                            ? hexWithAlpha(colors.accent.primary, 0.15)
                            : hexWithAlpha(colors.text.muted, 0.1),
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={24}
                        color={active ? colors.accent.primary : colors.text.muted}
                      />
                    </View>
                    <View style={styles.flex}>
                      <AppText
                        variant="h3"
                        style={[styles.optionTitle, active && { color: colors.accent.primary }]}
                      >
                        {opt.title}
                      </AppText>
                      <AppText variant="caption" muted numberOfLines={2}>
                        {opt.desc}
                      </AppText>
                    </View>
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={active ? colors.accent.primary : colors.text.muted}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      )}

      {/* Bottom Button Bar */}
      <View style={styles.bottomBar}>
        {step > 1 && (
          <Button
            title="Back"
            variant="ghost"
            onPress={() => setStep((prev) => (prev - 1) as 1 | 2)}
          />
        )}
        <View style={styles.flex}>
          <Button
            title={step === 3 ? 'Start Learning Now →' : 'Continue →'}
            loading={finishing}
            onPress={handleNext}
          />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background.primary,
      paddingHorizontal: spacing.lg,
      justifyContent: 'space-between',
    },

    topHeader: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },

    stepBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: colors.accent.soft,
    },

    stepBadgeText: {
      color: colors.accent.primary,
      fontWeight: '700',
      letterSpacing: 0.8,
      fontSize: 10,
    },

    progressWrap: {
      width: '100%',
    },

    content: {
      flex: 1,
      gap: spacing.lg,
    },

    titleBox: {
      gap: spacing.xs,
    },

    title: {
      letterSpacing: -0.4,
      lineHeight: 34,
    },

    optionsList: {
      gap: spacing.sm,
    },

    optionCard: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.border.default,
    },

    optionCardActive: {
      borderColor: colors.accent.primary,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.04),
    },

    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    optionIconBox: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    optionTitle: {
      marginBottom: 2,
    },

    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.md,
    },

    flex: {
      flex: 1,
    },
  });
