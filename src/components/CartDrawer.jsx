import React from 'react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  ShoppingBag, 
  CheckCircle2, 
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';

export const CartDrawer = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity, 
    cartSubtotal, 
    appliedCoupon,
    couponDiscount,
    netSubtotal,
    shippingCost, 
    freeShippingThreshold, 
    cartTotal,
    navigateTo
  } = useShop();

  if (!isCartOpen) return null;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - netSubtotal);
  const shippingProgress = Math.min(100, Math.round((netSubtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-[99] overflow-hidden select-none font-sans">
      {/* Soft Dark Backdrop with smooth blur */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Slide-out Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-3 sm:pl-10">
        <div className="w-screen max-w-md bg-[#09090B] border-l border-[#222228] flex flex-col justify-between shadow-2xl text-[#EDE7DC] sm:rounded-l-3xl overflow-hidden">
          
          {/* 1. Header */}
          <div className="px-5 sm:px-6 py-4.5 border-b border-[#1E1E26] flex items-center justify-between bg-[#0E0E12]/95 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#16161E] border border-[#8E1717]/40 flex items-center justify-center text-[#EDE7DC]">
                <ShoppingBag size={14} className="text-[#EDE7DC]" />
              </div>
              <div>
                <h2 className="font-editorial text-base sm:text-lg font-bold tracking-wider uppercase text-[#EDE7DC]">
                  Shopping Bag
                </h2>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8E8D8A]">
                  {totalItemsCount} {totalItemsCount === 1 ? 'Piece Selected' : 'Pieces Selected'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-[#14141A] hover:bg-[#8E1717] text-[#8E8D8A] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#242430]"
              aria-label="Close cart"
            >
              <X size={15} />
            </button>
          </div>

          {/* 2. Free Delivery Progress Bar */}
          {cart.length > 0 && (
            <div className="px-5 sm:px-6 py-3.5 bg-[#101015] border-b border-[#1E1E26] space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px] sm:text-[11px] tracking-wider uppercase">
                {amountToFreeShipping === 0 ? (
                  <span className="text-[#EDE7DC] flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#8E1717] animate-pulse"></span>
                    <span>Free Express Delivery Unlocked</span>
                  </span>
                ) : (
                  <span className="text-[#8E8D8A]">
                    Add <strong className="text-[#EDE7DC]">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> for <span className="text-[#A62626] font-bold">Free Shipping</span>
                  </span>
                )}
                <span className="text-[#8E8D8A] font-mono">{shippingProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1C1C24] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    amountToFreeShipping === 0 
                      ? 'bg-gradient-to-r from-[#8E1717] to-[#EDE7DC] shadow-sm' 
                      : 'bg-[#EDE7DC]'
                  }`}
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 3. Items List */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#14141C] border border-[#242432] flex items-center justify-center text-[#8E8D8A] shadow-lg">
                  <ShoppingBag size={24} className="text-[#8E8D8A]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-editorial text-lg font-bold uppercase tracking-wider text-[#EDE7DC]">
                    Your Bag is Empty
                  </h3>
                  <p className="font-mono text-[11px] text-[#8E8D8A] tracking-wide max-w-[240px] leading-relaxed">
                    Discover heavyweight tees and drop exclusives.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('shop');
                  }}
                  className="mt-2 bg-[#EDE7DC] hover:bg-[#8E1717] text-[#080808] hover:text-white px-6 py-3 text-xs font-mono font-bold tracking-[0.2em] uppercase rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore Drop 01 →
                </button>
              </div>
            ) : (
              cart.map((item, idx) => {
                const itemImg = item.product?.images?.[0] || item.image || '';
                const itemName = item.product?.name || item.name || 'LOOZARS Apparel';
                const itemPrice = item.product?.price || item.unitPrice || 899;
                const lineTotal = itemPrice * item.quantity;
                const itemId = item.variantId || item.product?.id || item.productId;

                return (
                  <div 
                    key={item.variantId || `${item.productId}-${item.size}-${idx}`}
                    className="p-3.5 bg-[#121217] border border-[#202028] hover:border-[#8E1717]/40 rounded-2xl flex gap-3.5 sm:gap-4 transition-all group shadow-sm"
                  >
                    {/* Item Thumbnail */}
                    <div 
                      onClick={() => {
                        setIsCartOpen(false);
                        navigateTo('product', item.product?.id || item.productId);
                      }}
                      className="w-20 aspect-[3/4] bg-[#181820] overflow-hidden shrink-0 rounded-xl border border-[#262632] group-hover:border-[#8E1717] cursor-pointer relative transition-colors"
                    >
                      {itemImg ? (
                        <img 
                          src={itemImg} 
                          alt={itemName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter contrast-[1.02]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8E8D8A] text-xs font-mono font-bold">
                          LZR
                        </div>
                      )}
                    </div>

                    {/* Details & Controls */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 
                            onClick={() => {
                              setIsCartOpen(false);
                              navigateTo('product', item.product?.id || item.productId);
                            }}
                            className="font-editorial text-sm font-bold uppercase tracking-wider text-[#EDE7DC] truncate hover:text-[#A62626] transition-colors cursor-pointer"
                          >
                            {itemName}
                          </h3>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(itemId, item.size)}
                            className="text-[#66666E] hover:text-[#A62626] p-1 -mr-1 rounded-lg hover:bg-[#1C1C26] transition-colors cursor-pointer"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Size Badge & Unit Price */}
                        <div className="flex items-center gap-2 mt-1.5 font-mono text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-[#181822] text-[#EDE7DC] border border-[#282836] font-medium text-[10px] tracking-wider uppercase">
                            SIZE: {item.size || 'M'}
                          </span>
                          <span className="text-[#8E8D8A] font-mono text-xs">
                            ₹{itemPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#1C1C24]">
                        <div className="flex items-center border border-[#282836] bg-[#161620] rounded-xl overflow-hidden p-0.5">
                          <button 
                            onClick={() => updateQuantity(itemId, item.size, -1)}
                            className="w-6 h-6 flex items-center justify-center text-[#8E8D8A] hover:text-white hover:bg-[#20202C] rounded-lg transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-7 text-center font-mono text-xs font-bold text-[#EDE7DC] tabular-nums">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(itemId, item.size, 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#8E8D8A] hover:text-white hover:bg-[#20202C] rounded-lg transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-[#EDE7DC]">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Footer & Order Summary */}
          {cart.length > 0 && (
            <div className="px-5 sm:px-6 py-4.5 border-t border-[#1E1E26] bg-[#0E0E12] space-y-3.5 shadow-2xl">
              
              {/* Pricing Breakdown */}
              <div className="space-y-2 font-mono text-xs tracking-wider uppercase">
                <div className="flex justify-between text-[#8E8D8A]">
                  <span>Subtotal</span>
                  <span className="text-[#EDE7DC] font-bold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="font-bold">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#8E8D8A]">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? 'text-[#EDE7DC] font-bold' : 'text-[#EDE7DC]'}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>

                <div className="flex justify-between font-editorial text-base sm:text-lg font-bold text-[#EDE7DC] pt-2.5 border-t border-[#1E1E26] tracking-wider">
                  <span>Total</span>
                  <span className="font-mono font-bold text-base sm:text-lg">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout & View Bag CTAs */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('checkout');
                  }}
                  className="w-full bg-[#EDE7DC] hover:bg-[#8E1717] text-[#080808] hover:text-white py-3.5 px-4 font-mono text-xs font-bold tracking-[0.25em] uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(142,23,23,0.4)] active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('cart');
                  }}
                  className="w-full bg-[#14141A] hover:bg-[#1C1C24] text-[#8E8D8A] hover:text-[#EDE7DC] py-2.5 px-4 font-mono text-[11px] tracking-wider uppercase rounded-xl border border-[#242432] transition-colors cursor-pointer text-center"
                >
                  View Full Bag & Delivery Details
                </button>

                <div className="flex items-center justify-between font-mono text-[10px] tracking-wider text-[#8E8D8A] pt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[#8E1717]" />
                    <span>Secure Checkout</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RotateCcw size={12} className="text-[#8E1717]" />
                    <span>7-Day Easy Exchange</span>
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
