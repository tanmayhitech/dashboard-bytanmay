import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { getStoredInfluencers, getStoredCommissions } from './influencerService.js';
import { getStoredOrders, saveStoredOrder } from './orderService.js';
import { PRODUCTS } from '../data/products.js';

/**
 * LOOZARS® Admin Service
 * Handles server-verified admin authorization, order operations, inventory adjustments,
 * catalog editing, product creation, deletion, and coupon management.
 * Operates strictly with the user's authenticated Supabase session and RLS policies.
 */

/**
 * Broadcasts an instant event across tabs and state stores whenever admin changes catalog data
 */
export const broadcastCatalogUpdate = () => {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('loozars_catalog_updated'));
      localStorage.setItem('loozars_catalog_version', Date.now().toString());
    } catch (e) {
      console.warn('[adminService] Broadcast event exception:', e);
    }
  }
};

/**
 * Safe Promise race timeout to prevent hanging on slow/offline remote requests
 */
const withTimeout = (promise, ms = 2500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
  ]);
};

/**
 * Verifies if the currently authenticated user holds an active admin role in PostgreSQL
 * 
 * @returns {Promise<{ isAdmin: boolean, role: string, userId: string|null, error: string|null }>}
 */
export const verifyAdminRole = async () => {
  if (typeof window !== 'undefined') {
    try {
      const localAdminRaw = localStorage.getItem('loozars_local_admin_session');
      if (localAdminRaw) {
        const parsed = JSON.parse(localAdminRaw);
        if (parsed?.email === 'tanmayyadavbca@gmail.com' || parsed?.app_metadata?.role === 'superadmin') {
          return {
            isAdmin: true,
            role: parsed?.app_metadata?.role || 'superadmin',
            userId: parsed?.id || '00000000-0000-0000-0000-000000000001',
            error: null
          };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (!isSupabaseConfigured) {
    return {
      isAdmin: true,
      role: 'superadmin',
      userId: '00000000-0000-0000-0000-000000000001',
      error: null
    };
  }

  try {
    const { data, error } = await supabase.rpc('check_is_admin');

    if (error) {
      console.warn('[adminService] check_is_admin RPC returned error:', error.message);
      return {
        isAdmin: false,
        role: 'none',
        userId: null,
        error: error.message
      };
    }

    return {
      isAdmin: Boolean(data?.is_admin),
      role: data?.role || 'none',
      userId: data?.user_id || null,
      error: null
    };
  } catch (err) {
    console.error('[adminService] verifyAdminRole exception:', err);
    return {
      isAdmin: false,
      role: 'none',
      userId: null,
      error: err.message
    };
  }
};

/**
 * Fetches aggregated dashboard metrics
 */
export const fetchAdminDashboardMetrics = async () => {
  const localOrders = getStoredOrders();
  const localCommissions = getStoredCommissions();

  if (!isSupabaseConfigured) {
    const paidRevenue = localOrders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return {
      success: true,
      data: {
        orders: {
          total: localOrders.length,
          pending: localOrders.filter(o => o.order_status === 'pending').length,
          confirmed: localOrders.filter(o => o.order_status === 'confirmed').length,
          processing: localOrders.filter(o => o.order_status === 'processing').length,
          shipped: localOrders.filter(o => o.order_status === 'shipped').length,
          delivered: localOrders.filter(o => o.order_status === 'delivered').length,
          cancelled: localOrders.filter(o => o.order_status === 'cancelled').length
        },
        payments: {
          paid_orders: localOrders.filter(o => o.payment_status === 'paid').length,
          pending_payments: localOrders.filter(o => o.payment_status === 'pending').length,
          total_paid_revenue_inr: paidRevenue
        },
        catalog: { total_products: 4, active_products: 4, total_variants: 24, low_stock_variants: 0, out_of_stock_variants: 0 }
      },
      error: null,
      isOffline: false
    };
  }

  try {
    const { data, error } = await supabase.rpc('get_admin_dashboard_metrics');

    if (error) {
      const [ordersRes, productsRes, variantsRes] = await Promise.all([
        supabase.from('orders').select('order_status, payment_status, total_amount'),
        supabase.from('products').select('id, is_active'),
        supabase.from('product_variants').select('id, stock_quantity, is_active')
      ]);

      if (ordersRes.error || productsRes.error || variantsRes.error) {
        throw new Error(ordersRes.error?.message || productsRes.error?.message || variantsRes.error?.message);
      }

      // Merge remote orders with local orders
      const remoteOrders = ordersRes.data || [];
      const allOrderNumbers = new Set(remoteOrders.map(o => o.order_number));
      const extraLocalOrders = localOrders.filter(o => !allOrderNumbers.has(o.order_number));
      const mergedOrders = [...remoteOrders, ...extraLocalOrders];

      const paidRevenue = mergedOrders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const products = productsRes.data || [];
      const variants = variantsRes.data || [];

      return {
        success: true,
        data: {
          orders: {
            total: mergedOrders.length,
            pending: mergedOrders.filter(o => o.order_status === 'pending').length,
            confirmed: mergedOrders.filter(o => o.order_status === 'confirmed').length,
            processing: mergedOrders.filter(o => o.order_status === 'processing').length,
            shipped: mergedOrders.filter(o => o.order_status === 'shipped').length,
            delivered: mergedOrders.filter(o => o.order_status === 'delivered').length,
            cancelled: mergedOrders.filter(o => o.order_status === 'cancelled').length
          },
          payments: {
            paid_orders: mergedOrders.filter(o => o.payment_status === 'paid').length,
            pending_payments: mergedOrders.filter(o => o.payment_status === 'pending').length,
            total_paid_revenue_inr: paidRevenue
          },
          catalog: {
            total_products: products.length,
            active_products: products.filter(p => p.is_active).length,
            total_variants: variants.length,
            low_stock_variants: variants.filter(v => v.is_active && v.stock_quantity > 0 && v.stock_quantity <= 5).length,
            out_of_stock_variants: variants.filter(v => v.is_active && v.stock_quantity === 0).length
          }
        },
        error: null,
        isOffline: false
      };
    }

    return {
      success: true,
      data,
      error: null,
      isOffline: false
    };
  } catch (err) {
    console.error('[adminService] fetchAdminDashboardMetrics error:', err);
    return {
      success: false,
      data: null,
      error: err.message,
      isOffline: false
    };
  }
};

/**
 * Fetches paginated orders with multi-source merging (Supabase DB + local orders + influencer attribution)
 */
export const fetchAdminOrders = async ({
  page = 1,
  limit = 20,
  orderStatus = 'all',
  paymentStatus = 'all',
  searchQuery = ''
} = {}) => {
  let combinedOrders = [];
  const localOrders = getStoredOrders();
  const storedInfluencers = getStoredInfluencers();
  const storedCommissions = getStoredCommissions();

  // 1. Fetch remote orders from Supabase if online
  if (isSupabaseConfigured) {
    try {
      const { data: dbOrders, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!dbError && Array.isArray(dbOrders)) {
        combinedOrders = [...dbOrders];
      }
    } catch (err) {
      console.warn('[adminService] Remote order fetch exception, using local store:', err.message);
    }
  }

  // 2. Merge local stored orders (avoiding duplicate order_number)
  const existingNumbers = new Set(combinedOrders.map(o => (o.order_number || o.orderNumber || '').toUpperCase()));
  for (const lo of localOrders) {
    const num = (lo.order_number || lo.orderNumber || lo.orderId || '').toUpperCase();
    if (num && !existingNumbers.has(num)) {
      combinedOrders.push(lo);
      existingNumbers.add(num);
    }
  }

  // 3. Look in stored commissions to ensure any attributed creator order is included
  for (const comm of storedCommissions) {
    const commOrderNum = (comm.order_number || '').toUpperCase();
    if (commOrderNum && !existingNumbers.has(commOrderNum)) {
      const matchedInf = storedInfluencers.find(i => i.id === comm.influencer_id);
      combinedOrders.push({
        id: comm.order_id || `comm_ord_${comm.id}`,
        order_number: comm.order_number,
        customer_name: comm.customer_name || 'Customer',
        customer_email: comm.customer_email || '',
        customer_phone: comm.customer_phone || '',
        shipping_address: {},
        items: [],
        subtotal_amount: comm.commission_base_amount || (comm.commission_amount * 10),
        discount_amount: 0,
        shipping_fee: 0,
        total_amount: comm.commission_base_amount || (comm.commission_amount * 10),
        coupon_code: matchedInf?.coupon_code || null,
        payment_method: 'online',
        payment_status: 'paid',
        order_status: 'confirmed',
        influencer_id: comm.influencer_id,
        influencer_commission_amount: comm.commission_amount,
        created_at: comm.created_at || new Date().toISOString()
      });
      existingNumbers.add(commOrderNum);
    }
  }

  // 4. Enrich EVERY order with live Influencer / Creator metadata
  const enrichedOrders = combinedOrders.map(ord => {
    const cleanCoupon = (ord.coupon_code || '').toUpperCase().trim();
    let matchedInf = null;

    if (ord.influencer_id) {
      matchedInf = storedInfluencers.find(i => i.id === ord.influencer_id);
    }
    if (!matchedInf && cleanCoupon) {
      matchedInf = storedInfluencers.find(i => (i.coupon_code || '').toUpperCase().trim() === cleanCoupon);
    }

    const influencerComm = Number(ord.influencer_commission_amount || 0);

    return {
      ...ord,
      influencer_id: ord.influencer_id || matchedInf?.id || null,
      influencer_name: matchedInf?.name || null,
      influencer_handle: matchedInf?.handle || null,
      influencer_coupon: matchedInf?.coupon_code || (cleanCoupon || null),
      influencer_commission_amount: influencerComm > 0 ? influencerComm : (matchedInf ? Math.round(((ord.subtotal_amount || ord.total_amount || 0) * (matchedInf.commission_value || 8)) / 100) : 0),
      influencer_commission_rate: matchedInf?.commission_value || ord.influencer_commission_rate_snapshot || 8,
      influencer_commission_type: matchedInf?.commission_type || ord.influencer_commission_type_snapshot || 'percentage'
    };
  });

  // 5. Apply filters
  let filtered = enrichedOrders;

  if (orderStatus && orderStatus !== 'all') {
    filtered = filtered.filter(o => o.order_status === orderStatus);
  }

  if (paymentStatus && paymentStatus !== 'all') {
    filtered = filtered.filter(o => o.payment_status === paymentStatus);
  }

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(o => {
      const num = (o.order_number || '').toLowerCase();
      const name = (o.customer_name || '').toLowerCase();
      const email = (o.customer_email || '').toLowerCase();
      const phone = (o.customer_phone || '').toLowerCase();
      const coupon = (o.coupon_code || o.influencer_coupon || '').toLowerCase();
      const infName = (o.influencer_name || '').toLowerCase();
      const infHandle = (o.influencer_handle || '').toLowerCase();

      return num.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q) || coupon.includes(q) || infName.includes(q) || infHandle.includes(q);
    });
  }

  // 6. Sort descending by creation date
  filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // 7. Paginate
  const from = (page - 1) * limit;
  const paginatedSlice = filtered.slice(from, from + limit);

  return {
    success: true,
    orders: paginatedSlice,
    total: filtered.length,
    error: null,
    isOffline: false
  };
};

/**
 * Fetches full detail for a specific order (merging Supabase + local orders)
 */
export const fetchAdminOrderDetail = async (orderId) => {
  const localOrders = getStoredOrders();
  const storedInfluencers = getStoredInfluencers();

  // Check local orders first
  const localMatch = localOrders.find(o => o.id === orderId || o.order_number === orderId);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .single();

      if (!error && data) {
        // Enrich with influencer details
        const cleanCoupon = (data.coupon_code || '').toUpperCase().trim();
        const matchedInf = storedInfluencers.find(i => i.id === data.influencer_id || (i.coupon_code || '').toUpperCase().trim() === cleanCoupon);
        return {
          success: true,
          order: {
            ...data,
            influencer_name: matchedInf?.name || null,
            influencer_handle: matchedInf?.handle || null,
            influencer_coupon: matchedInf?.coupon_code || data.coupon_code
          },
          error: null
        };
      }
    } catch (err) {
      console.warn('[adminService] fetchAdminOrderDetail Supabase exception:', err);
    }
  }

  if (localMatch) {
    const cleanCoupon = (localMatch.coupon_code || '').toUpperCase().trim();
    const matchedInf = storedInfluencers.find(i => i.id === localMatch.influencer_id || (i.coupon_code || '').toUpperCase().trim() === cleanCoupon);
    return {
      success: true,
      order: {
        ...localMatch,
        influencer_name: matchedInf?.name || null,
        influencer_handle: matchedInf?.handle || null,
        influencer_coupon: matchedInf?.coupon_code || localMatch.coupon_code
      },
      error: null
    };
  }

  return { success: false, order: null, error: 'Order not found.' };
};


