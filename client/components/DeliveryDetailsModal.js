/**
 * File: DeliveryDetailsModal.js
 * Purpose: Presents one selected delivery's full details from the already-normalized list object.
 * Contents:
 * 1. Order-date formatting helper
 * 2. Delivery details modal component
 * 3. Modal styles
 */

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppIcon from './AppIcon';
import { formatProductCost } from '../constants/currency';
import { DELIVERY_STATUS_LABELS } from '../services/orderService';
import { COLORS, DELIVERY_STATUS_COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

// The project-wide order-date format ("July 15, 2026"), matching the customer Order History modal.
const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Formats the normalized ISO `createdOn` value as one documented human-readable date.
 * An unparseable value returns a safe blank so the modal never shows `Invalid Date` or `NaN`.
 * Read aloud: “format order date.”
 * @param {string} createdOn ISO date-time string from the normalized delivery object.
 * @returns {string} A value such as `July 15, 2026`, or an empty string when unparseable.
 */
function formatOrderDate(createdOn) {
  if (typeof createdOn !== 'string' || !createdOn.trim()) {
    return '';
  }

  // The backend sends microsecond fractions (…T13:01:38.705432); the standard ISO profile stops at
  // milliseconds, so longer fractions are trimmed before parsing to stay engine-portable.
  const parsedDate = new Date(createdOn.trim().replace(/(\.\d{3})\d+/, '$1'));

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return ORDER_DATE_FORMATTER.format(parsedDate);
}

/**
 * Displays the detail modal for the delivery selected on the Order Delivery screen.
 * The host screen owns `visible` and the selected delivery; this component is presentation-only
 * and renders everything from that already-validated list object — the backend provides no
 * per-order detail endpoint, so no request or storage read ever happens here. Only the required
 * wireframe fields appear; no customer/courier personal data beyond the delivery address is shown.
 * Read aloud: “delivery details modal.”
 */
export default function DeliveryDetailsModal({ delivery, onClose, visible }) {
  const orderDate = delivery ? formatOrderDate(delivery.createdOn) : '';
  const statusLabel = delivery ? DELIVERY_STATUS_LABELS[delivery.status] ?? '' : '';
  const statusColor = delivery
    ? DELIVERY_STATUS_COLORS[delivery.status] ?? COLORS.white
    : COLORS.white;

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
            delivery ? `Delivery details for ${delivery.restaurantName}` : 'Delivery details'
          }
          accessibilityViewIsModal
          style={styles.panel}
        >
          {/* Nothing delivery-specific renders while the screen has no selection; the hidden modal
              must tolerate a null delivery without crashing. */}
          {delivery ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerTopRow}>
                  <Text accessibilityRole="header" style={styles.title}>
                    DELIVERY DETAILS
                  </Text>
                  <Pressable
                    accessibilityLabel="Close delivery details"
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

                <View style={styles.statusRow}>
                  <Text style={styles.headerLabel}>Status:</Text>
                  <View
                    accessibilityLabel={`Status ${statusLabel}`}
                    style={[styles.statusPill, { backgroundColor: statusColor }]}
                  >
                    <Text style={styles.statusText}>{statusLabel}</Text>
                  </View>
                </View>

                {/* A missing delivery address stays blank on screen but announces a safe fallback;
                    the strings "undefined" and "null" must never render. */}
                <Text
                  accessibilityLabel={
                    delivery.deliveryAddress
                      ? `Delivery address ${delivery.deliveryAddress}`
                      : 'Delivery address unavailable'
                  }
                  style={styles.headerDetail}
                >
                  Delivery Address: {delivery.deliveryAddress ?? ''}
                </Text>

                <Text
                  accessibilityLabel={`Restaurant ${delivery.restaurantName}`}
                  style={styles.headerDetail}
                >
                  Restaurant: {delivery.restaurantName}
                </Text>

                <Text
                  accessibilityLabel={
                    orderDate ? `Order date ${orderDate}` : 'Order date unavailable'
                  }
                  style={styles.headerDetail}
                >
                  Order Date: {orderDate}
                </Text>
              </View>

              {/* Keying the scroll area by delivery id drops any retained scroll offset so viewing
                  delivery A and then B always starts B's line items at the top. */}
              <ScrollView
                contentContainerStyle={styles.rowsContent}
                key={delivery.id}
                style={styles.rowsScroll}
              >
                {delivery.products.map((product) => (
                  <View
                    accessible
                    accessibilityLabel={`${product.quantity} of ${product.productName}, ${formatProductCost(
                      product.unitCost,
                    )} each, ${formatProductCost(product.totalCost)} total`}
                    key={product.productId}
                    style={styles.productRow}
                  >
                    <Text style={[styles.rowText, styles.productName]}>{product.productName}</Text>
                    <Text style={styles.rowText}>x{product.quantity}</Text>
                    {/* "Item price" is the verified backend unit_cost; the line total is shown
                        separately so the two values are never conflated. */}
                    <Text style={styles.rowText}>{formatProductCost(product.unitCost)}</Text>
                    <Text style={styles.rowText}>{formatProductCost(product.totalCost)}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.footer}>
                <View style={styles.totalRow}>
                  <Text
                    accessibilityLabel={`Total ${formatProductCost(delivery.totalCost)}`}
                    style={styles.totalText}
                  >
                    TOTAL: {formatProductCost(delivery.totalCost)}
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
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  headerLabel: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
  },
  statusPill: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: SPACING.sm,
  },
  statusText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
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
    fontSize: 16,
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
