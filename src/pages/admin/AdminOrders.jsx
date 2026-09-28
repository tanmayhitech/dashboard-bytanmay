import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminOrders } from '../../services/adminService';
import { AdminOrderDetailModal } from './AdminOrderDetailModal';
import { ThermalPackingSlipModal } from '../../components/admin/ThermalPackingSlipModal';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Truck,
  Database,
  Tag,
  Sparkles,
  Printer
} from 'lucide-react';

export const AdminOrders = ({ initialSelectedOrder = null }) => {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [orderStatus, setOrderStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(initialSelectedOrder);
  const [packingSlipOrder, setPackingSlipOrder] = useState(null);


  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminOrders({
        page,
        limit,
        orderStatus,
        paymentStatus,
        searchQuery: debouncedSearch
      });

      setIsOffline(Boolean(res.isOffline));
      setOrders(res.orders || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('[AdminOrders] Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, orderStatus, paymentStatus, debouncedSearch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time synchronization across local events & purchases
  useEffect(() => {
    const handleRefresh = () => {
      loadOrders();
    };

    window.addEventListener('loozars_orders_updated', handleRefresh);
    window.addEventListener('loozars_influencer_updated', handleRefresh);
    window.addEventListener('loozars_catalog_updated', handleRefresh);

    return () => {
      window.removeEventListener('loozars_orders_updated', handleRefresh);
      window.removeEventListener('loozars_influencer_updated', handleRefresh);
      window.removeEventListener('loozars_catalog_updated', handleRefresh);
    };
  }, [loadOrders]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handleOrderUpdated = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
    if (selectedOrder && selectedOrder.id === updatedOrder.id) {
      setSelectedOrder({ ...selectedOrder, ...updatedOrder });
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">Confirmed</span>;
      case 'processing':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">Processing</span>;
      case 'shipped':
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">Shipped</span>;
      case 'delivered':
        return <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">Delivered</span>;
      case 'cancelled':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">Cancelled</span>;
      case 'pending':
      default:
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">Pending</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Orders & Shipments
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            View customer orders, verify payment gateways, and manage order fulfillment states
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
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
          <span>Database offline: Live order queries require Supabase connection credentials.</span>
        </div>
      )}

      {/* Controls Bar: Search & Status Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input (6 cols) */}
        <div className="md:col-span-6 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by order #, customer name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white pl-10 pr-4 py-2.5 text-xs rounded-xl outline-none transition-colors placeholder-zinc-500"
          />
        </div>

        {/* Order Status Filter (3 cols) */}
        <div className="md:col-span-3">
          <select
            value={orderStatus}
            onChange={(e) => {
              setOrderStatus(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white px-3.5 py-2.5 text-xs rounded-xl outline-none transition-colors cursor-pointer"
          >
            <option value="all">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Status Filter (3 cols) */}
        <div className="md:col-span-3">
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white px-3.5 py-2.5 text-xs rounded-xl outline-none transition-colors cursor-pointer"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending Payment</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#161616] text-zinc-400 text-[11px] font-medium border-b border-[#222222]">
              <tr>
                <th className="py-3.5 px-5">Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Creator / Coupon</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-center">Order Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-zinc-400" />
                      <span>Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-zinc-500">
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-400">No Orders Found</p>
                      <p className="text-xs">No orders match the selected filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const getItemsCount = (rawItems) => {
                    if (Array.isArray(rawItems)) return rawItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
                    if (typeof rawItems === 'string') {
                      try {
                        const p = JSON.parse(rawItems);
                        if (Array.isArray(p)) return p.reduce((sum, item) => sum + (item.quantity || 1), 0);
                      } catch {}
                    }
                    return 0;
                  };

                  const formatDate = (dateVal) => {
                    if (!dateVal) return 'N/A';
                    try {
                      const d = new Date(dateVal);
                      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                    } catch {
                      return 'N/A';
                    }
                  };

                  const isPaid = order.payment_status === 'paid';
                  const itemCount = getItemsCount(order.items);
                  const dateStr = formatDate(order.created_at);

                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-[#181818] transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="py-3.5 px-5">
                        <span className="text-white font-semibold block">{order.order_number}</span>
                        {order.tracking_number && (
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Truck size={11} /> {order.tracking_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium">{order.customer_name}</div>
                        <div className="text-[11px] text-zinc-400">{order.customer_email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {order.coupon_code || order.influencer_handle || order.influencer_name ? (
                          <div className="flex flex-col gap-0.5">
                            {order.coupon_code && (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded w-fit font-bold">
                                🏷️ {order.coupon_code}
                              </span>
                            )}
                            {(order.influencer_handle || order.influencer_name) && (
                              <span className="text-[11px] text-zinc-300 font-medium">
                                @{order.influencer_handle || 'creator'} {order.influencer_name ? `(${order.influencer_name})` : ''}
                              </span>
                            )}
                            {Number(order.influencer_commission_amount) > 0 && (
                              <span className="text-[10px] text-emerald-400 font-medium">
                                Comm: ₹{Number(order.influencer_commission_amount).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">Direct Sale</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 text-xs">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 text-center text-white font-medium">
                        {itemCount}
                      </td>
                      <td className="py-3.5 px-4 text-right text-white font-semibold">
                        ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium capitalize border ${
                          isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getOrderStatusBadge(order.order_status)}
                      </td>
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPackingSlipOrder(order)}
                            className="p-1.5 bg-[#1a1a1a] hover:bg-white hover:text-black text-zinc-300 border border-[#2d2d2d] rounded-lg transition-colors text-xs font-medium"
                            title="Print Official Retail Bill / Invoice (A4 / PDF)"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1 bg-[#1c1c1c] hover:bg-white hover:text-black text-zinc-200 border border-[#2d2d2d] rounded-lg transition-colors text-xs font-medium inline-flex items-center gap-1.5"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-[#161616] border-t border-[#202020] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div>
            Showing <span className="text-white font-semibold">{orders.length}</span> of <span className="text-white font-semibold">{totalCount}</span> total orders
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 bg-[#121212] hover:bg-[#1f1f1f] disabled:opacity-30 border border-[#282828] rounded-lg text-white transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs">
              Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 bg-[#121212] hover:bg-[#1f1f1f] disabled:opacity-30 border border-[#282828] rounded-lg text-white transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <AdminOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}

      {/* Quick Print Thermal Packing Slip Modal */}
      {packingSlipOrder && (
        <ThermalPackingSlipModal
          order={packingSlipOrder}
          onClose={() => setPackingSlipOrder(null)}
        />
      )}
    </div>
  );
};

