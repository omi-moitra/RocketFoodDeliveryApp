/**
 * File: menuState.js
 * Purpose: Provides testable route and quantity-state rules for one Restaurant Menu.
 * Contents:
 * 1. Restaurant route normalization
 * 2. Product quantity reconciliation
 * 3. Safe product quantity changes
 */

/**
 * Converts an Expo Router value into one positive safe integer or null.
 * Arrays, blanks, decimals, signs, zero, overflow, and nonnumeric values are rejected because a
 * fallback ID could expose the wrong restaurant.
 */
export function normalizeRestaurantId(routeValue) {
  if (Array.isArray(routeValue)) {
    return null;
  }

  const candidate = String(routeValue ?? '').trim();

  if (!/^\d+$/.test(candidate)) {
    return null;
  }

  const restaurantId = Number(candidate);
  return Number.isSafeInteger(restaurantId) && restaurantId > 0 ? restaurantId : null;
}

/**
 * Preserves valid quantities for a same-restaurant reload, initializes new products at zero, and
 * drops removed IDs. A restaurant change clears the prior map before this helper is called.
 */
export function reconcileQuantities(products, currentQuantities) {
  return Object.fromEntries(
    products.map((product) => {
      const currentQuantity = currentQuantities[product.id];
      const quantity =
        Number.isSafeInteger(currentQuantity) && currentQuantity >= 0 ? currentQuantity : 0;
      return [product.id, quantity];
    }),
  );
}

/**
 * Returns a new quantity map after one safe increment/decrement for one current product.
 * Functional screen updates call it repeatedly, so rapid taps never depend on a stale render.
 */
export function changeProductQuantity(currentQuantities, products, productId, change) {
  const product = products.find((currentProduct) => currentProduct.id === productId);

  if (!product || ![-1, 1].includes(change)) {
    return currentQuantities;
  }

  const storedQuantity = currentQuantities[productId];
  const currentQuantity =
    Number.isSafeInteger(storedQuantity) && storedQuantity >= 0 ? storedQuantity : 0;
  const maximumSafeQuantity =
    product.cost === 0
      ? Number.MAX_SAFE_INTEGER
      : Math.floor(Number.MAX_SAFE_INTEGER / product.cost);
  const nextQuantity =
    change > 0
      ? Math.min(maximumSafeQuantity, currentQuantity + 1)
      : Math.max(0, currentQuantity - 1);

  return { ...currentQuantities, [productId]: nextQuantity };
}
