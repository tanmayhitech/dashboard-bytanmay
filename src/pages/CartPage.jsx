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
  Lock,
  ChevronRight,
  Sparkles
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

  const handleApplyPromo = async (e) => {
    e?.preventDefault();
    const code = promoCodeInput.trim();
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
      <div className="w-full min-h-[80vh] bg-[#0B0B0E] text-zinc-100 pt-32 pb-24 px-6 flex flex-col items-center justify-center text-center select-none font-sans">
        <div className="w-20 h-20 rounded-3xl bg-[#14141C] border border-[#22222E] flex items-center justify-center text-zinc-400 mb-6 shadow-xl">
          <ShoppingBag size={32} className="text-zinc-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-sm text-zinc-400 max-w-sm mb-8 leading-relaxed">
          Looks like you haven't added any streetwear pieces to your bag yet.
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="bg-white text-black hover:bg-zinc-200 px-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0B0B0E] text-zinc-100 pt-24 sm:pt-32 pb-24 px-4 sm:px-8 lg:px-12 select-none font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Shopping Bag
              </h1>
              <span className="px-3 py-0.5 rounded-full bg-[#181822] text-zinc-300 border border-[#282836] text-xs font-semibold">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Review your selected pieces and estimate doorstep delivery.
            </p>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer self-start sm:self-auto px-3.5 py-2 rounded-xl bg-[#14141A] border border-[#22222E] hover:border-[#30303E]"
          >
            <ArrowLeft size={14} />
            <span>Continue Shopping</span>
          </button>
        </div>

        {/* Free Delivery Progress Banner */}
        <div className="bg-[#121218] border border-[#20202A] rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            {amountToFreeShipping === 0 ? (
              <span className="text-emerald-400 flex items-center gap-2 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span>You've unlocked Free Express Delivery across India!</span>
              </span>
            ) : (
              <span className="text-zinc-300">
                Add <strong className="text-white font-bold">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> more to your bag to get <span className="text-emerald-400 font-semibold">Free Delivery</span>
              </span>
            )}
            <span className="text-zinc-400 font-mono text-xs">
              Free over ₹{freeShippingThreshold.toLocaleString('en-IN')} ({shippingProgress}%)
            </span>
          </div>
          <div className="w-full h-2 bg-[#1C1C26] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                amountToFreeShipping === 0 ? 'bg-emerald-400 shadow-sm' : 'bg-white'
              }`}
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Cart Items List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {cart.map((item, idx) => {
              const itemImg = item.product?.images?.[0] || item.image || '';
              const itemName = item.product?.name || item.name || 'LOOZARS Apparel';
              const itemSubtitle = item.product?.subtitle || 'Heavyweight 100% Combed Cotton';
              const itemPrice = item.product?.price || item.unitPrice || 899;
              const lineTotal = itemPrice * item.quantity;
              const itemId = item.variantId || item.product?.id || item.productId;

              return (
                <div 
                  key={item.variantId || `${item.productId}-${item.size}-${idx}`}
                  className="bg-[#121218] border border-[#20202A] rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-5 transition-all hover:border-[#2C2C3A] group shadow-sm"
                >
                  {/* Thumbnail */}
                  <div 
                    onClick={() => navigateTo('product', item.product?.id || item.productId)}
                    className="w-24 sm:w-28 aspect-[3/4] bg-[#1A1A24] overflow-hidden shrink-0 rounded-xl border border-[#262634] cursor-pointer relative group-hover:border-zinc-500 transition-colors"
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

                  {/* Details & Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h2 
                          onClick={() => navigateTo('product', item.product?.id || item.productId)}
                          className="text-base sm:text-lg font-bold text-white hover:text-zinc-300 transition-colors cursor-pointer truncate"
                        >
                          {itemName}
                        </h2>
                        
                        <div className="text-right shrink-0">
                          <span className="font-mono text-base sm:text-lg font-bold text-white">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {itemSubtitle}
                      </p>

                      <div className="flex items-center gap-2 pt-0.5 text-xs">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#1C1C26] text-zinc-300 border border-[#282836] font-medium text-xs">
                          Size: <strong className="text-white">{item.size || 'M'}</strong>
                        </span>
                        <span className="text-zinc-400 font-mono text-xs">
                          ₹{itemPrice.toLocaleString('en-IN')} each
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#1E1E28] mt-3">
                      <div className="flex items-center border border-[#282836] bg-[#181822] rounded-xl overflow-hidden p-0.5">
                        <button 
                          onClick={() => updateQuantity(itemId, item.size, -1)}
                          className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#222230] rounded-lg transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-white tabular-nums">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(itemId, item.size, 1)}
                          className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#222230] rounded-lg transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(itemId, item.size)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-[#1E1E28] transition-colors cursor-pointer"
                        title="Remove item from bag"
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            <div className="bg-[#121218] border border-[#20202A] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
              <h2 className="text-base font-bold text-white border-b border-[#20202A] pb-3.5 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-mono font-normal text-zinc-400">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </span>
              </h2>

              {/* Delivery Estimator */}
              <div className="bg-[#171720] border border-[#222230] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                    <MapPin size={14} className="text-emerald-400" />
                    <span>Estimate Delivery Time</span>
                  </div>

                  {deliveryInfo?.valid && (
                    <button
                      onClick={clearDeliveryInfo}
                      className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Change
                    </button>
                  )}
                </div>

                {deliveryInfo?.valid ? (
                  <div className="bg-[#121218] border border-[#262636] rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="text-zinc-200">
                      <span className="font-semibold">{deliveryInfo.city}, {deliveryInfo.state}</span>
                      <span className="text-zinc-400 font-mono ml-1.5">({deliveryInfo.pincode})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <Truck size={14} />
                      <span>{deliveryInfo.estimatedDays}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCheckPincode} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit PIN code"
                        value={pincodeInput}
                        onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-[#121218] border border-[#282836] rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isCheckingPincode || pincodeInput.length !== 6}
                        className="bg-zinc-200 hover:bg-white text-black px-4 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        {isCheckingPincode ? <RefreshCw size={12} className="animate-spin" /> : null}
                        <span>Check</span>
                      </button>
                    </div>

                    {pincodeError && (
                      <p className="text-xs text-rose-400">
                        {pincodeError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Promo / Coupon Section */}
              {appliedCoupon ? (
                <div className="p-3.5 bg-[#141B18] border border-emerald-900/50 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Tag size={15} className="text-emerald-400" />
                    <div>
                      <span className="text-white font-semibold">{appliedCoupon.code}</span>
                      <span className="text-emerald-400 text-[11px] block font-medium">
                        -₹{couponDiscount.toLocaleString('en-IN')} coupon discount applied
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-zinc-400 hover:text-rose-400 text-xs font-medium underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Have a promo code?"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#171720] border border-[#282836] rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isValidatingPromo || !promoCodeInput.trim()}
                      className="bg-[#20202C] hover:bg-[#282838] text-zinc-200 hover:text-white border border-[#2E2E40] px-4 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      {isValidatingPromo ? <RefreshCw size={12} className="animate-spin" /> : null}
                      <span>Apply</span>
                    </button>
                  </form>

                  {promoError && (
                    <p className="text-xs text-rose-400">
                      {promoError}
                    </p>
                  )}
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-[#20202A] text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-zinc-200 font-mono font-medium">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="font-mono">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-400">
                  <span>Express Shipping</span>
                  <span className={shippingCost === 0 ? 'text-emerald-400 font-medium' : 'text-zinc-200 font-mono'}>
                    {shippingCost === 0 ? 'Free' : `₹${shippingCost}`}
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-[#20202A]">
                  <span>Total</span>
                  <span className="font-mono text-lg">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Inclusive of all taxes and shipping costs.
                </p>
              </div>

              {/* Checkout Button */}
              <div className="pt-2">
                <button
                  onClick={() => navigateTo('checkout')}
                  className="w-full bg-white hover:bg-zinc-200 text-black py-4 px-5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl active:scale-[0.99] cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={15} />
                </button>
              </div>

            </div>

            {/* Reassurance Trust Badges */}
            <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-zinc-400">
              <div className="p-3.5 bg-[#121218] border border-[#20202A] rounded-2xl flex flex-col items-center gap-1.5 shadow-sm">
                <Truck size={16} className="text-emerald-400" />
                <span className="font-medium text-zinc-300">Free Delivery</span>
                <span className="text-[10px] text-zinc-500">On orders over ₹2k</span>
              </div>
              <div className="p-3.5 bg-[#121218] border border-[#20202A] rounded-2xl flex flex-col items-center gap-1.5 shadow-sm">
                <ShieldCheck size={16} className="text-sky-400" />
                <span className="font-medium text-zinc-300">Secure Payment</span>
                <span className="text-[10px] text-zinc-500">Cards & UPI</span>
              </div>
              <div className="p-3.5 bg-[#121218] border border-[#20202A] rounded-2xl flex flex-col items-center gap-1.5 shadow-sm">
                <RotateCcw size={16} className="text-amber-400" />
                <span className="font-medium text-zinc-300">Easy Exchange</span>
                <span className="text-[10px] text-zinc-500">7-Day window</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
