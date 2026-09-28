import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Tag, 
  RefreshCw,
  MapPin,
  CheckCircle2,
  Sparkles,
  Lock
} from 'lucide-react';

export const CartPage = () => {
  const { 
    cart, 
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
    navigateTo,
    deliveryPincode,
    deliveryInfo,
    isCheckingPincode,
    checkDeliveryPincode,
    clearDeliveryInfo
  } = useShop();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Pincode lookup UI state
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  const handleApplyPromo = async (codeToApply = null) => {
    const code = (codeToApply || promoCodeInput).trim();
    if (!code) return;

    setIsValidatingPromo(true);
    setPromoError('');

    const res = await applyCoupon(code);
    if (!res.success) {
      setPromoError(res.error || 'Invalid promo code');
    } else {
      setPromoCodeInput('');
      setPromoError('');
    }
    setIsValidatingPromo(false);
  };

  const handleCheckPincode = async (e) => {
    e?.preventDefault();
    setPincodeError('');
    const cleanPin = pincodeInput.trim();
    
    if (cleanPin.length !== 6) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code');
      return;
    }

    const res = await checkDeliveryPincode(cleanPin);
    if (!res.valid) {
      setPincodeError(res.error || 'Could not verify delivery for this PIN code');
    } else {
      setPincodeInput('');
    }
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - netSubtotal);
  const shippingProgress = Math.min(100, Math.round((netSubtotal / freeShippingThreshold) * 100));

  if (cart.length === 0) {
    return (
      <div className="w-full min-h-[75vh] bg-[#090909] pt-36 pb-24 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#141414] border border-[#222222] flex items-center justify-center text-[#8E8D8A] mb-4">
          <ShoppingBag size={24} />
        </div>
        <h1 className="text-xl font-medium text-[#EDE7DC] mb-2">Your Shopping Bag is Empty</h1>
        <p className="text-xs sm:text-sm text-[#8E8D8A] max-w-sm mb-6">
          Looks like you haven't added any pieces yet. Explore our Drop 01 archive collection.
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="bg-[#EDE7DC] text-[#080808] px-8 py-3.5 text-xs font-semibold tracking-wider uppercase hover:bg-white transition-all shadow-lg"
        >
          Explore Drop 01
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#090909] text-[#EDE7DC] pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-14">
      <div className="max-w-[1360px] mx-auto">
        
        {/* Page Navigation & Title */}
        <div className="border-b border-[#1a1a1a] pb-6 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#8E8D8A] uppercase tracking-wider mb-1">
              <span>Bag</span>
              <span>/</span>
              <span className="text-[#EDE7DC]">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDE7DC]">
              Shopping Bag
            </h1>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-2 text-xs text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors self-start sm:self-auto"
          >
            <ArrowLeft size={14} />
            <span>Continue Shopping</span>
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-[#111111] border border-[#1e1e1e] p-4 rounded-sm mb-8 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
            {amountToFreeShipping === 0 ? (
              <span className="text-[#A3E635] flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} />
                <span>✓ You have qualified for FREE Express Shipping across India!</span>
              </span>
            ) : (
              <span className="text-[#8E8D8A]">
                Add <strong className="text-[#EDE7DC]">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> more to unlock <strong className="text-[#EDE7DC]">FREE Pan-India Express Delivery</strong>
              </span>
            )}
            <span className="text-[11px] text-[#666666] hidden sm:inline">
              Threshold: ₹2,000 ({shippingProgress}% achieved)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#222222] rounded-full overflow-hidden">
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

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Cart Items List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {cart.map((item, idx) => {
              const itemImg = item.product?.images?.[0] || item.image || '';
              const itemName = item.product?.name || item.name || 'LOOZARS Archive Apparel';
              const itemSubtitle = item.product?.subtitle || 'Heavyweight 100% French Terry Cotton';
              const itemPrice = item.product?.price || item.unitPrice || 899;
              const itemBasePrice = item.product?.basePrice;
              const isSale = item.product?.isSale;
              const lineTotal = itemPrice * item.quantity;
              const itemId = item.variantId || item.product?.id || item.productId;

              return (
                <div 
                  key={item.variantId || `${item.productId}-${item.size}-${idx}`}
                  className="bg-[#0e0e0e] border border-[#1a1a1a] p-4 sm:p-5 flex gap-4 sm:gap-6 rounded-sm transition-all hover:border-[#262626] group"
                >
                  {/* Thumbnail */}
                  <div 
                    onClick={() => navigateTo('product', item.product?.id || item.productId)}
                    className="w-24 sm:w-28 aspect-[3/4] bg-[#141414] overflow-hidden shrink-0 border border-[#222222] rounded-sm cursor-pointer relative"
                  >
                    {itemImg ? (
                      <img 
                        src={itemImg} 
                        alt={itemName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#444444] text-xs">
                        LZR
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h2 
                          onClick={() => navigateTo('product', item.product?.id || item.productId)}
                          className="text-base font-medium text-[#EDE7DC] hover:text-[#A3E635] transition-colors cursor-pointer truncate"
                        >
                          {itemName}
                        </h2>
                        
                        <div className="text-right shrink-0">
                          <span className="text-base font-semibold text-[#EDE7DC]">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </span>
                          {isSale && itemBasePrice && (
                            <span className="block text-xs text-[#666666] line-through font-mono">
                              ₹{(itemBasePrice * item.quantity).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#8E8D8A] line-clamp-1">
                        {itemSubtitle}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-sm bg-[#161616] border border-[#242424] text-xs font-mono text-[#EDE7DC]">
                          Size: <strong className="ml-1 text-white">{item.size || 'M'}</strong>
                        </div>
                        {isSale && (
                          <span className="text-[10px] bg-[#8E1717] text-white px-2 py-0.5 rounded-sm uppercase tracking-wider font-mono font-bold">
                            SALE
                          </span>
                        )}
                        <span className="text-[11px] text-[#666666] font-mono">
                          (₹{itemPrice.toLocaleString('en-IN')} each)
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#181818] mt-3">
                      <div className="flex items-center border border-[#282828] bg-[#141414] rounded-sm">
                        <button 
                          onClick={() => updateQuantity(itemId, item.size, -1)}
                          className="px-3 py-1.5 text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-semibold text-[#EDE7DC]">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(itemId, item.size, 1)}
                          className="px-3 py-1.5 text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(itemId, item.size)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#8E8D8A] hover:text-[#EF4444] transition-colors p-1.5 hover:bg-white/5 rounded-sm"
                        title="Remove piece from bag"
                      >
                        <Trash2 size={13} />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-[#0e0e0e] border border-[#1a1a1a] p-6 rounded-sm space-y-5 shadow-lg">
              <h2 className="text-base font-medium text-[#EDE7DC] border-b border-[#1a1a1a] pb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-mono text-[#8E8D8A]">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </span>
              </h2>

              {/* Delivery Estimator */}
              <div className="bg-[#141414] border border-[#222222] rounded-sm p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#EDE7DC] font-medium">
                    <MapPin size={14} className="text-[#A3E635]" />
                    <span>Delivery Pincode</span>
                  </div>

                  {deliveryInfo?.valid && (
                    <button
                      onClick={clearDeliveryInfo}
                      className="text-[11px] text-[#8E8D8A] hover:text-[#EF4444] transition-colors"
                    >
                      Change
                    </button>
                  )}
                </div>

                {deliveryInfo?.valid ? (
                  <div className="bg-[#181818] border border-[#262626] p-3 rounded-sm flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#EDE7DC]">
                      <span className="font-semibold">{deliveryInfo.city}, {deliveryInfo.state}</span>
                      <span className="font-mono text-[#A3E635]">({deliveryInfo.pincode})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8E8D8A] font-mono">
                      <Truck size={13} className="text-[#A3E635]" />
                      <span>{deliveryInfo.estimatedDays}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCheckPincode} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit PIN"
                        value={pincodeInput}
                        onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-[#181818] border border-[#282828] px-3.5 py-2 text-xs font-mono text-[#EDE7DC] placeholder-[#666666] focus:outline-none focus:border-[#A3E635] rounded-sm"
                      />
                      <button
                        type="submit"
                        disabled={isCheckingPincode || pincodeInput.length !== 6}
                        className="bg-[#242424] text-[#EDE7DC] hover:bg-[#333333] px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-40 rounded-sm flex items-center gap-1 border border-[#303030]"
                      >
                        {isCheckingPincode ? <RefreshCw size={11} className="animate-spin" /> : null}
                        <span>Check</span>
                      </button>
                    </div>

                    {pincodeError && (
                      <p className="text-xs text-[#EF4444]">
                        {pincodeError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Promo / Coupon Section */}
              {appliedCoupon ? (
                <div className="p-3.5 bg-[#141414] border border-[#262626] rounded-sm flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Tag size={15} className="text-[#A3E635]" />
                    <div>
                      <span className="text-[#EDE7DC] font-mono font-bold">{appliedCoupon.code}</span>
                      <span className="text-[#A3E635] text-[11px] block font-medium">
                        -₹{couponDiscount.toLocaleString('en-IN')} Applied
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[#8E8D8A] hover:text-[#EF4444] text-xs underline uppercase tracking-wider transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={(e) => { e.preventDefault(); handleApplyPromo(); }} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#141414] border border-[#262626] px-3.5 py-2.5 text-xs font-mono text-[#EDE7DC] placeholder-[#666666] focus:outline-none focus:border-[#888888] rounded-sm uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isValidatingPromo || !promoCodeInput.trim()}
                      className="bg-[#222222] border border-[#333333] text-[#EDE7DC] px-4 py-2.5 text-xs font-medium uppercase tracking-wider hover:bg-[#333333] transition-colors rounded-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isValidatingPromo ? <RefreshCw size={12} className="animate-spin" /> : null}
                      <span>Apply</span>
                    </button>
                  </form>

                  {promoError && (
                    <p className="text-xs text-[#EF4444]">
                      {promoError}
                    </p>
                  )}
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="space-y-2.5 pt-4 border-t border-[#1a1a1a] text-xs">
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
                  <span className={shippingCost === 0 ? 'text-[#A3E635] font-medium' : 'text-[#EDE7DC] font-medium'}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>

                <div className="flex justify-between text-base font-semibold text-[#EDE7DC] pt-3 border-t border-[#222222]">
                  <span>Total Due</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-[#666666]">
                  Inclusive of all taxes & duty charges across India.
                </p>
              </div>

              {/* Checkout Button */}
              <div className="pt-2">
                <button
                  onClick={() => navigateTo('checkout')}
                  className="w-full bg-[#EDE7DC] text-[#080808] py-4 text-xs font-semibold tracking-wider uppercase hover:bg-white transition-all flex items-center justify-center gap-2 rounded-sm shadow-xl active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={15} />
                </button>
              </div>

            </div>

            {/* Quiet Reassurance Badges */}
            <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-[#8E8D8A]">
              <div className="p-3 bg-[#0c0c0c] border border-[#161616] rounded-sm flex flex-col items-center gap-1.5">
                <Truck size={16} className="text-[#A3E635]" />
                <span>Pan-India Delivery</span>
              </div>
              <div className="p-3 bg-[#0c0c0c] border border-[#161616] rounded-sm flex flex-col items-center gap-1.5">
                <Lock size={16} className="text-[#A3E635]" />
                <span>Encrypted Payments</span>
              </div>
              <div className="p-3 bg-[#0c0c0c] border border-[#161616] rounded-sm flex flex-col items-center gap-1.5">
                <RotateCcw size={16} className="text-[#A3E635]" />
                <span>7-Day Exchanges</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
