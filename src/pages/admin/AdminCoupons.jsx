import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminCoupons } from '../../services/adminService';
import { CouponModal } from './CouponModal';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  Tag, 
  Plus, 
  RefreshCw, 
  Edit3, 
  Database,
  Ticket,
  Copy,
  ChevronRight
} from 'lucide-react';

export const AdminCoupons = () => {
  const { showToast } = useAdminFeedback();
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedCouponForEdit, setSelectedCouponForEdit] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminCoupons();
      setIsOffline(Boolean(res.isOffline));
      setCoupons(res.coupons || []);
    } catch (err) {
      console.error('[AdminCoupons] Error loading coupons:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCouponSaved = (savedCoupon) => {
    if (!savedCoupon) return;
    setCoupons(prev => {
      const idx = prev.findIndex(c => c.id === savedCoupon.id || c.code === savedCoupon.code);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = savedCoupon;
        return next;
      } else {
        return [savedCoupon, ...prev];
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#EDEDF0] tracking-tight">Coupons & Promotions</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#18181F] text-zinc-300 border border-[#2A2A36] text-[11px] font-mono font-medium">
              {coupons.length} Configured
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure discount codes, percentage / fixed promotions, minimum cart sizes, and usage caps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCoupons}
            className="px-3 py-1.5 bg-[#16161A] hover:bg-[#202028] text-zinc-300 border border-[#262630] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-xs text-amber-300 flex items-center gap-2.5 shadow-xs">
          <Database size={16} className="shrink-0 text-amber-400" />
          <span>Database offline: Coupon management requires active Supabase connection.</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-[#16161A] border border-[#24242E] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#121216] text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-semibold border-b border-[#24242E]">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-3">Min Order</th>
                <th className="py-3 px-3">Max Cap</th>
                <th className="py-3 px-3 text-center">Usage</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202028]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Loading promotions...</span>
                    </div>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500">
                    <Ticket size={24} className="mx-auto mb-2 text-zinc-600" />
                    <p className="font-semibold text-zinc-300 text-sm">No Coupons Configured</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Click "Create Coupon" to add a new promo code.</p>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                  const isLimitReached = c.usage_limit && c.times_used >= c.usage_limit;

                  return (
                    <tr key={c.id || c.code} className="hover:bg-[#1A1A22] transition-colors">
                      <td className="py-3.5 px-4">
                        <div 
                          onClick={() => {
                            navigator.clipboard?.writeText(c.code);
                            showToast('Copied Code', c.code, 'info');
                          }}
                          className="font-bold text-white hover:text-emerald-300 font-mono text-xs bg-[#111115] hover:bg-[#1A1A22] px-2.5 py-1 rounded-md border border-[#24242E] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Click to copy coupon code"
                        >
                          <Tag size={10} className="text-zinc-500" />
                          <span>{c.code}</span>
                        </div>
                        {c.description && (
                          <div className="text-[11px] text-zinc-400 mt-1">{c.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-200">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-300 font-mono">
                        {c.min_order_amount > 0 ? `₹${c.min_order_amount}` : 'None'}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-300 font-mono">
                        {c.max_discount_amount ? `₹${c.max_discount_amount}` : 'None'}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="text-[#EDEDF0] font-bold">{c.times_used || 0}</span>
                        <span className="text-zinc-500"> / {c.usage_limit || '∞'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.is_active && !isExpired && !isLimitReached ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>{isExpired ? 'Expired' : isLimitReached ? 'Limit Met' : 'Disabled'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono text-[11px]">
                        {c.expires_at ? (
                          <span>Exp: {new Date(c.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        ) : (
                          <span className="text-zinc-500">Never</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedCouponForEdit(c)}
                          className="px-2.5 py-1 text-zinc-400 hover:text-white hover:bg-[#1E1E26] rounded-lg transition-all text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coupon Modal */}
      {(isCreatingNew || selectedCouponForEdit) && (
        <CouponModal
          coupon={selectedCouponForEdit}
          onClose={() => {
            setIsCreatingNew(false);
            setSelectedCouponForEdit(null);
          }}
          onCouponSaved={handleCouponSaved}
        />
      )}
    </div>
  );
};
