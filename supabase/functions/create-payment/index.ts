// LOOZARS® Edge Function: create-payment
// Server-Authoritative Razorpay Order Generation

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

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
        JSON.stringify({ success: false, error: 'Server configuration error: Database secrets missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: Razorpay gateway credentials not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { orderId } = body;

    // Security Check: Explicitly forbid client from submitting price or calculation overrides
    if (
      body.amount !== undefined || 
      body.currency !== undefined || 
      body.total !== undefined || 
      body.subtotal !== undefined || 
      body.items !== undefined
    ) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Forbidden request: Payment amounts are authoritative and calculated strictly server-side.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orderId || typeof orderId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid Loozars orderId is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    // 1. Authoritative Order Lookup from Database
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total_amount, payment_status, order_status, razorpay_order_id, customer_name, customer_email, customer_phone')
      .eq('id', orderId.trim())
      .single();

    if (fetchError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'The specified order could not be found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Lifecycle Checks
    if (order.payment_status === 'paid') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This order has already been paid and confirmed.',
          alreadyPaid: true 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.order_status === 'cancelled') {
      return new Response(
        JSON.stringify({ success: false, error: 'This order has been cancelled and cannot be paid.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.total_amount || order.total_amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid order total amount.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Amount in Paise (INR integer ₹ to paise integer)
    const amountInPaise = Math.round(order.total_amount * 100);

    // 4. Reuse existing Razorpay order ID if already generated and unpaid
    if (order.razorpay_order_id && order.razorpay_order_id.startsWith('order_')) {
      return new Response(
        JSON.stringify({
          success: true,
          reused: true,
          orderId: order.id,
          orderNumber: order.order_number,
          razorpayOrderId: order.razorpay_order_id,
          amount: amountInPaise,
          currency: 'INR',
          keyId: razorpayKeyId,
          customer: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Create Razorpay Order via REST API
    const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.order_number || order.id,
        notes: {
          loozars_order_id: order.id,
          loozars_order_number: order.order_number,
          customer_email: order.customer_email
        }
      })
    });

    const rzpData = await rzpResponse.json();

    if (!rzpResponse.ok || !rzpData.id) {
      console.error('[create-payment] Razorpay API error:', rzpData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: rzpData.error?.description || 'Failed to initialize payment order with gateway.' 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Record Razorpay Order ID on Loozars Order in Database
    const { error: rpcError } = await supabaseAdmin.rpc('record_razorpay_order_id', {
      p_order_id: order.id,
      p_razorpay_order_id: rzpData.id
    });

    if (rpcError) {
      console.warn('[create-payment] Failed to record razorpay_order_id in DB:', rpcError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        razorpayOrderId: rzpData.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: razorpayKeyId,
        customer: {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[create-payment] Unexpected exception:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected internal server error occurred.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
