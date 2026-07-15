/**
 * File: order-history.js
 * Purpose: Loads and displays the authenticated customer's orders as the MY ORDERS table.
 * Contents:
 * 1. Imports, messages, and screen state
 * 2. Focus-driven order loading and refresh protection
 * 3. Retry, View-action, and modal-selection handlers
 * 4. Table header, result states, and order rows
 * 5. Order History styles
 */

import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import OrderHistoryModal from '../../components/OrderHistoryModal';
import OrderHistoryRow, { ORDER_TABLE_COLUMNS } from '../../components/OrderHistoryRow';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ApiRequestError } from '../../services/apiClient';
import { fetchCustomerOrders } from '../../services/orderService';

const ORDER_HISTORY_MESSAGES = Object.freeze({
  connection: 'Unable to load your orders. Check your connection and try again.',
  empty: 'Your orders will appear here after your first purchase.',
  refresh: 'Your orders could not be refreshed. The list below may be out of date.',
  response: 'Your order history could not be loaded. Please try again.',
});

/**
 * Loads the customer's orders on focus and renders the ORDER/STATUS/VIEW table with one modal.
 * Expo Router renders it for the Order History footer tab inside the customer layout.
 * Read aloud: “order history screen.”
 */
export default function OrderHistoryScreen() {
  const { handleUnauthorized, session } = useAuth();

  // requestStatus is the one explicit lifecycle value (resolving → loading → ready/empty/error,
  // plus refreshing while existing rows stay visible); overlapping booleans are avoided because
  // they can express impossible combinations such as “loading and ready at the same time”.
  const [orders, setOrders] = useState([]);
  const [requestStatus, setRequestStatus] = useState('resolving');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshErrorMessage, setRefreshErrorMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [retrySequence, setRetrySequence] = useState(0);

  // newestRequestRef discards stale responses when a focus refresh supersedes an older request;
  // hasLoadedOnceRef and lastOrderCountRef distinguish the first load from a data-preserving
  // refresh without putting `orders` in the focus callback's dependencies (which would loop).
  const newestRequestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const lastOrderCountRef = useRef(0);

  useFocusEffect(
    // The focus effect (not a mount effect) drives loading so returning to the tab refreshes the
    // list and an order created moments earlier in the confirmation modal appears without a
    // manual app reload. Blurring the tab aborts the request through the cleanup below.
    useCallback(() => {
      if (!session?.accessToken) {
        // Missing session: the customer layout redirects to Login; never request without one.
        return undefined;
      }

      const requestController = new AbortController();
      const requestId = newestRequestRef.current + 1;
      newestRequestRef.current = requestId;

      // A refresh keeps the current rows on screen instead of flashing back to a spinner.
      setRefreshErrorMessage('');
      setRequestStatus(hasLoadedOnceRef.current ? 'refreshing' : 'loading');

      async function loadOrders() {
        try {
          const loadedOrders = await fetchCustomerOrders({ signal: requestController.signal });

          // Only the newest active request may replace the list; a late response changes nothing.
          if (requestController.signal.aborted || requestId !== newestRequestRef.current) {
            return;
          }

          hasLoadedOnceRef.current = true;
          lastOrderCountRef.current = loadedOrders.length;
          setOrders(loadedOrders);
          setRequestStatus(loadedOrders.length ? 'ready' : 'empty');
        } catch (error) {
          if (
            requestController.signal.aborted ||
            error?.code === 'aborted' ||
            requestId !== newestRequestRef.current
          ) {
            return;
          }

          // HTTP 401/403 proves the session is unusable; the shared transition signs out
          // instead of leaving a retryable page error that could never succeed.
          if (error?.code === 'unauthorized') {
            await handleUnauthorized();
            return;
          }

          // A failed refresh with data on screen keeps the existing rows visible and shows a
          // non-destructive banner; only a failed first load may occupy the whole table area.
          if (hasLoadedOnceRef.current) {
            setRefreshErrorMessage(ORDER_HISTORY_MESSAGES.refresh);
            setRequestStatus(lastOrderCountRef.current ? 'ready' : 'empty');
            return;
          }

          setRequestStatus('error');
          setErrorMessage(
            error instanceof ApiRequestError && error.code === 'connection'
              ? ORDER_HISTORY_MESSAGES.connection
              : error instanceof ApiRequestError
                ? error.message
                : ORDER_HISTORY_MESSAGES.response,
          );
        }
      }

      loadOrders();

      return () => {
        requestController.abort();
      };
    }, [handleUnauthorized, retrySequence, session?.accessToken]),
  );

  function handleRetry() {
    setRetrySequence((currentSequence) => currentSequence + 1);
  }

  /**
   * Opens the detail modal with the exact validated order object from the pressed row.
   * The guard makes rapid or repeated View taps a no-op while one modal is already selected,
   * so modals can never stack or switch to the wrong order mid-open.
   * Read aloud: “handle view order.”
   */
  function handleViewOrder(order) {
    if (selectedOrder) {
      return;
    }

    setSelectedOrder(order);
  }

  // Closing only clears the selection; the list, its data, and its scroll position are untouched
  // and no refetch happens, per the modal-close contract.
  function handleCloseOrderDetails() {
    setSelectedOrder(null);
  }

  const isRefreshing = requestStatus === 'refreshing';
  const hasRows = orders.length > 0 && (requestStatus === 'ready' || isRefreshing);

  function renderOrderRow({ item }) {
    return <OrderHistoryRow onView={() => handleViewOrder(item)} order={item} />;
  }

  function renderResultState() {
    if (requestStatus === 'resolving' || requestStatus === 'loading') {
      return (
        <View accessibilityLiveRegion="polite" style={styles.stateContainer}>
          <ActivityIndicator color={COLORS.orangeRed} size="large" />
          <Text style={styles.stateText}>Loading your orders…</Text>
        </View>
      );
    }

    // A valid empty array is a deliberate no-orders state, never an error, and a refresh that
    // finds no rows keeps showing this same message instead of flashing a spinner.
    if (requestStatus === 'empty' || (isRefreshing && orders.length === 0)) {
      return (
        <View accessibilityLiveRegion="polite" style={styles.stateContainer}>
          <Text style={styles.stateTitle}>No orders yet</Text>
          <Text style={styles.stateText}>{ORDER_HISTORY_MESSAGES.empty}</Text>
        </View>
      );
    }

    if (requestStatus === 'error') {
      return (
        <View accessibilityLiveRegion="assertive" style={styles.stateContainer}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {errorMessage || ORDER_HISTORY_MESSAGES.response}
          </Text>
          <Pressable accessibilityRole="button" onPress={handleRetry} style={styles.stateButton}>
            <Text style={styles.stateButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  }

  return (
    <>
      <View style={styles.screen}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.pageTitle}>
            MY ORDERS
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

        {/* The charcoal heading band stays fixed above the scrolling rows so the three columns
            remain visually associated with their headings on long histories. */}
        {hasRows ? (
          <View style={styles.tableHeader}>
            <Text style={[ORDER_TABLE_COLUMNS.order, styles.tableHeaderText]}>ORDER</Text>
            <Text style={[ORDER_TABLE_COLUMNS.status, styles.tableHeaderText]}>STATUS</Text>
            <View style={ORDER_TABLE_COLUMNS.view}>
              <Text style={styles.tableHeaderText}>VIEW</Text>
            </View>
          </View>
        ) : null}

        <FlatList
          contentContainerStyle={styles.listContent}
          data={hasRows ? orders : []}
          keyExtractor={(order) => String(order.id)}
          ListEmptyComponent={renderResultState}
          renderItem={renderOrderRow}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <OrderHistoryModal
        onClose={handleCloseOrderDetails}
        order={selectedOrder}
        visible={selectedOrder !== null}
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
  tableHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.charcoal,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    flexDirection: 'row',
    gap: SPACING.sm,
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.sm,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 17,
  },
  listContent: {
    flexGrow: 1,
  },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 300,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
  },
  stateTitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 23,
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    textAlign: 'center',
  },
  stateButton: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.md,
  },
  stateButtonText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 17,
  },
});
