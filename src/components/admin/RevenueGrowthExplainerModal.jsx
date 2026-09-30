import React, { useEffect } from 'react';
import { 
  X, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

/**
 * LOOZARS® Revenue Growth Explainer (Side Drawer)
 * Uses ultra-simple, plain-English terms and visual bars 
 * to explain revenue changes in seconds.
 */
export const RevenueGrowthExplainerModal = ({
  isOpen,
  onClose,
  timeRange = '7d',
  onChangeTimeRange,
  salesData = {},
  returnsData = {},
  onNavigateToSales
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

  const totalRevenue = Number(salesData?.totalRevenue || 0);
  const priorRevenue = Number(salesData?.priorRevenue || 0);
  const variance = totalRevenue - priorRevenue;
  const growthPercent = Number(salesData?.revenueGrowthPercent || 0);
  const isPositive = growthPercent >= 0;

  const paidOrders = Number(salesData?.paidOrdersCount || 0);
  const priorPaidOrders = Number(salesData?.priorPaidOrdersCount || 0);
  const orderDelta = paidOrders - priorPaidOrders;
  const orderDeltaPercent = priorPaidOrders > 0 ? (((orderDelta) / priorPaidOrders) * 100).toFixed(1) : 0;

  const aov = Number(salesData?.aov || 0);
  const priorAov = Number(salesData?.priorAov || 0);
  const aovDelta = aov - priorAov;
  const aovDeltaPercent = priorAov > 0 ? (((aovDelta) / priorAov) * 100).toFixed(1) : 0;

  const prepaidRevenue = Number(salesData?.prepaidRevenue || 0);
  const codRevenue = Number(salesData?.codRevenue || 0);
  const totalRefundedINR = Number(returnsData?.totalRefundedINR || 0);
  const totalReturns = Number(returnsData?.totalReturns || 0);

  const getRangeLabel = (range) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '14d': return 'Last 14 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case 'all': return 'All Time';
      default: return 'Selected Days';
    }
  };

  // Determine Primary Driver in Plain English
  let primaryDriver = 'Order Volume';
  if (Math.abs(aovDeltaPercent) > Math.abs(orderDeltaPercent)) {
    primaryDriver = 'Customer Spending';
  }

  // Generate 1-sentence plain English takeaway
  const getPlainEnglishSummary = () => {
    if (variance < 0) {
      const absVariance = Math.abs(variance).toLocaleString('en-IN');
      if (orderDelta < 0 && aovDelta < 0) {
        return `Sales dropped by ₹${absVariance} mainly because you received ${Math.abs(orderDelta)} fewer orders, and customers spent ₹${Math.abs(aovDelta).toLocaleString('en-IN')} less per order.`;
      } else if (orderDelta < 0) {
        return `Sales dropped by ₹${absVariance} because you received ${Math.abs(orderDelta)} fewer orders compared to the previous period.`;
      } else {
        return `Sales dropped by ₹${absVariance} because average customer spending per order went down by ₹${Math.abs(aovDelta).toLocaleString('en-IN')}.`;
      }
    } else if (variance > 0) {
      return `Sales increased by ₹${variance.toLocaleString('en-IN')} (+${growthPercent}%) with ${orderDelta > 0 ? `${orderDelta} more completed orders` : 'higher average spending per customer'}.`;
    }
    return `Sales remained consistent with the previous period.`;
  };

  // Bar percentage calculation for visual comparison
  const maxBarValue = Math.max(totalRevenue, priorRevenue, 1);
  const currentBarPercent = Math.min(100, Math.round((totalRevenue / maxBarValue) * 100));
  const priorBarPercent = Math.min(100, Math.round((priorRevenue / maxBarValue) * 100));

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
              <h2 className="text-base font-semibold text-zinc-100">Why Did Revenue Change?</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                isPositive 
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40' 
                  : 'text-rose-400 bg-rose-950/40 border border-rose-800/40'
              }`}>
                {isPositive ? `+${growthPercent}%` : `${growthPercent}%`}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Comparing <span className="text-zinc-200 font-medium">{getRangeLabel(timeRange)}</span> against the previous {getRangeLabel(timeRange).toLowerCase()}
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
          
          {/* 1. Time Range Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-[#16161B] border border-[#23232C] rounded-xl text-xs">
            {[
              { id: '7d', label: '7 Days' },
              { id: '14d', label: '14 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'all', label: 'All Time' }
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => onChangeTimeRange && onChangeTimeRange(pill.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center ${
                  timeRange === pill.id
                    ? 'bg-[#242430] text-zinc-100 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* 2. Plain-English Summary Box */}
          <div className="p-4 bg-[#16161C] border border-[#23232C] rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Quick Summary
            </span>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {getPlainEnglishSummary()}
            </p>
          </div>

          {/* 3. Visual Revenue Comparison Bars */}
          <div className="p-4 bg-[#16161C] border border-[#23232C] rounded-xl space-y-4">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Revenue Comparison
            </span>

            {/* Current Period Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Now ({getRangeLabel(timeRange)})</span>
                <span className="text-zinc-100 font-semibold tabular-nums">
                  ₹{totalRevenue.toLocaleString('en-IN')} <span className="text-zinc-500 font-normal">({paidOrders} orders)</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#101014] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${currentBarPercent}%` }}
                />
              </div>
            </div>

            {/* Prior Period Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Previous Period</span>
                <span className="text-zinc-300 font-medium tabular-nums">
                  ₹{priorRevenue.toLocaleString('en-IN')} <span className="text-zinc-500 font-normal">({priorPaidOrders} orders)</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#101014] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-600 rounded-full transition-all duration-500"
                  style={{ width: `${priorBarPercent}%` }}
                />
              </div>
            </div>

            {/* Net Difference */}
            <div className="pt-2 border-t border-[#202028] flex items-center justify-between text-xs">
              <span className="text-zinc-400">Net Difference:</span>
              <span className={`font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {variance >= 0 ? '+' : ''}₹{variance.toLocaleString('en-IN')} ({growthPercent >= 0 ? `+${growthPercent}%` : `${growthPercent}%`})
              </span>
            </div>
          </div>

          {/* 4. What Caused the Change? (Clear List) */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              What Caused the Change?
            </span>

            <div className="divide-y divide-[#1F1F28] border border-[#202028] rounded-xl bg-[#141418] overflow-hidden text-xs">
              
              {/* Order Count */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-200">Orders Received</span>
                    {primaryDriver === 'Order Volume' && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded font-medium">
                        Main Factor
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    {paidOrders} orders now vs {priorPaidOrders} before
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-semibold tabular-nums ${orderDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {orderDelta >= 0 ? `+${orderDelta}` : `${orderDelta}`} orders
                  </span>
                  <span className="text-[11px] text-zinc-500 block">
                    {orderDeltaPercent >= 0 ? `+${orderDeltaPercent}%` : `${orderDeltaPercent}%`}
                  </span>
                </div>
              </div>

              {/* Customer Spending / Basket Size */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-200">Average Spend per Order</span>
                    {primaryDriver === 'Customer Spending' && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded font-medium">
                        Main Factor
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    ₹{aov.toLocaleString('en-IN')} per customer vs ₹{priorAov.toLocaleString('en-IN')} before
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-semibold tabular-nums ${aovDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {aovDelta >= 0 ? `+₹${aovDelta.toLocaleString('en-IN')}` : `-₹${Math.abs(aovDelta).toLocaleString('en-IN')}`}
                  </span>
                  <span className="text-[11px] text-zinc-500 block">
                    {aovDeltaPercent >= 0 ? `+${aovDeltaPercent}%` : `${aovDeltaPercent}%`}
                  </span>
                </div>
              </div>

              {/* Payment Split */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-zinc-200 block">How Customers Paid</span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Online (UPI/Cards): ₹{prepaidRevenue.toLocaleString('en-IN')} | Cash: ₹{codRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-zinc-200 tabular-nums">
                    {totalRevenue > 0 ? Math.round((prepaidRevenue / totalRevenue) * 100) : 0}%
                  </span>
                  <span className="text-[11px] text-zinc-500 block">Prepaid</span>
                </div>
              </div>

              {/* Refunds */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-zinc-200 block">Customer Refunds</span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    {totalReturns} return requests processed
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-zinc-200 tabular-nums">
                    ₹{totalRefundedINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-zinc-500 block">Deducted</span>
                </div>
              </div>

            </div>
          </div>

          {/* 5. Helpful Next Step Tip */}
          <div className="p-3.5 bg-[#141418] border border-[#202028] rounded-xl flex items-start gap-2.5 text-xs text-zinc-400">
            <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-medium block">Suggested Next Step:</span>
              <p className="mt-0.5 text-zinc-400 leading-relaxed">
                {variance < 0 
                  ? "Launch a limited-time influencer promo code or send a restock notification to boost order volume this week."
                  : "Sales momentum is strong. Ensure warehouse stock is replenished for your top-selling sizes."}
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#1E1E24] bg-[#141418] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              if (onNavigateToSales) onNavigateToSales();
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            <span>View Full Sales Trends</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#202028] hover:bg-[#282834] text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-[#2E2E3C]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
