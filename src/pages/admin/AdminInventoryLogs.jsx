import React, { useState, useEffect, useCallback } from 'react';
import { fetchInventoryLogs } from '../../services/adminService';
import { 
  RefreshCw, 
  Database, 
  Filter,
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
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Restock</span>
          </span>
        );
      case 'order_placed':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Order Placed</span>
          </span>
        );
      case 'order_cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Order Cancelled</span>
          </span>
        );
      case 'manual_adjustment':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            <span>Manual Adj</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDF0] tracking-tight">Activity Log</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Chronological audit trail of inventory movements, purchases, manual adjustments, and restocks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="px-3 py-1.5 bg-[#16161A] hover:bg-[#202026] text-zinc-300 border border-[#24242A] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center gap-2.5">
          <Database size={15} className="shrink-0 text-amber-400" />
          <span>Database offline: Audit logs require Supabase connection.</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-zinc-500" />
          <span className="text-zinc-300 font-medium">Filter by Event:</span>
          <select
            value={changeTypeFilter}
            onChange={(e) => setChangeTypeFilter(e.target.value)}
            className="bg-[#16161A] border border-[#24242A] focus:border-zinc-500 text-zinc-200 px-3 py-1.5 rounded-lg outline-none text-xs shadow-xs cursor-pointer"
          >
            <option value="ALL">All Events</option>
            <option value="restock">Restock</option>
            <option value="order_placed">Order Placed</option>
            <option value="order_cancelled">Order Cancelled</option>
            <option value="manual_adjustment">Manual Adjustment</option>
          </select>
        </div>

        <div className="text-zinc-400 text-xs font-mono">
          Showing <span className="font-semibold text-[#EDEDF0]">{filteredLogs.length}</span> recorded events
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#16161A] border border-[#24242A] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#121215] text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-semibold border-b border-[#24242A]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">SKU & Item</th>
                <th className="py-3 px-3 text-center">Event Type</th>
                <th className="py-3 px-3 text-center">Change</th>
                <th className="py-3 px-3 text-center">Stock Transition</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24242A]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Loading activity log...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <History size={24} className="mx-auto mb-2 text-zinc-600" />
                    <p className="font-semibold text-zinc-300 text-sm">No Activity Recorded</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Audit records are automatically recorded on orders and stock adjustments.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const sku = log.product_variants?.sku || 'SKU';
                  const productName = log.product_variants?.products?.name || '';
                  const size = log.product_variants?.size || '';
                  const isPositive = log.quantity_delta > 0;

                  return (
                    <tr key={log.id} className="hover:bg-[#1A1A20] transition-colors">
                      <td className="py-3 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[#EDEDF0] font-semibold font-mono text-xs">{sku}</div>
                        {productName && (
                          <div className="text-[11px] text-zinc-400">{productName} {size ? `• Size ${size}` : ''}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getChangeTypeBadge(log.change_type)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${log.quantity_delta}` : log.quantity_delta}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="text-zinc-500">{log.previous_stock}</span>
                        <span className="mx-1.5 text-zinc-600">→</span>
                        <span className="text-[#EDEDF0] font-bold">{log.new_stock}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300 text-[11px]">
                        {log.reason || 'Inventory operation'}
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
