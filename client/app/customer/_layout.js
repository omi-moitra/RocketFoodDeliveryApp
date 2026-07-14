/**
 * File: _layout.js
 * Purpose: Defines authenticated customer tabs and their shared header boundary.
 * Contents: imports, tab layout, navigation options.
 */

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import AppHeader from '../../components/AppHeader';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export const unstable_settings = {
  initialRouteName: 'restaurant',
};

function TabIcon({ color, focused, name, size }) {
  return (
    <View style={[styles.tabIndicator, focused && styles.activeTabIndicator]}>
      <FontAwesome6 color={color} iconStyle="solid" name={name} size={size} />
    </View>
  );
}

export default function CustomerTabsLayout() {
  const { session } = useAuth();

  if (!session) {
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
