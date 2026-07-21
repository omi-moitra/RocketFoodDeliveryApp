/**
 * File: account.js
 * Purpose: Courier Account tab — a thin wrapper around the shared Account screen.
 * Contents:
 * 1. Courier Account route
 */

import AccountScreen from '../../components/AccountScreen';

/**
 * Renders the shared Account Settings form configured for the Courier role.
 * Expo Router loads it for the courier Account tab; all form/request logic lives in AccountScreen.
 */
export default function CourierAccountScreen() {
  return <AccountScreen expectedRole="courier" />;
}
