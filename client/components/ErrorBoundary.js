/**
 * File: ErrorBoundary.js
 * Purpose: Contains render-time failures so one bad value cannot white-screen the whole app.
 * Contents:
 * 1. error boundary class component
 * 2. fallback styles
 */

import { Component } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

/**
 * Catches errors thrown while rendering descendants and shows a recoverable fallback screen.
 * RootLayout wraps the navigator with it; “Try Again” re-renders the tree from current state.
 * The fallback uses only the default body font because a font-load failure may be the cause.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Only a development warning; raw error details never render to the customer.
    if (__DEV__) {
      console.warn('ErrorBoundary: contained a render failure.', error?.message);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text accessibilityRole="alert" style={styles.title}>
            Something went wrong
          </Text>
          <Text style={styles.text}>The screen could not be displayed. Please try again.</Text>
          <Pressable accessibilityRole="button" onPress={this.handleReset} style={styles.button}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  text: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginTop: SPACING.sm,
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
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
    fontWeight: '600',
  },
});
