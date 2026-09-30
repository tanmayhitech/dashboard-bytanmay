import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchAdminOrders, 
  updateOrderStatus, 
  archiveAdminOrder, 
  restoreAdminOrder,
  deleteAdminOrder 
} from '../../services/adminService';
import { formatOrderNumber } from '../../services/orderService';
import { AdminOrderDetailModal } from './AdminOrderDetailModal';
import { ThermalPackingSlipModal } from '../../components/admin/ThermalPackingSlipModal';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  Tag, 
  CreditCard, 
  Banknote,
  Archive,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Database,
  XCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

export const AdminOrders = ({ searchQueryProp = '' }) => {
  const { showToast } = useAdminFeedback();
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  // Filters & Pagination
  const [orderStatus, setOrderStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState(searchQueryProp || '');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [packingSlipOrder, setPackingSlipOrder] = useState(null);
  const [archiveTargetOrder, setArchiveTargetOrder] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [deleteTargetOrder, setDeleteTargetOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (searchQueryProp !== undefined) {
      setSearchQuery(searchQueryProp);
    }
  }, [searchQueryProp]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminOrders({
        page,
        limit,
        orderStatus,
        paymentStatus,
        search: searchQuery
      });
      setIsOffline(Boolean(res.isOffline));
      setOrders(res.orders || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('[AdminOrders] Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, orderStatus, paymentStatus, searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const handleOrderUpdate = () => {
      loadOrders();
    };
    window.addEventListener('loozars_orders_updated', handleOrderUpdate);
    window.addEventListener('loozars_returns_updated', handleOrderUpdate);
    return () => {
      window.removeEventListener('loozars_orders_updated', handleOrderUpdate);
      window.removeEventListener('loozars_returns_updated', handleOrderUpdate);
    };
  }, [loadOrders]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handleOrderUpdated = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
    if (selectedOrder && selectedOrder.id === updatedOrder.id) {
      setSelectedOrder({ ...selectedOrder, ...updatedOrder });
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTargetOrder) return;
    setIsArchiving(true);
    try {
      const res = await archiveAdminOrder({
        orderId: archiveTargetOrder.id,
        reason: archiveReason || 'Archived by Admin'
      });
      if (res.success) {
        showToast('Order Archived', `Order #${archiveTargetOrder.order_number} has been safely archived.`, 'success');
        setArchiveTargetOrder(null);
        setArchiveReason('');
        loadOrders();
      } else {
        showToast('Archive Failed', res.error || 'Could not archive order.', 'error');
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to archive order.', 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (e, order) => {
    e.stopPropagation();
    try {
      const res = await restoreAdminOrder({ orderId: order.id });
      if (res.success) {
        showToast('Order Restored', `Order #${order.order_number} restored to pending queue.`, 'success');
        loadOrders();
      } else {
        showToast('Restore Failed', res.error || 'Could not restore order.', 'error');
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to restore order.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetOrder) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminOrder({ orderId: deleteTargetOrder.id });
      if (res.success) {
        showToast('Order Deleted', `Order #${deleteTargetOrder.order_number} has been permanently deleted.`, 'success');
        setDeleteTargetOrder(null);
        loadOrders();
      } else {
        showToast('Delete Failed', res.error || 'Could not delete order.', 'error');
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to delete order.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Confirmed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Processing</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Shipped</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span>Delivered</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Cancelled</span>
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Returned</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <span>Archived</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (order) => {
    const method = order.payment_method || 'online';
    const status = order.payment_status || 'pending';

    if (method === 'cod') {
      if (status === 'paid') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-xs font-mono">
            <Banknote size={11} /> COD Paid
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-950/60 text-sky-300 border border-sky-800/60 shadow-xs font-mono">
          <Banknote size={11} /> COD Pending
        </span>
      );
    }

    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-xs font-mono">
          <CreditCard size={11} /> Paid Online
        </span>
      );
    } else if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60 shadow-xs font-mono">
          <XCircle size={11} /> Failed
        </span>
      );
    } else if (status === 'refunded') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/60 shadow-xs font-mono">
          Refunded
        </span>
      );
    }

    return (
      <span className="text-[11px] font-mono text-zinc-500 font-medium">
        Unpaid
      </span>
    );
  };

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

  const formatDateTime = (dateVal) => {
    if (!dateVal) return { date: 'N/A', time: '' };
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return { date: 'N/A', time: '' };
      return {
        date: d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        time: d.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };
    } catch {
      return { date: 'N/A', time: '' };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-bold text-[#EDEDF0] tracking-tight">Orders Ledger</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time fulfillment tracking, online payment verification, and cash collection ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="px-3.5 py-2 bg-[#16161A] hover:bg-[#202028] text-zinc-200 border border-[#262632] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-xs text-amber-300 flex items-center gap-2.5">
          <Database size={15} className="shrink-0 text-amber-400" />
          <span>Database offline: Orders loaded from local backup. Live updates require Supabase connection.</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#121216] p-1.5 rounded-2xl border border-[#22222C] text-xs overflow-x-auto">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'pending', label: 'Pending' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'processing', label: 'Processing' },
          { id: 'shipped', label: 'Shipped' },
          { id: 'delivered', label: 'Delivered' },
          { id: 'returns', label: 'Returns & Refunds' },
          { id: 'cancelled', label: 'Cancelled' },
          { id: 'archived', label: 'Archived' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setOrderStatus(tab.id);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
              orderStatus === tab.id
                ? 'bg-[#22222C] text-white border border-[#3A3A4C] shadow-xs font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Secondary Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by order #, customer name, email, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#16161A] border border-[#262632] focus:border-zinc-500 text-zinc-100 pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none transition-colors placeholder-zinc-600 shadow-xs"
          />
        </div>

        {/* Payment Filter */}
        <div className="md:col-span-4">
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#16161A] border border-[#262632] focus:border-zinc-500 text-zinc-200 px-3.5 py-2.5 text-xs rounded-xl outline-none transition-colors cursor-pointer shadow-xs"
          >
            <option value="all">All Payment Methods & Statuses</option>
            <option value="paid">Paid (Online / Verified)</option>
            <option value="pending">Pending Payment</option>
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="failed">Failed Payment</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#16161A] border border-[#262632] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#121216] text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-semibold border-b border-[#24242E]">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Channel / Code</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3 text-center">Items</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Fulfillment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202028]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-zinc-500" />
                      <span className="text-xs">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-zinc-500">
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-300 text-sm">No Orders Found</p>
                      <p className="text-xs text-zinc-500">No orders match the selected filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const itemCount = getItemsCount(order.items);
                  const { date: dateStr, time: timeStr } = formatDateTime(order.created_at);
                  const isArchived = order.is_archived || order.order_status === 'archived';

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-[#1A1A22] transition-colors cursor-pointer ${isArchived ? 'bg-[#121216]/60 opacity-65' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="py-3.5 px-4">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            const formatted = formatOrderNumber(order.order_number);
                            navigator.clipboard?.writeText(formatted);
                            showToast('Copied', formatted, 'info');
                          }}
                          className="text-[#EDEDF0] hover:text-white font-semibold block font-mono transition-colors cursor-pointer"
                          title="Click to copy order #"
                        >
                          {formatOrderNumber(order.order_number)}
                        </span>
                        {order.tracking_number && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                            <Truck size={10} className="text-zinc-500" /> {order.tracking_number}
                          </span>
                        )}
                        {order.return_status && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/50 mt-1 font-mono">
                            <RotateCcw size={8} /> Return: {order.return_status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-zinc-200 font-medium">{order.customer_name || 'Customer'}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[170px]">{order.customer_email || '—'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {order.coupon_code || order.influencer_handle || order.influencer_name ? (
                          <div className="flex flex-col gap-0.5">
                            {order.coupon_code && (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard?.writeText(order.coupon_code);
                                  showToast('Copied Coupon', order.coupon_code, 'info');
                                }}
                                className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-300 hover:text-white bg-[#1A1A22] hover:bg-[#22222E] border border-[#282834] px-2 py-0.5 rounded-md w-fit font-medium max-w-[140px] truncate transition-colors cursor-pointer" 
                                title="Click to copy promo code"
                              >
                                <Tag size={9} className="text-zinc-500 shrink-0" />
                                <span className="truncate">{order.coupon_code}</span>
                              </span>
                            )}
                            {(order.influencer_handle || order.influencer_name) && (
                              <span className="text-[11px] text-zinc-400 font-mono">
                                @{order.influencer_handle || 'creator'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px] font-mono">Direct</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-zinc-300 font-medium block">{dateStr}</span>
                        {timeStr && (
                          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                            <Clock size={10} className="text-zinc-500" />
                            {timeStr}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center text-zinc-300 font-mono font-medium">
                        {itemCount}
                      </td>

                      <td className="py-3.5 px-4 text-right text-[#EDEDF0] font-bold font-mono">
                        ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getPaymentBadge(order)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getOrderStatusBadge(order.display_status || order.order_status)}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPackingSlipOrder(order)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#1E1E26] rounded-lg transition-colors cursor-pointer"
                            title="Print Packing Slip / Bill"
                          >
                            <Printer size={13} />
                          </button>
                          
                          {isArchived ? (
                            <button
                              onClick={(e) => handleRestore(e, order)}
                              className="p-1.5 text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Restore Order"
                            >
                              <RotateCcw size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setArchiveTargetOrder(order);
                              }}
                              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-[#1E1E26] rounded-lg transition-colors cursor-pointer"
                              title="Archive Order"
                            >
                              <Archive size={13} />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetOrder(order);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Order Permanently"
                          >
                            <Trash2 size={13} />
                          </button>

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1 text-zinc-300 hover:text-white hover:bg-[#1E1E26] rounded-lg transition-all text-xs font-medium inline-flex items-center gap-0.5 ml-0.5 cursor-pointer"
                          >
                            <span>Details</span>
                            <ChevronRight size={12} className="text-zinc-500" />
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
        <div className="bg-[#121216] border-t border-[#24242E] p-4 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div>
            Showing <span className="font-semibold text-zinc-200">{orders.length}</span> of <span className="font-semibold text-zinc-200">{totalCount}</span> orders
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-[#16161A] hover:bg-[#202028] disabled:opacity-40 text-zinc-300 border border-[#262632] rounded-xl flex items-center gap-1 transition-colors disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronLeft size={13} />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1 font-mono text-zinc-300">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-[#16161A] hover:bg-[#202028] disabled:opacity-40 text-zinc-300 border border-[#262632] rounded-xl flex items-center gap-1 transition-colors disabled:cursor-not-allowed shadow-xs"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Archive Modal */}
      {archiveTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-[#16161A] border border-[#262632] w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 text-xs text-[#EDEDF0]">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <Archive size={16} />
              <span>Archive Order #{archiveTargetOrder.order_number}</span>
            </div>
            
            <p className="text-zinc-400 leading-relaxed">
              Archiving hides this order from the active queue and deducts it from active revenue while preserving ledger audit history.
            </p>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-medium block">Reason for archiving (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Test order, Customer requested cancellation"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full bg-[#121216] border border-[#262632] text-zinc-100 px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-500 placeholder-zinc-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#24242E]">
              <button
                type="button"
                onClick={() => setArchiveTargetOrder(null)}
                className="px-4 py-2 bg-[#121216] hover:bg-[#1C1C24] text-zinc-300 border border-[#262632] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                disabled={isArchiving}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                {isArchiving ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Modal */}
      {deleteTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-[#16161A] border border-rose-900/50 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 text-xs text-[#EDEDF0]">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <Trash2 size={16} />
              <span>Permanently Delete Order #{deleteTargetOrder.order_number}</span>
            </div>
            
            <p className="text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete this order? This will immediately remove it from all database records and decrease total revenue by <span className="text-rose-300 font-bold font-mono">₹{Number(deleteTargetOrder.total_amount || 0).toLocaleString('en-IN')}</span>.
            </p>

            <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-rose-300 text-[11px]">
              Warning: This action cannot be undone.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#24242E]">
              <button
                type="button"
                onClick={() => setDeleteTargetOrder(null)}
                className="px-4 py-2 bg-[#121216] hover:bg-[#1C1C24] text-zinc-300 border border-[#262632] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <AdminOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={handleOrderUpdated}
          onOrderArchived={loadOrders}
        />
      )}

      {/* Thermal Packing Slip Modal */}
      {packingSlipOrder && (
        <ThermalPackingSlipModal
          order={packingSlipOrder}
          onClose={() => setPackingSlipOrder(null)}
        />
      )}

    </div>
  );
};
