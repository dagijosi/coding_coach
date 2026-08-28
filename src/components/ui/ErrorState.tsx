import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from './AppText';
import { Button } from './Button';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  full?: boolean;
};

export function ErrorState({
  title = 'Something went wrong',
  message = `We couldn't load this content. Please try again.`,
  onRetry,
  full = false,
}: ErrorStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.container, full && styles.full]}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="cloud-offline-outline"
          size={40}
          color={colors.text.muted}
        />
      </View>

      <AppText variant="h3" style={styles.title}>
        {title}
      </AppText>

      <AppText muted style={styles.message}>
        {message}
      </AppText>

      {onRetry ? (
        <Button title="Try Again" variant="secondary" onPress={onRetry} />
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
      marginBottom: spacing.sm,
    },
  });
