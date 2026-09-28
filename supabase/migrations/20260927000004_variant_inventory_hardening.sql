-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 04: VARIANT INVENTORY HARDENING & PERMISSIONS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HARDEN ATOMIC INVENTORY DEDUCTION FUNCTION
-- Verifies variant is active, locks row with FOR UPDATE, prevents overselling,
-- and restricts execution rights to service_role to prevent unauthorized client RPC calls.
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
  v_reserved_stock INT;
  v_new_stock INT;
  v_is_active BOOLEAN;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Item payload cannot be empty for inventory reservation.';
  END IF;

  -- Iterate through items and lock corresponding variant rows in deterministic order to prevent deadlocks
  FOR v_item IN 
    SELECT value 
    FROM jsonb_array_elements(p_items) 
    ORDER BY (value ->> 'variant_id')::text ASC
  LOOP
    v_variant_id := (v_item ->> 'variant_id')::UUID;
    v_qty := (v_item ->> 'quantity')::INT;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid requested quantity % for variant %', v_qty, v_variant_id;
    END IF;

    -- Row-level lock on the variant
    SELECT stock_quantity, reserved_quantity, is_active 
    INTO v_current_stock, v_reserved_stock, v_is_active
    FROM product_variants
    WHERE id = v_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % not found in catalog', v_variant_id;
    END IF;

    IF NOT v_is_active THEN
      RAISE EXCEPTION 'Product variant % is discontinued or inactive', v_variant_id;
    END IF;

    IF (v_current_stock - coalesce(v_reserved_stock, 0)) < v_qty THEN
      RAISE EXCEPTION 'Insufficient available stock for variant %. Available: %, Requested: %', 
        v_variant_id, (v_current_stock - coalesce(v_reserved_stock, 0)), v_qty;
    END IF;

    v_new_stock := v_current_stock - v_qty;

    -- Update variant inventory
    UPDATE product_variants
    SET stock_quantity = v_new_stock,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_variant_id;

    -- Record deterministic audit log in inventory_logs
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
      'Order reservation: ' || coalesce(p_order_id::text, 'Direct RPC')
    );
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 2. RESTRICT RPC EXECUTION PRIVILEGES
-- Only service_role (backend edge functions / server environment) can invoke stock deduction.
-- Anonymous / public users are explicitly revoked to prevent client-side tampering.
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION reserve_and_deduct_inventory(UUID, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reserve_and_deduct_inventory(UUID, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION reserve_and_deduct_inventory(UUID, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION reserve_and_deduct_inventory(UUID, JSONB) TO service_role;
