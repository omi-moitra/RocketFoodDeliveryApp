/**
 * File: _layout.js
 * Purpose: Defines authenticated customer tabs and their shared header boundary.
 * Contents: imports, tab layout, navigation options.
 */

import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import AppHeader from '../../components/AppHeader';
import AppIcon from '../../components/AppIcon';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../storage/authStorage';

// Expo Router reads this reserved setting to choose Restaurants as the initial customer tab.
export const unstable_settings = {
  initialRouteName: 'restaurant',
};

/**
 * Renders one footer icon and its highlighted background when its tab is active.
 * CustomerTabsLayout uses it for both required footer destinations.
 * Read aloud: “tab icon.”
 */
function TabIcon({ color, focused, name, size }) {
  return (
    <View style={[styles.tabIndicator, focused && styles.activeTabIndicator]}>
      <AppIcon color={color} name={name} size={size} />
    </View>
  );
}

/**
 * Defines the authenticated Restaurants, Order History, and Account tabs plus their shared header.
 * Expo Router loads it for every route inside the customer folder.
 * Read aloud: “customer tabs layout.”
 */
export default function CustomerTabsLayout() {
  const { session } = useAuth();

  // Fail closed: only an active customer session with a customer ID may render Customer tabs.
  if (!session || session.activeRole !== ROLES.customer || !session.customerId) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{
        header: () => <AppHeader />,
        headerShown: true,
        tabBarActiveTintColor: COLORS.charcoal,
        tabBarHideOnKeyboard: false,
        tabBarInactiveTintColor: COLORS.charcoal,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="restaurant"
        options={{
          tabBarAccessibilityLabel: 'Restaurants tab',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name="burger" size={size} />
          ),
          title: 'Restaurants',
        }}
      />
      <Tabs.Screen
        name="order-history"
        options={{
          tabBarAccessibilityLabel: 'Order History tab',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name="clock-rotate-left" size={size} />
          ),
          title: 'Order History',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarAccessibilityLabel: 'Account tab',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name="user" size={size} />
          ),
          title: 'Account',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.charcoal,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 78,
    paddingTop: SPACING.sm,
  },
  tabItem: {
    minHeight: 64,
    paddingBottom: SPACING.xs,
  },
  tabLabel: {
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 16,
  },
  tabIndicator: {
    alignItems: 'center',
    borderRadius: LAYOUT.footerIndicatorHeight / 2,
    height: LAYOUT.footerIndicatorHeight,
    justifyContent: 'center',
    width: LAYOUT.footerIndicatorWidth,
  },
  activeTabIndicator: {
    backgroundColor: COLORS.warmYellow,
  },
});
