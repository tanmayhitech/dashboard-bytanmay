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
      <div className="w-full min-h-[75vh] bg-[#F1EEE6] text-[#0A0A0A] pt-32 pb-24 px-6 flex flex-col items-center justify-center text-center select-none font-mono">
        <div className="w-16 h-16 rounded-full bg-[#E8E4DA] border border-[#0A0A0A]/15 flex items-center justify-center text-[#0A0A0A] mb-4">
          <ShoppingBag size={22} />
        </div>
        <div className="text-xs text-[#0A0A0A]/60 tracking-[0.25em] uppercase mb-1">00 // ARCHIVE EMPTY</div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold uppercase text-[#0A0A0A] mb-2">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-xs text-[#0A0A0A]/70 max-w-sm mb-6 uppercase tracking-wider">
          Discover heavyweight silhouettes from the Drop 01 archive.
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="bg-[#0A0A0A] text-[#F1EEE6] hover:bg-[#8E1717] hover:text-white px-8 py-3.5 text-xs font-bold tracking-[0.25em] uppercase transition-all rounded-none shadow-md"
        >
          EXPLORE THE ARCHIVE →
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F1EEE6] text-[#0A0A0A] pt-24 sm:pt-32 pb-24 px-5 sm:px-10 lg:px-14 select-none font-mono">
      <div className="max-w-[1560px] mx-auto space-y-8">
        
        {/* Page Navigation & Title */}
        <div className="border-b border-[#0A0A0A]/15 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#0A0A0A]/60 uppercase tracking-[0.25em]">
              <span>01</span>
              <span className="w-6 h-[1px] bg-[#0A0A0A]/35 inline-block"></span>
              <span>SHOPPING BAG</span>
              <span>/</span>
              <span className="text-[#8E1717] font-bold">[{totalItemsCount} {totalItemsCount === 1 ? 'PIECE' : 'PIECES'}]</span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#0A0A0A]">
              YOUR SELECTION
            </h1>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0A0A0A] hover:text-[#8E1717] transition-colors self-start sm:self-auto"
          >
            <ArrowLeft size={14} />
            <span>CONTINUE BROWSING</span>
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-[#E8E4DA] border border-[#0A0A0A]/15 p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs uppercase tracking-wider">
            {amountToFreeShipping === 0 ? (
              <span className="text-[#15803d] flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={14} />
                <span>FREE PAN-INDIA EXPRESS DELIVERY UNLOCKED</span>
              </span>
            ) : (
              <span className="text-[#0A0A0A]/80">
                ADD <strong className="text-[#0A0A0A]">₹{amountToFreeShipping.toLocaleString('en-IN')}</strong> MORE FOR <strong className="text-[#8E1717]">FREE SHIPPING</strong>
              </span>
            )}
            <span className="text-[10px] text-[#0A0A0A]/60">
              THRESHOLD: ₹2,000 ({shippingProgress}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#D8D4CA] overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                amountToFreeShipping === 0 ? 'bg-[#15803d]' : 'bg-[#0A0A0A]'
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
              const itemSubtitle = item.product?.subtitle || '320 GSM 100% Combed Cotton';
              const itemPrice = item.product?.price || item.unitPrice || 899;
              const lineTotal = itemPrice * item.quantity;
              const itemId = item.variantId || item.product?.id || item.productId;

              return (
                <div 
                  key={item.variantId || `${item.productId}-${item.size}-${idx}`}
                  className="bg-[#E8E4DA] border border-[#0A0A0A]/15 p-4 sm:p-5 flex gap-4 sm:gap-6 transition-all hover:border-[#0A0A0A]/40 group"
                >
                  {/* Thumbnail */}
                  <div 
                    onClick={() => navigateTo('product', item.product?.id || item.productId)}
                    className="w-24 sm:w-28 aspect-[3/4] bg-[#D8D4CA] overflow-hidden shrink-0 border border-[#0A0A0A]/15 cursor-pointer relative"
                  >
                    {itemImg ? (
                      <img 
                        src={itemImg} 
                        alt={itemName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-[1.05]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#444] text-xs">
                        LZR
                      </div>
                    )}
                    <div className="absolute top-1 left-1 font-mono text-[8px] bg-black text-white px-1">
                      0{idx + 1}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h2 
                          onClick={() => navigateTo('product', item.product?.id || item.productId)}
                          className="font-mono text-sm sm:text-base font-bold text-[#0A0A0A] hover:text-[#8E1717] transition-colors cursor-pointer truncate uppercase tracking-wider"
                        >
                          {itemName}
                        </h2>
                        
                        <div className="text-right shrink-0">
                          <span className="font-mono text-base font-bold text-[#0A0A0A]">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#0A0A0A]/70 line-clamp-1 uppercase tracking-wide">
                        {itemSubtitle}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="text-[#0A0A0A]/70 uppercase">
                          SIZE: <strong className="text-[#0A0A0A]">{item.size || 'M'}</strong>
                        </span>
                        <span className="text-[#0A0A0A]/40">·</span>
                        <span className="text-[#0A0A0A]/70">
                          (₹{itemPrice.toLocaleString('en-IN')} each)
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#0A0A0A]/10 mt-3">
                      <div className="flex items-center border border-[#0A0A0A]/25 bg-transparent">
                        <button 
                          onClick={() => updateQuantity(itemId, item.size, -1)}
                          className="px-2.5 py-1 text-[#0A0A0A]/70 hover:text-[#0A0A0A] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold text-[#0A0A0A]">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(itemId, item.size, 1)}
                          className="px-2.5 py-1 text-[#0A0A0A]/70 hover:text-[#0A0A0A] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(itemId, item.size)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0A0A0A]/60 hover:text-[#8E1717] uppercase tracking-wider transition-colors"
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
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-[#E8E4DA] border border-[#0A0A0A]/15 p-6 space-y-5">
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0A0A0A] border-b border-[#0A0A0A]/15 pb-4 flex items-center justify-between">
                <span>ORDER DOSSIER</span>
                <span className="text-[#8E1717]">
                  [{totalItemsCount} PIECES]
                </span>
              </h2>

              {/* Delivery Estimator */}
              <div className="bg-[#D8D4CA] border border-[#0A0A0A]/10 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 text-[#0A0A0A] font-bold">
                    <MapPin size={13} className="text-[#8E1717]" />
                    <span>DELIVERY PINCODE</span>
                  </div>

                  {deliveryInfo?.valid && (
                    <button
                      onClick={clearDeliveryInfo}
                      className="text-[10px] text-[#0A0A0A]/60 hover:text-[#8E1717] underline uppercase"
                    >
                      CHANGE
                    </button>
                  )}
                </div>

                {deliveryInfo?.valid ? (
                  <div className="bg-[#E8E4DA] border border-[#0A0A0A]/15 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#0A0A0A]">
                      <span className="font-bold">{deliveryInfo.city}, {deliveryInfo.state}</span>
                      <span className="text-[#8E1717] font-bold">({deliveryInfo.pincode})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#0A0A0A]/70">
                      <Truck size={13} className="text-[#0A0A0A]" />
                      <span>{deliveryInfo.estimatedDays}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCheckPincode} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="ENTER 6-DIGIT PIN"
                        value={pincodeInput}
                        onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-[#E8E4DA] border border-[#0A0A0A]/20 px-3.5 py-2 text-xs font-mono text-[#0A0A0A] placeholder-[#0A0A0A]/50 focus:outline-none focus:border-[#0A0A0A] uppercase"
                      />
                      <button
                        type="submit"
                        disabled={isCheckingPincode || pincodeInput.length !== 6}
                        className="bg-[#0A0A0A] text-[#F1EEE6] hover:bg-[#8E1717] px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1"
                      >
                        {isCheckingPincode ? <RefreshCw size={11} className="animate-spin" /> : null}
                        <span>CHECK</span>
                      </button>
                    </div>

                    {pincodeError && (
                      <p className="text-xs text-[#8E1717]">
                        {pincodeError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Promo / Coupon Section */}
              {appliedCoupon ? (
                <div className="p-3.5 bg-[#D8D4CA] border border-[#0A0A0A]/15 flex items-center justify-between text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-2.5">
                    <Tag size={14} className="text-[#15803d]" />
                    <div>
                      <span className="text-[#0A0A0A] font-bold">{appliedCoupon.code}</span>
                      <span className="text-[#15803d] text-[10px] block font-bold">
                        -₹{couponDiscount.toLocaleString('en-IN')} APPLIED
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[#0A0A0A]/70 hover:text-[#8E1717] text-xs underline uppercase"
                  >
                    REMOVE
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="PROMO CODE"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#D8D4CA] border border-[#0A0A0A]/20 px-3.5 py-2 text-xs font-mono text-[#0A0A0A] placeholder-[#0A0A0A]/50 focus:outline-none focus:border-[#0A0A0A] uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isValidatingPromo || !promoCodeInput.trim()}
                      className="bg-[#0A0A0A] text-[#F1EEE6] hover:bg-[#8E1717] px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1"
                    >
                      {isValidatingPromo ? <RefreshCw size={12} className="animate-spin" /> : null}
                      <span>APPLY</span>
                    </button>
                  </form>

                  {promoError && (
                    <p className="text-xs text-[#8E1717]">
                      {promoError}
                    </p>
                  )}
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="space-y-2 pt-4 border-t border-[#0A0A0A]/15 text-xs uppercase tracking-wider">
                <div className="flex justify-between text-[#0A0A0A]/70">
                  <span>SUBTOTAL</span>
                  <span className="text-[#0A0A0A] font-bold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-[#15803d] font-bold">
                    <span>COUPON DISCOUNT</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#0A0A0A]/70">
                  <span>EXPRESS SHIPPING</span>
                  <span className={shippingCost === 0 ? 'text-[#15803d] font-bold' : 'text-[#0A0A0A]'}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-[#0A0A0A] pt-3 border-t border-[#0A0A0A]/20">
                  <span>TOTAL DUE</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-[#0A0A0A]/60">
                  INCLUSIVE OF ALL TAXES & DUTY CHARGES ACROSS INDIA.
                </p>
              </div>

              {/* Checkout Button */}
              <div className="pt-2">
                <button
                  onClick={() => navigateTo('checkout')}
                  className="w-full bg-[#0A0A0A] text-[#F1EEE6] hover:bg-[#8E1717] hover:text-white py-4 text-xs font-bold tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-2 rounded-none shadow-xl active:scale-[0.99]"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight size={15} />
                </button>
              </div>

            </div>

            {/* Reassurance Badges */}
            <div className="grid grid-cols-3 gap-3 text-center text-[10px] uppercase tracking-wider text-[#0A0A0A]/70">
              <div className="p-3 bg-[#E8E4DA] border border-[#0A0A0A]/15 flex flex-col items-center gap-1.5">
                <Truck size={15} className="text-[#8E1717]" />
                <span>PAN-INDIA</span>
              </div>
              <div className="p-3 bg-[#E8E4DA] border border-[#0A0A0A]/15 flex flex-col items-center gap-1.5">
                <Lock size={15} className="text-[#8E1717]" />
                <span>ENCRYPTED</span>
              </div>
              <div className="p-3 bg-[#E8E4DA] border border-[#0A0A0A]/15 flex flex-col items-center gap-1.5">
                <RotateCcw size={15} className="text-[#8E1717]" />
                <span>7-DAY EXCHANGES</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
