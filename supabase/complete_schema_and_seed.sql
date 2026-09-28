-- ==============================================================================
-- LOOZARS® — MASTER POSTGRESQL SCHEMA & INITIAL SEED (MIGRATIONS 01 - 09)
-- Target Supabase Project: dfxmudxuqwsxdtimtqqa
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query
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
  subtitle TEXT NOT NULL,
  headline TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tees',
  collection TEXT NOT NULL DEFAULT 'DROP 01',
  "drop" TEXT NOT NULL DEFAULT 'DROP 01 — RACING DIVISION',
  badge TEXT DEFAULT 'DROP 01 / PIECE 01',
  fit TEXT DEFAULT 'Signature boxy oversized fit. Dropped shoulders with relaxed drape.',
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
  size TEXT NOT NULL CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS')),
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
-- Format: #LZR-YYYYMMDD-XXXX
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
  v_order_num := '#LZR-' || v_date || '-' || lpad((v_seq % 10000)::text, 4, '0');
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

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 6. INVENTORY LOGS TABLE (Deterministic Audit Trail)
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
-- 7. ADMIN USERS TABLE
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
-- 8. AUTHORIZATION & SECURITY HELPERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Service role (Edge functions / Cron / Scripts)
  IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
     coalesce(auth.jwt() ->> 'role', '') = 'service_role' OR
     coalesce(auth.role(), '') = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- 2. Unauthenticated user
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. JWT app_metadata role claims
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

REVOKE EXECUTE ON FUNCTION provision_admin_user FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION provision_admin_user FROM anon;
REVOKE EXECUTE ON FUNCTION provision_admin_user FROM authenticated;
GRANT EXECUTE ON FUNCTION provision_admin_user TO service_role;

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

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

-- Coupons (Admin only; public checks via RPC)
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

-- Admin Users Table
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
CREATE POLICY "Admins can view admin_users" ON admin_users FOR SELECT USING (is_admin());

-- ------------------------------------------------------------------------------
-- 10. RPC FUNCTIONS
-- ------------------------------------------------------------------------------

-- (A) VALIDATE COUPON
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_cart_subtotal INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_discount INTEGER := 0;
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(trim(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Invalid promo code');
  END IF;

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_coupon TO anon;
GRANT EXECUTE ON FUNCTION validate_coupon TO authenticated;
GRANT EXECUTE ON FUNCTION validate_coupon TO service_role;

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
  v_existing_order RECORD;
  v_item JSONB;
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
BEGIN
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

  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) != '' THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE UPPER(code) = UPPER(trim(p_coupon_code))
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Promo code "%" is invalid.', p_coupon_code;
    END IF;

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

    UPDATE coupons
    SET times_used = times_used + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_coupon.id;
  END IF;

  v_net_subtotal := v_subtotal - v_discount;
  IF v_net_subtotal >= p_free_shipping_threshold OR v_net_subtotal = 0 THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := p_standard_shipping_fee;
  END IF;

  v_total := v_net_subtotal + v_shipping_fee;
  v_order_id := gen_random_uuid();
  v_order_number := generate_order_number();

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
    p_payment_method,
    'pending',
    'pending',
    p_idempotency_key,
    p_notes,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );

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
    'payment_status', 'pending',
    'order_status', 'pending',
    'items', v_items_snapshot
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION create_order_transaction FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_order_transaction FROM anon;
GRANT EXECUTE ON FUNCTION create_order_transaction TO service_role;

