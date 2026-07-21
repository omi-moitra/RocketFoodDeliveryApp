/**
 * File: DeliveryRow.js
 * Purpose: Renders one courier delivery with its clickable status control and View action.
 * Contents: imports, delivery row component, styles.
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import AppIcon from './AppIcon';
import { DELIVERY_STATUS, DELIVERY_STATUS_LABELS } from '../services/orderService';
import { COLORS, DELIVERY_STATUS_COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

// The tap on an actionable status advances it; the accessible label states the concrete action.
const ADVANCE_LABELS = Object.freeze({
  [DELIVERY_STATUS.PENDING]: 'Accept delivery',
  [DELIVERY_STATUS.IN_PROGRESS]: 'Mark delivery delivered',
});

/**
 * Displays a single wireframe table row: order ID, address, status control, and View.
 * The status control is clickable only for a PENDING order (accept) or the active courier's
 * IN PROGRESS order (mark delivered); DELIVERED is a locked, non-actionable green indicator. While
 * a mutation is pending the control shows `Updating…` and is disabled. A partial acceptance
 * (status persisted, assignment failed) shows a Retry action instead of a false final status.
 * Read aloud: “delivery row.”
 */
export default function DeliveryRow({
  delivery,
  errorMessage,
  mutationPhase,
  onAdvanceStatus,
  onRetryAssignment,
  onView,
}) {
  const statusLabel = DELIVERY_STATUS_LABELS[delivery.status] ?? '';
  const statusColor = DELIVERY_STATUS_COLORS[delivery.status] ?? COLORS.charcoal;
  const isUpdating = mutationPhase === 'updating';
  const isPartial = mutationPhase === 'partial';
  const isError = mutationPhase === 'error';
  // DELIVERED has no next transition; only PENDING and the courier's own IN PROGRESS can advance.
  const isActionable = delivery.status !== DELIVERY_STATUS.DELIVERED;

  /**
   * Renders the status control appropriate to the current status and mutation phase.
   * Read aloud: “render status control.”
   */
  function renderStatusControl() {
    // Partial acceptance: the order is at IN PROGRESS but unassigned; offer a safe retry, not a
    // status that pretends acceptance finished.
    if (isPartial) {
      return (
        <Pressable
          accessibilityLabel={`Retry assigning delivery ${delivery.id}`}
          accessibilityRole="button"
          onPress={() => onRetryAssignment(delivery)}
          style={({ pressed }) => [
            styles.statusControl,
            styles.retryControl,
            pressed && styles.controlPressed,
          ]}
        >
          <Text style={styles.retryText}>Retry assignment</Text>
        </Pressable>
      );
    }

    if (!isActionable) {
      return (
        <View
          accessibilityLabel={`Status ${statusLabel}`}
          accessibilityRole="text"
          style={[styles.statusControl, { backgroundColor: statusColor }]}
        >
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      );
    }

    return (
      <Pressable
        accessibilityHint="Advances this delivery to its next status"
        accessibilityLabel={`${ADVANCE_LABELS[delivery.status] ?? 'Advance status'} ${delivery.id}`}
        accessibilityRole="button"
        accessibilityState={{ busy: isUpdating, disabled: isUpdating }}
        disabled={isUpdating}
        onPress={() => onAdvanceStatus(delivery)}
        style={({ pressed }) => [
          styles.statusControl,
          { backgroundColor: statusColor },
          isUpdating && styles.controlDisabled,
          pressed && !isUpdating && styles.controlPressed,
        ]}
      >
        {isUpdating ? (
          <View style={styles.updatingRow}>
            <ActivityIndicator color={COLORS.white} size="small" />
            <Text style={styles.statusText}>Updating…</Text>
          </View>
        ) : (
          <Text style={styles.statusText}>{statusLabel}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.topRow}>
        <Text style={styles.orderId}>{delivery.id}</Text>

        <Text numberOfLines={2} style={styles.address}>
          {delivery.deliveryAddress || 'Address unavailable'}
        </Text>

        {renderStatusControl()}

        <Pressable
          accessibilityLabel={`View delivery ${delivery.id}`}
          accessibilityRole="button"
          onPress={onView}
          style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonPressed]}
        >
          <AppIcon color={COLORS.charcoal} name="magnifying-glass" size={18} />
        </Pressable>
      </View>

      {isPartial || isError ? (
        <Text accessibilityLiveRegion="polite" style={styles.rowMessage}>
          {isPartial ? 'Moved to in progress — assignment failed.' : errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomColor: COLORS.charcoal,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: SPACING.md,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  orderId: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    textAlign: 'center',
    width: 44,
  },
  address: {
    color: COLORS.charcoal,
    flex: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 14,
    minWidth: 0,
    paddingHorizontal: SPACING.xs,
  },
  statusControl: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    minWidth: 104,
    paddingHorizontal: SPACING.sm,
  },
  retryControl: {
    backgroundColor: COLORS.darkRed,
  },
  controlDisabled: {
    opacity: 0.75,
  },
  controlPressed: {
    opacity: 0.85,
  },
  updatingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  statusText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  retryText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  viewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    width: LAYOUT.minimumTouchTarget,
  },
  viewButtonPressed: {
    opacity: 0.55,
  },
  rowMessage: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
});
