/**
 * File: [restaurantId].js
 * Purpose: Loads one authenticated restaurant menu and owns restaurant-scoped quantity selection.
 * Contents:
 * 1. Imports, messages, and display helpers
 * 2. Restaurant Menu state and protected loading
 * 3. Quantity, retry, return, and confirmation handlers
 * 4. Restaurant summary, result states, and product list
 * 5. Restaurant Menu styles
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import MenuProductRow from '../../../components/MenuProductRow';
import OrderConfirmationModal from '../../../components/OrderConfirmationModal';
import { formatProductCost } from '../../../constants/currency';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiRequestError } from '../../../services/apiClient';
import { fetchProductsForRestaurant } from '../../../services/productService';
import { fetchRestaurantById } from '../../../services/restaurantService';
import {
  changeProductQuantity,
  normalizeRestaurantId,
  reconcileQuantities,
} from '../../../utils/menuState';

const MENU_MESSAGES = Object.freeze({
  connection: 'Unable to load this menu. Check your connection and try again.',
  empty: 'This restaurant has no menu items available right now.',
  response: 'Menu information could not be loaded. Please try again.',
  unavailable: 'This restaurant could not be found.',
});

function getPriceRangeLabel(priceRange) {
  return '$'.repeat(priceRange);
}

function getRatingLabel(rating) {
  return rating === 0 ? 'Not yet rated' : '★'.repeat(rating);
}

/**
 * Loads the selected menu, protects quantity boundaries, and opens a confirmation-only preview.
 * Expo Router renders it for the nested dynamic restaurant route.
 * Read aloud: “restaurant menu screen.”
 */
