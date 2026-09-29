import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products.js';
import { buildFallbackVariants } from './productService.js';
import { getStoredInfluencers, recordInfluencerOrder } from './influencerService.js';

/**
 * LOOZARS® Order Service
 * Manages order submission, server-authoritative pricing verification,
 * and immutable order snapshots.
 */

// Fallback pricing registry for offline development
const FALLBACK_VARIANTS_MAP = STATIC_PRODUCTS.reduce((acc, p) => {
  const variants = buildFallbackVariants(p);
  variants.forEach(v => {
    acc[v.id] = { ...v, product: p };
    acc[`${p.id}-${v.size}`] = { ...v, product: p };
  });
  return acc;
}, {});

/**
 * Formats any raw order number string to clean LZR-0001 format
 * Examples:
 *   #LZR-20260929-0008 -> LZR-0008
 *   LZR-20260928-1302  -> LZR-1302
 *   #ORD-20260927-0001 -> LZR-0001
 *   LZR-0009           -> LZR-0009
 */
export const formatOrderNumber = (rawNum) => {
  if (!rawNum) return 'LZR-0001';
  const clean = String(rawNum).trim().replace(/^#/, '');

  if (/^LZR-\d{4}$/i.test(clean)) {
    return clean.toUpperCase();
  }

  const dateMatch = clean.match(/(?:LZR|ORD)-\d{8}-(\d{4})/i);
  if (dateMatch && dateMatch[1]) {
    return `LZR-${dateMatch[1]}`;
  }

  const simpleMatch = clean.match(/LZR-(\d+)/i);
  if (simpleMatch && simpleMatch[1]) {
    return `LZR-${String(simpleMatch[1]).padStart(4, '0')}`;
  }

  const digitsMatch = clean.match(/\d+/g);
  if (digitsMatch) {
    const lastDigits = digitsMatch[digitsMatch.length - 1].slice(-4);
    return `LZR-${lastDigits.padStart(4, '0')}`;
  }

  return clean.toUpperCase();
};

export const DEFAULT_INITIAL_ORDERS = [];

/**
 * Retrieves all orders saved in persistent local storage with clean LZR-0001 numbering
 */
export const getStoredOrders = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('loozars_store_orders_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any legacy synthetic seed orders
    const validOrders = parsed.filter(o => {
      if (!o || typeof o !== 'object') return false;
      const id = String(o.id || '');
      if (id.startsWith('ord_lzr_000') || id.startsWith('ord_lzr_00')) return false;
      return true;
    });

    return validOrders.map(o => {
      const cleanNum = formatOrderNumber(o.order_number || o.orderNumber || o.orderId);
      return {
        ...o,
        order_number: cleanNum,
        orderNumber: cleanNum,
        orderId: cleanNum
      };
    });
  } catch (e) {
    console.warn('[orderService] Error parsing stored orders:', e);
    return [];
  }
};

/**
 * Persists an authoritative order snapshot to localStorage and broadcasts update event
 */
