/**
 * File: PlaceholderScreen.js
 * Purpose: Renders one honest, scrollable placeholder for a route whose feature ships later.
 * Contents: imports, placeholder component, styles.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONT_FAMILIES, SPACING } from '../constants/theme';

/**
 * Renders a labeled, scrollable placeholder body beneath the shared header and role footer.
 * Customer Account, Courier Order Delivery, and Courier Account routes reuse it during the
 * navigation feature so each proves its chrome, safe area, and scrolling without faking data.
 * Read aloud: “placeholder screen.”
 */
export default function PlaceholderScreen({ title, description }) {
  return (
    // Top chrome comes from the tab header; only the bottom edge needs safe-area padding here.
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.note}>This screen will be completed in a later feature.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
  },
  title: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 26,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  note: {
    color: COLORS.orangeRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    textAlign: 'center',
  },
});
