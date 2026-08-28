import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import {
  radius,
  spacing,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type BadgeProps = {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
};

export function Badge({
  label,
  variant = 'default',
}: BadgeProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.container, styles[variant]]}>
      <AppText variant="caption" style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },

    default: {
      backgroundColor: colors.surface.elevated,
    },

    success: {
      backgroundColor: hexWithAlpha(colors.status.success, 0.15),
    },

    warning: {
      backgroundColor: hexWithAlpha(colors.status.warning, 0.15),
    },

    error: {
      backgroundColor: hexWithAlpha(colors.status.error, 0.15),
    },

    text: {
      fontWeight: '600',
    },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}
