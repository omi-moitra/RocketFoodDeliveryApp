/**
 * File: _layout.js
 * Purpose: Defines Restaurant List to Restaurant Menu stack navigation.
 * Contents:
 * 1. Restaurant stack initial-route setting
 * 2. Restaurant stack layout
 */

import { Stack } from 'expo-router';

// Expo Router reads this reserved setting to make the list the restaurant stack entry point.
export const unstable_settings = {
  initialRouteName: 'index',
};

/**
 * Defines the nested route sequence from the restaurant list to a selected menu.
 * Expo Router uses it for every route inside the restaurant folder.
 */
export default function RestaurantStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[restaurantId]" />
    </Stack>
  );
}
