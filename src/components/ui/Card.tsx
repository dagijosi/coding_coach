import {
  Pressable,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import {
  radius,
  spacing,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type CardProps = ViewProps & {
  children: React.ReactNode;
  onPress?: () => void;
};

export function Card({ children, onPress, style, ...props }: CardProps) {
  const styles = useThemedStyles(makeStyles);

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed,
          style,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      padding: spacing.md,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
  });
