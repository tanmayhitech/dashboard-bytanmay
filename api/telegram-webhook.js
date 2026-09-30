import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://dfxmudxuqwsxdtimtqqa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ADMIN_CHAT_ID = String(process.env.TELEGRAM_ADMIN_CHAT_ID || '').trim();
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_SECRET_TOKEN || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || 'MISSING_KEY', {
  auth: { persistSession: false }
});

// Helper to send Telegram Markdown messages with auto plain-text retry fallback
export async function sendReply(chatId, text, inlineKeyboard = []) {
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    };
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok && data.description && data.description.includes('can\'t parse entities')) {
      delete payload.parse_mode;
      const retryRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await retryRes.json();
    }
    return data;
  } catch (e) {
    console.error('[TelegramWebhook] sendReply error:', e);
  }
}

// Helper to answer Telegram interactive button clicks (popups)
export async function answerCallbackQuery(callbackQueryId, text, showAlert = false) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert
      })
    });
  } catch (e) {
    console.error('[TelegramWebhook] answerCallbackQuery error:', e);
  }
}

// Helper to edit original message text upon action
export async function editMessageText(chatId, messageId, newText, inlineKeyboard = []) {
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'Markdown'
    };
    if (inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('[TelegramWebhook] editMessageText error:', e);
  }
}

/**
 * Core processor for any Telegram update (works for both Webhooks & Long Polling)
 */
