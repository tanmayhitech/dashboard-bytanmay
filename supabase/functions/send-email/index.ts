// LOOZARS® Edge Function: send-email
// Entrypoint for triggering and retrying transactional order emails via Resend

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { 
  sendTransactionalEmail, 
  buildOrderConfirmationEmail, 
  buildPaymentConfirmationEmail, 
  buildOrderStatusEmail,
  EmailEventType
} from '../_shared/email.ts';

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
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ success: false, error: 'Database secrets missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    const body = await req.json();
    const { orderId, eventType, newStatus } = body;

    if (!orderId || !eventType) {
      return new Response(JSON.stringify({ success: false, error: 'Missing orderId or eventType.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch authoritative order from database
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return new Response(JSON.stringify({ success: false, error: 'Order not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let emailData: { subject: string; html: string; text: string };

    switch (eventType as EmailEventType) {
      case 'order_confirmation':
        emailData = buildOrderConfirmationEmail(order);
        break;
      case 'payment_confirmation':
        if (order.payment_status !== 'paid') {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Cannot send payment confirmation: Order payment status is not paid.' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        emailData = buildPaymentConfirmationEmail(order);
        break;
      case 'order_status_confirmed':
      case 'order_status_processing':
      case 'order_status_shipped':
      case 'order_status_delivered':
      case 'order_status_cancelled':
        const statusToRender = newStatus || eventType.replace('order_status_', '');
        emailData = buildOrderStatusEmail(order, statusToRender);
        break;
      default:
        return new Response(JSON.stringify({ success: false, error: `Unsupported eventType "${eventType}".` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const result = await sendTransactionalEmail({
      supabaseAdmin,
      order,
      eventType: eventType as EmailEventType,
      emailData
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[send-email] Exception:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
