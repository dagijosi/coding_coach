import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { AppText } from '@/components/ui';
import {
  ToastContext,
  type ToastKind,
} from './ToastContext';
import {
  animations,
  radius,
  shadows,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type ToastState = {
  message: string;
  kind: ToastKind;
  id: number;
} | null;

const ICONS: Record<
  ToastKind,
  keyof typeof Ionicons.glyphMap
> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  xp: 'flash',
};

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [toast, setToast] =
    useState<ToastState>(null);

  const cardOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const cardScale = useRef(
    new Animated.Value(0.6)
  ).current;

  const iconScale = useRef(
    new Animated.Value(0)
  ).current;

  const iconRotate = useRef(
    new Animated.Value(0)
  ).current;

  const exitProgress = useRef(
    new Animated.Value(0)
  ).current;

  const hideTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    if (!toast) return;

    cardOpacity.setValue(0);
    cardScale.setValue(0.6);
    iconScale.setValue(0);
    iconRotate.setValue(0);
    exitProgress.setValue(0);

    // Card entry (springy scale + fade).
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: animations.fast,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();

    // Icon pop with overshoot + little rotation wobble.
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 1.35,
        duration: animations.fast,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: animations.fast,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(iconRotate, {
      toValue: 1,
      duration: animations.slow,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [toast, cardOpacity, cardScale, iconScale, iconRotate, exitProgress]);

  function showToast(
    message: string,
    kind: ToastKind = 'info',
    options?: { duration?: number }
  ) {
    const duration =
      options?.duration ?? 2200;

    setToast({
      message,
      kind,
      id: Date.now(),
    });

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }

    hideTimer.current = setTimeout(() => {
      Animated.timing(exitProgress, {
        toValue: 1,
        duration: animations.fast,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setToast(null);
      });
    }, duration);
  }

  const exitOpacity = exitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const exitTranslateY = exitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const iconRotation = iconRotate.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '-8deg', '6deg', '-4deg', '0deg'],
  });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast ? (
        <View
          pointerEvents="none"
          style={styles.overlay}
        >
          <Animated.View
            style={[
              styles.cardEnter,
              {
                opacity: Animated.multiply(cardOpacity, exitOpacity),
                transform: [
                  { scale: Animated.multiply(cardScale, exitProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.85],
                  })) },
                  { translateY: exitTranslateY },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.iconWrap,
                styles[toast.kind],
                {
                  transform: [
                    { scale: iconScale },
                    { rotate: iconRotation },
                  ],
                },
              ]}
            >
              <Ionicons
                name={ICONS[toast.kind]}
                size={30}
                color={getIconColor(toast.kind, colors)}
              />
            </Animated.View>

            <AppText
              variant="body"
              style={styles.message}
            >
              {toast.message}
            </AppText>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast must be used within a ToastProvider'
    );
  }

  return context;
}

function getIconColor(kind: ToastKind, colors: ThemeColors) {
  switch (kind) {
    case 'success':
      return colors.status.success;
    case 'error':
      return colors.status.error;
    case 'xp':
      return colors.accent.secondary;
    default:
      return colors.status.info;
  }
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },

    cardEnter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      maxWidth: 400,
      width: '100%',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.xl,
      backgroundColor: colors.surface.elevated,
      borderWidth: 1,
      borderColor: colors.border.strong,
      ...shadows.xl,
    },

    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.secondary,
    },

    success: {
      backgroundColor: hexWithAlpha(colors.status.success, 0.2),
    },

    error: {
      backgroundColor: hexWithAlpha(colors.status.error, 0.18),
    },

    info: {
      backgroundColor: hexWithAlpha(colors.status.info, 0.18),
    },

    xp: {
      backgroundColor: hexWithAlpha(colors.accent.secondary, 0.18),
    },

    message: {
      flex: 1,
      color: colors.text.primary,
    },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}