export async function processTelegramUpdate(body = {}) {
  try {
    // =========================================================================
    // 1. HANDLE INTERACTIVE CALLBACK QUERY CLICKS (1-Click Telegram Actions)
    // =========================================================================
    if (body.callback_query) {
      const query = body.callback_query;
      const callbackId = query.id;
      const data = String(query.data || '');
      const chatId = String(query.message?.chat?.id || query.from?.id || '');
      const messageId = query.message?.message_id;
      const originalText = query.message?.text || '';

      const isAuthorizedAdmin = chatId === TELEGRAM_ADMIN_CHAT_ID;
      if (!isAuthorizedAdmin) {
        await answerCallbackQuery(callbackId, '🔒 Unauthorized admin access.', true);
        return { ok: true, status: 'unauthorized' };
      }

      // ACTION 1.1: SHIP ORDER (ship:<order_id_or_number>)
      if (data.startsWith('ship:')) {
        const orderKey = data.substring(5).trim();
        await supabaseAdmin
          .from('orders')
          .update({ order_status: 'shipped', updated_at: new Date().toISOString() })
          .or(`id.eq.${orderKey},order_number.eq.${orderKey}`);

        await answerCallbackQuery(callbackId, `📦 Order #${orderKey} marked as SHIPPED!`);
        if (messageId) {
          const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          const updated = originalText + `\n\n_⚡ Action Taken: Marked SHIPPED by Tanmay at ${timestamp}_`;
          await editMessageText(chatId, messageId, updated, [
            [{ text: '👑 Atelier Storefront', url: 'https://loozars.com' }]
          ]);
        }
        return { ok: true, action: 'order_shipped' };
      }

      // ACTION 1.2: DELIVER ORDER (deliver:<order_id_or_number>)
      if (data.startsWith('deliver:')) {
        const orderKey = data.substring(8).trim();
        await supabaseAdmin
          .from('orders')
          .update({ order_status: 'delivered', updated_at: new Date().toISOString() })
          .or(`id.eq.${orderKey},order_number.eq.${orderKey}`);

        await answerCallbackQuery(callbackId, `✅ Order #${orderKey} marked as DELIVERED!`);
        return { ok: true, action: 'order_delivered' };
      }

      // ACTION 1.3: APPROVE RETURN (ret_appr:<return_id_or_order>)
      if (data.startsWith('ret_appr:')) {
        const returnKey = data.substring(9).trim();
        await supabaseAdmin
          .from('order_returns')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .or(`id.eq.${returnKey},order_number.eq.${returnKey}`);

        await answerCallbackQuery(callbackId, `✅ Return request approved!`);
        if (messageId) {
          const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          await editMessageText(chatId, messageId, originalText + `\n\n_⚡ Return Approved by Tanmay at ${timestamp}_`);
        }
        return { ok: true, action: 'return_approved' };
      }

      // ACTION 1.4: REJECT RETURN (ret_rej:<return_id_or_order>)
      if (data.startsWith('ret_rej:')) {
        const returnKey = data.substring(8).trim();
        await supabaseAdmin
          .from('order_returns')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .or(`id.eq.${returnKey},order_number.eq.${returnKey}`);

        await answerCallbackQuery(callbackId, `❌ Return request rejected.`);
        if (messageId) {
          const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          await editMessageText(chatId, messageId, originalText + `\n\n_⚡ Return Declined at ${timestamp}_`);
        }
        return { ok: true, action: 'return_rejected' };
      }

      // ACTION 1.5: APPROVE PRODUCT REVIEW (rev_appr:<review_id>)
      if (data.startsWith('rev_appr:')) {
        const revId = data.substring(9).trim();
        await supabaseAdmin
          .from('product_reviews')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', revId);

        await answerCallbackQuery(callbackId, `⭐ Review Approved & Published on Storefront!`);
        if (messageId) {
          const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          await editMessageText(chatId, messageId, originalText + `\n\n_✨ Approved & Published by Tanmay at ${timestamp}_`);
        }
        return { ok: true, action: 'review_approved' };
      }

      // ACTION 1.6: HIDE PRODUCT REVIEW (rev_hide:<review_id>)
      if (data.startsWith('rev_hide:')) {
        const revId = data.substring(9).trim();
        await supabaseAdmin
          .from('product_reviews')
          .update({ status: 'hidden', updated_at: new Date().toISOString() })
          .eq('id', revId);

        await answerCallbackQuery(callbackId, `🗑️ Review Hidden from Storefront.`);
        if (messageId) {
          const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          await editMessageText(chatId, messageId, originalText + `\n\n_🗑️ Review Hidden at ${timestamp}_`);
        }
        return { ok: true, action: 'review_hidden' };
      }

      // ACTION 1.7: QUICK RESTOCK (stock_add:<sku>:<qty>)
      if (data.startsWith('stock_add:')) {
        const parts = data.split(':');
        const sku = parts[1];
        const addQty = parseInt(parts[2], 10) || 20;

        const { data: variant } = await supabaseAdmin
          .from('product_variants')
          .select('id, stock_quantity')
          .eq('sku', sku)
          .single();

        if (variant) {
          const newQty = (variant.stock_quantity || 0) + addQty;
          await supabaseAdmin
            .from('product_variants')
            .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
            .eq('id', variant.id);

          await answerCallbackQuery(callbackId, `➕ SKU ${sku} Restocked to ${newQty} units!`);
          if (messageId) {
            await editMessageText(chatId, messageId, originalText + `\n\n_✅ Restocked +${addQty} units (Total: ${newQty})_`);
          }
        } else {
          await answerCallbackQuery(callbackId, `⚠️ SKU ${sku} not found in database.`);
        }
        return { ok: true, action: 'stock_restocked' };
      }

      await answerCallbackQuery(callbackId, `⚡ Action processed.`);
      return { ok: true };
    }

    // =========================================================================
    // 2. HANDLE STANDARD BOT TEXT COMMANDS
    // =========================================================================
    const message = body.message;
    if (!message || !message.text) {
      return { ok: true, status: 'no_message_text' };
    }

    const chatId = String(message.chat?.id || '');
    const text = message.text.trim();
    const isAuthorizedAdmin = chatId === TELEGRAM_ADMIN_CHAT_ID;

    if (!isAuthorizedAdmin) {
      await sendReply(chatId, `🔒 *Access Restricted*\nThis bot is authorized exclusively for LOOZARS® Store Operations.\n\nYour Chat ID: \`${chatId}\``);
      return { ok: true, status: 'access_denied' };
    }

    const rawCommand = text.split(' ')[0].toLowerCase();
    const command = rawCommand.split('@')[0]; // Strip @loozarsbot if present
    const queryArg = text.substring(rawCommand.length).trim();

    // -------------------------------------------------------------------------
    // COMMAND 1: /today or /sales
    // -------------------------------------------------------------------------
    if (command === '/today' || command === '/sales') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .gte('created_at', todayStart.toISOString());

      const orderList = Array.isArray(orders) ? orders : [];
      const paidOrders = orderList.filter(o => o.payment_status === 'paid' || (o.payment_method === 'cod' && o.order_status === 'delivered'));
      const grossRev = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const aov = paidOrders.length > 0 ? Math.round(grossRev / paidOrders.length) : 0;
      const codCount = orderList.filter(o => o.payment_method === 'cod').length;
      const prepaidCount = Math.max(0, orderList.length - codCount);

      const reply = `📊 *LOOZARS® — DAILY SALES OVERVIEW*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Gross Revenue:* ₹${grossRev.toLocaleString('en-IN')}\n` +
        `• *Paid Orders:* ${paidOrders.length} of ${orderList.length} total\n` +
        `• *Average Order Value (AOV):* ₹${aov.toLocaleString('en-IN')}\n` +
        `• *Payment Split:* ${prepaidCount} Online Prepaid · ${codCount} COD\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Status: 🟢 Store Operations Online & Synced_`;

      await sendReply(chatId, reply, [
        [{ text: '📦 View Orders Ledger', url: 'https://loozars.com' }]
      ]);
      return { ok: true, command: 'today' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 2: /orders (With 1-Click Interactive Ship Action)
    // -------------------------------------------------------------------------
    if (command === '/orders' || command === '/recent') {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const orderList = Array.isArray(orders) ? orders : [];
      if (orderList.length === 0) {
        await sendReply(chatId, `📦 *No orders recorded in the ledger yet.*`);
        return { ok: true, command: 'orders_empty' };
      }

      await sendReply(chatId, `📦 *LOOZARS® — LATEST ${orderList.length} ORDERS*`);

      for (const o of orderList) {
        const dateStr = new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        const rawPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
        const cleanPhone = rawPhone.startsWith('91') ? rawPhone : (rawPhone.length === 10 ? `91${rawPhone}` : rawPhone);

        const itemsList = Array.isArray(o.items) && o.items.length > 0 
          ? o.items.map(i => `${i.quantity || 1}x ${i.name || i.product_name} (${i.size || 'M'})`).join(', ')
          : 'Drop Pieces';

        const cardText = `🛍️ *Order \`${o.order_number}\`*\n` +
          `• *Customer:* ${o.customer_name || 'Customer'}\n` +
          `• *Contact:* ${o.customer_phone || o.customer_email || 'N/A'}\n` +
          `• *Items:* ${itemsList}\n` +
          `• *Total:* ₹${Number(o.total_amount || 0).toLocaleString('en-IN')} (${(o.payment_method || 'UPI').toUpperCase()})\n` +
          `• *Status:* ${(o.order_status || 'confirmed').toUpperCase()} · Paid: ${(o.payment_status || 'paid').toUpperCase()}\n` +
          `• *Placed:* ${dateStr}`;

        const buttons = [];
        const actionRow = [];
        if (o.order_status !== 'shipped' && o.order_status !== 'delivered') {
          actionRow.push({ text: '📦 Mark Shipped', callback_data: `ship:${o.order_number || o.id}` });
        }
        if (cleanPhone) {
          const waMsg = encodeURIComponent(`Hello ${o.customer_name?.split(' ')[0] || ''}, regarding your LOOZARS® order #${o.order_number}:`);
          actionRow.push({ text: '💬 WhatsApp', url: `https://wa.me/${cleanPhone}?text=${waMsg}` });
        }
        if (actionRow.length > 0) buttons.push(actionRow);

        await sendReply(chatId, cardText, buttons);
      }
      return { ok: true, command: 'orders' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 3: /returns (Pending Return Requests)
    // -------------------------------------------------------------------------
    if (command === '/returns') {
      const { data: returns } = await supabaseAdmin
        .from('order_returns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const list = Array.isArray(returns) ? returns : [];
      if (list.length === 0) {
        await sendReply(chatId, `✅ *No pending return requests in the ledger.*`);
        return { ok: true, command: 'returns_empty' };
      }

      for (const r of list) {
        const rawPhone = (r.customer_phone || '').replace(/[^0-9]/g, '');
        const cleanPhone = rawPhone.startsWith('91') ? rawPhone : (rawPhone.length === 10 ? `91${rawPhone}` : rawPhone);

        const textMsg = `🔄 *RETURN REQUEST — \`${r.order_number}\`*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Customer:* ${r.customer_name || 'Customer'}\n` +
          `• *Reason:* ${r.return_reason || 'Size Exchange / Return'}\n` +
          `• *Refund Amount:* ₹${Number(r.refund_amount || 0).toLocaleString('en-IN')}\n` +
          `• *Status:* ${(r.status || 'requested').toUpperCase()}`;

        const buttons = [];
        if (r.status === 'requested') {
          buttons.push([
            { text: '✅ Approve Return', callback_data: `ret_appr:${r.id}` },
            { text: '❌ Reject', callback_data: `ret_rej:${r.id}` }
          ]);
        }
        if (cleanPhone) {
          const waMsg = encodeURIComponent(`Hello ${r.customer_name?.split(' ')[0] || ''}, regarding your return request for LOOZARS® #${r.order_number}:`);
          buttons.push([{ text: '💬 WhatsApp Customer', url: `https://wa.me/${cleanPhone}?text=${waMsg}` }]);
        }

        await sendReply(chatId, textMsg, buttons);
      }
      return { ok: true, command: 'returns' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 4: /reviews (Product Reviews Moderation)
    // -------------------------------------------------------------------------
    if (command === '/reviews') {
      const { data: reviews } = await supabaseAdmin
        .from('product_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const list = Array.isArray(reviews) ? reviews : [];
      if (list.length === 0) {
        await sendReply(chatId, `⭐ *No pending product reviews found.*`);
        return { ok: true, command: 'reviews_empty' };
      }

      for (const rev of list) {
        const stars = '⭐'.repeat(Math.max(1, Math.min(5, rev.rating || 5)));
        const textMsg = `⭐ *CUSTOMER REVIEW — ${stars}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Customer:* ${rev.customer_name || 'Customer'}\n` +
          `• *Product:* ${rev.product_name || 'LOOZARS Product'}\n` +
          `• *Feedback:* "${rev.review_text || rev.review_title || 'Great product.'}"\n` +
          `• *Status:* ${(rev.status || 'pending').toUpperCase()}`;

        const buttons = [];
        if (rev.status === 'pending') {
          buttons.push([
            { text: '⭐ Approve & Publish', callback_data: `rev_appr:${rev.id}` },
            { text: '🗑️ Hide Review', callback_data: `rev_hide:${rev.id}` }
          ]);
        }
        await sendReply(chatId, textMsg, buttons);
      }
      return { ok: true, command: 'reviews' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 5: /stock (Critical Low Stock Matrix)
    // -------------------------------------------------------------------------
    if (command === '/stock') {
      const { data: variants } = await supabaseAdmin
        .from('product_variants')
        .select('*, products(name)')
        .lte('stock_quantity', 5)
        .order('stock_quantity', { ascending: true });

      const list = Array.isArray(variants) ? variants : [];
      if (list.length === 0) {
        await sendReply(chatId, `✅ *Inventory Status: Healthy*\nAll size variants are well stocked (> 5 units).`);
        return { ok: true, command: 'stock_healthy' };
      }

      await sendReply(chatId, `🚨 *LOOZARS® — CRITICAL INVENTORY ALERT (≤ 5 units)*`);
      for (const v of list.slice(0, 6)) {
        const prodName = v.products?.name || 'LOOZARS Product';
        const itemText = `• *${prodName}* (Size *${v.size}*)\n  SKU: \`${v.sku}\` · *${v.stock_quantity} left*`;
        await sendReply(chatId, itemText, [
          [{ text: `➕ Restock +20 Units`, callback_data: `stock_add:${v.sku}:20` }]
        ]);
      }
      return { ok: true, command: 'stock' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 6: /carts (Recoverable Abandoned Bags)
    // -------------------------------------------------------------------------
    if (command === '/carts') {
      const { data: carts } = await supabaseAdmin
        .from('abandoned_carts')
        .select('*')
        .order('last_activity_at', { ascending: false })
        .limit(5);

      const list = Array.isArray(carts) ? carts : [];
      if (list.length === 0) {
        await sendReply(chatId, `🛒 *No uncontacted abandoned bags in database.*`);
        return { ok: true, command: 'carts_empty' };
      }

      for (const c of list) {
        const rawPhone = (c.customer_phone || '').replace(/[^0-9]/g, '');
        const cleanPhone = rawPhone.startsWith('91') ? rawPhone : (rawPhone.length === 10 ? `91${rawPhone}` : rawPhone);
        const firstName = (c.customer_name || 'Customer').split(' ')[0];

        const textMsg = `🛒 *ABANDONED BAG — ₹${Number(c.cart_value || 0).toLocaleString('en-IN')}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Customer:* ${c.customer_name || 'Customer'}\n` +
          `• *Phone:* ${c.customer_phone || 'N/A'}\n` +
          `• *Items:* ${c.item_count || 1} pieces`;

        const buttons = [];
        if (cleanPhone) {
          const waMsg = encodeURIComponent(`Hello ${firstName}, this is LOOZARS®. We noticed you left pieces in your shopping bag. Would you like assistance completing your order?`);
          buttons.push([{ text: '📲 WhatsApp Customer', url: `https://wa.me/${cleanPhone}?text=${waMsg}` }]);
        }

        await sendReply(chatId, textMsg, buttons);
      }
      return { ok: true, command: 'carts' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 7: /discount <CODE> <PERCENT> (Create Live Promo Coupon)
    // -------------------------------------------------------------------------
    if (command === '/discount' || command === '/coupon') {
      const args = queryArg.split(' ').filter(Boolean);
      if (args.length < 2) {
        await sendReply(chatId, `⚠️ *Usage:* \`/discount <code> <percentage>\`\nExample: \`/discount FLASH20 20\``);
        return { ok: true, command: 'discount_help' };
      }

      const code = args[0].toUpperCase();
      const percent = parseInt(args[1], 10);
      if (isNaN(percent) || percent <= 0 || percent > 100) {
        await sendReply(chatId, `⚠️ Please provide a valid discount percentage (1 - 100).`);
        return { ok: true, command: 'discount_invalid' };
      }

      try {
        await supabaseAdmin.from('coupons').upsert([
          {
            code,
            discount_type: 'percentage',
            discount_value: percent,
            is_active: true,
            description: `${percent}% Special Store Discount`,
            created_at: new Date().toISOString()
          }
        ], { onConflict: 'code' });
      } catch (e) {}

      const reply = `🏷️ *PROMO CODE ACTIVATED*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Code:* \`${code}\`\n` +
        `• *Discount:* ${percent}% OFF\n` +
        `• *Status:* Active & Live on Checkout\n` +
        `━━━━━━━━━━━━━━━━━━━━`;

      await sendReply(chatId, reply, [
        [{ text: '🛍️ Open Storefront', url: 'https://loozars.com' }]
      ]);
      return { ok: true, command: 'discount_created' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 8: /find <query> (Deep Search)
    // -------------------------------------------------------------------------
    if (command === '/find') {
      if (!queryArg) {
        await sendReply(chatId, `🔍 *Usage:* \`/find <order# or customer name or phone>\`\nExample: \`/find LZR-0001\` or \`/find Tanmay\``);
        return { ok: true, command: 'find_help' };
      }

      const { data: results } = await supabaseAdmin
        .from('orders')
        .select('*')
        .or(`order_number.ilike.%${queryArg}%,customer_name.ilike.%${queryArg}%,customer_phone.ilike.%${queryArg}%,customer_email.ilike.%${queryArg}%`)
        .limit(3);

      const found = Array.isArray(results) ? results : [];
      if (found.length === 0) {
        await sendReply(chatId, `🔍 No orders found matching: "*${queryArg}*"`);
        return { ok: true, command: 'find_none' };
      }

      for (const o of found) {
        const rawPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
        const cleanPhone = rawPhone.startsWith('91') ? rawPhone : (rawPhone.length === 10 ? `91${rawPhone}` : rawPhone);

        const reply = `🔍 *MATCHED ORDER: \`${o.order_number}\`*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Customer:* ${o.customer_name}\n` +
          `• *Phone:* ${o.customer_phone || 'N/A'}\n` +
          `• *Amount:* ₹${Number(o.total_amount).toLocaleString('en-IN')}\n` +
          `• *Status:* ${(o.order_status || 'confirmed').toUpperCase()} · Paid: ${(o.payment_status || 'paid').toUpperCase()}`;

        const buttons = [];
        if (cleanPhone) {
          const waMsg = encodeURIComponent(`Hello ${o.customer_name?.split(' ')[0] || ''}, regarding your LOOZARS® order #${o.order_number}:`);
          buttons.push([{ text: '💬 WhatsApp Customer', url: `https://wa.me/${cleanPhone}?text=${waMsg}` }]);
        }

        await sendReply(chatId, reply, buttons);
      }
      return { ok: true, command: 'find_found' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 9: /digest or /morning
    // -------------------------------------------------------------------------
    if (command === '/digest' || command === '/morning') {
      const { data: allOrders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const list = Array.isArray(allOrders) ? allOrders : [];
      const grossRev = list.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const pendingCount = list.filter(o => o.order_status === 'pending' || o.order_status === 'confirmed').length;

      const reply = `☕ *LOOZARS® — EXECUTIVE MORNING BRIEFING*\n` +
        `_${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}_\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 *Key Performance Indicators:*\n` +
        `• *Cumulative Gross Revenue:* ₹${grossRev.toLocaleString('en-IN')}\n` +
        `• *Total Orders Logged:* ${list.length}\n` +
        `• *Awaiting Fulfillment:* ${pendingCount} orders\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Operations Status: 🟢 Fully Operational_`;

      await sendReply(chatId, reply, [
        [{ text: '📊 Open Dashboard', url: 'https://loozars.com' }]
      ]);
      return { ok: true, command: 'digest' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 10: /night or /closing (End of Day Store Report)
    // -------------------------------------------------------------------------
    if (command === '/night' || command === '/closing') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .gte('created_at', todayStart.toISOString());

      const orderList = Array.isArray(orders) ? orders : [];
      const paidOrders = orderList.filter(o => o.payment_status === 'paid' || (o.payment_method === 'cod' && o.order_status === 'delivered'));
      const grossRev = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const pendingOrders = orderList.filter(o => o.order_status === 'pending' || o.order_status === 'confirmed').length;

      const reply = `🌙 *LOOZARS® — DAILY CLOSING REPORT*\n` +
        `_${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} — Store Closing_\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Today's Revenue:* ₹${grossRev.toLocaleString('en-IN')}\n` +
        `• *Total Orders Placed:* ${orderList.length}\n` +
        `• *Scheduled for Tomorrow's Dispatch:* ${pendingOrders} parcels\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `✨ _Daily store ledger reconciled._`;

      await sendReply(chatId, reply, [
        [{ text: '📊 Open Dashboard', url: 'https://loozars.com' }]
      ]);
      return { ok: true, command: 'night' };
    }

    // -------------------------------------------------------------------------
    // COMMAND 11: /broadcast <message>
    // -------------------------------------------------------------------------
    if (command === '/broadcast') {
      if (!queryArg) {
        await sendReply(chatId, `⚠️ Usage: \`/broadcast <your announcement>\``);
        return { ok: true, command: 'broadcast_empty' };
      }
      const reply = `📢 *LOOZARS® OFFICIAL ANNOUNCEMENT*\n━━━━━━━━━━━━━━━━━━━━\n${queryArg}\n━━━━━━━━━━━━━━━━━━━━\n_— Broadcasted by Tanmay (Admin)_`;
      await sendReply(chatId, reply);
      return { ok: true, command: 'broadcast' };
    }

    // -------------------------------------------------------------------------
    // DEFAULT / HELP MENU
    // -------------------------------------------------------------------------
    const helpMenu = `⚡ *LOOZARS® STORE OPERATIONS — COMMAND CENTER*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Orders & Fulfillment:*\n` +
      `• \`/today\` — Daily sales volume, revenue & payment split\n` +
      `• \`/orders\` — Recent orders with 1-Click [📦 Ship] buttons\n` +
      `• \`/find <query>\` — Search by order #, customer name, or phone\n\n` +
      `🔄 *Returns & Moderation:*\n` +
      `• \`/returns\` — Manage pending returns [✅ Approve / ❌ Reject]\n` +
      `• \`/reviews\` — Customer review moderation [⭐ Publish / 🗑️ Hide]\n\n` +
      `🚨 *Inventory & Promotions:*\n` +
      `• \`/stock\` — Low-stock SKUs with 1-Click [➕ Restock] buttons\n` +
      `• \`/carts\` — Recoverable abandoned checkouts with 1-Tap WhatsApp\n` +
      `• \`/discount <code> <percent>\` — Create live discount code\n\n` +
      `📊 *Executive Reports:*\n` +
      `• \`/morning\` or \`/digest\` — Daily morning summary briefing\n` +
      `• \`/night\` or \`/closing\` — End-of-day store closing report\n` +
      `• \`/broadcast <text>\` — Store memo broadcast\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Connected to Tanmay's Admin Account (@tanmayhitech)._`;

    await sendReply(chatId, helpMenu);
    return { ok: true, command: 'help' };
  } catch (err) {
    console.error('[TelegramWebhook] Exception:', err);
    return { ok: false, error: err.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('LOOZARS Telegram Operational Webhook Online');
  }

  // 1. Verify Telegram Webhook Secret Token if configured
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_SECRET_TOKEN;
  if (webhookSecret) {
    const receivedToken = req.headers['x-telegram-bot-api-secret-token'];
    if (!receivedToken || receivedToken !== webhookSecret) {
      console.warn('[TelegramWebhook] Unauthorized: Invalid or missing x-telegram-bot-api-secret-token header.');
      return res.status(401).json({ ok: false, error: 'Unauthorized webhook request.' });
    }
  }

  try {
    const result = await processTelegramUpdate(req.body || {});
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
