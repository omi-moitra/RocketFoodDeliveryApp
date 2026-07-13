/**
 * File: AuthenticatedHeader.js
 * Purpose: Marks the authenticated header boundary and provides safe logout navigation.
 * Contents: imports, header component, styles.
 */

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

export default function AuthenticatedHeader() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      router.replace('/');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Rocket Food Delivery</Text>
        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>{isSigningOut ? 'Logging Out…' : 'Log Out'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.charcoal,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: 16,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: COLORS.orangeRed,
    borderRadius: 6,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  logoutText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
