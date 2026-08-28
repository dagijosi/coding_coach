import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  spacing,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type ScreenProps = ScrollViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  scroll = true,
  contentStyle,
  ...props
}: ScreenProps) {
  const styles = useThemedStyles(makeStyles);

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.container, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, contentStyle]}
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
