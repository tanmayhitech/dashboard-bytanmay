import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dfxmudxuqwsxdtimtqqa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
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
    const { orderId } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required to initialize payment.' });
    }

    // 1. Fetch Authoritative Order from Supabase (by UUID id or by order_number)
    let authoritativeOrder = null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId).trim());

    if (isUUID) {
      const { data: orderById } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', String(orderId).trim())
        .maybeSingle();

      authoritativeOrder = orderById;
    }

    if (!authoritativeOrder) {
      const { data: orderByNum } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_number', String(orderId).trim())
        .maybeSingle();

      authoritativeOrder = orderByNum;
    }

    if (!authoritativeOrder) {
      return res.status(404).json({ success: false, error: 'Authoritative order record not found in database.' });
    }

    // Check if already paid
    if (authoritativeOrder.payment_status === 'paid') {
      return res.status(400).json({ success: false, error: 'This order has already been paid.' });
    }

    // Authoritative Amount in Paise (e.g., ₹1,897 -> 189700 paise)
    const totalAmount = Number(authoritativeOrder.total_amount || 0);
    const amountInPaise = Math.round(totalAmount * 100);

    if (amountInPaise <= 0) {
      return res.status(400).json({ success: false, error: 'Order total must be greater than zero.' });
    }

    // 2. Call Razorpay API to create official Razorpay Order
    let razorpayOrderId = null;

    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_ID.includes('placeholder')) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: authoritativeOrder.order_number,
            notes: {
              order_id: authoritativeOrder.id,
              order_number: authoritativeOrder.order_number,
              customer_name: authoritativeOrder.customer_name,
              customer_email: authoritativeOrder.customer_email
            }
          })
        });

        if (rzpResponse.ok) {
          const rzpData = await rzpResponse.json();
          razorpayOrderId = rzpData.id;

          // Save Razorpay order ID to database
          await supabaseAdmin
            .from('orders')
            .update({ razorpay_order_id: razorpayOrderId })
            .eq('id', authoritativeOrder.id);
        } else {
          const rzpErrJson = await rzpResponse.json().catch(() => ({}));
          console.warn('[api/create-payment] Razorpay API error response:', rzpErrJson);
          return res.status(502).json({ 
            success: false, 
            error: rzpErrJson?.error?.description || 'Failed to initialize payment with payment gateway.' 
          });
        }
      } catch (rzpErr) {
        console.error('[api/create-payment] Razorpay invocation error:', rzpErr.message);
        return res.status(500).json({ 
          success: false, 
          error: 'Payment gateway communication failure.' 
        });
      }
    }

    return res.status(200).json({
      success: true,
      orderId: authoritativeOrder.id,
      orderNumber: authoritativeOrder.order_number,
      razorpayOrderId: razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      totalAmount: totalAmount
    });
  } catch (err) {
    console.error('[api/create-payment] Exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
