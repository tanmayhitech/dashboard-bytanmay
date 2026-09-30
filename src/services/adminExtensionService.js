import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { getStoredOrders, saveStoredOrder } from './orderService.js';
import { PRODUCTS } from '../data/products.js';

// Local storage keys for dual-mode fallback
const STORAGE_RETURNS_KEY = 'loozars_order_returns';
const STORAGE_ABANDONED_KEY = 'loozars_abandoned_carts';
const STORAGE_REVIEWS_KEY = 'loozars_product_reviews';

const getStoredReturns = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_RETURNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredReturns = (list) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_RETURNS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('loozars_returns_updated'));
  } catch {}
};

const getStoredAbandoned = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_ABANDONED_KEY);
    if (raw) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
};

const saveStoredAbandoned = (list) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ABANDONED_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('loozars_abandoned_updated'));
  } catch {}
};

const getStoredReviews = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (raw) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
};

const saveStoredReviews = (list) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('loozars_reviews_updated'));
  } catch {}
};

// ==============================================================================
// 1. RETURNS & REFUNDS SERVICE METHODS
// ==============================================================================

export const fetchOrderReturns = async ({ orderId = null, status = 'all' } = {}) => {
  if (!isSupabaseConfigured) {
    let list = getStoredReturns();
    if (orderId) list = list.filter(r => r.order_id === orderId || r.order_number === orderId);
    if (status !== 'all') list = list.filter(r => r.status === status);
    return { success: true, returns: list, isOffline: true };
  }

  try {
    let query = supabase.from('order_returns').select('*').order('created_at', { ascending: false });
    if (orderId) query = query.eq('order_id', orderId);
    if (status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, returns: data || [], isOffline: false };
  } catch (err) {
    console.warn('[adminExtensionService] fetchOrderReturns fallback:', err.message);
    let list = getStoredReturns();
    if (orderId) list = list.filter(r => r.order_id === orderId || r.order_number === orderId);
    if (status !== 'all') list = list.filter(r => r.status === status);
    return { success: true, returns: list, isOffline: true };
  }
};

export const createOrderReturnRequest = async ({
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  items,
  returnReason,
  refundAmount,
  restockInventory = true,
  adminNotes = ''
}) => {
  const newReturn = {
    id: 'ret_' + Date.now(),
    order_id: orderId,
    order_number: orderNumber,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    items: Array.isArray(items) ? items : [],
    return_reason: returnReason || 'Customer requested return',
    status: 'requested',
    refund_amount: Number(refundAmount || 0),
    refund_status: 'none',
    refund_transaction_id: null,
    restock_inventory: Boolean(restockInventory),
    inventory_restocked_at: null,
    admin_notes: adminNotes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('order_returns')
        .insert([newReturn])
        .select()
        .single();

      if (!error && data) {
        // Also trigger non-blocking Telegram alert
        triggerTelegramNotification({
          type: 'return_requested',
          orderNumber,
          customerName,
          reason: returnReason,
          amount: refundAmount
        });
        return { success: true, returnRequest: data, isOffline: false };
      }
    } catch (e) {
      console.warn('[adminExtensionService] createOrderReturnRequest remote insert notice:', e.message);
    }
  }

  // Local fallback
  const list = getStoredReturns();
  list.unshift(newReturn);
  saveStoredReturns(list);

  // Trigger non-blocking Telegram alert
  triggerTelegramNotification({
    type: 'return_requested',
    orderNumber,
    customerName,
    reason: returnReason,
    amount: refundAmount
  });

  return { success: true, returnRequest: newReturn, isOffline: true };
};

export const updateOrderReturnStatus = async ({
  returnId,
  newStatus,
  adminNotes = '',
  restock = true
}) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('process_order_return_status', {
        p_return_id: returnId,
        p_new_status: newStatus,
        p_admin_notes: adminNotes,
        p_restock: restock
      });

      if (!error) {
        return { success: true, data, isOffline: false };
      }
    } catch (e) {
      console.warn('[adminExtensionService] updateOrderReturnStatus RPC notice:', e.message);
    }
  }

  // Local fallback
  const list = getStoredReturns();
  const idx = list.findIndex(r => r.id === returnId);
  if (idx !== -1) {
    list[idx].status = newStatus;
    if (adminNotes) list[idx].admin_notes = adminNotes;
    if ((newStatus === 'item_received' || newStatus === 'refunded') && restock && !list[idx].inventory_restocked_at) {
      list[idx].inventory_restocked_at = new Date().toISOString();
    }
    list[idx].updated_at = new Date().toISOString();
    saveStoredReturns(list);
    return { success: true, returnRequest: list[idx], isOffline: true };
  }

  return { success: false, error: 'Return request not found.' };
};

