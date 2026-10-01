/**
 * LOOZARS® — Store Settings & Integrations Service
 * Centralized client-side management of dynamic Telegram Operations & Store Alerts.
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';

const CACHE_KEY = 'loozars_store_settings_telegram';

export const DEFAULT_TELEGRAM_CONFIG = {
  bot_token: '8776016138:AAHtz2dvr5uKwPTAjgXhVFMEAzZkyNW4_-E',
  admin_chat_ids: '1612319687',
  is_active: true,
  notify_orders: true,
  notify_returns: true,
  notify_low_stock: true,
  notify_reviews: true,
  notify_morning_digest: true,
  notify_night_closing: true
};

/**
 * Fetches Telegram Integration Settings from Supabase DB, falling back to localStorage or defaults
 */
export async function getTelegramSettings() {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('config')
        .eq('id', 'telegram')
        .maybeSingle();

      if (data && data.config) {
        const merged = { ...DEFAULT_TELEGRAM_CONFIG, ...data.config };
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        }
        return { success: true, settings: merged, source: 'database' };
      }
    } catch (e) {
      console.warn('[storeSettingsService] DB fetch failed, reading cache:', e.message);
    }
  }

  // Fallback to localStorage or default
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        return { success: true, settings: { ...DEFAULT_TELEGRAM_CONFIG, ...JSON.parse(cached) }, source: 'local_cache' };
      } catch (e) {}
    }
  }

  return { success: true, settings: DEFAULT_TELEGRAM_CONFIG, source: 'defaults' };
}

/**
 * Updates Telegram settings in Supabase and synchronizes local cache
 */
export async function updateTelegramSettings(newConfig) {
  const merged = { ...DEFAULT_TELEGRAM_CONFIG, ...newConfig, updated_at: new Date().toISOString() };

  // Save to local cache immediately
  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('loozars_telegram_settings_updated', { detail: merged }));
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert(
          {
            id: 'telegram',
            config: merged,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, settings: merged };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  return { success: true, settings: merged, note: 'Saved locally' };
}

/**
 * Tests the Telegram connection live
 */
export async function testTelegramConnection(customSettings = null) {
  try {
    const res = await fetch('/api/telegram-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test_ping',
        customConfig: customSettings
      })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}
