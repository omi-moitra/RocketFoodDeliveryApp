/**
 * File: index.js
 * Purpose: Loads, filters, displays, and navigates from the customer Restaurant List.
 * Contents:
 * 1. Imports, filter options, and request messages
 * 2. Restaurant List state and protected loading
 * 3. Filter, retry, and menu-navigation handlers
 * 4. List header, result states, and card grid
 * 5. Restaurant List styles
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import FilterSelect from '../../../components/FilterSelect';
import RestaurantCard from '../../../components/RestaurantCard';
import ResultState from '../../../components/ResultState';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiRequestError } from '../../../services/apiClient';
import { fetchRestaurants } from '../../../services/restaurantService';

// Filter option objects keep display, accessibility, and API values in one stable contract.
const FILTER_PLACEHOLDER = Object.freeze({
  accessibilityLabel: 'No filter selected',
  key: 'unselected',
  label: '-- Select --',
  value: null,
});

const RATING_OPTIONS = Object.freeze([
  FILTER_PLACEHOLDER,
  ...Array.from({ length: 5 }, (_, index) => {
    const rating = index + 1;
    return {
      accessibilityLabel: `${rating} out of 5 stars`,
      key: `rating-${rating}`,
      label: '★'.repeat(rating),
      value: rating,
    };
  }),
]);

const PRICE_OPTIONS = Object.freeze([
  FILTER_PLACEHOLDER,
  ...Array.from({ length: 3 }, (_, index) => {
    const priceRange = index + 1;
    return {
      accessibilityLabel: `Price range ${priceRange} out of 3`,
      key: `price-${priceRange}`,
      label: '$'.repeat(priceRange),
      value: priceRange,
    };
  }),
]);

const LIST_MESSAGES = Object.freeze({
  connection: 'Unable to load restaurants. Check your connection and try again.',
  empty: 'No restaurants are currently available.',
  filteredEmpty: 'No restaurants match the selected filters.',
  response: 'Restaurant information could not be loaded. Please try again.',
});

/**
 * Loads and filters nearby restaurants, renders every result state, and opens selected menus.
 * Expo Router uses it as the authenticated restaurant stack's initial screen.
 */
