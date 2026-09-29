-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 16: ACTIVE ORDERS METRICS FILTER
-- Ensures get_admin_dashboard_metrics strictly counts non-archived orders
-- ==============================================================================

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
  FROM orders
  WHERE notes IS NULL OR notes NOT ILIKE '%[ARCHIVED]%';

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
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO service_role;
