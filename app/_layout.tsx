import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  initializeDatabase,
  repairDatabase,
} from '@/database';
import { ToastProvider } from '@/components/toast';
import { WebViewEngineHost } from '@/code/engine/WebViewEngineHost';
import { ThemeProvider, useTheme } from '@/theme';

function ThemedApp() {
  const { resolvedMode } = useTheme();

  return (
    <>
      <StatusBar
        style={resolvedMode === 'light' ? 'dark' : 'light'}
      />

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

export default function RootLayout() {
  const [ready, setReady] = useState(false);

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

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