-- (C) PAYMENT INTEGRATION RPCs
CREATE OR REPLACE FUNCTION record_razorpay_order_id(
  p_order_id UUID,
  p_razorpay_order_id TEXT
)
RETURNS JSONB AS $$
BEGIN
  UPDATE orders
  SET razorpay_order_id = trim(p_razorpay_order_id),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'razorpay_order_id', trim(p_razorpay_order_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_razorpay_order_id TO service_role;

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

  IF v_order.order_status = 'cancelled' THEN
    RAISE EXCEPTION 'Order % has been cancelled and cannot be marked as paid.', p_order_id;
  END IF;

  IF v_order.payment_status = 'paid' THEN
    IF v_order.razorpay_payment_id = trim(p_razorpay_payment_id) THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'payment_status', 'paid',
        'order_status', v_order.order_status
      );
    ELSE
      RAISE EXCEPTION 'Order % is already marked as paid under a different payment reference.', p_order_id;
    END IF;
  END IF;

  UPDATE orders
  SET payment_status = 'paid',
      order_status = 'confirmed',
      razorpay_payment_id = trim(p_razorpay_payment_id),
      razorpay_order_id = COALESCE(trim(p_razorpay_order_id), v_order.razorpay_order_id),
      razorpay_signature = trim(p_razorpay_signature),
      paid_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

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

GRANT EXECUTE ON FUNCTION confirm_order_payment TO service_role;

-- (D) STALE ORDER EXPIRY
CREATE OR REPLACE FUNCTION expire_stale_pending_orders(
  p_expiry_minutes INTEGER DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
  v_stale_order RECORD;
  v_locked_order RECORD;
  v_item JSONB;
  v_variant_id UUID;
  v_qty INT;
  v_variant RECORD;
  v_expired_count INT := 0;
  v_restored_items_count INT := 0;
BEGIN
  FOR v_stale_order IN
    SELECT id, order_number, created_at
    FROM orders
    WHERE payment_status = 'pending'
      AND order_status = 'pending'
      AND created_at < (timezone('utc'::text, now()) - (p_expiry_minutes || ' minutes')::INTERVAL)
    ORDER BY created_at ASC
  LOOP
    SELECT * INTO v_locked_order
    FROM orders
    WHERE id = v_stale_order.id
    FOR UPDATE;

    IF NOT FOUND OR v_locked_order.payment_status != 'pending' OR v_locked_order.order_status != 'pending' THEN
      CONTINUE;
    END IF;

    FOR v_item IN
      SELECT value
      FROM jsonb_array_elements(v_locked_order.items)
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
            reason
          ) VALUES (
            v_variant_id,
            v_locked_order.id,
            'order_cancelled',
            v_qty,
            v_variant.stock_quantity,
            v_variant.stock_quantity + v_qty,
            'Stale unpaid order auto-expiry (' || p_expiry_minutes || ' min cutoff): ' || v_locked_order.order_number
          );

          v_restored_items_count := v_restored_items_count + v_qty;
        END IF;
      END IF;
    END LOOP;

    UPDATE orders
    SET order_status = 'cancelled',
        notes = trim(COALESCE(notes || ' | ', '') || 'Auto-cancelled: Unpaid after ' || p_expiry_minutes || ' minutes.'),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_locked_order.id;

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'expiry_threshold_minutes', p_expiry_minutes,
    'expired_orders_count', v_expired_count,
    'restored_items_count', v_restored_items_count,
    'executed_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION expire_stale_pending_orders TO service_role;

