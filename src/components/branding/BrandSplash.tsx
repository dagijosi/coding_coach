import { useEffect, useRef } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { useTheme } from '@/theme';

import splashLight from '../../../assets/splash-light.png';
import splashDark from '../../../assets/splash-dark.png';

/**
 * Full-screen branded splash rendered in JS. Android 12+ cannot show the full
 * artwork natively (its splash API is icon + background color only), so we
 * render the artwork here and release the native splash only once this is on
 * screen — the native background color matches the artwork edge, making the
 * hand-off seamless. Light/dark follows the app theme (appearance override
 * included), not a manual second splash screen.
 */
export function BrandSplash() {
  const { resolvedMode } = useTheme();
  const released = useRef(false);

  useEffect(() => {
    if (!released.current) {
      released.current = true;
      SplashScreen.hideAsync().catch(() => {
        // Native hide is a best-effort hand-off; nothing to recover from here.
      });
    }
  }, []);

  return (
    <ImageBackground
      source={resolvedMode === 'light' ? splashLight : splashDark}
      style={styles.fill}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});