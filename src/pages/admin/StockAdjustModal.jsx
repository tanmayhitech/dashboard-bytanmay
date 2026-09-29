import React, { useState } from 'react';
import { adjustVariantStock } from '../../services/adminService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Plus, 
  Minus, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export const StockAdjustModal = ({ item, onClose, onStockAdjusted }) => {
  const { executeAction } = useAdminFeedback();
  const [mode, setMode] = useState('add');
  const [amount, setAmount] = useState('10');
  const [reasonCategory, setReasonCategory] = useState('Restock (Supplier Inward)');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!item) return null;

  const currentStock = item.stockQuantity || 0;
  const parsedAmount = Math.max(0, parseInt(amount, 10) || 0);

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
        detail: `SKU: ${item.sku} • Stock: ${currentStock} → ${resultingStock}`
      }
    );

    setIsSubmitting(false);

    if (outcome.success) {
      setSuccessMessage(`Stock updated: ${currentStock} → ${resultingStock}`);
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
      }, 700);
    } else {
      setErrorMessage(outcome.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn font-sans">
      <div 
        className="bg-[#141418] border border-[#242430] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden font-sans text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#121216] border-b border-[#22222C] px-6 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase block">
              Inventory Control
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Adjust Variant Stock
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#20202A] rounded-xl transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-zinc-300">
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Target Variant Card */}
          <div className="bg-[#111115] border border-[#22222C] p-4 rounded-2xl space-y-1 shadow-xs">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Variant SKU</div>
            <div className="text-sm font-bold text-white font-mono">{item.sku}</div>
            <div className="text-xs text-zinc-400 font-medium">
              {item.product?.name || item.productName || 'LOOZARS Silhouette'} • Size <span className="font-mono text-zinc-200">{item.size}</span>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`py-2 px-3 border rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'add' 
                  ? 'bg-[#1C1C24] border-[#3E3E50] text-white font-semibold shadow-xs' 
                  : 'bg-[#16161D] border-[#242430] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Plus size={13} className={mode === 'add' ? 'text-emerald-400' : ''} />
              <span>Add</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('deduct')}
              className={`py-2 px-3 border rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'deduct' 
                  ? 'bg-[#1C1C24] border-[#3E3E50] text-white font-semibold shadow-xs' 
                  : 'bg-[#16161D] border-[#242430] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Minus size={13} className={mode === 'deduct' ? 'text-rose-400' : ''} />
              <span>Deduct</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('set')}
              className={`py-2 px-3 border rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'set' 
                  ? 'bg-[#1C1C24] border-[#3E3E50] text-white font-semibold shadow-xs' 
                  : 'bg-[#16161D] border-[#242430] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders size={13} className={mode === 'set' ? 'text-sky-400' : ''} />
              <span>Set Exact</span>
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-zinc-300 font-medium block mb-1 text-xs">
              {mode === 'add' ? 'Units to Add (+)' : mode === 'deduct' ? 'Units to Deduct (-)' : 'New Total Stock Count'}
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-white font-mono font-bold px-3.5 py-2.5 rounded-xl text-sm outline-none shadow-xs"
            />
          </div>

          {/* Preview Calculation */}
          <div className="bg-[#111115] border border-[#22222C] p-4 rounded-2xl flex items-center justify-between text-xs shadow-xs">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">Current</span>
              <span className="text-zinc-200 font-bold text-sm font-mono">{currentStock}</span>
            </div>

            <div className="text-center text-zinc-400">
              <span className="text-[10px] block uppercase font-medium">Adjustment</span>
              <span className={`font-semibold font-mono ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {delta > 0 ? `+${delta}` : delta}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">Resulting Total</span>
              <span className={`text-sm font-bold font-mono ${resultingStock < 0 ? 'text-rose-400' : 'text-white'}`}>
                {resultingStock}
              </span>
            </div>
          </div>

          {resultingStock < 0 && (
            <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5 p-2 bg-rose-950/30 rounded-xl border border-rose-900/40">
              <AlertCircle size={13} />
              <span>Cannot adjust stock below zero.</span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-zinc-300 font-medium block mb-1 text-xs">
              Audit Reason
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs outline-none cursor-pointer shadow-xs"
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
            <label className="text-zinc-300 font-medium block mb-1 text-xs">
              Internal Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Batch #2026-09 Restock"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-zinc-100 px-3.5 py-2.5 rounded-xl text-xs outline-none placeholder-zinc-600 shadow-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E1E26]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1A1A22] hover:bg-[#22222C] text-zinc-300 text-xs font-medium rounded-xl border border-[#2A2A38] transition-colors cursor-pointer shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInvalid}
              className="px-5 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isSubmitting ? <RefreshCw size={13} className="animate-spin text-zinc-900" /> : null}
              <span>Save Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
