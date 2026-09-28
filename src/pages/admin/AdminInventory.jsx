import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminInventory } from '../../services/adminService';
import { StockAdjustModal } from './StockAdjustModal';
import { 
  Package, 
  Search, 
  Filter, 
  RefreshCw, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  Layers,
  ArrowUpDown
} from 'lucide-react';

export const AdminInventory = ({ initialSelectedItem = null }) => {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [sizeFilter, setSizeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(initialSelectedItem);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminInventory();
      setIsOffline(Boolean(res.isOffline));
      setInventory(res.inventory || []);
    } catch (err) {
      console.error('[AdminInventory] Error loading inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleStockAdjusted = (updatedItem) => {
    setInventory(prev => prev.map(item => item.variantId === updatedItem.variantId ? { ...item, ...updatedItem } : item));
  };

  // Filter items
  const filteredInventory = inventory.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (sizeFilter !== 'ALL' && item.size !== sizeFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchProduct = item.product?.name?.toLowerCase().includes(q);
      if (!matchSku && !matchProduct) return false;
    }
    return true;
  });

  const lowStockCount = inventory.filter(i => i.status === 'LOW_STOCK').length;
  const outOfStockCount = inventory.filter(i => i.status === 'OUT_OF_STOCK').length;
  const totalUnits = inventory.reduce((sum, i) => sum + (i.stockQuantity || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Inventory & Stock Matrix
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time stock counts across sizes, reserved cart quantities, and manual adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInventory}
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
          <span>Database offline: Variant inventory queries require a live Supabase database connection.</span>
        </div>
      )}

      {/* Stock Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#121212] border border-[#222222] p-4 rounded-xl">
          <span className="text-xs text-zinc-400 block">Total SKUs</span>
          <span className="text-xl font-bold text-white mt-1 block">{inventory.length || 21}</span>
        </div>
        <div className="bg-[#121212] border border-[#222222] p-4 rounded-xl">
          <span className="text-xs text-zinc-400 block">Total Units</span>
          <span className="text-xl font-bold text-white mt-1 block">{totalUnits}</span>
        </div>
        <div className="bg-[#121212] border border-[#222222] p-4 rounded-xl">
          <span className="text-xs text-amber-400 block">Low Stock (≤ 5)</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">{lowStockCount}</span>
        </div>
        <div className="bg-[#121212] border border-[#222222] p-4 rounded-xl">
          <span className="text-xs text-rose-400 block">Out of Stock (0)</span>
          <span className="text-xl font-bold text-rose-400 mt-1 block">{outOfStockCount}</span>
        </div>
      </div>

      {/* Controls Bar: Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input (6 cols) */}
        <div className="md:col-span-6 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by SKU or Product Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white pl-10 pr-4 py-2.5 text-xs rounded-xl outline-none transition-colors placeholder-zinc-500"
          />
        </div>

        {/* Status Filter (3 cols) */}
        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white px-3.5 py-2.5 text-xs rounded-xl outline-none transition-colors cursor-pointer"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock (&gt; 5)</option>
            <option value="LOW_STOCK">Low Stock (1 - 5)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>
        </div>

        {/* Size Filter (3 cols) */}
        <div className="md:col-span-3">
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white px-3.5 py-2.5 text-xs rounded-xl outline-none transition-colors cursor-pointer"
          >
            <option value="ALL">All Sizes</option>
            <option value="XS">Size XS</option>
            <option value="S">Size S</option>
            <option value="M">Size M</option>
            <option value="L">Size L</option>
            <option value="XL">Size XL</option>
            <option value="XXL">Size XXL</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#161616] text-zinc-400 text-[11px] font-medium border-b border-[#222222]">
              <tr>
                <th className="py-3.5 px-5">SKU / Identifier</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4 text-center">Size</th>
                <th className="py-3.5 px-4 text-center">In Stock</th>
                <th className="py-3.5 px-4 text-center">Reserved</th>
                <th className="py-3.5 px-4 text-center">Available</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Loading inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500">
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-400">No SKUs Found</p>
                      <p className="text-xs">No variants matched the selected filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  return (
                    <tr 
                      key={item.variantId} 
                      className="hover:bg-[#181818] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-semibold text-white">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300">
                        {item.product?.name || 'Product'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 bg-[#181818] text-zinc-200 border border-[#2a2a2a] rounded-md font-semibold text-xs">
                          {item.size}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-white">
                        {item.stockQuantity}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500">
                        {item.reservedQuantity || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-zinc-200">
                        {item.availableStock}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'OUT_OF_STOCK' && (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                            Out of Stock
                          </span>
                        )}
                        {item.status === 'LOW_STOCK' && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                            Low Stock
                          </span>
                        )}
                        {item.status === 'IN_STOCK' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedItemForAdjust(item)}
                          className="px-3 py-1 bg-[#1c1c1c] hover:bg-white hover:text-black text-zinc-200 border border-[#2d2d2d] rounded-lg transition-colors text-xs font-medium inline-flex items-center gap-1.5"
                        >
                          <Sliders size={12} />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-[#161616] border-t border-[#202020] p-4 text-zinc-400 text-xs flex items-center justify-between">
          <span>Displaying {filteredInventory.length} of {inventory.length} total SKUs</span>
          <span className="text-xs text-zinc-500">Server-authoritative database stock synchronization</span>
        </div>
      </div>

      {/* Stock Adjust Modal */}
      {selectedItemForAdjust && (
        <StockAdjustModal
          item={selectedItemForAdjust}
          onClose={() => setSelectedItemForAdjust(null)}
          onStockAdjusted={handleStockAdjusted}
        />
      )}
    </div>
  );
};
