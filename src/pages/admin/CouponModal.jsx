import React, { useState } from 'react';
import { upsertCoupon } from '../../services/adminService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Tag, 
  Percent, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  Database
} from 'lucide-react';

export const CouponModal = ({ coupon, onClose, onCouponSaved }) => {
  const isEditing = Boolean(coupon?.id);
  const { executeAction } = useAdminFeedback();

  const [code, setCode] = useState(coupon?.code || '');
  const [description, setDescription] = useState(coupon?.description || '');
  const [discountType, setDiscountType] = useState(coupon?.discount_type || 'percentage');
  const [discountValue, setDiscountValue] = useState(coupon?.discount_value?.toString() || '10');
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.min_order_amount?.toString() || '0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(coupon?.max_discount_amount ? coupon.max_discount_amount.toString() : '');
  const [usageLimit, setUsageLimit] = useState(coupon?.usage_limit ? coupon.usage_limit.toString() : '');
  const [isActive, setIsActive] = useState(coupon ? Boolean(coupon.is_active) : true);
  const [expiresAt, setExpiresAt] = useState(
    coupon?.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lastDuration, setLastDuration] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLastDuration(null);

    const cleanCode = code.trim().toUpperCase();
    const val = parseFloat(discountValue);

    if (!cleanCode) {
      setErrorMessage('Coupon code is required.');
      return;
    }

    if (isNaN(val) || val <= 0) {
      setErrorMessage('Discount value must be a positive number.');
      return;
    }

    if (discountType === 'percentage' && val > 100) {
      setErrorMessage('Percentage discount cannot exceed 100%.');
      return;
    }

    const actionTitle = isEditing 
      ? `Coupon ${cleanCode} updated successfully` 
      : `Coupon ${cleanCode} created successfully`;

    const detailString = `Code: ${cleanCode} • ${discountType === 'percentage' ? `${val}% OFF` : `₹${val} OFF`} • Min Order: ₹${minOrderAmount} • Status: ${isActive ? 'Active' : 'Disabled'}`;

    setIsSaving(true);

    const outcome = await executeAction(
      `coupon_save_${cleanCode}`,
      () => upsertCoupon({
        id: coupon?.id || null,
        code: cleanCode,
        description: description.trim() || null,
        discount_type: discountType,
        discount_value: val,
        min_order_amount: parseInt(minOrderAmount, 10) || 0,
        max_discount_amount: maxDiscountAmount.trim() ? parseInt(maxDiscountAmount, 10) : null,
        usage_limit: usageLimit.trim() ? parseInt(usageLimit, 10) : null,
        is_active: isActive,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
      }),
      {
        label: isEditing ? 'Updating coupon...' : 'Creating coupon...',
        successTitle: actionTitle,
        errorTitle: isEditing ? 'Coupon could not be updated' : 'Coupon could not be created',
        entityType: 'coupon',
        entityId: cleanCode,
        detail: detailString
      }
    );

    setIsSaving(false);

    if (outcome.success) {
      setSuccessMessage(actionTitle);
      setLastDuration(outcome.duration);
      if (onCouponSaved) {
        onCouponSaved(outcome.data.coupon);
      }
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setErrorMessage(outcome.error);
      setLastDuration(outcome.duration);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      <div 
        className="bg-[#121212] border border-[#242424] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#121212]/95 backdrop-blur border-b border-[#202020] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <span className="text-[10px] text-[#8E8D8A] font-semibold tracking-wider uppercase block">
              Promotion Engine
            </span>
            <h3 className="text-lg font-semibold text-[#EDE7DC]">
              {isEditing ? `Edit Coupon: ${coupon.code}` : 'Create Promo Code'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8E8D8A] hover:text-[#EDE7DC] hover:bg-[#1a1a1a] rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">

          {/* Feedback */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span className="font-semibold text-xs">Operation Failed</span>
              </div>
              <p className="text-[11px] text-rose-300/90 pl-6">{errorMessage}</p>
              {lastDuration && (
                <div className="pl-6 pt-1 flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 bg-[#181818] rounded border border-[#2a2a2a]">⏱ {lastDuration}</span>
                  <span className="text-zinc-500">Database: Unchanged</span>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span className="font-semibold text-xs">{successMessage}</span>
              </div>
              {lastDuration && (
                <div className="pl-6 pt-1 flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 bg-[#181818] text-zinc-300 rounded border border-[#2a2a2a]">⏱ {lastDuration}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">Database: Updated</span>
                  <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">Sync: Complete</span>
                </div>
              )}
            </div>
          )}

          {/* Coupon Code */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#8E8D8A] block">
              Promo Code
            </label>
            <input
              type="text"
              placeholder="e.g. LOOZARS10, SPEED100, RACING"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-[#0c0c0c] border border-[#222222] focus:border-[#444] text-[#EDE7DC] px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold uppercase tracking-wider outline-none transition-colors"
              required
            />
          </div>

          {/* Discount Type Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDiscountType('percentage')}
              className={`p-3 border rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                discountType === 'percentage' 
                  ? 'bg-white text-black border-white shadow-sm' 
                  : 'bg-[#0c0c0c] border-[#222222] text-[#8E8D8A] hover:text-[#EDE7DC] hover:border-[#333]'
              }`}
            >
              <Percent size={13} />
              <span>Percentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setDiscountType('fixed')}
              className={`p-3 border rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                discountType === 'fixed' 
                  ? 'bg-white text-black border-white shadow-sm' 
                  : 'bg-[#0c0c0c] border-[#222222] text-[#8E8D8A] hover:text-[#EDE7DC] hover:border-[#333]'
              }`}
            >
              <Tag size={13} />
              <span>Fixed INR (₹)</span>
            </button>
          </div>

          {/* Discount Value & Max Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8E8D8A] block">
                {discountType === 'percentage' ? 'Percentage Value (%)' : 'Fixed Discount (₹ INR)'}
              </label>
              <input
                type="number"
                min="1"
                max={discountType === 'percentage' ? '100' : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full bg-[#0c0c0c] border border-[#222222] focus:border-[#444] text-[#EDE7DC] font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8E8D8A] block">
                Max Discount Cap (₹, Optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                className="w-full bg-[#0c0c0c] border border-[#222222] focus:border-[#444] text-[#EDE7DC] font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
              />
            </div>
          </div>

          {/* Min Order Amount & Usage Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8E8D8A] block">
                Min Order Amount (₹ INR)
              </label>
              <input
                type="number"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-full bg-[#0c0c0c] border border-[#222222] focus:border-[#444] text-[#EDE7DC] font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#8E8D8A] block">
                Total Usage Limit (Optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-full bg-[#0c0c0c] border border-[#222222] focus:border-[#444] text-[#EDE7DC] font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#8E8D8A] block">
              Expiration Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-[#0c0c0c] border border-[#222222] focus:border-[#444] text-[#EDE7DC] font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#8E8D8A] block">
              Description / Campaign Note
            </label>
            <input
              type="text"
              placeholder="e.g. VIP Early Access Drop 01 promotion"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0c0c0c] border border-[#222222] focus:border-[#444] text-[#EDE7DC] px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 p-3.5 bg-[#0c0c0c] border border-[#202020] rounded-2xl cursor-pointer select-none hover:border-[#2a2a2a] transition-colors">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-white w-4 h-4 rounded"
            />
            <div>
              <span className="text-xs text-[#EDE7DC] font-medium block">Coupon Enabled</span>
              <span className="text-[11px] text-[#777]">Customers can apply and redeem this code during checkout</span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e1e1e]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#161616] hover:bg-[#202020] text-[#A39E99] hover:text-[#EDE7DC] text-xs font-medium rounded-xl border border-[#262626] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-white hover:bg-[#EDE7DC] disabled:opacity-50 text-black text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              {isSaving ? <RefreshCw size={13} className="animate-spin text-black" /> : null}
              <span>{isSaving ? 'Saving...' : isEditing ? 'Update Coupon' : 'Create Coupon'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
