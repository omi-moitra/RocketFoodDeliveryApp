/**
 * File: _layout.js
 * Purpose: Configures the shared authenticated tab shell for the Customer role.
 * Contents:
 * 1. imports
 * 2. initial-route setting
 * 3. customer tabs layout
 */

import { useAuth } from '../../contexts/AuthContext';
import RoleTabsLayout from '../../components/RoleTabsLayout';
import { ROLES } from '../../storage/authStorage';

// Expo Router reads this reserved setting to choose Restaurants as the initial customer tab.
export const unstable_settings = {
  initialRouteName: 'restaurant',
};

// Restaurants, Order History, and Account, in the required exact order.
const CUSTOMER_TAB_SCREENS = [
  {
    accessibilityLabel: 'Restaurants tab',
    iconName: 'burger',
    name: 'restaurant',
    title: 'Restaurants',
  },
  {
    accessibilityLabel: 'Order History tab',
    iconName: 'clock-rotate-left',
    name: 'order-history',
    title: 'Order History',
  },
  {
    accessibilityLabel: 'Account tab',
    iconName: 'user',
    name: 'account',
    title: 'Account',
  },
];

/**
 * Defines the authenticated Restaurants, Order History, and Account tabs.
 * Expo Router loads it for every route inside the customer folder; the shared header, tab-bar
 * styling, and active-icon presentation live in the reusable `RoleTabsLayout`.
 */
export default function CustomerTabsLayout() {
  const { session } = useAuth();

  // Fail closed: only an active customer session with a customer ID may render Customer tabs.
  const isAuthorized = Boolean(session) && session.activeRole === ROLES.customer && Boolean(session.customerId);

  return <RoleTabsLayout isAuthorized={isAuthorized} screens={CUSTOMER_TAB_SCREENS} />;
}
