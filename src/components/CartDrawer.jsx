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
  ShieldCheck
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
    <div className="fixed inset-0 z-[99] overflow-hidden select-none">
      {/* Soft Dark Backdrop with smooth blur */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Slide-out Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-[#0A0A0A] border-l border-[#222222] flex flex-col justify-between shadow-2xl text-[#F1EEE6]">
          
          {/* 1. Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-[#222222] flex items-center justify-between bg-[#0A0A0A] sticky top-0 z-10 font-mono">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[10px] text-[#8E8D8A] uppercase tracking-[0.2em]">
                <span>01</span>
                <span className="w-4 h-[1px] bg-[#8E8D8A]/50 inline-block"></span>
                <span>SHOPPING BAG</span>
              </div>
              <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-[#F1EEE6]">
                LOOZARS ARCHIVE
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#8E1717] font-bold tracking-widest uppercase">
                [{totalItemsCount} {totalItemsCount === 1 ? 'PIECE' : 'PIECES'}]
              </span>

              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-[#8E8D8A] hover:text-[#F1EEE6] p-1.5 transition-colors"
                aria-label="Close cart"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 2. Free Shipping Progress Bar */}
          {cart.length > 0 && (
            <div className="px-5 sm:px-6 py-3 bg-[#111111] border-b border-[#222222] space-y-1.5 font-mono text-[10px] tracking-wider uppercase">
              <div className="flex items-center justify-between">
                {amountToFreeShipping === 0 ? (
                  <span className="text-[#A3E635] flex items-center gap-1 font-bold">
                    <CheckCircle2 size={12} />
                    <span>FREE EXPRESS SHIPPING UNLOCKED</span>
                  </span>
                ) : (
                  <span className="text-[#8E8D8A]">
                    ADD <strong className="text-white">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> FOR <strong className="text-[#8E1717]">FREE SHIPPING</strong>
                  </span>
                )}
                <span className="text-[#666666]">{shippingProgress}%</span>
              </div>
              <div className="w-full h-1 bg-[#222222] overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    amountToFreeShipping === 0 
                      ? 'bg-[#A3E635]' 
                      : 'bg-[#F1EEE6]'
                  }`}
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 3. Items List */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 divide-y divide-[#1c1c1c] font-mono">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4 font-mono">
                <div className="w-12 h-12 rounded-full bg-[#141414] border border-[#222222] flex items-center justify-center text-[#666666]">
                  <ShoppingBag size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#8E8D8A] uppercase tracking-[0.2em]">00 // ARCHIVE EMPTY</p>
                  <p className="font-editorial text-xl text-[#F1EEE6] uppercase font-bold">NO PIECES SELECTED</p>
                  <p className="text-[11px] text-[#8E8D8A] max-w-[220px]">
                    Discover heavyweight tees and drop exclusives.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('shop');
                  }}
                  className="mt-2 bg-[#F1EEE6] text-[#0A0A0A] hover:bg-[#8E1717] hover:text-white px-6 py-2.5 text-[11px] font-bold tracking-[0.2em] uppercase transition-all rounded-none"
                >
                  EXPLORE THE ARCHIVE →
                </button>
              </div>
            ) : (
              cart.map((item, idx) => {
                const itemImg = item.product?.images?.[0] || item.image || '';
                const itemName = item.product?.name || item.name || 'LOOZARS Archive Apparel';
                const itemPrice = item.product?.price || item.unitPrice || 899;
                const lineTotal = itemPrice * item.quantity;
                const itemId = item.variantId || item.product?.id || item.productId;

                return (
                  <div 
                    key={item.variantId || `${item.productId}-${item.size}-${idx}`}
                    className="pt-4 first:pt-0 flex gap-3.5 sm:gap-4 group"
                  >
                    {/* Item Thumbnail */}
                    <div 
                      onClick={() => {
                        setIsCartOpen(false);
                        navigateTo('product', item.product?.id || item.productId);
                      }}
                      className="w-20 aspect-[3/4] bg-[#141414] overflow-hidden shrink-0 border border-[#262626] rounded-none cursor-pointer relative"
                    >
                      {itemImg ? (
                        <img 
                          src={itemImg} 
                          alt={itemName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-[1.05]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#444444] text-[10px]">
                          LZR
                        </div>
                      )}
                      <div className="absolute top-1 left-1 font-mono text-[8px] bg-black/80 text-white px-1">
                        0{idx + 1}
                      </div>
                    </div>

                    {/* Details & Controls */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 
                            onClick={() => {
                              setIsCartOpen(false);
                              navigateTo('product', item.product?.id || item.productId);
                            }}
                            className="text-xs font-bold text-[#F1EEE6] uppercase tracking-wider truncate hover:text-[#8E1717] transition-colors cursor-pointer"
                          >
                            {itemName}
                          </h3>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(itemId, item.size)}
                            className="text-[#666666] hover:text-[#EF4444] p-1 -mr-1 transition-colors"
                            title="Remove from bag"
                            aria-label="Remove item"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Size Tag & Price */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-[#8E8D8A] uppercase tracking-wider">
                            SIZE: <strong className="text-white">{item.size || 'M'}</strong>
                          </span>
                          <span className="text-[10px] text-[#444444]">·</span>
                          <span className="text-[10px] font-mono text-[#8E8D8A]">
                            ₹{itemPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center justify-between pt-2 mt-1">
                        <div className="flex items-center border border-[#282828] bg-[#111111]">
                          <button 
                            onClick={() => updateQuantity(itemId, item.size, -1)}
                            className="px-2 py-1 text-[#8E8D8A] hover:text-white transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold text-[#F1EEE6]">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(itemId, item.size, 1)}
                            className="px-2 py-1 text-[#8E8D8A] hover:text-white transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-[#F1EEE6]">
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

          {/* 4. Footer & Summary */}
          {cart.length > 0 && (
            <div className="px-5 sm:px-6 py-4 border-t border-[#222222] bg-[#0E0E0E] space-y-3 font-mono shadow-2xl">
              
              {/* Pricing Breakdown */}
              <div className="space-y-1.5 text-[11px] pt-1">
                <div className="flex justify-between text-[#8E8D8A]">
                  <span>SUBTOTAL</span>
                  <span className="text-[#F1EEE6] font-bold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-[#A3E635]">
                    <span>COUPON DISCOUNT</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#8E8D8A]">
                  <span>EXPRESS SHIPPING</span>
                  <span className={shippingCost === 0 ? 'text-[#A3E635] font-bold' : 'text-[#F1EEE6]'}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-[#F1EEE6] pt-2 border-t border-[#222222]">
                  <span>TOTAL</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout CTAs */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('checkout');
                  }}
                  className="w-full bg-[#F1EEE6] text-[#0A0A0A] hover:bg-[#8E1717] hover:text-white py-3.5 text-xs font-bold tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-2 rounded-none shadow-xl active:scale-[0.99]"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight size={14} />
                </button>

                <div className="flex items-center justify-between text-[9px] text-[#666666] pt-0.5">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <ShieldCheck size={10} className="text-[#A3E635]" />
                    <span>SSL ENCRYPTED</span>
                  </span>
                  <span className="text-zinc-400">7-DAY HASSLE-FREE EXCHANGES</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
