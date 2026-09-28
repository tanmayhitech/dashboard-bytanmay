import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { createOrder, saveStoredOrder } from '../services/orderService';
import { recordInfluencerOrder } from '../services/influencerService';

import { createPaymentOrder, verifyPayment, openRazorpayModal } from '../services/paymentService';
import { INDIAN_STATES } from '../services/pincodeService';
import { 
  ArrowLeft, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  Lock, 
  AlertCircle, 
  RefreshCw, 
  Tag, 
  Zap, 
  Banknote,
  CheckCircle2
} from 'lucide-react';

export const CheckoutPage = () => {
  const { 
    cart, 
    cartSubtotal, 
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponDiscount,
    shippingCost, 
    cartTotal, 
    navigateTo, 
    clearCart,
    setLastCompletedOrder,
    deliveryPincode,
    deliveryInfo,
    checkDeliveryPincode
  } = useShop();

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: deliveryInfo?.city || '',
    state: deliveryInfo?.state || 'Maharashtra',
    pincode: deliveryPincode || '',
    paymentMethod: 'online', // 'online' | 'cod'
    notes: ''
  });

  const [checkoutPromoInput, setCheckoutPromoInput] = useState('');
  const [checkoutPromoError, setCheckoutPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [submissionError, setSubmissionError] = useState(null);

  // Auto-sync if delivery info was set in cart
  useEffect(() => {
    if (deliveryInfo && deliveryInfo.valid) {
      setFormData(prev => ({
        ...prev,
        pincode: prev.pincode || deliveryInfo.pincode || '',
        city: prev.city || deliveryInfo.city || '',
        state: prev.state || deliveryInfo.state || 'Maharashtra'
      }));
    }
  }, [deliveryInfo]);

  if (cart.length === 0) {
    return (
      <div className="w-full min-h-[75vh] bg-[#090909] pt-36 pb-24 px-6 text-center flex flex-col items-center justify-center">
        <h1 className="text-xl font-medium text-[#EDE7DC] mb-2">No active checkout</h1>
        <p className="text-sm text-[#8E8D8A] mb-6">Your shopping bag is currently empty.</p>
        <button
          onClick={() => navigateTo('shop')}
          className="bg-[#EDE7DC] text-[#080808] px-8 py-3 text-xs font-semibold tracking-wider uppercase hover:bg-white transition-colors rounded-sm"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (submissionError) {
      setSubmissionError(null);
    }

    if (name === 'pincode') {
      const cleanPin = value.replace(/\D/g, '');
      if (cleanPin.length === 6) {
        checkDeliveryPincode(cleanPin).then(res => {
          if (res && res.valid) {
            setFormData(prev => ({
              ...prev,
              city: res.city || prev.city,
              state: res.state || prev.state
            }));
          }
        });
      }
    }
  };

  const handleApplyPromo = async (e) => {
    e?.preventDefault();
    if (!checkoutPromoInput.trim()) return;

    setIsValidatingPromo(true);
    setCheckoutPromoError('');

    const res = await applyCoupon(checkoutPromoInput.trim());
    if (!res.success) {
      setCheckoutPromoError(res.error || 'Invalid promo code');
    } else {
      setCheckoutPromoInput('');
      setCheckoutPromoError('');
    }
    setIsValidatingPromo(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email || !formData.email.includes('@')) newErrors.email = 'Valid email required';
    if (!formData.phone || formData.phone.length < 10) newErrors.phone = '10-digit mobile number required';
    if (!formData.firstName) newErrors.firstName = 'First name required';
    if (!formData.address) newErrors.address = 'Street address required';
    if (!formData.city) newErrors.city = 'City required';
    if (!formData.pincode || formData.pincode.length !== 6) newErrors.pincode = '6-digit pincode required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError(null);
    setStatusMessage('Creating authoritative order...');

    try {
      const isCod = formData.paymentMethod === 'cod';

      // 1. Create Pending Loozars Order Server-Side
      const orderPayload = {
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        items: cart.map(item => ({
          productId: item.productId || item.product?.db_id || item.product?.id,
          variantId: item.variantId,
          size: item.size,
          quantity: item.quantity,
          name: item.product?.name || item.name,
          price: item.product?.price || item.unitPrice || 899,
          sku: item.variant?.sku || item.product?.sku || 'LZR',
          image: item.product?.images?.[0] || item.image || '',
          product: item.product,
          variant: item.variant
        })),
        couponCode: appliedCoupon?.code || null,
        paymentMethod: isCod ? 'cod' : 'razorpay',
        notes: formData.notes
      };

      const result = await createOrder(orderPayload);

      if (result.error || !result.data) {
        setSubmissionError(result.error || 'Failed to complete order transaction. Please check item stock.');
        setIsSubmitting(false);
        setStatusMessage('');
        return;
      }

      const serverOrder = result.data;
      const orderDbId = serverOrder.order_id || serverOrder.id;

      // 2. CASH ON DELIVERY FLOW (Direct Confirmation)
      if (isCod) {
        const completedOrder = {
          orderId: serverOrder.order_number || `#LZR-${Math.floor(100000 + Math.random() * 900000)}`,
          dbOrderId: orderDbId,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          items: serverOrder.items || cart.map(item => ({
            productId: item.productId || item.product?.db_id || item.product?.id,
            variantId: item.variantId,
            name: item.product?.name,
            size: item.size,
            sku: item.variant?.sku || `${item.product?.sku}-${item.size}`,
            quantity: item.quantity,
            unitPrice: item.product?.price || 899,
            totalPrice: (item.product?.price || 899) * item.quantity,
            image: item.product?.images?.[0]
          })),
          subtotal: serverOrder.subtotal_amount ?? cartSubtotal,
          discount: serverOrder.discount_amount ?? couponDiscount,
          shipping: serverOrder.shipping_fee ?? shippingCost,
          total: serverOrder.total_amount ?? cartTotal,
          shippingAddress: { ...formData },
          trackingNumber: serverOrder.tracking_number || null,
          courierName: serverOrder.courier_name || null,
          estimatedDelivery: deliveryInfo?.estimatedDays || '3–5 Business Days',
          paymentStatus: 'pending',
          paymentMethod: 'cod',
          orderStatus: 'confirmed'
        };

        // If coupon was applied, record influencer attribution immediately
        if (appliedCoupon?.code) {
          recordInfluencerOrder({
            orderNumber: completedOrder.orderId,
            customerName: completedOrder.shippingAddress.firstName ? `${completedOrder.shippingAddress.firstName} ${completedOrder.shippingAddress.lastName || ''}`.trim() : 'Customer',
            customerEmail: completedOrder.shippingAddress.email,
            customerPhone: completedOrder.shippingAddress.phone,
            items: completedOrder.items,
            subtotalAmount: completedOrder.subtotal,
            discountAmount: completedOrder.discount,
            totalAmount: completedOrder.total,
            couponCode: appliedCoupon.code,
            paymentMethod: 'cod',
            paymentStatus: 'pending'
          }).catch(e => console.warn('[CheckoutPage] Influencer commission sync notice:', e));
        }

        saveStoredOrder(completedOrder);
        setLastCompletedOrder(completedOrder);
        clearCart();
        setIsSubmitting(false);
        setStatusMessage('');
        navigateTo('confirmation');
        return;
      }

      // 3. ONLINE PAYMENT FLOW (Razorpay Gateway)
      setStatusMessage('Initializing secure payment session...');
      const orderAmountPaise = Math.round((serverOrder.total_amount || cartTotal) * 100);
      const paymentInit = await createPaymentOrder({ 
        orderId: orderDbId,
        amount: orderAmountPaise 
      });

      if (paymentInit.error || !paymentInit.data) {
        setSubmissionError(paymentInit.error || 'Failed to initialize payment gateway.');
        setIsSubmitting(false);
        setStatusMessage('');
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = paymentInit.data;

      // In local simulated fallback mode
      if (paymentInit.simulated && (!window.Razorpay || !keyId || keyId === 'simulated_key')) {
        console.info('[CheckoutPage] Simulated payment verification running in development mode.');
        await verifyPayment({
          orderId: orderDbId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpayOrderId: razorpayOrderId,
          razorpaySignature: 'simulated_signature_dev'
        });

        const completedOrder = {
          orderId: serverOrder.order_number || `#LZR-${Math.floor(100000 + Math.random() * 900000)}`,
          dbOrderId: orderDbId,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          items: serverOrder.items || cart.map(item => ({
            productId: item.productId || item.product?.db_id || item.product?.id,
            variantId: item.variantId,
            name: item.product?.name,
            size: item.size,
            sku: item.variant?.sku || `${item.product?.sku}-${item.size}`,
            quantity: item.quantity,
            unitPrice: item.product?.price || 899,
            totalPrice: (item.product?.price || 899) * item.quantity,
            image: item.product?.images?.[0]
          })),
          subtotal: serverOrder.subtotal_amount ?? cartSubtotal,
          discount: serverOrder.discount_amount ?? couponDiscount,
          shipping: serverOrder.shipping_fee ?? shippingCost,
          total: serverOrder.total_amount ?? cartTotal,
          shippingAddress: { ...formData },
          trackingNumber: serverOrder.tracking_number || null,
          courierName: serverOrder.courier_name || null,
          estimatedDelivery: deliveryInfo?.estimatedDays || '3–5 Business Days',
          paymentStatus: 'paid',
          paymentMethod: 'online',
          orderStatus: 'confirmed'
        };

        if (appliedCoupon?.code) {
          recordInfluencerOrder({
            orderNumber: completedOrder.orderId,
            customerName: completedOrder.shippingAddress.firstName ? `${completedOrder.shippingAddress.firstName} ${completedOrder.shippingAddress.lastName || ''}`.trim() : 'Customer',
            customerEmail: completedOrder.shippingAddress.email,
            customerPhone: completedOrder.shippingAddress.phone,
            items: completedOrder.items,
            subtotalAmount: completedOrder.subtotal,
            discountAmount: completedOrder.discount,
            totalAmount: completedOrder.total,
            couponCode: appliedCoupon.code,
            paymentMethod: 'online',
            paymentStatus: 'paid'
          }).catch(e => console.warn('[CheckoutPage] Influencer commission sync notice:', e));
        }

        saveStoredOrder(completedOrder);
        setLastCompletedOrder(completedOrder);
        clearCart();
        setIsSubmitting(false);
        setStatusMessage('');
        navigateTo('confirmation');
        return;
      }

      // Open Razorpay Standard Checkout Popup
      setStatusMessage('Awaiting payment completion...');
      await openRazorpayModal({
        keyId: keyId,
        razorpayOrderId: razorpayOrderId,
        amount: amount,
        currency: currency || 'INR',
        orderNumber: serverOrder.order_number,
        customer: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone
        },
        onSuccess: async (response) => {
          setStatusMessage('Verifying payment signature with server...');
          
          try {
            const verifyRes = await verifyPayment({
              orderId: orderDbId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verifyRes.error || !verifyRes.data) {
              setSubmissionError(verifyRes.error || 'Payment verification failed on the server. If debited, please contact support.');
              setIsSubmitting(false);
              setStatusMessage('');
              return;
            }

            const verifiedOrder = verifyRes.data;
            const completedOrder = {
              orderId: verifiedOrder.orderId || serverOrder.order_number,
              dbOrderId: orderDbId,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              items: verifiedOrder.items || serverOrder.items,
              subtotal: verifiedOrder.subtotal ?? serverOrder.subtotal_amount ?? cartSubtotal,
              discount: verifiedOrder.discount ?? serverOrder.discount_amount ?? couponDiscount,
              shipping: verifiedOrder.shipping ?? serverOrder.shipping_fee ?? shippingCost,
              total: verifiedOrder.total ?? serverOrder.total_amount ?? cartTotal,
              shippingAddress: { ...formData },
              trackingNumber: verifiedOrder.tracking_number || serverOrder.tracking_number || null,
              courierName: verifiedOrder.courier_name || serverOrder.courier_name || null,
              estimatedDelivery: deliveryInfo?.estimatedDays || '3–5 Business Days',
              paymentStatus: 'paid',
              paymentMethod: 'online',
              orderStatus: 'confirmed'
            };

            // If coupon was applied, record influencer attribution immediately
            if (appliedCoupon?.code) {
              recordInfluencerOrder({
                orderNumber: completedOrder.orderId,
                customerName: completedOrder.shippingAddress.firstName ? `${completedOrder.shippingAddress.firstName} ${completedOrder.shippingAddress.lastName || ''}`.trim() : 'Customer',
                customerEmail: completedOrder.shippingAddress.email,
                customerPhone: completedOrder.shippingAddress.phone,
                items: completedOrder.items,
                subtotalAmount: completedOrder.subtotal,
                discountAmount: completedOrder.discount,
                totalAmount: completedOrder.total,
                couponCode: appliedCoupon.code,
                paymentMethod: 'online',
                paymentStatus: 'paid'
              }).catch(e => console.warn('[CheckoutPage] Influencer commission sync notice:', e));
            }

            saveStoredOrder(completedOrder);
            setLastCompletedOrder(completedOrder);
            clearCart();
            setIsSubmitting(false);
            setStatusMessage('');
            navigateTo('confirmation');


          } catch (verErr) {
            console.error('[CheckoutPage] Verification exception:', verErr);
            setSubmissionError('An unexpected network error occurred while verifying your payment.');
            setIsSubmitting(false);
            setStatusMessage('');
          }
        },
        onFailure: (err) => {
          console.warn('[CheckoutPage] Razorpay payment failed:', err);
          setSubmissionError(err.message || err.description || 'Payment was declined or failed. Your bag remains saved.');
          setIsSubmitting(false);
          setStatusMessage('');
        },
        onDismiss: () => {
          setSubmissionError('Payment checkout was closed. Your bag is saved and you can retry when ready.');
          setIsSubmitting(false);
          setStatusMessage('');
        }
      });

    } catch (err) {
      console.error('[CheckoutPage] Order processing error:', err);
      setSubmissionError(err.message || 'An unexpected error occurred while submitting your order. Please try again.');
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#090909] text-[#EDE7DC] pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-14">
      <div className="max-w-[1360px] mx-auto">
        
        {/* Navigation Bar */}
        <div className="border-b border-[#1a1a1a] pb-5 mb-8 flex items-center justify-between">
          <button
            onClick={() => navigateTo('cart')}
            className="inline-flex items-center gap-2 text-xs text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Bag</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-xs text-[#8E8D8A]">
            <Lock size={12} className="text-[#A3E635]" />
            <span>Secure Checkout</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* Left: Form (7 cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              
              {/* 1. Contact Info */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wider uppercase text-[#EDE7DC] border-b border-[#1a1a1a] pb-2">
                  1. Contact Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E8D8A] block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@domain.com"
                      className={`w-full bg-[#121212] border ${errors.email ? 'border-[#EF4444]' : 'border-[#222222]'} text-[#EDE7DC] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#888888] rounded-sm`}
                    />
                    {errors.email && <span className="text-xs text-[#EF4444]">{errors.email}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E8D8A] block">
                      Phone (+91) *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength={10}
                      className={`w-full bg-[#121212] border ${errors.phone ? 'border-[#EF4444]' : 'border-[#222222]'} text-[#EDE7DC] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#888888] rounded-sm`}
                    />
                    {errors.phone && <span className="text-xs text-[#EF4444]">{errors.phone}</span>}
                  </div>
                </div>
              </div>

              {/* 2. Delivery Address */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wider uppercase text-[#EDE7DC] border-b border-[#1a1a1a] pb-2">
                  2. Shipping Address
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E8D8A] block">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      className={`w-full bg-[#121212] border ${errors.firstName ? 'border-[#EF4444]' : 'border-[#222222]'} text-[#EDE7DC] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#888888] rounded-sm`}
                    />
                    {errors.firstName && <span className="text-xs text-[#EF4444]">{errors.firstName}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E8D8A] block">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      className="w-full bg-[#121212] border border-[#222222] text-[#EDE7DC] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#888888] rounded-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#8E8D8A] block">
                    Street Address / House No *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Building, Flat, Street address"
                    className={`w-full bg-[#121212] border ${errors.address ? 'border-[#EF4444]' : 'border-[#222222]'} text-[#EDE7DC] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#888888] rounded-sm`}
                  />
                  {errors.address && <span className="text-xs text-[#EF4444]">{errors.address}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E8D8A] block">
                      Pincode (6 digits) *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="400001"
                      maxLength={6}
                      className={`w-full bg-[#121212] border ${errors.pincode ? 'border-[#EF4444]' : 'border-[#222222]'} text-[#EDE7DC] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#888888] rounded-sm font-mono`}
                    />
                    {errors.pincode && <span className="text-xs text-[#EF4444]">{errors.pincode}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E8D8A] block">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className={`w-full bg-[#121212] border ${errors.city ? 'border-[#EF4444]' : 'border-[#222222]'} text-[#EDE7DC] px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#888888] rounded-sm`}
                    />
                    {errors.city && <span className="text-xs text-[#EF4444]">{errors.city}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8E8D8A] block">
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full bg-[#121212] border border-[#222222] text-[#EDE7DC] px-3 py-2.5 text-xs focus:outline-none focus:border-[#888888] rounded-sm"
                    >
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Payment Selection — ONLY TWO OPTIONS: ONLINE & COD */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-2">
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-[#EDE7DC]">
                    3. Payment Method
                  </h2>
                  <span className="text-[11px] text-[#8E8D8A] flex items-center gap-1 font-mono">
                    <ShieldCheck size={13} className="text-[#A3E635]" />
                    <span>256-Bit Encrypted Checkout</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Online Payment */}
                  <div
                    onClick={() => setFormData(p => ({ ...p, paymentMethod: 'online' }))}
                    className={`p-4 border rounded-sm cursor-pointer transition-all flex items-start gap-3.5 ${
                      formData.paymentMethod === 'online'
                        ? 'border-[#A3E635] bg-[#141812] text-[#EDE7DC] shadow-md'
                        : 'border-[#222222] bg-[#121212] text-[#8E8D8A] hover:border-[#383838]'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formData.paymentMethod === 'online'
                          ? 'border-[#A3E635] bg-[#A3E635]'
                          : 'border-[#444444]'
                      }`}>
                        {formData.paymentMethod === 'online' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className={formData.paymentMethod === 'online' ? 'text-[#A3E635]' : 'text-[#8E8D8A]'} />
                          <span className="text-xs font-semibold text-[#EDE7DC]">Online Payment</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#A3E635] bg-[#A3E635]/10 px-1.5 py-0.5 rounded-sm">
                          Instant
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E8D8A] leading-relaxed">
                        UPI (GPay, PhonePe, Paytm), Cards & NetBanking via Razorpay.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Cash on Delivery */}
                  <div
                    onClick={() => setFormData(p => ({ ...p, paymentMethod: 'cod' }))}
                    className={`p-4 border rounded-sm cursor-pointer transition-all flex items-start gap-3.5 ${
                      formData.paymentMethod === 'cod'
                        ? 'border-[#A3E635] bg-[#141812] text-[#EDE7DC] shadow-md'
                        : 'border-[#222222] bg-[#121212] text-[#8E8D8A] hover:border-[#383838]'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formData.paymentMethod === 'cod'
                          ? 'border-[#A3E635] bg-[#A3E635]'
                          : 'border-[#444444]'
                      }`}>
                        {formData.paymentMethod === 'cod' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote size={16} className={formData.paymentMethod === 'cod' ? 'text-[#A3E635]' : 'text-[#8E8D8A]'} />
                          <span className="text-xs font-semibold text-[#EDE7DC]">Cash on Delivery</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8E8D8A] bg-[#222222] px-1.5 py-0.5 rounded-sm">
                          COD
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E8D8A] leading-relaxed">
                        Pay with cash or QR scan upon delivery at your doorstep.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission Error Banner */}
              {submissionError && (
                <div className="p-3.5 bg-[#1f0d0d] border border-[#8E1717] rounded-sm text-xs text-[#FF8888] flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0 text-[#EF4444]" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#EDE7DC] hover:bg-white text-[#080808] text-xs font-semibold tracking-wider uppercase transition-all duration-200 disabled:opacity-50 rounded-sm flex items-center justify-center gap-2 shadow-xl active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{statusMessage || 'Processing Order...'}</span>
                    </>
                  ) : formData.paymentMethod === 'cod' ? (
                    <span>Place Order (Cash on Delivery) — ₹{cartTotal.toLocaleString('en-IN')}</span>
                  ) : (
                    <span>Proceed to Pay Online — ₹{cartTotal.toLocaleString('en-IN')}</span>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Right: Order Summary Sidebar (5 cols) */}
          <div className="lg:col-span-5 bg-[#0f0f0f] border border-[#1a1a1a] p-6 rounded-sm space-y-6">
            <h2 className="text-base font-medium text-[#EDE7DC] border-b border-[#1a1a1a] pb-3">
              Order Summary ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>

            {/* Items list */}
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-xs">
                  <div className="w-14 h-16 bg-[#161616] overflow-hidden shrink-0 border border-[#222222] rounded-sm">
                    <img src={item.product?.images?.[0] || item.image} alt={item.product?.name || item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#EDE7DC] truncate">{item.product?.name || item.name}</h3>
                    <div className="text-xs text-[#8E8D8A] mt-0.5">Size: {item.size} • Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm text-[#EDE7DC] font-medium">₹{((item.product?.price || item.unitPrice || 899) * item.quantity).toLocaleString('en-IN')}</span>
                    {item.product?.isSale && item.product?.basePrice && (
                      <span className="block text-[11px] text-[#666666] line-through font-mono">
                        ₹{(item.product.basePrice * item.quantity).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Section in Sidebar */}
            <div className="border-t border-[#1a1a1a] pt-4 space-y-2">
              {appliedCoupon ? (
                <div className="p-3 bg-[#141414] border border-[#262626] rounded-sm flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-[#A3E635]" />
                    <div>
                      <span className="text-[#EDE7DC] font-mono font-bold">{appliedCoupon.code}</span>
                      <span className="text-[#A3E635] text-[11px] block">
                        -₹{couponDiscount.toLocaleString('en-IN')} Applied
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-[#8E8D8A] hover:text-[#EF4444] text-[11px] underline uppercase tracking-wider"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={checkoutPromoInput}
                      onChange={(e) => setCheckoutPromoInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#141414] border border-[#262626] px-3 py-2 text-xs font-mono text-[#EDE7DC] placeholder-[#666666] focus:outline-none focus:border-[#888888] rounded-sm"
                    />
                    <button
                      type="submit"
                      disabled={isValidatingPromo || !checkoutPromoInput.trim()}
                      className="bg-[#222222] border border-[#333333] text-[#EDE7DC] px-3.5 py-2 text-xs font-medium uppercase tracking-wider hover:bg-[#333333] transition-colors rounded-sm flex items-center gap-1 disabled:opacity-40"
                    >
                      {isValidatingPromo ? <RefreshCw size={11} className="animate-spin" /> : null}
                      <span>Apply</span>
                    </button>
                  </form>
                  {checkoutPromoError && (
                    <p className="text-xs text-[#EF4444]">{checkoutPromoError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Calculations */}
            <div className="border-t border-[#1a1a1a] pt-4 space-y-2 text-xs text-[#8E8D8A]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#EDE7DC]">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between text-[#A3E635]">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Express Shipping</span>
                <span className={shippingCost === 0 ? 'text-[#A3E635] font-medium' : 'text-[#EDE7DC]'}>
                  {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                </span>
              </div>
              <div className="flex justify-between text-base text-[#EDE7DC] font-semibold border-t border-[#222222] pt-3">
                <span>Total Due</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#666666] space-y-1">
              <p>• Inclusive of all taxes across India.</p>
              <p>• Estimated arrival: {deliveryInfo?.estimatedDays || '3–5 business days'}.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
