/**
 * File: account.js
 * Purpose: Hosts the Courier Account tab until the Account Details feature ships.
 * Contents: placeholder Courier Account route.
 */

import PlaceholderScreen from '../../components/PlaceholderScreen';

/**
 * Renders the Courier Account placeholder inside the courier tab chrome.
 * Expo Router loads it for the courier Account tab; the Account Details feature replaces its body.
 * Read aloud: “courier account screen.”
 */
export default function CourierAccountScreen() {
  return (
    <PlaceholderScreen
      description="Manage your courier contact details from here."
      title="Account"
    />
  );
}
