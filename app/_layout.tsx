import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { seedDatabase } from '@/database/seed';
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
        await seedDatabase();
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
