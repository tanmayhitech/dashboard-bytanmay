import React, { useEffect } from 'react';
import { 
  X, 
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Truck,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

/**
 * LOOZARS® Payment Mix Explainer (Side Drawer)
 * Explains prepaid online vs cash on delivery splits, cash flow security,
 * and delivery risk in ultra-simple plain English.
 */
export const PaymentMixExplainerDrawer = ({
  isOpen,
  onClose,
  paymentsData = {},
  totalOrders = 0
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const prepaidCount = Number(paymentsData?.prepaid_count || 0);
  const codCount = Number(paymentsData?.cod_count || 0);
  const prepaidPercent = totalOrders > 0 
    ? Number(paymentsData?.prepaid_percent ?? Math.round((prepaidCount / totalOrders) * 100)) 
    : 0;
  const codPercent = totalOrders > 0 
    ? Number(paymentsData?.cod_percent ?? (100 - prepaidPercent)) 
    : 0;

  const prepaidRevenue = Number(paymentsData?.prepaid_revenue || 0);
  const codRevenue = Number(paymentsData?.cod_revenue || 0);
  const totalRevenue = prepaidRevenue + codRevenue;

  // Estimated Razorpay processing fees (~2%)
  const estimatedGatewayFees = Math.round(prepaidRevenue * 0.02);
  // Estimated COD courier fee savings
  const codFeesSaved = Math.round(prepaidCount * 45);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Side Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111114] border-l border-[#22222A] shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1E1E24] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-100">Payment Methods & Cash Flow</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md text-emerald-400 bg-emerald-950/40 border border-emerald-800/40">
                {prepaidPercent}% Online
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Prepaid UPI & cards vs. Cash on Delivery collection breakdown
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#1C1C24] rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Plain-English Summary */}
          <div className="p-4 bg-[#16161C] border border-[#23232C] rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Quick Summary
            </span>
            <p className="text-sm text-zinc-200 leading-relaxed">
              <strong className="text-emerald-400 font-semibold">{prepaidPercent}% of your customers ({prepaidCount} orders)</strong> paid upfront with instant UPI or Cards, ensuring guaranteed cash. <strong className="text-sky-400 font-semibold">{codPercent}% ({codCount} orders)</strong> chose Cash on Delivery to pay at their doorstep.
            </p>
          </div>

          {/* Visual Payment Mix Bar */}
          <div className="p-4 bg-[#16161C] border border-[#23232C] rounded-xl space-y-3">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Collection Share
            </span>

            <div className="w-full h-3 bg-[#101014] rounded-full overflow-hidden flex gap-1 p-0.5 border border-[#202028]">
              <div 
                style={{ width: `${prepaidPercent}%` }} 
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" 
                title={`Online: ${prepaidPercent}%`}
              />
              <div 
                style={{ width: `${codPercent}%` }} 
                className="h-full bg-sky-500 rounded-r-full transition-all duration-500" 
                title={`COD: ${codPercent}%`}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1 gap-1.5 sm:gap-0">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>Prepaid Online: <strong className="text-white font-semibold">₹{prepaidRevenue.toLocaleString('en-IN')}</strong> ({prepaidCount})</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                <span>COD: <strong className="text-white font-semibold">₹{codRevenue.toLocaleString('en-IN')}</strong> ({codCount})</span>
              </span>
            </div>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Channel Comparison & Risk
            </span>

            <div className="grid grid-cols-1 gap-3 text-xs">
              
              {/* Prepaid Card */}
              <div className="p-3.5 bg-[#141418] border border-[#202028] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>Prepaid Online (Razorpay)</span>
                  </span>
                  <span className="text-emerald-400 font-medium bg-emerald-950/30 px-2 py-0.5 rounded text-[11px]">
                    0% Delivery Risk
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Money is settled directly into your bank account. Customers who pay upfront almost never reject packages at delivery.
                </p>
              </div>

              {/* COD Card */}
              <div className="p-3.5 bg-[#141418] border border-[#202028] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Truck size={14} className="text-sky-400" />
                    <span>Cash on Delivery (COD)</span>
                  </span>
                  <span className="text-zinc-400 font-medium bg-[#1C1C24] px-2 py-0.5 rounded text-[11px]">
                    Doorstep Collection
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Collected in cash by the courier. Indian e-commerce averages a 15-20% rejection rate for COD orders before delivery.
                </p>
              </div>

            </div>
          </div>

          {/* Financial Tip */}
          <div className="p-3.5 bg-[#141418] border border-[#202028] rounded-xl flex items-start gap-2.5 text-xs text-zinc-400">
            <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-medium block">Cash Flow Insight:</span>
              <p className="mt-0.5 text-zinc-400 leading-relaxed">
                Your 80% prepaid ratio is strong for Indian D2C fashion (industry average is ~40% prepaid). This saves approximately ₹{codFeesSaved.toLocaleString('en-IN')} in courier cash-handling fees.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#1E1E24] bg-[#141418] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#202028] hover:bg-[#282834] text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-[#2E2E3C]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
