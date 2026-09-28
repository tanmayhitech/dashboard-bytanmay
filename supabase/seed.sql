-- ==============================================================================
-- LOOZARS® — SEED DATA: DROP 01 RACING DIVISION CATALOG & PROMO CODES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP 01 PRODUCTS
-- ------------------------------------------------------------------------------
INSERT INTO products (
  id, slug, sku, name, subtitle, headline, description, category, collection, "drop", badge, fit, details, measurements, base_price, weight_grams, is_active, is_featured, sort_order
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  'lzr-velo-07',
  'LZR-D01-01',
  'LZR VELO 07',
  'Black Racing Tee',
  'FOUR TEES. ONE RACING LANGUAGE.',
  'A black racing-inspired tee featuring bold LZR branding, red and white racing stripes, technical graphics, and motorsport-inspired detailing. Built with an aggressive, fast-paced visual language that gives the piece the feel of a racing uniform reworked for the streets.',
  'tees',
  'DROP 01',
  'DROP 01 — RACING DIVISION',
  'DROP 01 / PIECE 01',
  'Signature boxy oversized fit. Dropped shoulders with relaxed drape.',
  '[
    "320 GSM 100% Combed Heavyweight Cotton",
    "Bold LZR motorsport racing uniform screenprint",
    "Red & white technical racing stripes and track details",
    "Woven inner collar label with red metallic embroidery",
    "Pre-shrunk enzyme mineral wash treatment",
    "By The Rare. For The Rare."
  ]'::jsonb,
  '{
    "XS": { "chest": "42\"", "length": "28\"", "shoulder": "20\"" },
    "S":  { "chest": "44\"", "length": "29\"", "shoulder": "21\"" },
    "M":  { "chest": "46\"", "length": "30\"", "shoulder": "22\"" },
    "L":  { "chest": "48\"", "length": "31\"", "shoulder": "23\"" },
    "XL": { "chest": "50\"", "length": "32\"", "shoulder": "24\"" },
    "XXL":{ "chest": "52\"", "length": "33\"", "shoulder": "25\"" }
  }'::jsonb,
  899,
  350,
  true,
  true,
  1
),
(
  '00000000-0000-0000-0000-000000000002',
  'lzr-racing-division',
  'LZR-D01-02',
  'LZR RACING DIVISION',
  'Burgundy Racing Tee',
  'DARKER, MORE AGGRESSIVE MOTORSPORT AESTHETIC.',
  'A deep burgundy racing tee built around the LZR identity, with oversized central branding, technical linework, halftone graphics, racing typography, and red-and-white detailing. A darker, more aggressive interpretation of the Loozars racing aesthetic.',
  'tees',
  'DROP 01',
  'DROP 01 — RACING DIVISION',
  'DROP 01 / PIECE 02',
  'Heavy drop-shoulder boxy fit.',
  '[
    "320 GSM Heavy French Terry Compact Cotton",
    "Deep Burgundy mineral-wash finish",
    "Oversized central LZR emblem with technical linework",
    "Halftone racing graphics and red-and-white accents",
    "Reinforced crewneck and reverse exposed stitching",
    "By The Rare. For The Rare."
  ]'::jsonb,
  '{
    "S":  { "chest": "44\"", "length": "29\"", "shoulder": "21\"" },
    "M":  { "chest": "46\"", "length": "30\"", "shoulder": "22\"" },
    "L":  { "chest": "48\"", "length": "31\"", "shoulder": "23\"" },
    "XL": { "chest": "50\"", "length": "32\"", "shoulder": "24\"" },
    "XXL":{ "chest": "52\"", "length": "33\"", "shoulder": "25\"" }
  }'::jsonb,
  899,
  350,
  true,
  false,
  2
),
(
  '00000000-0000-0000-0000-000000000003',
  'lzr-apex-club',
  'LZR-D01-03',
  'LZR APEX CLUB',
  'Off-White Racing Tee',
  'DRIVER NUMBER 88 — PRO JERSEY SILHOUETTE.',
  'An off-white racing tee dominated by the LZR logo and 88 driver number. Inspired by professional driver jerseys, it combines bold numerical graphics, technical typography, black side detailing, and racing stripes for a clean motorsport silhouette.',
  'tees',
  'DROP 01',
  'DROP 01 — RACING DIVISION',
  'DROP 01 / PIECE 03',
  'Relaxed motorsport jersey drape.',
  '[
    "320 GSM Premium Off-White Heavy Cotton",
    "Oversized 88 driver number & LZR typography",
    "Black side-panel detailing & racing stripes",
    "Inspired by professional driver track jerseys",
    "Twin-needle reinforced construction",
    "By The Rare. For The Rare."
  ]'::jsonb,
  '{
    "XS": { "chest": "42\"", "length": "28\"", "shoulder": "20\"" },
    "S":  { "chest": "44\"", "length": "29\"", "shoulder": "21\"" },
    "M":  { "chest": "46\"", "length": "30\"", "shoulder": "22\"" },
    "L":  { "chest": "48\"", "length": "31\"", "shoulder": "23\"" },
    "XL": { "chest": "50\"", "length": "32\"", "shoulder": "24\"" }
  }'::jsonb,
  899,
  350,
  true,
  false,
  3
),
(
  '00000000-0000-0000-0000-000000000004',
  'lzr-ocean-speedway',
  'LZR-D01-04',
  'LZR OCEAN SPEEDWAY',
  'Navy Racing Tee',
  'COASTAL CULTURE MEETS HIGH-VELOCITY SPEED.',
  'A deep navy racing tee inspired by the intersection of coastal culture and speed. Featuring large LOOZARS branding, technical racing graphics, white stripe detailing, and layered typography, it brings a slightly more relaxed coastal character to the Drop 01 racing aesthetic.',
  'tees',
  'DROP 01',
  'DROP 01 — RACING DIVISION',
  'DROP 01 / PIECE 04',
  'Wide boxy streetwear fit.',
  '[
    "320 GSM Heavyweight Deep Navy Cotton",
    "Large LOOZARS technical speedway branding",
    "High-contrast white stripe detailing",
    "Layered coastal motorsport typography",
    "Pre-shrunk vintage wash finish",
    "By The Rare. For The Rare."
  ]'::jsonb,
  '{
    "S":  { "chest": "44\"", "length": "29\"", "shoulder": "21\"" },
    "M":  { "chest": "46\"", "length": "30\"", "shoulder": "22\"" },
    "L":  { "chest": "48\"", "length": "31\"", "shoulder: "23\"" },
    "XL": { "chest": "50\"", "length": "32\"", "shoulder": "24\"" },
    "XXL":{ "chest": "52\"", "length": "33\"", "shoulder": "25\"" }
  }'::jsonb,
  899,
  350,
  true,
  false,
  4
)
ON CONFLICT (slug) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  details = EXCLUDED.details,
  measurements = EXCLUDED.measurements,
  updated_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 2. DROP 01 PRODUCT VARIANTS & INITIAL STOCK