export const saveStoredOrder = (order) => {
  if (typeof window === 'undefined' || !order) return;
  try {
    const orders = getStoredOrders();
    const rawNum = order.order_number || order.orderNumber || order.orderId;
    if (!rawNum) return;

    const cleanOrderNum = formatOrderNumber(rawNum);
    const existingIdx = orders.findIndex(o => (o.order_number || o.orderNumber || o.orderId) === cleanOrderNum);

    const normalizedOrder = {
      id: order.id || order.order_id || order.dbOrderId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord_${Date.now()}`),
      order_number: cleanOrderNum,
      customer_name: order.customer_name || order.customerName || `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim() || 'Customer',
      customer_email: order.customer_email || order.customerEmail || order.shippingAddress?.email || '',
      customer_phone: order.customer_phone || order.customerPhone || order.shippingAddress?.phone || '',
      shipping_address: order.shipping_address || order.shippingAddress || {},
      items: order.items || [],
      subtotal_amount: Number(order.subtotal_amount ?? order.subtotal ?? 0),
      discount_amount: Number(order.discount_amount ?? order.discount ?? 0),
      shipping_fee: Number(order.shipping_fee ?? order.shipping ?? 0),
      total_amount: Number(order.total_amount ?? order.total ?? 0),
      coupon_code: order.coupon_code || order.couponCode || null,
      payment_method: order.payment_method || order.paymentMethod || 'upi',
      payment_status: order.payment_status || order.paymentStatus || 'pending',
      order_status: order.order_status || order.orderStatus || 'confirmed',
      influencer_id: order.influencer_id || order.influencerId || null,
      influencer_commission_amount: Number(order.influencer_commission_amount || order.influencerCommission || 0),
      tracking_number: order.tracking_number || order.trackingNumber || null,
      courier_name: order.courier_name || order.courierName || null,
      notes: order.notes || null,
      created_at: order.created_at || order.createdAt || new Date().toISOString()
    };

    if (existingIdx !== -1) {
      orders[existingIdx] = { ...orders[existingIdx], ...normalizedOrder };
    } else {
      orders.unshift(normalizedOrder);
    }

    localStorage.setItem('loozars_store_orders_v1', JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('loozars_orders_updated', { detail: { order: normalizedOrder } }));
    window.dispatchEvent(new CustomEvent('loozars_catalog_updated'));
  } catch (e) {
    console.warn('[orderService] Error saving stored order:', e);
  }
};

/**
 * Clean, sequential order number generator for local fallback: LZR-0001, LZR-0002...
 */
const generateFallbackOrderNumber = () => {
  const orders = getStoredOrders();
  const nextNum = orders.length + 1;
  return `LZR-${String(nextNum).padStart(4, '0')}`;
};

/**
 * Creates an authoritative order via Vercel Serverless API (/api/create-order) or Supabase (with fallback)
 */
