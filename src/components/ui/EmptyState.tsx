import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  full?: boolean;
};

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  full = false,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.container, full && styles.full]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={40} color={colors.text.muted} />
      </View>

      <AppText variant="h3" style={styles.title}>
        {title}
      </AppText>

      {message ? (
        <AppText muted style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.xl,
    },

    full: {
      flex: 1,
    },

    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 999,
      backgroundColor: colors.surface.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },

    title: {
      textAlign: 'center',
    },

    message: {
      textAlign: 'center',
    },
  });
