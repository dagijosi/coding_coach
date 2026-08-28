import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const row = (
    <View style={styles.headerRow}>
      <View style={styles.titleWrap}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={colors.accent.secondary}
          />
        ) : null}
        <AppText variant="h2">{title}</AppText>
      </View>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
        >
          <AppText
            variant="caption"
            style={styles.action}
          >
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );

  if (!subtitle) {
    return row;
  }

  return (
    <View style={styles.wrapper}>
      {row}
      <AppText variant="caption" muted>
        {subtitle}
      </AppText>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    action: {
      color: colors.accent.primary,
      fontWeight: '600',
    },
  });
