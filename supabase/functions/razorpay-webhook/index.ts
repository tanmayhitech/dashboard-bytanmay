// LOOZARS® Edge Function: razorpay-webhook
// Asynchronous Webhook Processing for Razorpay Events (payment.captured / order.paid)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { sendTransactionalEmail, buildPaymentConfirmationEmail } from '../_shared/email.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[razorpay-webhook] Database secrets missing');
      return new Response('Server configuration error', { status: 500 });
    }

    const signature = req.headers.get('x-razorpay-signature');
    const rawBody = await req.text();

    // 1. Verify Webhook Signature if Secret is Configured
    if (webhookSecret && signature) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhookSecret);
      const msgData = encoder.encode(rawBody);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
      const generatedHex = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (generatedHex !== signature) {
        console.error('[razorpay-webhook] Invalid webhook signature');
        return new Response('Invalid webhook signature', { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.info(`[razorpay-webhook] Received event: ${event}`);

    // 2. Handle payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payload?.payment?.entity;
      const rzpOrderId = payment?.order_id || payload.payload?.order?.entity?.id;
      const rzpPaymentId = payment?.id;

      if (!rzpOrderId) {
        return new Response('No order_id in event payload', { status: 200 });
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false }
      });

      // Find order by razorpay_order_id
      const { data: order, error: findError } = await supabaseAdmin
        .from('orders')
        .select('id, payment_status, total_amount')
        .eq('razorpay_order_id', rzpOrderId)
        .single();

      if (findError || !order) {
        console.warn(`[razorpay-webhook] No order found for razorpay_order_id: ${rzpOrderId}`);
        return new Response('Order not found', { status: 200 });
      }

      // If not already paid, confirm payment atomically
      if (order.payment_status !== 'paid') {
        const { error: rpcError } = await supabaseAdmin.rpc('confirm_order_payment', {
          p_order_id: order.id,
          p_razorpay_payment_id: rzpPaymentId || 'webhook_captured',
          p_razorpay_order_id: rzpOrderId,
          p_razorpay_signature: signature || 'webhook_verified'
        });

        if (rpcError) {
          console.error('[razorpay-webhook] confirm_order_payment failed:', rpcError.message);
        } else {
          console.info(`[razorpay-webhook] Successfully confirmed payment for order: ${order.id}`);

          // Non-blocking payment confirmation email with idempotency protection
          try {
            const { data: fullOrder } = await supabaseAdmin
              .from('orders')
              .select('*')
              .eq('id', order.id)
              .single();

            if (fullOrder) {
              const emailData = buildPaymentConfirmationEmail(fullOrder);
              sendTransactionalEmail({
                supabaseAdmin,
                order: fullOrder,
                eventType: 'payment_confirmation',
                emailData
              }).catch(e => console.warn('[razorpay-webhook] Background email warning:', e.message));
            }
          } catch (emailErr) {
            console.warn('[razorpay-webhook] Email notification error (webhook preserved):', emailErr);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[razorpay-webhook] Error processing webhook:', err);
    return new Response('Internal error', { status: 500 });
  }
});
