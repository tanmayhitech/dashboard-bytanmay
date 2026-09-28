-- ==============================================================================
-- E-COMMERCE ADMIN & CREATOR AFFILIATE OPERATING SYSTEM — MASTER DATABASE SCHEMA
-- Author / Creator: Tanmay (ecommerce-admin-engine-by-tanmay)
-- PostgreSQL / Supabase Migration DDL
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS & CORE UTILITIES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  headline TEXT,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'apparel',
  collection TEXT NOT NULL DEFAULT 'MAIN',
  "drop" TEXT NOT NULL DEFAULT 'DROP 01',
  badge TEXT DEFAULT 'NEW ARRIVAL',
  fit TEXT DEFAULT 'Regular Fit',
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  sale_price INTEGER CHECK (sale_price IS NULL OR sale_price >= 0),
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  weight_grams INTEGER DEFAULT 350 CHECK (weight_grams > 0),
  seo_title TEXT,
  seo_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. PRODUCT VARIANTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  price_override INTEGER CHECK (price_override IS NULL OR price_override >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_product_variant_size UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON product_variants(stock_quantity);

DROP TRIGGER IF EXISTS trigger_product_variants_updated_at ON product_variants;
CREATE TRIGGER trigger_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 3. COUPONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  max_discount_amount INTEGER CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  min_order_amount INTEGER NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

DROP TRIGGER IF EXISTS trigger_coupons_updated_at ON coupons;
CREATE TRIGGER trigger_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4. DETERMINISTIC ORDER NUMBER SEQUENCE & GENERATOR
-- Format: #ORD-YYYYMMDD-XXXX
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS order_number_daily_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_seq INT;
  v_order_num TEXT;
BEGIN
  v_date := to_char(timezone('Asia/Kolkata', now()), 'YYYYMMDD');
  v_seq := nextval('order_number_daily_seq');
  v_order_num := '#ORD-' || v_date || '-' || lpad((v_seq % 10000)::text, 4, '0');
  RETURN v_order_num;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 5. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT generate_order_number(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal_amount INTEGER NOT NULL CHECK (subtotal_amount >= 0),
  discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_fee INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  coupon_code TEXT,
  influencer_id UUID,
  influencer_commission_amount INTEGER DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'netbanking', 'cod', 'razorpay')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'created')),
  idempotency_key TEXT UNIQUE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  paid_at TIMESTAMPTZ,
  shipment_id TEXT,
  tracking_number TEXT,
  courier_name TEXT,
  notes TEXT,
  google_sheets_synced_at TIMESTAMPTZ,
  confirmation_email_sent_at TIMESTAMPTZ,
  shipment_email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_influencer_id ON orders(influencer_id);

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 6. INVENTORY LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('order_placed', 'order_cancelled', 'manual_adjustment', 'restock')),
  quantity_delta INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inv_logs_variant_id ON inventory_logs(variant_id);
CREATE INDEX IF NOT EXISTS idx_inv_logs_order_id ON inventory_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_inv_logs_created_at ON inventory_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. ADMIN ROLES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'manager')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trigger_admin_users_updated_at ON admin_users;
CREATE TRIGGER trigger_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 8. INFLUENCERS & AFFILIATE CREATOR SYSTEM
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instagram_handle TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  collaboration_type TEXT NOT NULL DEFAULT 'paid' CHECK (collaboration_type IN ('paid', 'barter', 'hybrid', 'commission_only')),
  coupon_code TEXT UNIQUE,
  customer_discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (customer_discount_type IN ('percentage', 'fixed')),
  customer_discount_value NUMERIC(10, 2) NOT NULL DEFAULT 10.00 CHECK (customer_discount_value >= 0),
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC(10, 2) NOT NULL DEFAULT 8.00 CHECK (commission_value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  barter_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_influencers_coupon_code ON influencers(UPPER(coupon_code));
CREATE INDEX IF NOT EXISTS idx_influencers_email ON influencers(email);
CREATE INDEX IF NOT EXISTS idx_influencers_is_active ON influencers(is_active);

DROP TRIGGER IF EXISTS trigger_influencers_updated_at ON influencers;
CREATE TRIGGER trigger_influencers_updated_at
  BEFORE UPDATE ON influencers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Influencer Auth Linkage
CREATE TABLE IF NOT EXISTS influencer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_influencer_user UNIQUE (influencer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_inf_users_user_id ON influencer_users(user_id);
CREATE INDEX IF NOT EXISTS idx_inf_users_influencer_id ON influencer_users(influencer_id);

-- Influencer Commission Ledger
CREATE TABLE IF NOT EXISTS influencer_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  order_amount INTEGER NOT NULL CHECK (order_amount >= 0),
  commission_rate_applied NUMERIC(10, 2) NOT NULL,
  commission_amount INTEGER NOT NULL CHECK (commission_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'eligible', 'paid', 'reversed')),
  payout_reference TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_commission_order_influencer UNIQUE (order_id, influencer_id)
);

