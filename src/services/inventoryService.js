import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products.js';
import { buildFallbackVariants } from './productService.js';

/**
 * LOOZARS® Inventory Service
 * Authoritative stock queries, live variant availability, and client-side cart validation.
 */

// Memory cache of fallback variants for instant lookup in offline/dev mode
const FALLBACK_VARIANTS_MAP = STATIC_PRODUCTS.reduce((acc, p) => {
  const variants = buildFallbackVariants(p);
  variants.forEach(v => {
    acc[v.id] = v;
    // Also index by composite key for fallback lookup
    acc[`${p.id}-${v.size}`] = v;
  });
  return acc;
}, {});

/**
 * Fetches real-time stock and reservation status for a specific variant
 * @param {string} variantId - Supabase UUID or fallback variant ID
 * @returns {Promise<{ data: object|null, error: string|null, source: string }>}
 */
export const fetchVariantStock = async (variantId) => {
  if (!variantId) {
    return { data: null, error: 'Variant ID is required', source: 'client_validation' };
  }

  if (!isSupabaseConfigured) {
    const fallback = FALLBACK_VARIANTS_MAP[variantId] || null;
    return {
      data: fallback ? {
        id: fallback.id,
        stock_quantity: fallback.stockQuantity,
        reserved_quantity: fallback.reservedQuantity,
        available_stock: fallback.availableStock,
        is_active: fallback.isActive
      } : null,
      error: null,
      source: 'local_dev_fallback'
    };
  }

  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('id, product_id, size, sku, stock_quantity, reserved_quantity, is_active')
      .eq('id', variantId)
      .single();

    if (error || !data) {
      // Graceful fallback to static definition if query fails
      const fallback = FALLBACK_VARIANTS_MAP[variantId];
      return {
        data: fallback ? {
          id: fallback.id,
          stock_quantity: fallback.stockQuantity,
          reserved_quantity: fallback.reservedQuantity,
          available_stock: fallback.availableStock,
          is_active: fallback.isActive
        } : null,
        error: error?.message || 'Variant not found',
        source: 'local_dev_fallback_on_error'
      };
    }

    return {
      data: {
        id: data.id,
        product_id: data.product_id,
        size: data.size,
        sku: data.sku,
        stock_quantity: data.stock_quantity,
        reserved_quantity: data.reserved_quantity,
        available_stock: Math.max(0, data.stock_quantity - data.reserved_quantity),
        is_active: data.is_active
      },
      error: null,
      source: 'supabase_database'
    };
  } catch (err) {
    return {
      data: null,
      error: err.message,
      source: 'local_dev_fallback_on_exception'
    };
  }
};

/**
 * Validates a cart item array against current stock availability.
 * Note: This is a frontend UX check to inform the user before checkout.
 * Authoritative security/stock validation happens during backend order creation.
 * 
 * @param {Array<{ product: object, variantId: string, size: string, quantity: number }>} cartItems
 * @returns {Promise<{ isValid: boolean, issues: Array<object>, checkedAt: string }>}
 */
export const validateCartItems = async (cartItems = []) => {
  if (!cartItems || cartItems.length === 0) {
    return { isValid: true, issues: [], checkedAt: new Date().toISOString() };
  }

  const issues = [];

  // If Supabase is configured, fetch live variants in a single batched query
  if (isSupabaseConfigured) {
    try {
      const variantIds = cartItems
        .map(item => item.variantId)
        .filter(id => id && !id.startsWith('var-')); // Real UUIDs only

      let dbVariants = [];
      if (variantIds.length > 0) {
        const { data, error } = await supabase
          .from('product_variants')
          .select('id, product_id, size, sku, stock_quantity, reserved_quantity, is_active')
          .in('id', variantIds);

        if (!error && data) {
          dbVariants = data;
        }
      }

      const dbMap = dbVariants.reduce((acc, v) => {
        acc[v.id] = v;
        return acc;
      }, {});

      for (const item of cartItems) {
        const dbVariant = dbMap[item.variantId];
        const fallbackVariant = FALLBACK_VARIANTS_MAP[item.variantId] || FALLBACK_VARIANTS_MAP[`${item.product.id}-${item.size}`];
        const variant = dbVariant || fallbackVariant;

        if (!variant) {
          issues.push({
            productId: item.product.id,
            variantId: item.variantId,
            size: item.size,
            name: item.product.name,
            reason: 'VARIANT_NOT_FOUND',
            message: `Size ${item.size} for ${item.product.name} is no longer available.`
          });
          continue;
        }

        const isActive = variant.is_active ?? variant.isActive ?? true;
        if (!isActive) {
          issues.push({
            productId: item.product.id,
            variantId: item.variantId,
            size: item.size,
            name: item.product.name,
            reason: 'VARIANT_INACTIVE',
            message: `Size ${item.size} for ${item.product.name} has been discontinued.`
          });
          continue;
        }

        const stock = variant.stock_quantity ?? variant.stockQuantity ?? 0;
        const reserved = variant.reserved_quantity ?? variant.reservedQuantity ?? 0;
        const available = Math.max(0, stock - reserved);

        if (item.quantity <= 0) {
          issues.push({
            productId: item.product.id,
            variantId: item.variantId,
            size: item.size,
            name: item.product.name,
            reason: 'INVALID_QUANTITY',
            message: `Quantity for ${item.product.name} (${item.size}) must be at least 1.`
          });
        } else if (item.quantity > available) {
          issues.push({
            productId: item.product.id,
            variantId: item.variantId,
            size: item.size,
            name: item.product.name,
            reason: 'INSUFFICIENT_STOCK',
            requestedQuantity: item.quantity,
            availableStock: available,
            message: available === 0
              ? `${item.product.name} in size ${item.size} is currently sold out.`
              : `Only ${available} piece(s) available in size ${item.size} for ${item.product.name}.`
          });
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        checkedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('[inventoryService] Live validation error, falling back to local checks:', err);
    }
  }

  // Fallback offline validation
  for (const item of cartItems) {
    const fallback = FALLBACK_VARIANTS_MAP[item.variantId] || 
                     FALLBACK_VARIANTS_MAP[`${item.product.id}-${item.size}`] ||
                     (item.product.stock && item.product.stock[item.size] !== undefined ? { availableStock: item.product.stock[item.size], isActive: true } : null);

    if (!fallback) {
      continue;
    }

    const available = fallback.availableStock ?? fallback.stock_quantity ?? fallback.stockQuantity ?? 0;
    if (item.quantity > available) {
      issues.push({
        productId: item.product.id,
        variantId: item.variantId,
        size: item.size,
        name: item.product.name,
        reason: 'INSUFFICIENT_STOCK',
        requestedQuantity: item.quantity,
        availableStock: available,
        message: available === 0
          ? `${item.product.name} in size ${item.size} is currently sold out.`
          : `Only ${available} piece(s) available in size ${item.size} for ${item.product.name}.`
      });
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    checkedAt: new Date().toISOString()
  };
};
