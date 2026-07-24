/**
 * File: AccountScreen.js
 * Purpose: Shared Customer/Courier Account Settings form: read-only user email, editable role
 *          email/phone, validation, save, and failure recovery. Rendered by both role wrappers.
 * Contents:
 * 1. Imports, labels, and messages
 * 2. Screen state, focus-driven load, and save orchestration
 * 3. Loading/error/ready presentation
 * 4. Styles
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
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

import ResultState from './ResultState';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { ApiRequestError } from '../services/apiClient';
import { fetchAccount, updateAccount } from '../services/accountService';
import { isValidEmail, isValidPhone } from '../utils/validation';

// Human-readable role label used for the editable field labels ("Customer Email", etc.).
const ROLE_LABELS = Object.freeze({ courier: 'Courier', customer: 'Customer' });

const ACCOUNT_MESSAGES = Object.freeze({
  emailInvalid: 'Enter a valid email address.',
  loadError: 'Your account could not be loaded. Please try again.',
  phoneInvalid: 'Enter a valid phone number.',
  saved: 'Your details were saved.',
});

const REQUEST_STATUS = Object.freeze({
  ERROR: 'error',
  LOADING: 'loading',
  READY: 'ready',
});

const SAVE_STATUS = Object.freeze({
  ERROR: 'error',
  IDLE: 'idle',
  SAVING: 'saving',
  SUCCESS: 'success',
});

/**
 * Renders the shared Account Settings experience for one validated active role.
 * The Customer and Courier route wrappers pass their `expectedRole`; the service verifies it
 * against the active session and returns only that role's editable email and phone.
 * @param {{expectedRole: 'customer'|'courier'}} props
 */
