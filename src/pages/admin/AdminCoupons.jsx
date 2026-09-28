import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminCoupons } from '../../services/adminService';
import { CouponModal } from './CouponModal';
import { 
  Tag, 
  Plus, 
  RefreshCw, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Database,
  Calendar,
  Percent,
  Ticket
} from 'lucide-react';

export const AdminCoupons = () => {
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
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Promotions & Coupons
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Create discount codes, set percentage or fixed discounts, and configure usage caps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCoupons}
            className="px-3.5 py-2 bg-[#141414] hover:bg-[#1f1f1f] text-zinc-300 hover:text-white border border-[#262626] text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-3">
          <Database size={16} className="shrink-0 text-amber-400" />
          <span>Database offline: Promo code management requires an active Supabase connection.</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#161616] text-zinc-400 text-[11px] font-medium border-b border-[#222222]">
              <tr>
                <th className="py-3.5 px-5">Coupon Code</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Min Order</th>
                <th className="py-3.5 px-4">Max Cap</th>
                <th className="py-3.5 px-4 text-center">Usage</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Loading active promotions...</span>
                    </div>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500">
                    <div className="space-y-1.5">
                      <Ticket size={24} className="mx-auto mb-2 text-zinc-600" />
                      <p className="font-semibold text-zinc-300">No coupons configured</p>
                      <p className="text-[11px] text-zinc-500">Click "Create Coupon" to add a new promotion.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                  const isLimitReached = c.usage_limit && c.times_used >= c.usage_limit;

                  return (
                    <tr key={c.id || c.code} className="hover:bg-[#181818] transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-white tracking-wider text-xs">
                          {c.code}
                        </div>
                        {c.description && (
                          <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{c.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-white">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                      </td>
                      <td className="py-4 px-4 text-zinc-300">
                        {c.min_order_amount > 0 ? `₹${c.min_order_amount}` : 'None'}
                      </td>
                      <td className="py-4 px-4 text-zinc-300">
                        {c.max_discount_amount ? `₹${c.max_discount_amount}` : 'None'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-white font-medium">{c.times_used || 0}</span>
                        <span className="text-zinc-500"> / {c.usage_limit || '∞'}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {c.is_active && !isExpired && !isLimitReached ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                            {isExpired ? 'Expired' : isLimitReached ? 'Limit Met' : 'Disabled'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-zinc-400">
                        {c.expires_at ? (
                          <span className="text-[11px]">Exp: {new Date(c.expires_at).toLocaleDateString('en-IN')}</span>
                        ) : (
                          <span className="text-zinc-500">Permanent</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedCouponForEdit(c)}
                          className="px-3 py-1.5 bg-[#1c1c1c] hover:bg-white hover:text-black text-zinc-200 border border-[#2d2d2d] rounded-lg transition-colors text-xs font-medium inline-flex items-center gap-1.5"
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

      {/* Coupon Modal (Create / Edit) */}
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
