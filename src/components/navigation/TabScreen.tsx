import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, type ScreenProps } from '@/components/ui';
import { dockClearance } from './FloatingDock';

export function TabScreen({
  children,
  scroll = true,
  contentStyle,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const merged: StyleProp<ViewStyle> = [
    { paddingBottom: dockClearance(insets.bottom) },
    contentStyle,
  ];

  return (
    <Screen scroll={scroll} contentStyle={merged} {...props}>
      {children}
    </Screen>
  );
}
