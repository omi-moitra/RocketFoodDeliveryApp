/**
 * File: theme.js
 * Purpose: Centralizes the exact shared palette, typography, spacing, and layout values.
 * Contents: colors, font families, spacing scale, shared layout dimensions.
 */

import { Platform } from 'react-native';

// COLORS is the single source for the exact palette required by the grading wireframe.
export const COLORS = Object.freeze({
  charcoal: '#222126',
  darkRed: '#851919',
  mutedGreen: '#609475',
  orangeRed: '#DA583B',
  warmYellow: '#F0CB67',
  white: '#FFFFFF',
});

// FONT_FAMILIES names both supplied headings and the platform-safe body-font fallback.
export const FONT_FAMILIES = Object.freeze({
  body: Platform.select({
    android: 'sans-serif',
    default: 'Arial',
    ios: 'Arial',
  }),
  oswaldRegular: 'Oswald_400Regular',
  oswaldSemiBold: 'Oswald_600SemiBold',
});

// SPACING gives layout code one shared scale instead of unrelated pixel guesses.
export const SPACING = Object.freeze({
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
});

// LAYOUT records cross-component dimensions that enforce touch and navigation consistency.
export const LAYOUT = Object.freeze({
  footerIndicatorHeight: 36,
  footerIndicatorWidth: 72,
  headerLogoHeight: 58,
  headerLogoMaxWidth: 230,
  headerMinHeight: 92,
  minimumTouchTarget: 48,
});
