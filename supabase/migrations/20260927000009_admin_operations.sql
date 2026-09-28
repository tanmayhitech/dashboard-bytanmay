-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 09: ADMIN OPERATIONS & INVENTORY RPCs
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ATOMIC STOCK ADJUSTMENT RPC: adjust_variant_stock
-- Allows authenticated admins to adjust stock quantity with atomic non-negative bounds
-- and automated audit trail logging in inventory_logs.
-- ------------------------------------------------------------------------------
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
  -- 1. Verify caller has admin privileges
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  v_admin_id := auth.uid();

  -- 2. Lock target variant row for update
  SELECT * INTO v_variant
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product variant % not found.', p_variant_id;
  END IF;

  -- 3. Calculate and validate new stock quantity (Strict non-negative constraint)
  v_new_stock := v_variant.stock_quantity + p_quantity_delta;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock adjustment rejected: stock cannot be negative. Current stock: %, Adjustment delta: %, Resulting stock: %',
      v_variant.stock_quantity, p_quantity_delta, v_new_stock;
  END IF;

  -- 4. Determine audit change type
  IF p_quantity_delta >= 0 THEN
    v_change_type := 'restock';
  ELSE
    v_change_type := 'manual_adjustment';
  END IF;

  -- 5. Fetch product info for logging clarity
  SELECT name, slug INTO v_product
  FROM products
  WHERE id = v_variant.product_id;

  -- 6. Update variant stock
  UPDATE product_variants
  SET stock_quantity = v_new_stock,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_variant_id;

  -- 7. Write immutable audit record to inventory_logs
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

  -- 8. Return structured operation result
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

-- ------------------------------------------------------------------------------
-- 2. VALIDATED ORDER STATUS TRANSITION RPC: update_order_status
-- Enforces the business state machine for order progression:
-- pending -> confirmed -> processing -> shipped -> delivered
-- Handles cancellation with automatic stock restoration if applicable.
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
  -- 1. Admin security check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  v_clean_status := lower(trim(p_new_status));

  -- 2. Validate requested status against allowed domain
  IF v_clean_status NOT IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status "%". Must be one of: pending, confirmed, processing, shipped, delivered, cancelled.', p_new_status;
  END IF;

  -- 3. Lock order for update
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found.', p_order_id;
  END IF;

  -- 4. Check status transition validity
  IF v_order.order_status = v_clean_status THEN
    -- Status unchanged; allowing metadata updates (notes, tracking info)
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

  -- State machine transition rules
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

  -- 5. Cancellation logic with automated inventory restoration
  IF v_clean_status = 'cancelled' THEN
    -- If order was in pending, confirmed, or processing, stock was deducted and needs restoring
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

  -- 6. Apply status transition and update metadata
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

-- ------------------------------------------------------------------------------
-- 3. ADMIN DASHBOARD METRICS RPC: get_admin_dashboard_metrics
-- Aggregates orders, revenue, and inventory statuses securely for admin view.
-- ------------------------------------------------------------------------------
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

  -- 1. Orders aggregation
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

  -- 2. Products aggregation
  SELECT
    count(*),
    count(*) FILTER (WHERE is_active = true)
  INTO
    v_total_products,
    v_active_products
  FROM products;

  -- 3. Variants & Stock aggregation
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

-- ------------------------------------------------------------------------------
-- 4. ADMIN PRODUCT UPDATE RPC: update_product_admin
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 5. ADMIN COUPON MANAGEMENT RPC: manage_coupon
-- ------------------------------------------------------------------------------
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
    -- Update existing coupon
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
    -- Insert new coupon
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
