/**
 * File: theme.js
 * Purpose: Centralizes the exact shared palette, typography, spacing, and layout values.
 * Contents: colors, font families, spacing scale, shared layout dimensions.
 */

import { Platform } from 'react-native';

export const COLORS = Object.freeze({
  charcoal: '#222126',
  darkRed: '#851919',
  mutedGreen: '#609475',
  orangeRed: '#DA583B',
  warmYellow: '#F0CB67',
  white: '#FFFFFF',
});

export const FONT_FAMILIES = Object.freeze({
  body: Platform.select({
    android: 'sans-serif',
    default: 'Arial',
    ios: 'Arial',
  }),
  oswaldRegular: 'Oswald_400Regular',
  oswaldSemiBold: 'Oswald_600SemiBold',
});

export const SPACING = Object.freeze({
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
});

export const LAYOUT = Object.freeze({
  footerIndicatorHeight: 36,
  footerIndicatorWidth: 72,
  headerLogoHeight: 58,
  headerLogoMaxWidth: 230,
  headerMinHeight: 92,
  minimumTouchTarget: 48,
});
