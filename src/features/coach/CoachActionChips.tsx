// ---------------------------------------------------------------------------
// CoachActionChips — compact action controls (Phase 7 Step 6 §6 §7).
//
// Suggested actions come from the CoachResponse the engine produced; quick
// actions are static prompts routed through the same request system. The
// component carries NO business logic — it only calls back with a label/id
// and lets the screen (via the controller) decide what to execute.
// ---------------------------------------------------------------------------

import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

export type SuggestedActionChip = {
  type: string;
  targetId: string;
  title: string;
};

export type QuickActionItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  prompt: string;
};

type CoachActionChipsProps = {
  variant: 'suggested' | 'quick';
  items: Array<SuggestedActionChip | QuickActionItem>;
  onAction?: (item: SuggestedActionChip) => void;
  onQuick?: (prompt: string) => void;
};

export function CoachActionChips({
  variant,
  items,
  onAction,
  onQuick,
}: CoachActionChipsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.wrap}>
      {items.map((item, index) => {
        if (variant === 'quick') {
          const quick = item as QuickActionItem;
          return (
            <Chip
              key={index}
              icon={quick.icon}
              label={quick.label}
              tint={colors.accent.secondary}
              onPress={() => onQuick?.(quick.prompt)}
            />
          );
        }
        const suggested = item as SuggestedActionChip;
        return (
          <Chip
            key={index}
            icon={iconFor(suggested.type)}
            label={suggested.title}
            tint={colors.accent.primary}
            onPress={() => onAction?.(suggested)}
          />
        );
      })}
    </View>
  );
}

function iconFor(
  type: string
): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'practice_problem':
    case 'retry_problem':
      return 'code-slash-outline';
    case 'try_challenge':
      return 'flash-outline';
    case 'open_lesson':
    case 'continue_lesson':
      return 'book-outline';
    case 'review_concept':
      return 'layers-outline';
    case 'view_progress':
      return 'trending-up-outline';
    case 'next_hint':
      return 'bulb-outline';
    case 'view_solution':
      return 'checkmark-done-outline';
    default:
      return 'arrow-forward-circle-outline';
  }
}

function Chip({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: colors.border.default },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={15} color={tint} />
      <AppText variant="caption" style={[styles.label, { color: tint }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm - 2,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
    },
    label: {
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },
  });
