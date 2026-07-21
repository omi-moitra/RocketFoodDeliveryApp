/**
 * File: index.js
 * Purpose: Loads the active courier's deliveries and drives status progression and details.
 * Contents:
 * 1. Imports, messages, and screen state
 * 2. Status mutation orchestration (accept, deliver, retry assignment) with partial recovery
 * 3. Retry and View/modal-selection handlers
 * 4. Result states and delivery rows
 * 5. Order Delivery styles
 */

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import DeliveryDetailsModal from '../../components/DeliveryDetailsModal';
import DeliveryRow from '../../components/DeliveryRow';
import RefreshErrorBanner from '../../components/RefreshErrorBanner';
import ResultState from '../../components/ResultState';
import { useProtectedFocusList } from '../../components/useProtectedFocusList';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ApiRequestError } from '../../services/apiClient';
import {
  acceptDelivery,
  assignActiveCourier,
  DELIVERY_STATUS,
  fetchCourierDeliveries,
  markDelivered,
} from '../../services/orderService';

const ORDER_DELIVERY_MESSAGES = Object.freeze({
  connection: 'Unable to load deliveries. Check your connection and try again.',
  empty: 'There are no deliveries available right now.',
  refresh: 'Deliveries could not be refreshed. The list below may be out of date.',
  response: 'Deliveries could not be loaded. Please try again.',
});

/**
 * Converts a mutation failure into one user-safe message without exposing raw server details.
 * Read aloud: “mutation error message.”
 */
function mutationErrorMessage(error) {
  if (error instanceof ApiRequestError) {
    return error.code === 'connection' ? ORDER_DELIVERY_MESSAGES.connection : error.message;
  }

  return ORDER_DELIVERY_MESSAGES.response;
}

/**
 * Loads the courier's eligible deliveries on focus and drives status progression and details.
 * Expo Router renders it for the Order Delivery tab inside the courier layout.
 * Read aloud: “order delivery screen.”
 */
