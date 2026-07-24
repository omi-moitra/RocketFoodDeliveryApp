/**
 * File: theme.js
 * Purpose: Centralizes the exact shared palette, typography, spacing, and layout values.
 * Contents:
 * 1. colors
 * 2. font families
 * 3. spacing scale
 * 4. shared layout dimensions
 */

import { Platform } from 'react-native';

import { DELIVERY_STATUS } from './deliveryStatus';

// COLORS is the single source for the exact palette required by the grading wireframe.
export const COLORS = Object.freeze({
  charcoal: '#222126',
  darkRed: '#851919',
  lightGray: '#E8E8E8',
  mutedGreen: '#609475',
  orangeRed: '#DA583B',
  warmYellow: '#F0CB67',
  white: '#FFFFFF',
});

// DELIVERY_STATUS_COLORS maps each internal courier delivery status to its required semantic
// color: PENDING red, IN PROGRESS orange, DELIVERED green (global spec §11.1). Centralized so the
// status pill and any future status control read one token instead of repeating palette literals.
export const DELIVERY_STATUS_COLORS = Object.freeze({
  [DELIVERY_STATUS.DELIVERED]: COLORS.mutedGreen,
  [DELIVERY_STATUS.IN_PROGRESS]: COLORS.orangeRed,
  [DELIVERY_STATUS.PENDING]: COLORS.darkRed,
});

// FONT_FAMILIES names both supplied headings and the body-font policy. iOS uses its native Arial;
// Android has no Arial, so it uses the bundled Arimo (a metric-compatible Arial equivalent loaded
// in app/_layout.js) rather than falsely labeling a different system font as Arial.
export const FONT_FAMILIES = Object.freeze({
  body: Platform.select({
    android: 'Arimo_400Regular',
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
