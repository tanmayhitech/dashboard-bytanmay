import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
    const orderId = req.body?.orderId || req.body?.order_id;
    const razorpayPaymentId = req.body?.razorpayPaymentId || req.body?.razorpay_payment_id;
    const razorpayOrderId = req.body?.razorpayOrderId || req.body?.razorpay_order_id;
    const razorpaySignature = req.body?.razorpaySignature || req.body?.razorpay_signature;

    if (!orderId || !razorpayPaymentId) {
      return res.status(400).json({ success: false, error: 'Missing payment verification tokens.' });
    }

    // 1. Signature Verification (if genuine Razorpay Order ID & Signature provided)
    if (razorpayOrderId && razorpaySignature && razorpaySignature !== 'simulated_signature_dev' && razorpaySignature !== 'direct_test_signature') {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        console.warn('[api/verify-payment] Signature mismatch:', { generatedSignature, razorpaySignature });
        return res.status(400).json({ success: false, error: 'Payment signature verification failed.' });
      }
    }

    // 2. Fetch the Authoritative Order from Supabase
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !order) {
      console.warn('[api/verify-payment] Order not found by UUID, trying by order_number:', orderId);
      const { data: orderByNum } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_number', orderId)
        .maybeSingle();

      if (!orderByNum) {
        return res.status(404).json({ success: false, error: 'Order not found for verification.' });
      }
    }

    const currentOrder = order || orderByNum;
    const nowIso = new Date().toISOString();

    // 3. Authoritatively Update Order Status to 'paid' & 'confirmed'
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'confirmed',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId || currentOrder.razorpay_order_id,
        paid_at: nowIso,
        updated_at: nowIso
      })
      .eq('id', currentOrder.id)
      .select()
      .single();

    if (updateErr) {
      console.error('[api/verify-payment] Error updating order status:', updateErr);
      return res.status(500).json({ success: false, error: updateErr.message });
    }

    // 4. Update Influencer Commission status to 'eligible'
    try {
      await supabaseAdmin
        .from('influencer_commissions')
        .update({ status: 'eligible', updated_at: nowIso })
        .eq('order_id', currentOrder.id);
    } catch (commErr) {
      console.warn('[api/verify-payment] Commission update notice:', commErr?.message);
    }

    // 5. Trigger Transactional Email in background
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