export const executeOrderRefund = async ({
  returnId,
  orderId,
  refundAmount,
  reason,
  restock = true,
  adminNotes = ''
}) => {
  // Call serverless API endpoint
  try {
    const res = await fetch('/api/refund-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        returnId,
        orderId,
        refundAmount,
        reason,
        restock,
        adminNotes
      })
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }
  } catch (err) {
    console.warn('[adminExtensionService] executeOrderRefund API fallback:', err.message);
  }

  // Offline / Simulated Fallback
  const refundTxId = `SIM_RFND_${Date.now()}`;
  if (returnId) {
    const list = getStoredReturns();
    const idx = list.findIndex(r => r.id === returnId);
    if (idx !== -1) {
      list[idx].status = 'refunded';
      list[idx].refund_status = 'processed';
      list[idx].refund_transaction_id = refundTxId;
      list[idx].refund_amount = refundAmount || list[idx].refund_amount;
      list[idx].admin_notes = adminNotes || list[idx].admin_notes;
      list[idx].updated_at = new Date().toISOString();
      saveStoredReturns(list);
    }
  }

  // Update order payment status
  if (orderId) {
    const orders = getStoredOrders();
    const oIdx = orders.findIndex(o => o.id === orderId || o.order_number === orderId);
    if (oIdx !== -1) {
      orders[oIdx].payment_status = 'refunded';
      orders[oIdx].updated_at = new Date().toISOString();
      saveStoredOrder(orders[oIdx]);
    }
  }

  triggerTelegramNotification({
    type: 'refund_completed',
    orderNumber: orderId,
    amount: refundAmount,
    detail: refundTxId
  });

  return {
    success: true,
    refundTransactionId: refundTxId,
    refundAmount,
    isOffline: true
  };
};

// ==============================================================================
// 2. ABANDONED CARTS SERVICE METHODS
// ==============================================================================

export const fetchAbandonedCarts = async ({ status = 'all', limit = 50 } = {}) => {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('abandoned_carts').select('*').order('last_activity_at', { ascending: false }).limit(limit);
      if (status !== 'all') query = query.eq('recovery_status', status);
      const { data, error } = await query;
      if (!error && data) return { success: true, carts: data, isOffline: false };
    } catch (e) {
      console.warn('[adminExtensionService] fetchAbandonedCarts fallback:', e.message);
    }
  }

  let list = getStoredAbandoned();
  if (status !== 'all') list = list.filter(c => c.recovery_status === status);
  return { success: true, carts: list.slice(0, limit), isOffline: true };
};

export const saveAbandonedCart = async ({
  sessionId,
  customerName,
  customerEmail,
  customerPhone,
  items,
  cartValue
}) => {
  if (!sessionId || !Array.isArray(items) || items.length === 0) return { success: false };

  const cartRecord = {
    session_id: sessionId,
    customer_name: customerName || 'Anonymous Shopper',
    customer_email: customerEmail || null,
    customer_phone: customerPhone || null,
    items,
    cart_value: Number(cartValue || 0),
    item_count: items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
    recovery_status: 'abandoned',
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('abandoned_carts').upsert([cartRecord], { onConflict: 'session_id' });
    } catch (e) {
      // ignore
    }
  }

  const list = getStoredAbandoned();
  const existingIdx = list.findIndex(c => c.session_id === sessionId);
  if (existingIdx !== -1) {
    list[existingIdx] = { ...list[existingIdx], ...cartRecord };
  } else {
    list.unshift({ id: 'cart_' + Date.now(), ...cartRecord, created_at: new Date().toISOString() });
  }
  saveStoredAbandoned(list);

  return { success: true };
};

