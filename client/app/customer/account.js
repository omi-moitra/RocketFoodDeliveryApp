/**
 * File: account.js
 * Purpose: Customer Account tab — a thin wrapper around the shared Account screen.
 * Contents:
 * 1. Customer Account route
 */

import AccountScreen from '../../components/AccountScreen';

/**
 * Renders the shared Account Settings form configured for the Customer role.
 * Expo Router loads it for the customer Account tab; all form/request logic lives in AccountScreen.
 */
export default function CustomerAccountScreen() {
  return <AccountScreen expectedRole="customer" />;
}