CREATE INDEX IF NOT EXISTS idx_inf_commissions_influencer ON influencer_commissions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_inf_commissions_order ON influencer_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_inf_commissions_status ON influencer_commissions(status);
CREATE INDEX IF NOT EXISTS idx_inf_commissions_created_at ON influencer_commissions(created_at DESC);

DROP TRIGGER IF EXISTS trigger_influencer_commissions_updated_at ON influencer_commissions;
CREATE TRIGGER trigger_influencer_commissions_updated_at
  BEFORE UPDATE ON influencer_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 9. TRANSACTIONAL EMAIL EVENTS & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('order_confirmation', 'order_shipped', 'order_cancelled', 'influencer_payout')),
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  resend_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_events_order_id ON email_events(order_id);
CREATE INDEX IF NOT EXISTS idx_email_events_status ON email_events(status);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_entity, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 10. SECURITY & ROLE HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Service role (Edge functions / Background workers)
  IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
     coalesce(auth.jwt() ->> 'role', '') = 'service_role' OR
     coalesce(auth.role(), '') = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- 2. Unauthenticated check
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. JWT claims
  IF coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'superadmin', 'manager') THEN
    RETURN TRUE;
  END IF;

  IF coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = TRUE THEN
    RETURN TRUE;
  END IF;

  -- 4. Database admin_users table lookup
  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_role TEXT := 'none';
BEGIN
  v_is_admin := is_admin();

  IF v_is_admin THEN
    SELECT role INTO v_role FROM admin_users WHERE user_id = auth.uid() LIMIT 1;
    IF v_role IS NULL THEN
      v_role := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'admin');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'is_authenticated', auth.uid() IS NOT NULL,
    'is_admin', v_is_admin,
    'user_id', auth.uid(),
    'role', v_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION check_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_admin TO anon;

