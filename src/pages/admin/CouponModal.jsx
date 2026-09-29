import React, { useState } from 'react';
import { upsertCoupon } from '../../services/adminService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Tag, 
  Percent, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw
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

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
      ? `Coupon ${cleanCode} updated` 
      : `Coupon ${cleanCode} created`;

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
        errorTitle: 'Coupon could not be saved',
        entityType: 'coupon',
        entityId: cleanCode,
        detail: `Code: ${cleanCode}`
      }
    );

    setIsSaving(false);

    if (outcome.success) {
      setSuccessMessage(actionTitle);
      if (onCouponSaved) {
        onCouponSaved(outcome.data.coupon);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage(outcome.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs animate-fadeIn font-sans">
      <div 
        className="relative w-full max-w-lg max-h-[90vh] bg-[#141418] border border-[#242430] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#EDEDF0] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#121216] border-b border-[#22222C] flex items-center justify-between z-10">
          <div>
            <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase block">
              Promotions & Vouchers
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {isEditing ? `Edit Coupon: ${coupon.code}` : 'Create Coupon'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#20202A] rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-zinc-300">
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 text-rose-300 rounded-2xl flex items-center gap-2.5 shadow-xs">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 rounded-2xl flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Code */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Coupon Promo Code *</label>
            <input
              type="text"
              placeholder="e.g. LOOZARS10, SPEED100"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-white px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold uppercase tracking-wider outline-none placeholder-zinc-600 shadow-xs"
              required
            />
          </div>

          {/* Type */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDiscountType('percentage')}
              className={`p-3 border rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                discountType === 'percentage' 
                  ? 'bg-[#22222C] text-white border-[#3E3E50] shadow-xs font-semibold' 
                  : 'bg-[#16161D] border-[#262634] text-zinc-400 hover:text-zinc-200 hover:bg-[#1C1C24]'
              }`}
            >
              <Percent size={14} />
              <span>Percentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setDiscountType('fixed')}
              className={`p-3 border rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                discountType === 'fixed' 
                  ? 'bg-[#22222C] text-white border-[#3E3E50] shadow-xs font-semibold' 
                  : 'bg-[#16161D] border-[#262634] text-zinc-400 hover:text-zinc-200 hover:bg-[#1C1C24]'
              }`}
            >
              <Tag size={14} />
              <span>Fixed INR (₹)</span>
            </button>
          </div>

          {/* Discount Value & Max Cap */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                {discountType === 'percentage' ? 'Percentage Value (%) *' : 'Fixed Discount (₹) *'}
              </label>
              <input
                type="number"
                min="1"
                max={discountType === 'percentage' ? '100' : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-white font-mono font-bold px-3.5 py-2.5 rounded-xl text-xs outline-none shadow-xs"
                required
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                Max Cap (₹, Optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-white font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none placeholder-zinc-600 shadow-xs"
              />
            </div>
          </div>

          {/* Min Order & Usage Limit */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                Min Order Subtotal (₹)
              </label>
              <input
                type="number"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-white font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                Total Usage Limit (Optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-white font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none placeholder-zinc-600 shadow-xs"
              />
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
              Expiration Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-white font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none shadow-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
              Description / Internal Notes
            </label>
            <input
              type="text"
              placeholder="e.g. VIP secret drop launch voucher"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none placeholder-zinc-600 shadow-xs"
            />
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 p-3.5 bg-[#111115] border border-[#22222C] rounded-2xl cursor-pointer select-none hover:bg-[#16161D] transition-colors shadow-xs">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded accent-white bg-[#16161D] border-[#262634]"
            />
            <div>
              <span className="text-xs font-semibold text-white block">Coupon Active</span>
              <span className="text-[11px] text-zinc-400">Shoppers can apply this promo code during checkout</span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-[#22222C]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#1C1C24] hover:bg-[#252530] text-zinc-300 text-xs font-medium rounded-xl border border-[#2C2C38] transition-colors cursor-pointer min-h-[40px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[42px]"
            >
              {isSaving ? <RefreshCw size={13} className="animate-spin text-zinc-900" /> : null}
              <span>{isEditing ? 'Save Changes' : 'Create Coupon'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
