import { StyleSheet, View } from 'react-native';

import {
  radius,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type ProgressBarProps = {
  progress: number;
};

export function ProgressBar({ progress }: ProgressBarProps) {
  const styles = useThemedStyles(makeStyles);
  const value = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            width: `${value * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      height: 7,
      width: '100%',
      overflow: 'hidden',
      backgroundColor: colors.surface.elevated,
      borderRadius: radius.full,
    },

    fill: {
      height: '100%',
      backgroundColor: colors.accent.primary,
      borderRadius: radius.full,
    },
  });
