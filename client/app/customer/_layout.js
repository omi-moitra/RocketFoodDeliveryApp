/**
 * File: _layout.js
 * Purpose: Defines authenticated customer tabs and their shared header boundary.
 * Contents: imports, tab layout, navigation options.
 */

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';

import AuthenticatedHeader from '../../components/AuthenticatedHeader';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export const unstable_settings = {
  initialRouteName: 'restaurant',
};

export default function CustomerTabsLayout() {
  const { session } = useAuth();

  if (!session) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{
        header: () => <AuthenticatedHeader />,
        headerShown: true,
        tabBarActiveTintColor: COLORS.orangeRed,
        tabBarInactiveTintColor: COLORS.charcoal,
      }}
    >
      <Tabs.Screen
        name="restaurant"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome color={color} name="cutlery" size={size} />
          ),
          title: 'Restaurants',
        }}
      />
      <Tabs.Screen
        name="order-history"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome color={color} name="history" size={size} />
          ),
          title: 'Order History',
        }}
      />
    </Tabs>
  );
}
