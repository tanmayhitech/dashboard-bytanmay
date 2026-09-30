-- ==============================================================================
-- LOOZARS® — ADMIN FEATURE EXTENSIONS (MIGRATION 17)
-- 1. Returns & Refunds Table and RPCs
-- 2. Abandoned Carts Table and RPCs
-- 3. Product Reviews & Moderation Table and RPCs
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ORDER RETURNS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  return_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'item_received', 'refunded', 'cancelled')),
  refund_amount INTEGER NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  refund_status TEXT NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'processed', 'failed')),
  refund_transaction_id TEXT,
  restock_inventory BOOLEAN NOT NULL DEFAULT true,
  inventory_restocked_at TIMESTAMPTZ,
  admin_notes TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_returns_order_id ON order_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_order_number ON order_returns(order_number);
CREATE INDEX IF NOT EXISTS idx_order_returns_status ON order_returns(status);
CREATE INDEX IF NOT EXISTS idx_order_returns_customer_email ON order_returns(customer_email);
CREATE INDEX IF NOT EXISTS idx_order_returns_created_at ON order_returns(created_at DESC);

DROP TRIGGER IF EXISTS trigger_order_returns_updated_at ON order_returns;
CREATE TRIGGER trigger_order_returns_updated_at
  BEFORE UPDATE ON order_returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Order Returns
ALTER TABLE order_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to order returns" ON order_returns;
CREATE POLICY "Admins have full access to order returns" ON order_returns
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Customers can view their own return requests" ON order_returns;
CREATE POLICY "Customers can view their own return requests" ON order_returns
  FOR SELECT USING (customer_email = coalesce(auth.jwt() ->> 'email', '') OR is_admin());

-- ------------------------------------------------------------------------------
-- 2. ABANDONED CARTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_value INTEGER NOT NULL DEFAULT 0 CHECK (cart_value >= 0),
  item_count INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  recovery_status TEXT NOT NULL DEFAULT 'abandoned' CHECK (recovery_status IN ('abandoned', 'contacted', 'recovered', 'expired')),
  recovered_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  recovery_notes TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(customer_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session_id ON abandoned_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(recovery_status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_last_activity ON abandoned_carts(last_activity_at DESC);

DROP TRIGGER IF EXISTS trigger_abandoned_carts_updated_at ON abandoned_carts;
CREATE TRIGGER trigger_abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Abandoned Carts
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to abandoned carts" ON abandoned_carts;
CREATE POLICY "Admins have full access to abandoned carts" ON abandoned_carts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public can create and update own cart session" ON abandoned_carts;
CREATE POLICY "Public can create and update own cart session" ON abandoned_carts
  FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. PRODUCT REVIEWS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_text TEXT NOT NULL,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden', 'flagged')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);

DROP TRIGGER IF EXISTS trigger_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER trigger_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Product Reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON product_reviews;
CREATE POLICY "Public can view approved reviews" ON product_reviews
  FOR SELECT USING (status = 'approved' OR is_admin());

DROP POLICY IF EXISTS "Admins have full access to product reviews" ON product_reviews;
CREATE POLICY "Admins have full access to product reviews" ON product_reviews
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Authenticated and public customers can submit reviews" ON product_reviews;
CREATE POLICY "Authenticated and public customers can submit reviews" ON product_reviews
  FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. RPCS FOR RETURNS, REFUNDS, REVIEWS, AND ABANDONED CARTS
-- ------------------------------------------------------------------------------

-- (A) PROCESS RETURN STATUS & RESTOCKING
CREATE OR REPLACE FUNCTION process_order_return_status(
  p_return_id UUID,
  p_new_status TEXT,
  p_admin_notes TEXT DEFAULT NULL,
  p_restock BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
  v_return RECORD;
  v_order RECORD;
  v_item JSONB;
  v_variant_id UUID;
  v_qty INT;
  v_variant RECORD;
  v_restocked_count INT := 0;
  v_clean_status TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  v_clean_status := lower(trim(p_new_status));

  SELECT * INTO v_return
  FROM order_returns
  WHERE id = p_return_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return request % not found.', p_return_id;
  END IF;

  SELECT * INTO v_order
  FROM orders
  WHERE id = v_return.order_id;

  -- If status transitioned to item_received or refunded and restock is requested and not yet restocked
  IF (v_clean_status IN ('item_received', 'refunded')) AND p_restock AND v_return.inventory_restocked_at IS NULL THEN
    FOR v_item IN SELECT value FROM jsonb_array_elements(v_return.items) LOOP
      v_variant_id := (v_item ->> 'variant_id')::UUID;
      v_qty := coalesce((v_item ->> 'quantity')::INT, 1);

      IF v_variant_id IS NOT NULL AND v_qty > 0 THEN
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
            v_return.order_id,
            'restock',
            v_qty,
            v_variant.stock_quantity,
            v_variant.stock_quantity + v_qty,
            'Return restock: ' || v_return.order_number,
            auth.uid(),
            timezone('utc'::text, now())
          );

          v_restocked_count := v_restocked_count + 1;
        END IF;
      END IF;
    END LOOP;

    UPDATE order_returns
    SET inventory_restocked_at = timezone('utc'::text, now())
    WHERE id = p_return_id;
  END IF;

  UPDATE order_returns
  SET status = v_clean_status,
      admin_notes = coalesce(p_admin_notes, admin_notes),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_return_id;

  RETURN jsonb_build_object(
    'success', true,
    'return_id', p_return_id,
    'new_status', v_clean_status,
    'restocked_variants_count', v_restocked_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION process_order_return_status TO authenticated;
GRANT EXECUTE ON FUNCTION process_order_return_status TO service_role;

-- (B) RECORD COMPLETED REFUND
CREATE OR REPLACE FUNCTION record_order_refund(
  p_return_id UUID,
  p_refund_transaction_id TEXT,
  p_refund_amount INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_return RECORD;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  SELECT * INTO v_return
  FROM order_returns
  WHERE id = p_return_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return request % not found.', p_return_id;
  END IF;

  UPDATE order_returns
  SET status = 'refunded',
      refund_status = 'processed',
      refund_transaction_id = coalesce(p_refund_transaction_id, refund_transaction_id),
      refund_amount = coalesce(p_refund_amount, refund_amount),
      admin_notes = coalesce(p_notes, admin_notes),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_return_id;

  -- Also update the main order payment status to refunded if full or partial
  UPDATE orders
  SET payment_status = 'refunded',
      updated_at = timezone('utc'::text, now())
  WHERE id = v_return.order_id;

  RETURN jsonb_build_object(
    'success', true,
    'return_id', p_return_id,
    'refund_status', 'processed',
    'refund_transaction_id', p_refund_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_order_refund TO authenticated;
GRANT EXECUTE ON FUNCTION record_order_refund TO service_role;

-- (C) MODERATE PRODUCT REVIEW
CREATE OR REPLACE FUNCTION moderate_product_review(
  p_review_id UUID,
  p_status TEXT,
  p_admin_reply TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  UPDATE product_reviews
  SET status = lower(trim(p_status)),
      admin_reply = coalesce(p_admin_reply, admin_reply),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_review_id;

  RETURN jsonb_build_object(
    'success', true,
    'review_id', p_review_id,
    'status', lower(trim(p_status))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION moderate_product_review TO authenticated;
GRANT EXECUTE ON FUNCTION moderate_product_review TO service_role;
