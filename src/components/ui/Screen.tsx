import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  spacing,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

export type ScreenProps = ScrollViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = true,
  contentStyle,
  ...props
}: ScreenProps) {
  const styles = useThemedStyles(makeStyles);

  const merged: StyleProp<ViewStyle> = [
    styles.container,
    ...(Array.isArray(contentStyle) ? contentStyle : [contentStyle]),
  ];

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={merged}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={merged}
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },

    scroll: {
      flex: 1,
    },

    container: {
      flexGrow: 1,
      padding: spacing.md,
      backgroundColor: colors.background.primary,
    },
  });
