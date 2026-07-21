/**
 * File: order-history.js
 * Purpose: Loads and displays the authenticated customer's orders as the MY ORDERS table.
 * Contents:
 * 1. Imports, messages, and screen state
 * 2. Retry, View-action, and modal-selection handlers
 * 3. Table header, result states, and order rows
 * 4. Order History styles
 */

import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import OrderHistoryModal from '../../components/OrderHistoryModal';
import OrderHistoryRow, { ORDER_TABLE_COLUMNS } from '../../components/OrderHistoryRow';
import RefreshErrorBanner from '../../components/RefreshErrorBanner';
import ResultState from '../../components/ResultState';
import { useProtectedFocusList } from '../../components/useProtectedFocusList';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
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

  const {
    errorMessage,
    hasRows,
    isRefreshing,
    items: orders,
    refreshErrorMessage,
    requestStatus,
    retry: handleRetry,
  } = useProtectedFocusList({
    fetchItems: fetchCustomerOrders,
    handleUnauthorized,
    messages: ORDER_HISTORY_MESSAGES,
    session,
  });

  const [selectedOrder, setSelectedOrder] = useState(null);

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

  function renderOrderRow({ item }) {
    return <OrderHistoryRow onView={() => handleViewOrder(item)} order={item} />;
  }

  function renderResultState() {
    if (requestStatus === 'resolving' || requestStatus === 'loading') {
      return <ResultState kind="loading" message="Loading your orders…" />;
    }

    // A valid empty array is a deliberate no-orders state, never an error, and a refresh that
    // finds no rows keeps showing this same message instead of flashing a spinner.
    if (requestStatus === 'empty' || (isRefreshing && orders.length === 0)) {
      return (
        <ResultState kind="info" message={ORDER_HISTORY_MESSAGES.empty} title="No orders yet" />
      );
    }

    if (requestStatus === 'error') {
      return (
        <ResultState
          actionLabel="Retry"
          kind="error"
          message={errorMessage || ORDER_HISTORY_MESSAGES.response}
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
            MY ORDERS
          </Text>
          {isRefreshing ? <ActivityIndicator color={COLORS.orangeRed} size="small" /> : null}
        </View>

        <RefreshErrorBanner message={refreshErrorMessage} onRetry={handleRetry} />

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
});