export default function RestaurantListScreen() {
  const router = useRouter();
  const { handleUnauthorized, session } = useAuth();

  // These state values define the active filters and the mutually exclusive request-result state.
  const [rating, setRating] = useState(null);
  const [priceRange, setPriceRange] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [requestStatus, setRequestStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [retrySequence, setRetrySequence] = useState(0);

  // Refs coordinate request ordering and double-tap protection without causing extra renders.
  const newestRequestRef = useRef(0);
  const navigationLockRef = useRef(false);
  const navigationTimerRef = useRef(null);

  useEffect(() => {
    if (!session?.accessToken) {
      return undefined;
    }

    const requestController = new AbortController();
    const requestId = newestRequestRef.current + 1;
    newestRequestRef.current = requestId;
    setRequestStatus('loading');
    setErrorMessage('');
    setRestaurants([]);

    /**
     * Fetches one filter combination and commits it only if it is still the newest request.
     * The data-loading effect calls it whenever filters or retry state change.
     */
    async function loadRestaurants() {
      try {
        const loadedRestaurants = await fetchRestaurants({
          priceRange,
          rating,
          signal: requestController.signal,
        });

        // A slower earlier filter request must never replace results for the newest selection.
        if (requestController.signal.aborted || requestId !== newestRequestRef.current) {
          return;
        }

        setRestaurants(loadedRestaurants);
        setRequestStatus(loadedRestaurants.length ? 'success' : 'empty');
      } catch (error) {
        if (
          requestController.signal.aborted ||
          error?.code === 'aborted' ||
          requestId !== newestRequestRef.current
        ) {
          return;
        }

        if (error?.code === 'unauthorized') {
          // A 401 is a session boundary, not a normal Restaurant List retry state.
          await handleUnauthorized();
          return;
        }

        setRequestStatus('error');
        setErrorMessage(
          error instanceof ApiRequestError && error.code === 'connection'
            ? LIST_MESSAGES.connection
            : error instanceof ApiRequestError
              ? error.message
              : LIST_MESSAGES.response,
        );
      }
    }

    loadRestaurants();

    return () => {
      // Aborting on filter change/unmount prevents obsolete requests from updating this screen.
      requestController.abort();
    };
  }, [handleUnauthorized, priceRange, rating, retrySequence, session?.accessToken]);

  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

  /**
   * Advances a request-only sequence value so the loading effect runs again.
   * Error and unfiltered-empty states expose it through their Retry buttons.
   */
  function handleRetry() {
    setRetrySequence((currentSequence) => currentSequence + 1);
  }

  /**
   * Returns both controlled filters to the deliberate unselected state.
   * The list header and filtered-empty state call it.
   */
  function handleClearFilters() {
    setRating(null);
    setPriceRange(null);
  }

  /**
   * Opens one valid restaurant menu while absorbing rapid duplicate image taps.
   * RestaurantCard supplies the API restaurant ID to this handler.
   */
  function handleRestaurantPress(restaurantId) {
    if (!Number.isInteger(restaurantId) || restaurantId <= 0 || navigationLockRef.current) {
      return;
    }

    // The public API ID identifies the menu; grid and image indexes change when filters change.
    navigationLockRef.current = true;
    router.push({
      pathname: '/customer/restaurant/[restaurantId]',
      params: { restaurantId: String(restaurantId) },
    });

    // A short lock absorbs rapid double taps without blocking navigation after returning later.
    navigationTimerRef.current = setTimeout(() => {
      navigationLockRef.current = false;
      navigationTimerRef.current = null;
    }, 800);
  }

  /**
   * Wraps one restaurant card in the two-column spacing container required by FlatList.
   * FlatList calls it once for every normalized restaurant item.
   */
  function renderRestaurant({ item }) {
    return (
      <View style={styles.cardColumn}>
        <RestaurantCard onImagePress={handleRestaurantPress} restaurant={item} />
      </View>
    );
  }

  const hasSelectedFilters = rating !== null || priceRange !== null;

  const listHeader = (
    <View>
      <Text accessibilityRole="header" style={styles.pageTitle}>
        NEARBY RESTAURANTS
      </Text>
      <View style={styles.filterRow}>
        <FilterSelect
          label="Rating"
          onChange={setRating}
          options={RATING_OPTIONS}
          value={rating}
        />
        <FilterSelect
          label="Price"
          onChange={setPriceRange}
          options={PRICE_OPTIONS}
          value={priceRange}
        />
      </View>
      <View style={styles.resultsHeadingRow}>
        <Text accessibilityRole="header" style={styles.resultsTitle}>
          RESTAURANTS
        </Text>
        {hasSelectedFilters ? (
          <Pressable
            accessibilityLabel="Clear restaurant filters"
            accessibilityRole="button"
            onPress={handleClearFilters}
            style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
          >
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  /**
   * Selects the loading, empty, or error body shown when no restaurant cards are rendered.
   * FlatList uses it as ListEmptyComponent.
   */
  function renderResultState() {
    if (requestStatus === 'loading' || requestStatus === 'idle') {
      return <ResultState kind="loading" message="Loading restaurants…" minHeight={260} />;
    }

    if (requestStatus === 'empty') {
      return (
        <ResultState
          actionLabel={hasSelectedFilters ? 'Clear Filters' : 'Retry'}
          kind="info"
          message={
            hasSelectedFilters
              ? 'Choose different values or clear both filters.'
              : 'Try again to check for newly available restaurants.'
          }
          minHeight={260}
          onAction={hasSelectedFilters ? handleClearFilters : handleRetry}
          title={hasSelectedFilters ? LIST_MESSAGES.filteredEmpty : LIST_MESSAGES.empty}
        />
      );
    }

    if (requestStatus === 'error') {
      return (
        <ResultState
          actionLabel="Retry"
          kind="error"
          message={errorMessage || LIST_MESSAGES.response}
          minHeight={260}
          onAction={handleRetry}
        />
      );
    }

    return null;
  }

  return (
    <FlatList
      columnWrapperStyle={restaurants.length ? styles.columnWrapper : undefined}
      contentContainerStyle={styles.listContent}
      data={restaurants}
      keyExtractor={(restaurant) => String(restaurant.id)}
      ListEmptyComponent={renderResultState}
      ListHeaderComponent={listHeader}
      numColumns={2}
      renderItem={renderRestaurant}
      showsVerticalScrollIndicator={false}
    />
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
    fontSize: 26,
    marginBottom: SPACING.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  resultsHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    minHeight: LAYOUT.minimumTouchTarget,
  },
  resultsTitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldRegular,
    fontSize: 25,
  },
  clearButton: {
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.sm,
  },
  clearButtonPressed: {
    opacity: 0.65,
  },
  clearButtonText: {
    color: COLORS.darkRed,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  columnWrapper: {
    gap: SPACING.md,
  },
  cardColumn: {
    flex: 1,
    marginBottom: SPACING.md,
    maxWidth: '50%',
  },
});
