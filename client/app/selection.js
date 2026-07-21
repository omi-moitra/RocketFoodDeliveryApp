/**
 * File: selection.js
 * Purpose: Lets a dual-role user choose Customer or Courier before any role app opens.
 * Contents:
 * 1. imports
 * 2. Account Selection screen behavior
 * 3. wireframe styles
 */

import { useRef, useState } from 'react';
import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../storage/authStorage';
import AppIcon from '../components/AppIcon';

// A single user-safe message covers any storage failure without leaking internal detail.
const SELECTION_ERROR = 'Your selection could not be saved. Please try again.';

/**
 * Renders the Customer/Courier choice and persists exactly one before its role app appears.
 * Expo Router exposes it only while a dual-role session has no active role selected.
 */
export default function AccountSelectionScreen() {
  const { selectRole, session } = useAuth();

  // These values drive the visible busy/error presentation of the two choices.
  const [selectionState, setSelectionState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  // The ref closes the small gap before React applies the pending state, blocking duplicate taps.
  const submissionLockRef = useRef(false);
  const isSelecting = selectionState === 'selecting';

  // Defense in depth: only a dual-role session belongs here. A single-role or missing session
  // fails closed to Login even if it somehow reaches this route directly.
  if (!session || !session.customerId || !session.courierId) {
    return <Redirect href="/" />;
  }

  /**
   * Persists one role choice, ignoring duplicate taps while a write is in flight.
   * Both role buttons call it; the root guard swaps to the chosen tree once storage succeeds.
   */
  async function handleSelectRole(role) {
    if (submissionLockRef.current) {
      return;
    }

    submissionLockRef.current = true;
    setErrorMessage('');
    setSelectionState('selecting');

    try {
      await selectRole(role);
      // On success the root guard removes this screen; the busy state stays until unmount.
    } catch {
      setErrorMessage(SELECTION_ERROR);
      setSelectionState('idle');
      submissionLockRef.current = false;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          accessibilityLabel="Rocket Food Delivery"
          resizeMode="contain"
          source={require('../assets/login-logo.png')}
          style={styles.logo}
        />

        <Text style={styles.title}>Select Account Type</Text>
        <Text style={styles.subtitle}>Choose how you want to continue.</Text>

        <View style={styles.messageRegion}>
          {errorMessage ? (
            <Text
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
              style={styles.errorMessage}
            >
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <View style={styles.choiceGrid}>
          <Pressable
            accessibilityLabel="Continue as Customer"
            accessibilityRole="button"
            accessibilityState={{ busy: isSelecting, disabled: isSelecting }}
            disabled={isSelecting}
            onPress={() => handleSelectRole(ROLES.customer)}
            style={({ pressed }) => [
              styles.choiceCard,
              isSelecting && styles.choiceButtonDisabled,
              pressed && !isSelecting && styles.choiceButtonPressed,
            ]}
          >
            <AppIcon color={COLORS.orangeRed} name="user" size={72} />
            <Text style={styles.choiceButtonText}>Customer</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Continue as Courier"
            accessibilityRole="button"
            accessibilityState={{ busy: isSelecting, disabled: isSelecting }}
            disabled={isSelecting}
            onPress={() => handleSelectRole(ROLES.courier)}
            style={({ pressed }) => [
              styles.choiceCard,
              isSelecting && styles.choiceButtonDisabled,
              pressed && !isSelecting && styles.choiceButtonPressed,
            ]}
          >
            <AppIcon color={COLORS.charcoal} name="car" size={72} />
            <Text style={styles.choiceButtonText}>Courier</Text>
          </Pressable>
        </View>

        {isSelecting ? (
          <ActivityIndicator
            color={COLORS.orangeRed}
            style={styles.progress}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 44,
    paddingVertical: SPACING.xl,
  },
  logo: {
    aspectRatio: 596 / 272,
    marginBottom: SPACING.xl,
    maxWidth: 330,
    width: '75%',
  },
  title: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  messageRegion: {
    justifyContent: 'flex-end',
    minHeight: 28,
    width: '100%',
  },
  errorMessage: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    textAlign: 'center',
  },
  choiceGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    maxWidth: 480,
    width: '100%',
  },
  choiceCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.charcoal,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: SPACING.md,
    justifyContent: 'center',
    minHeight: 180,
    padding: SPACING.md,
  },
  choiceButtonDisabled: {
    opacity: 0.75,
  },
  choiceButtonPressed: {
    backgroundColor: COLORS.warmYellow,
  },
  choiceButtonText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 19,
  },
  progress: {
    marginTop: SPACING.lg,
  },
});
