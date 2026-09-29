import React, { useState } from 'react';
import { updateAdminInfluencer } from '../../services/influencerService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Gift, 
  ShieldAlert 
} from 'lucide-react';

export const InfluencerEditModal = ({ influencer, onClose, onInfluencerUpdated }) => {
  const { executeAction } = useAdminFeedback();
  const [name, setName] = useState(influencer.name || '');
  const [instagramHandle, setInstagramHandle] = useState(influencer.instagram_handle || '');
  const [email, setEmail] = useState(influencer.email || '');
  const [password, setPassword] = useState(influencer.password || 'creator123');
  const [phone, setPhone] = useState(influencer.phone || '');
  const [collaborationType, setCollaborationType] = useState(influencer.collaboration_type || 'barter');
  const [customerDiscountType, setCustomerDiscountType] = useState(influencer.customer_discount_type || 'percentage');
  const [customerDiscountValue, setCustomerDiscountValue] = useState(influencer.customer_discount_value || 10);
  const [commissionType, setCommissionType] = useState(influencer.commission_type || 'percentage');
  const [commissionValue, setCommissionValue] = useState(influencer.commission_value || 8);
  const [isActive, setIsActive] = useState(influencer.is_active !== false);
  const [notes, setNotes] = useState(influencer.notes || '');

  const barterInitial = influencer.barter_details || {};
  const [barterProducts, setBarterProducts] = useState(
    Array.isArray(barterInitial.products_sent) ? barterInitial.products_sent.join('\n') : ''
  );
  const [barterCost, setBarterCost] = useState(barterInitial.internal_cost || '');
  const [barterNotes, setBarterNotes] = useState(barterInitial.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanHandle = instagramHandle.trim();

    if (!cleanName) {
      setErrorMessage('Influencer name is required.');
      return;
    }

    if (!cleanHandle) {
      setErrorMessage('Instagram handle is required.');
      return;
    }

    if (Number(customerDiscountValue) <= 0) {
      setErrorMessage('Customer discount must be greater than 0.');
      return;
    }

    if (Number(commissionValue) < 0) {
      setErrorMessage('Commission value cannot be negative.');
      return;
    }

    let barterDetails = null;
    if (collaborationType === 'barter') {
      const itemsList = barterProducts
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      barterDetails = {
        products_sent: itemsList,
        internal_cost: Number(barterCost) || 0,
        date: barterInitial.date || new Date().toISOString().split('T')[0],
        notes: barterNotes.trim() || null
      };
    }

    setIsSubmitting(true);

    const outcome = await executeAction(
      `influencer_update_${influencer.id}`,
      () => updateAdminInfluencer(influencer.id, {
        name: cleanName,
        instagramHandle: cleanHandle,
        email: email.trim() || null,
        password: password.trim() || undefined,
        phone: phone.trim() || null,
        collaborationType,
        customerDiscountType,
        customerDiscountValue: Number(customerDiscountValue),
        commissionType,
        commissionValue: Number(commissionValue),
        isActive,
        notes: notes.trim() || null,
        barterDetails
      }),
      {
        label: 'Updating influencer...',
        successTitle: 'Influencer updated',
        errorTitle: 'Update failed',
        entityType: 'influencer',
        entityId: cleanHandle,
        detail: `Creator: ${cleanName}`
      }
    );

    setIsSubmitting(false);

    if (outcome.success) {
      setSuccessMessage('Influencer updated successfully.');
      if (onInfluencerUpdated) {
        onInfluencerUpdated(outcome.data.influencer);
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
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#141418] border border-[#242430] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#EDEDF0] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#121216] border-b border-[#22222C] flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Edit Influencer: @{influencer.instagram_handle}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Update rates, collaboration type, or pause creator account
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#20202A] rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-zinc-300">
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

          <div className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded-2xl text-[11px] text-amber-300 flex items-start gap-2.5 shadow-xs">
            <ShieldAlert size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <span>Rate adjustments will apply only to future orders. Established past commissions remain preserved in the ledger.</span>
          </div>

          {/* Section: Profile */}
          <div className="space-y-3.5 bg-[#111115] border border-[#22222C] p-5 rounded-2xl shadow-xs">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider border-b border-[#1C1C24] pb-2">
              Creator Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 shadow-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Instagram Handle</label>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace(/[@\s]/g, '').toLowerCase())}
                  required
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 font-mono text-xs shadow-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 placeholder-zinc-600 shadow-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 font-mono text-xs shadow-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 placeholder-zinc-600 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Section: Terms */}
          <div className="space-y-3.5 bg-[#111115] border border-[#22222C] p-5 rounded-2xl shadow-xs">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider border-b border-[#1C1C24] pb-2">
              Commission & Promo Code Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Type</label>
                <select
                  value={collaborationType}
                  onChange={(e) => setCollaborationType(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3 py-2.5 rounded-xl outline-none focus:border-zinc-400 cursor-pointer shadow-xs"
                >
                  <option value="barter">Barter</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Coupon (Locked)</label>
                <input
                  type="text"
                  value={influencer.coupon_code}
                  disabled
                  className="w-full bg-[#16161D]/60 border border-[#262634] text-zinc-500 px-3.5 py-2.5 rounded-xl cursor-not-allowed font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Customer Discount</label>
                <div className="flex gap-1.5">
                  <select
                    value={customerDiscountType}
                    onChange={(e) => setCustomerDiscountType(e.target.value)}
                    className="w-16 bg-[#16161D] border border-[#262634] text-white px-2 py-2.5 rounded-xl text-xs focus:border-zinc-400 shadow-xs"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">₹</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={customerDiscountValue}
                    onChange={(e) => setCustomerDiscountValue(e.target.value)}
                    className="w-full bg-[#16161D] border border-[#262634] text-white px-3 py-2.5 rounded-xl outline-none font-semibold focus:border-zinc-400 shadow-xs"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Creator Commission</label>
                <div className="flex gap-2 max-w-sm">
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value)}
                    className="w-44 bg-[#16161D] border border-[#262634] text-white px-3 py-2.5 rounded-xl text-xs focus:border-zinc-400 shadow-xs"
                  >
                    <option value="percentage">% of Subtotal</option>
                    <option value="fixed">₹ Fixed</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    className="w-full bg-[#16161D] border border-[#262634] text-white px-3 py-2.5 rounded-xl outline-none font-semibold focus:border-zinc-400 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Account Status</label>
                <select
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3 py-2.5 rounded-xl outline-none focus:border-zinc-400 cursor-pointer shadow-xs"
                >
                  <option value="true">Active (Valid)</option>
                  <option value="false">Paused (Disabled)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Barter */}
          {collaborationType === 'barter' && (
            <div className="space-y-3.5 bg-amber-950/20 p-5 rounded-2xl border border-amber-800/40 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                <Gift size={14} className="text-amber-400" />
                <span>Barter Gifting Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1.5 text-xs">Products Sent</label>
                  <textarea
                    rows={2}
                    value={barterProducts}
                    onChange={(e) => setBarterProducts(e.target.value)}
                    className="w-full bg-[#16161D] border border-amber-900/50 text-white px-3.5 py-2 rounded-xl outline-none resize-none text-xs focus:border-amber-600 shadow-xs"
                  />
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-zinc-300 font-medium block mb-1.5 text-xs">Internal Cost (₹)</label>
                    <input
                      type="number"
                      value={barterCost}
                      onChange={(e) => setBarterCost(e.target.value)}
                      className="w-full bg-[#16161D] border border-amber-900/50 text-white px-3.5 py-2 rounded-xl outline-none text-xs focus:border-amber-600 shadow-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-medium block mb-1.5 text-xs">Deliverables</label>
                    <input
                      type="text"
                      value={barterNotes}
                      onChange={(e) => setBarterNotes(e.target.value)}
                      className="w-full bg-[#16161D] border border-amber-900/50 text-white px-3.5 py-2 rounded-xl outline-none text-xs focus:border-amber-600 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">Internal Staff Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none resize-none focus:border-zinc-400 shadow-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-[#22222C]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#1C1C24] hover:bg-[#252530] text-zinc-300 text-xs font-medium rounded-xl transition-colors border border-[#2C2C38] cursor-pointer min-h-[40px] flex items-center justify-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[42px]"
            >
              {isSubmitting ? <RefreshCw size={13} className="animate-spin text-zinc-900" /> : null}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
