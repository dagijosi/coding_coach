import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type WithTimingConfig,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  radius,
  shadows,
  spacing,
  typography,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

export const DOCK_HEIGHT = 72;
export const DOCK_BOTTOM_OFFSET = 14;
export const DOCK_WIDTH = 0.94;

// Space we need below the scroll content so it clears the floating dock.
export function dockClearance(bottom: number): number {
  return bottom + DOCK_BOTTOM_OFFSET + DOCK_HEIGHT + 16;
}

const PILL_WIDTH = 64;
const PILL_HEIGHT = 56;
const PILL_RADIUS = 18;

const TIMING = { duration: 300, easing: Easing.out(Easing.cubic) };
const MICRO = { duration: 260, easing: Easing.out(Easing.cubic) };

type IconName = keyof typeof Ionicons.glyphMap;

type DockItemConfig = {
  route: string;
  label: string;
  icon: IconName;
  iconActive: IconName;
  primary?: boolean;
};

const ITEMS: DockItemConfig[] = [
  {
    route: '/',
    label: 'Home',
    icon: 'home-outline',
    iconActive: 'home',
  },
  {
    route: '/learn',
    label: 'Learn',
    icon: 'book-outline',
    iconActive: 'book',
  },
  {
    route: '/practice',
    label: 'Practice',
    icon: 'code-slash-outline',
    iconActive: 'code-slash',
    primary: true,
  },
  {
    route: '/coach',
    label: 'Coach',
    icon: 'chatbubbles-outline',
    iconActive: 'chatbubbles',
  },
  {
    route: '/profile',
    label: 'Me',
    icon: 'person-outline',
    iconActive: 'person',
  },
];

function indexForPath(pathname: string): number {
  const idx = ITEMS.findIndex((item) => {
    if (item.route === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname === item.route;
  });
  return idx === -1 ? 0 : idx;
}

export function FloatingDock() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const activeIndex = indexForPath(pathname);
  const layoutRef = useRef<{ x: number; width: number }[]>(
    ITEMS.map(() => ({ x: 0, width: 0 }))
  );
  const hasMovedRef = useRef(false);
  const [measured, setMeasured] = useState(false);
  const indicatorX = useSharedValue(0);

  const conf = reduced ? { duration: 0 } : TIMING;
  const micro = reduced ? { duration: 0 } : MICRO;

  useEffect(() => {
    if (!measured) return;
    const layout = layoutRef.current[activeIndex];
    const target = layout.x + (layout.width - PILL_WIDTH) / 2;
    if (!hasMovedRef.current) {
      hasMovedRef.current = true;
      indicatorX.value = target;
    } else {
      indicatorX.value = withTiming(target, conf);
    }
  }, [activeIndex, measured, indicatorX, conf]);

  const handleItemLayout =
    (index: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      layoutRef.current[index] = { x, width };
      setMeasured(true);
    };

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorX.value,
    top: (DOCK_HEIGHT - PILL_HEIGHT) / 2,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
  }));

  const bottom = insets.bottom + DOCK_BOTTOM_OFFSET;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { paddingBottom: bottom }]}
    >
      <View style={styles.dock}>
        {measured ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.activePill, indicatorStyle]}
          />
        ) : null}

        {ITEMS.map((item, index) => {
          const active = index === activeIndex;
          return (
            <DockItem
              key={item.route}
              item={item}
              active={active}
              micro={micro}
              onLayout={handleItemLayout(index)}
              onPress={() => router.navigate(item.route)}
            />
          );
        })}
      </View>
    </View>
  );
}

function DockItem({
  item,
  active,
  micro,
  onLayout,
  onPress,
}: {
  item: DockItemConfig;
  active: boolean;
  micro: WithTimingConfig;
  onLayout: (e: LayoutChangeEvent) => void;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const progress = useSharedValue(active ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, micro);
  }, [active, progress, micro]);

  const accentColor = item.primary
    ? colors.accent.pressed
    : colors.accent.primary;
  const mutedColor = colors.text.muted;

  const iconStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        {
          scale: interpolate(p, [0, 1], [0.94, item.primary ? 1.06 : 1]),
        },
        {
          translateY: interpolate(p, [0, 1], [0, item.primary ? -3 : -2]),
        },
      ],
    };
  });

  const filledStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const outlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
  }));

  const labelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 1], [0.82, 1]),
      transform: [{ translateY: interpolate(p, [0, 1], [1, 0]) }],
      color: interpolateColor(p, [0, 1], [mutedColor, accentColor]),
    };
  });

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const iconSize = item.primary ? 26 : 24;

  return (
    <Pressable
      onLayout={onLayout}
      onPress={onPress}
      onPressIn={() => {
        press.value = withSpring(0.94, {
          damping: 20,
          stiffness: 300,
          mass: 0.5,
        });
      }}
      onPressOut={() => {
        press.value = withSpring(1, {
          damping: 18,
          stiffness: 200,
          mass: 0.5,
        });
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      accessibilityHint={active ? undefined : `Opens ${item.label}`}
      hitSlop={4}
      style={styles.item}
    >
      <Animated.View style={pressStyle}>
        <View style={styles.cell}>
          <Animated.View
            style={[
              styles.iconStack,
              { width: iconSize, height: iconSize },
              iconStyle,
            ]}
          >
            <Animated.View style={[styles.iconLayer, filledStyle]}>
              <Ionicons
                name={item.iconActive}
                size={iconSize}
                color={accentColor}
              />
            </Animated.View>
            <Animated.View style={[styles.iconLayer, outlineStyle]}>
              <Ionicons
                name={item.icon}
                size={iconSize}
                color={mutedColor}
              />
            </Animated.View>
          </Animated.View>

          <Animated.Text
            style={[styles.label, labelStyle]}
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            {item.label}
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },

    dock: {
      width: `${DOCK_WIDTH * 100}%`,
      height: DOCK_HEIGHT,
      borderRadius: radius.xl + 4,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.default,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: spacing.xs,
      ...shadows.small,
    },

    activePill: {
      position: 'absolute',
      borderRadius: PILL_RADIUS,
      backgroundColor: colors.accent.soft,
    },

    item: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cell: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingHorizontal: 2,
      paddingVertical: 4,
      width: '100%',
    },

    iconStack: {
      position: 'relative',
      marginBottom: 2,
    },

    iconLayer: {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },

    label: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600',
      textAlign: 'center',
      letterSpacing: -0.2,
    },
  });