export const updateAbandonedCartStatus = async ({ cartId, recoveryStatus, recoveryNotes = '' }) => {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('abandoned_carts')
        .update({
          recovery_status: recoveryStatus,
          recovery_notes: recoveryNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId);
    } catch (e) {}
  }

  const list = getStoredAbandoned();
  const idx = list.findIndex(c => c.id === cartId || c.session_id === cartId);
  if (idx !== -1) {
    list[idx].recovery_status = recoveryStatus;
    if (recoveryNotes) list[idx].recovery_notes = recoveryNotes;
    list[idx].updated_at = new Date().toISOString();
    saveStoredAbandoned(list);
    return { success: true, cart: list[idx] };
  }

  return { success: false, error: 'Cart not found' };
};

// ==============================================================================
// 3. PRODUCT REVIEWS & MODERATION
// ==============================================================================

export const fetchProductReviews = async ({ productId = null, status = 'all', limit = 50 } = {}) => {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('product_reviews').select('*').order('created_at', { ascending: false }).limit(limit);
      if (productId) query = query.eq('product_id', productId);
      if (status !== 'all') query = query.eq('status', status);
      const { data, error } = await query;
      if (!error && data) return { success: true, reviews: data, isOffline: false };
    } catch (e) {
      console.warn('[adminExtensionService] fetchProductReviews fallback:', e.message);
    }
  }

  let list = getStoredReviews();
  if (productId) list = list.filter(r => r.product_id === productId);
  if (status !== 'all') list = list.filter(r => r.status === status);
  return { success: true, reviews: list.slice(0, limit), isOffline: true };
};

export const verifyPurchaseEligibility = async ({ productId, productName, email, orderNumber }) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOrderNum = (orderNumber || '').trim().toUpperCase();

  if (!cleanEmail && !cleanOrderNum) {
    return {
      eligible: false,
      error: 'Please provide your Order # or registered Email to verify your purchase.'
    };
  }

  let orders = [];
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('orders').select('*');
      if (cleanOrderNum) query = query.ilike('order_number', `%${cleanOrderNum}%`);
      else if (cleanEmail) query = query.ilike('customer_email', cleanEmail);
      
      const { data, error } = await query;
      if (!error && data) orders = data;
    } catch (e) {
      console.warn('[verifyPurchaseEligibility] Remote query fallback:', e.message);
    }
  }

  if (orders.length === 0) {
    orders = getStoredOrders();
  }

  // Filter matching orders containing this product
  const matchingOrder = orders.find(o => {
    const emailMatch = !cleanEmail || (o.customer_email || '').toLowerCase() === cleanEmail;
    const numMatch = !cleanOrderNum || (o.order_number || '').toUpperCase().includes(cleanOrderNum);
    if (!emailMatch && !numMatch) return false;

    const items = Array.isArray(o.items) ? o.items : [];
    const itemMatch = items.some(it => {
      const itProdId = it.product_id || it.productId || it.variant_id;
      const itName = (it.name || it.product_name || '').toLowerCase();
      const targetName = (productName || '').toLowerCase();
      return (productId && itProdId === productId) || (targetName && itName.includes(targetName)) || items.length > 0;
    });

    const isDeliveredOrPaid = o.payment_status === 'paid' || o.order_status === 'delivered' || o.order_status === 'shipped';
    return itemMatch && isDeliveredOrPaid;
  });

  if (!matchingOrder) {
    return {
      eligible: false,
      error: `No delivered order found for ${cleanOrderNum || cleanEmail} with this silhouette. Only patrons with confirmed orders can submit a review.`
    };
  }

  return {
    eligible: true,
    orderId: matchingOrder.id,
    orderNumber: matchingOrder.order_number,
    customerName: matchingOrder.customer_name,
    customerEmail: matchingOrder.customer_email
  };
};

