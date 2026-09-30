import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendTelegramNotification } from './telegram-notify.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dfxmudxuqwsxdtimtqqa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[CRITICAL] SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || 'MISSING_SERVICE_ROLE_KEY', {
  auth: { persistSession: false }
});

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
    const orderId = String(req.body?.orderId || req.body?.order_id || '').trim();
    const razorpayPaymentId = String(req.body?.razorpayPaymentId || req.body?.razorpay_payment_id || '').trim();
    const razorpayOrderId = String(req.body?.razorpayOrderId || req.body?.razorpay_order_id || '').trim();
    const razorpaySignature = String(req.body?.razorpaySignature || req.body?.razorpay_signature || '').trim();

    // 1. Mandatory Parameter Validation (Zero-tolerance for missing/empty fields)
    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing mandatory payment verification fields: orderId, razorpayPaymentId, razorpayOrderId, and razorpaySignature are all required.' 
      });
    }

    // 2. Explicit Rejection of Simulated or Bypass Signatures
    const FORBIDDEN_TEST_SIGNATURES = new Set([
      'simulated_signature_dev',
      'direct_test_signature',
      'test_signature',
      'bypass',
      'mock_signature',
      'simulated',
      'null',
      'undefined'
    ]);

    if (FORBIDDEN_TEST_SIGNATURES.has(razorpaySignature.toLowerCase())) {
      console.warn('[api/verify-payment] Blocked attempt to use simulated/test signature in payment verification.');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment signature. Synthetic or test signatures are strictly prohibited.' 
      });
    }

    // 3. Gateway Secret Configuration Check
    if (!RAZORPAY_KEY_SECRET) {
      console.error('[CRITICAL] RAZORPAY_KEY_SECRET is missing from server environment.');
      return res.status(500).json({ 
        success: false, 
        error: 'Server payment gateway configuration error.' 
      });
    }

    // 4. Cryptographic HMAC-SHA256 Signature Verification (Constant-Time)
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const providedBuf = Buffer.from(razorpaySignature, 'utf-8');

    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      console.warn('[api/verify-payment] Cryptographic HMAC-SHA256 signature verification failed for order:', orderId);
      return res.status(400).json({ 
        success: false, 
        error: 'Payment signature verification failed. Cryptographic proof is invalid.' 
      });
    }

    // 5. Fetch Authoritative Order from Database
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    let currentOrder = order;

    if (fetchErr || !currentOrder) {
      const { data: orderByNum } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_number', orderId)
        .maybeSingle();

      currentOrder = orderByNum;
    }

    if (!currentOrder) {
      return res.status(404).json({ 
        success: false, 
        error: 'Authoritative order record not found in database.' 
      });
    }

    // 6. Verify Razorpay Order ID Association
    if (currentOrder.razorpay_order_id && currentOrder.razorpay_order_id !== razorpayOrderId) {
      console.warn('[api/verify-payment] Razorpay Order ID mismatch with DB record:', {
        expected: currentOrder.razorpay_order_id,
        received: razorpayOrderId
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Razorpay order ID mismatch with authoritative order record.' 
      });
    }

    // 7. Order Idempotency Protection — If already verified and marked paid, return success idempotently
    if (currentOrder.payment_status === 'paid') {
      return res.status(200).json({
        success: true,
        already_paid: true,
        idempotent: true,
        order: currentOrder,
        order_id: currentOrder.id,
        order_number: currentOrder.order_number,
        payment_status: currentOrder.payment_status,
        order_status: currentOrder.order_status
      });
    }

    const nowIso = new Date().toISOString();

    // 8. Authoritative Atomic Database Update
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'confirmed',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        paid_at: currentOrder.paid_at || nowIso,
        updated_at: nowIso
      })
      .eq('id', currentOrder.id)
      .select()
      .single();

    if (updateErr) {
      console.error('[api/verify-payment] Error updating authoritative order status:', updateErr);
      return res.status(500).json({ success: false, error: updateErr.message });
    }

    // 9. Update Influencer Commission status to 'eligible'
    try {
      await supabaseAdmin
        .from('influencer_commissions')
        .update({ status: 'eligible', updated_at: nowIso })
        .eq('order_id', currentOrder.id);
    } catch (commErr) {
      console.warn('[api/verify-payment] Commission update notice:', commErr?.message);
    }

    // 10. Trigger Transactional Email in background
    if (typeof fetch !== 'undefined') {
      try {
        const baseUrl = process.env.VITE_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
        fetch(`${baseUrl}/api/send-order-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: updatedOrder.id })
        }).catch(emailErr => console.warn('[api/verify-payment] Email dispatch note:', emailErr?.message));
      } catch (err) {
        // ignore
      }
    }

    // 11. Trigger Non-Blocking Operational Telegram Alert for Verified Paid Order
    try {
      sendTelegramNotification({
        type: 'new_order',
        orderNumber: updatedOrder.order_number,
        customerName: updatedOrder.customer_name,
        customerPhone: updatedOrder.customer_phone,
        customerEmail: updatedOrder.customer_email,
        amount: updatedOrder.total_amount,
        items: updatedOrder.items,
        paymentMethod: updatedOrder.payment_method || 'ONLINE'
      }).catch(tgErr => console.warn('[api/verify-payment] Telegram alert notice:', tgErr?.message));
    } catch (err) {
      // ignore
    }

    return res.status(200).json({
      success: true,
      order: updatedOrder,
      order_id: updatedOrder.id,
      order_number: updatedOrder.order_number,
      payment_status: updatedOrder.payment_status,
      order_status: updatedOrder.order_status
    });
  } catch (err) {
    console.error('[api/verify-payment] Exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
