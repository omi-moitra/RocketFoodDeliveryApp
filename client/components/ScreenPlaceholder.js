/**
 * File: ScreenPlaceholder.js
 * Purpose: Gives unfinished feature routes a consistent, scroll-safe verification surface.
 * Contents: placeholder component, styles.
 */

import { ScrollView, StyleSheet, Text } from 'react-native';

import { COLORS } from '../constants/theme';

export default function ScreenPlaceholder({ children, description, title }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    color: COLORS.charcoal,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    color: COLORS.charcoal,
    fontSize: 16,
    lineHeight: 24,
  },
});
