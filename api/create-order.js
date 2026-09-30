import { createClient } from '@supabase/supabase-js';
import { sendTelegramNotification } from './telegram-notify.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dfxmudxuqwsxdtimtqqa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[CRITICAL] SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || 'MISSING_SERVICE_ROLE_KEY', {
  auth: { persistSession: false }
});

/**
 * Generates clean, sequential, permanent order number: LZR-0001, LZR-0002, etc.
 */
async function generateNextOrderNumber() {
  try {
    const { count, error } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });

    let nextNum = (error || count === null || count === undefined) ? 1 : (count + 1);

    // Verify uniqueness in case of race condition or custom numbers
    let candidate = `LZR-${String(nextNum).padStart(4, '0')}`;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      const { data } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('order_number', candidate)
        .maybeSingle();

      if (!data) {
        isUnique = true;
      } else {
        nextNum += 1;
        candidate = `LZR-${String(nextNum).padStart(4, '0')}`;
        attempts += 1;
      }
    }

    return candidate;
  } catch (err) {
    console.warn('[api/create-order] Error querying order count:', err);
    return `LZR-${String(Math.floor(1000 + Math.random() * 9000))}`;
  }
}

function sanitizeString(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/<[^>]*>/g, '').trim();
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      couponCode,
      paymentMethod = 'razorpay',
      notes = '',
      idempotencyKey = null
    } = req.body || {};

    const cleanCustomerName = sanitizeString(customerName);
    const cleanCustomerEmail = sanitizeString(customerEmail);
    const cleanCustomerPhone = sanitizeString(customerPhone);
    const cleanShippingAddress = shippingAddress && typeof shippingAddress === 'object' ? {
      addressLine: sanitizeString(shippingAddress.addressLine || ''),
      city: sanitizeString(shippingAddress.city || ''),
      state: sanitizeString(shippingAddress.state || ''),
      pincode: sanitizeString(shippingAddress.pincode || ''),
      landmark: sanitizeString(shippingAddress.landmark || '')
    } : {};

    if (!cleanCustomerName || !cleanCustomerEmail || !cleanCustomerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required customer or order item fields.' });
    }

    // 1. Check Idempotency to prevent duplicate orders on double-submit
    if (idempotencyKey) {
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingOrder) {
        return res.status(200).json({
          success: true,
          order: existingOrder,
          order_id: existingOrder.id,
          order_number: existingOrder.order_number,
          total_amount: existingOrder.total_amount,
          is_duplicate: true
        });
      }
    }

    // 2. Fetch live catalog products & variants to enforce authoritative server pricing
    const { data: dbProducts } = await supabaseAdmin
      .from('products')
      .select('*, product_variants(*)');

    const productsMap = new Map();
    const variantsMap = new Map();

    if (Array.isArray(dbProducts)) {
      dbProducts.forEach(p => {
        productsMap.set(p.id, p);
        if (p.slug) productsMap.set(p.slug, p);
        if (p.sku) productsMap.set(p.sku, p);
        if (Array.isArray(p.product_variants)) {
          p.product_variants.forEach(v => {
            variantsMap.set(v.id, { ...v, product: p });
            variantsMap.set(`${p.id}-${v.size}`, { ...v, product: p });
            if (p.slug) variantsMap.set(`${p.slug}-${v.size}`, { ...v, product: p });
          });
        }
      });
    }

    // 3. Construct Authoritative Item Snapshots & Calculate Authoritative Subtotal
    let subtotalAmount = 0;
    const snapshotItems = [];

    for (const item of items) {
      const rawProdId = item.productId || item.product_id || item.productSlug || 'lzr-velo-07';
      const rawVarId = item.variantId || item.variant_id;
      const size = item.size || 'M';
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      let matchedVariant = null;
      if (rawVarId && variantsMap.has(rawVarId)) {
        matchedVariant = variantsMap.get(rawVarId);
      } else if (variantsMap.has(`${rawProdId}-${size}`)) {
        matchedVariant = variantsMap.get(`${rawProdId}-${size}`);
      }

      let matchedProduct = null;
      if (matchedVariant?.product) {
        matchedProduct = matchedVariant.product;
      } else if (productsMap.has(rawProdId)) {
        matchedProduct = productsMap.get(rawProdId);
      }

      if (matchedProduct && matchedProduct.is_active === false) {
        return res.status(400).json({ success: false, error: `Product '${matchedProduct.name || rawProdId}' is currently unavailable.` });
      }

      if (matchedVariant && (matchedVariant.stock_quantity ?? 0) < qty) {
        return res.status(400).json({ success: false, error: `Selected item size (${size}) is out of stock.` });
      }

      // Determine Authoritative Unit Price: variant price override -> product sale price -> product base price -> item price fallback
      const authoritativeUnitPrice = Number(
        matchedVariant?.price_override ?? 
        matchedProduct?.sale_price ?? 
        matchedProduct?.base_price ?? 
        item.price ?? 
        item.unitPrice ?? 
        899
      );

      const lineTotal = authoritativeUnitPrice * qty;
      subtotalAmount += lineTotal;

      snapshotItems.push({
        product_id: matchedProduct?.id || item.productId || '00000000-0000-0000-0000-000000000001',
        product_slug: matchedProduct?.slug || item.productSlug || 'lzr-velo-07',
        variant_id: matchedVariant?.id || item.variantId || 'cabc5e4a-5347-47ca-845c-a44103124761',
        sku: matchedVariant?.sku || item.sku || `${matchedProduct?.sku || 'LZR-D01'}-${size}`,
        product_name: matchedProduct?.name || item.name || item.product_name || 'LOOZARS Silhouette',
        subtitle: matchedProduct?.subtitle || item.subtitle || '',
        size: size,
        quantity: qty,
        unit_price: authoritativeUnitPrice,
        line_total: lineTotal,
        image: (Array.isArray(matchedProduct?.images) && matchedProduct.images[0]) || item.image || ''
      });
    }

    // 4. Authoritative Coupon & Influencer Verification
    let discountAmount = 0;
    let appliedCouponCode = null;
    let appliedCouponId = null;
    let influencerId = null;
    let influencerCommissionAmount = 0;
    let influencerCommissionRate = 0;

    if (couponCode && String(couponCode).trim()) {
      const cleanCode = String(couponCode).trim().toUpperCase();

      // Check standard promo coupons
      const { data: dbCoupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .ilike('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (dbCoupon) {
        const now = new Date();
        const startsAt = dbCoupon.starts_at ? new Date(dbCoupon.starts_at) : null;
        const expiresAt = dbCoupon.expires_at ? new Date(dbCoupon.expires_at) : null;
        const isStarted = !startsAt || startsAt <= now;
        const isNotExpired = !expiresAt || expiresAt >= now;
        const meetsMinOrder = !dbCoupon.min_order_amount || subtotalAmount >= dbCoupon.min_order_amount;
        const underUsageLimit = !dbCoupon.usage_limit || (dbCoupon.times_used || 0) < dbCoupon.usage_limit;

        if (isStarted && isNotExpired && meetsMinOrder && underUsageLimit) {
          appliedCouponCode = dbCoupon.code;
          appliedCouponId = dbCoupon.id;
          if (dbCoupon.discount_type === 'percentage') {
            discountAmount = Math.round((subtotalAmount * Number(dbCoupon.discount_value)) / 100);
            if (dbCoupon.max_discount_amount && discountAmount > dbCoupon.max_discount_amount) {
              discountAmount = dbCoupon.max_discount_amount;
            }
          } else {
            discountAmount = Math.min(subtotalAmount, Math.round(Number(dbCoupon.discount_value)));
          }
        }
      }

      // Check Creator Affiliate coupons if not matched in standard coupons
      if (!appliedCouponCode) {
        const { data: dbInfluencer } = await supabaseAdmin
          .from('influencers')
          .select('*')
          .ilike('coupon_code', cleanCode)
          .eq('is_active', true)
          .maybeSingle();

        if (dbInfluencer) {
          appliedCouponCode = dbInfluencer.coupon_code;
          influencerId = dbInfluencer.id;
          const discVal = Number(dbInfluencer.customer_discount_value || 10);
          if (dbInfluencer.customer_discount_type === 'percentage') {
            discountAmount = Math.round((subtotalAmount * discVal) / 100);
          } else {
            discountAmount = Math.min(subtotalAmount, Math.round(discVal));
          }

          // Creator commission
          const commVal = Number(dbInfluencer.commission_value || 8);
          influencerCommissionRate = commVal;
          const commBase = Math.max(0, subtotalAmount - discountAmount);
          if (dbInfluencer.commission_type === 'percentage') {
            influencerCommissionAmount = Math.round((commBase * commVal) / 100);
          } else {
            influencerCommissionAmount = Math.round(commVal);
          }
        }
      }

      // Hardcoded offline fallback for development promo codes if coupons table empty
      if (!appliedCouponCode) {
        if (cleanCode === 'DROP01' || cleanCode === 'LOOZAR10') {
          appliedCouponCode = cleanCode;
          discountAmount = Math.round(subtotalAmount * 0.1);
        } else if (cleanCode === 'LOOZAR100') {
          appliedCouponCode = cleanCode;
          discountAmount = Math.min(500, subtotalAmount);
        }
      }
    }

    // 5. Final Financial Authoritative Totals
    discountAmount = Math.min(subtotalAmount, Math.max(0, discountAmount));
    const netSubtotal = Math.max(0, subtotalAmount - discountAmount);
    // Shipping: Free if netSubtotal >= ₹2,000 or bag is ₹0; else ₹99
    const shippingFee = (netSubtotal >= 2000 || netSubtotal === 0) ? 0 : 99;
    const totalAmount = netSubtotal + shippingFee;

    // 6. Generate Clean Authoritative Order Number: LZR-0001, LZR-0002, etc.
    const orderNumber = await generateNextOrderNumber();

    // 7. Insert Authoritative Order Record into Supabase
    const orderRecord = {
      order_number: orderNumber,
      customer_name: cleanCustomerName,
      customer_email: cleanCustomerEmail,
      customer_phone: cleanCustomerPhone,
      shipping_address: cleanShippingAddress,
      items: snapshotItems,
      subtotal_amount: subtotalAmount,
      discount_amount: discountAmount,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      coupon_code: appliedCouponCode || null,
      influencer_id: influencerId || null,
      influencer_commission_amount: influencerCommissionAmount,
      payment_method: paymentMethod,
      payment_status: 'pending',
      order_status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      idempotency_key: idempotencyKey || `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: notes || null,
      created_at: new Date().toISOString()
    };

    const { data: insertedOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (insertError) {
      console.error('[api/create-order] Failed to insert order row:', insertError);
      return res.status(500).json({ success: false, error: insertError.message });
    }

    // 8. If creator attributed, insert into influencer_commissions ledger
    if (influencerId && influencerCommissionAmount > 0) {
      try {
        await supabaseAdmin
          .from('influencer_commissions')
          .insert({
            influencer_id: influencerId,
            order_id: insertedOrder.id,
            order_number: insertedOrder.order_number,
            order_amount: insertedOrder.total_amount,
            commission_rate_applied: influencerCommissionRate,
            commission_amount: influencerCommissionAmount,
            status: paymentMethod === 'cod' ? 'pending' : 'eligible',
            created_at: new Date().toISOString()
          });
      } catch (commErr) {
        console.warn('[api/create-order] Commission ledger insert note:', commErr?.message);
      }
    }

    // 9. If coupon applied, increment times_used
    if (appliedCouponId) {
      try {
        const { data: cData } = await supabaseAdmin.from('coupons').select('times_used').eq('id', appliedCouponId).maybeSingle();
        if (cData) {
          await supabaseAdmin.from('coupons').update({ times_used: (cData.times_used || 0) + 1 }).eq('id', appliedCouponId);
        }
      } catch (cErr) {
        console.warn('[api/create-order] Coupon usage increment note:', cErr?.message);
      }
    }

    // 10. Decrement stock for purchased variants & log in inventory_logs
    for (const snap of snapshotItems) {
      const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isUUID(snap.variant_id)) {
        const { data: currentVar } = await supabaseAdmin
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', snap.variant_id)
          .maybeSingle();

        if (currentVar) {
          const prevStock = currentVar.stock_quantity || 0;
          const newStock = Math.max(0, prevStock - snap.quantity);
          await supabaseAdmin
            .from('product_variants')
            .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
            .eq('id', snap.variant_id);

          try {
            await supabaseAdmin
              .from('inventory_logs')
              .insert({
                variant_id: snap.variant_id,
                order_id: insertedOrder.id,
                change_type: 'order_placed',
                quantity_delta: -snap.quantity,
                previous_stock: prevStock,
                new_stock: newStock,
                reason: `Order placed: #${insertedOrder.order_number}`
              });
          } catch (logErr) {
            console.warn('[api/create-order] Inventory log insert note:', logErr?.message);
          }
        }
      }
    }

    // 11. Trigger Non-Blocking Operational Notifications ONLY FOR CONFIRMED COD ORDERS
    // Online orders awaiting Razorpay payment DO NOT trigger Telegram or email until payment is verified.
    if (paymentMethod === 'cod') {
      try {
        sendTelegramNotification({
          type: 'new_order',
          orderNumber: insertedOrder.order_number,
          customerName: insertedOrder.customer_name,
          customerPhone: insertedOrder.customer_phone,
          customerEmail: insertedOrder.customer_email,
          amount: insertedOrder.total_amount,
          items: insertedOrder.items,
          paymentMethod: 'COD'
        }).catch(tgErr => console.warn('[api/create-order] Telegram alert notice:', tgErr?.message));
      } catch (err) {
        // non-blocking
      }

      // Trigger Confirmation Email for COD
      try {
        const baseUrl = process.env.VITE_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
        fetch(`${baseUrl}/api/send-order-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: insertedOrder.id })
        }).catch(emailErr => console.warn('[api/create-order] Email dispatch note:', emailErr?.message));
      } catch (err) {
        // ignore
      }
    }

    return res.status(200).json({
      success: true,
      order: insertedOrder,
      order_id: insertedOrder.id,
      order_number: insertedOrder.order_number,
      total_amount: insertedOrder.total_amount
    });
  } catch (err) {
    console.error('[api/create-order] Exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
