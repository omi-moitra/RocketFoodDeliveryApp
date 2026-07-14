/**
 * File: _layout.js
 * Purpose: Defines the root stack and protects login/customer routes from stale sessions.
 * Contents: loading state, protected root navigator, providers.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Oswald_400Regular } from '@expo-google-fonts/oswald/400Regular';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald/600SemiBold';
import { useFonts } from 'expo-font';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { COLORS } from '../constants/theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootNavigator() {
  const { isSessionLoading, session } = useAuth();
  const [areFontsLoaded, fontError] = useFonts({
    Oswald_400Regular,
    Oswald_600SemiBold,
  });

  if (fontError) {
    throw fontError;
  }

  if (isSessionLoading || !areFontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.orangeRed} size="large" />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="index" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="customer" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
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