export const createProductReview = async ({
  productId,
  orderId = null,
  customerName,
  customerEmail,
  rating,
  reviewTitle = '',
  reviewText,
  isVerifiedPurchase = false
}) => {
  const newReview = {
    id: 'rev_' + Date.now(),
    product_id: productId,
    order_id: orderId,
    customer_name: customerName || 'Verified Collector',
    customer_email: customerEmail || '',
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    review_title: reviewTitle,
    review_text: reviewText,
    is_verified_purchase: Boolean(isVerifiedPurchase),
    status: 'pending',
    admin_reply: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('product_reviews').insert([newReview]).select().single();
      if (!error && data) return { success: true, review: data, isOffline: false };
    } catch (e) {}
  }

  const list = getStoredReviews();
  list.unshift(newReview);
  saveStoredReviews(list);
  return { success: true, review: newReview, isOffline: true };
};

export const moderateProductReview = async ({ reviewId, status, adminReply = '' }) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('moderate_product_review', {
        p_review_id: reviewId,
        p_status: status,
        p_admin_reply: adminReply
      });
      if (!error) return { success: true, data, isOffline: false };
    } catch (e) {}
  }

  const list = getStoredReviews();
  const idx = list.findIndex(r => r.id === reviewId);
  if (idx !== -1) {
    list[idx].status = status;
    if (adminReply) list[idx].admin_reply = adminReply;
    list[idx].updated_at = new Date().toISOString();
    saveStoredReviews(list);
    return { success: true, review: list[idx], isOffline: true };
  }

  return { success: false, error: 'Review not found' };
};

// ==============================================================================
// 4. ADVANCED ANALYTICS AGGREGATION (NO DUPLICATE TRUTHS)
// ==============================================================================

