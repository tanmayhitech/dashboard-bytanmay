import React, { useEffect } from 'react';
import { 
  X, 
  ArrowRight,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Package,
  TrendingUp,
  Lightbulb,
  Sliders
} from 'lucide-react';

/**
 * LOOZARS® Stock Status Explainer (Side Drawer)
 * Explains warehouse inventory levels, size availability, 
 * and production reorder needs in ultra-simple plain English.
 */
export const StockStatusExplainerDrawer = ({
  isOpen,
  onClose,
  lowStockCount = 0,
  lowStockItems = [],
  productCount = 4,
  variantCount = 21,
  onNavigateToInventory,
  onOpenStockModal
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

  const isHealthy = lowStockCount === 0;

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
              <h2 className="text-base font-semibold text-zinc-100">Stock & Inventory Health</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                isHealthy 
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40' 
                  : 'text-rose-400 bg-rose-950/40 border border-rose-800/40'
              }`}>
                {isHealthy ? 'Healthy' : `${lowStockCount} Low Stock`}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time size availability across all active apparel drops
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
              {isHealthy ? (
                <span>All <strong className="text-white font-semibold">{variantCount} size options</strong> across your <strong className="text-white font-semibold">{productCount} active drops</strong> have sufficient stock. You have <strong className="text-emerald-400 font-semibold">467 total units</strong> available in the warehouse.</span>
              ) : (
                <span>You have <strong className="text-rose-400 font-semibold">{lowStockCount} sizes</strong> running low on stock (5 or fewer units left). Consider reordering these sizes to avoid missed sales.</span>
              )}
            </p>
          </div>

          {/* Catalog Summary Cards */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3.5 bg-[#16161C] border border-[#23232C] rounded-xl space-y-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Active Drops</span>
              <div className="text-lg font-semibold text-zinc-100 tabular-nums">
                {productCount} Products
              </div>
              <span className="text-[11px] text-zinc-500 block">All 4 drops live</span>
            </div>

            <div className="p-3.5 bg-[#16161C] border border-[#23232C] rounded-xl space-y-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Tracked Sizes</span>
              <div className="text-lg font-semibold text-zinc-100 tabular-nums">
                {variantCount} Variants
              </div>
              <span className="text-[11px] text-zinc-500 block">S, M, L, XL, XXL</span>
            </div>
          </div>

          {/* Low Stock Watchlist (if any) or Healthy Overview */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              {lowStockItems.length > 0 ? 'Sizes Requiring Attention' : 'Size Demand & Popularity'}
            </span>

            {lowStockItems.length > 0 ? (
              <div className="divide-y divide-[#1F1F28] border border-[#202028] rounded-xl bg-[#141418] overflow-hidden text-xs">
                {lowStockItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-zinc-200 block">{item.productName || item.sku}</span>
                      <span className="text-[11px] text-zinc-400">Size {item.size} · SKU: {item.sku}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-rose-400 tabular-nums">{item.stockQuantity} units left</span>
                      <span className="text-[10px] text-zinc-500 block">Critical</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[#141418] border border-[#202028] rounded-xl space-y-2.5 text-xs text-zinc-400">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 size={16} />
                  <span>Zero Stockout Risks</span>
                </div>
                <p className="leading-relaxed text-zinc-300">
                  Every size variant currently holds healthy buffer stock.
                </p>
                <div className="pt-2 border-t border-[#1E1E26] space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Sizes M & L (Highest Demand):</span>
                    <span className="text-zinc-200 font-medium">~58% of orders</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Sizes S, XL & XXL:</span>
                    <span className="text-zinc-200 font-medium">~42% of orders</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manufacturing / Reorder Advice */}
          <div className="p-3.5 bg-[#141418] border border-[#202028] rounded-xl flex items-start gap-2.5 text-xs text-zinc-400">
            <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-medium block">Production Recommendation:</span>
              <p className="mt-0.5 text-zinc-400 leading-relaxed">
                When preparing for your next collection batch, keep a 3:4:3 ratio for M:L:XL sizes to match current buyer behavior.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#1E1E24] bg-[#141418] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              if (onNavigateToInventory) onNavigateToInventory();
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            <span>Open Inventory Manager</span>
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
