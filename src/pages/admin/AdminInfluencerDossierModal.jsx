import React, { useState, useEffect } from 'react';
import { fetchInfluencerDossier, markInfluencerPayoutPaid } from '../../services/influencerService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  CreditCard,
  Copy,
  Tag,
  Percent,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatOrderNumber } from '../../services/orderService';

export const AdminInfluencerDossierModal = ({ influencer, onClose, onInfluencerUpdated }) => {
  const [dossierData, setDossierData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommissionIds, setSelectedCommissionIds] = useState([]);
  const [payoutReference, setPayoutReference] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const loadDossier = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchInfluencerDossier(influencer.id);
      if (res.success) {
        setDossierData(res);
      } else {
        throw new Error(res.error || 'Failed to load creator dossier.');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (influencer?.id) {
      loadDossier();
    }
  }, [influencer?.id]);

  const commissions = dossierData?.commissions || [];
  const orders = dossierData?.orders || [];
  const inf = dossierData?.influencer || influencer;

  const eligibleCommissions = commissions.filter(c => c.status === 'eligible');
  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const totalEarned = commissions.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
  const totalEligible = eligibleCommissions.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
  const totalPaid = paidCommissions.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);

  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);

  const handleCopyCoupon = () => {
    if (!inf?.coupon_code) return;
    navigator.clipboard?.writeText(inf.coupon_code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const handleSelectAllEligible = (e) => {
    if (e.target.checked) {
      setSelectedCommissionIds(eligibleCommissions.map(c => c.id));
    } else {
      setSelectedCommissionIds([]);
    }
  };

  const handleToggleSelectCommission = (id) => {
    setSelectedCommissionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const { executeAction, showToast } = useAdminFeedback();

  const handleConfirmPayout = async (e) => {
    e.preventDefault();
    if (selectedCommissionIds.length === 0) return;
    if (!payoutReference.trim()) {
      setErrorMessage('Payout reference (Bank / UPI ID) is required.');
      return;
    }

    setErrorMessage(null);
    setFeedbackMessage(null);
    setIsProcessingPayout(true);

    const targetAmount = eligibleCommissions
      .filter(c => selectedCommissionIds.includes(c.id))
      .reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);

    const outcome = await executeAction(
      `influencer_payout_${inf.id}`,
      () => markInfluencerPayoutPaid({
        commissionIds: selectedCommissionIds,
        payoutReference: payoutReference.trim(),
        notes: payoutNotes.trim() || null
      }),
      {
        label: 'Recording payout settlement...',
        successTitle: 'Payout recorded successfully',
        errorTitle: 'Payout failed',
        entityType: 'influencer',
        entityId: inf.instagram_handle,
        detail: `Creator: ${inf.name} • Settled: ₹${targetAmount.toLocaleString('en-IN')}`
      }
    );

    setIsProcessingPayout(false);

    if (outcome.success) {
      showToast('Payout Settled', `Marked ${selectedCommissionIds.length} commission(s) (₹${targetAmount.toLocaleString('en-IN')}) as PAID.`, 'success');
      setFeedbackMessage(`Marked ${selectedCommissionIds.length} commission(s) (₹${targetAmount.toLocaleString('en-IN')}) as PAID.`);
      setShowPayoutModal(false);
      setSelectedCommissionIds([]);
      setPayoutReference('');
      setPayoutNotes('');
      await loadDossier();
      if (onInfluencerUpdated) onInfluencerUpdated();
    } else {
      setErrorMessage(outcome.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs animate-fadeIn font-sans">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#141418] border border-[#242430] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#EDEDF0] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#121216] border-b border-[#22222C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1C1C24] border border-[#2A2A38] flex items-center justify-center text-white font-mono font-bold text-sm shadow-inner shrink-0">
              @{inf.instagram_handle?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  @{inf.instagram_handle}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                  inf.is_active 
                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' 
                    : 'bg-rose-950/50 text-rose-300 border-rose-800/60'
                }`}>
                  {inf.is_active ? 'Active Partner' : 'Account Paused'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#1A1A22] text-zinc-300 border border-[#2A2A36]">
                  {inf.collaboration_type}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-zinc-300 font-medium">{inf.name}</span>
                {inf.email && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span>{inf.email}</span>
                  </>
                )}
                {inf.phone && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="font-mono">{inf.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDossier}
              className="p-2 text-zinc-400 hover:text-white hover:bg-[#20202A] rounded-xl transition-colors cursor-pointer"
              title="Refresh Dossier"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-zinc-300' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-[#20202A] rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-zinc-300">
          {feedbackMessage && (
            <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 rounded-2xl flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 text-rose-300 rounded-2xl flex items-center gap-2.5 shadow-xs">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Performance KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-1.5 shadow-xs">
              <span className="text-zinc-400 block text-xs font-medium">Attributed Sales</span>
              <div className="text-xl font-bold text-white font-mono tracking-tight">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                {paidOrders.length} confirmed orders
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-1.5 shadow-xs">
              <span className="text-zinc-400 block text-xs font-medium">Total Earned</span>
              <div className="text-xl font-bold text-white font-mono tracking-tight">
                ₹{totalEarned.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                Lifetime Commissions
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-1.5 shadow-xs">
              <div className="text-zinc-400 text-xs font-medium flex items-center justify-between">
                <span className="text-zinc-300">Eligible For Payout</span>
                <span className="text-[10px] bg-[#1C1C24] text-sky-300 border border-[#2C2C38] px-2 py-0.5 rounded-md font-mono">{eligibleCommissions.length}</span>
              </div>
              <div className="text-xl font-bold text-sky-300 font-mono tracking-tight">
                ₹{totalEligible.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                Ready to settle
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-1.5 shadow-xs">
              <div className="text-zinc-400 text-xs font-medium flex items-center justify-between">
                <span className="text-zinc-300">Settled Payouts</span>
                <span className="text-[10px] bg-[#1C1C24] text-emerald-300 border border-[#2C2C38] px-2 py-0.5 rounded-md font-mono">{paidCommissions.length}</span>
              </div>
              <div className="text-xl font-bold text-[#EDEDF0] font-mono tracking-tight">
                ₹{totalPaid.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                Paid to bank / UPI
              </div>
            </div>
          </div>

          {/* Terms & Quick Payout Action Bar */}
          <div className="bg-[#111115] border border-[#22222C] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div>
                  <span className="text-zinc-500 block text-[10px] font-medium">Coupon Code:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-white bg-[#1A1A24] px-2.5 py-1 rounded-lg border border-[#2A2A38] text-xs">
                      {inf.coupon_code}
                    </span>
                    <button
                      onClick={handleCopyCoupon}
                      className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      title="Copy Coupon"
                    >
                      <Copy size={13} className={copiedCoupon ? 'text-emerald-400' : ''} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-l border-[#22222C] pl-4">
                <span className="text-zinc-500 block text-[10px] font-medium">Customer Discount:</span>
                <span className="font-semibold text-zinc-200 mt-0.5 block">{inf.customer_discount_value}{inf.customer_discount_type === 'percentage' ? '%' : '₹'} OFF</span>
              </div>

              <div className="border-l border-[#22222C] pl-4">
                <span className="text-zinc-500 block text-[10px] font-medium">Creator Commission:</span>
                <span className="font-semibold text-emerald-400 mt-0.5 block">{inf.commission_value}{inf.commission_type === 'percentage' ? '%' : '₹'}</span>
              </div>
            </div>

            {eligibleCommissions.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCommissionIds(eligibleCommissions.map(c => c.id));
                  setShowPayoutModal(true);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CreditCard size={14} />
                <span>Pay All Eligible (₹{totalEligible.toLocaleString('en-IN')})</span>
              </button>
            )}
          </div>

          {/* Commissions Ledger */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 font-semibold text-zinc-200 text-xs">
                <DollarSign size={14} className="text-zinc-400" />
                <span>Commissions Ledger ({commissions.length})</span>
              </div>

              {selectedCommissionIds.length > 0 && (
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard size={12} />
                  <span>Pay Selected ({selectedCommissionIds.length})</span>
                </button>
              )}
            </div>

            <div className="bg-[#111115] border border-[#22222C] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#16161D] text-zinc-400 font-semibold border-b border-[#22222C]">
                    <tr>
                      <th className="py-3 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={eligibleCommissions.length > 0 && selectedCommissionIds.length === eligibleCommissions.length}
                          onChange={handleSelectAllEligible}
                          disabled={eligibleCommissions.length === 0}
                          className="cursor-pointer accent-white"
                        />
                      </th>
                      <th className="py-3 px-3">Order #</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3 text-right">Base Subtotal</th>
                      <th className="py-3 px-3 text-right">Commission</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4">Payout Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1C24]">
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          No commissions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((comm) => {
                        const isEligible = comm.status === 'eligible';
                        const isSelected = selectedCommissionIds.includes(comm.id);

                        return (
                          <tr key={comm.id} className={`hover:bg-[#181820] transition-colors ${isSelected ? 'bg-[#1C1C24]' : ''}`}>
                            <td className="py-3 px-3 text-center">
                              {isEligible && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectCommission(comm.id)}
                                  className="cursor-pointer accent-white"
                                />
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-white">
                              {comm.order_number ? formatOrderNumber(comm.order_number) : (comm.order_id?.slice(0, 8) || '—')}
                            </td>
                            <td className="py-3 px-3 text-zinc-300">
                              {comm.customer_display_name || 'Customer'}
                            </td>
                            <td className="py-3 px-3 text-right text-zinc-400 font-mono">
                              ₹{Number(comm.commission_base_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-white font-mono">
                              ₹{Number(comm.commission_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold capitalize border inline-block ${
                                comm.status === 'paid' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' :
                                comm.status === 'eligible' ? 'bg-amber-950/50 text-amber-300 border-amber-800/60' :
                                'bg-[#181820] text-zinc-400 border-[#262634]'
                              }`}>
                                {comm.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                              {comm.payout_reference || (isEligible ? 'Ready for settlement' : '—')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-zinc-200 text-xs pb-1">
              <ShoppingBag size={14} className="text-zinc-400" />
              <span>Attributed Customer Orders ({orders.length})</span>
            </div>

            <div className="bg-[#111115] border border-[#22222C] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#16161D] text-zinc-400 font-semibold border-b border-[#22222C]">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-3 text-center">Payment</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1C24]">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No orders attributed yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#181820] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">{formatOrderNumber(ord.order_number)}</td>
                          <td className="py-3 px-4 text-zinc-300 font-medium">{ord.customer_name}</td>
                          <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">{new Date(ord.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="py-3 px-4 text-right font-bold text-white font-mono">₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
                              ord.payment_status === 'paid' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' : 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                            }`}>
                              {ord.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center capitalize text-zinc-300 font-medium">{ord.order_status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Confirmation Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn font-sans">
          <div 
            className="bg-[#141418] border border-[#262634] w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 text-xs text-[#EDEDF0]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#22222C] pb-3.5">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <CreditCard size={16} className="text-emerald-400" />
                <span>Record Payout Settlement</span>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#111115] p-4 rounded-2xl border border-[#22222C] space-y-2">
              <div className="flex justify-between text-zinc-400 text-xs">
                <span>Creator:</span>
                <span className="font-semibold text-white">@{inf.instagram_handle} ({inf.name})</span>
              </div>
              <div className="flex justify-between text-zinc-400 text-xs">
                <span>Selected Commissions:</span>
                <span className="font-semibold text-white">{selectedCommissionIds.length} item(s)</span>
              </div>
              <div className="border-t border-[#1C1C24] pt-2 flex justify-between font-bold text-emerald-400 text-sm">
                <span>Total Payout Amount:</span>
                <span className="font-mono text-base">
                  ₹{commissions
                    .filter(c => selectedCommissionIds.includes(c.id))
                    .reduce((s, c) => s + Number(c.commission_amount || 0), 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayout} className="space-y-3.5">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Transaction Reference (UPI / Bank UTR) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/20260927/98765432 or ICICI UTR..."
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  required
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none font-mono text-xs focus:border-emerald-500 placeholder-zinc-600 shadow-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1.5 text-xs">
                  Remarks / Settlement Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Settled via ICICI Bank Studio Account"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-white px-3.5 py-2.5 rounded-xl outline-none text-xs focus:border-emerald-500 placeholder-zinc-600 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#22222C]">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 bg-[#1C1C24] text-zinc-300 border border-[#2C2C38] hover:bg-[#252530] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayout}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  {isProcessingPayout ? <RefreshCw size={13} className="animate-spin" /> : null}
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

