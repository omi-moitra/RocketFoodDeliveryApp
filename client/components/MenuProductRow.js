/**
 * File: MenuProductRow.js
 * Purpose: Displays one menu product with static imagery and button-only quantity controls.
 * Contents:
 * 1. Menu product row component
 * 2. Product row styles
 */

import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import AppIcon from './AppIcon';
import { RESTAURANT_MENU_IMAGE } from '../constants/menuAssets';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

/**
 * Renders one validated product while leaving its authoritative quantity in the parent screen.
 * RestaurantMenuScreen supplies product-specific increment and decrement callbacks.
 */
export default function MenuProductRow({
  formattedPrice,
  onDecrease,
  onIncrease,
  product,
  quantity,
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;
  const isDecreaseDisabled = quantity === 0;

  return (
    <View style={[styles.row, isCompact && styles.rowCompact]}>
      <Image
        accessibilityIgnoresInvertColors
        accessible={false}
        resizeMode="cover"
        source={RESTAURANT_MENU_IMAGE}
        style={[styles.image, isCompact && styles.imageCompact]}
      />

      <View style={styles.details}>
        <Text style={styles.name}>{product.name}</Text>
        <Text accessibilityLabel={`${product.name} price ${formattedPrice}`} style={styles.price}>
          {formattedPrice}
        </Text>
        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
      </View>

      <View style={[styles.stepper, isCompact && styles.stepperCompact]}>
        <Pressable
          accessibilityLabel={`Decrease ${product.name} quantity`}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDecreaseDisabled }}
          disabled={isDecreaseDisabled}
          onPress={onDecrease}
          style={({ pressed }) => [
            styles.stepButton,
            isDecreaseDisabled && styles.stepButtonDisabled,
            pressed && !isDecreaseDisabled && styles.stepButtonPressed,
          ]}
        >
          <AppIcon color={COLORS.white} name="minus" size={17} />
        </Pressable>
        <Text
          accessibilityLabel={`${product.name} quantity ${quantity}`}
          accessibilityLiveRegion="polite"
          style={styles.quantity}
        >
          {quantity}
        </Text>
        <Pressable
          accessibilityLabel={`Increase ${product.name} quantity`}
          accessibilityRole="button"
          onPress={onIncrease}
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
        >
          <AppIcon color={COLORS.white} name="plus" size={17} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.md,
    minHeight: 152,
    paddingVertical: SPACING.sm,
  },
  rowCompact: {
    flexWrap: 'wrap',
  },
  image: {
    borderRadius: 4,
    height: 136,
    width: 136,
  },
  imageCompact: {
    height: 104,
    width: 104,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 19,
    lineHeight: 24,
  },
  price: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 18,
    marginTop: 2,
  },
  description: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  stepperCompact: {
    justifyContent: 'flex-end',
    paddingLeft: 120,
    width: '100%',
  },
  stepButton: {
    alignItems: 'center',
    backgroundColor: COLORS.charcoal,
    borderRadius: LAYOUT.minimumTouchTarget / 2,
    height: LAYOUT.minimumTouchTarget,
    justifyContent: 'center',
    width: LAYOUT.minimumTouchTarget,
  },
  stepButtonDisabled: {
    backgroundColor: COLORS.mutedGreen,
    opacity: 0.55,
  },
  stepButtonPressed: {
    opacity: 0.72,
  },
  quantity: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 20,
    minWidth: 28,
    textAlign: 'center',
  },
});
