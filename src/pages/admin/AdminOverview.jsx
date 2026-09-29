import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminDashboardMetrics, fetchAdminOrders, fetchAdminInventory } from '../../services/adminService';
import { formatOrderNumber } from '../../services/orderService';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Layers, 
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Clock,
  CreditCard,
  Truck,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export const AdminOverview = ({ onNavigateTab, onSelectOrder, onOpenStockModal, isActive = true }) => {
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [metricsRes, ordersRes, invRes] = await Promise.all([
        fetchAdminDashboardMetrics(),
        fetchAdminOrders({ page: 1, limit: 6 }),
        fetchAdminInventory()
      ]);

      setMetrics(metricsRes.data || {
        orders: { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
        payments: { paid_orders: 0, pending_payments: 0, total_paid_revenue_inr: 0 },
        catalog: { total_products: 4, active_products: 4, total_variants: 24, low_stock_variants: 0, out_of_stock_variants: 0 }
      });

      const finalOrders = (ordersRes?.orders && ordersRes.orders.length > 0)
        ? ordersRes.orders
        : (metricsRes?.data?.recentOrders || []);

      setRecentOrders(finalOrders);
      
      const lowStock = (invRes.inventory || []).filter(item => item.stockQuantity <= 5);
      setLowStockItems(lowStock.slice(0, 5));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[AdminOverview] Error loading dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      loadData(false);
    }
  }, [isActive, loadData]);

  useEffect(() => {
    const handleDataUpdate = () => {
      loadData(false);
    };

    window.addEventListener('loozars_orders_updated', handleDataUpdate);
    window.addEventListener('loozars_catalog_updated', handleDataUpdate);
    window.addEventListener('loozars_admin_refresh_all', () => loadData(true));

    return () => {
      window.removeEventListener('loozars_orders_updated', handleDataUpdate);
      window.removeEventListener('loozars_catalog_updated', handleDataUpdate);
      window.removeEventListener('loozars_admin_refresh_all', () => loadData(true));
    };
  }, [loadData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const revenue = metrics?.payments?.total_paid_revenue_inr ?? 0;
  const totalOrders = metrics?.orders?.total ?? 0;
  const lowStockCount = metrics?.catalog?.low_stock_variants ?? lowStockItems.length;
  const productCount = metrics?.catalog?.total_products ?? 4;
  const variantCount = metrics?.catalog?.total_variants ?? 24;

  // Payment Breakdown Calculations
  const codCount = recentOrders.filter(o => o.payment_method === 'cod').length;
  const prepaidCount = Math.max(0, recentOrders.length - codCount);
  const prepaidPercent = recentOrders.length > 0 ? Math.round((prepaidCount / recentOrders.length) * 100) : 0;
  const codPercent = recentOrders.length > 0 ? (100 - prepaidPercent) : 0;

  // Dynamic Product Performance Aggregation from Live Active Orders
  const productSalesMap = {};
  recentOrders.forEach(order => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      order.items.forEach(item => {
        const name = item.product_name || item.name || 'LOOZARS Silhouette';
        const qty = Number(item.quantity || 1);
        const price = Number(item.unit_price || item.price || (order.total_amount ? Math.round(order.total_amount / order.items.length) : 2999));
        if (!productSalesMap[name]) {
          productSalesMap[name] = { name, ordersCount: 0, revenue: 0 };
        }
        productSalesMap[name].ordersCount += qty;
        productSalesMap[name].revenue += (qty * price);
      });
    } else {
      const name = 'LOOZARS Silhouette';
      if (!productSalesMap[name]) {
        productSalesMap[name] = { name, ordersCount: 0, revenue: 0 };
      }
      productSalesMap[name].ordersCount += 1;
      productSalesMap[name].revenue += Number(order.total_amount || 0);
    }
  });

  const computedTopProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4)
    .map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      ordersCount: p.ordersCount,
      revenue: p.revenue
    }));

  const topProducts = computedTopProducts.length > 0 ? computedTopProducts : [
    { rank: 1, name: 'LZR APEX CLUB', ordersCount: 0, revenue: 0 },
    { rank: 2, name: 'LZR VELO 07', ordersCount: 0, revenue: 0 },
    { rank: 3, name: 'LZR RACING DIVISION', ordersCount: 0, revenue: 0 },
    { rank: 4, name: 'LZR OCEAN SPEEDWAY', ordersCount: 0, revenue: 0 }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Overview Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#EDEDF0] tracking-tight">
              {getGreeting()}, Tanmay
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#181820] border border-[#2A2A38] text-[10px] font-medium text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Live Studio Sync</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Store operations overview, revenue channels, and live inventory.
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-[#16161A] hover:bg-[#202028] text-zinc-200 border border-[#262632] rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-zinc-300' : 'text-zinc-400'} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 bg-[#16161A] border border-[#262632] text-xs font-medium text-zinc-200 rounded-xl shadow-xs focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <Calendar size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4 Clean Atmospheric Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Revenue */}
        <div className="bg-[#141418] border border-[#22222C] rounded-2xl p-5 shadow-xs space-y-2 relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">Paid Revenue</span>
            <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
              <TrendingUp size={11} className="text-emerald-400" />
              <span>+12%</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#EDEDF0] tabular-nums font-mono">
            ₹{revenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-zinc-500">Collected online & delivered COD</p>
        </div>

        {/* Metric 2: Orders */}
        <div className="bg-[#141418] border border-[#22222C] rounded-2xl p-5 shadow-xs space-y-2 relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">Total Orders</span>
            <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
              <TrendingUp size={11} className="text-sky-400" />
              <span>+8%</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#EDEDF0] tabular-nums font-mono">
            {totalOrders}
          </div>
          <p className="text-[11px] text-zinc-500">Total customer drop orders</p>
        </div>

        {/* Metric 3: Low Stock */}
        <div className="bg-[#141418] border border-[#22222C] rounded-2xl p-5 shadow-xs space-y-2 relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">Stock Status</span>
            {lowStockCount > 0 ? (
              <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-800/60 font-mono">
                {lowStockCount} Critical
              </span>
            ) : (
              <span className="text-[10px] font-medium text-zinc-400 bg-[#1C1C24] px-2 py-0.5 rounded-md border border-[#2B2B38]">
                Healthy
              </span>
            )}
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums font-mono ${lowStockCount > 0 ? 'text-rose-300' : 'text-[#EDEDF0]'}`}>
            {lowStockCount}
          </div>
          <p className="text-[11px] text-zinc-500">
            {lowStockCount > 0 ? 'Sizes with ≤ 5 units left' : 'All sizes well stocked'}
          </p>
        </div>

        {/* Metric 4: Products */}
        <div className="bg-[#141418] border border-[#22222C] rounded-2xl p-5 shadow-xs space-y-2 relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">Active Catalog</span>
            <span className="text-[10px] font-medium text-zinc-400 bg-[#1C1C24] px-2 py-0.5 rounded-md border border-[#2B2B38]">
              Live
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#EDEDF0] tabular-nums font-mono">
            {productCount}
          </div>
          <p className="text-[11px] text-zinc-500">{variantCount} size variants tracked</p>
        </div>

      </div>

      {/* Payment Channels & Studio Health Bar */}
      <div className="bg-[#16161A] border border-[#262632] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-200">Payment Method Distribution</span>
          </div>
          <p className="text-[11px] text-zinc-400">Prepaid Online vs. Cash on Delivery (COD) volume</p>
        </div>

        <div className="w-full md:max-w-md space-y-2.5">
          {/* Native Flat Split Progress Bar */}
          <div className="w-full h-2.5 bg-[#101014] rounded-full overflow-hidden flex gap-1 p-0.5 border border-[#22222C]">
            <div 
              style={{ width: `${prepaidPercent}%` }} 
              className="h-full bg-emerald-500/80 rounded-l-full transition-all duration-500" 
              title={`Online Prepaid: ${prepaidPercent}%`} 
            />
            <div 
              style={{ width: `${codPercent}%` }} 
              className="h-full bg-sky-500/80 rounded-r-full transition-all duration-500" 
              title={`Cash on Delivery: ${codPercent}%`} 
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-xs" />
              <span>Prepaid Online ({prepaidPercent}%)</span>
            </span>
            <span className="text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block shadow-xs" />
              <span>Cash on Delivery ({codPercent}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders (Left 8 cols) & Low Stock + Top Products (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Orders Table */}
        <div className="lg:col-span-8 bg-[#16161A] border border-[#262632] rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          
          <div>
            <div className="p-4 sm:p-5 border-b border-[#24242E] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#EDEDF0]">Recent Transactions</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Live store transactions across online and cash on delivery.</p>
              </div>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View all orders</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#121216] border-b border-[#24242E] text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202028]">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-zinc-500 text-xs">
                        No customer orders found yet.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((ord) => {
                      const isCod = ord.payment_method === 'cod';
                      const isPaid = ord.payment_status === 'paid';
                      let rawItems = [];
                      if (Array.isArray(ord.items)) {
                        rawItems = ord.items;
                      } else if (typeof ord.items === 'string') {
                        try { rawItems = JSON.parse(ord.items); } catch (e) { rawItems = []; }
                      }
                      const itemCount = Array.isArray(rawItems) && rawItems.length > 0 
                        ? rawItems.reduce((sum, i) => sum + Number(i.quantity || 1), 0) 
                        : 1;
                      const orderNum = formatOrderNumber(ord.order_number || ord.orderNumber || ord.id);
                      const customerName = ord.customer_name || 
                        (ord.shipping_address?.first_name ? `${ord.shipping_address.first_name} ${ord.shipping_address.last_name || ''}`.trim() : null) || 
                        ord.customer_email || 
                        'Store Customer';

                      return (
                        <tr 
                          key={ord.id || ord.order_number} 
                          onClick={() => onSelectOrder(ord)}
                          className="hover:bg-[#1A1A22] transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-mono font-medium text-[#EDEDF0]">
                            {orderNum}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-zinc-300">
                            {customerName}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#EDEDF0] tabular-nums">
                            ₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            {isCod ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-950/60 text-sky-300 border border-sky-800/60 shadow-xs font-mono">
                                COD Pending
                              </span>
                            ) : isPaid ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-xs font-mono">
                                Paid Online
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-zinc-500 font-medium">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {ord.order_status === 'delivered' ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Delivered
                              </span>
                            ) : ord.order_status === 'shipped' ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Shipped
                              </span>
                            ) : ord.order_status === 'processing' ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Processing
                              </span>
                            ) : ord.order_status === 'cancelled' ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Cancelled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" /> {ord.order_status || 'Pending'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onSelectOrder(ord)}
                              className="px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#1E1E26] rounded-lg transition-all inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Details</span>
                              <ChevronRight size={12} className="text-zinc-500" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Low Stock & Top Products */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Low Stock Panel */}
          <div className="bg-[#16161A] border border-[#262632] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#24242E]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-400" />
                <span>Low Stock Thresholds</span>
              </h2>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                View Inventory
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                All inventory items are well stocked.
              </div>
            ) : (
              <div className="divide-y divide-[#202028] text-xs">
                {lowStockItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => onOpenStockModal && onOpenStockModal(item)}
                    className="py-3 flex items-center justify-between cursor-pointer group hover:bg-[#1A1A22] px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{item.productName || 'LOOZARS Silhouette'}</p>
                      <p className="text-zinc-500 text-[11px]">Size {item.size || 'M'} · SKU: {item.sku}</p>
                    </div>
                    <span className="font-mono font-medium text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded-md text-xs border border-rose-800/50">
                      {item.stockQuantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Products Panel */}
          <div className="bg-[#16161A] border border-[#262632] rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#24242E]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Zap size={13} className="text-zinc-400" />
                <span>Top Products</span>
              </h2>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Catalog
              </button>
            </div>

            <div className="divide-y divide-[#202028] text-xs">
              {topProducts.map((p) => (
                <div key={p.rank} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-400 font-bold text-xs w-5 h-5 rounded-full bg-[#1C1C24] border border-[#2C2C38] flex items-center justify-center">
                      {p.rank}
                    </span>
                    <div>
                      <p className="font-semibold text-zinc-200">{p.name}</p>
                      <p className="text-zinc-500 text-[11px]">{p.ordersCount} drop purchases</p>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-[#EDEDF0] tabular-nums">
                    ₹{p.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
