import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from './AppText';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type LoadingStateProps = {
  message?: string;
  full?: boolean;
};

export function LoadingState({
  message = 'Loading...',
  full = false,
}: LoadingStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.container, full && styles.full]}>
      <ActivityIndicator
        size="large"
        color={colors.accent.primary}
      />
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
      gap: spacing.md,
      padding: spacing.xl,
    },

    full: {
      flex: 1,
    },

    message: {
      textAlign: 'center',
    },
  });