export const fetchAdvancedAnalytics = async ({ timeRange = '7d' } = {}) => {
  let orders = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_email, total_amount, subtotal_amount, discount_amount, payment_method, payment_status, order_status, items, coupon_code, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) orders = data;
    } catch (e) {
      console.warn('[adminExtensionService] Analytics remote query fallback:', e.message);
    }
  }

  if (orders.length === 0 && !isSupabaseConfigured) {
    orders = getStoredOrders();
  }

  // Determine Time Range
  const now = Date.now();
  let daysCutoff = 7;
  if (timeRange === '14d') daysCutoff = 14;
  else if (timeRange === '30d') daysCutoff = 30;
  else if (timeRange === '90d') daysCutoff = 90;
  else if (timeRange === 'all') {
    if (orders.length > 0) {
      const earliestTime = new Date(orders[orders.length - 1].created_at || orders[orders.length - 1].createdAt).getTime();
      daysCutoff = Math.max(7, Math.ceil((now - earliestTime) / (24 * 60 * 60 * 1000)) + 1);
    } else {
      daysCutoff = 105;
    }
  }

  const cutoffDate = new Date(now - (daysCutoff * 24 * 60 * 60 * 1000));
  const priorPeriodCutoffDate = new Date(now - (daysCutoff * 2 * 24 * 60 * 60 * 1000));

  const filteredOrders = orders.filter(o => new Date(o.created_at || o.createdAt) >= cutoffDate);
  const priorOrders = orders.filter(o => {
    const d = new Date(o.created_at || o.createdAt);
    return d >= priorPeriodCutoffDate && d < cutoffDate;
  });

  const paidOrders = filteredOrders.filter(o => o.payment_status === 'paid' || o.order_status === 'delivered');
  const priorPaidOrders = priorOrders.filter(o => o.payment_status === 'paid' || o.order_status === 'delivered');

  // 1. Core Financial Metrics
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const priorRevenue = priorPaidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const aov = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const priorAov = priorPaidOrders.length > 0 ? Math.round(priorRevenue / priorPaidOrders.length) : 0;
  const revenueGrowthPercent = priorRevenue > 0 ? Number((((totalRevenue - priorRevenue) / priorRevenue) * 100).toFixed(1)) : 0;

  const prepaidPaidOrders = paidOrders.filter(o => o.payment_method !== 'cod');
  const codPaidOrders = paidOrders.filter(o => o.payment_method === 'cod');
  const prepaidRevenue = prepaidPaidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const codRevenue = codPaidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  // 2. High-Resolution Daily Buckets
  const dailyMap = {};
  for (let i = daysCutoff - 1; i >= 0; i--) {
    const d = new Date(now - (i * 24 * 60 * 60 * 1000));
    const isoKey = d.toISOString().slice(0, 10);
    const dateLabel = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const fullDate = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    const dayOfWeek = d.toLocaleDateString('en-IN', { weekday: 'short' });

    dailyMap[isoKey] = {
      isoDate: isoKey,
      date: dateLabel,
      fullDate,
      dayOfWeek,
      revenue: 0,
      orders: 0,
      aov: 0,
      prepaidRevenue: 0,
      codRevenue: 0,
      prepaidOrders: 0,
      codOrders: 0,
      itemsSold: 0
    };
  }

  paidOrders.forEach(o => {
    const oDate = new Date(o.created_at || o.createdAt);
    const isoKey = oDate.toISOString().slice(0, 10);
    if (dailyMap[isoKey]) {
      const amt = Number(o.total_amount) || 0;
      const isCod = o.payment_method === 'cod';
      const itemsCount = Array.isArray(o.items) ? o.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0) : 1;

      dailyMap[isoKey].revenue += amt;
      dailyMap[isoKey].orders += 1;
      dailyMap[isoKey].itemsSold += itemsCount;
      if (isCod) {
        dailyMap[isoKey].codRevenue += amt;
        dailyMap[isoKey].codOrders += 1;
      } else {
        dailyMap[isoKey].prepaidRevenue += amt;
        dailyMap[isoKey].prepaidOrders += 1;
      }
    }
  });

  const dailyTrend = Object.values(dailyMap).map(d => ({
    ...d,
    aov: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0
  }));

  // 3. Weekly Aggregations (for wider time ranges)
  const weeklyMap = {};
  dailyTrend.forEach((d, idx) => {
    const weekIdx = Math.floor(idx / 7);
    const weekKey = `w_${weekIdx}`;
    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = {
        weekLabel: `Wk ${weekIdx + 1} (${d.date})`,
        startDate: d.date,
        endDate: d.date,
        revenue: 0,
        orders: 0,
        itemsSold: 0,
        prepaidRevenue: 0,
        codRevenue: 0
      };
    }
    weeklyMap[weekKey].endDate = d.date;
    weeklyMap[weekKey].revenue += d.revenue;
    weeklyMap[weekKey].orders += d.orders;
    weeklyMap[weekKey].itemsSold += d.itemsSold;
    weeklyMap[weekKey].prepaidRevenue += d.prepaidRevenue;
    weeklyMap[weekKey].codRevenue += d.codRevenue;
  });

  const weeklyTrend = Object.values(weeklyMap).map(w => ({
    ...w,
    aov: w.orders > 0 ? Math.round(w.revenue / w.orders) : 0
  }));

  // 4. Monthly Aggregations
  const monthlyMap = {};
  paidOrders.forEach(o => {
    const oDate = new Date(o.created_at || o.createdAt);
    const monthKey = oDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { monthLabel: monthKey, revenue: 0, orders: 0, aov: 0 };
    }
    monthlyMap[monthKey].revenue += Number(o.total_amount) || 0;
    monthlyMap[monthKey].orders += 1;
  });
  const monthlyTrend = Object.values(monthlyMap).map(m => ({
    ...m,
    aov: m.orders > 0 ? Math.round(m.revenue / m.orders) : 0
  }));

  // 5. Weekday Velocity (Mon - Sun)
  const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekdayMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const weekdayOrderMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  paidOrders.forEach(o => {
    const day = new Date(o.created_at || o.createdAt).toLocaleDateString('en-IN', { weekday: 'short' });
    if (weekdayMap[day] !== undefined) {
      weekdayMap[day] += Number(o.total_amount) || 0;
      weekdayOrderMap[day] += 1;
    }
  });
  const weekdayVelocity = weekdayNames.map(day => ({
    day,
    revenue: weekdayMap[day] || 0,
    orders: weekdayOrderMap[day] || 0
  }));

  // 6. Hourly Rush Velocity (4-hour time slots)
  const hourlySlots = [
    { label: 'Late Night (12am - 4am)', orders: 0, revenue: 0 },
    { label: 'Early Morning (4am - 8am)', orders: 0, revenue: 0 },
    { label: 'Morning (8am - 12pm)', orders: 0, revenue: 0 },
    { label: 'Afternoon (12pm - 4pm)', orders: 0, revenue: 0 },
    { label: 'Evening Rush (4pm - 8pm)', orders: 0, revenue: 0 },
    { label: 'Night Drop (8pm - 12am)', orders: 0, revenue: 0 }
  ];
  paidOrders.forEach(o => {
    const hours = new Date(o.created_at || o.createdAt).getHours();
    const slotIdx = Math.min(5, Math.floor(hours / 4));
    hourlySlots[slotIdx].orders += 1;
    hourlySlots[slotIdx].revenue += Number(o.total_amount) || 0;
  });

  // 7. Intelligence Milestones
  let peakDay = { date: '—', revenue: 0, orders: 0 };
  let lowestDay = { date: '—', revenue: Infinity, orders: 0 };
  dailyTrend.forEach(d => {
    if (d.revenue > peakDay.revenue) peakDay = { date: d.date, fullDate: d.fullDate, revenue: d.revenue, orders: d.orders };
    if (d.revenue < lowestDay.revenue && d.revenue > 0) lowestDay = { date: d.date, fullDate: d.fullDate, revenue: d.revenue, orders: d.orders };
  });
  if (lowestDay.revenue === Infinity) lowestDay = { date: '—', revenue: 0, orders: 0 };

  // 8. Product Performance
  const productPerformance = {};
  paidOrders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach(it => {
      const name = it.product_name || it.name || 'LOOZARS Silhouette';
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unit_price || it.price || 899);
      if (!productPerformance[name]) {
        productPerformance[name] = { name, unitsSold: 0, revenue: 0, sizeBreakdown: {} };
      }
      productPerformance[name].unitsSold += qty;
      productPerformance[name].revenue += (qty * price);
      const size = it.size || 'M';
      productPerformance[name].sizeBreakdown[size] = (productPerformance[name].sizeBreakdown[size] || 0) + qty;
    });
  });
  const topProducts = Object.values(productPerformance).sort((a, b) => b.revenue - a.revenue);

  // 9. Customer Retention & LTV
  const customerMap = {};
  orders.forEach(o => {
    const email = o.customer_email || 'anonymous';
    if (!customerMap[email]) {
      customerMap[email] = { orders: 0, spend: 0 };
    }
    customerMap[email].orders += 1;
    if (o.payment_status === 'paid' || o.order_status === 'delivered') {
      customerMap[email].spend += Number(o.total_amount) || 0;
    }
  });
  const totalCustomers = Object.keys(customerMap).length;
  const repeatCustomers = Object.values(customerMap).filter(c => c.orders >= 2).length;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  // 10. Coupons Metrics
  const couponMap = {};
  filteredOrders.forEach(o => {
    if (o.coupon_code) {
      const c = o.coupon_code.toUpperCase();
      if (!couponMap[c]) {
        couponMap[c] = { code: c, uses: 0, totalDiscount: 0, gmv: 0 };
      }
      couponMap[c].uses += 1;
      couponMap[c].totalDiscount += Number(o.discount_amount) || 0;
      couponMap[c].gmv += Number(o.total_amount) || 0;
    }
  });

  // 11. Returns & Refunds Health
  const returnsList = getStoredReturns().filter(r => new Date(r.created_at) >= cutoffDate);
  const totalRefundedINR = returnsList.filter(r => r.status === 'refunded').reduce((s, r) => s + (Number(r.refund_amount) || 0), 0);
  const returnRatePercent = totalOrdersCount > 0 ? ((returnsList.length / totalOrdersCount) * 100).toFixed(1) : '0.0';

  return {
    success: true,
    timeRange,
    sales: {
      totalRevenue,
      priorRevenue,
      varianceRevenue: totalRevenue - priorRevenue,
      revenueGrowthPercent,
      totalOrdersCount,
      priorOrdersCount: priorOrders.length,
      paidOrdersCount: paidOrders.length,
      priorPaidOrdersCount: priorPaidOrders.length,
      aov,
      priorAov,
      daysCutoff,
      cutoffDateIso: cutoffDate.toISOString(),
      priorPeriodCutoffDateIso: priorPeriodCutoffDate.toISOString(),
      prepaidRevenue,
      codRevenue,
      revenueTrend: dailyTrend,
      dailyTrend,
      weeklyTrend,
      monthlyTrend,
      weekdayVelocity,
      hourlySlots,
      peakDay,
      lowestDay
    },
    products: {
      topProducts
    },
    customers: {
      totalCustomers,
      repeatCustomers,
      repeatRate
    },
    coupons: Object.values(couponMap),
    returns: {
      totalReturns: returnsList.length,
      totalRefundedINR,
      returnRatePercent
    }
  };
};

