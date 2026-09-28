-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 03: DATABASE FUNCTIONS & RPC FOUNDATIONS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURE COUPON VALIDATION RPC
-- Validates promo code and calculates discount without exposing coupons table
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_cart_subtotal INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_discount INTEGER := 0;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon code cannot be empty.');
  END IF;

  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(trim(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid promo code.');
  END IF;

  IF NOT v_coupon.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This promo code is no longer active.');
  END IF;

  IF v_coupon.starts_at > timezone('utc'::text, now()) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This promo code is not active yet.');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < timezone('utc'::text, now()) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This promo code has expired.');
  END IF;

  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This promo code has reached its usage limit.');
  END IF;

  IF p_cart_subtotal < v_coupon.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', 'Minimum order amount of ₹' || v_coupon.min_order_amount || ' required for this code.'
    );
  END IF;

  -- Calculate discount
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

-- ------------------------------------------------------------------------------
-- 2. ATOMIC INVENTORY DEDUCTION FUNCTION
-- Locks rows, verifies stock, prevents race condition overselling, logs audit
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reserve_and_deduct_inventory(
  p_order_id UUID,
  p_items JSONB -- Array of { "variant_id": "uuid", "quantity": 1 }
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_variant_id UUID;
  v_qty INT;
  v_current_stock INT;
  v_new_stock INT;
BEGIN
  -- Iterate through items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := (v_item ->> 'variant_id')::UUID;
    v_qty := (v_item ->> 'quantity')::INT;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity % for variant %', v_qty, v_variant_id;
    END IF;

    -- Row-level lock on the variant
    SELECT stock_quantity INTO v_current_stock
    FROM product_variants
    WHERE id = v_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % not found in database', v_variant_id;
    END IF;

    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for variant %. Available: %, Requested: %', 
        v_variant_id, v_current_stock, v_qty;
    END IF;

    v_new_stock := v_current_stock - v_qty;

    -- Update inventory
    UPDATE product_variants
    SET stock_quantity = v_new_stock,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_variant_id;

    -- Record audit log
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
      p_order_id,
      'order_placed',
      -v_qty,
      v_current_stock,
      v_new_stock,
      'Order placed: ' || coalesce(p_order_id::text, 'Direct reservation')
    );
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
