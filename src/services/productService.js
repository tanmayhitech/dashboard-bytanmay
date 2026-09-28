import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products.js';

// Local high-res photoshoot asset mapping indexed by slug
const LOCAL_IMAGE_REGISTRY = STATIC_PRODUCTS.reduce((acc, p) => {
  acc[p.id] = {
    images: p.images,
    detailThumbnails: p.detailThumbnails,
    subtitle: p.subtitle,
    badge: p.badge,
    headline: p.headline,
    fit: p.fit,
    details: p.details,
    measurements: p.measurements,
    category: p.category,
    tags: p.tags,
    drop: p.drop
  };
  return acc;
}, {});

/**
 * Builds canonical variant array for fallback/static products
 */
export const buildFallbackVariants = (product) => {
  const sizes = product.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const stockMap = product.stock || {};
  return sizes.map(size => {
    const qty = stockMap[size] !== undefined ? stockMap[size] : 8;
    return {
      id: `var-${product.id}-${size}`,
      productId: product.db_id || product.id,
      product_id: product.db_id || product.id,
      productSlug: product.id,
      size: size,
      sku: `${product.sku}-${size}`,
      stock_quantity: qty,
      stockQuantity: qty,
      reserved_quantity: 0,
      reservedQuantity: 0,
      availableStock: qty,
      priceOverride: null,
      isActive: true,
      is_active: true
    };
  });
};

/**
 * Transforms a Supabase product row + variants into the canonical frontend model
 */
export const transformDatabaseProduct = (row) => {
  const fallbackMeta = LOCAL_IMAGE_REGISTRY[row.slug] || {};
  const localAssets = {
    images: row.images && Array.isArray(row.images) && row.images.length > 0 
      ? row.images 
      : fallbackMeta.images || [],
    detailThumbnails: fallbackMeta.detailThumbnails || []
  };

  // Extract variants if joined
  const rawVariants = row.product_variants || [];
  const variants = rawVariants.length > 0
    ? rawVariants.map(v => {
        const stockQty = v.stock_quantity ?? 0;
        const reservedQty = v.reserved_quantity ?? 0;
        const availStock = Math.max(0, stockQty - reservedQty);
        return {
          id: v.id,
          productId: row.id,
          product_id: row.id,
          productSlug: row.slug,
          size: v.size,
          sku: v.sku,
          stock_quantity: stockQty,
          stockQuantity: stockQty,
          reserved_quantity: reservedQty,
          reservedQuantity: reservedQty,
          availableStock: availStock,
          priceOverride: v.price_override,
          isActive: v.is_active !== false,
          is_active: v.is_active !== false
        };
      })
    : buildFallbackVariants({ id: row.slug, db_id: row.id, sku: row.sku, sizes: row.sizes, stock: row.stock });

  const sizes = variants.map(v => v.size);
  const stock = variants.reduce((acc, v) => {
    acc[v.size] = v.availableStock;
    return acc;
  }, {});

  const totalStock = variants.reduce((sum, v) => sum + v.availableStock, 0);

  // Price calculations
  const basePrice = row.base_price;
  const salePrice = (row.sale_price !== null && row.sale_price !== undefined && row.sale_price < basePrice)
    ? row.sale_price 
    : null;
  const effectivePrice = salePrice || basePrice;

  return {
    id: row.slug, // Keep frontend slug-based ID compatibility
    db_id: row.id, // Supabase UUID
    sku: row.sku,
    name: row.name,
    subtitle: row.subtitle || fallbackMeta.subtitle || '',
    price: effectivePrice,
    basePrice: basePrice,
    salePrice: salePrice,
    isSale: Boolean(salePrice),
    formattedPrice: `₹${effectivePrice.toLocaleString('en-IN')}`,
    formattedBasePrice: `₹${basePrice.toLocaleString('en-IN')}`,
    formattedSalePrice: salePrice ? `₹${salePrice.toLocaleString('en-IN')}` : null,
    drop: row.drop || fallbackMeta.drop || 'DROP 01 // RACING DIVISION',
    category: row.category || fallbackMeta.category || 'tees',
    tags: row.tags || fallbackMeta.tags || ['tees', 'oversized', 'racing'],
    badge: row.badge || fallbackMeta.badge || 'DROP 01 // 2026',
    headline: row.headline || fallbackMeta.headline || '',
    description: row.description || fallbackMeta.description || '',
    details: Array.isArray(row.details) && row.details.length > 0 
      ? row.details 
      : fallbackMeta.details || [],
    fit: row.fit || fallbackMeta.fit || 'Boxy oversized silhouette with dropped shoulders',
    images: localAssets.images,
    detailThumbnails: localAssets.detailThumbnails,
    sizes: sizes,
    stock: stock,
    totalStock: totalStock,
    isOutOfStock: totalStock === 0,
    measurements: row.measurements || fallbackMeta.measurements || {},
    variants: variants,
    isFeatured: Boolean(row.is_featured),
    isActive: row.is_active !== false,
    sortOrder: row.sort_order ?? 0
  };
};