export default function RestaurantMenuScreen() {
  const router = useRouter();
  const { restaurantId: routeRestaurantId } = useLocalSearchParams();
  const restaurantId = normalizeRestaurantId(routeRestaurantId);
  const { handleUnauthorized, session } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [requestStatus, setRequestStatus] = useState(
    restaurantId === null ? 'unavailable' : 'resolving',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [retrySequence, setRetrySequence] = useState(0);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // These refs prevent older route requests and rapid Create Order taps from crossing boundaries.
  const newestRequestRef = useRef(0);
  const quantityRestaurantIdRef = useRef(null);
  const confirmationLockRef = useRef(false);

  useEffect(() => {
    if (restaurantId === null) {
      newestRequestRef.current += 1;
      quantityRestaurantIdRef.current = null;
      confirmationLockRef.current = false;
      setRestaurant(null);
      setProducts([]);
      setQuantities({});
      setIsConfirmationOpen(false);
      setErrorMessage('');
      setRequestStatus('unavailable');
      return undefined;
    }

    if (!session?.accessToken) {
      return undefined;
    }

    const requestController = new AbortController();
    const requestId = newestRequestRef.current + 1;
    newestRequestRef.current = requestId;
    const isRestaurantChange = quantityRestaurantIdRef.current !== restaurantId;

    // A new route immediately discards the prior menu so Restaurant A never appears under B.
    if (isRestaurantChange) {
      quantityRestaurantIdRef.current = restaurantId;
      confirmationLockRef.current = false;
      setQuantities({});
      setIsConfirmationOpen(false);
    }

    setRestaurant(null);
    setProducts([]);
    setErrorMessage('');
    setRequestStatus('loading');

    async function loadMenu() {
      try {
        const [loadedRestaurant, loadedProducts] = await Promise.all([
          fetchRestaurantById({
            accessToken: session.accessToken,
            restaurantId,
            signal: requestController.signal,
          }),
          fetchProductsForRestaurant({
            accessToken: session.accessToken,
            restaurantId,
            signal: requestController.signal,
          }),
        ]);

        // Only the newest active route request may commit restaurant, products, or quantities.
        if (requestController.signal.aborted || requestId !== newestRequestRef.current) {
          return;
        }

        setRestaurant(loadedRestaurant);
        setProducts(loadedProducts);
        setQuantities((currentQuantities) =>
          reconcileQuantities(loadedProducts, currentQuantities),
        );
        setRequestStatus(loadedProducts.length ? 'ready' : 'empty');
      } catch (error) {
        if (
          requestController.signal.aborted ||
          error?.code === 'aborted' ||
          requestId !== newestRequestRef.current
        ) {
          return;
        }

        if (error?.code === 'unauthorized') {
          await handleUnauthorized();
          return;
        }

        if (error?.code === 'unavailable') {
          setRequestStatus('unavailable');
          setErrorMessage(MENU_MESSAGES.unavailable);
          return;
        }

        setRequestStatus('error');
        setErrorMessage(
          error instanceof ApiRequestError && error.code === 'connection'
            ? MENU_MESSAGES.connection
            : error instanceof ApiRequestError
              ? error.message
              : MENU_MESSAGES.response,
        );
      }
    }

    loadMenu();

    return () => {
      requestController.abort();
    };
  }, [handleUnauthorized, restaurantId, retrySequence, session?.accessToken]);

  const selectedProducts = useMemo(
    () =>
      products
        .filter((product) => (quantities[product.id] ?? 0) > 0)
        .map((product) => ({
          ...product,
          formattedUnitPrice: formatProductCost(product.cost),
          quantity: quantities[product.id],
        })),
    [products, quantities],
  );

  const canCreateOrder =
    requestStatus === 'ready' && selectedProducts.length > 0 && !isConfirmationOpen;

  function handleRetry() {
    setRetrySequence((currentSequence) => currentSequence + 1);
  }

  function handleReturnToRestaurants() {
    router.replace('/customer/restaurant');
  }

  /**
   * Uses a functional update so rapid taps operate on the latest quantity for only one product.
   * The handler enforces the zero floor even when a stale press bypasses the disabled minus UI.
   */
  function handleQuantityChange(productId, change) {
    if (requestStatus !== 'ready') {
      return;
    }

    setQuantities((currentQuantities) =>
      changeProductQuantity(currentQuantities, products, productId, change),
    );
  }

  /**
   * Opens one modal from current positive quantities without starting order submission.
   * The confirmation feature will own POST behavior; this menu boundary only derives selection.
   */
  function handleCreateOrder() {
    if (!canCreateOrder || confirmationLockRef.current) {
      return;
    }

    confirmationLockRef.current = true;
    setIsConfirmationOpen(true);
  }

  function handleCloseConfirmation() {
    setIsConfirmationOpen(false);
    confirmationLockRef.current = false;
  }

  const listHeader = (
    <View>
      <Text accessibilityRole="header" style={styles.pageTitle}>
        RESTAURANT MENU
      </Text>
      {restaurant ? (
        <View style={styles.summary}>
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text
              accessibilityLabel={`Price range ${restaurant.priceRange} out of 3`}
              style={styles.restaurantMeta}
            >
              Price: {getPriceRangeLabel(restaurant.priceRange)}
            </Text>
            <Text
              accessibilityLabel={
                restaurant.rating === 0
                  ? `${restaurant.name} is not yet rated`
                  : `${restaurant.name} rating ${restaurant.rating} out of 5`
              }
              style={styles.restaurantMeta}
            >
              Rating: {getRatingLabel(restaurant.rating)}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Create Order"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canCreateOrder }}
            disabled={!canCreateOrder}
            onPress={handleCreateOrder}
            style={({ pressed }) => [
              styles.createOrderButton,
              !canCreateOrder && styles.createOrderButtonDisabled,
              pressed && canCreateOrder && styles.createOrderButtonPressed,
            ]}
          >
            <Text style={styles.createOrderText}>Create Order</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  function renderProduct({ item }) {
    return (
      <MenuProductRow
        formattedPrice={formatProductCost(item.cost)}
        onDecrease={() => handleQuantityChange(item.id, -1)}
        onIncrease={() => handleQuantityChange(item.id, 1)}
        product={item}
        quantity={quantities[item.id] ?? 0}
      />
    );
  }

  function renderResultState() {
    if (requestStatus === 'loading' || requestStatus === 'resolving') {
      return (
        <View accessibilityLiveRegion="polite" style={styles.stateContainer}>
          <ActivityIndicator color={COLORS.orangeRed} size="large" />
          <Text style={styles.stateText}>Loading restaurant menu…</Text>
        </View>
      );
    }

    if (requestStatus === 'empty') {
      return (
        <View accessibilityLiveRegion="polite" style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Menu currently empty</Text>
          <Text style={styles.stateText}>{MENU_MESSAGES.empty}</Text>
        </View>
      );
    }

    if (requestStatus === 'unavailable') {
      return (
        <View accessibilityLiveRegion="assertive" style={styles.stateContainer}>
          <Text accessibilityRole="alert" style={styles.stateTitle}>
            Restaurant unavailable
          </Text>
          <Text style={styles.stateText}>
            {errorMessage || 'This restaurant link is missing a valid ID.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleReturnToRestaurants}
            style={styles.stateButton}
          >
            <Text style={styles.stateButtonText}>Return to Restaurants</Text>
          </Pressable>
        </View>
      );
    }

    if (requestStatus === 'error') {
      return (
        <View accessibilityLiveRegion="assertive" style={styles.stateContainer}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {errorMessage || MENU_MESSAGES.response}
          </Text>
          <Pressable accessibilityRole="button" onPress={handleRetry} style={styles.stateButton}>
            <Text style={styles.stateButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  }

  return (
    <>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={requestStatus === 'ready' ? products : []}
        keyExtractor={(product) => String(product.id)}
        ListEmptyComponent={renderResultState}
        ListHeaderComponent={listHeader}
        renderItem={renderProduct}
        showsVerticalScrollIndicator={false}
      />
      <OrderConfirmationModal
        onClose={handleCloseConfirmation}
        restaurant={restaurant}
        selectedProducts={selectedProducts}
        visible={isConfirmationOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    backgroundColor: COLORS.white,
    flexGrow: 1,
    padding: SPACING.lg,
  },
  pageTitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldRegular,
    fontSize: 28,
    marginBottom: SPACING.lg,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  restaurantDetails: {
    flex: 1,
    minWidth: 0,
  },
  restaurantName: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 22,
  },
  restaurantMeta: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 18,
    marginTop: 2,
  },
  createOrderButton: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    minWidth: 156,
    paddingHorizontal: SPACING.md,
  },
  createOrderButtonDisabled: {
    backgroundColor: COLORS.darkRed,
    opacity: 0.45,
  },
  createOrderButtonPressed: {
    opacity: 0.75,
  },
  createOrderText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 19,
  },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 340,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
  },
  stateTitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 23,
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
    textAlign: 'center',
  },
  stateButton: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.md,
  },
  stateButtonText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 17,
  },
});