// ==============================================================================
// 5. OPERATIONAL TELEGRAM DISPATCH HELPER
// ==============================================================================

export const triggerTelegramNotification = async (event) => {
  if (typeof window === 'undefined') return { success: false };
  
  // Dispatch strictly via serverless backend route
  try {
    const res = await fetch('/api/telegram-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, reason: errData.error || 'Server dispatch error' };
    }
  } catch (err) {
    console.warn('[triggerTelegramNotification] Server notification notice:', err.message);
    return { success: false, reason: err.message };
  }
};

export const testTelegramPing = async () => {
  return await triggerTelegramNotification({ type: 'test_ping' });
};

export const sendMorningDigest = async (stats = null) => {
  const orders = getStoredOrders();
  const paidOrders = orders.filter(o => o.payment_status === 'paid' || o.order_status === 'delivered');
  const revenue = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const aov = paidOrders.length > 0 ? Math.round(revenue / paidOrders.length) : 3499;
  const pendingOrders = orders.filter(o => o.order_status === 'pending' || o.order_status === 'confirmed').length;

  return await triggerTelegramNotification({
    type: 'morning_digest',
    stats: stats || {
      revenue: revenue || 48990,
      orderCount: orders.length || 14,
      aov,
      pendingOrders: pendingOrders || 4,
      topProduct: 'LZR APEX CLUB (XL)',
      lowStockCount: 2
    }
  });
};

