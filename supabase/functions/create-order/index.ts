// LOOZARS® Edge Function: create-order
// Server-Authoritative Checkout & Order Transaction Entrypoint

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { sendTransactionalEmail, buildOrderConfirmationEmail } from '../_shared/email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // 1. Handle CORS Preflight
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

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: Database secrets not populated.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      couponCode,
      paymentMethod = 'upi',
      notes = '',
      idempotencyKey = null
    } = body;

    // 2. Strict Input Validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Full customer name is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
      return new Response(
        JSON.stringify({ success: false, error: 'A valid email address is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanPhone = String(customerPhone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'A valid 10-digit mobile number is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!shippingAddress || typeof shippingAddress !== 'object' || !shippingAddress.address || !shippingAddress.city) {
      return new Response(
        JSON.stringify({ success: false, error: 'Complete street address, city, state, and pincode are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Your bag is empty. Please add items before checking out.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Format Items for Transaction RPC (strip client prices)
    const formattedItems = [];
    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (!item.variantId || isNaN(qty) || qty <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid product variant or quantity specified.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      formattedItems.push({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: qty
      });
    }

    // 4. Invoke Atomic Order Transaction RPC
    const { data, error } = await supabaseAdmin.rpc('create_order_transaction', {
      p_customer_name: customerName.trim(),
      p_customer_email: customerEmail.trim().toLowerCase(),
      p_customer_phone: cleanPhone,
      p_shipping_address: shippingAddress,
      p_items: formattedItems,
      p_coupon_code: couponCode ? String(couponCode).trim() : null,
      p_payment_method: paymentMethod,
      p_notes: notes ? String(notes).trim() : null,
      p_idempotency_key: idempotencyKey ? String(idempotencyKey).trim() : null,
      p_free_shipping_threshold: 2000,
      p_standard_shipping_fee: 99
    });

    // 5. Non-Blocking Order Confirmation Email Dispatch
    try {
      if (data && data.order_id) {
        const emailOrder = {
          id: data.order_id,
          order_number: data.order_number,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: cleanPhone,
          shipping_address: shippingAddress,
          items: data.items || formattedItems,
          subtotal_amount: data.subtotal_amount,
          discount_amount: data.discount_amount || 0,
          shipping_fee: data.shipping_fee || 0,
          total_amount: data.total_amount,
          coupon_code: couponCode ? String(couponCode).trim() : undefined,
          payment_method: paymentMethod,
          payment_status: 'pending',
          order_status: 'pending'
        };

        const emailData = buildOrderConfirmationEmail(emailOrder);
        // Non-blocking fire-and-forget / logged in email_events
        sendTransactionalEmail({
          supabaseAdmin,
          order: emailOrder,
          eventType: 'order_confirmation',
          emailData
        }).catch(e => console.warn('[create-order] Background email warning:', e.message));
      }
    } catch (emailErr) {
      console.warn('[create-order] Email notification error (order preserved):', emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: data
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[create-order] Unexpected error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred while processing your order.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
