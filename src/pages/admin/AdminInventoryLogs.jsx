import React, { useState, useEffect, useCallback } from 'react';
import { fetchInventoryLogs } from '../../services/adminService';
import { 
  FileText, 
  RefreshCw, 
  Database, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter,
  CheckCircle2,
  Clock,
  History
} from 'lucide-react';

export const AdminInventoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [changeTypeFilter, setChangeTypeFilter] = useState('ALL');

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchInventoryLogs({ limit: 60 });
      setIsOffline(Boolean(res.isOffline));
      setLogs(res.logs || []);
    } catch (err) {
      console.error('[AdminInventoryLogs] Error loading inventory logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter(log => {
    if (changeTypeFilter !== 'ALL' && log.change_type !== changeTypeFilter) {
      return false;
    }
    return true;
  });

  const getChangeTypeBadge = (type) => {
    switch (type) {
      case 'restock':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">Restock</span>;
      case 'order_placed':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">Order Placed</span>;
      case 'order_cancelled':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">Order Cancelled</span>;
      case 'manual_adjustment':
      default:
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">Manual Adj</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Inventory Audit Logs
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Immutable chronological ledger of stock movements, orders, manual adjustments, and restocks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="px-3.5 py-2 bg-[#141414] hover:bg-[#1f1f1f] text-zinc-300 hover:text-white border border-[#262626] text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-3">
          <Database size={16} className="shrink-0 text-amber-400" />
          <span>Database offline: Inventory audit logs require an active Supabase connection.</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Filter size={14} className="text-zinc-400" />
          <span className="text-zinc-400 font-medium">Event Filter:</span>
          <select
            value={changeTypeFilter}
            onChange={(e) => setChangeTypeFilter(e.target.value)}
            className="bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white px-3 py-1.5 rounded-lg outline-none text-xs"
          >
            <option value="ALL">All Events</option>
            <option value="restock">Restock</option>
            <option value="order_placed">Order Placed</option>
            <option value="order_cancelled">Order Cancelled</option>
            <option value="manual_adjustment">Manual Adjustment</option>
          </select>
        </div>

        <div className="text-zinc-400 text-xs">
          Showing <span className="text-white font-medium">{filteredLogs.length}</span> recorded events
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#161616] text-zinc-400 text-[11px] font-medium border-b border-[#222222]">
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-4">SKU & Item</th>
                <th className="py-3.5 px-4 text-center">Event Type</th>
                <th className="py-3.5 px-4 text-center">Delta</th>
                <th className="py-3.5 px-4 text-center">Stock Transition</th>
                <th className="py-3.5 px-5">Reason & Audit Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Loading audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <div className="space-y-1.5">
                      <History size={24} className="mx-auto mb-2 text-zinc-600" />
                      <p className="font-semibold text-zinc-300">No inventory logs found</p>
                      <p className="text-[11px] text-zinc-500">Audit entries are generated when orders are paid or stock quantities are adjusted.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const sku = log.product_variants?.sku || 'SKU';
                  const productName = log.product_variants?.products?.name || '';
                  const size = log.product_variants?.size || '';
                  const isPositive = log.quantity_delta > 0;

                  return (
                    <tr key={log.id} className="hover:bg-[#181818] transition-colors">
                      <td className="py-3.5 px-5 text-zinc-400 text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} IST
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-semibold text-xs">{sku}</div>
                        {productName && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">{productName} {size ? `• Size ${size}` : ''}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getChangeTypeBadge(log.change_type)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${log.quantity_delta}` : log.quantity_delta}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-zinc-400">{log.previous_stock}</span>
                        <span className="mx-2 text-zinc-600">→</span>
                        <span className="text-white font-bold">{log.new_stock}</span>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-300 text-[11px]">
                        {log.reason || 'Manual inventory operation'}
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
  );
};
