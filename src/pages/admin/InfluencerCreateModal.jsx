import React, { useState } from 'react';
import { createAdminInfluencer } from '../../services/influencerService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Gift 
} from 'lucide-react';

export const InfluencerCreateModal = ({ onClose, onInfluencerCreated }) => {
  const { executeAction } = useAdminFeedback();
  const [name, setName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('creator123');
  const [phone, setPhone] = useState('');
  const [collaborationType, setCollaborationType] = useState('barter');
  const [couponCode, setCouponCode] = useState('');
  const [customerDiscountType, setCustomerDiscountType] = useState('percentage');
  const [customerDiscountValue, setCustomerDiscountValue] = useState(10);
  const [commissionType, setCommissionType] = useState('percentage');
  const [commissionValue, setCommissionValue] = useState(8);
  const [notes, setNotes] = useState('');

  const [barterProducts, setBarterProducts] = useState('');
  const [barterCost, setBarterCost] = useState('');
  const [barterNotes, setBarterNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleHandleChange = (val) => {
    const clean = val.replace(/[@\s]/g, '').toLowerCase();
    setInstagramHandle(clean);
    if (!couponCode || couponCode === `${instagramHandle.toUpperCase()}10`) {
      setCouponCode(clean ? `${clean.toUpperCase()}10` : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanHandle = instagramHandle.trim();
    const cleanCode = couponCode.trim().toUpperCase();

    if (!cleanName) {
      setErrorMessage('Influencer full name is required.');
      return;
    }

    if (!cleanHandle) {
      setErrorMessage('Instagram handle is required.');
      return;
    }

    if (!cleanCode) {
      setErrorMessage('Coupon code is required.');
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
        date: new Date().toISOString().split('T')[0],
        notes: barterNotes.trim() || null
      };
    }

    setIsSubmitting(true);

    const outcome = await executeAction(
      `influencer_create_${cleanCode}`,
      () => createAdminInfluencer({
        name: cleanName,
        instagramHandle: cleanHandle,
        email: email.trim() || null,
        password: password.trim() || 'creator123',
        phone: phone.trim() || null,
        collaborationType,
        couponCode: cleanCode,
        customerDiscountType,
        customerDiscountValue: Number(customerDiscountValue),
        commissionType,
        commissionValue: Number(commissionValue),
        notes: notes.trim() || null,
        barterDetails
      }),
      {
        label: 'Adding influencer partner...',
        successTitle: 'Influencer added successfully',
        errorTitle: 'Failed to add influencer',
        entityType: 'influencer',
        entityId: cleanHandle,
        detail: `Creator: ${cleanName} (@${cleanHandle})`
      }
    );

    setIsSubmitting(false);

    if (outcome.success) {
      setSuccessMessage('Influencer partner added successfully.');
      if (onInfluencerCreated) {
        onInfluencerCreated(outcome.data.influencer);
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
              Add Influencer Partner
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Setup referral promo code, discount, and commission percentage
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

          {/* Section: Creator Info */}
          <div className="space-y-3.5 bg-[#111115] border border-[#22222C] p-5 rounded-2xl shadow-xs">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider border-b border-[#1C1C24] pb-2 flex items-center gap-1.5">
              <span>Creator Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aaryan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 placeholder-zinc-600 shadow-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Instagram Handle *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">@</span>
                  <input
                    type="text"
                    placeholder="aaryan_street"
                    value={instagramHandle}
                    onChange={(e) => handleHandleChange(e.target.value)}
                    required
                    className="w-full bg-[#16161D] border border-[#262634] text-white pl-8 pr-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 font-mono text-xs placeholder-zinc-600 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Email Address (Login)
                </label>
                <input
                  type="email"
                  placeholder="creator@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 placeholder-zinc-600 shadow-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Portal Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 font-mono text-xs shadow-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 placeholder-zinc-600 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Section: Collaboration Terms */}
          <div className="space-y-3.5 bg-[#111115] border border-[#22222C] p-5 rounded-2xl shadow-xs">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider border-b border-[#1C1C24] pb-2">
              Promo Code & Commission Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Collaboration Type
                </label>
                <select
                  value={collaborationType}
                  onChange={(e) => setCollaborationType(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:border-zinc-400 shadow-xs"
                >
                  <option value="barter">Barter (Product Gifting)</option>
                  <option value="paid">Paid Collaboration</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AARYAN10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  required
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none uppercase font-mono font-bold text-xs focus:border-zinc-400 placeholder-zinc-600 shadow-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Customer Discount
                </label>
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

              <div className="sm:col-span-3">
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Creator Commission Rate
                </label>
                <div className="flex gap-2 max-w-sm">
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value)}
                    className="w-44 bg-[#16161D] border border-[#262634] text-white px-3 py-2.5 rounded-xl text-xs focus:border-zinc-400 shadow-xs"
                  >
                    <option value="percentage">% of Subtotal</option>
                    <option value="fixed">₹ Fixed / Order</option>
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
            </div>
          </div>

          {/* Barter Section */}
          {collaborationType === 'barter' && (
            <div className="space-y-3.5 bg-amber-950/20 p-5 rounded-2xl border border-amber-800/40 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                <Gift size={14} className="text-amber-400" />
                <span>Barter Gifting Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1.5 text-xs">
                    Products Sent (one per line)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="LZR RACING TEE (Size M)&#10;LZR APEX HOODIE (Size L)"
                    value={barterProducts}
                    onChange={(e) => setBarterProducts(e.target.value)}
                    className="w-full bg-[#16161D] border border-amber-900/50 text-white px-3.5 py-2 rounded-xl outline-none resize-none text-xs focus:border-amber-600 placeholder-zinc-600 shadow-xs"
                  />
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-zinc-300 font-medium block mb-1.5 text-xs">
                      Internal Cost (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 950"
                      value={barterCost}
                      onChange={(e) => setBarterCost(e.target.value)}
                      className="w-full bg-[#16161D] border border-amber-900/50 text-white px-3.5 py-2 rounded-xl outline-none text-xs focus:border-amber-600 placeholder-zinc-600 shadow-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-medium block mb-1.5 text-xs">
                      Deliverables / Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="1 Reel + Story"
                      value={barterNotes}
                      onChange={(e) => setBarterNotes(e.target.value)}
                      className="w-full bg-[#16161D] border border-amber-900/50 text-white px-3.5 py-2 rounded-xl outline-none text-xs focus:border-amber-600 placeholder-zinc-600 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
              Internal Staff Notes
            </label>
            <textarea
              rows={2}
              placeholder="Agency info, payment terms, sizing preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none resize-none placeholder-zinc-600 focus:border-zinc-400 shadow-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#22222C]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#1C1C24] hover:bg-[#252530] text-zinc-300 text-xs font-medium rounded-xl transition-colors border border-[#2C2C38] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isSubmitting ? <RefreshCw size={13} className="animate-spin text-zinc-900" /> : <Sparkles size={13} />}
              <span>Add Influencer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
