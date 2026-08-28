import { useMemo } from 'react';

import { useTheme } from './ThemeContext';
import type { ThemeColors } from './palettes';

export function useThemedStyles<T>(
  factory: (colors: ThemeColors) => T
): T {
  const { colors } = useTheme();

  return useMemo(
    () => factory(colors),
    // Rebuild styles only when the active palette changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors]
  );
}
