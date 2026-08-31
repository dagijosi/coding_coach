// ---------------------------------------------------------------------------
// CoachTypingIndicator — subtle "coach is responding" cue (§10).
//
// A short, native-feeling animation. Not fake streaming — the engine is local
// and returns a full response; this just signals processing.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import {
  spacing,
  useThemedStyles,
  useTheme,
  type ThemeColors,
} from '@/theme';

export function CoachTypingIndicator() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const anims = dots.map((dot, index) =>
      Animated.sequence([
        Animated.delay(index * 90),
        Animated.timing(dot, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );
    const loop = Animated.loop(Animated.stagger(0, anims));
    loop.start();
    return () => loop.stop();
  }, [dots]);

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: colors.surface.secondary },
        ]}
        accessibilityLabel="Coach is typing"
        accessibilityRole="progressbar"
      >
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: colors.text.muted, opacity: dot },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      alignSelf: 'flex-start',
      alignItems: 'flex-start',
    },
    bubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
  });