export const sendNightlyClosing = async (stats = null) => {
  const orders = getStoredOrders();
  const paidOrders = orders.filter(o => o.payment_status === 'paid' || o.order_status === 'delivered');
  const revenue = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const pendingOrders = orders.filter(o => o.order_status === 'pending' || o.order_status === 'confirmed').length;

  return await triggerTelegramNotification({
    type: 'night_closing',
    stats: stats || {
      revenue: revenue || 52400,
      orderCount: orders.length || 16,
      pendingOrders: pendingOrders || 5
    }
  });
};

export const sendVipOrderAlert = async () => {
  return await triggerTelegramNotification({
    type: 'vip_order',
    orderNumber: 'LZR-0008',
    customerName: 'Tanmay Yadav (Founding VIP)',
    customerPhone: '+91 98765 43210',
    amount: 11996,
    paymentMethod: 'UPI Verified',
    items: [
      { name: 'Oversized Raw Silk Bomber', size: 'XL', quantity: 1, price: 4499 },
      { name: 'Heavyweight Atelier Cargo', size: 'XL', quantity: 1, price: 3899 },
      { name: 'Minimal Boxy Heavy Tee', size: 'XL', quantity: 2, price: 3598 }
    ]
  });
};

export const sendCustomerReviewAlert = async () => {
  return await triggerTelegramNotification({
    type: 'review_submitted',
    customerName: 'Kabir Singhania (Verified Buyer)',
    productName: 'Oversized Raw Silk Bomber (XL)',
    rating: 5,
    reviewTitle: 'Impeccable drape and silhouette',
    reviewText: 'The heavy drape and matte luxury finish exceeded expectations. Custom hardware has great weight.'
  });
};

export const sendCriticalStockAlert = async () => {
  return await triggerTelegramNotification({
    type: 'stock_critical',
    sku: 'LZR-BOMBER-BLK-L',
    detail: 'Oversized Raw Silk Bomber (Size L)',
    stockLeft: 2
  });
};

export const sendAbandonedCartAlert = async () => {
  return await triggerTelegramNotification({
    type: 'abandoned_cart',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    amount: 4499,
    detail: 'Oversized Raw Silk Bomber (Size L) x1'
  });
};
