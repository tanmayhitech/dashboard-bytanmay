-- Migration: 20261001000018_store_settings_and_integrations.sql
-- Description: Creates store_settings table for dynamic, zero-deploy dashboard integrations (Telegram, Notifications, Brand overrides)

CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 1. Service Role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'Service Role full access on store_settings'
  ) THEN
    CREATE POLICY "Service Role full access on store_settings"
      ON public.store_settings
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 2. Authenticated Admin full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'Admin users can view store_settings'
  ) THEN
    CREATE POLICY "Admin users can view store_settings"
      ON public.store_settings
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_active = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'Admin users can manage store_settings'
  ) THEN
    CREATE POLICY "Admin users can manage store_settings"
      ON public.store_settings
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_active = true
        )
      );
  END IF;
END $$;

-- Seed default Telegram settings
INSERT INTO public.store_settings (id, config)
VALUES ('telegram', '{
  "bot_token": "8776016138:AAHtz2dvr5uKwPTAjgXhVFMEAzZkyNW4_-E",
  "admin_chat_ids": "1612319687",
  "is_active": true,
  "notify_orders": true,
  "notify_returns": true,
  "notify_low_stock": true,
  "notify_reviews": true,
  "notify_morning_digest": true,
  "notify_night_closing": true
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
