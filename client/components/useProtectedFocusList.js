/**
 * File: useProtectedFocusList.js
 * Purpose: Owns the shared focus-driven load/refresh lifecycle used identically by the Customer
 *          Order History and Courier Order Delivery list screens.
 * Contents:
 * 1. protected focus-list hook
 */

import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { ApiRequestError } from '../services/apiClient';

/**
 * Loads a protected list on tab focus and manages its loading/refreshing/empty/error lifecycle.
 * Both list screens instantiate this with their own `fetchItems` call; a screen's own additional
 * state (for example Courier's in-flight mutation tracking) stays entirely in the screen and is
 * composed with this hook's returned `setItems`/`retry`, never merged into this shared lifecycle.
 * @param {{fetchItems: (options: {signal: AbortSignal}) => Promise<Array<object>>, handleUnauthorized: () => Promise<void>, session: object|null, messages: {connection: string, refresh: string, response: string}}} options
 * @returns {{items: Array<object>, setItems: Function, requestStatus: string, errorMessage: string, refreshErrorMessage: string, isRefreshing: boolean, hasRows: boolean, retry: () => void}}
 */
export function useProtectedFocusList({ fetchItems, handleUnauthorized, messages, session }) {
  // requestStatus is the one explicit lifecycle value (resolving → loading → ready/empty/error,
  // plus refreshing while existing rows stay visible); overlapping booleans are avoided because
  // they can express impossible combinations such as “loading and ready at the same time”.
  const [items, setItems] = useState([]);
  const [requestStatus, setRequestStatus] = useState('resolving');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshErrorMessage, setRefreshErrorMessage] = useState('');
  const [retrySequence, setRetrySequence] = useState(0);

  // newestRequestRef discards stale responses when a focus refresh supersedes an older request;
  // hasLoadedOnceRef and lastCountRef distinguish the first load from a data-preserving refresh
  // without putting `items` in the focus callback's dependencies (which would loop).
  const newestRequestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const lastCountRef = useRef(0);

  useFocusEffect(
    // The focus effect (not a mount effect) drives loading so returning to the tab refreshes the
    // list and a change made elsewhere (a created order, a confirmed status) appears without a
    // manual app reload. Blurring the tab aborts the request through the cleanup below.
    useCallback(() => {
      if (!session?.accessToken) {
        // Missing session: the host layout redirects to Login; never request without one.
        return undefined;
      }

      const requestController = new AbortController();
      const requestId = newestRequestRef.current + 1;
      newestRequestRef.current = requestId;

      // A refresh keeps the current rows on screen instead of flashing back to a spinner.
      setRefreshErrorMessage('');
      setRequestStatus(hasLoadedOnceRef.current ? 'refreshing' : 'loading');

      async function loadItems() {
        try {
          const loadedItems = await fetchItems({ signal: requestController.signal });

          // Only the newest active request may replace the list; a late response changes nothing.
          if (requestController.signal.aborted || requestId !== newestRequestRef.current) {
            return;
          }

          hasLoadedOnceRef.current = true;
          lastCountRef.current = loadedItems.length;
          setItems(loadedItems);
          setRequestStatus(loadedItems.length ? 'ready' : 'empty');
        } catch (error) {
          if (
            requestController.signal.aborted ||
            error?.code === 'aborted' ||
            requestId !== newestRequestRef.current
          ) {
            return;
          }

          // HTTP 401/403 proves the session is unusable; the shared transition signs out
          // instead of leaving a retryable page error that could never succeed.
          if (error?.code === 'unauthorized') {
            await handleUnauthorized();
            return;
          }

          // A failed refresh with data on screen keeps the existing rows visible and shows a
          // non-destructive banner; only a failed first load may occupy the whole list area.
          if (hasLoadedOnceRef.current) {
            setRefreshErrorMessage(messages.refresh);
            setRequestStatus(lastCountRef.current ? 'ready' : 'empty');
            return;
          }

          setRequestStatus('error');
          setErrorMessage(
            error instanceof ApiRequestError && error.code === 'connection'
              ? messages.connection
              : error instanceof ApiRequestError
                ? error.message
                : messages.response,
          );
        }
      }

      loadItems();

      return () => {
        requestController.abort();
      };
    }, [fetchItems, handleUnauthorized, messages, retrySequence, session?.accessToken]),
  );

  function retry() {
    setRetrySequence((currentSequence) => currentSequence + 1);
  }

  const isRefreshing = requestStatus === 'refreshing';
  const hasRows = items.length > 0 && (requestStatus === 'ready' || isRefreshing);

  return {
    errorMessage,
    hasRows,
    isRefreshing,
    items,
    refreshErrorMessage,
    requestStatus,
    retry,
    setItems,
  };
}
