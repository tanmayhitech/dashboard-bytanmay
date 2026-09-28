-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 10: TRANSACTIONAL EMAIL EVENTS & IDEMPOTENCY
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EMAIL EVENTS TABLE (Idempotency & Audit Trail)
-- Tracks every transactional email lifecycle event with unique constraints
-- preventing duplicate sends between webhooks and frontend callbacks.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'order_confirmation',
    'payment_confirmation',
    'order_status_confirmed',
    'order_status_processing',
    'order_status_shipped',
    'order_status_delivered',
    'order_status_cancelled'
  )),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts >= 0),
  last_error TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_email_events_order_id ON email_events(order_id);
CREATE INDEX IF NOT EXISTS idx_email_events_idempotency ON email_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_email_events_status ON email_events(status);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at DESC);

DROP TRIGGER IF EXISTS trigger_email_events_updated_at ON email_events;
CREATE TRIGGER trigger_email_events_updated_at
  BEFORE UPDATE ON email_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS)
-- Only verified admins & backend service_role can access email events.
-- ------------------------------------------------------------------------------
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and service role have full access to email events" ON email_events;
CREATE POLICY "Admins and service role have full access to email events"
  ON email_events FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ------------------------------------------------------------------------------
-- 3. ATOMIC RPC: record_email_event
-- Idempotent upsert tracking email deliveries without rolling back main order transactions.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_email_event(
  p_order_id UUID,
  p_event_type TEXT,
  p_recipient TEXT,
  p_subject TEXT,
  p_idempotency_key TEXT,
  p_status TEXT,
  p_provider_message_id TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_event RECORD;
BEGIN
  -- Insert or update email event record
  INSERT INTO email_events (
    order_id,
    event_type,
    recipient,
    subject,
    provider,
    provider_message_id,
    status,
    attempts,
    last_error,
    idempotency_key,
    sent_at,
    created_at,
    updated_at
  ) VALUES (
    p_order_id,
    p_event_type,
    lower(trim(p_recipient)),
    trim(p_subject),
    'resend',
    trim(p_provider_message_id),
    p_status,
    1,
    p_error,
    trim(p_idempotency_key),
    CASE WHEN p_status = 'sent' THEN timezone('utc'::text, now()) ELSE NULL END,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (idempotency_key) DO UPDATE
  SET status = EXCLUDED.status,
      attempts = email_events.attempts + 1,
      provider_message_id = COALESCE(EXCLUDED.provider_message_id, email_events.provider_message_id),
      last_error = EXCLUDED.last_error,
      sent_at = CASE WHEN EXCLUDED.status = 'sent' THEN timezone('utc'::text, now()) ELSE email_events.sent_at END,
      updated_at = timezone('utc'::text, now())
  RETURNING * INTO v_event;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', v_event.id,
    'order_id', v_event.order_id,
    'event_type', v_event.event_type,
    'status', v_event.status,
    'provider_message_id', v_event.provider_message_id,
    'attempts', v_event.attempts,
    'sent_at', v_event.sent_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_email_event TO authenticated;
GRANT EXECUTE ON FUNCTION record_email_event TO service_role;

-- ------------------------------------------------------------------------------
-- 4. ATOMIC RPC: get_order_email_events
-- Fetches recent email dispatch history for a specific order (Admin only)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_order_email_events(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_events JSONB := '[]'::jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'event_type', event_type,
      'recipient', recipient,
      'subject', subject,
      'status', status,
      'provider_message_id', provider_message_id,
      'attempts', attempts,
      'last_error', last_error,
      'sent_at', sent_at,
      'created_at', created_at
    ) ORDER BY created_at ASC
  ) INTO v_events
  FROM email_events
  WHERE order_id = p_order_id;

  RETURN COALESCE(v_events, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_order_email_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_email_events TO service_role;
