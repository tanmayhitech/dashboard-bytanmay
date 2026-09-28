-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 02: ROW LEVEL SECURITY & POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable Row Level Security (RLS) on all tables
-- ------------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Helper function to identify administrators securely
-- Checks JWT claims: role = 'service_role' OR role = 'admin' OR app_metadata.is_admin = true
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
    coalesce(auth.jwt() ->> 'role', '') = 'admin' OR
    coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. PRODUCTS POLICIES
-- Public: Read active products
-- Admin: Full access
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------------------------
-- 4. PRODUCT VARIANTS POLICIES
-- Public: Read active variants
-- Admin: Full access
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view active product variants"
  ON product_variants FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can insert product variants"
  ON product_variants FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update product variants"
  ON product_variants FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete product variants"
  ON product_variants FOR DELETE
  USING (is_admin());

-- ------------------------------------------------------------------------------
-- 5. COUPONS POLICIES
-- Public: Zero direct table access (Validation via secure RPC only)
-- Admin: Full access
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ------------------------------------------------------------------------------
-- 6. ORDERS POLICIES
-- Customers: Can select their order only if authenticated or matching email
-- Service Role & Admin: Full access
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins and service role have full access to orders"
  ON orders FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Customers can read their own order by email and id"
  ON orders FOR SELECT
  USING (
    customer_email = coalesce(auth.jwt() ->> 'email', '') OR
    is_admin()
  );

-- ------------------------------------------------------------------------------
-- 7. INVENTORY LOGS POLICIES
-- Admin & Service Role only
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins and service role have full access to inventory logs"
  ON inventory_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
