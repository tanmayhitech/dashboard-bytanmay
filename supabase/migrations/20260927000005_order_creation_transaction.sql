-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 05: SERVER-AUTHORITATIVE ORDER TRANSACTION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTEND ORDERS TABLE WITH IDEMPOTENCY & UPDATED STATUS CONSTRAINTS
-- ------------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Update order_status check constraint to support full lifecycle
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
  CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'created'));

ALTER TABLE orders ALTER COLUMN order_status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);

-- ------------------------------------------------------------------------------
-- 2. ATOMIC SERVER-SIDE ORDER CREATION TRANSACTION RPC
-- Executes in a single ACID transaction block:
-- - Validates customer data and address
-- - Locks variant rows with FOR UPDATE (sorted to prevent deadlocks)
-- - Verifies active products & variants
-- - Checks real-time stock
-- - Computes server-authoritative line items, subtotal, discount, shipping, total
-- - Deducts stock & writes audit trail to inventory_logs
-- - Inserts immutable order snapshot
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_order_transaction(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address JSONB,
  p_items JSONB, -- Array of { "product_id": "uuid", "variant_id": "uuid", "quantity": int }
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

    -- Row-level lock on the variant
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

    -- Fetch parent product
    SELECT * INTO v_product
    FROM products
    WHERE id = v_variant.product_id;

    IF NOT FOUND OR NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product % is no longer available.', v_variant.product_id;
    END IF;

    -- Authoritative unit price resolution: variant price_override takes precedence over base_price
    v_unit_price := coalesce(v_variant.price_override, v_product.base_price);
    v_line_total := v_unit_price * v_qty;
    v_subtotal := v_subtotal + v_line_total;

    -- Build immutable historical snapshot
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

    -- Deduct variant stock
    UPDATE product_variants
    SET stock_quantity = stock_quantity - v_qty,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_variant.id;
  END LOOP;

  -- 4. Server-Side Coupon Validation & Discount Computation
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

    -- Update coupon usage counter
    UPDATE coupons
    SET times_used = times_used + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_coupon.id;
  END IF;

  -- 5. Authoritative Shipping Computation (FreePan-India at ₹2,000+, ₹99 standard)
  v_net_subtotal := v_subtotal - v_discount;
  IF v_net_subtotal >= p_free_shipping_threshold OR v_net_subtotal = 0 THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := p_standard_shipping_fee;
  END IF;

  -- 6. Final Order Total
  v_total := v_net_subtotal + v_shipping_fee;
  v_order_id := gen_random_uuid();
  v_order_number := generate_order_number();

  -- 7. Insert Authoritative Order Record
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

  -- 8. Write Audit Logs for Inventory Deductions
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

  -- 9. Return Authoritative Order Summary
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

-- ------------------------------------------------------------------------------
-- 3. REVOKE / GRANT PERMISSIONS
-- Public cannot invoke create_order_transaction directly;
-- Only service_role (and authenticated edge functions) have execution rights.
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION create_order_transaction FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_order_transaction FROM anon;
GRANT EXECUTE ON FUNCTION create_order_transaction TO service_role;
