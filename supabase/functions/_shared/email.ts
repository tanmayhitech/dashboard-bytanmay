// LOOZARS® — Server-Side Transactional Email Module (Resend API)
// Shared across Supabase Edge Functions with idempotency, failure isolation & editorial dark templates.

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

export type EmailEventType = 
  | 'order_confirmation'
  | 'payment_confirmation'
  | 'order_status_confirmed'
  | 'order_status_processing'
  | 'order_status_shipped'
  | 'order_status_delivered'
  | 'order_status_cancelled';

export interface EmailOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: {
    address?: string;
    apartment?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items: Array<{
    product_name?: string;
    name?: string;
    sku?: string;
    size?: string;
    quantity: number;
    unit_price: number;
    line_total?: number;
  }>;
  subtotal_amount: number;
  discount_amount?: number;
  shipping_fee?: number;
  total_amount: number;
  coupon_code?: string;
  payment_method?: string;
  payment_status?: string;
  order_status?: string;
  razorpay_payment_id?: string;
  tracking_number?: string;
  courier_name?: string;
  notes?: string;
  created_at?: string;
  paid_at?: string;
}

/**
 * Generates Loozars Branded HTML Email Template
 */
function renderLoozarsHtmlLayout({
  title,
  badgeText,
  heading,
  subheading,
  bodyContent,
  order
}: {
  title: string;
  badgeText: string;
  heading: string;
  subheading: string;
  bodyContent: string;
  order: EmailOrder;
}): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.shipping_address || {};

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #1c1c1c; font-family: monospace; font-size: 12px; color: #EDE7DC;">
        <strong style="color: #EDE7DC; font-size: 13px;">${item.product_name || item.name || 'Loozars Tee'}</strong><br/>
        <span style="color: #8E8D8A; font-size: 11px;">SIZE: ${item.size || 'M'} &bull; SKU: ${item.sku || 'N/A'}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #1c1c1c; font-family: monospace; font-size: 12px; color: #EDE7DC; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #1c1c1c; font-family: monospace; font-size: 12px; color: #EDE7DC; text-align: right; font-weight: bold;">
        ₹${(item.line_total || (item.unit_price * item.quantity)).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080808; color: #EDE7DC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #080808; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0e0e0e; border: 1px solid #1e1e1e; border-radius: 2px; overflow: hidden; text-align: left;">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 24px 30px; background-color: #0c0c0c; border-bottom: 1px solid #1c1c1c;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: monospace; font-size: 10px; color: #8E1717; letter-spacing: 0.25em; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">LOOZARS® // ATELIER</span>
                    <span style="font-family: Georgia, serif; font-size: 18px; color: #EDE7DC; letter-spacing: 0.05em; text-transform: uppercase;">RACER ARCHIVE</span>
                  </td>
                  <td align="right">
                    <span style="font-family: monospace; font-size: 10px; color: #EDE7DC; background-color: #181818; border: 1px solid #282828; padding: 4px 8px; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.1em;">${badgeText}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <h1 style="font-family: Georgia, serif; font-size: 24px; color: #EDE7DC; margin: 0 0 8px 0; text-transform: uppercase; font-weight: normal; letter-spacing: 0.02em;">${heading}</h1>
              <p style="font-family: monospace; font-size: 12px; color: #8E8D8A; margin: 0; line-height: 1.6;">${subheading}</p>
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          ${bodyContent ? `
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #121212; border: 1px solid #1c1c1c; border-left: 3px solid #8E1717; padding: 14px 18px; font-family: monospace; font-size: 12px; color: #EDE7DC; line-height: 1.6;">
                ${bodyContent}
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Order Summary Header -->
          <tr>
            <td style="padding: 10px 30px 0 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 1px solid #222222; padding-bottom: 8px;">
                <tr>
                  <td><span style="font-family: monospace; font-size: 11px; color: #8E1717; text-transform: uppercase; font-weight: bold; letter-spacing: 0.15em;">ORDER DOSSIER</span></td>
                  <td align="right"><span style="font-family: monospace; font-size: 12px; color: #EDE7DC; font-weight: bold;">${order.order_number}</span></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Itemized Breakdown Table -->
          <tr>
            <td style="padding: 10px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <thead>
                  <tr style="font-family: monospace; font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.1em;">
                    <th align="left" style="padding-bottom: 8px;">Piece</th>
                    <th align="center" style="padding-bottom: 8px;">Qty</th>
                    <th align="right" style="padding-bottom: 8px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Tally -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family: monospace; font-size: 12px; color: #8E8D8A; line-height: 1.8;">
                <tr>
                  <td>Subtotal</td>
                  <td align="right" style="color: #EDE7DC;">₹${order.subtotal_amount?.toLocaleString('en-IN')}</td>
                </tr>
                ${(order.discount_amount || 0) > 0 ? `
                <tr>
                  <td style="color: #A3E635;">Discount (${order.coupon_code || 'PROMO'})</td>
                  <td align="right" style="color: #A3E635;">-₹${order.discount_amount?.toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}
                <tr>
                  <td>Shipping Fee</td>
                  <td align="right" style="color: #EDE7DC;">${order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee}`}</td>
                </tr>
                <tr style="font-size: 14px; font-weight: bold; color: #EDE7DC; border-top: 1px solid #222222;">
                  <td style="padding-top: 10px;">Total Amount</td>
                  <td align="right" style="padding-top: 10px; color: #EDE7DC;">₹${order.total_amount?.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Destination Card -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #101010; border: 1px solid #1a1a1a; padding: 16px; border-radius: 2px;">
                <span style="font-family: monospace; font-size: 10px; color: #8E1717; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold; display: block; margin-bottom: 6px;">SHIPPING DESTINATION</span>
                <p style="font-family: monospace; font-size: 12px; color: #EDE7DC; margin: 0 0 2px 0; font-weight: bold;">${order.customer_name}</p>
                <p style="font-family: monospace; font-size: 11px; color: #8E8D8A; margin: 0; line-height: 1.5;">
                  ${address.address || 'Address on file'}${address.apartment ? `, ${address.apartment}` : ''}<br/>
                  ${address.city || ''}${address.state ? `, ${address.state}` : ''} ${address.pincode || ''}<br/>
                  India &bull; ${order.customer_phone || ''}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 30px; background-color: #090909; border-top: 1px solid #181818; text-align: center; font-family: monospace; font-size: 10px; color: #555555; line-height: 1.6;">
              <span style="color: #8E1717; font-weight: bold; letter-spacing: 0.15em;">LOOZARS®</span> &bull; By The Rare. For The Rare.<br/>
              This is an automated transactional notification regarding order ${order.order_number}.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Builds Plain-Text fallback for an email
 */
function renderLoozarsPlainText({
  heading,
  bodyContent,
  order
}: {
  heading: string;
  bodyContent: string;
  order: EmailOrder;
}): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.shipping_address || {};

  const itemsText = items.map(i => 
    `- ${i.product_name || i.name || 'Item'} (Size: ${i.size || 'M'}, SKU: ${i.sku || 'N/A'}) x ${i.quantity} = ₹${(i.line_total || (i.unit_price * i.quantity))}`
  ).join('\n');

  return `
LOOZARS® // ATELIER
==================================================
${heading.toUpperCase()}
Order Number: ${order.order_number}
Customer: ${order.customer_name} (${order.customer_email})
==================================================

${bodyContent ? bodyContent + '\n\n' : ''}ITEMS ORDERED:
${itemsText}

--------------------------------------------------
Subtotal:     ₹${order.subtotal_amount}
Discount:     -₹${order.discount_amount || 0}
Shipping Fee: ${order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee}`}
Total Amount: ₹${order.total_amount}
--------------------------------------------------

SHIPPING DESTINATION:
${order.customer_name}
${address.address || ''}${address.apartment ? `, ${address.apartment}` : ''}
${address.city || ''}, ${address.state || ''} ${address.pincode || ''}
Phone: ${order.customer_phone || ''}

==================================================
LOOZARS® — By The Rare. For The Rare.
This is an automated transactional message.
  `.trim();
}

/**
 * Template Generators
 */
export function buildOrderConfirmationEmail(order: EmailOrder): { subject: string; html: string; text: string } {
  const subject = `Order Confirmed: ${order.order_number} — LOOZARS®`;
  const heading = 'Order Placed Successfully';
  const subheading = `Thank you, ${order.customer_name}. We have received your order snapshot and are reserving your pieces.`;
  const bodyContent = `Your order <strong>${order.order_number}</strong> has been registered in our atelier ledger. If paid, your shipment will be prepared for dispatch shortly.`;

  return {
    subject,
    html: renderLoozarsHtmlLayout({
      title: subject,
      badgeText: 'ORDER CONFIRMED',
      heading,
      subheading,
      bodyContent,
      order
    }),
    text: renderLoozarsPlainText({ heading, bodyContent: 'Your order has been registered in our atelier ledger.', order })
  };
}

export function buildPaymentConfirmationEmail(order: EmailOrder): { subject: string; html: string; text: string } {
  const subject = `Payment Verified: ₹${order.total_amount} for ${order.order_number} — LOOZARS®`;
  const heading = 'Payment Confirmed';
  const subheading = `Payment for order ${order.order_number} has been verified and settled.`;
  const bodyContent = `
    <strong>PAYMENT STATUS: PAID & VERIFIED</strong><br/>
    Amount Settled: ₹${order.total_amount?.toLocaleString('en-IN')}<br/>
    ${order.razorpay_payment_id ? `Razorpay Reference: <span style="color:#A3E635;">${order.razorpay_payment_id}</span><br/>` : ''}
    Payment Method: ${(order.payment_method || 'Razorpay').toUpperCase()}<br/>
    Your pieces are now moving into fulfillment.
  `;

  return {
    subject,
    html: renderLoozarsHtmlLayout({
      title: subject,
      badgeText: 'PAYMENT SETTLED',
      heading,
      subheading,
      bodyContent,
      order
    }),
    text: renderLoozarsPlainText({
      heading: 'PAYMENT CONFIRMED',
      bodyContent: `Payment of ₹${order.total_amount} verified.\nPayment ID: ${order.razorpay_payment_id || 'N/A'}\nYour order is now being processed for dispatch.`,
      order
    })
  };
}

export function buildOrderStatusEmail(order: EmailOrder, newStatus: string): { subject: string; html: string; text: string } {
  const cleanStatus = newStatus.toLowerCase();
  let subject = `Order Update: ${order.order_number} is ${cleanStatus.toUpperCase()} — LOOZARS®`;
  let badgeText = cleanStatus.toUpperCase();
  let heading = `Order Status: ${cleanStatus.toUpperCase()}`;
  let subheading = `Your order ${order.order_number} has progressed to ${cleanStatus}.`;
  let bodyContent = '';

  switch (cleanStatus) {
    case 'confirmed':
      subheading = 'Your order is confirmed and scheduled for production.';
      bodyContent = 'We have verified your order details and payment. Your pieces are scheduled for preparation.';
      break;

    case 'processing':
      subheading = 'Your order is currently being packaged in the atelier.';
      bodyContent = 'Our dispatch team is currently inspecting and boxing your pieces according to Drop 01 packaging specifications.';
      break;

    case 'shipped':
      badgeText = 'DISPATCHED';
      subheading = 'Your package has been dispatched with courier partner.';
      bodyContent = `
        <strong>DISPATCH DETAILS:</strong><br/>
        ${order.courier_name ? `Courier: <strong>${order.courier_name}</strong><br/>` : ''}
        ${order.tracking_number ? `AWB / Tracking Number: <strong style="color: #EDE7DC; letter-spacing: 0.05em;">${order.tracking_number}</strong><br/>` : ''}
        Delivery is handled Pan-India.
      `;
      break;

    case 'delivered':
      badgeText = 'DELIVERED';
      subheading = 'Your package has been marked as delivered.';
      bodyContent = 'Your Loozars order has reached its destination. Thank you for collecting from DROP 01 — RACING DIVISION.';
      break;

    case 'cancelled':
      badgeText = 'CANCELLED';
      subheading = 'Your order has been cancelled.';
      bodyContent = `
        This order (${order.order_number}) has been cancelled.<br/>
        ${order.notes ? `Reason: ${order.notes}<br/>` : ''}
        Any inventory reserved for this order has been automatically returned to stock.
      `;
      break;

    default:
      bodyContent = `Order status updated to: ${cleanStatus}.`;
  }

  return {
    subject,
    html: renderLoozarsHtmlLayout({
      title: subject,
      badgeText,
      heading,
      subheading,
      bodyContent,
      order
    }),
    text: renderLoozarsPlainText({ heading, bodyContent: `Order status: ${cleanStatus.toUpperCase()}`, order })
  };
}

/**
 * Sends a Transactional Email via Resend HTTP API with Idempotency & Failure Isolation
 * NEVER throws or breaks the caller's transaction flow.
 */
export async function sendTransactionalEmail({
  supabaseAdmin,
  order,
  eventType,
  emailData
}: {
  supabaseAdmin: SupabaseClient;
  order: EmailOrder;
  eventType: EmailEventType;
  emailData: { subject: string; html: string; text: string };
}): Promise<{ success: boolean; skipped?: boolean; messageId?: string; error?: string }> {
  const recipient = order.customer_email?.trim().toLowerCase();
  if (!recipient || !recipient.includes('@')) {
    console.warn(`[email] Invalid recipient for order ${order.order_number}: ${recipient}`);
    return { success: false, error: 'Invalid or missing customer email address.' };
  }

  const idempotencyKey = `${order.id}_${eventType}`;

  // 1. Idempotency Check: Prevent duplicate sends
  try {
    const { data: existingEvent } = await supabaseAdmin
      .from('email_events')
      .select('id, status, provider_message_id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingEvent && existingEvent.status === 'sent') {
      console.info(`[email] Idempotency: Event ${eventType} already sent for order ${order.order_number}. Skipping duplicate.`);
      return { success: true, skipped: true, messageId: existingEvent.provider_message_id };
    }
  } catch (_checkErr) {
    // If table query fails, proceed gracefully
  }

  // 2. Fetch Resend Configuration from Server Environment
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

  if (!resendApiKey) {
    console.warn(`[email] RESEND_API_KEY not configured. Recording failed email event for order ${order.order_number}.`);
    try {
      await supabaseAdmin.rpc('record_email_event', {
        p_order_id: order.id,
        p_event_type: eventType,
        p_recipient: recipient,
        p_subject: emailData.subject,
        p_idempotency_key: idempotencyKey,
        p_status: 'failed',
        p_error: 'RESEND_API_KEY secret not populated in Edge Function environment.'
      });
    } catch (_dbErr) {}
    return { success: false, error: 'Resend API key not configured' };
  }

  // 3. Dispatch to Resend REST API
  try {
    const resendPayload = {
      from: `LOOZARS® <${fromEmail}>`,
      to: [recipient],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload)
    });

    const resendJson = await resendRes.json();

    if (!resendRes.ok || !resendJson.id) {
      const errorMsg = resendJson.message || resendJson.error?.message || `HTTP ${resendRes.status}`;
      console.error(`[email] Resend API error for ${order.order_number} (${eventType}):`, errorMsg);

      await supabaseAdmin.rpc('record_email_event', {
        p_order_id: order.id,
        p_event_type: eventType,
        p_recipient: recipient,
        p_subject: emailData.subject,
        p_idempotency_key: idempotencyKey,
        p_status: 'failed',
        p_error: errorMsg
      });

      return { success: false, error: errorMsg };
    }

    const messageId = resendJson.id;
    console.info(`[email] Resend delivery accepted for ${order.order_number} (${eventType}) -> Message ID: ${messageId}`);

    // 4. Record Successful Event in Database
    await supabaseAdmin.rpc('record_email_event', {
      p_order_id: order.id,
      p_event_type: eventType,
      p_recipient: recipient,
      p_subject: emailData.subject,
      p_idempotency_key: idempotencyKey,
      p_status: 'sent',
      p_provider_message_id: messageId,
      p_error: null
    });

    return { success: true, messageId };

  } catch (netErr: any) {
    console.error(`[email] Network exception sending email for ${order.order_number}:`, netErr.message);

    try {
      await supabaseAdmin.rpc('record_email_event', {
        p_order_id: order.id,
        p_event_type: eventType,
        p_recipient: recipient,
        p_subject: emailData.subject,
        p_idempotency_key: idempotencyKey,
        p_status: 'failed',
        p_error: netErr.message
      });
    } catch (_dbErr) {}

    return { success: false, error: netErr.message };
  }
}
