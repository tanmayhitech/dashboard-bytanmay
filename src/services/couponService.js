import { supabase, isSupabaseConfigured } from '../supabase/client.js';

/**
 * LOOZARS® Coupon Service
 * Validates promo coupons in real time against Supabase PostgreSQL RPC (with offline fallback)
 */

export const validateCoupon = async (code, cartSubtotal = 0) => {
  if (!code || !code.trim()) {
    return { valid: false, error: 'Please enter a promo code.' };
  }

  const cleanCode = code.trim().toUpperCase();
  const subtotal = Math.max(0, parseInt(cartSubtotal, 10) || 0);

  // 1. Authoritative Supabase Validation
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: cleanCode,
        p_cart_subtotal: subtotal
      });

      if (!error && data) {
        if (!data.valid) {
          return {
            valid: false,
            code: cleanCode,
            error: data.error || 'Invalid or expired promo code.'
          };
        }

        return {
          valid: true,
          code: data.code || cleanCode,
          discountType: data.discount_type,
          discountValue: parseFloat(data.discount_value),
          discountAmount: Math.round(data.discount_amount || 0),
          description: data.description || `${data.discount_value}% Promo Discount`,
          error: null
        };
      }

      console.warn('[couponService] validate_coupon RPC returned error, attempting fallback:', error?.message);
    } catch (err) {
      console.warn('[couponService] validate_coupon exception:', err.message);
    }
  }

  // 2. Offline Fallback Logic (Development Mode)
  if (cleanCode === 'DROP01' || cleanCode === 'LOOZAR10') {
    const discount = Math.round(subtotal * 0.1);
    return {
      valid: true,
      code: cleanCode,
      discountType: 'percentage',
      discountValue: 10,
      discountAmount: discount,
      description: '10% Launch Discount',
      error: null
    };
  }

  if (cleanCode === 'LOOZAR100') {
    const discount = Math.min(500, subtotal);
    return {
      valid: true,
      code: cleanCode,
      discountType: 'percentage',
      discountValue: 100,
      discountAmount: discount,
      description: '100% Community Member Discount (Max ₹500)',
      error: null
    };
  }

  // Check stored/mock creator coupons for local development mode
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('loozars_mock_influencers_v1');
      if (raw) {
        const influencers = JSON.parse(raw);
        const match = Array.isArray(influencers) && influencers.find(i => i.is_active && (i.coupon_code || '').toUpperCase() === cleanCode);
        if (match) {
          const discountVal = Number(match.customer_discount_value || 10);
          const isPercent = (match.customer_discount_type || 'percentage') === 'percentage';
          const discount = isPercent ? Math.round((subtotal * discountVal) / 100) : Math.min(subtotal, Math.round(discountVal));
          return {
            valid: true,
            code: cleanCode,
            discountType: match.customer_discount_type || 'percentage',
            discountValue: discountVal,
            discountAmount: discount,
            description: `Creator Discount (@${match.instagram_handle || 'creator'})`,
            influencer_id: match.id,
            error: null
          };
        }
      }
    } catch (e) {
      console.warn('[couponService] Fallback coupon check error:', e);
    }
  }

  return {
    valid: false,
    code: cleanCode,
    error: `Promo code "${cleanCode}" is invalid or expired.`
  };
};

/**
 * Calculates current discount amount based on live cart subtotal and coupon rules
 */
export const calculateCouponDiscount = (coupon, subtotal) => {
  if (!coupon || !coupon.valid || subtotal <= 0) return 0;

  if (coupon.discountType === 'percentage') {
    let discount = Math.round((subtotal * coupon.discountValue) / 100.0);
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
    return Math.min(subtotal, Math.max(0, discount));
  }

  if (coupon.discountType === 'fixed') {
    const discount = Math.round(coupon.discountValue);
    return Math.min(subtotal, Math.max(0, discount));
  }

  return Math.min(subtotal, Math.max(0, coupon.discountAmount || 0));
};
