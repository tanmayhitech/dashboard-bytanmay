-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 06: RAZORPAY PAYMENT VERIFICATION & ATOMICITY
-- ==============================================================================

-- 1. Add paid_at timestamp to orders table if not present
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 2. Ensure indexes on Razorpay and status columns
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ------------------------------------------------------------------------------
-- 3. ATOMIC FUNCTION: record_razorpay_order_id
-- Safely associates Razorpay Order ID with a pending Loozars Order
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_razorpay_order_id(
  p_order_id UUID,
  p_razorpay_order_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Row-level lock on the order
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found.', p_order_id;
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RAISE EXCEPTION 'Cannot associate a new payment order with an already paid order.';
  END IF;

  IF v_order.order_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot create payment for a cancelled order.';
  END IF;

  UPDATE orders
  SET razorpay_order_id = trim(p_razorpay_order_id),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'razorpay_order_id', trim(p_razorpay_order_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION record_razorpay_order_id FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION record_razorpay_order_id FROM anon;
GRANT EXECUTE ON FUNCTION record_razorpay_order_id TO service_role;

-- ------------------------------------------------------------------------------
-- 4. ATOMIC FUNCTION: confirm_order_payment
-- Server-authoritative payment verification transition:
-- Atomically updates payment_status to 'paid' and order_status to 'confirmed'
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

  -- 2. Idempotent check: if already confirmed with matching payment id, return success
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

  -- 3. Atomic transition to paid & confirmed
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