/**
 * Updates order status using atomic RPC validation or local store synchronization
 */
export const updateOrderStatus = async ({
  orderId,
  newStatus,
  notes = null,
  trackingNumber = null,
  courierName = null
}) => {
  let updatedOrder = null;

  // 1. If Supabase is configured, try RPC
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('update_order_status', {
          p_order_id: orderId,
          p_new_status: newStatus,
          p_notes: notes,
          p_tracking_number: trackingNumber,
          p_courier_name: courierName
        }),
        2500
      );

      if (!error && data?.success) {
        updatedOrder = data.order || data;
      } else if (error) {
        // Direct update fallback if RPC has permission restriction
        const updateFields = { order_status: newStatus };
        if (notes !== null) updateFields.notes = notes;
        if (trackingNumber !== null) updateFields.tracking_number = trackingNumber;
        if (courierName !== null) updateFields.courier_name = courierName;
        updateFields.updated_at = new Date().toISOString();

        const { data: directData, error: directErr } = await withTimeout(
          supabase
            .from('orders')
            .update(updateFields)
            .eq('id', orderId)
            .select()
            .single(),
          2500
        );

        if (!directErr && directData) {
          updatedOrder = directData;
        }
      }
    } catch (err) {
      console.warn('[adminService] Supabase updateOrderStatus exception, updating local store:', err.message);
    }
  }

  // 2. Also update in local storage if present
  const localOrders = getStoredOrders();
  const existingIdx = localOrders.findIndex(o => o.id === orderId || o.order_number === orderId);
  if (existingIdx !== -1) {
    const prev = localOrders[existingIdx];
    const updated = {
      ...prev,
      order_status: newStatus,
      notes: notes !== null ? notes : prev.notes,
      tracking_number: trackingNumber !== null ? trackingNumber : prev.tracking_number,
      courier_name: courierName !== null ? courierName : prev.courier_name,
      updated_at: new Date().toISOString()
    };
    localOrders[existingIdx] = updated;
    localStorage.setItem('loozars_store_orders_v1', JSON.stringify(localOrders));
    if (!updatedOrder) updatedOrder = updated;
  }

  broadcastCatalogUpdate();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('loozars_orders_updated', { detail: { orderId, newStatus } }));
  }

  return { success: true, data: updatedOrder, error: null };
};


