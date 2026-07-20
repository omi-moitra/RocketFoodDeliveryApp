/**
 * File: DeliveryRow.js
 * Purpose: Renders one courier delivery with its semantic status indicator and View action.
 * Contents: imports, delivery row component, styles.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DELIVERY_STATUS_LABELS } from '../services/orderService';
import { COLORS, DELIVERY_STATUS_COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

/**
 * Displays a single eligible delivery: restaurant, order number, colored status, and View.
 * The Order Delivery screen renders one per eligible order; this component is presentation-only
 * and holds no request state. The status indicator carries the required semantic color
 * (PENDING red, IN PROGRESS orange, DELIVERED green) and reads as a status, not a pressable.
 * Read aloud: “delivery row.”
 */
export default function DeliveryRow({ delivery, onView }) {
  const statusLabel = DELIVERY_STATUS_LABELS[delivery.status] ?? '';
  const statusColor = DELIVERY_STATUS_COLORS[delivery.status] ?? COLORS.charcoal;

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.restaurantName}>
          {delivery.restaurantName}
        </Text>
        <Text style={styles.orderNumber}>Order #{delivery.id}</Text>
      </View>

      <View
        accessibilityLabel={`Status ${statusLabel}`}
        accessibilityRole="text"
        style={[styles.statusPill, { backgroundColor: statusColor }]}
      >
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>

      <Pressable
        accessibilityLabel={`View delivery ${delivery.id}`}
        accessibilityRole="button"
        onPress={onView}
        style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonPressed]}
      >
        <Text style={styles.viewButtonText}>View</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: COLORS.charcoal,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  restaurantName: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 18,
  },
  orderNumber: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    marginTop: SPACING.xs,
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
  viewButton: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    minWidth: 72,
    paddingHorizontal: SPACING.md,
  },
  viewButtonPressed: {
    backgroundColor: COLORS.darkRed,
  },
  viewButtonText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 16,
  },
});
