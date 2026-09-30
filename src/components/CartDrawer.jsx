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
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Slide-out Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-3 sm:pl-10">
        <div className="w-screen max-w-md bg-[#0D0D11] border-l border-[#22222C] flex flex-col justify-between shadow-2xl text-zinc-100 sm:rounded-l-3xl overflow-hidden">
          
          {/* 1. Header */}
          <div className="px-5 sm:px-6 py-4.5 border-b border-[#20202A] flex items-center justify-between bg-[#111116]/95 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#181822] border border-[#282836] flex items-center justify-center text-zinc-300">
                <ShoppingBag size={15} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Shopping Bag
                </h2>
                <p className="text-xs text-zinc-400">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in your bag
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-[#181822] hover:bg-[#222230] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#282836]"
              aria-label="Close cart"
            >
              <X size={16} />
            </button>
          </div>

          {/* 2. Free Delivery Progress Bar */}
          {cart.length > 0 && (
            <div className="px-5 sm:px-6 py-3 bg-[#13131A] border-b border-[#20202A] space-y-2">
              <div className="flex items-center justify-between text-xs">
                {amountToFreeShipping === 0 ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Free express delivery unlocked!</span>
                  </span>
                ) : (
                  <span className="text-zinc-300">
                    Add <strong className="text-white font-bold">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> more for <span className="text-emerald-400 font-semibold">Free Delivery</span>
                  </span>
                )}
                <span className="text-zinc-400 font-mono text-[11px]">{shippingProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1C1C26] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    amountToFreeShipping === 0 
                      ? 'bg-emerald-400 shadow-sm' 
                      : 'bg-white'
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
                <div className="w-16 h-16 rounded-2xl bg-[#14141C] border border-[#22222E] flex items-center justify-center text-zinc-400 shadow-sm">
                  <ShoppingBag size={24} className="text-zinc-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">Your bag is empty</h3>
                  <p className="text-xs text-zinc-400 max-w-[240px] leading-relaxed">
                    Looks like you haven't added anything to your shopping bag yet.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('shop');
                  }}
                  className="mt-2 bg-white text-black hover:bg-zinc-200 px-6 py-3 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore Collection
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
                    className="p-3.5 bg-[#131319] border border-[#20202A] rounded-2xl flex gap-3.5 sm:gap-4 hover:border-[#2C2C3A] transition-all group"
                  >
                    {/* Item Thumbnail */}
                    <div 
                      onClick={() => {
                        setIsCartOpen(false);
                        navigateTo('product', item.product?.id || item.productId);
                      }}
                      className="w-20 aspect-[3/4] bg-[#1A1A24] overflow-hidden shrink-0 rounded-xl border border-[#262634] cursor-pointer relative group-hover:border-zinc-500 transition-colors"
                    >
                      {itemImg ? (
                        <img 
                          src={itemImg} 
                          alt={itemName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">
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
                            className="text-sm font-semibold text-white truncate hover:text-zinc-300 transition-colors cursor-pointer"
                          >
                            {itemName}
                          </h3>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(itemId, item.size)}
                            className="text-zinc-500 hover:text-rose-400 p-1 -mr-1 rounded-lg hover:bg-[#1E1E28] transition-colors cursor-pointer"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Size Badge & Unit Price */}
                        <div className="flex items-center gap-2 mt-1.5 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-[#1C1C26] text-zinc-300 border border-[#262634] font-medium text-[11px]">
                            Size: {item.size || 'M'}
                          </span>
                          <span className="text-zinc-400 font-mono text-xs">
                            ₹{itemPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#1C1C26]">
                        <div className="flex items-center border border-[#282836] bg-[#181822] rounded-xl overflow-hidden p-0.5">
                          <button 
                            onClick={() => updateQuantity(itemId, item.size, -1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#222230] rounded-lg transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-white tabular-nums">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(itemId, item.size, 1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#222230] rounded-lg transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-white">
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
            <div className="px-5 sm:px-6 py-4 border-t border-[#20202A] bg-[#111116] space-y-3.5 shadow-2xl">
              
              {/* Pricing Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-zinc-200 font-mono font-medium">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="font-mono font-medium">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-400">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? 'text-emerald-400 font-medium' : 'text-zinc-200 font-mono'}>
                    {shippingCost === 0 ? 'Free Express' : `₹${shippingCost}`}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-white pt-2.5 border-t border-[#20202A]">
                  <span>Total</span>
                  <span className="font-mono text-base">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout & View Bag CTAs */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('checkout');
                  }}
                  className="w-full bg-white hover:bg-zinc-200 text-black py-3.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('cart');
                  }}
                  className="w-full bg-[#181822] hover:bg-[#20202C] text-zinc-300 hover:text-white py-2.5 px-4 text-xs font-semibold rounded-xl border border-[#282836] transition-colors cursor-pointer text-center"
                >
                  View Full Bag & Estimate Delivery
                </button>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>Secure Checkout</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RotateCcw size={12} className="text-zinc-400" />
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
