import React from 'react';
import { useShop } from '../context/ShopContext';
import { formatOrderNumber } from '../services/orderService';

export const OrderConfirmationPage = () => {
  const { lastCompletedOrder, navigateTo } = useShop();

  // Retrieve last completed authoritative order from state or persistent storage
  const order = lastCompletedOrder || (() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('loozars_store_orders_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        }
      } catch (e) {}
    }
    return {
      order_number: 'LZR-0001',
      created_at: new Date().toISOString(),
      items: [
        {
          product_name: 'LZR RACING DIVISION',
          subtitle: 'Black Racing Tee',
          size: 'L',
          quantity: 1,
          unit_price: 899,
          line_total: 899
        }
      ],
      subtotal_amount: 899,
      discount_amount: 0,
      shipping_fee: 99,
      total_amount: 998,
      payment_method: 'razorpay',
      payment_status: 'paid',
      customer_name: 'Customer',
      shipping_address: {
        addressLine: 'Civil Lines Road',
        city: 'Kanpur',
        state: 'Uttar Pradesh',
        pincode: '208001',
        phone: '9876543210'
      }
    };
  })();

  const rawOrderNumber = order.order_number || order.orderNumber || order.orderId || 'LZR-0001';
  const orderNumber = formatOrderNumber(rawOrderNumber);
  const shippingAddress = order.shipping_address || order.shippingAddress || {};
  const customerName = order.customer_name || 
    order.customerName || 
    `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 
    'Customer';
  
  const firstName = customerName.split(' ')[0] || 'Customer';
  const customerPhone = order.customer_phone || order.customerPhone || shippingAddress.phone || '';

  const formatPlacedAt = (isoString) => {
    if (!isoString) return 'Today';
    try {
      const d = new Date(isoString);
      const dateStr = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `Placed at ${timeStr} IST · ${dateStr}`;
    } catch {
      return 'Recently';
    }
  };

  const rawItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items 
    : [
        {
          product_name: 'LOOZARS RACING SILHOUETTE',
          subtitle: 'Heavyweight Tee',
          size: 'M',
          quantity: 1,
          unit_price: Number(order.subtotal_amount ?? order.total_amount ?? 899),
          line_total: Number(order.subtotal_amount ?? order.total_amount ?? 899)
        }
      ];

  const totalItemCount = rawItems.reduce((sum, item) => sum + Number(item.quantity || item.qty || 1), 0);
  const itemsLabel = `${totalItemCount} ${totalItemCount === 1 ? 'ITEM' : 'ITEMS'}`;

  const subtotal = Number(order.subtotal_amount ?? order.subtotal ?? 0) || rawItems.reduce((acc, i) => acc + Number(i.line_total || (i.unit_price * (i.quantity || 1))), 0);
  const discount = Number(order.discount_amount ?? order.discount ?? 0);
  const shipping = Number(order.shipping_fee ?? order.shipping ?? 0);
  const total = Number(order.total_amount ?? order.total ?? Math.max(0, subtotal - discount) + shipping);
  
  const isPaid = order.payment_status === 'paid' || order.paymentStatus === 'paid';
  const isCod = (order.payment_method || order.paymentMethod) === 'cod';

  const formatItemSecondary = (item) => {
    const parts = [];

    // Extract color or clean short subtitle
    if (item.color) {
      parts.push(item.color);
    } else if (item.subtitle) {
      const cleanSub = item.subtitle.replace(/Racing Tee|Tee|Jersey|Oversized|Heavyweight/gi, '').trim();
      if (cleanSub) {
        parts.push(cleanSub);
      } else {
        parts.push(item.subtitle);
      }
    }

    if (item.size) {
      parts.push(`Size ${item.size}`);
    }

    const qty = Number(item.quantity || item.qty || 1);
    parts.push(`Qty ${qty}`);

    return parts.join(' · ');
  };

  return (
    <div className="w-full min-h-screen bg-[#080808] text-zinc-100 font-sans pt-28 sm:pt-36 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Header Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ORDER CONFIRMED
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
              Thank you, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Order #{orderNumber} · {formatPlacedAt(order.created_at)}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pt-1">
            Your order has been received and is being prepared for dispatch at our studio.
          </p>
        </div>

        {/* Order Items Section - Purely Typographic */}
        <div className="bg-[#111111] border border-zinc-800/80 rounded-xl p-5 sm:p-7 space-y-6">
          
          <div className="flex items-center justify-between text-xs tracking-wider text-zinc-400 font-medium pb-2 border-b border-zinc-800/60">
            <span>YOUR ORDER</span>
            <span className="text-zinc-500">{itemsLabel}</span>
          </div>

          {/* Product List */}
          <div className="space-y-4">
            {rawItems.map((item, idx) => {
              const unitPrice = Number(item.unit_price || item.unitPrice || item.price || 899);
              const qty = Number(item.quantity || item.qty || 1);
              const lineTotal = Number(item.line_total || (unitPrice * qty));
              const secondaryText = formatItemSecondary(item);

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <div className="border-t border-zinc-800/60" />}
                  <div className="flex items-start justify-between gap-4 py-1">
                    <div className="space-y-1 min-w-0 pr-2">
                      <p className="text-sm font-medium text-white tracking-wide truncate">
                        {item.product_name || item.name || 'LOOZARS SILHOUETTE'}
                      </p>
                      <p className="text-xs text-zinc-400 font-normal">
                        {secondaryText}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-medium text-white tabular-nums">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Calculation / Total Breakdown */}
          <div className="border-t border-zinc-800/60 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Items</span>
              <span className="text-zinc-200 tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({order.coupon_code || order.couponCode || 'PROMO'})</span>
                <span className="tabular-nums">−₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-zinc-400">
              <span>Shipping</span>
              <span className="text-zinc-200">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>

            <div className="border-t border-zinc-800/60 pt-3 flex justify-between items-center text-sm font-medium text-white">
              <span className="tracking-wide">TOTAL</span>
              <span className="text-base tabular-nums font-semibold">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

        </div>

        {/* Delivery & Payment Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Delivery To */}
          <div className="bg-[#111111] border border-zinc-800/80 rounded-xl p-5 space-y-2">
            <span className="text-[10px] tracking-wider text-zinc-500 font-medium uppercase block">
              DELIVERY TO
            </span>
            <div className="space-y-0.5 text-zinc-300">
              <p className="font-medium text-white text-xs">{customerName}</p>
              <p className="text-zinc-400 leading-relaxed">
                {shippingAddress.addressLine || shippingAddress.address || 'Civil Lines Road'}<br />
                {shippingAddress.apartment ? `${shippingAddress.apartment}, ` : ''}
                {[shippingAddress.city, shippingAddress.state].filter(Boolean).join(', ')} {shippingAddress.pincode ? `— ${shippingAddress.pincode}` : ''}
              </p>
              {customerPhone && (
                <p className="text-zinc-500 pt-1 text-[11px]">+91 {customerPhone}</p>
              )}
            </div>
          </div>

          {/* Payment & Delivery */}
          <div className="bg-[#111111] border border-zinc-800/80 rounded-xl p-5 space-y-2">
            <span className="text-[10px] tracking-wider text-zinc-500 font-medium uppercase block">
              PAYMENT & DELIVERY
            </span>
            <div className="space-y-1.5 text-zinc-300">
              <p className="font-medium text-white">
                {isPaid ? 'Paid Online' : (isCod ? 'Cash on Delivery' : 'Online Payment (Pending)')}
              </p>
              <p className="text-zinc-400">
                Arrives in 3–5 Business Days
              </p>
              <p className="text-zinc-500 text-[11px]">
                Standard Pan-India Studio Fulfillment
              </p>
            </div>
          </div>

        </div>

        {/* Footer CTA & Support */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/60">
          <button
            onClick={() => navigateTo('shop')}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-medium text-xs tracking-wide transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>

          <span className="text-xs text-zinc-500">
            Need assistance? <a href="mailto:support@theloozars.com" className="text-zinc-300 hover:text-white transition-colors underline underline-offset-2">support@theloozars.com</a>
          </span>
        </div>

      </div>
    </div>
  );
};
