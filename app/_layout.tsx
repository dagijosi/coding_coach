import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import {
  initializeDatabase,
  repairDatabase,
} from '@/database';
import { ToastProvider } from '@/components/toast';
import { WebViewEngineHost } from '@/code/engine/WebViewEngineHost';
import { ThemeProvider, useTheme } from '@/theme';
import { BrandSplash } from '@/components/branding/BrandSplash';

// Keep the native splash visible until the JS artwork is on screen so there is
// no flash of the plain native background between boot and the branded splash.
SplashScreen.preventAutoHideAsync();

const SPLASH_MIN_DURATION_MS = 700;
const SPLASH_FADE_DURATION_MS = 300;

function ThemedApp() {
  return (
    <>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </ToastProvider>

      <WebViewEngineHost />
    </>
  );
}

function Boot() {
  const { resolvedMode } = useTheme();
  const [ready, setReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function initialize() {
      try {
        // Normal offline-first startup: migrate + seed.
        const ok = await initializeDatabase();
        if (!ok) {
          // Initialization failed (e.g. corrupt/missing schema). Recover by
          // rebuilding the database from scratch so the app still launches.
          await repairDatabase();
        }
      } catch (error) {
        console.error(
          'Failed to initialize database:',
          error
        );
      } finally {
        setReady(true);
      }
    }

    initialize();
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => setMinElapsed(true),
      SPLASH_MIN_DURATION_MS
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready && minElapsed && !splashDone) {
      Animated.timing(fade, {
        toValue: 0,
        duration: SPLASH_FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setSplashDone(true);
        }
      });
    }
  }, [ready, minElapsed, splashDone, fade]);

  return (
    <>
      <StatusBar
        style={resolvedMode === 'light' ? 'dark' : 'light'}
      />

      {ready ? <ThemedApp key="app" /> : null}

      {!splashDone && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: fade }]}
          pointerEvents="auto"
        >
          <BrandSplash />
        </Animated.View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Boot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}