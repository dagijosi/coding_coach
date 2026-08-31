// ---------------------------------------------------------------------------
// CoachContextChip — compact current-learning indicator (Phase 7 Step 6 §8).
//
// A single subtle pill under the header showing the lesson the learner is
// currently inside. The context value comes from the session store, which the
// lesson screen updates; the rich LearningContext is still built by
// LearningContextBuilder on each request (no duplicated state here).
// ---------------------------------------------------------------------------

import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type CoachContextChipProps = {
  lesson: { id: string; title: string } | null;
};

export function CoachContextChip({ lesson }: CoachContextChipProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (!lesson) {
    return null;
  }

  return (
    <View style={styles.chip}>
      <Ionicons
        name="book-outline"
        size={13}
        color={colors.accent.secondary}
      />
      <AppText
        variant="caption"
        style={styles.label}
        numberOfLines={1}
        accessibilityLabel={`Current lesson: ${lesson.title}`}
      >
        {lesson.title}
      </AppText>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 1,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
      alignSelf: 'flex-start',
    },
    label: {
      color: colors.text.secondary,
      fontWeight: '600',
      maxWidth: 200,
    },
  });
