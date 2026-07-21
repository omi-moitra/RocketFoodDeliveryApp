/**
 * File: _layout.js
 * Purpose: Defines authenticated courier tabs and their shared header boundary.
 * Contents: imports, tab layout, navigation options.
 */

import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import AppHeader from '../../components/AppHeader';
import AppIcon from '../../components/AppIcon';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../storage/authStorage';

// Expo Router reads this reserved setting to choose Order Delivery as the initial courier tab.
export const unstable_settings = {
  initialRouteName: 'index',
};

/**
 * Renders one footer icon and its highlighted background when its tab is active.
 * CourierTabsLayout uses it for both required footer destinations.
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
 * Defines the authenticated Order Delivery and Account tabs plus their shared header.
 * Expo Router loads it for every route inside the courier folder.
 * Read aloud: “courier tabs layout.”
 */
export default function CourierTabsLayout() {
  const { session } = useAuth();

  // Fail closed: only an active courier session with a courier ID may render Courier tabs.
  if (!session || session.activeRole !== ROLES.courier || !session.courierId) {
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
        name="index"
        options={{
          tabBarAccessibilityLabel: 'Order Delivery tab',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name="truck" size={size} />
          ),
          title: 'Order Delivery',
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
