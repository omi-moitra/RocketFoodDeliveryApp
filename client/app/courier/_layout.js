/**
 * File: _layout.js
 * Purpose: Configures the shared authenticated tab shell for the Courier role.
 * Contents: imports, initial-route setting, courier tabs layout.
 */

import { useAuth } from '../../contexts/AuthContext';
import RoleTabsLayout from '../../components/RoleTabsLayout';
import { ROLES } from '../../storage/authStorage';

// Expo Router reads this reserved setting to choose Order Delivery as the initial courier tab.
export const unstable_settings = {
  initialRouteName: 'index',
};

// Order Delivery and Account, in the required exact order.
const COURIER_TAB_SCREENS = [
  {
    accessibilityLabel: 'Order Delivery tab',
    iconName: 'truck',
    name: 'index',
    title: 'Order Delivery',
  },
  {
    accessibilityLabel: 'Account tab',
    iconName: 'user',
    name: 'account',
    title: 'Account',
  },
];

/**
 * Defines the authenticated Order Delivery and Account tabs.
 * Expo Router loads it for every route inside the courier folder; the shared header, tab-bar
 * styling, and active-icon presentation live in the reusable `RoleTabsLayout`.
 * Read aloud: “courier tabs layout.”
 */
export default function CourierTabsLayout() {
  const { session } = useAuth();

  // Fail closed: only an active courier session with a courier ID may render Courier tabs.
  const isAuthorized = Boolean(session) && session.activeRole === ROLES.courier && Boolean(session.courierId);

  return <RoleTabsLayout isAuthorized={isAuthorized} screens={COURIER_TAB_SCREENS} />;
}
