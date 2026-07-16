/**
 * File: ResultState.js
 * Purpose: Renders the shared loading/empty/error body used by the list-style screens.
 * Contents: result-state component, shared state styles.
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

/**
 * Displays one mutually exclusive request-result body with an optional action button.
 * Restaurant List, Restaurant Menu, and Order History render it as their FlatList
 * empty component so all three screens share one state presentation.
 * Kinds: `loading` (spinner), `info` (polite title/message), `alert` (assertive
 * title/message), `error` (assertive dark-red message).
 * Read aloud: “result state.”
 * @param {{kind: 'loading'|'info'|'alert'|'error', title?: string, message?: string,
 *          actionLabel?: string, onAction?: () => void, minHeight?: number}} props
 */
export default function ResultState({
  actionLabel,
  kind,
  message,
  minHeight = 300,
  onAction,
  title,
}) {
  const isAssertive = kind === 'alert' || kind === 'error';

  return (
    <View
      accessibilityLiveRegion={isAssertive ? 'assertive' : 'polite'}
      style={[styles.container, { minHeight }]}
    >
      {kind === 'loading' ? <ActivityIndicator color={COLORS.orangeRed} size="large" /> : null}
      {title ? (
        <Text accessibilityRole={kind === 'alert' ? 'alert' : undefined} style={styles.title}>
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text
          accessibilityRole={kind === 'error' ? 'alert' : undefined}
          style={kind === 'error' ? styles.errorText : styles.text}
        >
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
  },
  title: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 23,
    textAlign: 'center',
  },
  text: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: LAYOUT.minimumTouchTarget,
    minWidth: 128,
    paddingHorizontal: SPACING.md,
  },
  buttonText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 17,
  },
});