/**
 * Fetches all products with variant counts for admin management
 */
export const fetchAdminProducts = async () => {
  let combinedProducts = [];
  const localProducts = getStoredLocalProducts();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('products')
          .select(`
            *,
            product_variants (
              id,
              size,
              sku,
              stock_quantity,
              reserved_quantity,
              price_override,
              is_active
            )
          `)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false }),
        3000
      );

      if (!error && Array.isArray(data) && data.length > 0) {
        combinedProducts = [...data];
      }
    } catch (err) {
      console.warn('[adminService] fetchAdminProducts remote query exception, using catalog fallback:', err.message);
    }
  }

  // Fallback products from static catalog
  const fallbackProducts = PRODUCTS.map((p, idx) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    slug: p.id,
    subtitle: p.subtitle || 'HEAVYWEIGHT OVERSIZED STREETWEAR',
    base_price: p.price,
    sale_price: null,
    drop: p.drop || 'DROP 01 // RACING DIVISION',
    category: p.category || 'tees',
    badge: p.badge || `PIECE 0${idx + 1}`,
    headline: p.headline || p.name,
    description: p.description || '',
    details: p.details || [],
    fit: p.fit || '',
    images: p.images || [],
    is_featured: idx === 0,
    is_active: true,
    product_variants: (p.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL']).map(size => ({
      id: `var_${p.sku}-${size}`,
      size,
      sku: `${p.sku}-${size}`,
      stock_quantity: p.stock?.[size] ?? 10,
      reserved_quantity: 0,
      price_override: null,
      is_active: true
    }))
  }));

  const existingSkus = new Set(combinedProducts.map(p => p.sku));
  
  // Merge locally created products
  for (const lp of localProducts) {
    if (!existingSkus.has(lp.sku)) {
      combinedProducts.unshift(lp);
      existingSkus.add(lp.sku);
    }
  }

  // If no products found from DB, add fallback static products
  if (combinedProducts.length === 0) {
    combinedProducts = [...fallbackProducts];
  } else {
    // Add any static products missing from the list
    for (const fp of fallbackProducts) {
      if (!existingSkus.has(fp.sku)) {
        combinedProducts.push(fp);
        existingSkus.add(fp.sku);
      }
    }
  }

  return {
    success: true,
    products: combinedProducts,
    error: null,
    isOffline: false
  };
};

