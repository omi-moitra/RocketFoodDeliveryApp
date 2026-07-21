/**
 * File: restaurantLabels.js
 * Purpose: Converts backend restaurant integers into the wireframe's display labels.
 * Contents:
 * 1. price-range label
 * 2. rating label
 */

/**
 * Converts the backend price-range integer into the dollar-sign label used by the wireframe.
 * RestaurantCard and the Restaurant Menu summary share it.
 */
export function getPriceRangeLabel(priceRange) {
  return '$'.repeat(priceRange);
}

/**
 * Converts an integer rating into stars while preserving a clear zero-rating state.
 * RestaurantCard and the Restaurant Menu summary share it.
 */
export function getRatingLabel(rating) {
  return rating === 0 ? 'Not yet rated' : '★'.repeat(rating);
}
