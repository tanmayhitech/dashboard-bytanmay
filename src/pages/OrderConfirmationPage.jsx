import React from 'react';
import { useShop } from '../context/ShopContext';
import { Check, ArrowRight, PackageCheck, Truck, MapPin } from 'lucide-react';

export const OrderConfirmationPage = () => {
  const { lastCompletedOrder, navigateTo } = useShop();

  const order = lastCompletedOrder || {
    orderId: 'LZR-IND-894210',
    date: '27 Sep 2026',
    items: [],
    subtotal: 899,
    shipping: 0,
    total: 899,
    shippingAddress: {
      firstName: 'Customer',
      lastName: '',
      address: 'Civil Lines',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      pincode: '208001',
      phone: '9876543210'
    },
    trackingNumber: null,
    courierName: null,
    estimatedDelivery: '3–5 Business Days'
  };

  return (
    <div className="w-full min-h-screen bg-[#090909] pt-28 sm:pt-36 pb-24 px-5 sm:px-10 lg:px-14">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Success Stamp & Header */}
        <div className="border border-[#1f1f1f] bg-[#0d0d0d] p-8 sm:p-12 space-y-6 relative overflow-hidden">
          
          {/* Subtle Red Watermark */}
          <div className="absolute top-4 right-4 text-[10px] font-mono text-[#A62626] border border-[#A62626]/40 px-2.5 py-1 tracking-widest uppercase">
            ACQUIRED // LOOZARS ARCHIVE
          </div>

          <div className="w-12 h-12 rounded-full bg-[#A62626]/10 border border-[#A62626] flex items-center justify-center text-[#A62626]">
            <Check size={24} />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs text-[#8E8D8A] tracking-[0.25em] uppercase">
              ORDER CONFIRMED // {order.orderId}
            </span>
            <h1 className="font-editorial text-3xl sm:text-5xl text-[#F5F4F0] font-normal uppercase leading-tight">
              YOUR PIECE IS RESERVED.
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#8E8D8A] leading-relaxed">
              We have received your order. Your garment is being packaged in our Kanpur, Uttar Pradesh atelier and prepared for dispatch.
            </p>
          </div>

          {/* Logistics & Tracking Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1a1a1a] pt-6 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[#8E8D8A] block">DISPATCH STATUS:</span>
              {order.trackingNumber ? (
                <>
                  <span className="text-[#F5F4F0] font-bold block">{order.trackingNumber}</span>
                  <span className="text-[#A62626] text-[10px] block uppercase">
                    VIA {order.courierName || 'EXPRESS COURIER'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[#EDE7DC] font-medium block">PREPARING FOR DISPATCH</span>
                  <span className="text-[#8E8D8A] text-[10px] block">
                    Tracking ID will be issued upon courier handover
                  </span>
                </>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[#8E8D8A] block">PAYMENT METHOD:</span>
              <span className="text-[#A3E635] font-bold uppercase">
                ● {order.paymentMethod === 'cod' 
                    ? 'CASH ON DELIVERY (PAY UPON ARRIVAL)' 
                    : (order.paymentStatus === 'paid' ? 'PAID & VERIFIED (ONLINE)' : (order.paymentStatus || 'PENDING').toUpperCase())}
              </span>
              <span className="text-[#8E8D8A] text-[10px] block">TOTAL: ₹{order.total?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Purchased Items Breakdown */}
          {order.items && order.items.length > 0 && (
            <div className="border-t border-[#1a1a1a] pt-6 font-mono text-xs space-y-3">
              <span className="text-[#8E8D8A] uppercase tracking-wider block">PURCHASED PIECES:</span>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[#F5F4F0] border-b border-[#141414] pb-2">
                    <div>
                      <span className="font-bold">{item.product_name || item.name}</span>
                      <span className="text-[#8E8D8A] ml-2 text-[11px]">Size: {item.size} • Qty: {item.quantity}</span>
                    </div>
                    <span>₹{((item.unit_price || item.unitPrice || 899) * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Address Summary */}
          <div className="border-t border-[#1a1a1a] pt-6 font-mono text-xs space-y-2">
            <span className="text-[#8E8D8A] uppercase tracking-wider block">DELIVERING TO:</span>
            <p className="text-[#F5F4F0]">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
              Phone: +91 {order.shippingAddress.phone}
            </p>
          </div>

          {/* CTA */}
          <div className="pt-6 border-t border-[#1a1a1a]">
            <button
              onClick={() => navigateTo('shop')}
              className="inline-flex items-center gap-3 bg-[#F5F4F0] text-[#090909] px-8 py-4 text-xs font-mono font-bold tracking-[0.2em] uppercase hover:bg-[#A62626] hover:text-white transition-colors"
            >
              <span>RETURN TO ARCHIVE</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
