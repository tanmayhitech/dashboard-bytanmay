-- ==============================================================================
-- E-COMMERCE ADMIN & CREATOR AFFILIATE OPERATING SYSTEM — SEED DEMO DATA
-- Author / Creator: Tanmay (ecommerce-admin-engine-by-tanmay)
-- Clean starter dataset for testing & verification
-- ==============================================================================

-- 1. SEED COUPONS
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, is_active)
VALUES 
  ('WELCOME10', '10% off on your first order', 'percentage', 10.00, 999, true),
  ('FLASH20', 'Flat ₹200 off on orders above ₹1999', 'fixed', 200.00, 1999, true)
ON CONFLICT (code) DO NOTHING;

-- 2. SEED CREATOR / INFLUENCER PARTNER
INSERT INTO influencers (
  id, name, instagram_handle, email, phone, collaboration_type,
  coupon_code, customer_discount_type, customer_discount_value,
  commission_type, commission_value, is_active, notes
) VALUES (
  'de2ec333-3a19-464a-8efa-922ec3819eed',
  'Yuuf Khan',
  'khan',
  'yushssbhd@gmail.com',
  '+919876543210',
  'barter',
  'KHAN10',
  'percentage',
  10.00,
  'percentage',
  8.00,
  true,
  'Demo creator partner for affiliate testing'
) ON CONFLICT (email) DO UPDATE 
SET coupon_code = 'KHAN10',
    commission_value = 8.00,
    is_active = true;

-- 3. SEED STARTER PRODUCTS & VARIANTS
DO $$
DECLARE
  v_p1_id UUID := '11111111-1111-1111-1111-111111111111';
  v_p2_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Product 1: Signature Oversized Tee
  INSERT INTO products (
    id, slug, sku, name, subtitle, headline, description,
    category, collection, "drop", badge, fit, base_price, sale_price,
    images, is_active, is_featured, sort_order
  ) VALUES (
    v_p1_id,
    'signature-oversized-tee',
    'LZR-TEE-001',
    'Signature Heavyweight Oversized Tee',
    '280 GSM French Terry / Acid Wash',
    'Premium Streetwear Drop 01',
    'Crafted from luxury heavyweight cotton with dropped shoulders and a boxy silhouette.',
    'tees',
    'DROP 01',
    'DROP 01 — STREETWEAR',
    'DROP 01 / PIECE 01',
    'Boxy oversized fit with dropped shoulders.',
    1499,
    1199,
    '["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop"]'::jsonb,
    true,
    true,
    1
  ) ON CONFLICT (slug) DO NOTHING;

  -- Variants for Product 1
  INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
  VALUES 
    (v_p1_id, 'S', 'LZR-TEE-001-S', 25, true),
    (v_p1_id, 'M', 'LZR-TEE-001-M', 40, true),
    (v_p1_id, 'L', 'LZR-TEE-001-L', 30, true),
    (v_p1_id, 'XL', 'LZR-TEE-001-XL', 15, true)
  ON CONFLICT (product_id, size) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity;

  -- Product 2: Relaxed Boxy Hoodie
  INSERT INTO products (
    id, slug, sku, name, subtitle, headline, description,
    category, collection, "drop", badge, fit, base_price, sale_price,
    images, is_active, is_featured, sort_order
  ) VALUES (
    v_p2_id,
    'relaxed-boxy-hoodie',
    'LZR-HD-001',
    'Relaxed Boxy French Terry Hoodie',
    '420 GSM Brushed Cotton',
    'Winter Capsule',
    'Heavyweight fleece with double-lined hood and minimal branding.',
    'hoodies',
    'DROP 01',
    'DROP 01 — STREETWEAR',
    'CORE CAPSULE',
    'Relaxed oversized fit.',
    2999,
    2499,
    '["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop"]'::jsonb,
    true,
    true,
    2
  ) ON CONFLICT (slug) DO NOTHING;

  -- Variants for Product 2
  INSERT INTO product_variants (product_id, size, sku, stock_quantity, is_active)
  VALUES 
    (v_p2_id, 'S', 'LZR-HD-001-S', 15, true),
    (v_p2_id, 'M', 'LZR-HD-001-M', 25, true),
    (v_p2_id, 'L', 'LZR-HD-001-L', 20, true),
    (v_p2_id, 'XL', 'LZR-HD-001-XL', 10, true)
  ON CONFLICT (product_id, size) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity;
END $$;

-- 4. SEED SAMPLE TEST ORDERS
DO $$
DECLARE
  v_inf_id UUID := 'de2ec333-3a19-464a-8efa-922ec3819eed';
  v_o1_id UUID := '33333333-3333-3333-3333-333333333333';
  v_o2_id UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
  -- Order 1: COD Order with Creator Code KHAN10
  INSERT INTO orders (
    id, order_number, customer_name, customer_email, customer_phone,
    shipping_address, items, subtotal_amount, discount_amount,
    shipping_fee, total_amount, coupon_code, influencer_id,
    influencer_commission_amount, payment_method, payment_status,
    order_status, courier_name, tracking_number
  ) VALUES (
    v_o1_id,
    '#ORD-20260928-1001',
    'Arjun Verma',
    'arjun.verma@example.com',
    '+919811223344',
    '{
      "name": "Arjun Verma",
      "address_line1": "Flat 402, Skyline Residency, Indiranagar",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postal_code": "560038",
      "phone": "+919811223344"
    }'::jsonb,
    '[
      {
        "name": "Signature Heavyweight Oversized Tee",
        "size": "M",
        "sku": "LZR-TEE-001-M",
        "quantity": 1,
        "unit_price": 1199,
        "total_price": 1199
      }
    ]'::jsonb,
    1199,
    120,
    99,
    1178,
    'KHAN10',
    v_inf_id,
    86,
    'cod',
    'pending',
    'confirmed',
    'BlueDart',
    'BD-94827510'
  ) ON CONFLICT (order_number) DO NOTHING;

  -- Commission for Order 1
  INSERT INTO influencer_commissions (
    influencer_id, order_id, order_number, order_amount,
    commission_rate_applied, commission_amount, status
  ) VALUES (
    v_inf_id, v_o1_id, '#ORD-20260928-1001', 1178,
    8.00, 86, 'pending'
  ) ON CONFLICT (order_id, influencer_id) DO NOTHING;

  -- Order 2: Prepaid Online Order
  INSERT INTO orders (
    id, order_number, customer_name, customer_email, customer_phone,
    shipping_address, items, subtotal_amount, discount_amount,
    shipping_fee, total_amount, coupon_code,
    payment_method, payment_status, order_status,
    razorpay_payment_id, courier_name, tracking_number
  ) VALUES (
    v_o2_id,
    '#ORD-20260928-1002',
    'Sneha Kapoor',
    'sneha.kapoor@example.com',
    '+919822334455',
    '{
      "name": "Sneha Kapoor",
      "address_line1": "B-12, Park Street, Near South City",
      "city": "Kolkata",
      "state": "West Bengal",
      "postal_code": "700016",
      "phone": "+919822334455"
    }'::jsonb,
    '[
      {
        "name": "Relaxed Boxy French Terry Hoodie",
        "size": "L",
        "sku": "LZR-HD-001-L",
        "quantity": 1,
        "unit_price": 2499,
        "total_price": 2499
      }
    ]'::jsonb,
    2499,
    0,
    0,
    2499,
    NULL,
    'upi',
    'paid',
    'processing',
    'pay_demo_99214710',
    'Delhivery',
    'DLH-88219472'
  ) ON CONFLICT (order_number) DO NOTHING;
END $$;
