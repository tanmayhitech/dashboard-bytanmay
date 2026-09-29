import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dfxmudxuqwsxdtimtqqa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

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
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return res.status(404).json({ success: false, error: 'Order not found for email dispatch' });
    }

    const recipient = order.customer_email;
    if (!recipient || !recipient.includes('@')) {
      return res.status(400).json({ success: false, error: 'Invalid customer email' });
    }

    const orderNumber = order.order_number;
    const items = Array.isArray(order.items) ? order.items : [];
    const totalAmount = Number(order.total_amount || 0).toLocaleString('en-IN');
    const subtotal = Number(order.subtotal_amount || 0).toLocaleString('en-IN');
    const discount = Number(order.discount_amount || 0);
    const shipping = Number(order.shipping_fee || 0) === 0 ? 'FREE' : `₹${Number(order.shipping_fee || 0).toLocaleString('en-IN')}`;

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #222222; color: #ffffff;">
          <strong>${item.product_name || item.name || 'LOOZARS Silhouette'}</strong><br/>
          <span style="font-size: 12px; color: #888888;">Size: ${item.size || 'M'} | Qty: ${item.quantity || 1}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #222222; text-align: right; color: #ffffff;">
          ₹${Number(item.line_total || ((item.unit_price || 899) * (item.quantity || 1))).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Order Confirmation - ${orderNumber}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090909; color: #e4e4e7; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid #222222; border-radius: 12px; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 24px; font-weight: 700; letter-spacing: 2px; color: #ffffff; margin: 0;">LOOZARS</h1>
            <p style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Kanpur, Uttar Pradesh</p>
          </div>
          <div style="border-bottom: 1px solid #222222; padding-bottom: 20px; margin-bottom: 20px;">
            <span style="font-size: 12px; color: #10b981; font-weight: 600; text-transform: uppercase;">Order Confirmed</span>
            <h2 style="font-size: 20px; color: #ffffff; margin: 6px 0 0 0;">Thank you, ${order.customer_name}</h2>
            <p style="font-size: 13px; color: #a1a1aa; margin-top: 4px;">Order <strong>${orderNumber}</strong> has been received and is being prepared for dispatch.</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            ${itemsHtml}
          </table>
          <div style="border-top: 1px solid #222222; padding-top: 14px; font-size: 13px; color: #a1a1aa;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Subtotal:</span>
              <span style="color: #ffffff;">₹${subtotal}</span>
            </div>
            ${discount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #10b981;">
                <span>Discount (${order.coupon_code || 'PROMO'}):</span>
                <span>-₹${discount.toLocaleString('en-IN')}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Payment Method:</span>
              <span style="color: #ffffff; font-weight: 500;">${order.payment_method === 'cod' ? 'Cash on Delivery (Pending)' : (order.payment_status === 'paid' ? 'Paid Online' : 'Online Payment')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Shipping:</span>
              <span style="color: #ffffff;">${shipping}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 600; color: #ffffff; border-top: 1px solid #333333; padding-top: 10px;">
              <span>Total Amount:</span>
              <span>₹${totalAmount}</span>
            </div>
          </div>
          <div style="margin-top: 28px; padding: 16px; background-color: #161616; border-radius: 8px; font-size: 12px; color: #71717a; text-align: center;">
            Need help with your order? Reply directly to this email or reach us at <a href="mailto:support@loozars.com" style="color: #d4d4d8; text-decoration: underline;">support@loozars.com</a>.
          </div>
        </div>
      </body>
      </html>
    `;

    let resendMessageId = null;
    let emailStatus = 'pending';

    if (RESEND_API_KEY && !RESEND_API_KEY.includes('placeholder')) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: `LOOZARS® <${RESEND_FROM_EMAIL}>`,
            to: [recipient],
            subject: `Order Confirmed — ${orderNumber} | LOOZARS®`,
            html: htmlBody
          })
        });

        if (resendRes.ok) {
          const resendData = await resendRes.json();
          resendMessageId = resendData.id;
          emailStatus = 'sent';
        } else {
          emailStatus = 'failed';
          const errText = await resendRes.text();
          console.warn('[api/send-order-email] Resend API error:', errText);
        }
      } catch (e) {
        emailStatus = 'failed';
        console.warn('[api/send-order-email] Exception sending email via Resend:', e.message);
      }
    }

    // Record email event audit log in Supabase
    try {
      await supabaseAdmin
        .from('email_events')
        .insert({
          order_id: order.id,
          event_type: 'order_confirmation',
          recipient_email: recipient,
          status: emailStatus,
          attempts: 1,
          resend_message_id: resendMessageId,
          created_at: new Date().toISOString(),
          sent_at: emailStatus === 'sent' ? new Date().toISOString() : null
        });
    } catch (logErr) {
      console.warn('[api/send-order-email] email_events insert note:', logErr.message);
    }

    // Update confirmation_email_sent_at on order
    if (emailStatus === 'sent') {
      await supabaseAdmin
        .from('orders')
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq('id', order.id);
    }

    return res.status(200).json({
      success: emailStatus === 'sent',
      status: emailStatus,
      messageId: resendMessageId
    });
  } catch (err) {
    console.error('[api/send-order-email] Exception:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