export default function AccountScreen({ expectedRole }) {
  const { handleUnauthorized, session } = useAuth();
  const roleLabel = ROLE_LABELS[expectedRole] ?? 'Account';

  // requestStatus is the initial-load lifecycle; savedAccount is the authoritative snapshot and the
  // draft fields are the editable copy. Field errors and saveStatus are tracked independently so
  // impossible states (saving with invalid fields, success while dirty) cannot be represented.
  const [requestStatus, setRequestStatus] = useState(REQUEST_STATUS.LOADING);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [savedAccount, setSavedAccount] = useState(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', phone: '' });
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [retrySequence, setRetrySequence] = useState(0);

  const newestRequestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const isDirtyRef = useRef(false);
  const saveLockRef = useRef(false);
  const saveControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // isDirty compares trimmed drafts against the saved snapshot; an unchanged form never submits.
  const isDirty =
    Boolean(savedAccount) &&
    (emailDraft.trim() !== savedAccount.roleEmail || phoneDraft.trim() !== savedAccount.rolePhone);

  // The ref mirror lets the focus loader decide whether to preserve unsaved edits without adding
  // draft state to its dependency list (which would re-run it on every keystroke).
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      saveControllerRef.current?.abort();
    };
  }, []);

  useFocusEffect(
    // Reload on focus so re-entering Account shows current persisted values — but never clobber
    // unsaved edits: skip the reload while the form is dirty.
    useCallback(() => {
      if (!session?.accessToken) {
        return undefined;
      }

      if (hasLoadedOnceRef.current && isDirtyRef.current) {
        return undefined;
      }

      const requestController = new AbortController();
      const requestId = newestRequestRef.current + 1;
      newestRequestRef.current = requestId;

      if (!hasLoadedOnceRef.current) {
        setRequestStatus(REQUEST_STATUS.LOADING);
      }

      async function loadAccount() {
        try {
          const account = await fetchAccount({ expectedRole, signal: requestController.signal });

          if (requestController.signal.aborted || requestId !== newestRequestRef.current) {
            return;
          }

          hasLoadedOnceRef.current = true;
          setSavedAccount(account);
          setEmailDraft(account.roleEmail);
          setPhoneDraft(account.rolePhone);
          setFieldErrors({ email: '', phone: '' });
          setSaveStatus(SAVE_STATUS.IDLE);
          setRequestStatus(REQUEST_STATUS.READY);
        } catch (error) {
          if (
            requestController.signal.aborted ||
            error?.code === 'aborted' ||
            requestId !== newestRequestRef.current
          ) {
            return;
          }

          if (error?.code === 'unauthorized') {
            await handleUnauthorized();
            return;
          }

          // A failed reload with data already on screen keeps the current values; only a failed
          // first load occupies the whole screen with a retryable error.
          if (hasLoadedOnceRef.current) {
            return;
          }

          setRequestStatus(REQUEST_STATUS.ERROR);
          setLoadErrorMessage(
            error instanceof ApiRequestError ? error.message : ACCOUNT_MESSAGES.loadError,
          );
        }
      }

      loadAccount();

      return () => {
        requestController.abort();
      };
    }, [expectedRole, handleUnauthorized, retrySequence, session?.accessToken]),
  );

  function handleRetry() {
    setRetrySequence((currentSequence) => currentSequence + 1);
  }

  function handleChangeEmail(value) {
    setEmailDraft(value);
    setSaveStatus(SAVE_STATUS.IDLE);
    if (fieldErrors.email) {
      setFieldErrors((current) => ({ ...current, email: '' }));
    }
  }

  function handleChangePhone(value) {
    setPhoneDraft(value);
    setSaveStatus(SAVE_STATUS.IDLE);
    if (fieldErrors.phone) {
      setFieldErrors((current) => ({ ...current, phone: '' }));
    }
  }

  /**
   * Validates locally, then saves the active role's email/phone and reloads authoritative values.
   * Duplicate saves are blocked; drafts are preserved on a retryable failure.
   */
  async function handleSave() {
    if (saveLockRef.current || !isDirty) {
      return;
    }

    const nextErrors = {
      email: isValidEmail(emailDraft) ? '' : ACCOUNT_MESSAGES.emailInvalid,
      phone: isValidPhone(phoneDraft) ? '' : ACCOUNT_MESSAGES.phoneInvalid,
    };

    if (nextErrors.email || nextErrors.phone) {
      setFieldErrors(nextErrors);
      setSaveStatus(SAVE_STATUS.IDLE);
      return;
    }

    saveLockRef.current = true;
    setFieldErrors({ email: '', phone: '' });
    setSaveErrorMessage('');
    setSaveStatus(SAVE_STATUS.SAVING);
    const requestController = new AbortController();
    saveControllerRef.current = requestController;

    try {
      const updated = await updateAccount({
        email: emailDraft,
        expectedRole,
        phone: phoneDraft,
        signal: requestController.signal,
      });

      if (!isMountedRef.current || requestController.signal.aborted) {
        return;
      }

      // Replace snapshot and drafts atomically with the authoritative persisted values.
      setSavedAccount(updated);
      setEmailDraft(updated.roleEmail);
      setPhoneDraft(updated.rolePhone);
      setSaveStatus(SAVE_STATUS.SUCCESS);
    } catch (error) {
      if (!isMountedRef.current || requestController.signal.aborted || error?.code === 'aborted') {
        return;
      }

      if (error?.code === 'unauthorized') {
        await handleUnauthorized();
        return;
      }

      // Preserve the user's drafts and the saved snapshot; only surface a safe retry message.
      setSaveStatus(SAVE_STATUS.ERROR);
      setSaveErrorMessage(
        error instanceof ApiRequestError ? error.message : ACCOUNT_MESSAGES.loadError,
      );
    } finally {
      if (saveControllerRef.current === requestController) {
        saveControllerRef.current = null;
      }

      saveLockRef.current = false;
    }
  }

  if (requestStatus === REQUEST_STATUS.LOADING) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ResultState kind="loading" message="Loading your account…" />
      </SafeAreaView>
    );
  }

  if (requestStatus === REQUEST_STATUS.ERROR) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ResultState
          actionLabel="Retry"
          kind="error"
          message={loadErrorMessage || ACCOUNT_MESSAGES.loadError}
          onAction={handleRetry}
        />
      </SafeAreaView>
    );
  }

  const isSaving = saveStatus === SAVE_STATUS.SAVING;
  const showSuccess = saveStatus === SAVE_STATUS.SUCCESS && !isDirty;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoider}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text accessibilityRole="header" style={styles.title}>
              MY ACCOUNT
            </Text>

            <Text style={styles.roleContext}>Logged In As: {roleLabel}</Text>

            <Text style={styles.inputLabel}>Primary Email (Read Only)</Text>
            <View style={styles.readOnlyField}>
              <Text
                accessibilityLabel={`User email ${savedAccount.primaryEmail}, read only`}
                style={styles.readOnlyText}
              >
                {savedAccount.primaryEmail}
              </Text>
            </View>
            <Text style={styles.helperText}>Email used to log in to the application.</Text>

            <Text style={styles.inputLabel}>{roleLabel} Email</Text>
            <TextInput
              accessibilityLabel={`${roleLabel} email`}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isSaving}
              keyboardType="email-address"
              onChangeText={handleChangeEmail}
              placeholder="Enter role email"
              placeholderTextColor={COLORS.charcoal}
              style={[styles.input, fieldErrors.email && styles.inputError]}
              value={emailDraft}
            />
            {fieldErrors.email ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {fieldErrors.email}
              </Text>
            ) : (
              <Text style={styles.helperText}>Email used for your {roleLabel} account.</Text>
            )}

            <Text style={styles.inputLabel}>{roleLabel} Phone</Text>
            <TextInput
              accessibilityLabel={`${roleLabel} phone`}
              autoComplete="tel"
              editable={!isSaving}
              keyboardType="phone-pad"
              onChangeText={handleChangePhone}
              placeholder="Enter role phone"
              placeholderTextColor={COLORS.charcoal}
              style={[styles.input, fieldErrors.phone && styles.inputError]}
              value={phoneDraft}
            />
            {fieldErrors.phone ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {fieldErrors.phone}
              </Text>
            ) : (
              <Text style={styles.helperText}>Phone number for your {roleLabel} account.</Text>
            )}

            <View style={styles.messageRegion}>
              {saveErrorMessage ? (
                <Text accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.saveError}>
                  {saveErrorMessage}
                </Text>
              ) : null}
              {showSuccess ? (
                <Text accessibilityLiveRegion="polite" style={styles.saveSuccess}>
                  {ACCOUNT_MESSAGES.saved}
                </Text>
              ) : null}
            </View>

            <Pressable
              accessibilityLabel="Update account details"
              accessibilityRole="button"
              accessibilityState={{ busy: isSaving, disabled: isSaving || !isDirty }}
              disabled={isSaving || !isDirty}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                (isSaving || !isDirty) && styles.saveButtonDisabled,
                pressed && isDirty && !isSaving && styles.saveButtonPressed,
              ]}
            >
              {isSaving ? <ActivityIndicator color={COLORS.white} style={styles.saveProgress} /> : null}
              <Text style={styles.saveButtonText}>
                {isSaving ? 'UPDATING ACCOUNT' : 'UPDATE ACCOUNT'}
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
    flexGrow: 1,
    padding: SPACING.lg,
  },
  formContainer: {
    alignSelf: 'center',
    maxWidth: 680,
    width: '100%',
  },
  title: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldRegular,
    fontSize: 28,
    marginBottom: SPACING.md,
  },
  roleContext: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  readOnlyField: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.charcoal,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  readOnlyText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
  },
  input: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.charcoal,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
    marginBottom: SPACING.sm,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  helperText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 12,
    marginBottom: SPACING.lg,
    opacity: 0.65,
  },
  inputError: {
    borderColor: COLORS.darkRed,
    borderWidth: 1,
  },
  fieldError: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  messageRegion: {
    justifyContent: 'flex-end',
    minHeight: 28,
    marginTop: SPACING.sm,
  },
  saveError: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
  },
  saveSuccess: {
    color: COLORS.mutedGreen,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 15,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonPressed: {
    backgroundColor: COLORS.darkRed,
  },
  saveProgress: {
    marginRight: SPACING.sm,
  },
  saveButtonText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldRegular,
    fontSize: 20,
    letterSpacing: 0.5,
  },
});
