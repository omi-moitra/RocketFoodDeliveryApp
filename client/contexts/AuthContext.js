/**
 * File: AuthContext.js
 * Purpose: Resolves persisted authentication and exposes shared session transitions.
 * Contents:
 * 1. Authentication context
 * 2. Session provider and transitions
 * 3. Authentication consumer hook
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  clearAuthSession,
  getStoredSession,
  saveAuthSession,
} from '../storage/authStorage';

// A null default lets useAuth detect components rendered outside the required provider.
const AuthContext = createContext(null);

/**
 * Restores and owns the in-memory customer session shared by protected routes.
 * RootLayout wraps the route tree with this provider at application startup.
 * Read aloud: “auth provider,” where “auth” means authentication.
 */
export function AuthProvider({ children }) {
  // session is the credential/customer snapshot; loading blocks routing until storage resolves.
  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    // This lifecycle flag prevents an asynchronous storage result from updating an unmounted tree.
    let isMounted = true;

    /**
     * Reads the persisted session and converts unreadable storage into a logged-out state.
     * The provider's startup effect calls it exactly once per mount.
     * Read aloud: “restore session.”
     */
    async function restoreSession() {
      try {
        const storedSession = await getStoredSession();

        if (isMounted) {
          setSession(storedSession);
        }
      } catch {
        // An unreadable store is treated as logged out so stale data cannot unlock routes.
        await clearAuthSession().catch(() => undefined);

        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Persists a verified login before exposing it to protected navigation.
   * LoginScreen calls it after authenticateCustomer succeeds.
   * Read aloud: “complete sign in.”
   */
  async function completeSignIn(authValues) {
    try {
      const savedSession = await saveAuthSession(authValues);
      setSession(savedSession);
    } catch (error) {
      // A failed multi-key write must not leave a restorable partial session behind.
      await clearAuthSession().catch(() => undefined);
      setSession(null);
      throw error;
    }
  }

  /**
   * Removes persisted credentials before clearing the in-memory route guard.
   * AppHeader and unauthorized-response handling use this shared transition.
   * Read aloud: “sign out.”
   */
  async function signOut() {
    // Storage is cleared before route guards remove the authenticated navigation tree.
    await clearAuthSession();
    setSession(null);
  }

  /**
   * Closes protected routes after the API proves that the stored session is no longer valid.
   * Protected feature services/screens call it when a request returns HTTP 401.
   * Read aloud: “handle unauthorized.”
   */
  async function handleUnauthorized() {
    try {
      await clearAuthSession();
    } catch {
      // The route guard still has to close below; a later login overwrites the stale stored values.
    } finally {
      // A rejected protected request proves the in-memory session is no longer usable. Route
      // guards must close authenticated screens even if device storage cleanup itself fails.
      setSession(null);
    }
  }

  const contextValue = useMemo(
    () => ({
      completeSignIn,
      handleUnauthorized,
      isSessionLoading,
      session,
      signOut,
    }),
    [isSessionLoading, session],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Returns the nearest authentication context and fails clearly when no provider exists.
 * Screens and shared authenticated components call this hook to access session actions/state.
 * Read aloud: “use auth,” where “auth” means authentication.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