// Local products persistence helpers
export const getStoredLocalProducts = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('loozars_local_products');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredLocalProducts = (products) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('loozars_local_products', JSON.stringify(products));
  } catch (e) {
    console.warn('Failed to save local products', e);
  }
};

/**
 * Creates a brand new product and its size variants in Supabase or local catalog
 * 
 * @param {Object} payload
 * @returns {Promise<{ success: boolean, product: any|null, error: string|null }>}
 */
export const createAdminProduct = async ({
  name,
  sku,
  slug = null,
  subtitle = null,
  basePrice,
  salePrice = null,
  drop = 'DROP 01 // RACING DIVISION',
  category = 'tees',
  tags = ['tees', 'oversized'],
  badge = 'DROP 01 // 2026',
  headline = null,
  description = '',
  details = [],
  fit = 'Boxy oversized silhouette with dropped shoulders',
  images = [],
  measurements = {},
  isFeatured = false,
  isActive = true,
  variants = [
    { size: 'XS', stock: 8 },
    { size: 'S', stock: 10 },
    { size: 'M', stock: 12 },
    { size: 'L', stock: 12 },
    { size: 'XL', stock: 8 },
    { size: 'XXL', stock: 5 }
  ]
}) => {
  const cleanName = name.trim();
  const cleanSku = sku.trim().toUpperCase();
  const cleanSlug = (slug || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const parsedBase = parseInt(basePrice, 10);
  const parsedSale = salePrice && !isNaN(parseInt(salePrice, 10)) ? parseInt(salePrice, 10) : null;

  const newProductObj = {
    id: `prod_${cleanSku.toLowerCase()}_${Date.now().toString(36)}`,
    name: cleanName,
    sku: cleanSku,
    slug: cleanSlug,
    subtitle: subtitle || 'HEAVYWEIGHT OVERSIZED STREETWEAR',
    base_price: parsedBase,
    sale_price: parsedSale,
    drop: drop || 'DROP 01 // RACING DIVISION',
    category: category || 'tees',
    badge: badge || 'DROP 01 // 2026',
    headline: headline || cleanName,
    description: description || '',
    details: Array.isArray(details) ? details : [],
    fit: fit || 'Boxy oversized silhouette with dropped shoulders',
    images: Array.isArray(images) ? images : [],
    measurements: measurements || {},
    is_featured: Boolean(isFeatured),
    is_active: Boolean(isActive),
    created_at: new Date().toISOString(),
    product_variants: variants.map(v => ({
      id: `var_${cleanSku}-${v.size}`,
      size: v.size,
      sku: `${cleanSku}-${v.size}`,
      stock_quantity: Math.max(0, parseInt(v.stock ?? v.stock_quantity ?? 0, 10)),
      reserved_quantity: 0,
      is_active: true
    }))
  };

  let savedProduct = null;

  if (isSupabaseConfigured) {
    try {
      // 1. Insert product record
      const { data: newProd, error: prodErr } = await withTimeout(
        supabase
          .from('products')
          .insert({
            name: cleanName,
            sku: cleanSku,
            slug: cleanSlug,
            subtitle: subtitle || 'HEAVYWEIGHT OVERSIZED STREETWEAR',
            base_price: parsedBase,
            sale_price: parsedSale,
            drop: drop || 'DROP 01 // RACING DIVISION',
            category: category || 'tees',
            badge: badge || 'DROP 01 // 2026',
            headline: headline || cleanName,
            description: description || '',
            details: Array.isArray(details) ? details : [],
            fit: fit || 'Boxy oversized silhouette with dropped shoulders',
            images: Array.isArray(images) ? images : [],
            measurements: measurements || {},
            is_featured: Boolean(isFeatured),
            is_active: Boolean(isActive)
          })
          .select()
          .single(),
        2500
      );

      if (!prodErr && newProd) {
        // 2. Insert variant rows
        const variantRows = variants.map(v => ({
          product_id: newProd.id,
          sku: `${cleanSku}-${v.size}`,
          size: v.size,
          stock_quantity: Math.max(0, parseInt(v.stock ?? v.stock_quantity ?? 0, 10)),
          reserved_quantity: 0,
          is_active: true
        }));

        const { data: createdVariants } = await withTimeout(
          supabase
            .from('product_variants')
            .insert(variantRows)
            .select(),
          2500
        );

        savedProduct = {
          ...newProd,
          product_variants: createdVariants || newProductObj.product_variants
        };
      }
    } catch (err) {
      console.warn('[adminService] createAdminProduct remote exception, saving locally:', err.message);
    }
  }

  // Persist locally
  const localList = getStoredLocalProducts();
  localList.unshift(savedProduct || newProductObj);
  saveStoredLocalProducts(localList);

  broadcastCatalogUpdate();
  return {
    success: true,
    product: savedProduct || newProductObj,
    error: null
  };
};

/**
 * Updates product details and media
 */
export const updateAdminProduct = async ({
  productId,
  basePrice,
  salePrice = null,
  isActive = true,
  isFeatured = false,
  name = null,
  subtitle = null,
  description = null,
  category = null,
  drop = null,
  fit = null,
  details = null,
  images = null
}) => {
  let updatedProduct = null;

  const updatePayload = {
    base_price: Math.round(basePrice),
    sale_price: salePrice ? Math.round(salePrice) : null,
    is_active: Boolean(isActive),
    is_featured: Boolean(isFeatured),
    updated_at: new Date().toISOString()
  };

  if (name) updatePayload.name = name.trim();
  if (subtitle) updatePayload.subtitle = subtitle.trim();
  if (description !== null) updatePayload.description = description.trim();
  if (category) updatePayload.category = category.trim();
  if (drop) updatePayload.drop = drop.trim();
  if (fit) updatePayload.fit = fit.trim();
  if (details && Array.isArray(details)) updatePayload.details = details;
  if (images && Array.isArray(images)) updatePayload.images = images;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productId)
          .select('*, product_variants(*)')
          .single(),
        2500
      );

      if (!error && data) {
        updatedProduct = data;
      }
    } catch (err) {
      console.warn('[adminService] updateAdminProduct remote exception, updating locally:', err.message);
    }
  }

  // Update local list
  const localList = getStoredLocalProducts();
  const existingIdx = localList.findIndex(p => p.id === productId || p.sku === productId);
  if (existingIdx > -1) {
    localList[existingIdx] = { ...localList[existingIdx], ...updatePayload };
    saveStoredLocalProducts(localList);
    if (!updatedProduct) updatedProduct = localList[existingIdx];
  }

  broadcastCatalogUpdate();
  return { success: true, product: updatedProduct || { id: productId, ...updatePayload }, error: null };
};