-- ------------------------------------------------------------------------------
INSERT INTO product_variants (product_id, size, sku, stock_quantity) VALUES
-- LZR VELO 07 (Black)
('00000000-0000-0000-0000-000000000001', 'XS', 'LZR-D01-01-XS', 4),
('00000000-0000-0000-0000-000000000001', 'S',  'LZR-D01-01-S',  8),
('00000000-0000-0000-0000-000000000001', 'M',  'LZR-D01-01-M',  15),
('00000000-0000-0000-0000-000000000001', 'L',  'LZR-D01-01-L',  20),
('00000000-0000-0000-0000-000000000001', 'XL', 'LZR-D01-01-XL', 8),
('00000000-0000-0000-0000-000000000001', 'XXL','LZR-D01-01-XXL',3),

-- LZR RACING DIVISION (Burgundy)
('00000000-0000-0000-0000-000000000002', 'S',  'LZR-D01-02-S',  5),
('00000000-0000-0000-0000-000000000002', 'M',  'LZR-D01-02-M',  11),
('00000000-0000-0000-0000-000000000002', 'L',  'LZR-D01-02-L',  14),
('00000000-0000-0000-0000-000000000002', 'XL', 'LZR-D01-02-XL', 6),
('00000000-0000-0000-0000-000000000002', 'XXL','LZR-D01-02-XXL',2),

-- LZR APEX CLUB (Off-White)
('00000000-0000-0000-0000-000000000003', 'XS', 'LZR-D01-03-XS', 3),
('00000000-0000-0000-0000-000000000003', 'S',  'LZR-D01-03-S',  7),
('00000000-0000-0000-0000-000000000003', 'M',  'LZR-D01-03-M',  12),
('00000000-0000-0000-0000-000000000003', 'L',  'LZR-D01-03-L',  10),
('00000000-0000-0000-0000-000000000003', 'XL', 'LZR-D01-03-XL', 4),

-- LZR OCEAN SPEEDWAY (Navy)
('00000000-0000-0000-0000-000000000004', 'S',  'LZR-D01-04-S',  5),
('00000000-0000-0000-0000-000000000004', 'M',  'LZR-D01-04-M',  12),
('00000000-0000-0000-0000-000000000004', 'L',  'LZR-D01-04-L',  16),
('00000000-0000-0000-0000-000000000004', 'XL', 'LZR-D01-04-XL', 7),
('00000000-0000-0000-0000-000000000004', 'XXL','LZR-D01-04-XXL',3)
ON CONFLICT (sku) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. PROMO CODES
-- ------------------------------------------------------------------------------
INSERT INTO coupons (code, description, discount_type, discount_value, max_discount_amount, min_order_amount, is_active) VALUES
('DROP01', '10% Archive Launch Discount', 'percentage', 10.00, 500, 0, true),
('LOOZAR10', '10% Community Member Discount', 'percentage', 10.00, 500, 0, true)
ON CONFLICT (code) DO NOTHING;