const withTimeout = (promise, ms = 2500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
  ]);
};

/**
 * Formats static fallback products with canonical variants
 */
const getFormattedFallbackProducts = () => {
  let localCreated = [];
  let deletedIds = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('loozars_local_products');
      if (stored) localCreated = JSON.parse(stored);
      const delStored = localStorage.getItem('loozars_deleted_product_ids');
      if (delStored) deletedIds = JSON.parse(delStored);
    } catch (e) {}
  }

  const staticTransformed = STATIC_PRODUCTS
    .filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p.sku))
    .map(p => {
      const variants = buildFallbackVariants(p);
      const stock = variants.reduce((acc, v) => {
        acc[v.size] = v.availableStock;
        return acc;
      }, {});
      const totalStock = variants.reduce((sum, v) => sum + v.availableStock, 0);
      return {
        ...p,
        basePrice: p.price,
        salePrice: null,
        isSale: false,
        formattedBasePrice: p.formattedPrice,
        stock,
        totalStock,
        isOutOfStock: totalStock === 0,
        variants,
        isFeatured: false,
        isActive: true
      };
    });

  const localTransformed = (Array.isArray(localCreated) ? localCreated : [])
    .filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p.sku))
    .map(p => {
      const variants = p.product_variants || buildFallbackVariants(p);
      const stock = variants.reduce((acc, v) => {
        acc[v.size] = v.stock_quantity ?? v.availableStock ?? 10;
        return acc;
      }, {});
      const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity ?? v.availableStock ?? 10), 0);
      const basePrice = p.base_price || p.price || 899;
      const salePrice = p.sale_price || p.salePrice || null;
      return {
        ...p,
        id: p.slug || p.id,
        db_id: p.id,
        price: salePrice || basePrice,
        basePrice,
        salePrice,
        isSale: Boolean(salePrice),
        formattedPrice: `₹${(salePrice || basePrice).toLocaleString('en-IN')}`,
        formattedBasePrice: `₹${basePrice.toLocaleString('en-IN')}`,
        formattedSalePrice: salePrice ? `₹${salePrice.toLocaleString('en-IN')}` : null,
        stock,
        totalStock,
        isOutOfStock: totalStock === 0,
        variants,
        isActive: p.is_active !== false
      };
    });

  const merged = [...localTransformed];
  const seenIds = new Set(merged.map(m => m.id));
  for (const s of staticTransformed) {
    if (!seenIds.has(s.id)) {
      merged.push(s);
      seenIds.add(s.id);
    }
  }

  return merged;
};

/**
 * Fetches all active products from Supabase (or development catalog fallback)
 */
export const fetchActiveProducts = async () => {
  if (!isSupabaseConfigured) {
    return {
      data: getFormattedFallbackProducts(),
      source: 'local_dev_fallback',
      error: null
    };
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      2500
    );

    if (error || !data || data.length === 0) {
      return {
        data: getFormattedFallbackProducts(),
        source: 'local_dev_fallback_on_error',
        error: error?.message || null
      };
    }

    const transformed = data.map(transformDatabaseProduct);
    return {
      data: transformed,
      source: 'supabase_database',
      error: null
    };
  } catch (err) {
    return {
      data: getFormattedFallbackProducts(),
      source: 'local_dev_fallback_on_exception',
      error: err.message
    };
  }
};

/**
 * Fetches a single product by slug
 */
export const fetchProductBySlug = async (slug) => {
  if (!isSupabaseConfigured) {
    const fallbackList = getFormattedFallbackProducts();
    const match = fallbackList.find(p => p.id === slug) || fallbackList[0];
    return { data: match, source: 'local_dev_fallback', error: null };
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single(),
      2500
    );

    if (error || !data) {
      const fallbackList = getFormattedFallbackProducts();
      const match = fallbackList.find(p => p.id === slug) || fallbackList[0];
      return { data: match, source: 'local_dev_fallback', error: error?.message || 'Not found' };
    }

    return {
      data: transformDatabaseProduct(data),
      source: 'supabase_database',
      error: null
    };
  } catch (err) {
    const fallbackList = getFormattedFallbackProducts();
    const match = fallbackList.find(p => p.id === slug) || fallbackList[0];
    return { data: match, source: 'local_dev_fallback', error: err.message };
  }
};