-- (E) ADMIN OPERATIONS: adjust_variant_stock
CREATE OR REPLACE FUNCTION adjust_variant_stock(
  p_variant_id UUID,
  p_quantity_delta INTEGER,
  p_reason TEXT DEFAULT 'Manual adjustment'
)
RETURNS JSONB AS $$
DECLARE
  v_variant RECORD;
  v_product RECORD;
  v_new_stock INTEGER;
  v_change_type TEXT;
  v_admin_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  v_admin_id := auth.uid();

  SELECT * INTO v_variant
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product variant % not found.', p_variant_id;
  END IF;

  v_new_stock := v_variant.stock_quantity + p_quantity_delta;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock adjustment rejected: stock cannot be negative. Current stock: %, Adjustment delta: %, Resulting stock: %',
      v_variant.stock_quantity, p_quantity_delta, v_new_stock;
  END IF;

  IF p_quantity_delta >= 0 THEN
    v_change_type := 'restock';
  ELSE
    v_change_type := 'manual_adjustment';
  END IF;

  SELECT name, slug INTO v_product
  FROM products
  WHERE id = v_variant.product_id;

  UPDATE product_variants
  SET stock_quantity = v_new_stock,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_variant_id;

  INSERT INTO inventory_logs (
    variant_id,
    change_type,
    quantity_delta,
    previous_stock,
    new_stock,
    reason,
    created_by,
    created_at
  ) VALUES (
    p_variant_id,
    v_change_type,
    p_quantity_delta,
    v_variant.stock_quantity,
    v_new_stock,
    coalesce(trim(p_reason), 'Manual admin adjustment'),
    v_admin_id,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object(
    'success', true,
    'variant_id', v_variant.id,
    'product_id', v_variant.product_id,
    'product_name', coalesce(v_product.name, 'Unknown'),
    'sku', v_variant.sku,
    'size', v_variant.size,
    'previous_stock', v_variant.stock_quantity,
    'new_stock', v_new_stock,
    'delta', p_quantity_delta,
    'reason', coalesce(trim(p_reason), 'Manual admin adjustment'),
    'adjusted_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION adjust_variant_stock TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_variant_stock TO service_role;

-- (F) ADMIN OPERATIONS: update_order_status
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

  IF v_clean_status = 'pending' AND v_order.order_status != 'pending' THEN
    RAISE EXCEPTION 'Invalid transition: cannot move backwards from "%" to "pending".', v_order.order_status;
  END IF;

  IF v_clean_status = 'confirmed' AND v_order.order_status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Invalid transition: cannot move from "%" to "confirmed".', v_order.order_status;
  END IF;

  IF v_clean_status = 'processing' AND v_order.order_status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Invalid transition: cannot move from "%" to "processing".', v_order.order_status;
  END IF;

  IF v_clean_status = 'shipped' AND v_order.order_status NOT IN ('confirmed', 'processing') THEN
    RAISE EXCEPTION 'Invalid transition: cannot move from "%" to "shipped". Order must be confirmed or processing.', v_order.order_status;
  END IF;

  IF v_clean_status = 'delivered' AND v_order.order_status != 'shipped' THEN
    RAISE EXCEPTION 'Invalid transition: cannot move from "%" to "delivered". Order must be shipped first.', v_order.order_status;
  END IF;

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

-- (G) ADMIN OPERATIONS: get_admin_dashboard_metrics
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
  v_total_orders INT := 0;
  v_pending_orders INT := 0;
  v_confirmed_orders INT := 0;
  v_processing_orders INT := 0;
  v_shipped_orders INT := 0;
  v_delivered_orders INT := 0;
  v_cancelled_orders INT := 0;
  v_paid_orders INT := 0;
  v_pending_payments INT := 0;
  v_total_revenue INT := 0;
  v_total_products INT := 0;
  v_active_products INT := 0;
  v_total_variants INT := 0;
  v_low_stock_variants INT := 0;
  v_out_of_stock_variants INT := 0;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  SELECT
    count(*),
    count(*) FILTER (WHERE order_status = 'pending'),
    count(*) FILTER (WHERE order_status = 'confirmed'),
    count(*) FILTER (WHERE order_status = 'processing'),
    count(*) FILTER (WHERE order_status = 'shipped'),
    count(*) FILTER (WHERE order_status = 'delivered'),
    count(*) FILTER (WHERE order_status = 'cancelled'),
    count(*) FILTER (WHERE payment_status = 'paid'),
    count(*) FILTER (WHERE payment_status = 'pending'),
    coalesce(sum(total_amount) FILTER (WHERE payment_status = 'paid'), 0)
  INTO
    v_total_orders,
    v_pending_orders,
    v_confirmed_orders,
    v_processing_orders,
    v_shipped_orders,
    v_delivered_orders,
    v_cancelled_orders,
    v_paid_orders,
    v_pending_payments,
    v_total_revenue
  FROM orders;

  SELECT
    count(*),
    count(*) FILTER (WHERE is_active = true)
  INTO
    v_total_products,
    v_active_products
  FROM products;

  SELECT
    count(*),
    count(*) FILTER (WHERE stock_quantity <= 5 AND stock_quantity > 0 AND is_active = true),
    count(*) FILTER (WHERE stock_quantity = 0 AND is_active = true)
  INTO
    v_total_variants,
    v_low_stock_variants,
    v_out_of_stock_variants
  FROM product_variants;

  RETURN jsonb_build_object(
    'success', true,
    'orders', jsonb_build_object(
      'total', v_total_orders,
      'pending', v_pending_orders,
      'confirmed', v_confirmed_orders,
      'processing', v_processing_orders,
      'shipped', v_shipped_orders,
      'delivered', v_delivered_orders,
      'cancelled', v_cancelled_orders
    ),
    'payments', jsonb_build_object(
      'paid_orders', v_paid_orders,
      'pending_payments', v_pending_payments,
      'total_paid_revenue_inr', v_total_revenue
    ),
    'catalog', jsonb_build_object(
      'total_products', v_total_products,
      'active_products', v_active_products,
      'total_variants', v_total_variants,
      'low_stock_variants', v_low_stock_variants,
      'out_of_stock_variants', v_out_of_stock_variants
    ),
    'generated_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO service_role;

-- (H) ADMIN OPERATIONS: update_product_admin
CREATE OR REPLACE FUNCTION update_product_admin(
  p_product_id UUID,
  p_base_price INTEGER,
  p_sale_price INTEGER DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true,
  p_is_featured BOOLEAN DEFAULT false,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  IF p_base_price < 0 THEN
    RAISE EXCEPTION 'Base price cannot be negative.';
  END IF;

  IF p_sale_price IS NOT NULL AND p_sale_price < 0 THEN
    RAISE EXCEPTION 'Sale price cannot be negative.';
  END IF;

  UPDATE products
  SET base_price = p_base_price,
      sale_price = p_sale_price,
      is_active = p_is_active,
      is_featured = p_is_featured,
      name = COALESCE(trim(p_name), name),
      description = COALESCE(trim(p_description), description),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id
  RETURNING * INTO v_product;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found.', p_product_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product', jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'slug', v_product.slug,
      'base_price', v_product.base_price,
      'sale_price', v_product.sale_price,
      'is_active', v_product.is_active,
      'is_featured', v_product.is_featured,
      'updated_at', v_product.updated_at
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_product_admin TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_admin TO service_role;

-- (I) ADMIN OPERATIONS: manage_coupon
CREATE OR REPLACE FUNCTION manage_coupon(
  p_code TEXT,
  p_discount_type TEXT,
  p_discount_value NUMERIC,
  p_min_order_amount INTEGER DEFAULT 0,
  p_max_discount_amount INTEGER DEFAULT NULL,
  p_usage_limit INTEGER DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true,
  p_starts_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_code TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  v_code := UPPER(trim(p_code));

  IF v_code IS NULL OR v_code = '' THEN
    RAISE EXCEPTION 'Coupon code is required.';
  END IF;

  IF p_discount_type NOT IN ('percentage', 'fixed') THEN
    RAISE EXCEPTION 'Invalid discount type "%". Must be "percentage" or "fixed".', p_discount_type;
  END IF;

  IF p_discount_value <= 0 THEN
    RAISE EXCEPTION 'Discount value must be greater than zero.';
  END IF;

  IF p_discount_type = 'percentage' AND p_discount_value > 100 THEN
    RAISE EXCEPTION 'Percentage discount cannot exceed 100 percent.';
  END IF;

  IF p_id IS NOT NULL THEN
    UPDATE coupons
    SET code = v_code,
        discount_type = p_discount_type,
        discount_value = p_discount_value,
        min_order_amount = COALESCE(p_min_order_amount, 0),
        max_discount_amount = p_max_discount_amount,
        usage_limit = p_usage_limit,
        is_active = p_is_active,
        starts_at = COALESCE(p_starts_at, starts_at),
        expires_at = p_expires_at,
        description = p_description,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_id
    RETURNING * INTO v_coupon;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Coupon % not found.', p_id;
    END IF;
  ELSE
    INSERT INTO coupons (
      code,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      is_active,
      starts_at,
      expires_at,
      description
    ) VALUES (
      v_code,
      p_discount_type,
      p_discount_value,
      COALESCE(p_min_order_amount, 0),
      p_max_discount_amount,
      p_usage_limit,
      p_is_active,
      COALESCE(p_starts_at, timezone('utc'::text, now())),
      p_expires_at,
      p_description
    )
    RETURNING * INTO v_coupon;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'coupon', jsonb_build_object(
      'id', v_coupon.id,
      'code', v_coupon.code,
      'discount_type', v_coupon.discount_type,
      'discount_value', v_coupon.discount_value,
      'min_order_amount', v_coupon.min_order_amount,
      'max_discount_amount', v_coupon.max_discount_amount,
      'usage_limit', v_coupon.usage_limit,
      'times_used', v_coupon.times_used,
      'is_active', v_coupon.is_active,
      'starts_at', v_coupon.starts_at,
      'expires_at', v_coupon.expires_at,
      'description', v_coupon.description
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION manage_coupon TO authenticated;
GRANT EXECUTE ON FUNCTION manage_coupon TO service_role;

-- ------------------------------------------------------------------------------
-- 11. INITIAL SEED DATA (DROP 01 RACING DIVISION & PROMO CODES)
-- ------------------------------------------------------------------------------
INSERT INTO products (
  id, slug, sku, name, subtitle, headline, description, category, collection, "drop", badge, fit, details, measurements, base_price, weight_grams, is_active, is_featured, sort_order
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  'lzr-velo-07',
  'LZR-D01-01',
  'LZR VELO 07',
  'Black Racing Tee',
  'FOUR TEES. ONE RACING LANGUAGE.',
  'A black racing-inspired tee featuring bold LZR branding, red and white racing stripes, technical graphics, and motorsport-inspired detailing. Built with an aggressive, fast-paced visual language that gives the piece the feel of a racing uniform reworked for the streets.',
  'tees',
  'DROP 01',
  'DROP 01 — RACING DIVISION',
  'DROP 01 / PIECE 01',
  'Signature boxy oversized fit. Dropped shoulders with relaxed drape.',
  '[
    "320 GSM 100% Combed Heavyweight Cotton",
    "Bold LZR motorsport racing uniform screenprint",
    "Red & white technical racing stripes and track details",
    "Woven inner collar label with red metallic embroidery",
    "Pre-shrunk enzyme mineral wash treatment",
    "By The Rare. For The Rare."
  ]'::jsonb,
  '{
    "XS": { "chest": "42\"", "length": "28\"", "shoulder": "20\"" },
    "S":  { "chest": "44\"", "length": "29\"", "shoulder": "21\"" },
    "M":  { "chest": "46\"", "length": "30\"", "shoulder": "22\"" },
    "L":  { "chest": "48\"", "length": "31\"", "shoulder": "23\"" },
    "XL": { "chest": "50\"", "length": "32\"", "shoulder": "24\"" },
    "XXL":{ "chest": "52\"", "length": "33\"", "shoulder": "25\"" }
  }'::jsonb,
  899,
  350,
  true,
  true,
  1
),
(
  '00000000-0000-0000-0000-000000000002',
  'lzr-racing-division',
  'LZR-D01-02',
  'LZR RACING DIVISION',
  'Burgundy Racing Tee',
  'DARKER, MORE AGGRESSIVE MOTORSPORT AESTHETIC.',
  'A deep burgundy racing tee built around the LZR identity, with oversized central branding, technical linework, halftone graphics, racing typography, and red-and-white detailing. A darker, more aggressive interpretation of the Loozars racing aesthetic.',
  'tees',
  'DROP 01',
  'DROP 01 — RACING DIVISION',
  'DROP 01 / PIECE 02',
  'Heavy drop-shoulder boxy fit.',
  '[
    "320 GSM Heavy French Terry Compact Cotton",
    "Deep Burgundy mineral-wash finish",
    "Oversized central LZR emblem with technical linework",
    "Halftone racing graphics and red-and-white accents",
    "Reinforced crewneck and reverse exposed stitching",
    "By The Rare. For The Rare."
  ]'::jsonb,
  '{
    "S":  { "chest": "44\"", "length": "29\"", "shoulder": "21\"" },
    "M":  { "chest": "46\"", "length": "30\"", "shoulder": "22\"" },
    "L":  { "chest": "48\"", "length": "31\"", "shoulder": "23\"" },
    "XL": { "chest": "50\"", "length": "32\"", "shoulder": "24\"" },
    "XXL":{ "chest": "52\"", "length": "33\"", "shoulder": "25\"" }
  }'::jsonb,
  899,
  350,
  true,
  false,
  2
),
(
  '00000000-0000-0000-0000-000000000003',
  'lzr-apex-club',
  'LZR-D01-03',
  'LZR APEX CLUB',
  'Off-White Racing Tee',
  'DRIVER NUMBER 88 — PRO JERSEY SILHOUETTE.',
  'An off-white racing tee dominated by the LZR logo and 88 driver number. Inspired by professional driver jerseys, it combines bold numerical graphics, technical typography, black side detailing, and racing stripes for a clean motorsport silhouette.',
  'tees',
  'DROP 01',
  'DROP 01 — RACING DIVISION',
  'DROP 01 / PIECE 03',
  'Relaxed motorsport jersey drape.',
  '[
    "320 GSM Premium Off-White Heavy Cotton",
    "Oversized 88 driver number & LZR typography",
    "Black side-panel detailing & racing stripes",
    "Inspired by professional driver track jerseys",
    "Twin-needle reinforced construction",
    "By The Rare. For The Rare."
  ]'::jsonb,
  '{
    "XS": { "chest": "42\"", "length": "28\"", "shoulder": "20\"" },
    "S":  { "chest": "44\"", "length": "29\"", "shoulder": "21\"" },
    "M":  { "chest": "46\"", "length": "30\"", "shoulder": "22\"" },
    "L":  { "chest": "48\"", "length": "31\"", "shoulder": "23\"" },
    "XL": { "chest": "50\"", "length": "32\"", "shoulder": "24\"" }
  }'::jsonb,
  899,
  350,
  true,
  false,
  3
),
(
  '00000000-0000-0000-0000-000000000004',
  'lzr-ocean-speedway',
  'LZR-D01-04',
  'LZR OCEAN SPEEDWAY',
  'Navy Racing Tee',
  'COASTAL CULTURE MEETS HIGH-VELOCITY SPEED.',
  'A deep navy racing tee inspired by the intersection of coastal culture and speed. Featuring large LOOZARS branding, technical racing graphics, white stripe detailing, and layered typography, it brings a slightly more relaxed coastal character to the Drop 01 racing aesthetic.',
  'tees',
  'DROP 01',
  'DROP 01 — RACING DIVISION',
  'DROP 01 / PIECE 04',
  'Wide boxy streetwear fit.',
  '[
    "320 GSM Heavyweight Deep Navy Cotton",
    "Large LOOZARS technical speedway branding",
    "High-contrast white stripe detailing",
    "Layered coastal motorsport typography",
    "Pre-shrunk vintage wash finish",
    "By The Rare. For The Rare."
  ]'::jsonb,
  '{
    "S":  { "chest": "44\"", "length": "29\"", "shoulder": "21\"" },
    "M":  { "chest": "46\"", "length": "30\"", "shoulder": "22\"" },
    "L":  { "chest": "48\"", "length": "31\"", "shoulder": "23\"" },
    "XL": { "chest": "50\"", "length": "32\"", "shoulder": "24\"" },
    "XXL":{ "chest": "52\"", "length": "33\"", "shoulder": "25\"" }
  }'::jsonb,
  899,
  350,
  true,
  false,
  4
)
ON CONFLICT (slug) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  details = EXCLUDED.details,
  measurements = EXCLUDED.measurements,
  updated_at = timezone('utc'::text, now());