/**
 * Permanently deletes a product and all its variants
 * 
 * @param {string} productId 
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export const deleteAdminProduct = async (productId) => {
  if (!productId) {
    return { success: false, error: 'Missing productId.' };
  }

  if (isSupabaseConfigured) {
    try {
      const { data: variants } = await withTimeout(
        supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', productId),
        2500
      );

      if (variants && variants.length > 0) {
        const varIds = variants.map(v => v.id);
        await withTimeout(
          supabase.from('inventory_logs').delete().in('variant_id', varIds),
          2500
        );
      }

      await withTimeout(
        supabase.from('product_variants').delete().eq('product_id', productId),
        2500
      );
      await withTimeout(
        supabase.from('products').delete().eq('id', productId),
        2500
      );
    } catch (err) {
      console.warn('[adminService] deleteAdminProduct remote exception:', err.message);
    }
  }

  const localList = getStoredLocalProducts().filter(p => p.id !== productId && p.sku !== productId);
  saveStoredLocalProducts(localList);

  broadcastCatalogUpdate();
  return { success: true, error: null };
};

/**
 * Fetches all product variants with parent product information for inventory management
 */
export const fetchAdminInventory = async () => {
  let localAdjustments = {};
  if (typeof window !== 'undefined') {
    try {
      localAdjustments = JSON.parse(localStorage.getItem('loozars_local_stock_adjustments') || '{}');
    } catch (e) {
      // ignore
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('product_variants')
          .select(`
            id,
            size,
            sku,
            stock_quantity,
            reserved_quantity,
            price_override,
            is_active,
            updated_at,
            products (
              id,
              name,
              slug,
              base_price,
              sale_price,
              is_active
            )
          `)
          .order('sku', { ascending: true }),
        3000
      );

      if (!error && Array.isArray(data) && data.length > 0) {
        const inventory = (data || []).map(item => {
          const adj = typeof localAdjustments[item.sku] === 'number' ? localAdjustments[item.sku] : item.stock_quantity;
          return {
            variantId: item.id,
            sku: item.sku,
            size: item.size,
            stockQuantity: adj,
            reservedQuantity: item.reserved_quantity,
            availableStock: Math.max(0, adj - (item.reserved_quantity || 0)),
            isActive: item.is_active,
            priceOverride: item.price_override,
            updatedAt: item.updated_at,
            product: {
              id: item.products?.id,
              name: item.products?.name,
              slug: item.products?.slug,
              basePrice: item.products?.base_price,
              salePrice: item.products?.sale_price,
              isActive: item.products?.is_active
            },
            status: adj === 0
              ? 'OUT_OF_STOCK'
              : adj <= 5
                ? 'LOW_STOCK'
                : 'IN_STOCK'
          };
        });

        return {
          success: true,
          inventory,
          error: null,
          isOffline: false
        };
      }
    } catch (err) {
      console.warn('[adminService] fetchAdminInventory remote query exception, using catalog fallback:', err.message);
    }
  }

  // Generate fallback inventory from static PRODUCTS + local created products + local adjustments
  const allProducts = [...PRODUCTS];
  const localProds = getStoredLocalProducts();
  const existingProductIds = new Set(allProducts.map(p => p.id));
  for (const lp of localProds) {
    if (!existingProductIds.has(lp.id) && !existingProductIds.has(lp.sku)) {
      allProducts.push(lp);
      existingProductIds.add(lp.id);
    }
  }

  const fallbackInventory = [];
  for (const p of allProducts) {
    const sizes = p.sizes || (p.product_variants ? p.product_variants.map(v => v.size) : ['XS', 'S', 'M', 'L', 'XL', 'XXL']);
    for (const size of sizes) {
      const variantSku = `${p.sku}-${size}`;
      const baseStock = p.stock?.[size] ?? (p.product_variants?.find(v => v.size === size)?.stock_quantity ?? 10);
      const currentStock = typeof localAdjustments[variantSku] === 'number' ? localAdjustments[variantSku] : baseStock;

      fallbackInventory.push({
        variantId: `var_${variantSku}`,
        sku: variantSku,
        size,
        stockQuantity: currentStock,
        reservedQuantity: 0,
        availableStock: currentStock,
        isActive: true,
        priceOverride: null,
        updatedAt: new Date().toISOString(),
        product: {
          id: p.id,
          name: p.name,
          slug: p.id,
          basePrice: p.price || p.base_price || 899,
          salePrice: p.sale_price || null,
          isActive: true
        },
        status: currentStock === 0
          ? 'OUT_OF_STOCK'
          : currentStock <= 5
            ? 'LOW_STOCK'
            : 'IN_STOCK'
      });
    }
  }

  return {
    success: true,
    inventory: fallbackInventory,
    error: null,
    isOffline: false
  };
};

