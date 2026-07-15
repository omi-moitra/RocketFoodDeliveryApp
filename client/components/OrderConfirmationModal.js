/**
 * File: OrderConfirmationModal.js
 * Purpose: Previews positive-quantity menu selections without submitting an order.
 * Contents:
 * 1. Order confirmation preview component
 * 2. Confirmation modal styles
 */

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatProductCost } from '../constants/currency';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

/**
 * Displays only the products selected by Restaurant Menu and closes without changing quantities.
 * Actual order submission remains outside this feature and no API request is made here.
 */
export default function OrderConfirmationModal({ onClose, restaurant, selectedProducts, visible }) {
  const totalCost = selectedProducts.reduce(
    (total, product) => total + product.cost * product.quantity,
    0,
  );

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
            restaurant ? `Order confirmation for ${restaurant.name}` : 'Order confirmation'
          }
          accessibilityViewIsModal
          style={styles.panel}
        >
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              Order Confirmation
            </Text>
            <Pressable
              accessibilityLabel="Close order confirmation"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <FontAwesome6 color={COLORS.white} name="xmark" size={26} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            {selectedProducts.map((product) => (
              <View key={product.id} style={styles.summaryRow}>
                <Text style={[styles.summaryText, styles.productName]}>{product.name}</Text>
                <Text accessibilityLabel={`${product.quantity} of ${product.name}`} style={styles.summaryText}>
                  x{product.quantity}
                </Text>
                <Text style={styles.summaryText}>
                  {formatProductCost(product.cost * product.quantity)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>TOTAL: {formatProductCost(totalCost)}</Text>
            </View>
          </ScrollView>
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
  summaryTitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  summaryText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
  },
  productName: {
    flex: 1,
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
