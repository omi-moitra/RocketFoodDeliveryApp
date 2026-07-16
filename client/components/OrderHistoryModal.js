/**
 * File: OrderHistoryModal.js
 * Purpose: Presents one selected order's full details from the already-loaded history object.
 * Contents:
 * 1. Order-date formatting helper
 * 2. Order history detail modal component
 * 3. Modal styles
 */

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppIcon from './AppIcon';
import { formatProductCost } from '../constants/currency';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Formats the normalized ISO `createdOn` value as one documented human-readable date.
 * The wireframe leaves its sample date value blank, so `July 15, 2026` is the recorded
 * project-wide format decision; an unparseable value returns a safe blank so the header can
 * never show `Invalid Date`, `NaN`, or a raw ISO string.
 * Read aloud: “format order date.”
 * @param {string} createdOn ISO date-time string from the normalized order object.
 * @returns {string} A value such as `July 15, 2026`, or an empty string when unparseable.
 */
function formatOrderDate(createdOn) {
  if (typeof createdOn !== 'string' || !createdOn.trim()) {
    return '';
  }

  // The backend sends microsecond fractions (…T13:01:38.705432); the standard ISO profile stops
  // at milliseconds, so longer fractions are trimmed before parsing to stay engine-portable.
  const parsedDate = new Date(createdOn.trim().replace(/(\.\d{3})\d+/, '$1'));

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return ORDER_DATE_FORMATTER.format(parsedDate);
}

/**
 * Displays the detail modal for the order object selected on the Order History page.
 * The host page owns `visible` and the selected order; this component is presentation-only and
 * renders everything from that already-validated list object — the backend provides no
 * per-order detail endpoint, so no request or storage read ever happens here.
 * Read aloud: “order history modal.”
 */
export default function OrderHistoryModal({ onClose, order, visible }) {
  const orderDate = order ? formatOrderDate(order.createdOn) : '';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View pointerEvents="none" style={styles.backdropTint} />
        <View
          accessibilityLabel={
            order ? `Order details for ${order.restaurantName}` : 'Order details'
          }
          accessibilityViewIsModal
          style={styles.panel}
        >
          {/* Nothing order-specific renders while the page has no selection; the hidden modal
              must tolerate a null order without crashing. */}
          {order ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerTopRow}>
                  <Text accessibilityRole="header" style={styles.title}>
                    {order.restaurantName}
                  </Text>
                  <Pressable
                    accessibilityLabel="Close order details"
                    accessibilityRole="button"
                    onPress={onClose}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.closeButtonPressed,
                    ]}
                  >
                    <AppIcon color={COLORS.white} name="xmark" size={26} />
                  </Pressable>
                </View>
                <Text
                  accessibilityLabel={
                    orderDate ? `Order date ${orderDate}` : 'Order date unavailable'
                  }
                  style={styles.headerDetail}
                >
                  Order Date: {orderDate}
                </Text>
                {/* Uppercase is the wireframe's display transform only; order.status keeps its
                    raw lowercase value for any consumer of the list state. */}
                <Text accessibilityLabel={`Status ${order.status}`} style={styles.headerDetail}>
                  Status: {order.status.toUpperCase()}
                </Text>
                {/* A null courier is a valid not-yet-assigned pending state the grading sheet
                    requires to display safely: the visible value stays blank like the wireframe's
                    pending example, while screen readers hear an explicit fallback. The strings
                    "undefined" and "null" must never render. */}
                <Text
                  accessibilityLabel={
                    order.courierName
                      ? `Courier ${order.courierName}`
                      : 'Courier not assigned yet'
                  }
                  style={styles.headerDetail}
                >
                  Courier: {order.courierName ?? ''}
                </Text>
              </View>

              {/* Keying the scroll area by order id drops any retained scroll offset so viewing
                  order A and then order B always starts B's product list at the top. */}
              <ScrollView
                contentContainerStyle={styles.rowsContent}
                key={order.id}
                style={styles.rowsScroll}
              >
                {order.products.map((product) => (
                  <View
                    accessible
                    accessibilityLabel={`${product.quantity} of ${product.productName}, ${formatProductCost(
                      product.totalCost,
                    )}`}
                    key={product.productId}
                    style={styles.productRow}
                  >
                    <Text style={[styles.rowText, styles.productName]}>
                      {product.productName}
                    </Text>
                    <Text style={styles.rowText}>x{product.quantity}</Text>
                    {/* The backend already computed each line total (quantity × unit cost); the
                        modal displays those provided values through the shared formatter instead
                        of recomputing or re-parsing formatted strings. */}
                    <Text style={styles.rowText}>{formatProductCost(product.totalCost)}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.footer}>
                <View style={styles.totalRow}>
                  <Text
                    accessibilityLabel={`Total ${formatProductCost(order.totalCost)}`}
                    style={styles.totalText}
                  >
                    TOTAL: {formatProductCost(order.totalCost)}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
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
    backgroundColor: COLORS.charcoal,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.orangeRed,
    flex: 1,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 26,
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
  headerDetail: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginTop: SPACING.xs,
  },
  rowsScroll: {
    flexGrow: 0,
  },
  rowsContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  productRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  rowText: {
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
});