-- Initial Variants & Stock
INSERT INTO product_variants (product_id, size, sku, stock_quantity) VALUES
-- LZR VELO 07 (Black)
('00000000-0000-0000-0000-000000000001', 'XS', 'LZR-D01-01-XS', 4),
('00000000-0000-0000-0000-000000000001', 'S',  'LZR-D01-01-S',  8),
('00000000-0000-0000-0000-000000000001', 'M',  'LZR-D01-01-M',  15),
('00000000-0000-0000-0000-000000000001', 'L',  'LZR-D01-01-L',  20),
('00000000-0000-0000-0000-000000000001', 'XL', 'LZR-D01-01-XL', 8),
('00000000-0000-0000-0000-000000000001', 'XXL','LZR-D01-01-XXL',3),

-- LZR RACING DIVISION (Burgundy)
('00000000-0000-0000-0000-000000000002', 'S',  'LZR-D01-02-S',  5),
('00000000-0000-0000-0000-000000000002', 'M',  'LZR-D01-02-M',  11),
('00000000-0000-0000-0000-000000000002', 'L',  'LZR-D01-02-L',  14),
('00000000-0000-0000-0000-000000000002', 'XL', 'LZR-D01-02-XL', 6),
('00000000-0000-0000-0000-000000000002', 'XXL','LZR-D01-02-XXL',2),

