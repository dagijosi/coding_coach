import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  AppText,
  Button,
  Screen,
} from '@/components/ui';

import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="compass-outline"
            size={48}
            color={colors.accent.secondary}
          />
        </View>

        <AppText variant="display" style={styles.title}>
          404
        </AppText>

        <AppText variant="h3">Page not found</AppText>

        <AppText muted style={styles.body}>
          The page you're looking for doesn't exist or has moved.
        </AppText>

        <Button
          title="Go Home"
          onPress={() => router.replace('/')}
        />
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.lg,
    },

    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: 999,
      backgroundColor: hexWithAlpha(colors.accent.secondary, 0.12),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },

    title: {
      color: colors.accent.secondary,
    },

    body: {
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}
