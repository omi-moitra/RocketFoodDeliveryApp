/**
 * File: RestaurantCard.js
 * Purpose: Displays one restaurant and opens its menu from the required image action.
 * Contents:
 * 1. Restaurant display helpers
 * 2. Restaurant card component
 * 3. Card styles
 */

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_FAMILIES, SPACING } from '../constants/theme';
import { getRestaurantImage } from '../constants/restaurantImages';
import { getPriceRangeLabel, getRatingLabel } from '../utils/restaurantLabels';

/**
 * Displays one normalized restaurant and makes only its supplied image the menu action.
 * The Restaurant List screen renders this component for every API result.
 * Read aloud: “restaurant card.”
 */
export default function RestaurantCard({ onImagePress, restaurant }) {
  const priceLabel = getPriceRangeLabel(restaurant.priceRange);
  const ratingLabel = getRatingLabel(restaurant.rating);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityHint="Opens this restaurant's menu"
        accessibilityLabel={`Open ${restaurant.name} menu`}
        accessibilityRole="button"
        onPress={() => onImagePress(restaurant.id)}
        style={({ pressed }) => [styles.imageButton, pressed && styles.imagePressed]}
      >
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          resizeMode="cover"
          source={getRestaurantImage(restaurant.id)}
          style={styles.image}
        />
      </Pressable>

      <View style={styles.details}>
        <Text numberOfLines={2} style={styles.name}>
          {restaurant.name} ({priceLabel})
        </Text>
        <Text
          accessibilityLabel={
            restaurant.rating === 0
              ? `${restaurant.name} is not yet rated`
              : `${restaurant.name} rating: ${restaurant.rating} out of 5`
          }
          style={[styles.rating, restaurant.rating === 0 && styles.unrated]}
        >
          {ratingLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.charcoal,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    flex: 1,
    minHeight: 224,
    overflow: 'hidden',
    shadowColor: COLORS.charcoal,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  imageButton: {
    minHeight: 132,
    width: '100%',
  },
  imagePressed: {
    opacity: 0.78,
  },
  image: {
    height: 132,
    width: '100%',
  },
  details: {
    flex: 1,
    padding: SPACING.md,
  },
  name: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 17,
    lineHeight: 22,
    minHeight: 44,
  },
  rating: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },
  unrated: {
    fontSize: 13,
    letterSpacing: 0,
  },
});
