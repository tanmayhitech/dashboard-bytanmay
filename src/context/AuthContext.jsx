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
  /**
   * Evaluates admin authorization for a given user session
   */
  const evaluateAdminStatus = useCallback(async (currentUser) => {
    if (!currentUser) {
      setIsAdmin(false);
      setAdminRole('none');
      return;
    }

    // Direct check for local fallback administrator or superadmin email
    if (currentUser.email === 'tanmayyadavbca@gmail.com' || currentUser.app_metadata?.role === 'superadmin') {
      setIsAdmin(true);
      setAdminRole('superadmin');
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

      // 1. Check for stored local admin session (for offline / local developer mode)
      try {
        const localAdminRaw = localStorage.getItem('loozars_local_admin_session');
        if (localAdminRaw) {
          const localAdmin = JSON.parse(localAdminRaw);
          if (localAdmin && localAdmin.email) {
            if (isMounted) {
              setUser(localAdmin);
              setSession({ user: localAdmin, access_token: 'local-demo-token' });
              setIsAdmin(true);
              setAdminRole(localAdmin.app_metadata?.role || 'superadmin');
              setIsLoading(false);
            }
            return;
          }
        }
      } catch (e) {
        localStorage.removeItem('loozars_local_admin_session');
      }

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
        localStorage.removeItem('loozars_local_admin_session');
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
   * Authenticates administrator using Supabase Auth (Email + Password) with local fallback
   */
  const signIn = async ({ email, password }) => {
    setAuthError(null);

    if (!email || !password) {
      return { data: null, error: { message: 'Email and password are required.' } };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check for dedicated developer / demo admin credentials (works even offline)
    if (cleanEmail === 'tanmayyadavbca@gmail.com' && (password === 'admin1234' || !isSupabaseConfigured)) {
      const mockAdmin = {
        id: '00000000-0000-0000-0000-000000000001',
        email: cleanEmail,
        role: 'authenticated',
        app_metadata: { role: 'superadmin', is_admin: true },
        user_metadata: { full_name: 'Tanmay Yadav (Admin)', role: 'superadmin' }
      };
      const mockSession = {
        user: mockAdmin,
        access_token: 'local-demo-admin-token',
        token_type: 'bearer',
        expires_in: 86400
      };

      try {
        localStorage.setItem('loozars_local_admin_session', JSON.stringify(mockAdmin));
      } catch (e) {
        console.warn('Could not save local admin session', e);
      }

      setUser(mockAdmin);
      setSession(mockSession);
      setIsAdmin(true);
      setAdminRole('superadmin');
      return { data: { user: mockAdmin, session: mockSession }, error: null };
    }

    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: {
          message: 'Supabase credentials are not configured in .env.local. Use tanmayyadavbca@gmail.com / admin1234 for local access.'
        }
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
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
