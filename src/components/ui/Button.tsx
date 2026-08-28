import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
} from "react-native";

import { AppText } from "./AppText";
import {
  radius,
  spacing,
  useThemedStyles,
  useTheme,
  type ThemeColors,
} from "@/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

type ButtonProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor(colors, variant)} />
      ) : (
        <AppText
          variant="body"
          style={{
            color: getTextColor(colors, variant),
            fontWeight: "700",
          }}
        >
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

function getTextColor(colors: ThemeColors, variant: ButtonVariant) {
  if (variant === "primary") return colors.text.inverse;
  if (variant === "success") return colors.text.inverse;
  if (variant === "danger") return colors.white;

  return colors.text.primary;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },

    primary: {
      backgroundColor: colors.accent.primary,
    },

    secondary: {
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    ghost: {
      backgroundColor: "transparent",
    },

    success: {
      backgroundColor: colors.status.success,
    },

    danger: {
      backgroundColor: colors.status.error,
    },

    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },

    disabled: {
      opacity: 0.45,
    },
  });
