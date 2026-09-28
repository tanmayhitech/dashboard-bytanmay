import React from 'react';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  X 
} from 'lucide-react';

export const AdminActionToastContainer = () => {
  const { toasts, dismissToast } = useAdminFeedback();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      aria-live="polite"
      className="fixed bottom-5 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none font-sans"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform translate-y-0 ${
              isSuccess 
                ? 'bg-[#111111]/95 border-emerald-500/30 text-white shadow-emerald-950/20' 
                : isError
                  ? 'bg-[#140a0a]/95 border-rose-500/40 text-white shadow-rose-950/30'
                  : 'bg-[#121212]/95 border-[#2c2c2c] text-zinc-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left Indicator Icon */}
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 size={18} className="text-emerald-400" />}
                {isError && <XCircle size={18} className="text-rose-400" />}
                {isInfo && <AlertCircle size={18} className="text-blue-400" />}
              </div>

              {/* Toast Content Area */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold tracking-tight truncate">
                    {toast.title}
                  </h4>
                </div>

                {/* Optional Detailed Description / Changed Metadata */}
                {toast.detail && (
                  <div className="text-[11px] sm:text-xs text-zinc-300/90 whitespace-pre-line leading-relaxed font-sans bg-black/30 p-2 rounded-lg border border-white/5">
                    {toast.detail}
                  </div>
                )}

                {/* Badges: Duration, Database, Realtime Sync */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                  {toast.duration && (
                    <span className="px-2 py-0.5 rounded-md bg-[#1f1f1f] text-zinc-300 border border-[#2f2f2f] flex items-center gap-1">
                      <Clock size={10} className="text-zinc-400" />
                      <span>{toast.duration}</span>
                    </span>
                  )}

                  {toast.dbStatus && (
                    <span className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      isSuccess 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      <Database size={10} />
                      <span>Database: {toast.dbStatus}</span>
                    </span>
                  )}

                  {toast.syncStatus && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin-slow" />
                      <span>Sync: {toast.syncStatus}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-zinc-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0 -mr-1 -mt-1"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
