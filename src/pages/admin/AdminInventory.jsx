import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminInventory } from '../../services/adminService';
import { StockAdjustModal } from './StockAdjustModal';
import { 
  Search, 
  RefreshCw, 
  Sliders, 
  Database,
  Package,
  AlertTriangle
} from 'lucide-react';

export const AdminInventory = ({ initialSelectedItem = null }) => {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sizeFilter, setSizeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(initialSelectedItem);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminInventory();
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

  const filteredInventory = inventory.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (sizeFilter !== 'ALL' && item.size !== sizeFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchSku = item.sku?.toLowerCase().includes(q);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Studio Inventory Matrix</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#181820] text-zinc-400 border border-[#2A2A38] text-[10px] font-mono font-medium">
              Real-Time Sync
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time SKU stock levels, reserved allocation tracking, and manual inventory adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInventory}
            className="px-3.5 py-2 bg-[#16161D] hover:bg-[#20202A] text-zinc-200 border border-[#262634] text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs space-y-1 group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="font-medium text-zinc-300">Total SKUs</span>
            <Package size={14} className="text-zinc-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#EDEDF0] tracking-tight tabular-nums font-mono">
            {inventory.length}
          </div>
          <p className="text-[11px] text-zinc-500">Tracked size variants</p>
        </div>

        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs space-y-1 group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="font-medium text-zinc-300">Available Units</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#EDEDF0] tracking-tight tabular-nums font-mono">
            {totalUnits}
          </div>
          <p className="text-[11px] text-zinc-500">Total physical atelier units</p>
        </div>

        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs space-y-1 group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="font-medium text-zinc-300">Low Stock Alerts</span>
            <span className="text-[10px] font-mono text-zinc-400 bg-[#1C1C24] px-2 py-0.5 rounded-md border border-[#2A2A38]">
              ≤ 5 units
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums font-mono ${lowStockCount > 0 ? 'text-rose-300' : 'text-[#EDEDF0]'}`}>
            {lowStockCount}
          </div>
          <p className="text-[11px] text-zinc-500">{lowStockCount > 0 ? 'Requires inward restock' : 'All sizes healthy'}</p>
        </div>

        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs space-y-1 group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="font-medium text-zinc-300">Sold Out SKUs</span>
            <span className="text-[10px] font-mono text-zinc-400 bg-[#1C1C24] px-2 py-0.5 rounded-md border border-[#2A2A38]">
              0 units
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums font-mono ${outOfStockCount > 0 ? 'text-rose-400' : 'text-[#EDEDF0]'}`}>
            {outOfStockCount}
          </div>
          <p className="text-[11px] text-zinc-500">{outOfStockCount > 0 ? 'Disabled on storefront' : 'Zero stockout incidents'}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#141418] border border-[#23232D] p-3.5 rounded-2xl shadow-xs">
        <div className="md:col-span-6 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search variant by SKU, size, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-zinc-100 pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none transition-colors shadow-xs placeholder-zinc-500"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-zinc-200 px-3.5 py-2.5 text-xs rounded-xl outline-none transition-colors cursor-pointer shadow-xs"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock (&gt; 5)</option>
            <option value="LOW_STOCK">Low Stock (1 - 5)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="w-full bg-[#16161D] border border-[#262634] focus:border-zinc-400 text-zinc-200 px-3.5 py-2.5 text-xs rounded-xl outline-none transition-colors cursor-pointer shadow-xs"
          >
            <option value="ALL">All Sizes (XS - XXL)</option>
            <option value="XS">Size XS</option>
            <option value="S">Size S</option>
            <option value="M">Size M</option>
            <option value="L">Size L</option>
            <option value="XL">Size XL</option>
            <option value="XXL">Size XXL</option>
          </select>
        </div>
      </div>

      {/* Inventory Container: Mobile Cards (<md) & Desktop Table (>=md) */}
      <div className="bg-[#141418] border border-[#23232D] rounded-2xl shadow-xs overflow-hidden">
        
        {/* Mobile SKU Cards (<md) */}
        <div className="md:hidden divide-y divide-[#1D1D26]">
          {isLoading ? (
            <div className="py-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={20} className="animate-spin text-zinc-500" />
              <span className="text-xs">Loading studio inventory...</span>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 p-6">
              <p className="font-semibold text-zinc-300 text-sm">No SKUs Found</p>
              <p className="text-xs text-zinc-500 mt-0.5">No variants matched the selected filters.</p>
            </div>
          ) : (
            filteredInventory.map((item) => (
              <div key={item.variantId} className="p-4 space-y-3 hover:bg-[#1A1A22] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-zinc-200">{item.sku}</span>
                    <p className="text-xs text-zinc-400 font-medium">{item.product?.name || 'Product'}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#1C1C24] text-xs font-mono font-bold text-zinc-200 border border-[#2B2B38]">
                    {item.size}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#101014] p-2.5 rounded-xl border border-[#1E1E26] text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Total Stock</span>
                    <span className="font-mono font-bold text-white text-sm">{item.stockQuantity}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-500 block">Reserved</span>
                    <span className="font-mono text-zinc-400 text-sm">{item.reservedQuantity || 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">Available</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{item.availableStock}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {item.status === 'OUT_OF_STOCK' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-full border border-zinc-600 bg-transparent" />
                        <span>Out of Stock</span>
                      </span>
                    )}
                    {item.status === 'LOW_STOCK' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-rose-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>Low Stock</span>
                      </span>
                    )}
                    {item.status === 'IN_STOCK' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>In Stock</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedItemForAdjust(item)}
                    className="px-3 py-1.5 bg-[#1C1C24] hover:bg-[#252532] text-zinc-200 border border-[#2D2D3B] rounded-xl text-xs font-medium inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Sliders size={12} />
                    <span>Adjust</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (>=md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0E0E12] text-zinc-500 font-mono border-b border-[#20202A] uppercase text-[10px] tracking-widest">
              <tr>
                <th className="py-3.5 px-4 font-normal">Variant SKU</th>
                <th className="py-3.5 px-4 font-normal">Product Name</th>
                <th className="py-3.5 px-3 text-center font-normal">Size</th>
                <th className="py-3.5 px-3 text-center font-normal">Stock Count</th>
                <th className="py-3.5 px-3 text-center font-normal">Reserved</th>
                <th className="py-3.5 px-3 text-center font-normal">Available</th>
                <th className="py-3.5 px-4 text-center font-normal">Status</th>
                <th className="py-3.5 px-4 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D26]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-zinc-500" />
                      <span>Loading studio inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-zinc-500">
                    <p className="font-semibold text-zinc-300 text-sm">No SKUs Found</p>
                    <p className="text-xs text-zinc-500 mt-0.5">No variants matched the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  return (
                    <tr key={item.variantId} className="hover:bg-[#1A1A22] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-zinc-200">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-200 font-medium">
                        {item.product?.name || 'Product'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono text-xs text-zinc-300 font-medium">
                          {item.size}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-white font-mono">
                        {item.stockQuantity}
                      </td>
                      <td className="py-3.5 px-3 text-center text-zinc-500 font-mono">
                        {item.reservedQuantity || 0}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-zinc-200 font-mono">
                        {item.availableStock}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'OUT_OF_STOCK' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                            <span className="w-1.5 h-1.5 rounded-full border border-zinc-600 bg-transparent" />
                            <span>Out of Stock</span>
                          </span>
                        )}
                        {item.status === 'LOW_STOCK' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>Low Stock</span>
                          </span>
                        )}
                        {item.status === 'IN_STOCK' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedItemForAdjust(item)}
                          className="px-3 py-1.5 bg-[#1C1C24] hover:bg-[#252532] text-zinc-200 border border-[#2D2D3B] hover:border-[#3D3D4E] rounded-xl transition-all text-xs font-medium inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
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

        {/* Footer */}
        <div className="bg-[#0E0E12] border-t border-[#20202A] p-3 px-4 text-zinc-400 text-xs flex items-center justify-between">
          <span>Displaying {filteredInventory.length} of {inventory.length} total SKUs</span>
          <span className="text-zinc-500 text-[11px] font-mono">Server-authoritative database stock</span>
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
