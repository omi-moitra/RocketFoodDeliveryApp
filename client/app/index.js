/**
 * File: index.js
 * Purpose: Provides the unauthenticated route boundary for the upcoming login feature.
 * Contents: login placeholder, styles.
 */

import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../constants/theme';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rocket Food Delivery</Text>
      <Text style={styles.description}>
        Login will be implemented by the login-page feature.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: COLORS.charcoal,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: COLORS.charcoal,
    fontSize: 16,
    textAlign: 'center',
  },
});
