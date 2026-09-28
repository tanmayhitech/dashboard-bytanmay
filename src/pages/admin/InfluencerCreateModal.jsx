import React, { useState } from 'react';
import { createAdminInfluencer } from '../../services/influencerService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Percent, 
  DollarSign, 
  Instagram, 
  Package, 
  Clock,
  Database,
  Gift 
} from 'lucide-react';

export const InfluencerCreateModal = ({ onClose, onInfluencerCreated }) => {
  const { executeAction } = useAdminFeedback();
  const [name, setName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('creator123');
  const [phone, setPhone] = useState('');
  const [collaborationType, setCollaborationType] = useState('barter'); // 'barter' | 'paid'
  const [couponCode, setCouponCode] = useState('');
  const [customerDiscountType, setCustomerDiscountType] = useState('percentage'); // 'percentage' | 'fixed'
  const [customerDiscountValue, setCustomerDiscountValue] = useState(10);
  const [commissionType, setCommissionType] = useState('percentage'); // 'percentage' | 'fixed'
  const [commissionValue, setCommissionValue] = useState(8);
  const [notes, setNotes] = useState('');

  // Barter specific fields
  const [barterProducts, setBarterProducts] = useState('');
  const [barterCost, setBarterCost] = useState('');
  const [barterNotes, setBarterNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lastDuration, setLastDuration] = useState(null);

  // Auto-generate suggested coupon code from handle
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
    setLastDuration(null);

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

    const detailString = `Name: ${cleanName} (@${cleanHandle}) • Code: ${cleanCode} • Type: ${collaborationType.toUpperCase()} • Disc: ${customerDiscountValue}%`;

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
        errorTitle: 'Influencer could not be added',
        entityType: 'influencer',
        entityId: cleanHandle,
        detail: detailString
      }
    );

    setIsSubmitting(false);

    if (outcome.success) {
      setSuccessMessage('Influencer partner onboarded successfully.');
      setLastDuration(outcome.duration);
      if (onInfluencerCreated) {
        onInfluencerCreated(outcome.data.influencer);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn font-sans">
      <div 
        className="bg-[#121212] border border-[#242424] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#161616] border-b border-[#222222] p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Add Influencer & Creator Partner
              </h2>
              <p className="text-[11px] text-zinc-400">
                Setup referral coupon, customer discount, and commission attribution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#202020] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span className="font-semibold">Creation Failed</span>
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
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span className="font-semibold">{successMessage}</span>
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

          {/* Section: Influencer Profile */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-[#222222] pb-1.5">
              Creator Information & Login Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-medium">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aaryan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#181818] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">
                  Instagram Handle <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">@</span>
                  <input
                    type="text"
                    placeholder="aaryan_street"
                    value={instagramHandle}
                    onChange={(e) => handleHandleChange(e.target.value)}
                    required
                    className="w-full bg-[#181818] border border-[#282828] text-white pl-8 pr-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none placeholder-zinc-600 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">
                  Email Address (For Portal Login)
                </label>
                <input
                  type="email"
                  placeholder="aaryan@creator.loozars.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">
                  Assign Portal Login Password
                </label>
                <input
                  type="text"
                  placeholder="creator123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181818] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none font-mono text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-400 block mb-1 font-medium">
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#181818] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none placeholder-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Collaboration Type & Rates */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-[#222222] pb-1.5">
              Collaboration & Commission Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-medium">
                  Collaboration Type
                </label>
                <select
                  value={collaborationType}
                  onChange={(e) => setCollaborationType(e.target.value)}
                  className="w-full bg-[#181818] border border-[#282828] text-white px-3 py-2.5 rounded-lg focus:border-zinc-500 outline-none cursor-pointer"
                >
                  <option value="barter">Barter (Product Gifting)</option>
                  <option value="paid">Paid Collaboration</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">
                  Referral Coupon Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. AARYAN10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  required
                  className="w-full bg-[#181818] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none uppercase font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">
                  Customer Discount
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={customerDiscountType}
                    onChange={(e) => setCustomerDiscountType(e.target.value)}
                    className="w-20 bg-[#181818] border border-[#282828] text-white px-2 py-2.5 rounded-lg text-xs"
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
                    className="w-full bg-[#181818] border border-[#282828] text-white px-3 py-2.5 rounded-lg focus:border-zinc-500 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="text-zinc-400 block mb-1 font-medium">
                  Influencer Commission Rate
                </label>
                <div className="flex gap-2 max-w-sm">
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value)}
                    className="w-32 bg-[#181818] border border-[#282828] text-white px-3 py-2.5 rounded-lg text-xs"
                  >
                    <option value="percentage">% of Net Subtotal</option>
                    <option value="fixed">₹ Fixed / Order</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    className="w-full bg-[#181818] border border-[#282828] text-white px-3 py-2.5 rounded-lg focus:border-zinc-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Commission is calculated strictly on the net merchandise subtotal (after discount, excluding shipping fee).
                </p>
              </div>
            </div>
          </div>

          {/* Section: Barter Collaboration Details (If Barter selected) */}
          {collaborationType === 'barter' && (
            <div className="space-y-3 bg-[#161616] p-4 rounded-xl border border-[#242424]">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Gift size={14} className="text-amber-400" />
                <span>Barter Gifting Details (Informational Record)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">
                    Products Sent (One per line)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="LZR VELO 07 (Size M)&#10;LZR APEX HOODIE (Size L)"
                    value={barterProducts}
                    onChange={(e) => setBarterProducts(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#282828] text-white px-3 py-2 rounded-lg outline-none resize-none placeholder-zinc-600 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">
                      Internal Cost of Gifted Pieces (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 950"
                      value={barterCost}
                      onChange={(e) => setBarterCost(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-[#282828] text-white px-3 py-2 rounded-lg outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">
                      Deliverables / Post Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="1 Reel + 2 Story posts with tag"
                      value={barterNotes}
                      onChange={(e) => setBarterNotes(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-[#282828] text-white px-3 py-2 rounded-lg outline-none text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Operational Notes */}
          <div className="text-xs">
            <label className="text-zinc-400 block mb-1 font-medium">
              Internal Collaboration Notes
            </label>
            <textarea
              rows={2}
              placeholder="Contract notes, agency representation, payment details, campaign tag..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#181818] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none resize-none placeholder-zinc-600"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1c1c1c] hover:bg-[#262626] text-zinc-400 hover:text-white text-xs font-medium rounded-lg transition-colors border border-[#282828]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? <RefreshCw size={13} className="animate-spin text-black" /> : <Sparkles size={13} />}
              <span>{isSubmitting ? 'Creating...' : 'Create Influencer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
