-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 12: INFLUENCER / CREATOR AFFILIATE SYSTEM
-- Production-grade, immutable commission ledger, barter tracking & creator portal
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. INFLUENCERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instagram_handle TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  collaboration_type TEXT NOT NULL DEFAULT 'barter' CHECK (collaboration_type IN ('barter', 'paid')),
  coupon_code TEXT NOT NULL,
  customer_discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (customer_discount_type IN ('percentage', 'fixed')),
  customer_discount_value NUMERIC(10, 2) NOT NULL DEFAULT 10.00 CHECK (customer_discount_value > 0),
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC(10, 2) NOT NULL DEFAULT 8.00 CHECK (commission_value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  barter_details JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_influencers_handle ON influencers(LOWER(TRIM(instagram_handle)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_influencers_coupon_code ON influencers(UPPER(TRIM(coupon_code)));
CREATE INDEX IF NOT EXISTS idx_influencers_is_active ON influencers(is_active);

CREATE TRIGGER trigger_influencers_updated_at
  BEFORE UPDATE ON influencers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. INFLUENCER USERS (SUPABASE AUTH IDENTITY MAPPING)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS influencer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_influencer_users_auth_user UNIQUE (auth_user_id),
  CONSTRAINT uq_influencer_users_influencer UNIQUE (influencer_id)
);

CREATE INDEX IF NOT EXISTS idx_influencer_users_auth_user ON influencer_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_users_influencer ON influencer_users(influencer_id);

-- ------------------------------------------------------------------------------
-- 3. EXTEND COUPONS & ORDERS WITH INFLUENCER ATTRIBUTION
-- ------------------------------------------------------------------------------
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_influencer_id ON coupons(influencer_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS influencer_commission_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS influencer_commission_rate_snapshot NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS influencer_commission_type_snapshot TEXT DEFAULT 'percentage';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_discount_snapshot NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code_snapshot TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_influencer_id ON orders(influencer_id);

-- ------------------------------------------------------------------------------
-- 4. INFLUENCER COMMISSIONS IMMUTABLE LEDGER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS influencer_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  commission_type_snapshot TEXT NOT NULL CHECK (commission_type_snapshot IN ('percentage', 'fixed')),
  commission_value_snapshot NUMERIC(10, 2) NOT NULL CHECK (commission_value_snapshot >= 0),
  commission_base_amount NUMERIC(10, 2) NOT NULL CHECK (commission_base_amount >= 0),
  commission_amount NUMERIC(10, 2) NOT NULL CHECK (commission_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'eligible', 'paid', 'reversed', 'cancelled')),
  payout_reference TEXT,
  paid_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_influencer_order_commission UNIQUE (order_id, influencer_id)
);

CREATE INDEX IF NOT EXISTS idx_influencer_commissions_influencer ON influencer_commissions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_commissions_order ON influencer_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_influencer_commissions_status ON influencer_commissions(status);

CREATE TRIGGER trigger_influencer_commissions_updated_at
  BEFORE UPDATE ON influencer_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_commissions ENABLE ROW LEVEL SECURITY;

-- Helper to check if caller is an authorized influencer
CREATE OR REPLACE FUNCTION is_influencer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM influencer_users WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to get authenticated influencer's ID
CREATE OR REPLACE FUNCTION get_current_influencer_id()
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT influencer_id INTO v_id FROM influencer_users WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Influencers table policies
CREATE POLICY "Admins full access to influencers"
  ON influencers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Influencers can view own profile"
  ON influencers FOR SELECT
  USING (id = get_current_influencer_id());

-- Influencer Users table policies
CREATE POLICY "Admins full access to influencer_users"
  ON influencer_users FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Influencers can view own user mapping"
  ON influencer_users FOR SELECT
  USING (auth_user_id = auth.uid());

-- Influencer Commissions table policies
CREATE POLICY "Admins full access to influencer_commissions"
  ON influencer_commissions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Influencers can view own commissions"
  ON influencer_commissions FOR SELECT
  USING (influencer_id = get_current_influencer_id());

-- ------------------------------------------------------------------------------
-- 6. INFLUENCER MANAGEMENT RPC: create_influencer
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_influencer(
  p_name TEXT,
  p_instagram_handle TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_collaboration_type TEXT DEFAULT 'barter',
  p_coupon_code TEXT DEFAULT NULL,
  p_customer_discount_type TEXT DEFAULT 'percentage',
  p_customer_discount_value NUMERIC DEFAULT 10.00,
  p_commission_type TEXT DEFAULT 'percentage',
  p_commission_value NUMERIC DEFAULT 8.00,
  p_notes TEXT DEFAULT NULL,
  p_barter_details JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_influencer_id UUID;
  v_coupon_code TEXT;
  v_handle TEXT;
  v_coupon_id UUID;
  v_result RECORD;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Influencer name is required.';
  END IF;

  IF p_instagram_handle IS NULL OR trim(p_instagram_handle) = '' THEN
    RAISE EXCEPTION 'Instagram handle is required.';
  END IF;

  v_handle := lower(trim(replace(p_instagram_handle, '@', '')));
  v_coupon_code := upper(trim(coalesce(p_coupon_code, v_handle || '10')));

  IF v_coupon_code = '' THEN
    RAISE EXCEPTION 'A valid unique coupon code is required.';
  END IF;

  IF p_customer_discount_value <= 0 THEN
    RAISE EXCEPTION 'Customer discount value must be greater than 0.';
  END IF;

  IF p_commission_value < 0 THEN
    RAISE EXCEPTION 'Commission value cannot be negative.';
  END IF;

  v_influencer_id := gen_random_uuid();

  -- Insert Influencer Record
  INSERT INTO influencers (
    id,
    name,
    instagram_handle,
    email,
    phone,
    collaboration_type,
    coupon_code,
    customer_discount_type,
    customer_discount_value,
    commission_type,
    commission_value,
    is_active,
    notes,
    barter_details,
    created_at,
    updated_at
  ) VALUES (
    v_influencer_id,
    trim(p_name),
    v_handle,
    nullif(trim(lower(p_email)), ''),
    nullif(trim(p_phone), ''),
    p_collaboration_type,
    v_coupon_code,
    p_customer_discount_type,
    p_customer_discount_value,
    p_commission_type,
    p_commission_value,
    true,
    nullif(trim(p_notes), ''),
    p_barter_details,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );

  -- Upsert linked coupon in coupons table
  INSERT INTO coupons (
    id,
    code,
    description,
    discount_type,
    discount_value,
    influencer_id,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_coupon_code,
    'Creator Discount (@' || v_handle || ')',
    p_customer_discount_type,
    p_customer_discount_value,
    v_influencer_id,
    true,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (code) DO UPDATE
  SET influencer_id = v_influencer_id,
      discount_type = p_customer_discount_type,
      discount_value = p_customer_discount_value,
      is_active = true,
      updated_at = timezone('utc'::text, now());

  SELECT * INTO v_result FROM influencers WHERE id = v_influencer_id;

  RETURN to_jsonb(v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_influencer TO authenticated;
GRANT EXECUTE ON FUNCTION create_influencer TO service_role;

-- ------------------------------------------------------------------------------
-- 7. INFLUENCER MANAGEMENT RPC: update_influencer
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_influencer(
  p_influencer_id UUID,
  p_name TEXT,
  p_instagram_handle TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_collaboration_type TEXT DEFAULT 'barter',
  p_customer_discount_type TEXT DEFAULT 'percentage',
  p_customer_discount_value NUMERIC DEFAULT 10.00,
  p_commission_type TEXT DEFAULT 'percentage',
  p_commission_value NUMERIC DEFAULT 8.00,
  p_is_active BOOLEAN DEFAULT true,
  p_notes TEXT DEFAULT NULL,
  p_barter_details JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_inf RECORD;
  v_handle TEXT;
  v_result RECORD;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  SELECT * INTO v_inf FROM influencers WHERE id = p_influencer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Influencer % not found.', p_influencer_id;
  END IF;

  v_handle := lower(trim(replace(p_instagram_handle, '@', '')));

  UPDATE influencers
  SET name = trim(p_name),
      instagram_handle = v_handle,
      email = nullif(trim(lower(p_email)), ''),
      phone = nullif(trim(p_phone), ''),
      collaboration_type = p_collaboration_type,
      customer_discount_type = p_customer_discount_type,
      customer_discount_value = p_customer_discount_value,
      commission_type = p_commission_type,
      commission_value = p_commission_value,
      is_active = p_is_active,
      notes = nullif(trim(p_notes), ''),
      barter_details = p_barter_details,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_influencer_id;

  -- Sync linked coupon in coupons table
  UPDATE coupons
  SET discount_type = p_customer_discount_type,
      discount_value = p_customer_discount_value,
      is_active = p_is_active,
      description = 'Creator Discount (@' || v_handle || ')',
      updated_at = timezone('utc'::text, now())
  WHERE influencer_id = p_influencer_id;

  SELECT * INTO v_result FROM influencers WHERE id = p_influencer_id;
  RETURN to_jsonb(v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_influencer TO authenticated;
GRANT EXECUTE ON FUNCTION update_influencer TO service_role;

-- ------------------------------------------------------------------------------
-- 8. PAYOUT RPC: mark_influencer_payout_paid
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_influencer_payout_paid(
  p_commission_ids UUID[],
  p_payout_reference TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_count INT := 0;
  v_total_paid NUMERIC := 0;
  v_ref TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  IF p_commission_ids IS NULL OR array_length(p_commission_ids, 1) = 0 THEN
    RAISE EXCEPTION 'At least one commission ID must be selected for payout.';
  END IF;

  v_ref := trim(p_payout_reference);
  IF v_ref IS NULL OR v_ref = '' THEN
    RAISE EXCEPTION 'A valid payout transaction reference is required.';
  END IF;

  -- Calculate sum of eligible commissions
  SELECT COALESCE(sum(commission_amount), 0), count(*)
  INTO v_total_paid, v_count
  FROM influencer_commissions
  WHERE id = ANY(p_commission_ids)
    AND status = 'eligible';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No eligible commissions found for the selected IDs.';
  END IF;

  -- Atomically update to paid
  UPDATE influencer_commissions
  SET status = 'paid',
      payout_reference = v_ref,
      paid_at = timezone('utc'::text, now()),
      notes = CASE WHEN p_notes IS NOT NULL AND trim(p_notes) != '' THEN trim(p_notes) ELSE notes END,
      updated_at = timezone('utc'::text, now())
  WHERE id = ANY(p_commission_ids)
    AND status = 'eligible';

  RETURN jsonb_build_object(
    'success', true,
    'marked_paid_count', v_count,
    'total_paid_amount', v_total_paid,
    'payout_reference', v_ref,
    'paid_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_influencer_payout_paid TO authenticated;
GRANT EXECUTE ON FUNCTION mark_influencer_payout_paid TO service_role;

-- ------------------------------------------------------------------------------
-- 9. ADMIN AGGREGATED INFLUENCER PERFORMANCE METRICS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_admin_influencer_performance()
RETURNS JSONB AS $$
DECLARE
  v_list JSONB;
  v_totals RECORD;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  -- Aggregate summary across all influencers
  SELECT
    COALESCE(count(*), 0) AS total_influencers,
    COALESCE(count(*) FILTER (WHERE is_active = true), 0) AS active_influencers
  INTO v_totals
  FROM influencers;

  -- Build per-influencer breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', inf.id,
      'name', inf.name,
      'instagram_handle', inf.instagram_handle,
      'email', inf.email,
      'phone', inf.phone,
      'collaboration_type', inf.collaboration_type,
      'coupon_code', inf.coupon_code,
      'customer_discount_type', inf.customer_discount_type,
      'customer_discount_value', inf.customer_discount_value,
      'commission_type', inf.commission_type,
      'commission_value', inf.commission_value,
      'is_active', inf.is_active,
      'notes', inf.notes,
      'barter_details', inf.barter_details,
      'created_at', inf.created_at,
      'metrics', jsonb_build_object(
        'total_orders', COALESCE(ord_stats.total_orders, 0),
        'paid_orders', COALESCE(ord_stats.paid_orders, 0),
        'revenue_generated', COALESCE(ord_stats.revenue_generated, 0),
        'total_commissions_earned', COALESCE(comm_stats.total_earned, 0),
        'pending_commissions', COALESCE(comm_stats.pending_amount, 0),
        'eligible_commissions', COALESCE(comm_stats.eligible_amount, 0),
        'paid_commissions', COALESCE(comm_stats.paid_amount, 0),
        'reversed_commissions', COALESCE(comm_stats.reversed_amount, 0)
      )
    ) ORDER BY inf.created_at DESC
  ) INTO v_list
  FROM influencers inf
  LEFT JOIN (
    SELECT
      influencer_id,
      count(*) AS total_orders,
      count(*) FILTER (WHERE payment_status = 'paid') AS paid_orders,
      COALESCE(sum(total_amount) FILTER (WHERE payment_status = 'paid'), 0) AS revenue_generated
    FROM orders
    WHERE influencer_id IS NOT NULL
    GROUP BY influencer_id
  ) ord_stats ON ord_stats.influencer_id = inf.id
  LEFT JOIN (
    SELECT
      influencer_id,
      COALESCE(sum(commission_amount), 0) AS total_earned,
      COALESCE(sum(commission_amount) FILTER (WHERE status = 'pending'), 0) AS pending_amount,
      COALESCE(sum(commission_amount) FILTER (WHERE status = 'eligible'), 0) AS eligible_amount,
      COALESCE(sum(commission_amount) FILTER (WHERE status = 'paid'), 0) AS paid_amount,
      COALESCE(sum(commission_amount) FILTER (WHERE status IN ('reversed', 'cancelled')), 0) AS reversed_amount
    FROM influencer_commissions
    GROUP BY influencer_id
  ) comm_stats ON comm_stats.influencer_id = inf.id;

  RETURN jsonb_build_object(
    'success', true,
    'total_influencers', v_totals.total_influencers,
    'active_influencers', v_totals.active_influencers,
    'influencers', COALESCE(v_list, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_influencer_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_influencer_performance TO service_role;

-- ------------------------------------------------------------------------------
-- 10. INFLUENCER DASHBOARD DATA RPC (FOR CREATOR PORTAL)
-- Masked Customer Information: ONLY name, items count/titles, amount, status
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_influencer_dashboard_data()
RETURNS JSONB AS $$
DECLARE
  v_inf_id UUID;
  v_inf RECORD;
  v_metrics RECORD;
  v_orders JSONB;
  v_commissions JSONB;
BEGIN
  -- Authenticate caller as mapped influencer
  SELECT influencer_id INTO v_inf_id
  FROM influencer_users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_inf_id IS NULL THEN
    RAISE EXCEPTION 'Access denied. Authenticated user is not registered as an influencer.';
  END IF;

  SELECT * INTO v_inf FROM influencers WHERE id = v_inf_id;
  IF NOT FOUND OR NOT v_inf.is_active THEN
    RAISE EXCEPTION 'Influencer account is inactive or not found.';
  END IF;

  -- Aggregate metrics for this influencer
  SELECT
    COALESCE(count(DISTINCT o.id), 0) AS total_orders,
    COALESCE(sum(o.total_amount) FILTER (WHERE o.payment_status = 'paid'), 0) AS total_sales_generated,
    COALESCE(sum(c.commission_amount), 0) AS total_earned,
    COALESCE(sum(c.commission_amount) FILTER (WHERE c.status = 'pending'), 0) AS pending_amount,
    COALESCE(sum(c.commission_amount) FILTER (WHERE c.status = 'eligible'), 0) AS eligible_amount,
    COALESCE(sum(c.commission_amount) FILTER (WHERE c.status = 'paid'), 0) AS paid_amount,
    COALESCE(sum(c.commission_amount) FILTER (WHERE c.status IN ('reversed', 'cancelled')), 0) AS reversed_amount
  INTO v_metrics
  FROM orders o
  LEFT JOIN influencer_commissions c ON c.order_id = o.id AND c.influencer_id = v_inf_id
  WHERE o.influencer_id = v_inf_id;

  -- Attributed orders with privacy masking (NO phone, NO email, NO street address, NO payment tokens)
  SELECT jsonb_agg(
    jsonb_build_object(
      'order_number', o.order_number,
      'customer_display_name', o.customer_name,
      'order_date', o.created_at,
      'items_count', jsonb_array_length(o.items),
      'order_total', o.total_amount,
      'payment_status', o.payment_status,
      'order_status', o.order_status,
      'commission_amount', COALESCE(c.commission_amount, o.influencer_commission_amount, 0),
      'commission_status', COALESCE(c.status, 'pending'),
      'payout_reference', c.payout_reference,
      'paid_at', c.paid_at
    ) ORDER BY o.created_at DESC
  ) INTO v_orders
  FROM orders o
  LEFT JOIN influencer_commissions c ON c.order_id = o.id AND c.influencer_id = v_inf_id
  WHERE o.influencer_id = v_inf_id;

  RETURN jsonb_build_object(
    'success', true,
    'influencer', jsonb_build_object(
      'id', v_inf.id,
      'name', v_inf.name,
      'instagram_handle', v_inf.instagram_handle,
      'coupon_code', v_inf.coupon_code,
      'customer_discount_type', v_inf.customer_discount_type,
      'customer_discount_value', v_inf.customer_discount_value,
      'commission_type', v_inf.commission_type,
      'commission_value', v_inf.commission_value,
      'collaboration_type', v_inf.collaboration_type
    ),
    'metrics', jsonb_build_object(
      'total_orders', v_metrics.total_orders,
      'total_sales_generated', v_metrics.total_sales_generated,
      'total_earned', v_metrics.total_earned,
      'pending_amount', v_metrics.pending_amount,
      'eligible_amount', v_metrics.eligible_amount,
      'paid_amount', v_metrics.paid_amount,
      'reversed_amount', v_metrics.reversed_amount
    ),
    'orders', COALESCE(v_orders, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_influencer_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_influencer_dashboard_data TO service_role;

-- ------------------------------------------------------------------------------
-- 11. CHECK IS INFLUENCER RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_is_influencer()
RETURNS JSONB AS $$
DECLARE
  v_mapping RECORD;
  v_inf RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('is_influencer', false, 'error', 'Unauthenticated');
  END IF;

  SELECT * INTO v_mapping FROM influencer_users WHERE auth_user_id = auth.uid() LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('is_influencer', false);
  END IF;

  SELECT * INTO v_inf FROM influencers WHERE id = v_mapping.influencer_id;
  IF NOT FOUND OR NOT v_inf.is_active THEN
    RETURN jsonb_build_object('is_influencer', false, 'is_inactive', true);
  END IF;

  RETURN jsonb_build_object(
    'is_influencer', true,
    'influencer_id', v_inf.id,
    'name', v_inf.name,
    'instagram_handle', v_inf.instagram_handle,
    'coupon_code', v_inf.coupon_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_is_influencer TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_influencer TO anon;
GRANT EXECUTE ON FUNCTION check_is_influencer TO service_role;

-- ------------------------------------------------------------------------------
-- 12. UPDATE CREATE_ORDER_TRANSACTION RPC TO HANDLE INFLUENCER COMMISSIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_order_transaction(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address JSONB,
  p_items JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'upi',
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_free_shipping_threshold INTEGER DEFAULT 2000,
  p_standard_shipping_fee INTEGER DEFAULT 99
)
RETURNS JSONB AS $$
DECLARE
  v_existing_order RECORD;
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_qty INT;
  v_variant RECORD;
  v_product RECORD;
  v_unit_price INT;
  v_line_total INT;
  v_subtotal INT := 0;
  v_discount INT := 0;
  v_net_subtotal INT := 0;
  v_shipping_fee INT := 0;
  v_total INT := 0;
  v_items_snapshot JSONB := '[]'::jsonb;
  v_snapshot_entry JSONB;
  v_coupon RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  -- Influencer attribution variables
  v_influencer RECORD;
  v_influencer_id UUID := NULL;
  v_commission_amount NUMERIC(10, 2) := 0;
  v_commission_rate NUMERIC(10, 2) := 0;
  v_commission_type TEXT := 'percentage';
  v_commission_base NUMERIC(10, 2) := 0;
BEGIN
  -- 1. Check idempotency (prevent duplicate submissions)
  IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) != '' THEN
    SELECT * INTO v_existing_order FROM orders WHERE idempotency_key = trim(p_idempotency_key) LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'subtotal_amount', v_existing_order.subtotal_amount,
        'discount_amount', v_existing_order.discount_amount,
        'shipping_fee', v_existing_order.shipping_fee,
        'total_amount', v_existing_order.total_amount,
        'payment_status', v_existing_order.payment_status,
        'order_status', v_existing_order.order_status,
        'items', v_existing_order.items
      );
    END IF;
  END IF;

  -- 2. Validate Customer Payload
  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Customer name is required.';
  END IF;
  IF p_customer_email IS NULL OR p_customer_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'A valid customer email address is required.';
  END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) < 10 THEN
    RAISE EXCEPTION 'A valid 10-digit customer phone number is required.';
  END IF;
  IF p_shipping_address IS NULL OR (p_shipping_address ->> 'address') IS NULL OR (p_shipping_address ->> 'city') IS NULL THEN
    RAISE EXCEPTION 'Complete shipping address (street, city, state, pincode) is required.';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  -- 3. Lock variants and compute authoritative pricing & stock in deterministic order
  FOR v_item IN 
    SELECT value 
    FROM jsonb_array_elements(p_items) 
    ORDER BY (value ->> 'variant_id')::text ASC
  LOOP
    v_variant_id := (v_item ->> 'variant_id')::UUID;
    v_qty := (v_item ->> 'quantity')::INT;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity % for variant %', v_qty, v_variant_id;
    END IF;

    SELECT * INTO v_variant
    FROM product_variants
    WHERE id = v_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % does not exist.', v_variant_id;
    END IF;

    IF NOT v_variant.is_active THEN
      RAISE EXCEPTION 'Product variant % is discontinued or inactive.', v_variant_id;
    END IF;

    IF (v_variant.stock_quantity - coalesce(v_variant.reserved_quantity, 0)) < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for % (Size %). Available: %, Requested: %', 
        v_variant.sku, v_variant.size, (v_variant.stock_quantity - coalesce(v_variant.reserved_quantity, 0)), v_qty;
    END IF;

    SELECT * INTO v_product
    FROM products
    WHERE id = v_variant.product_id;

    IF NOT FOUND OR NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product % is no longer available.', v_variant.product_id;
    END IF;

    v_unit_price := coalesce(v_variant.price_override, v_product.base_price);
    v_line_total := v_unit_price * v_qty;
    v_subtotal := v_subtotal + v_line_total;

    v_snapshot_entry := jsonb_build_object(
      'product_id', v_product.id,
      'product_slug', v_product.slug,
      'variant_id', v_variant.id,
      'sku', v_variant.sku,
      'product_name', v_product.name,
      'subtitle', v_product.subtitle,
      'size', v_variant.size,
      'quantity', v_qty,
      'unit_price', v_unit_price,
      'line_total', v_line_total
    );
    v_items_snapshot := v_items_snapshot || jsonb_build_array(v_snapshot_entry);

    UPDATE product_variants
    SET stock_quantity = stock_quantity - v_qty,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_variant.id;
  END LOOP;

  -- 4. Server-Side Coupon & Influencer Validation
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) != '' THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE UPPER(code) = UPPER(trim(p_coupon_code))
    LIMIT 1;

    IF NOT FOUND THEN
      -- Also check direct influencer coupon_code
      SELECT * INTO v_influencer
      FROM influencers
      WHERE UPPER(coupon_code) = UPPER(trim(p_coupon_code))
      LIMIT 1;

      IF FOUND THEN
        v_influencer_id := v_influencer.id;
        IF NOT v_influencer.is_active THEN
          RAISE EXCEPTION 'Influencer promo code "%" is currently inactive.', p_coupon_code;
        END IF;

        IF v_influencer.customer_discount_type = 'percentage' THEN
          v_discount := round((v_subtotal * v_influencer.customer_discount_value) / 100.0);
        ELSE
          v_discount := round(v_influencer.customer_discount_value);
        END IF;

        IF v_discount > v_subtotal THEN
          v_discount := v_subtotal;
        END IF;

        v_commission_type := v_influencer.commission_type;
        v_commission_rate := v_influencer.commission_value;
      ELSE
        RAISE EXCEPTION 'Promo code "%" is invalid.', p_coupon_code;
      END IF;
    ELSE
      -- Existing coupon found
      IF NOT v_coupon.is_active THEN
        RAISE EXCEPTION 'Promo code "%" is no longer active.', p_coupon_code;
      END IF;

      IF v_coupon.starts_at > timezone('utc'::text, now()) THEN
        RAISE EXCEPTION 'Promo code "%" is not yet active.', p_coupon_code;
      END IF;

      IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < timezone('utc'::text, now()) THEN
        RAISE EXCEPTION 'Promo code "%" has expired.', p_coupon_code;
      END IF;

      IF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
        RAISE EXCEPTION 'Promo code "%" has reached its maximum usage limit.', p_coupon_code;
      END IF;

      IF v_subtotal < v_coupon.min_order_amount THEN
        RAISE EXCEPTION 'Minimum order amount of ₹% is required for promo code "%".', v_coupon.min_order_amount, p_coupon_code;
      END IF;

      IF v_coupon.discount_type = 'percentage' THEN
        v_discount := round((v_subtotal * v_coupon.discount_value) / 100.0);
        IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
          v_discount := v_coupon.max_discount_amount;
        END IF;
      ELSIF v_coupon.discount_type = 'fixed' THEN
        v_discount := round(v_coupon.discount_value);
        IF v_discount > v_subtotal THEN
          v_discount := v_subtotal;
        END IF;
      END IF;

      -- Check if linked to an influencer
      IF v_coupon.influencer_id IS NOT NULL THEN
        SELECT * INTO v_influencer FROM influencers WHERE id = v_coupon.influencer_id;
        IF FOUND AND v_influencer.is_active THEN
          v_influencer_id := v_influencer.id;
          v_commission_type := v_influencer.commission_type;
          v_commission_rate := v_influencer.commission_value;
        END IF;
      END IF;

      UPDATE coupons
      SET times_used = times_used + 1,
          updated_at = timezone('utc'::text, now())
      WHERE id = v_coupon.id;
    END IF;
  END IF;

  -- 5. Authoritative Shipping Computation
  v_net_subtotal := v_subtotal - v_discount;
  IF v_net_subtotal >= p_free_shipping_threshold OR v_net_subtotal = 0 THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := p_standard_shipping_fee;
  END IF;

  -- 6. Influencer Commission Calculation (Excludes Shipping Fee)
  -- Commission Base = Merchandise Net Subtotal (Subtotal - Customer Discount)
  v_commission_base := v_net_subtotal;
  IF v_influencer_id IS NOT NULL AND v_commission_base > 0 THEN
    IF v_commission_type = 'percentage' THEN
      v_commission_amount := round((v_commission_base * v_commission_rate) / 100.0, 2);
    ELSIF v_commission_type = 'fixed' THEN
      v_commission_amount := round(LEAST(v_commission_rate, v_commission_base), 2);
    END IF;
  END IF;

  -- 7. Final Order Total
  v_total := v_net_subtotal + v_shipping_fee;
  v_order_id := gen_random_uuid();
  v_order_number := generate_order_number();

  -- 8. Insert Authoritative Order Record
  INSERT INTO orders (
    id,
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    items,
    subtotal_amount,
    discount_amount,
    shipping_fee,
    total_amount,
    coupon_code,
    influencer_id,
    influencer_commission_amount,
    influencer_commission_rate_snapshot,
    influencer_commission_type_snapshot,
    customer_discount_snapshot,
    coupon_code_snapshot,
    payment_method,
    payment_status,
    order_status,
    idempotency_key,
    notes,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_order_number,
    trim(p_customer_name),
    trim(lower(p_customer_email)),
    trim(p_customer_phone),
    p_shipping_address,
    v_items_snapshot,
    v_subtotal,
    v_discount,
    v_shipping_fee,
    v_total,
    p_coupon_code,
    v_influencer_id,
    v_commission_amount,
    v_commission_rate,
    v_commission_type,
    v_discount,
    p_coupon_code,
    p_payment_method,
    'pending',
    'pending',
    p_idempotency_key,
    p_notes,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );

  -- 9. Insert Commission Ledger Entry if Influencer is Attributed
  IF v_influencer_id IS NOT NULL AND v_commission_amount > 0 THEN
    INSERT INTO influencer_commissions (
      id,
      influencer_id,
      order_id,
      commission_type_snapshot,
      commission_value_snapshot,
      commission_base_amount,
      commission_amount,
      status,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_influencer_id,
      v_order_id,
      v_commission_type,
      v_commission_rate,
      v_commission_base,
      v_commission_amount,
      'pending',
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    ON CONFLICT (order_id, influencer_id) DO NOTHING;
  END IF;

  -- 10. Write Audit Logs for Inventory Deductions
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items_snapshot)
  LOOP
    INSERT INTO inventory_logs (
      variant_id,
      order_id,
      change_type,
      quantity_delta,
      previous_stock,
      new_stock,
      reason
    ) VALUES (
      (v_item ->> 'variant_id')::UUID,
      v_order_id,
      'order_placed',
      -((v_item ->> 'quantity')::INT),
      (SELECT stock_quantity + (v_item ->> 'quantity')::INT FROM product_variants WHERE id = (v_item ->> 'variant_id')::UUID),
      (SELECT stock_quantity FROM product_variants WHERE id = (v_item ->> 'variant_id')::UUID),
      'Order creation: ' || v_order_number
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'customer_name', trim(p_customer_name),
    'customer_email', trim(lower(p_customer_email)),
    'subtotal_amount', v_subtotal,
    'discount_amount', v_discount,
    'shipping_fee', v_shipping_fee,
    'total_amount', v_total,
    'influencer_id', v_influencer_id,
    'commission_amount', v_commission_amount,
    'payment_status', 'pending',
    'order_status', 'pending',
    'items', v_items_snapshot
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_order_transaction TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 13. UPDATE CONFIRM_ORDER_PAYMENT RPC TO TRANSITION COMMISSION TO ELIGIBLE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION confirm_order_payment(
  p_order_id UUID,
  p_razorpay_payment_id TEXT,
  p_razorpay_order_id TEXT,
  p_razorpay_signature TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  IF v_order.payment_status = 'paid' THEN
    IF v_order.razorpay_payment_id = trim(p_razorpay_payment_id) THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'payment_status', v_order.payment_status,
        'order_status', v_order.order_status
      );
    ELSE
      RAISE EXCEPTION 'Order % is already marked as paid under a different payment reference (%).', 
        p_order_id, v_order.razorpay_payment_id;
    END IF;
  END IF;

  -- Update order to paid & confirmed
  UPDATE orders
  SET payment_status = 'paid',
      order_status = 'confirmed',
      razorpay_payment_id = trim(p_razorpay_payment_id),
      razorpay_order_id = COALESCE(trim(p_razorpay_order_id), v_order.razorpay_order_id),
      razorpay_signature = trim(p_razorpay_signature),
      paid_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  -- Transition any linked influencer commission from pending -> eligible
  UPDATE influencer_commissions
  SET status = 'eligible',
      updated_at = timezone('utc'::text, now())
  WHERE order_id = p_order_id
    AND status = 'pending';

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'customer_email', v_order.customer_email,
    'subtotal_amount', v_order.subtotal_amount,
    'discount_amount', v_order.discount_amount,
    'shipping_fee', v_order.shipping_fee,
    'total_amount', v_order.total_amount,
    'payment_status', 'paid',
    'order_status', 'confirmed',
    'items', v_order.items,
    'shipping_address', v_order.shipping_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION confirm_order_payment TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 14. UPDATE UPDATE_ORDER_STATUS RPC TO HANDLE COMMISSION CANCELLATION / REVERSAL
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_tracking_number TEXT DEFAULT NULL,
  p_courier_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item JSONB;
  v_variant_id UUID;
  v_qty INT;
  v_variant RECORD;
  v_restored_count INT := 0;
  v_clean_status TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  v_clean_status := lower(trim(p_new_status));

  IF v_clean_status NOT IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status "%". Must be one of: pending, confirmed, processing, shipped, delivered, cancelled.', p_new_status;
  END IF;

  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found.', p_order_id;
  END IF;

  IF v_order.order_status = v_clean_status THEN
    UPDATE orders
    SET notes = CASE WHEN p_notes IS NOT NULL AND trim(p_notes) != '' THEN trim(p_notes) ELSE notes END,
        tracking_number = CASE WHEN p_tracking_number IS NOT NULL AND trim(p_tracking_number) != '' THEN trim(p_tracking_number) ELSE tracking_number END,
        courier_name = CASE WHEN p_courier_name IS NOT NULL AND trim(p_courier_name) != '' THEN trim(p_courier_name) ELSE courier_name END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
      'success', true,
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'previous_status', v_order.order_status,
      'new_status', v_clean_status,
      'updated_metadata_only', true
    );
  END IF;

  IF v_order.order_status = 'delivered' THEN
    RAISE EXCEPTION 'Order % is already delivered and in a terminal state.', v_order.order_number;
  END IF;

  IF v_order.order_status = 'cancelled' THEN
    RAISE EXCEPTION 'Order % is already cancelled and in a terminal state.', v_order.order_number;
  END IF;

  -- Cancellation logic
  IF v_clean_status = 'cancelled' THEN
    IF v_order.order_status IN ('pending', 'confirmed', 'processing') THEN
      FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(v_order.items)
        ORDER BY (value ->> 'variant_id')::text ASC
      LOOP
        v_variant_id := (v_item ->> 'variant_id')::UUID;
        v_qty := (v_item ->> 'quantity')::INT;

        IF v_variant_id IS NOT NULL AND v_qty IS NOT NULL AND v_qty > 0 THEN
          SELECT * INTO v_variant
          FROM product_variants
          WHERE id = v_variant_id
          FOR UPDATE;

          IF FOUND THEN
            UPDATE product_variants
            SET stock_quantity = stock_quantity + v_qty,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_variant_id;

            INSERT INTO inventory_logs (
              variant_id,
              order_id,
              change_type,
              quantity_delta,
              previous_stock,
              new_stock,
              reason,
              created_by,
              created_at
            ) VALUES (
              v_variant_id,
              v_order.id,
              'order_cancelled',
              v_qty,
              v_variant.stock_quantity,
              v_variant.stock_quantity + v_qty,
              'Admin cancellation of ' || v_order.order_number || ': ' || coalesce(trim(p_notes), 'No reason provided'),
              auth.uid(),
              timezone('utc'::text, now())
            );

            v_restored_count := v_restored_count + v_qty;
          END IF;
        END IF;
      END LOOP;
    END IF;

    -- Cancel or reverse linked influencer commission
    UPDATE influencer_commissions
    SET status = CASE WHEN status = 'paid' THEN 'reversed' ELSE 'cancelled' END,
        reversed_at = timezone('utc'::text, now()),
        notes = COALESCE(notes || ' | ', '') || 'Order cancelled by admin',
        updated_at = timezone('utc'::text, now())
    WHERE order_id = p_order_id
      AND status NOT IN ('reversed', 'cancelled');
  END IF;

  UPDATE orders
  SET order_status = v_clean_status,
      notes = CASE WHEN p_notes IS NOT NULL AND trim(p_notes) != '' THEN trim(p_notes) ELSE notes END,
      tracking_number = CASE WHEN p_tracking_number IS NOT NULL AND trim(p_tracking_number) != '' THEN trim(p_tracking_number) ELSE tracking_number END,
      courier_name = CASE WHEN p_courier_name IS NOT NULL AND trim(p_courier_name) != '' THEN trim(p_courier_name) ELSE courier_name END,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'previous_status', v_order.order_status,
    'new_status', v_clean_status,
    'restored_items_count', v_restored_count,
    'notes', p_notes,
    'tracking_number', p_tracking_number,
    'courier_name', p_courier_name,
    'updated_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_order_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status TO service_role;
