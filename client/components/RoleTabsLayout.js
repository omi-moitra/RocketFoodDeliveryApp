/**
 * File: RoleTabsLayout.js
 * Purpose: Renders the shared authenticated tab shell (header, tab bar styling, active icon
 *          indicator) used identically by the Customer and Courier tab layouts.
 * Contents: imports, tab icon helper, role tabs layout component, shared tab styles.
 */

import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import AppHeader from './AppHeader';
import AppIcon from './AppIcon';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

/**
 * Renders one footer icon and its highlighted background when its tab is active.
 * RoleTabsLayout uses it for every registered tab screen.
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
 * Renders the shared authenticated tab shell for exactly one role's Expo Router tab layout.
 * `CustomerTabsLayout` and `CourierTabsLayout` are thin wrappers: each computes its own
 * `isAuthorized` guard and role-specific `screens` descriptor list, then delegates every
 * identical header/style/tab-bar concern here. `unstable_settings`/route names/guard logic stay in
 * each wrapper because Expo Router reads `unstable_settings` from the route file itself.
 * Read aloud: “role tabs layout.”
 * @param {{isAuthorized: boolean, screens: Array<{name: string, title: string, iconName: string, accessibilityLabel: string}>}} props
 */
export default function RoleTabsLayout({ isAuthorized, screens }) {
  // Fail closed: the caller has already validated the active role and its matching ID.
  if (!isAuthorized) {
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
      {screens.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            tabBarAccessibilityLabel: screen.accessibilityLabel,
            tabBarIcon: ({ color, focused, size }) => (
              <TabIcon color={color} focused={focused} name={screen.iconName} size={size} />
            ),
            title: screen.title,
          }}
        />
      ))}
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
