/**
 * LOOZARS® — Operational Telegram Notifications Handler
 * Dispatches high-signal operational alerts & interactive action buttons to admin Telegram.
 * 
 * Never blocks orders or mutations if Telegram is unavailable or unconfigured.
 */

import fs from 'fs';
import path from 'path';

function getEnv(key) {
  if (process.env[key]) return process.env[key];
  if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const k = trimmed.substring(0, eqIdx).trim();
          const v = trimmed.substring(eqIdx + 1).trim();
          if (k === key || k === `VITE_${key}`) return v;
        }
      }
    }
  } catch (e) {}

  const DEFAULTS = {
    TELEGRAM_BOT_TOKEN: '8776016138:AAHtz2dvr5uKwPTAjgXhVFMEAzZkyNW4_-E',
    TELEGRAM_ADMIN_CHAT_ID: '1612319687'
  };
  return DEFAULTS[key] || '';
}

// In-memory idempotency deduplication cache (5-minute TTL)
const notificationCache = new Map();

function isDuplicate(key) {
  if (!key) return false;
  const now = Date.now();
  if (notificationCache.has(key)) {
    const timestamp = notificationCache.get(key);
    if (now - timestamp < 300000) { // 5 minutes
      return true;
    }
  }
  notificationCache.set(key, now);
  if (notificationCache.size > 200) {
    for (const [k, t] of notificationCache.entries()) {
      if (now - t > 300000) notificationCache.delete(k);
    }
  }
  return false;
}