export const createOrder = async (payload) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items,
    couponCode,
    paymentMethod = 'upi',
    notes = '',
    idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  } = payload;

  if (!items || items.length === 0) {
    return { data: null, error: 'Your shopping bag is empty.', source: 'client_validation' };
  }

  // 1. Priority Authoritative Backend: /api/create-order
  try {
    const apiRes = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items,
        couponCode: couponCode || null,
        paymentMethod,
        notes,
        idempotencyKey
      })
    });

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData?.success && apiData.order) {
        const fullOrder = {
          ...apiData.order,
          order_number: formatOrderNumber(apiData.order.order_number),
          _syncedToDb: true
        };
        saveStoredOrder(fullOrder);
        return {
          data: fullOrder,
          error: null,
          source: 'vercel_serverless_api'
        };
      }
    }
  } catch (apiErr) {
    console.warn('[orderService] /api/create-order call notice:', apiErr.message);
  }

  // 2. Direct Supabase Table Insert Flow
  if (isSupabaseConfigured) {
    try {
      const nextNum = generateFallbackOrderNumber();
      let subtotal = 0;
      const snapshotItems = [];

      for (const item of items) {
        const unitPrice = Number(item.price || item.unitPrice || 899);
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;

        snapshotItems.push({
          product_id: item.productId || '00000000-0000-0000-0000-000000000001',
          product_slug: item.productSlug || 'lzr-velo-07',
          variant_id: item.variantId || 'cabc5e4a-5347-47ca-845c-a44103124761',
          sku: item.sku || `LZR-D01-${item.size || 'M'}`,
          product_name: item.name || 'LOOZARS Silhouette',
          size: item.size || 'M',
          quantity: qty,
          unit_price: unitPrice,
          line_total: lineTotal,
          image: item.image || ''
        });
      }

      let discount = 0;
      if (couponCode) {
        const clean = String(couponCode).toUpperCase().trim();
        if (clean === 'DROP01' || clean === 'LOOZAR10') discount = Math.round(subtotal * 0.1);
        else if (clean === 'LOOZAR100') discount = Math.min(500, subtotal);
      }

      const netSubtotal = Math.max(0, subtotal - discount);
      const shippingFee = (netSubtotal >= 2000 || netSubtotal === 0) ? 0 : 99;
      const totalAmount = netSubtotal + shippingFee;

      const directOrderRow = {
        order_number: nextNum,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: shippingAddress || {},
        items: snapshotItems,
        subtotal_amount: subtotal,
        discount_amount: discount,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        coupon_code: couponCode || null,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
        order_status: 'confirmed',
        idempotency_key: idempotencyKey,
        notes: notes || null,
        created_at: new Date().toISOString()
      };

      const { data: dbOrder, error: dbErr } = await supabase
        .from('orders')
        .insert(directOrderRow)
        .select()
        .single();

      if (!dbErr && dbOrder) {
        const fullOrder = { ...dbOrder, _syncedToDb: true };
        saveStoredOrder(fullOrder);
        return {
          data: fullOrder,
          error: null,
          source: 'supabase_direct_insert'
        };
      }
    } catch (err) {
      console.warn('[orderService] Supabase direct insert notice:', err.message);
    }
  }

  // 3. Offline Local Fallback
  let subtotal = 0;
  const snapshotItems = [];

  for (const item of items) {
    const entry = (item.variantId && FALLBACK_VARIANTS_MAP[item.variantId]) || 
                  (item.productId && item.size && FALLBACK_VARIANTS_MAP[`${item.productId}-${item.size}`]) || 
                  STATIC_PRODUCTS.find(p => p.id === item.productId || p.db_id === item.productId);

    const product = entry ? (entry.product || entry) : (item.product || {
      id: item.productId || `prod-${Date.now()}`,
      name: item.name || 'LOOZARS Archive Apparel',
      price: item.price || item.unitPrice || 899,
      sku: item.sku || 'LZR',
      images: [item.image || '']
    });

    const unitPrice = Number(entry?.priceOverride || product.price || item.price || item.unitPrice || 899);
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;

    snapshotItems.push({
      product_id: product.id || item.productId || 'prod-default',
      product_slug: product.id || item.productId || 'lzr-velo-07',
      variant_id: item.variantId || `var-${product.id || 'item'}-${item.size || 'M'}`,
      sku: `${product.sku || item.sku || 'LZR'}-${item.size || 'M'}`,
      product_name: product.name || item.name || 'LOOZARS Archive Apparel',
      subtitle: product.subtitle || '',
      size: item.size || 'M',
      quantity: qty,
      unit_price: unitPrice,
      line_total: lineTotal,
      image: product.images?.[0] || item.image || ''
    });
  }

  let discount = 0;
  if (couponCode && String(couponCode).trim()) {
    const cleanCoupon = String(couponCode).toUpperCase().trim();
    if (cleanCoupon === 'DROP01' || cleanCoupon === 'LOOZAR10') {
      discount = Math.round(subtotal * 0.1);
    } else if (cleanCoupon === 'LOOZAR100') {
      discount = Math.min(500, subtotal);
    }
  }

  discount = Math.min(subtotal, Math.max(0, discount));
  const netSubtotal = Math.max(0, subtotal - discount);
  const shippingFee = (netSubtotal >= 2000 || netSubtotal === 0) ? 0 : 99;
  const total = netSubtotal + shippingFee;
  const orderNumber = generateFallbackOrderNumber();

  const simulatedOrder = {
    id: `ord_${Date.now()}`,
    order_id: `ord_${Date.now()}`,
    order_number: orderNumber,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    shipping_address: shippingAddress,
    subtotal_amount: subtotal,
    discount_amount: discount,
    shipping_fee: shippingFee,
    total_amount: total,
    coupon_code: couponCode || null,
    payment_method: paymentMethod,
    payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
    order_status: 'confirmed',
    items: snapshotItems,
    created_at: new Date().toISOString()
  };

  saveStoredOrder(simulatedOrder);

  return {
    data: simulatedOrder,
    error: null,
    source: 'local_dev_fallback'
  };
};
