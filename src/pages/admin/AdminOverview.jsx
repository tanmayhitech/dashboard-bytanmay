import React, { useState, useEffect } from 'react';
import { fetchAdminDashboardMetrics, fetchAdminOrders, fetchAdminInventory } from '../../services/adminService';
import { RecentActivityPanel } from '../../components/admin/RecentActivityPanel';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Database,
  Layers,
  Tag,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const AdminOverview = ({ onNavigateTab, onSelectOrder, onOpenStockModal }) => {
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, ordersRes, invRes] = await Promise.all([
        fetchAdminDashboardMetrics(),
        fetchAdminOrders({ page: 1, limit: 6 }),
        fetchAdminInventory()
      ]);

      if (metricsRes.isOffline || ordersRes.isOffline) {
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }

      setMetrics(metricsRes.data || {
        orders: { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
        payments: { paid_orders: 0, pending_payments: 0, total_paid_revenue_inr: 0 },
        catalog: { total_products: 4, active_products: 4, total_variants: 24, low_stock_variants: 0, out_of_stock_variants: 0 }
      });

      setRecentOrders(ordersRes.orders || []);
      
      const lowStock = (invRes.inventory || []).filter(item => item.stockQuantity <= 5);
      setLowStockItems(lowStock.slice(0, 6));
    } catch (err) {
      console.error('[AdminOverview] Error loading dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Database Connection Notice */}
      {isOffline && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-3">
            <Database size={16} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold block text-amber-200">Local Runtime Mode</span>
              <span className="text-amber-400/90 text-xs">
                Running in local offline mode. Connect live Supabase credentials to sync live production data.
              </span>
            </div>
          </div>
          <button 
            onClick={loadData}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-medium transition-colors rounded-lg flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Settled Revenue */}
        <div className="bg-[#121212] border border-[#222222] p-5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
            <span>Settled Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? '...' : `₹${(metrics?.payments?.total_paid_revenue_inr || 0).toLocaleString('en-IN')}`}
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">● {metrics?.payments?.paid_orders || 0} Paid</span>
            <span>orders settled</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#121212] border border-[#222222] p-5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
            <span>Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <ShoppingBag size={14} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? '...' : metrics?.orders?.total || 0}
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
            <span className="text-amber-400 font-medium">● {metrics?.orders?.pending || 0} Pending</span>
            <span className="text-emerald-400 font-medium">● {metrics?.orders?.confirmed || 0} Confirmed</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#121212] border border-[#222222] p-5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
            <span>Stock Alerts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? '...' : (metrics?.catalog?.low_stock_variants || 0) + (metrics?.catalog?.out_of_stock_variants || 0)}
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
            <span className="text-amber-400 font-medium">Low: {metrics?.catalog?.low_stock_variants || 0}</span>
            <span className="text-rose-400 font-medium">Out: {metrics?.catalog?.out_of_stock_variants || 0}</span>
          </div>
        </div>

        {/* Active Catalog */}
        <div className="bg-[#121212] border border-[#222222] p-5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
            <span>Active Products</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Layers size={14} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {isLoading ? '...' : `${metrics?.catalog?.active_products || 4} Products`}
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
            <span>{metrics?.catalog?.total_variants || 21} Size SKUs</span>
            <span className="text-emerald-400 font-medium">Drop 01 Live</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => onNavigateTab('orders')}
          className="p-3.5 bg-[#121212] hover:bg-[#181818] border border-[#222222] hover:border-[#333333] rounded-xl text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={15} className="text-zinc-400 group-hover:text-white" />
            <span className="text-xs font-medium text-zinc-200 group-hover:text-white">Orders</span>
          </div>
          <ArrowRight size={13} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => onNavigateTab('inventory')}
          className="p-3.5 bg-[#121212] hover:bg-[#181818] border border-[#222222] hover:border-[#333333] rounded-xl text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Package size={15} className="text-zinc-400 group-hover:text-white" />
            <span className="text-xs font-medium text-zinc-200 group-hover:text-white">Inventory</span>
          </div>
          <ArrowRight size={13} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => onNavigateTab('products')}
          className="p-3.5 bg-[#121212] hover:bg-[#181818] border border-[#222222] hover:border-[#333333] rounded-xl text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Layers size={15} className="text-zinc-400 group-hover:text-white" />
            <span className="text-xs font-medium text-zinc-200 group-hover:text-white">Products</span>
          </div>
          <ArrowRight size={13} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => onNavigateTab('coupons')}
          className="p-3.5 bg-[#121212] hover:bg-[#181818] border border-[#222222] hover:border-[#333333] rounded-xl text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Tag size={15} className="text-zinc-400 group-hover:text-white" />
            <span className="text-xs font-medium text-zinc-200 group-hover:text-white">Coupons</span>
          </div>
          <ArrowRight size={13} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => onNavigateTab('influencers')}
          className="p-3.5 bg-[#121212] hover:bg-[#181818] border border-[#222222] hover:border-[#333333] rounded-xl text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles size={15} className="text-amber-400 group-hover:text-white" />
            <span className="text-xs font-medium text-zinc-200 group-hover:text-white">Affiliates</span>
          </div>
          <ArrowRight size={13} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Two Column Section: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recent Orders (7 cols) */}
        <div className="lg:col-span-7 bg-[#121212] border border-[#222222] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">
                Recent Orders
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
              <RefreshCw size={16} className="animate-spin text-zinc-400" />
              <span>Loading orders...</span>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 space-y-1">
              <p className="font-medium text-zinc-400">No orders placed yet</p>
              <p className="text-[11px] text-zinc-600">New customer orders will appear here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1c1c1c]">
              {recentOrders.map((order) => {
                const isPaid = order.payment_status === 'paid';
                return (
                  <div 
                    key={order.id} 
                    onClick={() => onSelectOrder && onSelectOrder(order)}
                    className="py-3 flex items-center justify-between hover:bg-[#181818] px-3 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{order.order_number}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize border ${
                          isPaid 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {order.payment_status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {order.customer_name} • {order.customer_email}
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className="text-xs font-semibold text-white">
                        ₹{order.total_amount?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-zinc-500 capitalize">
                        {order.order_status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Low Stock Alerts (5 cols) */}
        <div className="lg:col-span-5 bg-[#121212] border border-[#222222] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">
                Low Stock Watchlist
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              <span>Manage</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
              <RefreshCw size={16} className="animate-spin text-zinc-400" />
              <span>Checking stock levels...</span>
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="py-12 text-center text-xs space-y-1">
              <CheckCircle2 size={20} className="mx-auto text-emerald-400 mb-1" />
              <p className="font-medium text-emerald-400">All Stock Levels Healthy</p>
              <p className="text-[11px] text-zinc-500">No items below the 5-unit restock threshold.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1c1c1c]">
              {lowStockItems.map((item) => (
                <div key={item.variantId} className="py-2.5 flex items-center justify-between hover:bg-[#181818] px-3 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white">
                      {item.sku}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {item.product?.name} • Size {item.size}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      item.stockQuantity === 0 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {item.stockQuantity} Left
                    </span>

                    <button
                      onClick={() => onOpenStockModal && onOpenStockModal(item)}
                      className="px-2.5 py-1 bg-[#1c1c1c] hover:bg-white hover:text-black border border-[#2d2d2d] text-zinc-200 text-xs font-medium rounded-md transition-colors"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recent Admin Action & Audit Stream */}
      <RecentActivityPanel />
    </div>
  );
};
