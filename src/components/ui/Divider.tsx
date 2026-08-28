import { StyleSheet, View } from 'react-native';

import { useThemedStyles, type ThemeColors } from '@/theme';

export function Divider() {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.divider} />;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    divider: {
      height: 1,
      backgroundColor: colors.border.default,
    },
  });
