import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  useColorScheme,
  type ColorSchemeName,
} from 'react-native';

import { darkColors, lightColors } from './palettes';
import type { ThemeColors } from './palettes';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: Exclude<ColorSchemeName, null | undefined>;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = 'coding-coach-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveMode(
  mode: ThemeMode,
  system: ColorSchemeName
): Exclude<ColorSchemeName, null | undefined> {
  if (mode === 'system') {
    return system === 'light' ? 'light' : 'dark';
  }
  return mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (
          stored === 'light' ||
          stored === 'dark' ||
          stored === 'system'
        ) {
          setModeState(stored);
        }
      })
      .catch(() => {
        // Ignore persistence failures; fall back to system.
      });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Ignore persistence failures.
    });
  }, []);

  const resolvedMode = resolveMode(mode, system);
  const colors = resolvedMode === 'light' ? lightColors : darkColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedMode, colors, setMode }),
    [mode, resolvedMode, colors, setMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error(
      'useTheme must be used within a ThemeProvider'
    );
  }
  return value;
}
