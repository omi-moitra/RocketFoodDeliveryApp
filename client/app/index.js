/**
 * File: index.js
 * Purpose: Authenticates customers from the unauthenticated root route.
 * Contents: imports and validation, Login screen behavior, wireframe styles.
 */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { ApiRequestError } from '../services/apiClient';
import { authenticateUser } from '../services/authService';
import { isValidEmail } from '../utils/validation';

// These module constants keep user messages identical across submissions; the email shape rule is
// the shared isValidEmail helper so Login and Account cannot drift to different email validation.
const FORM_MESSAGES = Object.freeze({
  emailRequired: 'Enter your email address.',
  emailShape: 'Enter a valid email address.',
  passwordRequired: 'Enter your password.',
  session: 'Your login could not be saved. Please try again.',
  unexpected: 'Login could not be completed. Please try again.',
});

/**
 * Returns the first client-side credential problem, or null when submission may continue.
 * LoginScreen calls it before touching the network so the user gets immediate field feedback.
 * Read aloud: “validate credentials.”
 */
function validateCredentials(email, password) {
  if (!email) {
    return { field: 'email', message: FORM_MESSAGES.emailRequired };
  }

  if (!isValidEmail(email)) {
    return { field: 'email', message: FORM_MESSAGES.emailShape };
  }

  if (!password) {
    return { field: 'password', message: FORM_MESSAGES.passwordRequired };
  }

  return null;
}

/**
 * Renders the login form and coordinates validation, authentication, and session persistence.
 * Expo Router uses it as the unauthenticated root route.
 * Read aloud: “login screen.”
 */
export default function LoginScreen() {
  const { completeSignIn } = useAuth();

  // These values are the visible form/request state that causes React to re-render the screen.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs retain controls and request locks without scheduling a render when they change.
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const activeRequestRef = useRef(null);
  const isMountedRef = useRef(true);
  const submissionLockRef = useRef(false);
  // Success keeps the button in its busy presentation because the root navigator is about to
  // swap trees; reverting to the idle label would flash “LOG IN” for one frame after login.
  const isSubmitting = loginState === 'submitting' || loginState === 'success';

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      activeRequestRef.current?.abort();
    };
  }, []);

  /**
   * Moves keyboard focus to the field named by a validation result.
   * handleLogin uses it after local validation fails.
   * Read aloud: “focus invalid field.”
   */
  function focusInvalidField(field) {
    const inputRef = field === 'email' ? emailInputRef : passwordInputRef;
    inputRef.current?.focus();
  }

  /**
   * Runs one complete login attempt while preventing duplicate or post-unmount updates.
   * The form button and password submit action both call this handler.
   * Read aloud: “handle login.”
   */
  async function handleLogin() {
    // The ref closes the small gap before React applies the submitting state.
    if (submissionLockRef.current) {
      return;
    }

    const normalizedEmail = email.trim();
    const validationError = validateCredentials(normalizedEmail, password);

    setEmail(normalizedEmail);
    setErrorMessage('');

    if (validationError) {
      setLoginState('error');
      setErrorMessage(validationError.message);
      focusInvalidField(validationError.field);
      return;
    }

    submissionLockRef.current = true;
    setLoginState('submitting');
    const requestController = new AbortController();
    activeRequestRef.current = requestController;

    try {
      const session = await authenticateUser({
        email: normalizedEmail,
        password,
        signal: requestController.signal,
      });

      if (!isMountedRef.current || requestController.signal.aborted) {
        return;
      }

      try {
        await completeSignIn(session);
      } catch {
        throw new ApiRequestError('storage', FORM_MESSAGES.session);
      }

      if (isMountedRef.current) {
        setLoginState('success');
      }
    } catch (error) {
      if (!isMountedRef.current || error?.code === 'aborted') {
        return;
      }

      setLoginState('error');
      setErrorMessage(
        error instanceof ApiRequestError ? error.message : FORM_MESSAGES.unexpected,
      );
    } finally {
      if (activeRequestRef.current === requestController) {
        activeRequestRef.current = null;
      }

      submissionLockRef.current = false;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoider}
      >
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

          <View style={styles.loginCard}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to begin</Text>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isSubmitting}
              keyboardType="email-address"
              onChangeText={setEmail}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              placeholder="Enter your primary email here"
              placeholderTextColor={COLORS.charcoal}
              ref={emailInputRef}
              returnKeyType="next"
              style={styles.input}
              value={email}
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="current-password"
              editable={!isSubmitting}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.charcoal}
              ref={passwordInputRef}
              returnKeyType="go"
              secureTextEntry
              style={[styles.input, styles.passwordInput]}
              value={password}
            />

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

            <Pressable
              accessibilityLabel="Log in"
              accessibilityRole="button"
              accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                isSubmitting && styles.loginButtonDisabled,
                pressed && !isSubmitting && styles.loginButtonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} style={styles.loginProgress} />
              ) : null}
              <Text style={styles.loginButtonText}>
                {isSubmitting ? 'LOGGING IN' : 'LOG IN'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  keyboardAvoider: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: SPACING.xl,
    paddingHorizontal: 44,
    paddingTop: SPACING.sm,
  },
  logo: {
    aspectRatio: 596 / 272,
    marginBottom: SPACING.lg,
    maxWidth: 330,
    width: '75%',
  },
  loginCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.charcoal,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    maxWidth: 480,
    padding: SPACING.md,
    shadowColor: COLORS.charcoal,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    width: '100%',
  },
  title: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 18,
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.charcoal,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
    minHeight: 56,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  passwordInput: {
    marginBottom: 0,
  },
  messageRegion: {
    justifyContent: 'flex-end',
    minHeight: 28,
  },
  errorMessage: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.md,
  },
  loginButtonDisabled: {
    opacity: 0.75,
  },
  loginButtonPressed: {
    opacity: 0.88,
  },
  loginProgress: {
    marginRight: SPACING.sm,
  },
  loginButtonText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldRegular,
    fontSize: 20,
    letterSpacing: 0.5,
  },
});
