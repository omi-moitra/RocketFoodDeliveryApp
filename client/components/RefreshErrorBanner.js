/**
 * File: RefreshErrorBanner.js
 * Purpose: Shows a non-destructive refresh-failure message with Retry, shared by list screens that
 *          keep existing rows visible when a background refresh fails.
 * Contents:
 * 1. refresh error banner component
 * 2. banner styles
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

/**
 * Renders the shared refresh-failure banner, or nothing when there is no message.
 * Order History and Order Delivery both show this above their list when a non-initial refresh
 * fails but the previously loaded rows are retained on screen.
 * @param {{message: string, onRetry: () => void}} props
 */
export default function RefreshErrorBanner({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <View accessibilityLiveRegion="polite" style={styles.refreshErrorBanner}>
      <Text style={styles.refreshErrorText}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.refreshRetry, pressed && styles.refreshRetryPressed]}
      >
        <Text style={styles.refreshRetryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  refreshErrorBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  refreshErrorText: {
    color: COLORS.darkRed,
    flex: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
  },
  refreshRetry: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.sm,
  },
  refreshRetryPressed: {
    opacity: 0.6,
  },
  refreshRetryText: {
    color: COLORS.orangeRed,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 16,
  },
});
