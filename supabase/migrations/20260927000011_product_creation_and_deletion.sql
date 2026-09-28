-- ==============================================================================
-- LOOZARS® — DATABASE SCHEMA MIGRATION 11: PRODUCT CREATION & DELETION RPCs
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STORAGE BUCKET POLICIES FOR 'product-images'
-- Allows public reading of product images and authenticated admins to upload/manage
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Create Storage Policies
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin())
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

-- ------------------------------------------------------------------------------
-- 2. CREATE PRODUCT RPC: create_product_admin
-- Creates product and its variants atomically with audit trail
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_product_admin(
  p_name TEXT,
  p_slug TEXT,
  p_sku TEXT,
  p_base_price INTEGER,
  p_sale_price INTEGER DEFAULT NULL,
  p_drop TEXT DEFAULT 'DROP 01 // RACING DIVISION',
  p_category TEXT DEFAULT 'tees',
  p_tags TEXT[] DEFAULT ARRAY['tees', 'oversized', 'racing'],
  p_badge TEXT DEFAULT 'DROP 01 // 2026',
  p_headline TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_details TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_fit TEXT DEFAULT 'Boxy oversized silhouette with dropped shoulders',
  p_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_measurements JSONB DEFAULT '{}'::jsonb,
  p_is_featured BOOLEAN DEFAULT false,
  p_is_active BOOLEAN DEFAULT true,
  p_variants JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARe
  v_product_id UUID;
  v_clean_name TEXT;
  v_clean_slug TEXT;
  v_clean_sku TEXT;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_sku TEXT;
  v_size TEXT;
  v_stock INT;
  v_created_product RECORD;
  v_created_variants JSONB := '[]'::jsonb;
BEGIN
  -- 1. Verify admin privilege
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  v_clean_name := trim(p_name);
  v_clean_slug := lower(trim(p_slug));
  v_clean_sku := upper(trim(p_sku));

  IF v_clean_name IS NULL OR v_clean_name = '' THEN
    RAISE EXCEPTION 'Product name is required.';
  END IF;

  IF v_clean_slug IS NULL OR v_clean_slug = '' THEN
    v_clean_slug := lower(regexp_replace(v_clean_name, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;

  IF v_clean_sku IS NULL OR v_clean_sku = '' THEN
    RAISE EXCEPTION 'Product SKU is required.';
  END IF;

  IF p_base_price < 0 THEN
    RAISE EXCEPTION 'Base price cannot be negative.';
  END IF;

  -- 2. Insert product row
  v_product_id := gen_random_uuid();

  INSERT INTO products (
    id,
    sku,
    name,
    slug,
    subtitle,
    base_price,
    sale_price,
    "drop",
    category,
    tags,
    badge,
    headline,
    description,
    details,
    fit,
    images,
    measurements,
    is_featured,
    is_active,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_product_id,
    v_clean_sku,
    v_clean_name,
    v_clean_slug,
    coalesce(p_headline, v_clean_name),
    p_base_price,
    p_sale_price,
    coalesce(p_drop, 'DROP 01 // RACING DIVISION'),
    coalesce(p_category, 'tees'),
    coalesce(p_tags, ARRAY['tees', 'oversized']),
    coalesce(p_badge, 'DROP 01 // 2026'),
    p_headline,
    p_description,
    p_details,
    coalesce(p_fit, 'Boxy oversized silhouette'),
    coalesce(p_images, ARRAY[]::TEXT[]),
    coalesce(p_measurements, '{}'::jsonb),
    coalesce(p_is_featured, false),
    coalesce(p_is_active, true),
    (SELECT coalesce(max(sort_order), 0) + 1 FROM products),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  RETURNING * INTO v_created_product;

  -- 3. Create variants
  IF p_variants IS NOT NULL AND jsonb_array_length(p_variants) > 0 THEN
    FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
    LOOP
      v_size := trim(upper(v_variant ->> 'size'));
      v_stock := coalesce((v_variant ->> 'stock_quantity')::INT, (v_variant ->> 'stockQuantity')::INT, 0);
      v_variant_sku := coalesce(v_variant ->> 'sku', v_clean_sku || '-' || v_size);
      v_variant_id := gen_random_uuid();

      IF v_size IS NOT NULL AND v_size != '' THEN
        INSERT INTO product_variants (
          id,
          product_id,
          sku,
          size,
          stock_quantity,
          reserved_quantity,
          price_override,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          v_variant_id,
          v_product_id,
          v_variant_sku,
          v_size,
          v_stock,
          0,
          NULL,
          true,
          timezone('utc'::text, now()),
          timezone('utc'::text, now())
        );

        -- Audit log entry for initial stock
        IF v_stock > 0 THEN
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
            v_variant_id,
            'initial_stock',
            v_stock,
            0,
            v_stock,
            'Initial stock for new product ' || v_clean_sku,
            auth.uid(),
            timezone('utc'::text, now())
          );
        END IF;

        v_created_variants := v_created_variants || jsonb_build_array(jsonb_build_object(
          'id', v_variant_id,
          'size', v_size,
          'sku', v_variant_sku,
          'stock_quantity', v_stock
        ));
      END IF;
    END LOOP;
  ELSE
    -- Default 6 sizes: XS, S, M, L, XL, XXL with default stock
    FOREACH v_size IN ARRAY ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL']
    LOOP
      v_variant_id := gen_random_uuid();
      v_variant_sku := v_clean_sku || '-' || v_size;
      v_stock := 10;

      INSERT INTO product_variants (
        id,
        product_id,
        sku,
        size,
        stock_quantity,
        reserved_quantity,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        v_variant_id,
        v_product_id,
        v_variant_sku,
        v_size,
        v_stock,
        0,
        true,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
      );

      v_created_variants := v_created_variants || jsonb_build_array(jsonb_build_object(
        'id', v_variant_id,
        'size', v_size,
        'sku', v_variant_sku,
        'stock_quantity', v_stock
      ));
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product', jsonb_build_object(
      'id', v_created_product.id,
      'name', v_created_product.name,
      'slug', v_created_product.slug,
      'sku', v_created_product.sku,
      'base_price', v_created_product.base_price,
      'sale_price', v_created_product.sale_price,
      'category', v_created_product.category,
      'drop', v_created_product.drop,
      'images', v_created_product.images,
      'is_active', v_created_product.is_active,
      'is_featured', v_created_product.is_featured,
      'variants', v_created_variants
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_product_admin TO authenticated;
GRANT EXECUTE ON FUNCTION create_product_admin TO service_role;

-- ------------------------------------------------------------------------------
-- 3. DELETE PRODUCT RPC: delete_product_admin
-- Permanently deletes product and all its variants and associated inventory logs
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_product_admin(
  p_product_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
  v_variant_count INT;
BEGIN
  -- 1. Admin security check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrative privileges required.';
  END IF;

  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found.', p_product_id;
  END IF;

  -- 2. Delete inventory logs for this product's variants
  DELETE FROM inventory_logs
  WHERE variant_id IN (
    SELECT id FROM product_variants WHERE product_id = p_product_id
  );

  -- 3. Delete product variants
  DELETE FROM product_variants
  WHERE product_id = p_product_id;

  GET DIAGNOSTICS v_variant_count = ROW_COUNT;

  -- 4. Delete product
  DELETE FROM products
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_product_id', p_product_id,
    'deleted_sku', v_product.sku,
    'deleted_name', v_product.name,
    'deleted_variants_count', v_variant_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_product_admin TO authenticated;
GRANT EXECUTE ON FUNCTION delete_product_admin TO service_role;
