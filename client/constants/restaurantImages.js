/**
 * File: restaurantImages.js
 * Purpose: Registers the supplied local restaurant images and assigns one stable image per ID.
 * Contents:
 * 1. Static React Native image registry
 * 2. Stable restaurant image selector
 */

// Static require calls let Metro bundle the runtime copies and avoid unsupported dynamic paths.
const RESTAURANT_IMAGES = Object.freeze([
  require('../images/restaurants/cuisineGreek.jpg'),
  require('../images/restaurants/cuisineJapanese.jpg'),
  require('../images/restaurants/cuisinePasta.jpg'),
  require('../images/restaurants/cuisinePizza.jpg'),
  require('../images/restaurants/cuisineSoutheast.jpg'),
  require('../images/restaurants/cuisineViet.jpg'),
]);

/**
 * Returns the same bundled image whenever the same positive restaurant ID is supplied.
 * RestaurantCard uses it so list filtering never changes a restaurant's visual identity.
 * Read aloud: “get restaurant image.”
 * @param {number} restaurantId Public restaurant identifier returned by the API.
 * @returns {import('react-native').ImageSourcePropType} Bundled image source for a card.
 */
export function getRestaurantImage(restaurantId) {
  // ID-based assignment prevents images from changing when filtering reorders or removes cards.
  const imageIndex = (restaurantId - 1) % RESTAURANT_IMAGES.length;
  return RESTAURANT_IMAGES[imageIndex];
}
