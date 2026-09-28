import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { logAdminActionService, sanitizeAdminError } from '../services/adminService';

const AdminFeedbackContext = createContext(null);

const RECENT_ACTIVITIES_STORAGE_KEY = 'loozars_admin_recent_activities';

export const AdminFeedbackProvider = ({ children }) => {
  const { user, adminRole } = useAuth();
  
  // In-flight active operations set (e.g. { 'product_update_123': true, 'stock_adjust_456': true })
  const [inFlightActions, setInFlightActions] = useState({});
  
  // Active toasts stack
  const [toasts, setToasts] = useState([]);

  // Recent activity logs (persisted in session / local storage for cross-action visibility)
  const [recentActivities, setRecentActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_ACTIVITIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync recent activities to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_ACTIVITIES_STORAGE_KEY, JSON.stringify(recentActivities.slice(0, 30)));
    } catch {
      // Ignore storage quota errors
    }
  }, [recentActivities]);

  const showToast = useCallback((toast) => {
    const id = toast.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newToast = {
      id,
      type: toast.type || 'success', // 'success' | 'error' | 'info' | 'loading'
      title: toast.title || 'Action completed',
      detail: toast.detail || null,
      duration: toast.duration || null,
      durationMs: toast.durationMs || 0,
      dbStatus: toast.dbStatus || (toast.type === 'success' ? 'Updated' : null),
      syncStatus: toast.syncStatus || (toast.type === 'success' ? 'Complete' : null),
      timestamp: new Date().toISOString(),
      extra: toast.extra || null
    };

    setToasts(prev => [newToast, ...prev.slice(0, 4)]); // Keep max 5 visible toasts

    // Auto dismiss after 5.5s for normal toasts
    if (toast.type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5500);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const isActionLoading = useCallback((actionKey) => {
    if (!actionKey) return Object.keys(inFlightActions).length > 0;
    return Boolean(inFlightActions[actionKey]);
  }, [inFlightActions]);

  /**
   * Authoritatively executes an admin mutation, precisely measures its duration,
   * handles optimistic / error / success states, persists audit logs, and shows rich feedback.
   */
  const executeAction = useCallback(async (actionKey, asyncFn, options = {}) => {
    const {
      label = 'Saving changes...',
      successTitle = 'Changes saved successfully',
      errorTitle = 'Update failed',
      entityType = 'general',
      entityId = null,
      getSuccessDetail = null,
      detail = null,
      realtimeSync = true,
      skipToast = false
    } = options;

    // 1. Mark in-flight lock to prevent double-clicks
    setInFlightActions(prev => ({ ...prev, [actionKey]: true }));

    const startedAt = performance.now();
    let toastId = null;

    try {
      // 2. Perform the authoritative async operation
      const res = await asyncFn();

      // Check if response indicates failure
      if (res && res.success === false) {
        throw new Error(res.error || 'Operation failed on server.');
      }

      // 3. Compute precise timing
      const completedAt = performance.now();
      const durationMs = Math.round(completedAt - startedAt);
      const durationSec = durationMs < 1000 
        ? `${(durationMs / 1000).toFixed(2)}s` 
        : `${(durationMs / 1000).toFixed(1)}s`;

      const computedDetail = getSuccessDetail ? getSuccessDetail(res) : detail;

      // 4. Trigger Success Toast
      if (!skipToast) {
        toastId = showToast({
          type: 'success',
          title: `✓ ${successTitle}`,
          detail: computedDetail,
          duration: `Completed in ${durationSec}`,
          durationMs,
          dbStatus: 'Updated',
          syncStatus: realtimeSync ? 'Complete' : null
        });
      }

      // 5. Append to Recent Activity Log
      const activityEntry = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: `✓ ${successTitle}`,
        detail: computedDetail,
        status: 'success',
        duration: durationSec,
        durationMs,
        timestamp: new Date().toISOString(),
        actor: user?.email || 'Admin',
        actorRole: adminRole || 'Superadmin',
        entityType,
        entityId: entityId || (res?.id || res?.coupon?.id || res?.product?.id || null)
      };

      setRecentActivities(prev => [activityEntry, ...prev.slice(0, 29)]);

      // 6. Asynchronously record authoritative DB audit log (non-blocking)
      logAdminActionService({
        actionType: actionKey,
        entityType,
        entityId: entityId || (res?.id || null),
        status: 'success',
        durationMs,
        details: { detail: computedDetail, result: typeof res === 'object' ? 'OK' : res }
      }).catch(err => console.warn('[AdminFeedback] DB audit logging notice:', err));

      // 7. Dispatch catalog / admin sync event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loozars_admin_mutation_success', {
          detail: { actionKey, entityType, entityId, durationMs }
        }));
      }

      return {
        success: true,
        data: res,
        duration: durationSec,
        durationMs
      };
    } catch (err) {
      const completedAt = performance.now();
      const durationMs = Math.round(completedAt - startedAt);
      const durationSec = durationMs < 1000 
        ? `${(durationMs / 1000).toFixed(2)}s` 
        : `${(durationMs / 1000).toFixed(1)}s`;

      const safeReason = sanitizeAdminError(err?.message || err);

      console.error(`[AdminFeedback] Action ${actionKey} failed:`, err);

      // Trigger Error Toast
      if (!skipToast) {
        showToast({
          type: 'error',
          title: `✕ ${errorTitle}`,
          detail: `Nothing was changed.\nReason: ${safeReason}`,
          duration: `Completed in ${durationSec}`,
          durationMs,
          dbStatus: 'Unchanged',
          syncStatus: null
        });
      }

      // Append failed action to activity log
      const activityEntry = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: `✕ ${errorTitle}`,
        detail: safeReason,
        status: 'error',
        duration: durationSec,
        durationMs,
        timestamp: new Date().toISOString(),
        actor: user?.email || 'Admin',
        actorRole: adminRole || 'Superadmin',
        entityType,
        entityId
      };

      setRecentActivities(prev => [activityEntry, ...prev.slice(0, 29)]);

      // Asynchronously record failed audit log
      logAdminActionService({
        actionType: actionKey,
        entityType,
        entityId,
        status: 'error',
        durationMs,
        errorMessage: safeReason
      }).catch(logErr => console.warn('[AdminFeedback] DB audit error logging notice:', logErr));

      return {
        success: false,
        error: safeReason,
        duration: durationSec,
        durationMs
      };
    } finally {
      // Release in-flight lock
      setInFlightActions(prev => {
        const next = { ...prev };
        delete next[actionKey];
        return next;
      });
    }
  }, [user?.email, adminRole, showToast]);

  const value = {
    toasts,
    recentActivities,
    showToast,
    dismissToast,
    clearToasts,
    executeAction,
    isActionLoading,
    inFlightActions
  };

  return (
    <AdminFeedbackContext.Provider value={value}>
      {children}
    </AdminFeedbackContext.Provider>
  );
};

export const useAdminFeedback = () => {
  const context = useContext(AdminFeedbackContext);
  if (!context) {
    throw new Error('useAdminFeedback must be used within an AdminFeedbackProvider');
  }
  return context;
};
