/**
 * File: restaurantLabels.js
 * Purpose: Converts backend restaurant integers into the wireframe's display labels.
 * Contents: price-range label, rating label.
 */

/**
 * Converts the backend price-range integer into the dollar-sign label used by the wireframe.
 * RestaurantCard and the Restaurant Menu summary share it.
 * Read aloud: “get price range label.”
 */
export function getPriceRangeLabel(priceRange) {
  return '$'.repeat(priceRange);
}

/**
 * Converts an integer rating into stars while preserving a clear zero-rating state.
 * RestaurantCard and the Restaurant Menu summary share it.
 * Read aloud: “get rating label.”
 */
export function getRatingLabel(rating) {
  return rating === 0 ? 'Not yet rated' : '★'.repeat(rating);
}
