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
      <div className="w-full min-h-[80vh] bg-[#08080A] text-[#EDE7DC] pt-36 pb-28 px-6 flex flex-col items-center justify-center text-center select-none font-sans">
        <div className="w-20 h-20 rounded-3xl bg-[#121218] border border-[#262634] flex items-center justify-center text-[#8E8D8A] mb-6 shadow-xl">
          <ShoppingBag size={32} className="text-[#8E8D8A]" />
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold uppercase tracking-wide text-[#EDE7DC] mb-2">
          Your Bag is Empty
        </h1>
        <p className="font-mono text-xs text-[#8E8D8A] tracking-wider uppercase max-w-sm mb-8 leading-relaxed">
          Explore heavyweight tees, oversized fits, and signature drop releases.
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="bg-[#EDE7DC] hover:bg-[#8E1717] text-[#080808] hover:text-white px-8 py-3.5 text-xs font-mono font-bold tracking-[0.25em] uppercase rounded-xl transition-all shadow-lg hover:shadow-[0_0_24px_rgba(142,23,23,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Explore Drop 01 →
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#08080A] text-[#EDE7DC] pt-28 sm:pt-36 pb-28 px-4 sm:px-8 lg:px-14 select-none font-sans">
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#202028]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#8E8D8A] uppercase tracking-[0.25em]">
              <span>SHOPPING BAG</span>
              <span>/</span>
              <span className="text-[#8E1717] font-bold">[{totalItemsCount} {totalItemsCount === 1 ? 'PIECE' : 'PIECES'}]</span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#EDE7DC]">
              Your Selection
            </h1>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#EDE7DC]/80 hover:text-white transition-colors cursor-pointer self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#121218] border border-[#242430] hover:border-[#8E1717]/50"
          >
            <ArrowLeft size={14} className="text-[#8E1717]" />
            <span>CONTINUE BROWSING</span>
          </button>
        </div>

        {/* Free Delivery Progress Banner */}
        <div className="bg-[#101015] border border-[#202028] rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-mono text-xs tracking-wider uppercase">
            {amountToFreeShipping === 0 ? (
              <span className="text-[#EDE7DC] flex items-center gap-2 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#8E1717] animate-pulse"></span>
                <span>Free Express Delivery Unlocked Across India!</span>
              </span>
            ) : (
              <span className="text-[#8E8D8A]">
                Add <strong className="text-[#EDE7DC]">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> more for <span className="text-[#8E1717] font-bold">Free Delivery</span>
              </span>
            )}
            <span className="text-[#8E8D8A] font-mono text-[11px]">
              THRESHOLD: ₹{freeShippingThreshold.toLocaleString('en-IN')} ({shippingProgress}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#1C1C26] rounded-full overflow-hidden">
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

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Cart Items List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {cart.map((item, idx) => {
              const itemImg = item.product?.images?.[0] || item.image || '';
              const itemName = item.product?.name || item.name || 'LOOZARS Apparel';
              const itemSubtitle = item.product?.subtitle || '320 GSM 100% Combed Cotton';
              const itemPrice = item.product?.price || item.unitPrice || 899;
              const lineTotal = itemPrice * item.quantity;
              const itemId = item.variantId || item.product?.id || item.productId;

              return (
                <div 
                  key={item.variantId || `${item.productId}-${item.size}-${idx}`}
                  className="bg-[#101015] border border-[#202028] hover:border-[#8E1717]/40 rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-6 transition-all group shadow-sm"
                >
                  {/* Thumbnail */}
                  <div 
                    onClick={() => navigateTo('product', item.product?.id || item.productId)}
                    className="w-24 sm:w-28 aspect-[3/4] bg-[#16161E] overflow-hidden shrink-0 rounded-xl border border-[#242432] group-hover:border-[#8E1717] cursor-pointer relative transition-colors"
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

                  {/* Details & Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h2 
                          onClick={() => navigateTo('product', item.product?.id || item.productId)}
                          className="font-editorial text-base sm:text-lg font-bold uppercase tracking-wider text-[#EDE7DC] hover:text-[#8E1717] transition-colors cursor-pointer truncate"
                        >
                          {itemName}
                        </h2>
                        
                        <div className="text-right shrink-0">
                          <span className="font-mono text-base sm:text-lg font-bold text-[#EDE7DC]">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <p className="font-mono text-xs text-[#8E8D8A] line-clamp-1 tracking-wide">
                        {itemSubtitle}
                      </p>

                      <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#161620] text-[#EDE7DC] border border-[#282836] font-medium text-xs tracking-wider uppercase">
                          SIZE: <strong className="text-white">{item.size || 'M'}</strong>
                        </span>
                        <span className="text-[#8E8D8A]">
                          (₹{itemPrice.toLocaleString('en-IN')} each)
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#1C1C24] mt-3">
                      <div className="flex items-center border border-[#282836] bg-[#161620] rounded-xl overflow-hidden p-0.5 font-mono">
                        <button 
                          onClick={() => updateQuantity(itemId, item.size, -1)}
                          className="w-7 h-7 flex items-center justify-center text-[#8E8D8A] hover:text-white hover:bg-[#20202C] rounded-lg transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[#EDE7DC] tabular-nums">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(itemId, item.size, 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#8E8D8A] hover:text-white hover:bg-[#20202C] rounded-lg transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(itemId, item.size)}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#8E8D8A] hover:text-[#8E1717] px-2.5 py-1 rounded-lg hover:bg-[#1C1C26] tracking-wider uppercase transition-colors cursor-pointer"
                        title="Remove piece from bag"
                      >
                        <Trash2 size={13} />
                        <span className="hidden sm:inline">REMOVE</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            <div className="bg-[#101015] border border-[#202028] rounded-2xl p-6 space-y-6 shadow-sm">
              <h2 className="font-editorial text-base sm:text-lg font-bold uppercase tracking-wider text-[#EDE7DC] border-b border-[#202028] pb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="font-mono text-xs font-bold text-[#8E1717]">
                  [{totalItemsCount} {totalItemsCount === 1 ? 'PIECE' : 'PIECES'}]
                </span>
              </h2>

              {/* Delivery Estimator */}
              <div className="bg-[#15151C] border border-[#22222E] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs tracking-wider uppercase">
                  <div className="flex items-center gap-1.5 text-[#EDE7DC] font-bold">
                    <MapPin size={14} className="text-[#8E1717]" />
                    <span>Estimate Delivery Time</span>
                  </div>

                  {deliveryInfo?.valid && (
                    <button
                      onClick={clearDeliveryInfo}
                      className="text-[11px] text-[#8E8D8A] hover:text-[#EDE7DC] underline cursor-pointer"
                    >
                      CHANGE
                    </button>
                  )}
                </div>

                {deliveryInfo?.valid ? (
                  <div className="bg-[#101015] border border-[#262634] rounded-xl p-3.5 flex items-center justify-between text-xs">
                    <div className="text-[#EDE7DC] font-mono">
                      <span className="font-bold">{deliveryInfo.city}, {deliveryInfo.state}</span>
                      <span className="text-[#8E1717] font-bold ml-1.5">({deliveryInfo.pincode})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#EDE7DC] font-mono font-bold">
                      <Truck size={14} className="text-[#8E1717]" />
                      <span>{deliveryInfo.estimatedDays}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCheckPincode} className="space-y-2">
                    <div className="flex gap-2 font-mono">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="ENTER 6-DIGIT PIN"
                        value={pincodeInput}
                        onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-[#0D0D12] border border-[#282836] rounded-xl px-3.5 py-2 text-xs text-[#EDE7DC] placeholder-[#666670] focus:outline-none focus:border-[#8E1717] uppercase"
                      />
                      <button
                        type="submit"
                        disabled={isCheckingPincode || pincodeInput.length !== 6}
                        className="bg-[#EDE7DC] hover:bg-[#8E1717] text-[#080808] hover:text-white px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        {isCheckingPincode ? <RefreshCw size={12} className="animate-spin" /> : null}
                        <span>CHECK</span>
                      </button>
                    </div>

                    {pincodeError && (
                      <p className="text-xs font-mono text-[#8E1717]">
                        {pincodeError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Promo / Coupon Section */}
              {appliedCoupon ? (
                <div className="p-3.5 bg-[#141A17] border border-[#1E3A2B] rounded-xl flex items-center justify-between font-mono text-xs tracking-wider uppercase">
                  <div className="flex items-center gap-2.5">
                    <Tag size={15} className="text-emerald-400" />
                    <div>
                      <span className="text-[#EDE7DC] font-bold">{appliedCoupon.code}</span>
                      <span className="text-emerald-400 text-[10px] block font-bold">
                        -₹{couponDiscount.toLocaleString('en-IN')} COUPON APPLIED
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[#8E8D8A] hover:text-[#8E1717] text-xs underline cursor-pointer"
                  >
                    REMOVE
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={handleApplyPromo} className="flex gap-2 font-mono">
                    <input
                      type="text"
                      placeholder="PROMO CODE"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#15151C] border border-[#282836] rounded-xl px-3.5 py-2 text-xs text-[#EDE7DC] placeholder-[#666670] focus:outline-none focus:border-[#8E1717] uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isValidatingPromo || !promoCodeInput.trim()}
                      className="bg-[#1E1E28] hover:bg-[#8E1717] text-[#EDE7DC] hover:text-white border border-[#2E2E3E] px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      {isValidatingPromo ? <RefreshCw size={12} className="animate-spin" /> : null}
                      <span>APPLY</span>
                    </button>
                  </form>

                  {promoError && (
                    <p className="text-xs font-mono text-[#8E1717]">
                      {promoError}
                    </p>
                  )}
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-[#202028] font-mono text-xs tracking-wider uppercase">
                <div className="flex justify-between text-[#8E8D8A]">
                  <span>Subtotal</span>
                  <span className="text-[#EDE7DC] font-bold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#8E8D8A]">
                  <span>Express Shipping</span>
                  <span className={shippingCost === 0 ? 'text-[#EDE7DC] font-bold' : 'text-[#EDE7DC]'}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>

                <div className="flex justify-between font-editorial text-lg sm:text-xl font-bold text-[#EDE7DC] pt-3 border-t border-[#202028] tracking-wider">
                  <span>Total</span>
                  <span className="font-mono">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-[#8E8D8A] tracking-wider uppercase">
                  Inclusive of all taxes across India.
                </p>
              </div>

              {/* Checkout Button */}
              <div className="pt-2">
                <button
                  onClick={() => navigateTo('checkout')}
                  className="w-full bg-[#EDE7DC] hover:bg-[#8E1717] text-[#080808] hover:text-white py-4 px-5 font-mono text-xs font-bold tracking-[0.25em] uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-[0_0_24px_rgba(142,23,23,0.45)] active:scale-[0.99] cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={15} />
                </button>
              </div>

            </div>

            {/* Reassurance Trust Badges */}
            <div className="grid grid-cols-3 gap-3 text-center font-mono text-[10px] tracking-wider uppercase text-[#8E8D8A]">
              <div className="p-3.5 bg-[#101015] border border-[#202028] rounded-2xl flex flex-col items-center gap-1.5 shadow-sm">
                <Truck size={16} className="text-[#8E1717]" />
                <span className="font-bold text-[#EDE7DC]">PAN-INDIA</span>
                <span className="text-[9px] text-[#8E8D8A]">Free over ₹2k</span>
              </div>
              <div className="p-3.5 bg-[#101015] border border-[#202028] rounded-2xl flex flex-col items-center gap-1.5 shadow-sm">
                <ShieldCheck size={16} className="text-[#8E1717]" />
                <span className="font-bold text-[#EDE7DC]">ENCRYPTED</span>
                <span className="text-[9px] text-[#8E8D8A]">Cards & UPI</span>
              </div>
              <div className="p-3.5 bg-[#101015] border border-[#202028] rounded-2xl flex flex-col items-center gap-1.5 shadow-sm">
                <RotateCcw size={16} className="text-[#8E1717]" />
                <span className="font-bold text-[#EDE7DC]">7-DAY EXCHANGES</span>
                <span className="text-[9px] text-[#8E8D8A]">Hassle-free</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
