/** Purpose: Defines Restaurant List to Restaurant Menu stack navigation. Contents: stack options and screens. */

import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RestaurantStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[restaurantId]" />
    </Stack>
  );
}
