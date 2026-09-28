import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminInfluencers, toggleAdminInfluencerStatus } from '../../services/influencerService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { InfluencerCreateModal } from './InfluencerCreateModal';
import { InfluencerEditModal } from './InfluencerEditModal';
import { AdminInfluencerDossierModal } from './AdminInfluencerDossierModal';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Sparkles, 
  DollarSign, 
  Tag, 
  TrendingUp, 
  Gift, 
  ExternalLink, 
  MoreVertical,
  Edit2,
  Eye,
  CheckCircle2,
  XCircle,
  Database,
  ArrowUpRight
} from 'lucide-react';

export const AdminInfluencers = () => {
  const { executeAction } = useAdminFeedback();
  const [influencers, setInfluencers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collabTypeFilter, setCollabTypeFilter] = useState('all'); // 'all' | 'barter' | 'paid'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modal States
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
        successTitle: newActiveState ? `Influencer @${inf.instagram_handle} activated` : `Influencer @${inf.instagram_handle} paused`,
        errorTitle: 'Status toggle failed',
        entityType: 'influencer',
        entityId: inf.instagram_handle,
        detail: `Creator: ${inf.name} • Status: ${newActiveState ? 'Active' : 'Paused'}`
      }
    );
  };

  // Filtered List
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

  // KPI Calculations across loaded creators
  const totalAttributedSales = influencers.reduce((s, i) => s + (Number(i.metrics?.revenue_generated) || 0), 0);
  const totalEarnedCommissions = influencers.reduce((s, i) => s + (Number(i.metrics?.total_commissions_earned) || 0), 0);
  const totalEligiblePayouts = influencers.reduce((s, i) => s + (Number(i.metrics?.eligible_commissions) || 0), 0);
  const totalSettledPayouts = influencers.reduce((s, i) => s + (Number(i.metrics?.paid_commissions) || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Influencer & Creator Affiliates
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage creator promo codes, commission ledgers, barter seeding, and payout settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-[#141414] hover:bg-[#1f1f1f] text-zinc-300 hover:text-white border border-[#262626] text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} className="text-black" />
            <span>Add Influencer</span>
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-3">
          <Database size={16} className="shrink-0 text-amber-400" />
          <span>Local Development Mode: Live sync requires connected Supabase credentials.</span>
        </div>
      )}

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1.5">
            <span>Creators Enrolled</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Users size={14} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? '...' : totalCount}
          </div>
          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">● {activeCount} Active</span>
            <span>partners</span>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1.5">
            <span>Attributed Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? '...' : `₹${totalAttributedSales.toLocaleString('en-IN')}`}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Merchandise revenue generated
          </div>
        </div>

        <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1.5">
            <span>Eligible Payouts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight">
            {isLoading ? '...' : `₹${totalEligiblePayouts.toLocaleString('en-IN')}`}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Unpaid creator earnings
          </div>
        </div>

        <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1.5">
            <span>Settled Payouts</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {isLoading ? '...' : `₹${totalSettledPayouts.toLocaleString('en-IN')}`}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Transferred via UPI/Bank
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by creator name, @handle, coupon code, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white pl-10 pr-4 py-2.5 text-xs rounded-xl outline-none placeholder-zinc-500"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={collabTypeFilter}
            onChange={(e) => setCollabTypeFilter(e.target.value)}
            className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white px-3.5 py-2.5 text-xs rounded-xl outline-none cursor-pointer"
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
            className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white px-3.5 py-2.5 text-xs rounded-xl outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Disabled</option>
          </select>
        </div>
      </div>

      {/* Influencers Table */}
      <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#161616] text-zinc-400 text-[11px] font-medium border-b border-[#222222]">
              <tr>
                <th className="py-3.5 px-5">Creator / Handle</th>
                <th className="py-3.5 px-4">Collab Type</th>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4 text-center">Discount / Comm.</th>
                <th className="py-3.5 px-4 text-right">Orders / Sales</th>
                <th className="py-3.5 px-4 text-right">Commissions</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Loading influencer affiliates...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInfluencers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500">
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-400">No Influencers Found</p>
                      <p className="text-xs">No creator partners match your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInfluencers.map((inf) => {
                  const m = inf.metrics || {};
                  const isBarter = inf.collaboration_type === 'barter';

                  return (
                    <tr 
                      key={inf.id}
                      className="hover:bg-[#181818] transition-colors cursor-pointer"
                      onClick={() => setDossierInfluencer(inf)}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#202020] border border-[#2a2a2a] flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                            @{inf.instagram_handle?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white hover:text-zinc-200">
                              @{inf.instagram_handle}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {inf.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium uppercase border ${
                          isBarter ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        }`}>
                          {inf.collaboration_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-white bg-[#1a1a1a] px-2 py-1 rounded border border-[#282828] text-xs">
                          {inf.coupon_code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="text-zinc-200 font-medium">
                          {inf.customer_discount_value}{inf.customer_discount_type === 'percentage' ? '%' : '₹'} Disc.
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold">
                          {inf.commission_value}{inf.commission_type === 'percentage' ? '%' : '₹'} Comm.
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="text-white font-semibold">
                          ₹{(m.revenue_generated || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {m.paid_orders || 0} Paid ({m.total_orders || 0} Total)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="text-white font-semibold">
                          ₹{(m.total_commissions_earned || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {m.eligible_commissions > 0 ? (
                            <span className="text-amber-400 font-medium">₹{m.eligible_commissions} Eligible</span>
                          ) : (
                            <span className="text-emerald-400">₹{m.paid_commissions || 0} Paid</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleActive(e, inf)}
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium capitalize border transition-colors ${
                            inf.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          {inf.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDossierInfluencer(inf)}
                            className="px-2.5 py-1 bg-[#1c1c1c] hover:bg-white hover:text-black border border-[#2d2d2d] rounded-lg transition-colors text-xs font-medium inline-flex items-center gap-1"
                            title="View Creator Performance Dossier & Manage Payouts"
                          >
                            <Eye size={12} />
                            <span>Dossier</span>
                          </button>

                          <button
                            onClick={() => setEditingInfluencer(inf)}
                            className="p-1.5 bg-[#1c1c1c] hover:bg-[#262626] text-zinc-400 hover:text-white border border-[#2d2d2d] rounded-lg transition-colors"
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

        {/* Footer Summary */}
        <div className="bg-[#161616] border-t border-[#202020] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div>
            Showing <span className="text-white font-semibold">{filteredInfluencers.length}</span> of <span className="text-white font-semibold">{totalCount}</span> total creator partners
          </div>

          <div className="text-[11px] text-zinc-500">
            Click on any creator row to inspect attributed orders, line items, and issue payouts.
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <InfluencerCreateModal
          onClose={() => setShowCreateModal(false)}
          onInfluencerCreated={() => {
            loadData();
          }}
        />
      )}

      {editingInfluencer && (
        <InfluencerEditModal
          influencer={editingInfluencer}
          onClose={() => setEditingInfluencer(null)}
          onInfluencerUpdated={() => {
            loadData();
          }}
        />
      )}

      {dossierInfluencer && (
        <AdminInfluencerDossierModal
          influencer={dossierInfluencer}
          onClose={() => setDossierInfluencer(null)}
          onInfluencerUpdated={() => {
            loadData();
          }}
        />
      )}

    </div>
  );
};
