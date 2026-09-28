import React, { useState } from 'react';
import { adjustVariantStock } from '../../services/adminService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Package, 
  Plus, 
  Minus, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  Database,
  ArrowRight
} from 'lucide-react';

export const StockAdjustModal = ({ item, onClose, onStockAdjusted }) => {
  const { executeAction } = useAdminFeedback();
  const [mode, setMode] = useState('add'); // 'add' | 'deduct' | 'set'
  const [amount, setAmount] = useState('10');
  const [reasonCategory, setReasonCategory] = useState('Restock (Supplier Inward)');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lastDuration, setLastDuration] = useState(null);

  if (!item) return null;

  const currentStock = item.stockQuantity || 0;
  const parsedAmount = Math.max(0, parseInt(amount, 10) || 0);

  // Compute delta and resulting stock
  let delta = 0;
  let resultingStock = currentStock;

  if (mode === 'add') {
    delta = parsedAmount;
    resultingStock = currentStock + delta;
  } else if (mode === 'deduct') {
    delta = -parsedAmount;
    resultingStock = currentStock + delta;
  } else if (mode === 'set') {
    resultingStock = parsedAmount;
    delta = resultingStock - currentStock;
  }

  const isInvalid = resultingStock < 0 || (delta === 0 && mode !== 'set');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isInvalid) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setLastDuration(null);

    const fullReason = customNotes.trim() 
      ? `${reasonCategory}: ${customNotes.trim()}`
      : reasonCategory;

    setIsSubmitting(true);

    const outcome = await executeAction(
      `stock_adjust_${item.variantId}`,
      () => adjustVariantStock({
        variantId: item.variantId,
        delta,
        reason: fullReason
      }),
      {
        label: 'Adjusting inventory levels...',
        successTitle: 'Stock updated successfully',
        errorTitle: 'Stock adjustment failed',
        entityType: 'inventory',
        entityId: item.sku || item.variantId,
        detail: `SKU: ${item.sku} (Size ${item.size}) • Delta: ${delta > 0 ? '+' : ''}${delta} • Stock: ${currentStock} → ${resultingStock}`
      }
    );

    setIsSubmitting(false);

    if (outcome.success) {
      setSuccessMessage(`Stock updated successfully: ${currentStock} → ${resultingStock}`);
      setLastDuration(outcome.duration);
      if (onStockAdjusted) {
        onStockAdjusted({
          ...item,
          stockQuantity: resultingStock,
          availableStock: Math.max(0, resultingStock - (item.reservedQuantity || 0)),
          status: resultingStock === 0 ? 'OUT_OF_STOCK' : resultingStock <= 5 ? 'LOW_STOCK' : 'IN_STOCK'
        });
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setErrorMessage(outcome.error);
      setLastDuration(outcome.duration);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div 
        className="bg-[#121212] border border-[#242424] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#161616] border-b border-[#222222] p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase block">
              Stock Adjustment
            </span>
            <h3 className="text-base font-bold text-white">
              Adjust Variant Stock
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#202020] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">

          {/* Feedback */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-400" />
                <span className="font-semibold">Stock Adjustment Failed</span>
              </div>
              <p className="text-[11px] text-rose-300/90 pl-5">{errorMessage}</p>
              {lastDuration && (
                <div className="pl-5 pt-1 flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 bg-[#181818] rounded border border-[#2a2a2a]">⏱ {lastDuration}</span>
                  <span className="text-zinc-500">Database: Unchanged</span>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                <span className="font-semibold">{successMessage}</span>
              </div>
              {lastDuration && (
                <div className="pl-5 pt-1 flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 bg-[#181818] text-zinc-300 rounded border border-[#2a2a2a]">⏱ {lastDuration}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">Database: Updated</span>
                  <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">Sync: Complete</span>
                </div>
              )}
            </div>
          )}

          {/* Target Variant Badge */}
          <div className="bg-[#181818] border border-[#242424] p-3.5 rounded-xl space-y-1 shadow-sm">
            <div className="text-[11px] text-zinc-400">Target Variant SKU</div>
            <div className="text-sm font-bold text-white">{item.sku}</div>
            <div className="text-xs text-zinc-400">
              {item.product?.name} • Size {item.size}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`py-2 px-3 border rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors ${
                mode === 'add' 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold' 
                  : 'bg-[#181818] border-[#262626] text-zinc-400 hover:text-white'
              }`}
            >
              <Plus size={13} />
              <span>Add Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('deduct')}
              className={`py-2 px-3 border rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors ${
                mode === 'deduct' 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold' 
                  : 'bg-[#181818] border-[#262626] text-zinc-400 hover:text-white'
              }`}
            >
              <Minus size={13} />
              <span>Deduct</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('set')}
              className={`py-2 px-3 border rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors ${
                mode === 'set' 
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-semibold' 
                  : 'bg-[#181818] border-[#262626] text-zinc-400 hover:text-white'
              }`}
            >
              <Sliders size={13} />
              <span>Set Count</span>
            </button>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-xs text-zinc-400 font-medium block mb-1.5">
              {mode === 'add' ? 'Units to Add (+)' : mode === 'deduct' ? 'Units to Deduct (-)' : 'New Total Stock Count'}
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-lg text-sm outline-none"
            />
          </div>

          {/* Stock Calculation Preview Card */}
          <div className="bg-[#181818] border border-[#242424] p-3.5 rounded-xl flex items-center justify-between text-xs shadow-sm">
            <div>
              <span className="text-[11px] text-zinc-500 block">Current</span>
              <span className="text-white font-bold text-sm">{currentStock}</span>
            </div>

            <div className="text-center text-zinc-400">
              <span className="text-[11px] block">Adjustment</span>
              <span className={`font-semibold ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {delta > 0 ? `+${delta}` : delta}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-zinc-500 block">Resulting Stock</span>
              <span className={`text-sm font-bold ${resultingStock < 0 ? 'text-rose-400' : 'text-white'}`}>
                {resultingStock}
              </span>
            </div>
          </div>

          {resultingStock < 0 && (
            <div className="text-xs text-rose-400 font-medium flex items-center gap-1">
              <AlertCircle size={13} />
              <span>Cannot adjust stock below zero.</span>
            </div>
          )}

          {/* Reason Category */}
          <div>
            <label className="text-xs text-zinc-400 font-medium block mb-1.5">
              Adjustment Reason (Audit Trail)
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-lg text-xs outline-none cursor-pointer"
            >
              <option value="Restock (Supplier Inward)">Restock (Supplier Inward)</option>
              <option value="Physical Inventory Count Correction">Physical Inventory Count Correction</option>
              <option value="Damaged / Defective Stock">Damaged / Defective Stock</option>
              <option value="Customer Return Inward">Customer Return Inward</option>
              <option value="Sample / Promotional Allocation">Sample / Promotional Allocation</option>
              <option value="Other">Other Adjustment</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-zinc-400 font-medium block mb-1.5">
              Specific Notes / PO Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Batch #2026-09 Restock, QC Discard"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-lg text-xs outline-none placeholder-zinc-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#181818] hover:bg-[#222222] text-zinc-400 hover:text-white text-xs font-medium rounded-lg border border-[#282828] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInvalid}
              className="px-5 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? <RefreshCw size={13} className="animate-spin text-black" /> : null}
              <span>{isSubmitting ? 'Updating...' : 'Confirm Adjustment'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
