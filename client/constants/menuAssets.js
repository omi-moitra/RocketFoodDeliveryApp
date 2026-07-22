/**
 * File: menuAssets.js
 * Purpose: Registers the exact supplied menu image for static Expo bundling.
 * Contents:
 * 1. Static Restaurant Menu image registration
 */

// Metro can bundle this image only from a statically analyzable literal require. Keeping the
// registration in one constant also prevents menu rows from inventing paths that work on one
// platform but fail after an Expo production export.
export const RESTAURANT_MENU_IMAGE = require('../assets/RestaurantMenu.jpg');
