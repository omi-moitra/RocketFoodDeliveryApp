/**
 * File: [restaurantId].js
 * Purpose: Resolves a public restaurant ID and owns restaurant-specific menu state.
 * Contents: route validation, quantity reset boundary, menu placeholder, invalid-route fallback.
 */

import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ScreenPlaceholder from '../../../components/ScreenPlaceholder';
import { COLORS } from '../../../constants/theme';

/**
 * Converts an Expo Router parameter into one validated restaurant ID or null.
 * RestaurantMenuScreen uses the result to reject arrays, blanks, and nonnumeric routes.
 * Read aloud: “normalize restaurant I-D.”
 */
function normalizeRestaurantId(routeValue) {
  if (Array.isArray(routeValue)) {
    return null;
  }

  const candidate = String(routeValue ?? '').trim();
  return /^\d+$/.test(candidate) ? candidate : null;
}

/**
 * Owns the selected restaurant's menu route and restaurant-scoped quantity state.
 * Expo Router renders it for the dynamic restaurantId path.
 * Read aloud: “restaurant menu screen.”
 */
export default function RestaurantMenuScreen() {
  const router = useRouter();
  const { restaurantId: routeRestaurantId } = useLocalSearchParams();
  const restaurantId = normalizeRestaurantId(routeRestaurantId);
  // This map belongs to one restaurant route; product IDs will point to integer quantities.
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    // Route changes define a new menu instance, so prior restaurant quantities cannot leak.
    setQuantities({});
  }, [restaurantId]);

  if (!restaurantId) {
    return (
      <View style={styles.invalidContainer}>
        <Text style={styles.invalidTitle}>Restaurant unavailable</Text>
        <Text style={styles.invalidText}>This restaurant link is missing a valid ID.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/customer/restaurant')}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Return to Restaurants</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenPlaceholder
      description={`Menu content for restaurant ${restaurantId} will be added by the restaurant-menu feature.`}
      title="Restaurant Menu"
    >
      <Text style={styles.stateText}>
        Selected quantities: {Object.values(quantities).filter((quantity) => quantity > 0).length}
      </Text>
    </ScreenPlaceholder>
  );
}

const styles = StyleSheet.create({
  invalidContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  invalidTitle: {
    color: COLORS.darkRed,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  invalidText: {
    color: COLORS.charcoal,
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.orangeRed,
    borderRadius: 6,
    marginTop: 20,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  stateText: {
    color: COLORS.mutedGreen,
    fontWeight: '700',
    marginTop: 20,
  },
});
