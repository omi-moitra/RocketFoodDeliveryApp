/**
 * File: index.js
 * Purpose: Provides the Restaurant List route and verifies public-ID menu navigation.
 * Contents: navigation handler, list placeholder, styles.
 */

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import ScreenPlaceholder from '../../../components/ScreenPlaceholder';
import { COLORS } from '../../../constants/theme';

export default function RestaurantListScreen() {
  const router = useRouter();

  function handleRestaurantPress(restaurantId) {
    if (restaurantId === null || restaurantId === undefined || String(restaurantId).trim() === '') {
      return;
    }

    router.push({
      pathname: '/customer/restaurant/[restaurantId]',
      params: { restaurantId: String(restaurantId) },
    });
  }

  return (
    <ScreenPlaceholder
      description="Restaurant data, images, and filters will be added by the restaurant-list feature."
      title="Restaurants"
    >
      <Pressable
        accessibilityHint="Opens the restaurant menu route"
        accessibilityRole="button"
        onPress={() => handleRestaurantPress(1)}
        style={({ pressed }) => [styles.navigationCheck, pressed && styles.pressed]}
      >
        <Text style={styles.navigationCheckTitle}>Restaurant image placeholder</Text>
        <Text style={styles.navigationCheckText}>Open menu navigation check</Text>
      </Pressable>
    </ScreenPlaceholder>
  );
}

const styles = StyleSheet.create({
  navigationCheck: {
    alignItems: 'center',
    backgroundColor: COLORS.warmYellow,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 160,
    padding: 16,
  },
  navigationCheckTitle: {
    color: COLORS.charcoal,
    fontSize: 18,
    fontWeight: '700',
  },
  navigationCheckText: {
    color: COLORS.charcoal,
    marginTop: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});
