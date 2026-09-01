import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius as themeRadius, spacing, useTheme } from '@/theme';
import { hexWithAlpha } from '@/utils/color';

export type SkeletonLoaderProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = themeRadius.sm,
  style,
}: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: hexWithAlpha(colors.border.strong, 0.45),
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.cardSkeleton,
        {
          backgroundColor: colors.surface.primary,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <SkeletonLoader width={40} height={40} borderRadius={themeRadius.md} />
        <View style={styles.flexGap}>
          <SkeletonLoader width="60%" height={16} />
          <SkeletonLoader width="40%" height={12} />
        </View>
      </View>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width={i === rows - 1 ? '70%' : '100%'}
          height={14}
          style={{ marginTop: spacing.xs }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardSkeleton: {
    padding: spacing.md,
    borderRadius: themeRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flexGap: {
    flex: 1,
    gap: 6,
  },
});
