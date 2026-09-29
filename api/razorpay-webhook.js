import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dfxmudxuqwsxdtimtqqa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || 'MISSING_SERVICE_ROLE_KEY', {
  auth: { persistSession: false }
});

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Razorpay-Signature, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // 1. Signature Verification
    if (RAZORPAY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('[api/razorpay-webhook] Invalid signature received.');
        return res.status(400).json({ success: false, error: 'Invalid webhook signature.' });
      }
    }

    const payload = typeof req.body === 'object' ? req.body : JSON.parse(rawBody || '{}');
    const event = payload.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    // Handle payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentId = paymentEntity?.id;
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const customOrderId = paymentEntity?.notes?.order_id || orderEntity?.notes?.order_id;
      const customOrderNum = paymentEntity?.notes?.order_number || paymentEntity?.receipt || orderEntity?.receipt;

      let order = null;

      if (customOrderId) {
        const { data } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', customOrderId)
          .maybeSingle();
        order = data;
      }

      if (!order && razorpayOrderId) {
        const { data } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle();
        order = data;
      }

      if (!order && customOrderNum) {
        const { data } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('order_number', customOrderNum)
          .maybeSingle();
        order = data;
      }

      if (!order) {
        console.warn('[api/razorpay-webhook] Order not matched for event:', { event, razorpayOrderId, customOrderId });
        return res.status(200).json({ status: 'ignored', reason: 'Order not found' });
      }

      // 2. Idempotency Check — If already paid, do not repeat side effects
      if (order.payment_status === 'paid') {
        return res.status(200).json({ status: 'ok', already_processed: true, order_id: order.id });
      }

      const nowIso = new Date().toISOString();

      // 3. Update Order to 'paid' & 'confirmed'
      const { data: updatedOrder, error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'confirmed',
          razorpay_payment_id: paymentId || order.razorpay_payment_id,
          razorpay_order_id: razorpayOrderId || order.razorpay_order_id,
          paid_at: nowIso,
          updated_at: nowIso
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) {
        console.error('[api/razorpay-webhook] Error updating order status:', updateErr);
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      // 4. Update Influencer Commission status to 'eligible'
      try {
        await supabaseAdmin
          .from('influencer_commissions')
          .update({ status: 'eligible', updated_at: nowIso })
          .eq('order_id', order.id);
      } catch (commErr) {
        console.warn('[api/razorpay-webhook] Commission update note:', commErr?.message);
      }

      // 5. Trigger Confirmation Email
      try {
        const baseUrl = process.env.VITE_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
        fetch(`${baseUrl}/api/send-order-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: updatedOrder.id })
        }).catch(emailErr => console.warn('[api/razorpay-webhook] Email dispatch note:', emailErr?.message));
      } catch (err) {
        // ignore
      }

      return res.status(200).json({ status: 'ok', order_id: updatedOrder.id, order_number: updatedOrder.order_number });
    }

    // Default 200 acknowledgement for unhandled Razorpay events
    return res.status(200).json({ status: 'ignored', event });
  } catch (err) {
    console.error('[api/razorpay-webhook] Exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
