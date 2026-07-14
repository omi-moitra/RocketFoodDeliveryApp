/** Purpose: Provides the Order History tab route. Contents: placeholder screen. */

import ScreenPlaceholder from '../../components/ScreenPlaceholder';

/**
 * Supplies the current placeholder route for the required Order History tab.
 * Expo Router renders it when the customer selects Order History.
 * Read aloud: “order history screen.”
 */
export default function OrderHistoryScreen() {
  return (
    <ScreenPlaceholder
      description="Order data and the detail modal will be added by the order-history features."
      title="Order History"
    />
  );
}
