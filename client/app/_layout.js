/**
 * File: _layout.js
 * Purpose: Defines the root stack and protects login/customer routes from stale sessions.
 * Contents: loading state, protected root navigator, providers.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Arimo_400Regular } from '@expo-google-fonts/arimo/400Regular';
import { Oswald_400Regular } from '@expo-google-fonts/oswald/400Regular';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald/600SemiBold';
import { useFonts } from 'expo-font';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ErrorBoundary from '../components/ErrorBoundary';
import { COLORS } from '../constants/theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

/**
 * Chooses the public or authenticated route tree after fonts and session storage resolve.
 * Used by RootLayout so protected screens never flash before startup checks finish.
 * Read aloud: “root navigator.”
 */
function RootNavigator() {
  const { isSessionLoading, session } = useAuth();
  // Arimo is an Arial-metric-compatible face used only as the Android body font (iOS keeps its
  // native Arial); see FONT_FAMILIES.body. Oswald supplies display text on every platform.
  const [areFontsLoaded, fontError] = useFonts({
    Arimo_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
  });

  // A font-load failure falls back to system fonts instead of taking down the app; every
  // text style routes through FONT_FAMILIES, which degrades safely when Oswald is missing.
  if (fontError && __DEV__) {
    console.warn('RootNavigator: fonts failed to load; continuing with system fonts.');
  }

  if (isSessionLoading || (!areFontsLoaded && !fontError)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.orangeRed} size="large" />
        <StatusBar style="dark" />
      </View>
    );
  }

  // Exactly one root branch is exposed for any resolved session. Each guard reads the validated
  // active role/ID from storage-restored context; no screen infers a role from a route name.
  const hasCustomerRole = Boolean(session?.customerId);
  const hasCourierRole = Boolean(session?.courierId);
  const isDualRolePending =
    Boolean(session) && hasCustomerRole && hasCourierRole && !session.activeRole;
  const isCustomerActive =
    Boolean(session) && session.activeRole === 'customer' && hasCustomerRole;
  const isCourierActive =
    Boolean(session) && session.activeRole === 'courier' && hasCourierRole;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="index" />
        </Stack.Protected>
        <Stack.Protected guard={isDualRolePending}>
          <Stack.Screen name="selection" />
        </Stack.Protected>
        <Stack.Protected guard={isCustomerActive}>
          <Stack.Screen name="customer" />
        </Stack.Protected>
        <Stack.Protected guard={isCourierActive}>
          <Stack.Screen name="courier" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

/**
 * Installs the safe-area and authentication providers around the application's navigator.
 * Expo Router calls this component as the root layout for every route.
 * Read aloud: “root layout.”
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    flex: 1,
    justifyContent: 'center',
  },
});
