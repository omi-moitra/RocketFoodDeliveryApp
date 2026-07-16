/**
 * File: OrderHistoryRow.js
 * Purpose: Renders one aligned ORDER/STATUS/VIEW table row for a customer order.
 * Contents:
 * 1. Shared table column layout
 * 2. Order history row component
 * 3. Row styles
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppIcon from './AppIcon';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

// One shared flex grid keeps the charcoal heading band and every body row aligned even when a
// long restaurant name wraps; the Order History screen imports this for its header cells.
export const ORDER_TABLE_COLUMNS = Object.freeze({
  order: Object.freeze({ flex: 2 }),
  status: Object.freeze({ flex: 1 }),
  view: Object.freeze({ alignItems: 'center', width: 72 }),
});

/**
 * Shows one order's restaurant name, uppercase status, and magnifier View action.
 * The Order History screen renders it per validated order inside the MY ORDERS table.
 * Read aloud: “order history row.”
 */
export default function OrderHistoryRow({ onView, order }) {
  return (
    <View style={styles.row}>
      {/* The name cell announces name and status together so a screen reader hears one row as a
          unit; the visible status cell below is hidden from accessibility to avoid repetition. */}
      <Text
        accessibilityLabel={`${order.restaurantName}, status ${order.status}`}
        style={[ORDER_TABLE_COLUMNS.order, styles.cellText]}
      >
        {order.restaurantName}
      </Text>
      {/* Uppercase is a wireframe display transform only; order.status keeps its raw value. */}
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[ORDER_TABLE_COLUMNS.status, styles.cellText, styles.statusText]}
      >
        {order.status}
      </Text>
      <View style={ORDER_TABLE_COLUMNS.view}>
        <Pressable
          accessibilityLabel={`View details for ${order.restaurantName} order`}
          accessibilityRole="button"
          onPress={onView}
          style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonPressed]}
        >
          <AppIcon color={COLORS.charcoal} name="magnifying-glass" size={20} />
        </Pressable>
      </View>
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
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  cellText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
  },
  statusText: {
    textTransform: 'uppercase',
  },
  viewButton: {
    alignItems: 'center',
    height: LAYOUT.minimumTouchTarget,
    justifyContent: 'center',
    width: LAYOUT.minimumTouchTarget,
  },
  viewButtonPressed: {
    opacity: 0.6,
  },
});
