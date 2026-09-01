/**
 * Utility functions for color manipulation and conversion.
 */

/**
 * Converts a hex color string (e.g., #FFFFFF or #FFF) and alpha value (0-1) into an rgba string.
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  let r = 0;
  let g = 0;
  let b = 0;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex.charAt(0) + cleanHex.charAt(0), 16) || 0;
    g = parseInt(cleanHex.charAt(1) + cleanHex.charAt(1), 16) || 0;
    b = parseInt(cleanHex.charAt(2) + cleanHex.charAt(2), 16) || 0;
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  }

  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}

/**
 * Appends a 2-character hex alpha (00-FF) directly to a 6-digit hex string.
 */
export function hexWithHexAlpha(hex: string, alpha: number): string {
  const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const hexAlpha = Math.round(clampedAlpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${cleanHex.substring(0, 7)}${hexAlpha}`;
}
