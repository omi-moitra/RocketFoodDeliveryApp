/**
 * File: OrderHistoryModal.js
 * Purpose: Hosts the Order History Detail modal for one selected, already-loaded order.
 * Contents:
 * 1. Order details modal shell component
 * 2. Modal styles
 */

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

/**
 * Displays the detail modal for the order object selected on the Order History page.
 * The host page owns `visible` and the selected order; the modal's interior content and layout
 * are governed by order-history-modal.feature.md, which will complete this shell. The data
 * source is the already-returned list order object — there is no per-order detail endpoint.
 * Read aloud: “order history modal.”
 */
export default function OrderHistoryModal({ onClose, order, visible }) {
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
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              Order Details
            </Text>
            <Pressable
              accessibilityLabel="Close order details"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <FontAwesome6 color={COLORS.white} name="xmark" size={26} />
            </Pressable>
          </View>

          {/* Minimal staged body: enough to prove the exact selected order arrived; the full
              wireframe content is implemented by the order-history-modal feature. */}
          {order ? (
            <View style={styles.content}>
              <Text style={styles.restaurantName}>{order.restaurantName}</Text>
              <Text style={styles.orderMeta}>Order #{order.id}</Text>
            </View>
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
  content: {
    padding: SPACING.md,
  },
  restaurantName: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 22,
  },
  orderMeta: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginTop: SPACING.xs,
  },
});
