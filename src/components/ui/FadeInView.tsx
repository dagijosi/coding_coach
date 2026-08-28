import {
  Animated,
  Easing,
  type ViewProps,
} from 'react-native';
import { useEffect, useRef } from 'react';

import { animations } from '@/theme';

type FadeInViewProps = ViewProps & {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
};

export function FadeInView({
  children,
  delay = 0,
  distance = 16,
  style,
  ...props
}: FadeInViewProps) {
  const progress = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: animations.normal,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });

  return (
    <Animated.View
      style={[
        { opacity: progress, transform: [{ translateY }] },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}
