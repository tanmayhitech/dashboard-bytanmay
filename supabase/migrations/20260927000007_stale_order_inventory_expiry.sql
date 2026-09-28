-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 07: STALE PENDING ORDER EXPIRY & INVENTORY RESTORATION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ATOMIC FUNCTION: expire_stale_pending_orders
-- Identifies abandoned unpaid orders older than p_expiry_minutes (default: 60 min),
-- safely restores deducted inventory, records non-repudiable audit logs,
-- and transitions order_status to 'cancelled'.
-- ------------------------------------------------------------------------------
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
  v_expired_orders JSONB := '[]'::jsonb;
BEGIN
  -- 1. Query candidate stale pending orders older than the cutoff threshold
  FOR v_stale_order IN
    SELECT id, order_number, created_at
    FROM orders
    WHERE payment_status = 'pending'
      AND order_status = 'pending'
      AND created_at < (timezone('utc'::text, now()) - (p_expiry_minutes || ' minutes')::INTERVAL)
    ORDER BY created_at ASC
  LOOP
    -- 2. Acquire row-level lock on the specific order to prevent concurrent payment race conditions
    SELECT * INTO v_locked_order
    FROM orders
    WHERE id = v_stale_order.id
    FOR UPDATE;

    -- 3. Strict Guard: If order was paid, cancelled, or confirmed concurrently, skip immediately
    IF NOT FOUND OR v_locked_order.payment_status != 'pending' OR v_locked_order.order_status != 'pending' THEN
      CONTINUE;
    END IF;

    -- 4. Lock and restore inventory for each variant in the snapshot in deterministic order
    FOR v_item IN
      SELECT value
      FROM jsonb_array_elements(v_locked_order.items)
      ORDER BY (value ->> 'variant_id')::text ASC
    LOOP
      v_variant_id := (v_item ->> 'variant_id')::UUID;
      v_qty := (v_item ->> 'quantity')::INT;

      IF v_variant_id IS NOT NULL AND v_qty IS NOT NULL AND v_qty > 0 THEN
        -- Acquire row-level lock on variant
        SELECT * INTO v_variant
        FROM product_variants
        WHERE id = v_variant_id
        FOR UPDATE;

        IF FOUND THEN
          -- Restore deducted stock
          UPDATE product_variants
          SET stock_quantity = stock_quantity + v_qty,
              updated_at = timezone('utc'::text, now())
          WHERE id = v_variant_id;

          -- Write non-repudiable audit log
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

    -- 5. Atomically update order status to cancelled
    UPDATE orders
    SET order_status = 'cancelled',
        notes = trim(COALESCE(notes || ' | ', '') || 'Auto-cancelled: Unpaid after ' || p_expiry_minutes || ' minutes.'),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_locked_order.id;

    v_expired_count := v_expired_count + 1;
    v_expired_orders := v_expired_orders || jsonb_build_array(jsonb_build_object(
      'order_id', v_locked_order.id,
      'order_number', v_locked_order.order_number,
      'created_at', v_locked_order.created_at
    ));
  END LOOP;

  -- 6. Return structured execution report
  RETURN jsonb_build_object(
    'success', true,
    'expiry_threshold_minutes', p_expiry_minutes,
    'expired_orders_count', v_expired_count,
    'restored_items_count', v_restored_items_count,
    'expired_orders', v_expired_orders,
    'executed_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION expire_stale_pending_orders FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION expire_stale_pending_orders FROM anon;
GRANT EXECUTE ON FUNCTION expire_stale_pending_orders TO service_role;

-- ------------------------------------------------------------------------------
-- 2. HARDEN confirm_order_payment WITH CANCELLED-ORDER PROTECTION
-- Prevents race conditions where an expired/cancelled order attempts payment confirmation
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
  -- 1. Row-level lock on target order
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  -- 2. Check if order was already cancelled/expired
  IF v_order.order_status = 'cancelled' THEN
    RAISE EXCEPTION 'Order % has been cancelled (expired) and cannot be marked as paid.', p_order_id;
  END IF;

  -- 3. Idempotent check: if already confirmed with matching payment id, return success
  IF v_order.payment_status = 'paid' THEN
    IF v_order.razorpay_payment_id = trim(p_razorpay_payment_id) THEN
      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'customer_name', v_order.customer_name,
        'customer_email', v_order.customer_email,
        'subtotal_amount', v_order.subtotal_amount,
        'discount_amount', v_order.discount_amount,
        'shipping_fee', v_order.shipping_fee,
        'total_amount', v_order.total_amount,
        'payment_status', v_order.payment_status,
        'order_status', v_order.order_status,
        'items', v_order.items,
        'shipping_address', v_order.shipping_address
      );
    ELSE
      RAISE EXCEPTION 'Order % is already marked as paid under a different payment reference (%).', 
        p_order_id, v_order.razorpay_payment_id;
    END IF;
  END IF;

  -- 4. Atomic transition to paid & confirmed
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

REVOKE EXECUTE ON FUNCTION confirm_order_payment FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION confirm_order_payment FROM anon;
GRANT EXECUTE ON FUNCTION confirm_order_payment TO service_role;
