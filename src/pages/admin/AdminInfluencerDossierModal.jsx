import React, { useState, useEffect } from 'react';
import { fetchInfluencerDossier, markInfluencerPayoutPaid } from '../../services/influencerService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Sparkles, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  Tag, 
  ExternalLink, 
  ShieldCheck,
  CreditCard,
  Layers,
  Database,
  ArrowRight
} from 'lucide-react';

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

  const loadDossier = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchInfluencerDossier(influencer.id);
      if (res.success) {
        setDossierData(res);
      } else {
        throw new Error(res.error || 'Failed to load influencer dossier.');
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
  const pendingCommissions = commissions.filter(c => c.status === 'pending');
  const reversedCommissions = commissions.filter(c => c.status === 'reversed' || c.status === 'cancelled');

  const totalEarned = commissions.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
  const totalEligible = eligibleCommissions.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
  const totalPaid = paidCommissions.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
  const totalPending = pendingCommissions.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
  const totalReversed = reversedCommissions.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);

  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);

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

  const { executeAction } = useAdminFeedback();
  const [lastDuration, setLastDuration] = useState(null);

  const handleConfirmPayout = async (e) => {
    e.preventDefault();
    if (selectedCommissionIds.length === 0) return;
    if (!payoutReference.trim()) {
      setErrorMessage('Payout reference (e.g. Bank/UPI transaction ID) is required.');
      return;
    }

    setErrorMessage(null);
    setFeedbackMessage(null);
    setLastDuration(null);
    setIsProcessingPayout(true);

    const targetAmount = eligibleCommissions
      .filter(c => selectedCommissionIds.includes(c.id))
      .reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);

    const detailString = `Creator: ${inf.name} (@${inf.instagram_handle}) • Count: ${selectedCommissionIds.length} orders • Settled: ₹${targetAmount.toLocaleString('en-IN')} • Ref: ${payoutReference.trim()}`;

    const outcome = await executeAction(
      `influencer_payout_${inf.id}`,
      () => markInfluencerPayoutPaid({
        commissionIds: selectedCommissionIds,
        payoutReference: payoutReference.trim(),
        notes: payoutNotes.trim() || null
      }),
      {
        label: 'Recording commission payout settlement...',
        successTitle: 'Commission marked as paid',
        errorTitle: 'Commission payout failed',
        entityType: 'influencer',
        entityId: inf.instagram_handle,
        detail: detailString
      }
    );

    setIsProcessingPayout(false);

    if (outcome.success) {
      setFeedbackMessage(`Successfully marked ${outcome.data?.marked_paid_count || selectedCommissionIds.length} commission(s) (₹${outcome.data?.total_paid_amount?.toLocaleString('en-IN') || targetAmount}) as PAID.`);
      setLastDuration(outcome.duration);
      setShowPayoutModal(false);
      setSelectedCommissionIds([]);
      setPayoutReference('');
      setPayoutNotes('');
      await loadDossier();
      if (onInfluencerUpdated) onInfluencerUpdated();
    } else {
      setErrorMessage(outcome.error);
      setLastDuration(outcome.duration);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn font-sans">
      <div 
        className="bg-[#121212] border border-[#242424] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#161616] border-b border-[#222222] p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-mono font-bold text-sm">
              @{inf.instagram_handle?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  @{inf.instagram_handle}
                </h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium capitalize border ${
                  inf.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {inf.is_active ? 'Active Partner' : 'Inactive'}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium uppercase bg-[#202020] text-zinc-300 border border-[#282828]">
                  {inf.collaboration_type}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {inf.name} {inf.email ? `• ${inf.email}` : ''} {inf.phone ? `• ${inf.phone}` : ''}
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">

          {/* Feedback & Error Alerts */}
          {feedbackMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Key Partner Performance Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#161616] border border-[#222222] p-4 rounded-xl space-y-1">
              <div className="text-xs text-zinc-400 font-medium">Attributed Sales</div>
              <div className="text-xl font-bold text-white tracking-tight">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                {paidOrders.length} Paid / {orders.length} Total Orders
              </div>
            </div>

            <div className="bg-[#161616] border border-[#222222] p-4 rounded-xl space-y-1">
              <div className="text-xs text-zinc-400 font-medium">Total Earned</div>
              <div className="text-xl font-bold text-white tracking-tight">
                ₹{totalEarned.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                Lifetime Creator Commissions
              </div>
            </div>

            <div className="bg-[#161616] border border-[#222222] p-4 rounded-xl space-y-1">
              <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
                <span>Eligible For Payout</span>
                <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{eligibleCommissions.length}</span>
              </div>
              <div className="text-xl font-bold text-amber-300 tracking-tight">
                ₹{totalEligible.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                Confirmed & Unpaid
              </div>
            </div>

            <div className="bg-[#161616] border border-[#222222] p-4 rounded-xl space-y-1">
              <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
                <span>Settled / Paid</span>
                <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{paidCommissions.length}</span>
              </div>
              <div className="text-xl font-bold text-emerald-300 tracking-tight">
                ₹{totalPaid.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                Successfully Transferred
              </div>
            </div>
          </div>

          {/* Partner Terms Banner */}
          <div className="bg-[#161616] border border-[#242424] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-zinc-500 block text-[11px]">Coupon Code:</span>
                <span className="font-mono font-bold text-white text-sm">{inf.coupon_code}</span>
              </div>
              <div className="border-l border-[#282828] pl-4">
                <span className="text-zinc-500 block text-[11px]">Customer Discount:</span>
                <span className="text-zinc-200 font-semibold">{inf.customer_discount_value}{inf.customer_discount_type === 'percentage' ? '%' : '₹'} OFF</span>
              </div>
              <div className="border-l border-[#282828] pl-4">
                <span className="text-zinc-500 block text-[11px]">Commission Rate:</span>
                <span className="text-emerald-400 font-semibold">{inf.commission_value}{inf.commission_type === 'percentage' ? '%' : '₹ Fixed'}</span>
              </div>
            </div>

            {eligibleCommissions.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCommissionIds(eligibleCommissions.map(c => c.id));
                  setShowPayoutModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CreditCard size={13} />
                <span>Pay Eligible (₹{totalEligible.toLocaleString('en-IN')})</span>
              </button>
            )}
          </div>

          {/* Section: Commission Ledger & Payout Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-2">
              <div className="flex items-center gap-2">
                <DollarSign size={15} className="text-zinc-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Commission Ledger & Payout Status ({commissions.length})
                </h3>
              </div>

              {selectedCommissionIds.length > 0 && (
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="px-3 py-1 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-md transition-colors"
                >
                  Mark Selected ({selectedCommissionIds.length}) as Paid
                </button>
              )}
            </div>

            <div className="bg-[#161616] border border-[#222222] rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1a1a1a] text-zinc-400 text-[11px] font-medium border-b border-[#222222]">
                  <tr>
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={eligibleCommissions.length > 0 && selectedCommissionIds.length === eligibleCommissions.length}
                        onChange={handleSelectAllEligible}
                        disabled={eligibleCommissions.length === 0}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Order #</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3 text-right">Commission Base</th>
                    <th className="py-3 px-3 text-right">Commission (₹)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Payout Reference / Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Loading commission records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : commissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500 italic">
                        No orders or commissions generated for this creator yet.
                      </td>
                    </tr>
                  ) : (
                    commissions.map((comm) => {
                      const isEligible = comm.status === 'eligible';
                      const isSelected = selectedCommissionIds.includes(comm.id);

                      return (
                        <tr key={comm.id} className={`hover:bg-[#1a1a1a]/50 ${isSelected ? 'bg-emerald-500/5' : ''}`}>
                          <td className="py-3 px-3 text-center">
                            {isEligible && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectCommission(comm.id)}
                                className="cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-white">
                            {comm.order_number || comm.order_id?.slice(0, 8)}
                          </td>
                          <td className="py-3 px-3 text-zinc-300">
                            {comm.customer_display_name || 'Customer'}
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-400">
                            ₹{Number(comm.commission_base_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-white">
                            ₹{Number(comm.commission_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize border ${
                              comm.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              comm.status === 'eligible' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              comm.status === 'pending' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {comm.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            {comm.payout_reference ? (
                              <div>
                                <span className="text-white font-mono">{comm.payout_reference}</span>
                                {comm.paid_at && <span className="block text-zinc-500">{new Date(comm.paid_at).toLocaleDateString('en-IN')}</span>}
                              </div>
                            ) : isEligible ? (
                              <span className="text-amber-400">Ready for payout</span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Attributed Orders Ledger */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#222222] pb-2">
              <ShoppingBag size={15} className="text-zinc-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Attributed Orders Ledger ({orders.length})
              </h3>
            </div>

            <div className="bg-[#161616] border border-[#222222] rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1a1a1a] text-zinc-400 text-[11px] font-medium border-b border-[#222222]">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Order Total</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4 text-center">Order Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-500 italic">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#1a1a1a]/50">
                        <td className="py-3 px-4 font-mono font-medium text-white">
                          {ord.order_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-medium">{ord.customer_name}</div>
                          <div className="text-[11px] text-zinc-500">{ord.customer_email}</div>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {new Date(ord.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-white">
                          ₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize border ${
                            ord.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {ord.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] bg-[#202020] text-zinc-300 px-2 py-0.5 rounded-full font-medium capitalize border border-[#282828]">
                            {ord.order_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Nested Modal: Payout Confirmation */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#141414] border border-[#2a2a2a] w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Confirm Creator Payout
                </h3>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#262626] text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Creator Partner:</span>
                <span className="text-white font-semibold">@{inf.instagram_handle} ({inf.name})</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Selected Commissions:</span>
                <span className="text-white font-semibold">{selectedCommissionIds.length} commission(s)</span>
              </div>
              <div className="border-t border-[#262626] pt-1.5 flex justify-between text-emerald-400 font-bold text-sm">
                <span>Total Payout Amount:</span>
                <span>
                  ₹{commissions
                    .filter(c => selectedCommissionIds.includes(c.id))
                    .reduce((s, c) => s + Number(c.commission_amount || 0), 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayout} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-medium">
                  Payout Transaction Reference <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/20260927/98765432 or IMPS-298374"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  required
                  className="w-full bg-[#1c1c1c] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg outline-none font-mono text-xs placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">
                  Settlement Remarks / Bank Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Settled via ICICI Netbanking"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg outline-none placeholder-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 bg-[#1c1c1c] hover:bg-[#262626] text-zinc-400 hover:text-white rounded-lg transition-colors border border-[#282828]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayout}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isProcessingPayout ? <RefreshCw size={13} className="animate-spin text-black" /> : <CheckCircle2 size={13} />}
                  <span>{isProcessingPayout ? 'Processing...' : 'Mark as Paid'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
