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
    applyCoupon,
    removeCoupon,
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
    <div className="fixed inset-0 z-[99] overflow-hidden">
      {/* Soft Dark Backdrop with smooth blur */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-[#0c0c0c] border-l border-[#1f1f1f] flex flex-col justify-between shadow-2xl text-[#EDE7DC]">
          
          {/* 1. Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-[#1c1c1c] flex items-center justify-between bg-[#0e0e0e]/95 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#181818] border border-[#262626] flex items-center justify-center text-[#EDE7DC]">
                <ShoppingBag size={15} />
              </div>
              <div>
                <h2 className="text-xs font-semibold tracking-wider uppercase text-[#EDE7DC]">
                  Shopping Bag
                </h2>
                <span className="text-[11px] text-[#8E8D8A]">
                  {totalItemsCount} {totalItemsCount === 1 ? 'piece' : 'pieces'} selected
                </span>
              </div>
            </div>

            <button 
              onClick={() => setIsCartOpen(false)}
              className="text-[#8E8D8A] hover:text-[#EDE7DC] p-2 rounded-full hover:bg-white/5 transition-colors"
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2. Free Shipping Progress Bar */}
          {cart.length > 0 && (
            <div className="px-5 sm:px-6 py-3 bg-[#121212] border-b border-[#1c1c1c] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                {amountToFreeShipping === 0 ? (
                  <span className="text-[#A3E635] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} />
                    <span>✓ FREE Express Shipping across India unlocked!</span>
                  </span>
                ) : (
                  <span className="text-[#8E8D8A]">
                    Add <strong className="text-[#EDE7DC]">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> more for <span className="text-[#EDE7DC] font-semibold">FREE Shipping</span>
                  </span>
                )}
                <span className="text-[10px] text-[#666666]">{shippingProgress}%</span>
              </div>
              <div className="w-full h-1 bg-[#222222] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    amountToFreeShipping === 0 
                      ? 'bg-gradient-to-r from-[#84cc16] to-[#A3E635]' 
                      : 'bg-[#EDE7DC]'
                  }`}
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 3. Items List */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 divide-y divide-[#181818]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#141414] border border-[#222222] flex items-center justify-center text-[#666666]">
                  <ShoppingBag size={22} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#EDE7DC] font-medium">Your bag is empty</p>
                  <p className="text-xs text-[#8E8D8A] max-w-[220px]">
                    Discover heavyweight tees, oversized hoodies, and drop exclusives.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('shop');
                  }}
                  className="mt-3 bg-[#EDE7DC] text-[#080808] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase hover:bg-white transition-all shadow-md"
                >
                  Explore Drop 01
                </button>
              </div>
            ) : (
              cart.map((item, idx) => {
                const itemImg = item.product?.images?.[0] || item.image || '';
                const itemName = item.product?.name || item.name || 'LOOZARS Archive Apparel';
                const itemPrice = item.product?.price || item.unitPrice || 899;
                const itemBasePrice = item.product?.basePrice;
                const isSale = item.product?.isSale;
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
                      className="w-20 sm:w-22 aspect-[3/4] bg-[#141414] overflow-hidden shrink-0 border border-[#222222] rounded-sm cursor-pointer relative"
                    >
                      {itemImg ? (
                        <img 
                          src={itemImg} 
                          alt={itemName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#444444] text-[10px]">
                          LZR
                        </div>
                      )}
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
                            className="text-xs sm:text-sm font-medium text-[#EDE7DC] truncate hover:text-[#A3E635] transition-colors cursor-pointer"
                          >
                            {itemName}
                          </h3>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(itemId, item.size)}
                            className="text-[#666666] hover:text-[#EF4444] p-1 -mr-1 transition-colors rounded-sm hover:bg-white/5"
                            title="Remove from bag"
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Size & Pricing tags */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-[#161616] border border-[#262626] text-[10px] font-mono text-[#EDE7DC]">
                            Size: <strong className="ml-1 text-white">{item.size || 'M'}</strong>
                          </span>
                          {isSale && (
                            <span className="text-[9px] bg-[#8E1717] text-white px-1.5 py-0.5 rounded-sm uppercase font-mono font-bold">
                              Sale
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper & Price */}
                      <div className="flex items-center justify-between pt-2 mt-1">
                        <div className="flex items-center border border-[#262626] bg-[#141414] rounded-sm">
                          <button 
                            onClick={() => updateQuantity(itemId, item.size, -1)}
                            className="px-2.5 py-1 text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-semibold text-[#EDE7DC]">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(itemId, item.size, 1)}
                            className="px-2.5 py-1 text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-semibold text-[#EDE7DC]">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </span>
                          {isSale && itemBasePrice && (
                            <span className="block text-[10px] text-[#666666] line-through font-mono">
                              ₹{(itemBasePrice * item.quantity).toLocaleString('en-IN')}
                            </span>
                          )}
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
            <div className="px-5 sm:px-6 py-5 border-t border-[#1c1c1c] bg-[#101010] space-y-4 shadow-xl">
              
              {/* Pricing Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#8E8D8A]">
                  <span>Subtotal</span>
                  <span className="text-[#EDE7DC] font-medium">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-[#A3E635]">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#8E8D8A]">
                  <span>Express Shipping</span>
                  <span className={shippingCost === 0 ? 'text-[#A3E635] font-medium' : 'text-[#EDE7DC]'}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-semibold text-[#EDE7DC] pt-3 border-t border-[#222222]">
                  <span>Total Amount</span>
                  <span className="font-mono">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout CTAs */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('checkout');
                  }}
                  className="w-full bg-[#EDE7DC] text-[#080808] py-4 text-xs font-semibold tracking-wider uppercase hover:bg-white transition-all flex items-center justify-center gap-2 rounded-sm shadow-lg active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={14} />
                </button>

                <div className="flex items-center justify-between text-[10px] text-[#666666] pt-1 font-mono">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <ShieldCheck size={11} className="text-[#A3E635]" />
                    <span>SSL Encrypted Checkout</span>
                  </span>
                  <span className="text-zinc-400">7-Day Free Exchange</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
