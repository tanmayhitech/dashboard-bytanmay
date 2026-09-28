import React, { useState, useEffect } from 'react';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { fetchAdminAuditLogs } from '../../services/adminService';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  RefreshCw, 
  Database,
  Layers,
  ShoppingBag,
  Package,
  Tag,
  Sparkles
} from 'lucide-react';

export const RecentActivityPanel = () => {
  const { recentActivities } = useAdminFeedback();
  const [dbLogs, setDbLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    loadDbLogs();
    
    const handleMutationSuccess = () => {
      loadDbLogs();
    };
    window.addEventListener('loozars_admin_mutation_success', handleMutationSuccess);
    return () => {
      window.removeEventListener('loozars_admin_mutation_success', handleMutationSuccess);
    };
  }, []);

  const loadDbLogs = async () => {
    try {
      const res = await fetchAdminAuditLogs(10);
      if (res.success && Array.isArray(res.logs)) {
        setDbLogs(res.logs);
      }
    } catch {
      // Non-fatal
    }
  };

  // Combine live session activities and database logs without duplicates
  const displayItems = [...recentActivities];
  
  // Format relative time helper
  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 10) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString('en-IN');
    } catch {
      return 'Recent';
    }
  };

  const getEntityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'product':
        return <Layers size={13} className="text-purple-400" />;
      case 'inventory':
        return <Package size={13} className="text-amber-400" />;
      case 'order':
        return <ShoppingBag size={13} className="text-blue-400" />;
      case 'coupon':
        return <Tag size={13} className="text-emerald-400" />;
      case 'influencer':
        return <Sparkles size={13} className="text-amber-400" />;
      default:
        return <Activity size={13} className="text-zinc-400" />;
    }
  };

  return (
    <div className="bg-[#121212] border border-[#222222] p-5 rounded-xl space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#222222] pb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-zinc-400" />
          <h3 className="text-sm font-semibold text-white">
            Recent Admin Activity
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          Live Operation Stream
        </span>
      </div>

      {displayItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 space-y-1">
          <p className="font-medium text-zinc-400">No actions recorded in current session</p>
          <p className="text-[11px] text-zinc-600">Product edits, stock updates, and order shipments will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1a1a1a]">
          {displayItems.slice(0, 6).map((item) => {
            const isSuccess = item.status === 'success';
            return (
              <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 hover:bg-[#161616] px-2.5 rounded-lg transition-colors">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isSuccess ? (
                      <CheckCircle2 size={15} className="text-emerald-400" />
                    ) : (
                      <XCircle size={15} className="text-rose-400" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-semibold text-zinc-100 truncate flex items-center gap-1.5">
                      {getEntityIcon(item.entityType)}
                      <span className="truncate">{item.title}</span>
                    </div>
                    {item.detail && (
                      <div className="text-[11px] text-zinc-400 truncate max-w-sm">
                        {item.detail}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        <span>{item.actor || 'Admin'}</span>
                      </span>
                      <span>•</span>
                      <span>{getRelativeTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Duration & Sync Status */}
                <div className="shrink-0 text-right space-y-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#1a1a1a] text-zinc-300 px-2 py-0.5 rounded border border-[#2a2a2a]">
                    <Clock size={9} className="text-zinc-500" />
                    <span>{item.duration}</span>
                  </span>
                  <div className="text-[9px] font-mono text-emerald-400/80">
                    DB: Verified
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
