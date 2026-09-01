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

// Keep the native splash visible until the custom TSX splash mounts
SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_FADE_DURATION_MS = 350;

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
  const [dbReady, setDbReady] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
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
        console.error('Failed to initialize database:', error);
      } finally {
        setDbReady(true);
      }
    }

    initialize();
  }, []);

  const handleSplashFinish = () => {
    setSplashFinished(true);
  };

  useEffect(() => {
    // Fade out splash once database is initialized AND progress animation completes
    if (dbReady && splashFinished && !splashGone) {
      Animated.timing(fade, {
        toValue: 0,
        duration: SPLASH_FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setSplashGone(true);
        }
      });
    }
  }, [dbReady, splashFinished, splashGone, fade]);

  return (
    <>
      <StatusBar
        style={resolvedMode === 'light' ? 'dark' : 'light'}
      />

      {dbReady ? <ThemedApp key="app" /> : null}

      {!splashGone && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: fade }]}
          pointerEvents="auto"
        >
          <BrandSplash onFinish={handleSplashFinish} />
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