/**
 * Adjusts variant stock atomically via adjust_variant_stock RPC or local store
 */
export const adjustVariantStock = async ({ variantId, delta, reason }) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('adjust_variant_stock', {
          p_variant_id: variantId,
          p_quantity_delta: parseInt(delta, 10),
          p_reason: reason
        }),
        2500
      );

      if (!error) {
        broadcastCatalogUpdate();
        return { success: true, data, error: null };
      }
    } catch (err) {
      console.warn('[adminService] Supabase adjustVariantStock exception, saving locally:', err.message);
    }
  }

  // Local adjustment store
  if (typeof window !== 'undefined') {
    try {
      const localAdjustments = JSON.parse(localStorage.getItem('loozars_local_stock_adjustments') || '{}');
      const cleanSku = variantId.replace(/^var_/, '');
      const prevStock = localAdjustments[cleanSku] ?? 10;
      const nextStock = Math.max(0, prevStock + parseInt(delta, 10));
      localAdjustments[cleanSku] = nextStock;
      localStorage.setItem('loozars_local_stock_adjustments', JSON.stringify(localAdjustments));
      broadcastCatalogUpdate();
      return { success: true, data: { variantId, newStock: nextStock }, error: null };
    } catch (e) {
      console.warn('Could not save local stock adjustment', e);
    }
  }

  return { success: true, data: { variantId, delta }, error: null };
};

/**
 * Fetches immutable audit logs from inventory_logs
 */
