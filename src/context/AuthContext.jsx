import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { verifyAdminRole } from '../services/adminService.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState('none');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Evaluates admin authorization for a given user session
   */
  const evaluateAdminStatus = useCallback(async (currentUser) => {
    if (!currentUser) {
      setIsAdmin(false);
      setAdminRole('none');
      return;
    }

    // 1. Fast preliminary check on JWT app_metadata
    const appMetaRole = currentUser.app_metadata?.role;
    const isAppMetaAdmin = currentUser.app_metadata?.is_admin === true || 
                           ['admin', 'superadmin', 'manager'].includes(appMetaRole);

    if (isAppMetaAdmin) {
      setIsAdmin(true);
      setAdminRole(appMetaRole || 'admin');
    }

    // 2. Authoritative PostgreSQL RPC validation
    if (isSupabaseConfigured) {
      try {
        const rpcCheck = await verifyAdminRole();
        if (rpcCheck.isAdmin) {
          setIsAdmin(true);
          setAdminRole(rpcCheck.role || 'admin');
        } else if (!isAppMetaAdmin) {
          setIsAdmin(false);
          setAdminRole('none');
        }
      } catch (err) {
        console.warn('[AuthContext] Admin verification RPC exception:', err);
      }
    }
  }, []);

  /**
   * Initializes session on mount and listens for auth state changes
   */
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setIsLoading(true);
      setAuthError(null);

      if (!isSupabaseConfigured) {
        if (isMounted) {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('[AuthContext] Error getting initial session:', error.message);
          setAuthError(error.message);
        }

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await evaluateAdminStatus(initialSession.user);
          } else {
            setIsAdmin(false);
            setAdminRole('none');
          }
        }
      } catch (err) {
        console.error('[AuthContext] Unexpected auth initialization error:', err);
        if (isMounted) {
          setAuthError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to live auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      console.info(`[AuthContext] Auth event received: ${event}`);
      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession?.user) {
          await evaluateAdminStatus(newSession.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setAdminRole('none');
      }
    });

    return () => {
      isMounted = false;
      authSubscription?.subscription?.unsubscribe();
    };
  }, [evaluateAdminStatus]);

  /**
   * Authenticates administrator using Supabase Auth (Email + Password)
   */
  const signIn = async ({ email, password }) => {
    setAuthError(null);

    if (!email || !password) {
      return { data: null, error: { message: 'Email and password are required.' } };
    }

    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: {
          message: 'Supabase credentials are not configured in .env.local. Live authentication requires active Supabase keys.'
        }
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        // Generic safe error message to prevent account enumeration
        return { data: null, error: { message: 'Invalid email or password.' } };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await evaluateAdminStatus(data.user);
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: err.message || 'An unexpected authentication error occurred.' } };
    }
  };

  /**
   * Signs out current user and terminates session
   */
  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setAdminRole('none');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin,
      adminRole,
      authError,
      signIn,
      signOut,
      refreshAuth: () => evaluateAdminStatus(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
};
