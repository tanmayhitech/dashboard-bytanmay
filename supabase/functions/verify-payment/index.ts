// LOOZARS® Edge Function: verify-payment
// Server-Authoritative HMAC-SHA256 Payment Verification & Atomic State Transition

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { sendTransactionalEmail, buildPaymentConfirmationEmail } from '../_shared/email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Constant-time byte-by-byte comparison to prevent timing side-channel attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') || Deno.env.get('VITE_RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database configuration missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!razorpayKeySecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment gateway secrets not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

    // 1. Input Validation
    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required payment verification parameters (orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature).' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    // 2. Fetch Order from Supabase
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId.trim())
      .single();

    if (fetchError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found for verification.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Idempotent Return if Already Confirmed
    if (order.payment_status === 'paid' && order.razorpay_payment_id === razorpayPaymentId.trim()) {
      return new Response(
        JSON.stringify({
          success: true,
          idempotentReplay: true,
          order: {
            orderId: order.order_number,
            dbOrderId: order.id,
            paymentStatus: order.payment_status,
            orderStatus: order.order_status,
            total: order.total_amount,
            subtotal: order.subtotal_amount,
            discount: order.discount_amount,
            shipping: order.shipping_fee,
            items: order.items,
            shippingAddress: order.shipping_address
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Cryptographic HMAC-SHA256 Signature Verification
    const message = `${razorpayOrderId.trim()}|${razorpayPaymentId.trim()}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(razorpayKeySecret.trim());
    const msgData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const generatedHexSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isSignatureValid = timingSafeEqual(generatedHexSignature, razorpaySignature.trim());

    if (!isSignatureValid) {
      console.error('[verify-payment] Cryptographic signature mismatch for order:', order.id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cryptographic signature mismatch. Payment verification rejected.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Server-Side Razorpay API Cross-Check (Defense in Depth)
    if (razorpayKeyId) {
      try {
        const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret.trim()}`);
        const rzpPayRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId.trim()}`, {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        });

        if (rzpPayRes.ok) {
          const rzpPayment = await rzpPayRes.json();
          const expectedPaise = Math.round(order.total_amount * 100);

          // Verify payment details match order
          if (rzpPayment.amount !== expectedPaise) {
            console.error('[verify-payment] Amount mismatch. Expected:', expectedPaise, 'Got:', rzpPayment.amount);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `Payment amount mismatch: Expected ₹${order.total_amount}, received ₹${rzpPayment.amount / 100}.` 
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (rzpPayment.currency !== 'INR') {
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid currency code.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (rzpPayment.order_id && rzpPayment.order_id !== razorpayOrderId.trim()) {
            return new Response(
              JSON.stringify({ success: false, error: 'Razorpay order ID mismatch.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (!['captured', 'authorized'].includes(rzpPayment.status)) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `Payment is not in a completed state (Status: ${rzpPayment.status}).` 
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (apiErr) {
        console.warn('[verify-payment] Secondary Razorpay API lookup warning:', apiErr);
        // Continue if cryptographic signature was valid
      }
    }

    // 6. Atomic Database State Transition
    const { data: updatedOrder, error: rpcError } = await supabaseAdmin.rpc('confirm_order_payment', {
      p_order_id: order.id,
      p_razorpay_payment_id: razorpayPaymentId.trim(),
      p_razorpay_order_id: razorpayOrderId.trim(),
      p_razorpay_signature: razorpaySignature.trim()
    });

    // 7. Non-Blocking Payment Confirmation Email Dispatch (Idempotent)
    try {
      const emailOrder = {
        id: updatedOrder.order_id || order.id,
        order_number: updatedOrder.order_number || order.order_number,
        customer_name: updatedOrder.customer_name || order.customer_name,
        customer_email: updatedOrder.customer_email || order.customer_email,
        customer_phone: order.customer_phone,
        shipping_address: updatedOrder.shipping_address || order.shipping_address,
        items: updatedOrder.items || order.items,
        subtotal_amount: updatedOrder.subtotal_amount || order.subtotal_amount,
        discount_amount: updatedOrder.discount_amount || order.discount_amount || 0,
        shipping_fee: updatedOrder.shipping_fee || order.shipping_fee || 0,
        total_amount: updatedOrder.total_amount || order.total_amount,
        coupon_code: order.coupon_code,
        payment_method: order.payment_method || 'razorpay',
        payment_status: 'paid',
        order_status: 'confirmed',
        razorpay_payment_id: razorpayPaymentId.trim(),
        paid_at: new Date().toISOString()
      };

      const emailData = buildPaymentConfirmationEmail(emailOrder);
      sendTransactionalEmail({
        supabaseAdmin,
        order: emailOrder,
        eventType: 'payment_confirmation',
        emailData
      }).catch(e => console.warn('[verify-payment] Background email warning:', e.message));
    } catch (emailErr) {
      console.warn('[verify-payment] Email notification error (payment preserved):', emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          orderId: updatedOrder.order_number,
          dbOrderId: updatedOrder.order_id,
          paymentStatus: updatedOrder.payment_status,
          orderStatus: updatedOrder.order_status,
          total: updatedOrder.total_amount,
          subtotal: updatedOrder.subtotal_amount,
          discount: updatedOrder.discount_amount,
          shipping: updatedOrder.shipping_fee,
          items: updatedOrder.items,
          shippingAddress: updatedOrder.shipping_address
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[verify-payment] Unexpected verification error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected internal error occurred during payment verification.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
