import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminInfluencers, toggleAdminInfluencerStatus } from '../../services/influencerService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { InfluencerCreateModal } from './InfluencerCreateModal';
import { InfluencerEditModal } from './InfluencerEditModal';
import { AdminInfluencerDossierModal } from './AdminInfluencerDossierModal';
import { 
  Users, 
  Search, 
  Plus, 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  Edit2, 
  Eye, 
  CheckCircle2, 
  Database 
} from 'lucide-react';

export const AdminInfluencers = () => {
  const { executeAction } = useAdminFeedback();
  const [influencers, setInfluencers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collabTypeFilter, setCollabTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState(null);
  const [dossierInfluencer, setDossierInfluencer] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminInfluencers();
      setIsOffline(Boolean(res.isOffline));
      setInfluencers(res.influencers || []);
      setTotalCount(res.total_influencers || (res.influencers || []).length);
      setActiveCount(res.active_influencers || (res.influencers || []).filter(i => i.is_active).length);
    } catch (err) {
      console.error('[AdminInfluencers] Error loading influencers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActive = async (e, inf) => {
    e.stopPropagation();
    const newActiveState = !inf.is_active;

    await executeAction(
      `influencer_toggle_${inf.id}`,
      async () => {
        const res = await toggleAdminInfluencerStatus(inf.id, newActiveState);
        if (!res.success) {
          throw new Error(res.error || 'Failed to toggle status.');
        }
        await loadData();
        return res;
      },
      {
        label: newActiveState ? 'Activating creator...' : 'Pausing creator...',
        successTitle: newActiveState ? `@${inf.instagram_handle} activated` : `@${inf.instagram_handle} paused`,
        errorTitle: 'Status toggle failed',
        entityType: 'influencer',
        entityId: inf.instagram_handle,
        detail: `Creator: ${inf.name} • Status: ${newActiveState ? 'Active' : 'Paused'}`
      }
    );
  };

  const filteredInfluencers = influencers.filter((inf) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (inf.name || '').toLowerCase().includes(q) ||
      (inf.instagram_handle || '').toLowerCase().includes(q) ||
      (inf.coupon_code || '').toLowerCase().includes(q) ||
      (inf.email || '').toLowerCase().includes(q);

    const matchesCollab = collabTypeFilter === 'all' || inf.collaboration_type === collabTypeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && inf.is_active) ||
      (statusFilter === 'inactive' && !inf.is_active);

    return matchesSearch && matchesCollab && matchesStatus;
  });

  const totalAttributedSales = influencers.reduce((s, i) => s + (Number(i.metrics?.revenue_generated) || 0), 0);
  const totalEligiblePayouts = influencers.reduce((s, i) => s + (Number(i.metrics?.eligible_commissions) || 0), 0);
  const totalSettledPayouts = influencers.reduce((s, i) => s + (Number(i.metrics?.paid_commissions) || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#EDEDF0] tracking-tight">Influencer Partners</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#18181F] text-zinc-300 border border-[#2A2A36] text-[11px] font-mono font-medium">
              {totalCount} Enrolled
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Creator affiliate promo codes, referral commission tracking, and payout settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-[#16161A] hover:bg-[#202028] text-zinc-300 border border-[#262630] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Influencer</span>
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-xs text-amber-300 flex items-center gap-2.5 shadow-xs">
          <Database size={16} className="shrink-0 text-amber-400" />
          <span>Database offline: Influencer sync requires Supabase connection.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="font-medium text-zinc-300">Enrolled Creators</span>
            <Users size={15} className="text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">
            {isLoading ? '...' : totalCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
            <span className="text-zinc-300">{activeCount} Active</span> · {totalCount - activeCount} Paused
          </div>
        </div>

        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="font-medium text-zinc-300">Attributed Sales</span>
            <TrendingUp size={15} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">
            {isLoading ? '...' : `₹${totalAttributedSales.toLocaleString('en-IN')}`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5">
            Sales driven across drops
          </div>
        </div>

        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="font-medium text-zinc-300">Eligible Payouts</span>
            <DollarSign size={15} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-300 tracking-tight font-mono">
            {isLoading ? '...' : `₹${totalEligiblePayouts.toLocaleString('en-IN')}`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5">
            Unsettled creator commissions
          </div>
        </div>

        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="font-medium text-zinc-300">Settled Payouts</span>
            <CheckCircle2 size={15} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">
            {isLoading ? '...' : `₹${totalSettledPayouts.toLocaleString('en-IN')}`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5">
            Transferred to Bank / UPI
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by creator name, @handle, coupon code, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#16161A] border border-[#24242E] focus:border-zinc-500 text-zinc-100 pl-9 pr-4 py-2 text-xs rounded-xl outline-none transition-colors placeholder-zinc-600 shadow-xs"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={collabTypeFilter}
            onChange={(e) => setCollabTypeFilter(e.target.value)}
            className="w-full bg-[#16161A] border border-[#24242E] focus:border-zinc-500 text-zinc-200 px-3 py-2 text-xs rounded-xl outline-none cursor-pointer shadow-xs"
          >
            <option value="all">All Collaboration Types</option>
            <option value="barter">Barter (Product Gifting)</option>
            <option value="paid">Paid Partnerships</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#16161A] border border-[#24242E] focus:border-zinc-500 text-zinc-200 px-3 py-2 text-xs rounded-xl outline-none cursor-pointer shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Paused Accounts</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {/* Table */}
      <div className="bg-[#141418] border border-[#22222C] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0E0E12] text-zinc-500 font-mono border-b border-[#202028] uppercase text-[10px] tracking-widest">
              <tr>
                <th className="py-3 px-4 font-normal">Creator / Handle</th>
                <th className="py-3 px-3 font-normal">Type</th>
                <th className="py-3 px-3 font-normal">Coupon Code</th>
                <th className="py-3 px-3 text-center font-normal">Discount / Comm.</th>
                <th className="py-3 px-4 text-right font-normal">Orders / Sales</th>
                <th className="py-3 px-4 text-right font-normal">Commissions</th>
                <th className="py-3 px-3 text-center font-normal">Status</th>
                <th className="py-3 px-4 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202028]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Loading influencer directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInfluencers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500">
                    <p className="font-semibold text-zinc-300 text-sm">No Creators Found</p>
                    <p className="text-xs text-zinc-500 mt-0.5">No creators match your search query or filter.</p>
                  </td>
                </tr>
              ) : (
                filteredInfluencers.map((inf) => {
                  const m = inf.metrics || {};

                  return (
                    <tr 
                      key={inf.id}
                      className="hover:bg-[#1A1A22] transition-colors cursor-pointer"
                      onClick={() => setDossierInfluencer(inf)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1C1C24] border border-[#2A2A36] flex items-center justify-center font-mono font-bold text-xs text-zinc-200 shrink-0">
                            @{inf.instagram_handle?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#EDEDF0]">
                              @{inf.instagram_handle}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {inf.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs text-zinc-300 capitalize">
                          {inf.collaboration_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-white bg-[#111115] px-2 py-0.5 rounded-md border border-[#24242E] text-xs">
                          {inf.coupon_code}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <div className="text-zinc-200 font-medium">
                          {inf.customer_discount_value}{inf.customer_discount_type === 'percentage' ? '%' : '₹'} Disc
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {inf.commission_value}{inf.commission_type === 'percentage' ? '%' : '₹'} Comm
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="text-[#EDEDF0] font-bold font-mono">
                          ₹{(m.revenue_generated || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {m.paid_orders || 0} Orders
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="text-[#EDEDF0] font-bold font-mono">
                          ₹{(m.total_commissions_earned || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px]">
                          {m.eligible_commissions > 0 ? (
                            <span className="text-amber-400 font-medium font-mono">₹{m.eligible_commissions} Eligible</span>
                          ) : (
                            <span className="text-emerald-400 font-mono">₹{m.paid_commissions || 0} Paid</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleActive(e, inf)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-mono transition-colors cursor-pointer"
                        >
                          {inf.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-zinc-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-zinc-500">
                              <span className="w-1.5 h-1.5 rounded-full border border-zinc-600 bg-transparent" />
                              <span>Disabled</span>
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDossierInfluencer(inf)}
                            className="px-2.5 py-1 bg-[#1C1C24] hover:bg-[#252532] text-zinc-200 border border-[#2C2C38] hover:border-[#3D3D4E] rounded-xl transition-all text-xs font-medium inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Dossier</span>
                          </button>

                          <button
                            onClick={() => setEditingInfluencer(inf)}
                            className="p-1.5 bg-[#1C1C24] hover:bg-[#282834] text-zinc-400 hover:text-[#EDEDF0] border border-[#2C2C38] rounded-xl transition-colors cursor-pointer"
                            title="Edit Influencer"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <InfluencerCreateModal
          onClose={() => setShowCreateModal(false)}
          onInfluencerCreated={loadData}
        />
      )}

      {editingInfluencer && (
        <InfluencerEditModal
          influencer={editingInfluencer}
          onClose={() => setEditingInfluencer(null)}
          onInfluencerUpdated={loadData}
        />
      )}

      {dossierInfluencer && (
        <AdminInfluencerDossierModal
          influencer={dossierInfluencer}
          onClose={() => setDossierInfluencer(null)}
          onInfluencerUpdated={loadData}
        />
      )}
    </div>
  );
};