-- LZR APEX CLUB (Off-White)
('00000000-0000-0000-0000-000000000003', 'XS', 'LZR-D01-03-XS', 3),
('00000000-0000-0000-0000-000000000003', 'S',  'LZR-D01-03-S',  7),
('00000000-0000-0000-0000-000000000003', 'M',  'LZR-D01-03-M',  12),
('00000000-0000-0000-0000-000000000003', 'L',  'LZR-D01-03-L',  10),
('00000000-0000-0000-0000-000000000003', 'XL', 'LZR-D01-03-XL', 4),

-- LZR OCEAN SPEEDWAY (Navy)
('00000000-0000-0000-0000-000000000004', 'S',  'LZR-D01-04-S',  5),
('00000000-0000-0000-0000-000000000004', 'M',  'LZR-D01-04-M',  12),
('00000000-0000-0000-0000-000000000004', 'L',  'LZR-D01-04-L',  16),
('00000000-0000-0000-0000-000000000004', 'XL', 'LZR-D01-04-XL', 7),
('00000000-0000-0000-0000-000000000004', 'XXL','LZR-D01-04-XXL',3)
ON CONFLICT (sku) DO NOTHING;

-- Initial Promo Coupons
INSERT INTO coupons (code, description, discount_type, discount_value, max_discount_amount, min_order_amount, is_active) VALUES
('DROP01', '10% Archive Launch Discount', 'percentage', 10.00, 500, 0, true),
('LOOZAR10', '10% Community Member Discount', 'percentage', 10.00, 500, 0, true)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 12. TRANSACTIONAL EMAIL EVENTS TABLE (MIGRATION 10)
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

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and service role have full access to email events" ON email_events;
CREATE POLICY "Admins and service role have full access to email events"
  ON email_events FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

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

