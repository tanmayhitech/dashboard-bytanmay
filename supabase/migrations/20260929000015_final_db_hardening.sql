-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 15: FINAL DATABASE HARDENING
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. COMPOSITE ORDER INDEX
-- Optimizes Admin Portal queries for order history sorting + multi-status filtering
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_created_status
ON orders(created_at DESC, order_status, payment_status);

-- ------------------------------------------------------------------------------
-- 2. COUPON USAGE LIMIT CONSTRAINT
-- Guarantees atomic prevention of coupon over-redemption at the PostgreSQL engine level
-- ------------------------------------------------------------------------------
ALTER TABLE coupons
DROP CONSTRAINT IF EXISTS check_coupon_usage_limit;

ALTER TABLE coupons
ADD CONSTRAINT check_coupon_usage_limit
CHECK (usage_limit IS NULL OR times_used <= usage_limit);
