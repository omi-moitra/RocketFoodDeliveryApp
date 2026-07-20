/**
 * File: index.js
 * Purpose: Loads the active courier's deliveries and drives status progression and details.
 * Contents:
 * 1. Imports, messages, and screen state
 * 2. Focus-driven delivery loading and refresh protection
 * 3. Status mutation orchestration (accept, deliver, retry assignment) with partial recovery
 * 4. Retry and View/modal-selection handlers
 * 5. Result states and delivery rows
 * 6. Order Delivery styles
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import DeliveryDetailsModal from '../../components/DeliveryDetailsModal';
import DeliveryRow from '../../components/DeliveryRow';
import ResultState from '../../components/ResultState';
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

  // requestStatus is the one explicit lifecycle value (resolving → loading → ready/empty/error,
  // plus refreshing while existing rows stay visible), avoiding impossible boolean combinations.
  const [deliveries, setDeliveries] = useState([]);
  const [requestStatus, setRequestStatus] = useState('resolving');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshErrorMessage, setRefreshErrorMessage] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [retrySequence, setRetrySequence] = useState(0);
  // activeMutation tracks the one in-flight/failed per-order status change: { orderId, phase, message }
  // where phase is 'updating' | 'partial' | 'error'. Only one mutation runs at a time.
  const [activeMutation, setActiveMutation] = useState(null);

  // newestRequestRef discards stale reads; the count refs distinguish first load from refresh; the
  // mutation refs lock out concurrent status changes and cancel an in-flight one on unmount.
  const newestRequestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const lastDeliveryCountRef = useRef(0);
  const mutationLockRef = useRef(false);
  const mutationControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      mutationControllerRef.current?.abort();
    };
  }, []);

  useFocusEffect(
    // The focus effect drives loading so returning to the tab refreshes the list and a status
    // change confirmed elsewhere appears without a manual reload. Blurring aborts the request.
    useCallback(() => {
      if (!session?.accessToken) {
        // Missing session: the courier layout redirects to Login; never request without one.
        return undefined;
      }

      const requestController = new AbortController();
      const requestId = newestRequestRef.current + 1;
      newestRequestRef.current = requestId;

      // A refresh keeps the current rows on screen instead of flashing back to a spinner.
      setRefreshErrorMessage('');
      setRequestStatus(hasLoadedOnceRef.current ? 'refreshing' : 'loading');

      async function loadDeliveries() {
        try {
          const loadedDeliveries = await fetchCourierDeliveries({
            signal: requestController.signal,
          });

          // Only the newest active request may replace the list; a late response changes nothing.
          if (requestController.signal.aborted || requestId !== newestRequestRef.current) {
            return;
          }

          hasLoadedOnceRef.current = true;
          lastDeliveryCountRef.current = loadedDeliveries.length;
          setDeliveries(loadedDeliveries);
          setRequestStatus(loadedDeliveries.length ? 'ready' : 'empty');
        } catch (error) {
          if (
            requestController.signal.aborted ||
            error?.code === 'aborted' ||
            requestId !== newestRequestRef.current
          ) {
            return;
          }

          // HTTP 401/403 proves the session is unusable; the shared transition signs out instead
          // of leaving a retryable page error that could never succeed.
          if (error?.code === 'unauthorized') {
            await handleUnauthorized();
            return;
          }

          // A failed refresh with data on screen keeps the existing rows and shows a banner; only
          // a failed first load may occupy the whole list area.
          if (hasLoadedOnceRef.current) {
            setRefreshErrorMessage(ORDER_DELIVERY_MESSAGES.refresh);
            setRequestStatus(lastDeliveryCountRef.current ? 'ready' : 'empty');
            return;
          }

          setRequestStatus('error');
          setErrorMessage(
            error instanceof ApiRequestError && error.code === 'connection'
              ? ORDER_DELIVERY_MESSAGES.connection
              : error instanceof ApiRequestError
                ? error.message
                : ORDER_DELIVERY_MESSAGES.response,
          );
        }
      }

      loadDeliveries();

      return () => {
        requestController.abort();
      };
    }, [handleUnauthorized, retrySequence, session?.accessToken]),
  );

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
    setRetrySequence((currentSequence) => currentSequence + 1);
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

  function handleRetry() {
    setRetrySequence((currentSequence) => currentSequence + 1);
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

  const isRefreshing = requestStatus === 'refreshing';
  const hasRows = deliveries.length > 0 && (requestStatus === 'ready' || isRefreshing);

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
            ORDER DELIVERY
          </Text>
          {isRefreshing ? <ActivityIndicator color={COLORS.orangeRed} size="small" /> : null}
        </View>

        {refreshErrorMessage ? (
          <View accessibilityLiveRegion="polite" style={styles.refreshErrorBanner}>
            <Text style={styles.refreshErrorText}>{refreshErrorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleRetry}
              style={({ pressed }) => [styles.refreshRetry, pressed && styles.refreshRetryPressed]}
            >
              <Text style={styles.refreshRetryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <FlatList
          contentContainerStyle={styles.listContent}
          data={hasRows ? deliveries : []}
          keyExtractor={(delivery) => String(delivery.id)}
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
    padding: SPACING.lg,
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
  refreshErrorBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  refreshErrorText: {
    color: COLORS.darkRed,
    flex: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
  },
  refreshRetry: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.sm,
  },
  refreshRetryPressed: {
    opacity: 0.6,
  },
  refreshRetryText: {
    color: COLORS.orangeRed,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 16,
  },
  listContent: {
    flexGrow: 1,
  },
});
