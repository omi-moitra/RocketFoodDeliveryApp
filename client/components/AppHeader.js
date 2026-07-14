/**
 * File: AppHeader.js
 * Purpose: Renders the shared authenticated logo, logout action, and safe retry feedback.
 * Contents: imports, header component, logout state transitions, styles.
 */

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const LOGOUT_STATUS = Object.freeze({
  clearing: 'clearing',
  idle: 'idle',
});

export default function AppHeader() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const [logoutStatus, setLogoutStatus] = useState(LOGOUT_STATUS.idle);
  const isLoggingOut = logoutStatus === LOGOUT_STATUS.clearing;

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setLogoutError('');
    setLogoutStatus(LOGOUT_STATUS.clearing);

    try {
      await signOut();
      router.replace('/');
    } catch {
      // Credentials may still exist after a storage failure, so keep the session and allow retry.
      setLogoutError('Unable to log out. Please try again.');
      setLogoutStatus(LOGOUT_STATUS.idle);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View style={styles.logoContainer}>
          <Image
            accessibilityLabel="Rocket Food Delivery"
            resizeMode="contain"
            source={require('../assets/app-logo.png')}
            style={styles.logo}
          />
        </View>
        <Pressable
          accessibilityLabel={isLoggingOut ? 'Logging out' : 'Log Out'}
          accessibilityRole="button"
          accessibilityState={{ busy: isLoggingOut, disabled: isLoggingOut }}
          disabled={isLoggingOut}
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && !isLoggingOut && styles.logoutButtonPressed,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
        >
          {isLoggingOut && <ActivityIndicator color={COLORS.white} size="small" />}
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.logoutText}>
            Log Out
          </Text>
        </Pressable>
      </View>
      {logoutError ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={styles.logoutError}
        >
          {logoutError}
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.charcoal,
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 2,
    shadowColor: COLORS.charcoal,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'space-between',
    minHeight: LAYOUT.headerMinHeight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  logoContainer: {
    flex: 1,
    height: LAYOUT.headerLogoHeight,
    maxWidth: LAYOUT.headerLogoMaxWidth,
    minWidth: 0,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 12,
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    minWidth: 108,
    paddingHorizontal: SPACING.md,
  },
  logoutButtonPressed: {
    backgroundColor: COLORS.darkRed,
  },
  logoutButtonDisabled: {
    opacity: 0.75,
  },
  logoutText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 18,
    textTransform: 'uppercase',
  },
  logoutError: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    textAlign: 'right',
  },
});