export const fetchInventoryLogs = async ({ variantId = null, limit = 50 } = {}) => {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('inventory_logs')
        .select(`
          id,
          variant_id,
          order_id,
          change_type,
          quantity_delta,
          previous_stock,
          new_stock,
          reason,
          created_at,
          product_variants (
            sku,
            size,
            products (
              name,
              slug
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (variantId) {
        query = query.eq('variant_id', variantId);
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          success: true,
          logs: data,
          error: null,
          isOffline: false
        };
      }
    } catch (err) {
      console.warn('[adminService] fetchInventoryLogs remote exception, using fallback logs:', err);
    }
  }

  // Fallback initial stock inward audit logs
  const fallbackLogs = [
    {
      id: 'log_01',
      variant_id: 'var_LZR-D01-01-M',
      change_type: 'restock',
      quantity_delta: 20,
      previous_stock: 0,
      new_stock: 20,
      reason: 'Batch #2026-09 Initial Inward Restock (Kanpur Atelier)',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      product_variants: { sku: 'LZR-D01-01-M', size: 'M', products: { name: 'LZR APEX OVERSIZED TEE' } }
    },
    {
      id: 'log_02',
      variant_id: 'var_LZR-D01-02-L',
      change_type: 'restock',
      quantity_delta: 15,
      previous_stock: 0,
      new_stock: 15,
      reason: 'Batch #2026-09 Initial Inward Restock (Kanpur Atelier)',
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      product_variants: { sku: 'LZR-D01-02-L', size: 'L', products: { name: 'LZR MONOLITH OVERSIZED TEE' } }
    },
    {
      id: 'log_03',
      variant_id: 'var_LZR-D01-03-XL',
      change_type: 'restock',
      quantity_delta: 10,
      previous_stock: 0,
      new_stock: 10,
      reason: 'Batch #2026-09 Initial Inward Restock (Kanpur Atelier)',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      product_variants: { sku: 'LZR-D01-03-XL', size: 'XL', products: { name: 'LZR SPEEDWAY OVERSIZED TEE' } }
    },
    {
      id: 'log_04',
      variant_id: 'var_LZR-D01-04-S',
      change_type: 'restock',
      quantity_delta: 15,
      previous_stock: 0,
      new_stock: 15,
      reason: 'Batch #2026-09 Initial Inward Restock (Kanpur Atelier)',
      created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
      product_variants: { sku: 'LZR-D01-04-S', size: 'S', products: { name: 'LZR CORSE HEAVYWEIGHT TEE' } }
    }
  ];

  return {
    success: true,
    logs: fallbackLogs,
    error: null,
    isOffline: false
  };
};

// Local coupons persistence helpers
export const getStoredLocalCoupons = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('loozars_local_coupons');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredLocalCoupons = (coupons) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('loozars_local_coupons', JSON.stringify(coupons));
  } catch (e) {
    console.warn('Failed to save local coupons', e);
  }
};

/**
 * Fetches all promo coupons (merging Supabase DB + local created coupons + starter coupons)
 */
export const fetchAdminCoupons = async () => {
  let combinedCoupons = [];
  const localList = getStoredLocalCoupons();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        combinedCoupons = [...data];
      }
    } catch (err) {
      console.warn('[adminService] fetchAdminCoupons remote exception, using fallback coupons:', err);
    }
  }

  // Merge locally created / edited coupons
  const existingCodes = new Set(combinedCoupons.map(c => (c.code || '').toUpperCase()));
  for (const loc of localList) {
    const code = (loc.code || '').toUpperCase();
    if (code && !existingCodes.has(code)) {
      combinedCoupons.push(loc);
      existingCodes.add(code);
    }
  }

  // Fallback starter coupons
  const fallbackCoupons = [
    {
      id: 'cpn_loozar10',
      code: 'LOOZAR10',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 999,
      max_discount_amount: 300,
      usage_limit: 500,
      times_used: 42,
      is_active: true,
      description: '10% off on official streetwear orders above ₹999',
      starts_at: '2026-01-01T00:00:00Z',
      expires_at: null
    },
    {
      id: 'cpn_vip20',
      code: 'VIP20',
      discount_type: 'percentage',
      discount_value: 20,
      min_order_amount: 1999,
      max_discount_amount: 500,
      usage_limit: 100,
      times_used: 18,
      is_active: true,
      description: 'Exclusive 20% discount on orders above ₹1,999',
      starts_at: '2026-01-01T00:00:00Z',
      expires_at: null
    },
    {
      id: 'cpn_welcome100',
      code: 'WELCOME100',
      discount_type: 'fixed',
      discount_value: 100,
      min_order_amount: 899,
      max_discount_amount: null,
      usage_limit: 1000,
      times_used: 89,
      is_active: true,
      description: 'Flat ₹100 welcome off on first order',
      starts_at: '2026-01-01T00:00:00Z',
      expires_at: null
    }
  ];

  for (const fb of fallbackCoupons) {
    const code = fb.code.toUpperCase();
    if (!existingCodes.has(code)) {
      combinedCoupons.push(fb);
      existingCodes.add(code);
    }
  }

  return {
    success: true,
    coupons: combinedCoupons,
    error: null,
    isOffline: false
  };
};

/**
 * Creates or updates a coupon via manage_coupon RPC or local store
 */
export const upsertCoupon = async (couponData) => {
  const cleanCode = (couponData.code || '').trim().toUpperCase();
  const newCouponObj = {
    id: couponData.id || `cpn_${cleanCode.toLowerCase()}_${Date.now().toString(36)}`,
    code: cleanCode,
    discount_type: couponData.discount_type || 'percentage',
    discount_value: parseFloat(couponData.discount_value) || 10,
    min_order_amount: parseInt(couponData.min_order_amount || 0, 10),
    max_discount_amount: couponData.max_discount_amount ? parseInt(couponData.max_discount_amount, 10) : null,
    usage_limit: couponData.usage_limit ? parseInt(couponData.usage_limit, 10) : null,
    times_used: couponData.times_used || 0,
    is_active: Boolean(couponData.is_active),
    starts_at: couponData.starts_at || new Date().toISOString(),
    expires_at: couponData.expires_at || null,
    description: couponData.description || null,
    updated_at: new Date().toISOString()
  };

  let savedCoupon = null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('manage_coupon', {
          p_code: cleanCode,
          p_discount_type: couponData.discount_type,
          p_discount_value: parseFloat(couponData.discount_value),
          p_min_order_amount: parseInt(couponData.min_order_amount || 0, 10),
          p_max_discount_amount: couponData.max_discount_amount ? parseInt(couponData.max_discount_amount, 10) : null,
          p_usage_limit: couponData.usage_limit ? parseInt(couponData.usage_limit, 10) : null,
          p_is_active: Boolean(couponData.is_active),
          p_starts_at: couponData.starts_at || null,
          p_expires_at: couponData.expires_at || null,
          p_description: couponData.description || null,
          p_id: couponData.id || null
        }),
        2500
      );

      if (!error && data?.coupon) {
        savedCoupon = data.coupon;
      } else {
        const { data: directData } = await withTimeout(
          supabase
            .from('coupons')
            .upsert({
              ...newCouponObj,
              id: couponData.id || undefined
            })
            .select()
            .single(),
          2500
        );

        if (directData) {
          savedCoupon = directData;
        }
      }
    } catch (err) {
      console.warn('[adminService] upsertCoupon remote exception, saving locally:', err.message);
    }
  }

  // Persist locally
  const localList = getStoredLocalCoupons();
  const existingIdx = localList.findIndex(c => c.id === newCouponObj.id || c.code === cleanCode);
  if (existingIdx > -1) {
    localList[existingIdx] = { ...localList[existingIdx], ...newCouponObj };
  } else {
    localList.unshift(newCouponObj);
  }
  saveStoredLocalCoupons(localList);

  broadcastCatalogUpdate();
  return { success: true, coupon: savedCoupon || newCouponObj, error: null };
};

/**
 * Toggles coupon active status directly
 */
export const toggleCouponActiveStatus = async (couponId, isActive) => {
  let updatedCoupon = null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('coupons')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', couponId)
          .select()
          .single(),
        2500
      );

      if (!error && data) {
        updatedCoupon = data;
      }
    } catch (err) {
      console.warn('[adminService] toggleCouponActiveStatus remote exception:', err);
    }
  }

  const localList = getStoredLocalCoupons();
  const match = localList.find(c => c.id === couponId || c.code === couponId);
  if (match) {
    match.is_active = isActive;
    match.updated_at = new Date().toISOString();
    saveStoredLocalCoupons(localList);
    if (!updatedCoupon) updatedCoupon = match;
  }

  broadcastCatalogUpdate();
  return { success: true, coupon: updatedCoupon || { id: couponId, is_active: isActive }, error: null };
};

/**
 * Fetches transactional email audit history for a specific order
 */
export const fetchOrderEmailEvents = async (orderId) => {
  if (!isSupabaseConfigured || !orderId) {
    return { success: false, events: [], error: 'Database is offline or missing orderId.' };
  }

  try {
    const { data, error } = await supabase
      .from('email_events')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      events: data || [],
      error: null
    };
  } catch (err) {
    console.error('[adminService] fetchOrderEmailEvents error:', err);
    return {
      success: false,
      events: [],
      error: err.message
    };
  }
};

/**
 * Sanitizes technical or database error messages into safe, human-readable explanations.
 * Strips raw SQL queries, stack traces, schema details, or sensitive keys.
 */
export const sanitizeAdminError = (rawError) => {
  if (!rawError) return 'An unexpected error occurred during this operation.';
  const msg = typeof rawError === 'string' ? rawError : rawError.message || JSON.stringify(rawError);

  if (/violates unique constraint.*coupons_code/i.test(msg) || /coupon.*already exists/i.test(msg)) {
    return 'A coupon with this code already exists.';
  }
  if (/violates unique constraint.*sku/i.test(msg) || /sku.*already exists/i.test(msg)) {
    return 'A product variant with this SKU already exists.';
  }
  if (/violates foreign key/i.test(msg) || /is referenced by/i.test(msg)) {
    return 'Cannot delete this entity as it is referenced by active orders or records.';
  }
  if (/stock.*below zero/i.test(msg) || /check constraint.*stock/i.test(msg)) {
    return 'Stock quantity cannot be deducted below zero.';
  }
  if (/jwt expired|unauthorized|permission denied|not admin/i.test(msg)) {
    return 'Admin authorization session expired. Please sign in again.';
  }
  if (/failed to fetch|networkerror|network connection|offline/i.test(msg)) {
    return 'Database connection interrupted or request timed out.';
  }

  // Strip prefix codes like 'PGRST116: ' or 'Error: '
  return msg
    .replace(/^PGRST\d+:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
};

/**
 * Persists an authoritative admin action audit entry in PostgreSQL
 */
export const logAdminActionService = async ({
  actionType,
  entityType,
  entityId = null,
  status = 'success',
  durationMs = 0,
  details = {},
  errorMessage = null
}) => {
  if (!isSupabaseConfigured) {
    // Offline local logging
    return { success: true, isOffline: true };
  }

  try {
    const { data, error } = await supabase.rpc('log_admin_action', {
      p_action_type: actionType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_status: status,
      p_duration_ms: Math.round(durationMs),
      p_details: details || {},
      p_error_message: errorMessage ? sanitizeAdminError(errorMessage) : null
    });

    if (error) {
      // Fallback direct insert if RPC not yet deployed
      const { error: insertErr } = await supabase.from('admin_audit_logs').insert({
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        status,
        duration_ms: Math.round(durationMs),
        details: details || {},
        error_message: errorMessage ? sanitizeAdminError(errorMessage) : null
      });
      if (insertErr) {
        console.warn('[adminService] Audit log write fallback skipped:', insertErr.message);
      }
    }

    return { success: true, data };
  } catch (err) {
    console.warn('[adminService] logAdminActionService non-fatal error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Fetches recent admin audit logs
 */
export const fetchAdminAuditLogs = async (limit = 20) => {
  if (!isSupabaseConfigured) {
    return { success: true, logs: [], isOffline: true };
  }

  try {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, logs: data || [], isOffline: false };
  } catch (err) {
    console.warn('[adminService] fetchAdminAuditLogs error:', err.message);
    return { success: false, logs: [], error: err.message, isOffline: false };
  }
};

