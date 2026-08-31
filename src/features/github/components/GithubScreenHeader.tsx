// ---------------------------------------------------------------------------
// Shared header for the GitHub screens (Phase 8).
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

export function GithubScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
      </Pressable>
      <View style={styles.titles}>
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    back: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.secondary,
    },
    titles: {
      flex: 1,
      gap: spacing.xs,
    },
    right: {
      minWidth: 40,
      alignItems: 'flex-end',
    },
  });
