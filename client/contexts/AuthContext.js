/**
 * File: AuthContext.js
 * Purpose: Resolves persisted authentication and exposes shared session transitions.
 * Contents: context, session provider, consumer hook.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  clearAuthSession,
  getStoredSession,
  saveAuthSession,
} from '../storage/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

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

  async function signOut() {
    // Storage is cleared before route guards remove the authenticated navigation tree.
    await clearAuthSession();
    setSession(null);
  }

  const contextValue = useMemo(
    () => ({
      completeSignIn,
      handleUnauthorized: signOut,
      isSessionLoading,
      session,
      signOut,
    }),
    [isSessionLoading, session],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
