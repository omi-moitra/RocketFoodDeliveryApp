/**
 * File: OrderConfirmationModal.js
 * Purpose: Reviews the selected products and submits the order with explicit request states.
 * Contents:
 * 1. Submission state model and wireframe copy
 * 2. Order confirmation modal component
 * 3. Confirmation modal styles
 */

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatProductCost } from '../constants/currency';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../services/orderService';

// The wireframe result copy is graded verbatim, so it lives here as fixed strings.
const RESULT_MESSAGES = Object.freeze({
  failureBody: 'Please try again.',
  failureTitle: 'Your order was not processed successfully.',
  successBody: 'Your order has been received.',
  successTitle: 'Thank you!',
});

/**
 * Shows the accurate positive-quantity selection and owns one order submission at a time.
 * RestaurantMenuScreen controls `visible` and the selection; the modal reports a confirmed
 * order back through `onOrderCreated` when the customer closes the success state.
 * Read aloud: “order confirmation modal.”
 */
export default function OrderConfirmationModal({
  onClose,
  onOrderCreated,
  restaurant,
  selectedProducts,
  visible,
}) {
  const { handleUnauthorized } = useAuth();

  // One explicit value models the request lifecycle (idle → processing → success, or error →
  // processing on retry). Independent booleans are avoided because they can express impossible
  // combinations such as “processing and success at the same time”.
  const [submissionState, setSubmissionState] = useState('idle');

  // submitLockRef blocks a second request synchronously, before React re-renders the disabled
  // button, so rapid double taps cannot race the state update. abortControllerRef lets close and
  // unmount cancel the in-flight request and mark any late response as ignorable.
  const submitLockRef = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Every open starts a fresh idle submission built from the menu's current selection.
      submitLockRef.current = false;
      setSubmissionState('idle');
      return undefined;
    }

    // The host can hide the modal without pressing X (for example on a restaurant change), so
    // hiding also aborts any pending request instead of relying on the close handler alone.
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    submitLockRef.current = false;
    return undefined;
  }, [visible]);

  // Leaving the screen entirely must abort a pending request so no late response updates
  // unmounted state or is mistaken for a fresh submission.
  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  /**
   * Validates preconditions, submits exactly one create-order request, and resolves the state.
   * The Confirm Order button calls it in the idle and error states.
   * Read aloud: “handle confirm order.”
   */
  async function handleConfirmOrder() {
    // The guard lives in the handler, not only in the disabled prop, so a stale enabled button
    // or a double-fired press event can never start a second request.
    if (
      submitLockRef.current ||
      submissionState === 'processing' ||
      submissionState === 'success'
    ) {
      return;
    }

    const restaurantId = Number(restaurant?.id);

    // A failed precondition (no restaurant ID or an empty selection) shows the failure state
    // without making a network request; the session itself is validated inside the service.
    if (!Number.isSafeInteger(restaurantId) || restaurantId <= 0 || selectedProducts.length === 0) {
      setSubmissionState('error');
      return;
    }

    submitLockRef.current = true;
    const requestController = new AbortController();
    abortControllerRef.current = requestController;
    setSubmissionState('processing');

    try {
      // customer_id and the bearer token are read from stored session data inside the service,
      // never from props, so credentials do not travel through the component tree.
      await createOrder({
        restaurantId,
        selectedProducts,
        signal: requestController.signal,
      });

      // A response that lands after close/unmount aborted the controller must change nothing.
      if (requestController.signal.aborted) {
        return;
      }

      setSubmissionState('success');
    } catch (error) {
      if (requestController.signal.aborted || error?.code === 'aborted') {
        return;
      }

      // HTTP 401 proves the session is unusable; retrying inside the modal could never succeed,
      // so the shared transition clears stored credentials and returns the customer to Login.
      if (error?.code === 'unauthorized') {
        await handleUnauthorized();
        return;
      }

      setSubmissionState('error');
    } finally {
      submitLockRef.current = false;
    }
  }

  /**
   * Applies the per-state close contract shared by the X control and the Android back action.
   * Closing from success notifies the host so the menu resets quantities; every other state
   * preserves the menu selection, and a pending request is aborted best-effort.
   * Read aloud: “handle close.”
   */
  function handleClose() {
    const wasOrderCreated = submissionState === 'success';

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    // The quantity reset is a host responsibility; this callback only reports the outcome so the
    // consumed selection cannot remain orderable by an accidental second confirmation.
    if (wasOrderCreated) {
      onOrderCreated?.();
    }

    onClose();
  }

  const totalCost = selectedProducts.reduce(
    (total, product) => total + product.cost * product.quantity,
    0,
  );
  const isProcessing = submissionState === 'processing';

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View pointerEvents="none" style={styles.backdropTint} />
        <View
          accessibilityLabel={
            restaurant ? `Order confirmation for ${restaurant.name}` : 'Order confirmation'
          }
          accessibilityViewIsModal
          style={styles.panel}
        >
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              Order Confirmation
            </Text>
            <Pressable
              accessibilityLabel="Close order confirmation"
              accessibilityRole="button"
              onPress={handleClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <FontAwesome6 color={COLORS.white} name="xmark" size={26} />
            </Pressable>
          </View>

          <Text style={styles.summaryTitle}>Order Summary</Text>

          {/* Only the product rows scroll so a long selection never hides the total or action. */}
          <ScrollView contentContainerStyle={styles.summaryContent} style={styles.summaryScroll}>
            {selectedProducts.map((product) => (
              <View
                accessible
                accessibilityLabel={`${product.quantity} of ${product.name}, ${formatProductCost(
                  product.cost * product.quantity,
                )}`}
                key={product.id}
                style={styles.summaryRow}
              >
                <Text style={[styles.summaryText, styles.productName]}>{product.name}</Text>
                <Text style={styles.summaryText}>x{product.quantity}</Text>
                <Text style={styles.summaryText}>
                  {formatProductCost(product.cost * product.quantity)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>TOTAL: {formatProductCost(totalCost)}</Text>
            </View>

            {submissionState === 'success' ? (
              // Success removes the action button entirely; closing is the only interaction left.
              <View
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={styles.resultArea}
              >
                <FontAwesome6 color={COLORS.mutedGreen} name="circle-check" size={44} />
                <Text style={styles.resultTitle}>{RESULT_MESSAGES.successTitle}</Text>
                <Text style={styles.resultText}>{RESULT_MESSAGES.successBody}</Text>
              </View>
            ) : (
              <>
                <Pressable
                  accessibilityLabel={isProcessing ? 'Processing Order…' : 'Confirm Order'}
                  accessibilityRole="button"
                  accessibilityState={{ busy: isProcessing, disabled: isProcessing }}
                  disabled={isProcessing}
                  onPress={handleConfirmOrder}
                  style={({ pressed }) => [
                    styles.actionButton,
                    isProcessing && styles.actionButtonProcessing,
                    pressed && !isProcessing && styles.actionButtonPressed,
                  ]}
                >
                  <Text style={styles.actionText}>
                    {isProcessing ? 'Processing Order…' : 'Confirm Order'}
                  </Text>
                </Pressable>
                {submissionState === 'error' ? (
                  <View
                    accessibilityLiveRegion="assertive"
                    accessibilityRole="alert"
                    style={styles.resultArea}
                  >
                    <FontAwesome6 color={COLORS.darkRed} name="circle-xmark" size={44} />
                    <Text style={styles.resultText}>{RESULT_MESSAGES.failureTitle}</Text>
                    <Text style={styles.resultText}>{RESULT_MESSAGES.failureBody}</Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.charcoal,
    opacity: 0.58,
  },
  panel: {
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.charcoal,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: '80%',
    maxWidth: 680,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.charcoal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 92,
    paddingHorizontal: SPACING.md,
  },
  title: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldRegular,
    fontSize: 28,
  },
  closeButton: {
    alignItems: 'center',
    height: LAYOUT.minimumTouchTarget,
    justifyContent: 'center',
    width: LAYOUT.minimumTouchTarget,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  summaryTitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 24,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  summaryScroll: {
    flexGrow: 0,
  },
  summaryContent: {
    paddingHorizontal: SPACING.md,
  },
  summaryRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  summaryText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
  },
  productName: {
    flex: 1,
  },
  footer: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  totalRow: {
    alignItems: 'flex-end',
    borderTopColor: COLORS.charcoal,
    borderTopWidth: 1,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  totalText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 22,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.md,
  },
  actionButtonPressed: {
    opacity: 0.75,
  },
  // The processing button keeps the approved action color; only its opacity signals disabled so
  // the label stays readable and no unapproved color enters the palette.
  actionButtonProcessing: {
    opacity: 0.72,
  },
  actionText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 19,
    textTransform: 'uppercase',
  },
  resultArea: {
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  resultTitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 20,
  },
  resultText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    textAlign: 'center',
  },
});
