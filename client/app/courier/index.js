/**
 * File: index.js
 * Purpose: Hosts the Courier Order Delivery tab until the Courier Delivery feature ships.
 * Contents: placeholder Order Delivery route.
 */

import PlaceholderScreen from '../../components/PlaceholderScreen';

/**
 * Renders the Order Delivery placeholder inside the courier tab chrome.
 * Expo Router loads it as the initial courier tab; the Courier Delivery feature replaces its body.
 * Read aloud: “courier order delivery screen.”
 */
export default function CourierOrderDeliveryScreen() {
  return (
    <PlaceholderScreen
      description="Review and progress your eligible deliveries from here."
      title="Order Delivery"
    />
  );
}
