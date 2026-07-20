/**
 * File: account.js
 * Purpose: Hosts the Customer Account tab until the Account Details feature ships.
 * Contents: placeholder Customer Account route.
 */

import PlaceholderScreen from '../../components/PlaceholderScreen';

/**
 * Renders the Customer Account placeholder inside the customer tab chrome.
 * Expo Router loads it for the customer Account tab; the Account Details feature replaces its body.
 * Read aloud: “customer account screen.”
 */
export default function CustomerAccountScreen() {
  return (
    <PlaceholderScreen
      description="Manage your customer contact details from here."
      title="Account"
    />
  );
}
