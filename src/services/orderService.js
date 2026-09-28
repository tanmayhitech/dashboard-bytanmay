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

 * Retrieves all orders saved in persistent local storage
 */
export const getStoredOrders = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('loozars_store_orders_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[orderService] Error parsing stored orders:', e);
    return [];
  }
};

/**
 * Persists an order snapshot to localStorage and broadcasts update event
 */
export const saveStoredOrder = (order) => {
  if (typeof window === 'undefined' || !order) return;
  try {
    const orders = getStoredOrders();
    const orderNum = order.order_number || order.orderNumber || order.orderId;
    if (!orderNum) return;

    const existingIdx = orders.findIndex(o => (o.order_number || o.orderNumber || o.orderId) === orderNum);

    const normalizedOrder = {
      id: order.id || order.order_id || order.dbOrderId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord_${Date.now()}`),
      order_number: orderNum,
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

 * Deterministic date formatter for order numbers
 */
const generateFallbackOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `#LZR-${year}${month}${day}-${rand}`;
};

/**
 * Creates an authoritative order via Supabase Edge Function or RPC (with fallback simulation)
 * 
 * @param {object} payload
 * @param {string} payload.customerName
 * @param {string} payload.customerEmail
 * @param {string} payload.customerPhone
 * @param {object} payload.shippingAddress
 * @param {Array<{ productId: string, variantId: string, quantity: number }>} payload.items
 * @param {string} [payload.couponCode]
 * @param {string} [payload.paymentMethod='upi']
 * @param {string} [payload.notes]
 * @param {string} [payload.idempotencyKey]
 * @returns {Promise<{ data: object|null, error: string|null, source: string }>}
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

  // Basic client pre-check
  if (!items || items.length === 0) {
    return { data: null, error: 'Your shopping bag is empty.', source: 'client_validation' };
  }

  // 1. Live Supabase Flow
  if (isSupabaseConfigured) {
    try {
      // First attempt: Supabase Edge Function
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-order', {
        body: {
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity
          })),
          couponCode,
          paymentMethod,
          notes,
          idempotencyKey
        }
      });

      if (!edgeError && edgeData?.success && edgeData.order) {
        return {
          data: edgeData.order,
          error: null,
          source: 'supabase_edge_function'
        };
      }

      // If Edge Function is not deployed yet, try direct RPC fallback if available
      if (edgeError || !edgeData?.success) {
        console.warn('[orderService] Edge Function unavailable, attempting direct Supabase RPC:', edgeError?.message || edgeData?.error);
        
        const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const hasValidUUIDs = items.every(i => isUUID(i.productId) && isUUID(i.variantId));

        if (hasValidUUIDs) {
          // Format for direct RPC call
          const formattedItems = items.map(i => ({
            product_id: i.productId,
            variant_id: i.variantId,
            quantity: parseInt(i.quantity, 10)
          }));

          const { data: rpcData, error: rpcError } = await supabase.rpc('create_order_transaction', {
            p_customer_name: customerName,
            p_customer_email: customerEmail,
            p_customer_phone: customerPhone,
            p_shipping_address: shippingAddress,
            p_items: formattedItems,
            p_coupon_code: couponCode || null,
            p_payment_method: paymentMethod,
            p_notes: notes || null,
            p_idempotency_key: idempotencyKey,
            p_free_shipping_threshold: 2000,
            p_standard_shipping_fee: 99
          });

          if (!rpcError && rpcData?.success) {
            return {
              data: rpcData,
              error: null,
              source: 'supabase_rpc_direct'
            };
          }
          console.warn('[orderService] Direct RPC failed:', rpcError?.message);
        } else {
          console.info('[orderService] Items contain local catalog keys; using local authoritative order calculation.');
        }
      }
    } catch (err) {
      console.warn('[orderService] Supabase remote order attempt caught error, proceeding with local calculation:', err.message);
    }
  }

  // 2. Development Fallback Flow (Simulated Server-Authoritative Logic)
  console.info('[orderService] Running in local development mode — generating authoritative fallback order transaction.');

  let subtotal = 0;
  const snapshotItems = [];

  for (const item of items) {
    const entry = (item.variantId && FALLBACK_VARIANTS_MAP[item.variantId]) || 
                  (item.productId && item.size && FALLBACK_VARIANTS_MAP[`${item.productId}-${item.size}`]) || 
                  STATIC_PRODUCTS.find(p => p.id === item.productId || p.db_id === item.productId) ||
                  (item.product ? { product: item.product, ...item.product } : null);

    const product = entry ? (entry.product || entry) : (item.product || {
      id: item.productId || `prod-${Date.now()}`,
      name: item.name || 'LOOZARS Archive Apparel',
      price: item.price || item.unitPrice || 899,
      sku: item.sku || 'LZR',
      images: [item.image || '']
    });

    const unitPrice = entry?.priceOverride || product.price || item.price || item.unitPrice || 899;
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;

    snapshotItems.push({
      product_id: product.id || item.productId,
      product_slug: product.id || item.productId,
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

  // Server-side simulated coupon & creator commission logic
  let discount = 0;
  let influencerId = null;
  let influencerCommission = 0;

  if (couponCode) {
    const cleanCoupon = String(couponCode).toUpperCase().trim();
    if (cleanCoupon === 'DROP01' || cleanCoupon === 'LOOZAR10') {
      discount = Math.round(subtotal * 0.1);
    } else if (cleanCoupon === 'LOOZAR100') {
      discount = Math.min(500, subtotal);
    } else {
      const storedInfs = getStoredInfluencers();
      const match = storedInfs.find(i => i.is_active && (i.coupon_code || '').toUpperCase() === cleanCoupon);
      if (match) {
        influencerId = match.id;
        const discVal = Number(match.customer_discount_value || 10);
        discount = (match.customer_discount_type === 'percentage') 
          ? Math.round((subtotal * discVal) / 100) 
          : Math.min(subtotal, Math.round(discVal));

        const commVal = Number(match.commission_value || 8);
        const commBase = Math.max(0, subtotal - discount);
        influencerCommission = (match.commission_type === 'percentage')
          ? Math.round((commBase * commVal) / 100)
          : Math.round(commVal);
      }
    }
  }

  discount = Math.min(subtotal, Math.max(0, discount));
  const netSubtotal = Math.max(0, subtotal - discount);
  const shippingFee = netSubtotal >= 2000 || netSubtotal === 0 ? 0 : 99;
  const total = netSubtotal + shippingFee;
  const orderNumber = generateFallbackOrderNumber();

  // If order was attributed to an influencer, record commission & metrics immediately!
  if (couponCode && (influencerId || discount > 0)) {
    recordInfluencerOrder({
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      items: snapshotItems,
      subtotalAmount: subtotal,
      discountAmount: discount,
      totalAmount: total,
      couponCode,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid'
    }).catch(e => console.warn('[orderService] Error recording influencer commission:', e));
  }

  const simulatedOrder = {
    order_id: `dev_${Date.now()}`,
    order_number: orderNumber,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    shipping_address: shippingAddress,
    subtotal_amount: subtotal,
    discount_amount: discount,
    shipping_fee: shippingFee,
    total_amount: total,
    payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
    order_status: 'confirmed',
    influencer_id: influencerId,
    influencer_commission_amount: influencerCommission,
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