CREATE OR REPLACE FUNCTION provision_admin_user(
  p_email TEXT,
  p_role TEXT DEFAULT 'admin'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % does not exist in auth.users. Please sign up or create the user in Supabase Auth first.', p_email;
  END IF;

  INSERT INTO admin_users (user_id, role, notes)
  VALUES (v_user_id, p_role, 'Provisioned via provision_admin_user')
  ON CONFLICT (user_id) DO UPDATE
  SET role = p_role,
      updated_at = timezone('utc'::text, now());

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'role', p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Influencer Identity Resolver
CREATE OR REPLACE FUNCTION get_my_influencer_profile()
RETURNS JSONB AS $$
DECLARE
  v_inf RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;

  SELECT i.* INTO v_inf
  FROM influencers i
  JOIN influencer_users iu ON iu.influencer_id = i.id
  WHERE iu.user_id = auth.uid()
  LIMIT 1;

  IF NOT FOUND THEN
    -- Fallback by email match
    SELECT * INTO v_inf
    FROM influencers
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('authenticated', true, 'is_influencer', false);
  END IF;

  RETURN jsonb_build_object(
    'authenticated', true,
    'is_influencer', true,
    'profile', row_to_json(v_inf)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_my_influencer_profile TO authenticated;

-- ------------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Products
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (is_active = true OR is_admin());
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Product Variants
DROP POLICY IF EXISTS "Public can view active product variants" ON product_variants;
CREATE POLICY "Public can view active product variants" ON product_variants FOR SELECT USING (is_active = true OR is_admin());
DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
CREATE POLICY "Admins can manage product variants" ON product_variants FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Orders
DROP POLICY IF EXISTS "Admins and service role have full access to orders" ON orders;
CREATE POLICY "Admins and service role have full access to orders" ON orders FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Customers can read their own order by email and id" ON orders;
CREATE POLICY "Customers can read their own order by email and id" ON orders FOR SELECT
  USING (customer_email = coalesce(auth.jwt() ->> 'email', '') OR is_admin());

-- Inventory Logs
DROP POLICY IF EXISTS "Admins and service role have full access to inventory logs" ON inventory_logs;
CREATE POLICY "Admins and service role have full access to inventory logs" ON inventory_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Influencers
DROP POLICY IF EXISTS "Admins can manage all influencers" ON influencers;
CREATE POLICY "Admins can manage all influencers" ON influencers FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Influencers can view own record" ON influencers;
CREATE POLICY "Influencers can view own record" ON influencers FOR SELECT
  USING (
    is_admin() OR
    id IN (SELECT influencer_id FROM influencer_users WHERE user_id = auth.uid()) OR
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Influencer Commissions
DROP POLICY IF EXISTS "Admins can manage all commissions" ON influencer_commissions;
CREATE POLICY "Admins can manage all commissions" ON influencer_commissions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Influencers can view own commissions" ON influencer_commissions;
CREATE POLICY "Influencers can view own commissions" ON influencer_commissions FOR SELECT
  USING (
    is_admin() OR
    influencer_id IN (SELECT influencer_id FROM influencer_users WHERE user_id = auth.uid()) OR
    influencer_id IN (SELECT id FROM influencers WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

-- Admin Users
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
CREATE POLICY "Admins can view admin_users" ON admin_users FOR SELECT USING (is_admin());

-- Audit Logs
DROP POLICY IF EXISTS "Admins can read audit logs" ON admin_audit_logs;
CREATE POLICY "Admins can read audit logs" ON admin_audit_logs FOR SELECT USING (is_admin());

-- ------------------------------------------------------------------------------
-- 12. CORE RPC PROCEDURES
-- ------------------------------------------------------------------------------

-- (A) VALIDATE COUPON
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_cart_subtotal INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_influencer RECORD;
  v_discount INTEGER := 0;
BEGIN
  -- 1. Check coupons table
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(trim(p_code))
  LIMIT 1;

  IF FOUND THEN
    IF NOT v_coupon.is_active THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Promo code is inactive');
    END IF;

    IF v_coupon.starts_at > timezone('utc'::text, now()) THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Promo code not yet active');
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < timezone('utc'::text, now()) THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Promo code has expired');
    END IF;

    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Promo code usage limit reached');
    END IF;

    IF p_cart_subtotal < v_coupon.min_order_amount THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Minimum order amount of ₹' || v_coupon.min_order_amount || ' required');
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_discount := round((p_cart_subtotal * v_coupon.discount_value) / 100.0);
      IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
        v_discount := v_coupon.max_discount_amount;
      END IF;
    ELSIF v_coupon.discount_type = 'fixed' THEN
      v_discount := round(v_coupon.discount_value);
      IF v_discount > p_cart_subtotal THEN
        v_discount := p_cart_subtotal;
      END IF;
    END IF;

    RETURN jsonb_build_object(
      'valid', true,
      'code', v_coupon.code,
      'discount_type', v_coupon.discount_type,
      'discount_value', v_coupon.discount_value,
      'discount_amount', v_discount,
      'description', v_coupon.description
    );
  END IF;

  -- 2. Check influencer coupon
  SELECT * INTO v_influencer
  FROM influencers
  WHERE UPPER(coupon_code) = UPPER(trim(p_code)) AND is_active = true
  LIMIT 1;

  IF FOUND THEN
    IF v_influencer.customer_discount_type = 'percentage' THEN
      v_discount := round((p_cart_subtotal * v_influencer.customer_discount_value) / 100.0);
    ELSE
      v_discount := round(v_influencer.customer_discount_value);
      IF v_discount > p_cart_subtotal THEN
        v_discount := p_cart_subtotal;
      END IF;
    END IF;

    RETURN jsonb_build_object(
      'valid', true,
      'code', v_influencer.coupon_code,
      'discount_type', v_influencer.customer_discount_type,
      'discount_value', v_influencer.customer_discount_value,
      'discount_amount', v_discount,
      'influencer_id', v_influencer.id,
      'influencer_name', v_influencer.name,
      'description', 'Creator partner discount (' || v_influencer.name || ')'
    );
  END IF;

  RETURN jsonb_build_object('valid', false, 'message', 'Invalid promo code');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_coupon TO anon;
GRANT EXECUTE ON FUNCTION validate_coupon TO authenticated;

-- (B) CREATE ORDER TRANSACTION
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
  v_existing_order orders%ROWTYPE;
  v_subtotal INTEGER := 0;
  v_discount INTEGER := 0;
  v_shipping INTEGER := 0;
  v_total INTEGER := 0;
  v_item JSONB;
  v_variant RECORD;
  v_product RECORD;
  v_verified_items JSONB := '[]'::jsonb;
  v_item_price INTEGER;
  v_item_total INTEGER;
  v_order orders%ROWTYPE;
  v_influencer RECORD;
  v_commission_amount INTEGER := 0;
  v_commission_rate NUMERIC(10, 2) := 0;
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_order FROM orders WHERE idempotency_key = p_idempotency_key LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('success', true, 'order', row_to_json(v_existing_order), 'is_duplicate', true);
    END IF;
  END IF;

  -- Validate & Lock items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT v.*, p.name AS product_name, p.base_price, p.sale_price
    INTO v_variant
    FROM product_variants v
    JOIN products p ON p.id = v.product_id
    WHERE v.id = (v_item ->> 'variant_id')::uuid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant ID % does not exist in catalog', (v_item ->> 'variant_id');
    END IF;

    IF v_variant.stock_quantity < (v_item ->> 'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock for % (Size %). Only % available.',
        v_variant.product_name, v_variant.size, v_variant.stock_quantity;
    END IF;

    -- Decrement stock & log audit
    UPDATE product_variants
    SET stock_quantity = stock_quantity - (v_item ->> 'quantity')::int,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_variant.id;

    v_item_price := coalesce(v_variant.price_override, v_variant.sale_price, v_variant.base_price);
    v_item_total := v_item_price * (v_item ->> 'quantity')::int;
    v_subtotal := v_subtotal + v_item_total;

    v_verified_items := v_verified_items || jsonb_build_object(
      'variant_id', v_variant.id,
      'product_id', v_variant.product_id,
      'name', v_variant.product_name,
      'size', v_variant.size,
      'sku', v_variant.sku,
      'unit_price', v_item_price,
      'quantity', (v_item ->> 'quantity')::int,
      'total_price', v_item_total
    );
  END LOOP;

  -- Discount & Influencer check
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_influencer FROM influencers WHERE UPPER(coupon_code) = UPPER(trim(p_coupon_code)) AND is_active = true LIMIT 1;
    IF FOUND THEN
      IF v_influencer.customer_discount_type = 'percentage' THEN
        v_discount := round((v_subtotal * v_influencer.customer_discount_value) / 100.0);
      ELSE
        v_discount := round(v_influencer.customer_discount_value);
      END IF;

      IF v_influencer.commission_type = 'percentage' THEN
        v_commission_rate := v_influencer.commission_value;
        v_commission_amount := round(((v_subtotal - v_discount) * v_influencer.commission_value) / 100.0);
      ELSE
        v_commission_rate := v_influencer.commission_value;
        v_commission_amount := round(v_influencer.commission_value);
      END IF;
    END IF;
  END IF;

  -- Shipping
  IF (v_subtotal - v_discount) >= p_free_shipping_threshold OR (v_subtotal - v_discount) = 0 THEN
    v_shipping := 0;
  ELSE
    v_shipping := p_standard_shipping_fee;
  END IF;

  v_total := (v_subtotal - v_discount) + v_shipping;

  -- Insert Order
  INSERT INTO orders (
    customer_name, customer_email, customer_phone,
    shipping_address, items, subtotal_amount, discount_amount,
    shipping_fee, total_amount, coupon_code,
    influencer_id, influencer_commission_amount,
    payment_method, payment_status, order_status,
    idempotency_key, notes
  ) VALUES (
    p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, v_verified_items, v_subtotal, v_discount,
    v_shipping, v_total, p_coupon_code,
    v_influencer.id, v_commission_amount,
    p_payment_method,
    CASE WHEN p_payment_method = 'cod' THEN 'pending' ELSE 'pending' END,
    CASE WHEN p_payment_method = 'cod' THEN 'confirmed' ELSE 'pending' END,
    p_idempotency_key, p_notes
  ) RETURNING * INTO v_order;

  -- Record commission ledger if applicable
  IF v_influencer.id IS NOT NULL AND v_commission_amount > 0 THEN
    INSERT INTO influencer_commissions (
      influencer_id, order_id, order_number, order_amount,
      commission_rate_applied, commission_amount, status
    ) VALUES (
      v_influencer.id, v_order.id, v_order.order_number, v_order.total_amount,
      v_commission_rate, v_commission_amount,
      CASE WHEN p_payment_method = 'cod' THEN 'pending' ELSE 'pending' END
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'order', row_to_json(v_order));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_order_transaction TO anon;
GRANT EXECUTE ON FUNCTION create_order_transaction TO authenticated;

-- (C) ADMIN DASHBOARD METRICS RPC
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
  v_orders_total INT;
  v_orders_pending INT;
  v_orders_confirmed INT;
  v_orders_processing INT;
  v_orders_shipped INT;
  v_orders_delivered INT;
  v_orders_cancelled INT;
  v_paid_revenue NUMERIC;
  v_total_influencers INT;
  v_total_commissions_pending NUMERIC;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized admin access';
  END IF;

  SELECT count(*) INTO v_orders_total FROM orders;
  SELECT count(*) FILTER (WHERE order_status = 'pending') INTO v_orders_pending FROM orders;
  SELECT count(*) FILTER (WHERE order_status = 'confirmed') INTO v_orders_confirmed FROM orders;
  SELECT count(*) FILTER (WHERE order_status = 'processing') INTO v_orders_processing FROM orders;
  SELECT count(*) FILTER (WHERE order_status = 'shipped') INTO v_orders_shipped FROM orders;
  SELECT count(*) FILTER (WHERE order_status = 'delivered') INTO v_orders_delivered FROM orders;
  SELECT count(*) FILTER (WHERE order_status = 'cancelled') INTO v_orders_cancelled FROM orders;

  SELECT coalesce(sum(total_amount), 0) INTO v_paid_revenue FROM orders WHERE payment_status = 'paid';
  SELECT count(*) INTO v_total_influencers FROM influencers WHERE is_active = true;
  SELECT coalesce(sum(commission_amount), 0) INTO v_total_commissions_pending FROM influencer_commissions WHERE status IN ('pending', 'eligible');

  RETURN jsonb_build_object(
    'orders', jsonb_build_object(
      'total', v_orders_total,
      'pending', v_orders_pending,
      'confirmed', v_orders_confirmed,
      'processing', v_orders_processing,
      'shipped', v_orders_shipped,
      'delivered', v_orders_delivered,
      'cancelled', v_orders_cancelled
    ),
    'revenue', jsonb_build_object(
      'total_paid', v_paid_revenue
    ),
    'influencers', jsonb_build_object(
      'active_count', v_total_influencers,
      'unsettled_commissions', v_total_commissions_pending
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO authenticated;

-- ==============================================================================
-- END OF MASTER SCHEMA
-- ==============================================================================
