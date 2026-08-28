import { StyleSheet, Text, type TextProps } from 'react-native';

import {
  typography,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type Variant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'code';

type AppTextProps = TextProps & {
  variant?: Variant;
  muted?: boolean;
  children: React.ReactNode;
};

export function AppText({
  variant = 'body',
  muted = false,
  style,
  children,
  ...props
}: AppTextProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Text
      style={[
        styles.base,
        typography[variant],
        muted && styles.muted,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      color: colors.text.primary,
    },
    muted: {
      color: colors.text.secondary,
    },
  });
