import type { ThemeColors } from './palettes';
import { darkColors } from './palettes';

// Backward-compatible default palette for any consumer not yet using the
// theme hook. New code should prefer `useTheme()` from './ThemeContext'.
export const colors: ThemeColors = darkColors;