export default function OrderDeliveryScreen() {
  const { handleUnauthorized, session } = useAuth();

  // The read/refresh lifecycle (requestStatus, abort/generation guards, refresh-preserves-rows,
  // etc.) is identical to the Customer Order History screen and lives in the shared hook. Only the
  // mutation state machine below is courier-specific and must not be merged into that hook.
  const {
    errorMessage,
    hasRows,
    isRefreshing,
    items: deliveries,
    refreshErrorMessage,
    requestStatus,
    retry: handleRetry,
    setItems: setDeliveries,
  } = useProtectedFocusList({
    fetchItems: fetchCourierDeliveries,
    handleUnauthorized,
    messages: ORDER_DELIVERY_MESSAGES,
    session,
  });

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  // activeMutation tracks the one in-flight/failed per-order status change: { orderId, phase, message }
  // where phase is 'updating' | 'partial' | 'error'. Only one mutation runs at a time.
  const [activeMutation, setActiveMutation] = useState(null);

  // The mutation refs lock out concurrent status changes and cancel an in-flight one on unmount.
  const mutationLockRef = useRef(false);
  const mutationControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      mutationControllerRef.current?.abort();
    };
  }, []);

  /**
   * Applies a persisted mutation result to its row, then reconciles the whole list in the
   * background so eligibility recomputes from server state rather than an optimistic guess.
   * Read aloud: “apply mutation success.”
   */
  function applyMutationSuccess(updatedDelivery) {
    setDeliveries((currentDeliveries) =>
      currentDeliveries.map((delivery) =>
        delivery.id === updatedDelivery.id ? updatedDelivery : delivery,
      ),
    );
    setActiveMutation(null);
    // Reconcile the whole list in the background so eligibility recomputes from server state
    // rather than an optimistic guess; this is the same shared-hook refresh the Retry banner uses.
    handleRetry();
  }

  /**
   * Runs one status mutation under the single-mutation lock, handling partial and failure states.
   * `runner` receives the abort signal and resolves with the persisted delivery.
   * Read aloud: “run status mutation.”
   */
  async function runStatusMutation(orderId, runner) {
    // The ref lock closes the gap before React applies the updating state, so no second control
    // can start a concurrent status change.
    if (mutationLockRef.current) {
      return;
    }

    mutationLockRef.current = true;
    const requestController = new AbortController();
    mutationControllerRef.current = requestController;
    setActiveMutation({ orderId, phase: 'updating' });

    try {
      const updatedDelivery = await runner(requestController.signal);

      if (!isMountedRef.current || requestController.signal.aborted) {
        return;
      }

      applyMutationSuccess(updatedDelivery);
    } catch (error) {
      if (!isMountedRef.current || requestController.signal.aborted || error?.code === 'aborted') {
        return;
      }

      if (error?.code === 'unauthorized') {
        await handleUnauthorized();
        return;
      }

      // A partial acceptance persisted status 2 but not the assignment. Keep the row visible with a
      // retry-assignment action instead of refreshing it away or claiming acceptance succeeded.
      if (error?.code === 'partial') {
        setActiveMutation({ orderId, phase: 'partial' });
        return;
      }

      setActiveMutation({ message: mutationErrorMessage(error), orderId, phase: 'error' });
    } finally {
      if (mutationControllerRef.current === requestController) {
        mutationControllerRef.current = null;
      }

      mutationLockRef.current = false;
    }
  }

  /**
   * Advances a delivery: accept a pending order, or mark the courier's in-progress order delivered.
   * Read aloud: “handle advance status.”
   */
  function handleAdvanceStatus(delivery) {
    if (delivery.status === DELIVERY_STATUS.PENDING) {
      runStatusMutation(delivery.id, (signal) => acceptDelivery({ delivery, signal }));
      return;
    }

    if (delivery.status === DELIVERY_STATUS.IN_PROGRESS) {
      runStatusMutation(delivery.id, (signal) => markDelivered({ delivery, signal }));
    }
  }

  /**
   * Recovers a partial acceptance by assigning the active courier to the already-in-progress order.
   * Read aloud: “handle retry assignment.”
   */
  function handleRetryAssignment(delivery) {
    runStatusMutation(delivery.id, (signal) =>
      assignActiveCourier({ orderId: delivery.id, signal }),
    );
  }

  /**
   * Opens the details modal with the exact validated delivery object from the pressed row.
   * Read aloud: “handle view delivery.”
   */
  function handleViewDelivery(delivery) {
    if (selectedDelivery) {
      return;
    }

    setSelectedDelivery(delivery);
  }

  // Closing only clears the selection; the list, its data, and its scroll position are untouched.
  function handleCloseDetails() {
    setSelectedDelivery(null);
  }

  function renderDeliveryRow({ item }) {
    const mutationForRow = activeMutation?.orderId === item.id ? activeMutation : null;

    return (
      <DeliveryRow
        delivery={item}
        errorMessage={mutationForRow?.message}
        mutationPhase={mutationForRow?.phase ?? null}
        onAdvanceStatus={handleAdvanceStatus}
        onRetryAssignment={handleRetryAssignment}
        onView={() => handleViewDelivery(item)}
      />
    );
  }

  function renderResultState() {
    if (requestStatus === 'resolving' || requestStatus === 'loading') {
      return <ResultState kind="loading" message="Loading deliveries…" />;
    }

    // A valid empty array is a deliberate no-deliveries state, never an error.
    if (requestStatus === 'empty' || (isRefreshing && deliveries.length === 0)) {
      return (
        <ResultState kind="info" message={ORDER_DELIVERY_MESSAGES.empty} title="No deliveries" />
      );
    }

    if (requestStatus === 'error') {
      return (
        <ResultState
          actionLabel="Retry"
          kind="error"
          message={errorMessage || ORDER_DELIVERY_MESSAGES.response}
          onAction={handleRetry}
        />
      );
    }

    return null;
  }

  return (
    <>
      <View style={styles.screen}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.pageTitle}>
            MY DELIVERIES
          </Text>
          {isRefreshing ? <ActivityIndicator color={COLORS.orangeRed} size="small" /> : null}
        </View>

        <RefreshErrorBanner message={refreshErrorMessage} onRetry={handleRetry} />

        <FlatList
          contentContainerStyle={styles.listContent}
          data={hasRows ? deliveries : []}
          keyExtractor={(delivery) => String(delivery.id)}
          ListHeaderComponent={
            hasRows ? (
              <View accessible accessibilityLabel="Order ID, Address, Status, View" style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.orderHeader]}>ORDER{`\n`}ID</Text>
                <Text style={[styles.tableHeaderText, styles.addressHeader]}>ADDRESS</Text>
                <Text style={[styles.tableHeaderText, styles.statusHeader]}>STATUS</Text>
                <Text style={[styles.tableHeaderText, styles.viewHeader]}>VIEW</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={renderResultState}
          renderItem={renderDeliveryRow}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <DeliveryDetailsModal
        delivery={selectedDelivery}
        onClose={handleCloseDetails}
        visible={selectedDelivery !== null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.white,
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldRegular,
    fontSize: 28,
  },
  listContent: {
    flexGrow: 1,
  },
  tableHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.charcoal,
    flexDirection: 'row',
    gap: SPACING.xs,
    minHeight: 52,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  orderHeader: {
    width: 44,
  },
  addressHeader: {
    flex: 1,
    minWidth: 0,
  },
  statusHeader: {
    minWidth: 104,
  },
  viewHeader: {
    width: LAYOUT.minimumTouchTarget,
  },
});