export async function sendTelegramNotification(event) {
  const botToken = getEnv('TELEGRAM_BOT_TOKEN');
  const adminChatId = getEnv('TELEGRAM_ADMIN_CHAT_ID');

  const {
    type, // 'new_order' | 'vip_order' | 'return_requested' | 'refund_completed' | 'review_submitted' | 'stock_critical' | 'abandoned_cart' | 'morning_digest' | 'night_closing' | 'surge_traffic' | 'test_ping'
    orderNumber,
    orderId,
    customerName,
    customerPhone,
    customerEmail,
    amount,
    items = [],
    paymentMethod,
    reason,
    sku,
    stockLeft,
    detail,
    stats,
    reviewId,
    rating,
    reviewTitle,
    reviewText,
    productName
  } = event || {};

  if (!botToken || !adminChatId) {
    return {
      success: false,
      skipped: true,
      reason: 'TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured.'
    };
  }

  // Idempotency check for orders/refunds
  const idempotencyKey = `${type}_${orderNumber || orderId || reviewId || sku || detail || ''}`;
  if (type !== 'test_ping' && type !== 'morning_digest' && type !== 'night_closing' && isDuplicate(idempotencyKey)) {
    return { success: true, skipped: true, reason: 'Duplicate event suppressed by idempotency guard.' };
  }

  let messageText = '';
  let inlineKeyboard = [];

  const rawPhone = (customerPhone || '').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.startsWith('91') ? rawPhone : (rawPhone.length === 10 ? `91${rawPhone}` : rawPhone);
  const firstName = (customerName || 'Patron').split(' ')[0];

  const parsedItems = Array.isArray(items) ? items : [];
  const itemsSummary = parsedItems.map(i => `• ${i.name || i.product_name || 'LOOZARS Silhouette'} (${i.size || 'M'}) x${i.quantity || 1}`).join('\n');

  const isVipOrder = type === 'vip_order' || Number(amount || 0) >= 7000;
  const orderRef = orderNumber || orderId || 'LZR-ORDER';

  switch (type) {
    case 'vip_order':
    case 'new_order': {
      if (isVipOrder) {
        messageText = `👑 *LOOZARS® — VIP ORDER RECEIVED*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Order:* \`${orderRef}\`\n` +
          `• *Collector:* ${customerName || 'VIP Customer'}\n` +
          `• *Total Amount:* ₹${Number(amount || 0).toLocaleString('en-IN')}\n` +
          `• *Payment:* ${(paymentMethod || 'PREPAID').toUpperCase()} (✅ Paid)\n\n` +
          `*Order Items:*\n${itemsSummary || '• Exclusive Drop Pieces'}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_✨ High-LTV customer order — prioritized for immediate express dispatch._`;
      } else {
        messageText = `🛍️ *LOOZARS® — NEW ORDER RECEIVED*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Order:* \`${orderRef}\`\n` +
          `• *Customer:* ${customerName || 'Customer'}\n` +
          `• *Total Amount:* ₹${Number(amount || 0).toLocaleString('en-IN')}\n` +
          `• *Payment:* ${(paymentMethod || 'PREPAID').toUpperCase()} (✅ Confirmed)\n\n` +
          `*Order Items:*\n${itemsSummary || '• LOOZARS Drop Pieces'}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_Ready for packing & fulfillment dispatch._`;
      }

      const row = [];
      if (cleanPhone) {
        const waMsg = encodeURIComponent(`Hello ${firstName}, thank you for your order with LOOZARS® (#${orderRef}). We are preparing your pieces for express dispatch.`);
        row.push({ text: '💬 WhatsApp Customer', url: `https://wa.me/${cleanPhone}?text=${waMsg}` });
      }
      row.push({ text: '📦 Mark Shipped', callback_data: `ship:${orderRef}` });
      inlineKeyboard.push(row);
      break;
    }

    case 'return_requested': {
      messageText = `🔄 *LOOZARS® — RETURN REQUEST FILED*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Order:* \`${orderRef}\`\n` +
        `• *Customer:* ${customerName || 'Customer'}\n` +
        `• *Reason:* ${reason || 'Size / Fit Exchange'}\n` +
        `• *Estimated Refund:* ₹${Number(amount || 0).toLocaleString('en-IN')}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Action: Review & moderate via buttons below:_`;

      const actionRow = [
        { text: '✅ Approve Return', callback_data: `ret_appr:${orderRef}` },
        { text: '❌ Reject', callback_data: `ret_rej:${orderRef}` }
      ];
      inlineKeyboard.push(actionRow);

      if (cleanPhone) {
        const waMsg = encodeURIComponent(`Hello ${firstName}, regarding your return request for LOOZARS® order #${orderRef}: our concierge is here to assist you.`);
        inlineKeyboard.push([
          { text: '💬 WhatsApp Customer', url: `https://wa.me/${cleanPhone}?text=${waMsg}` }
        ]);
      }
      break;
    }

    case 'review_submitted': {
      const stars = '⭐'.repeat(Math.max(1, Math.min(5, Number(rating) || 5)));
      messageText = `⭐ *LOOZARS® — NEW CUSTOMER REVIEW (${stars})*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Customer:* ${customerName || 'Customer'}\n` +
        `• *Product:* ${productName || 'LOOZARS Silhouette'}\n` +
        `• *Review:* "${reviewText || reviewTitle || 'Excellent quality and fit.'}"\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Moderate publication directly below:_`;

      const revKey = reviewId || `rev_${Date.now()}`;
      inlineKeyboard.push([
        { text: '⭐ Approve & Publish', callback_data: `rev_appr:${revKey}` },
        { text: '🗑️ Hide Review', callback_data: `rev_hide:${revKey}` }
      ]);
      break;
    }

    case 'refund_completed': {
      messageText = `💸 *LOOZARS® — REFUND PROCESSED*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Order:* \`${orderRef}\`\n` +
        `• *Customer:* ${customerName || 'Customer'}\n` +
        `• *Refund Amount:* ₹${Number(amount || 0).toLocaleString('en-IN')}\n` +
        `• *Reference ID:* \`${detail || 'Processed'}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Store ledger updated & inventory reconciled._`;
      break;
    }

    case 'abandoned_cart': {
      messageText = `🛒 *LOOZARS® — ABANDONED CHECKOUT*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Customer:* ${customerName || 'Customer'}\n` +
        `• *Cart Value:* ₹${Number(amount || 0).toLocaleString('en-IN')}\n` +
        `• *Items:* ${detail || 'Drop Items'}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_1-Click concierge recovery available below:_`;

      if (cleanPhone) {
        const waMsg = encodeURIComponent(`Hello ${firstName}, this is LOOZARS®. We noticed you left pieces in your shopping bag. Would you like assistance reserving your sizing before stock clears?`);
        inlineKeyboard.push([
          { text: '📲 WhatsApp Recovery', url: `https://wa.me/${cleanPhone}?text=${waMsg}` }
        ]);
      }
      break;
    }

    case 'stock_critical': {
      const variantSku = sku || 'SKU-UNKNOWN';
      messageText = `🚨 *LOOZARS® — CRITICAL INVENTORY ALERT*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *SKU:* \`${variantSku}\`\n` +
        `• *Product:* ${detail || 'LOOZARS Product'}\n` +
        `• *Current Stock:* ${stockLeft ?? 0} units left\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Select quick restock action below:_`;

      inlineKeyboard.push([
        { text: '➕ Restock +20 Units', callback_data: `stock_add:${variantSku}:20` },
        { text: '➕ Restock +50 Units', callback_data: `stock_add:${variantSku}:50` }
      ]);
      break;
    }

    case 'surge_traffic': {
      messageText = `⚡ *LOOZARS® — HIGH TRAFFIC SURGE*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Velocity:* ${detail || 'High checkout rate detected'}\n` +
        `• *Active Sessions:* ${amount || 30} customers browsing\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Monitoring critical inventory levels._`;
      inlineKeyboard.push([
        { text: '📊 View Sales Analytics', callback_data: 'sales' }
      ]);
      break;
    }

    case 'morning_digest': {
      messageText = `☕ *LOOZARS® — EXECUTIVE MORNING BRIEFING*\n` +
        `_${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}_\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 *Yesterday's Performance:*\n` +
        `• *Gross Revenue:* ₹${Number(stats?.revenue || 0).toLocaleString('en-IN')}\n` +
        `• *Total Orders Placed:* ${stats?.orderCount || 0}\n` +
        `• *Average Order Value:* ₹${Number(stats?.aov || 0).toLocaleString('en-IN')}\n\n` +
        `📦 *Operations & Fulfillment:*\n` +
        `• *Awaiting Dispatch:* ${stats?.pendingOrders || 0} orders\n` +
        `• *Top Silhouette:* ${stats?.topProduct || 'LZR APEX CLUB'}\n\n` +
        `🚨 *Inventory Matrix:*\n` +
        `• *Low Stock Variants:* ${stats?.lowStockCount || 0} items (≤ 5 units)\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Store Status: 🟢 Fully Operational_`;
      inlineKeyboard.push([
        { text: '📊 Open Dashboard', url: 'https://loozars.com' }
      ]);
      break;
    }

    case 'night_closing': {
      messageText = `🌙 *LOOZARS® — DAILY CLOSING REPORT*\n` +
        `_${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} — Store Closing_\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📈 *Day Closure Metrics:*\n` +
        `• *Today's Revenue:* ₹${Number(stats?.revenue || 0).toLocaleString('en-IN')}\n` +
        `• *Total Orders Logged:* ${stats?.orderCount || 0}\n` +
        `• *Pending for Tomorrow's Dispatch:* ${stats?.pendingOrders || 0} parcels\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `✨ _Daily store registers reconciled._`;
      inlineKeyboard.push([
        { text: '📊 Open Dashboard', url: 'https://loozars.com' }
      ]);
      break;
    }

    case 'test_ping':
    default: {
      messageText = `⚡ *LOOZARS® OPERATIONS — BOT CONNECTED*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Connection Status:* 🟢 Active & Live\n` +
        `• *Admin Account:* Tanmay (@tanmayhitech)\n` +
        `• *Sync Time:* ${new Date().toLocaleTimeString('en-IN')}\n` +
        `• *Channel:* Real-Time Store Dispatch & Alerts\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Type /help to explore all available commands._`;
      inlineKeyboard.push([
        { text: '🛍️ Open Storefront', url: 'https://loozars.com' }
      ]);
      break;
    }
  }

  const payload = {
    chat_id: adminChatId,
    text: messageText,
    parse_mode: 'Markdown'
  };

  if (inlineKeyboard.length > 0) {
    payload.reply_markup = { inline_keyboard: inlineKeyboard };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resJson = await response.json();
    return {
      success: resJson.ok === true,
      messageId: resJson.result?.message_id,
      error: resJson.ok ? null : resJson.description
    };
  } catch (err) {
    console.warn('[TelegramNotify] Non-blocking dispatch error:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const result = await sendTelegramNotification({ type: 'test_ping' });
      return res.status(200).json({
        ok: true,
        message: 'LOOZARS Telegram Operational Dispatcher Online',
        pingResult: result
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const result = await sendTelegramNotification(payload);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
