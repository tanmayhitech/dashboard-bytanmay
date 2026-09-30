import React, { useState, useEffect } from 'react';
import { 
  updateOrderStatus, 
  fetchOrderEmailEvents, 
  archiveAdminOrder, 
  restoreAdminOrder,
  updateOrderPaymentStatus,
  deleteAdminOrder,
  fetchOrderReturns,
  createOrderReturnRequest,
  updateOrderReturnStatus,
  executeOrderRefund
} from '../../services/adminService';
import { formatOrderNumber } from '../../services/orderService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { ThermalPackingSlipModal } from '../../components/admin/ThermalPackingSlipModal';
import { 
  X, 
  Package, 
  MapPin, 
  User, 
  CreditCard, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  Database,
  Mail,
  Tag,
  Printer,
  Archive,
  RotateCcw,
  Trash2,
  Banknote,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Compass,
  FileText,
  RotateCw,
  Undo2,
  DollarSign,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const AdminOrderDetailModal = ({ order, onClose, onOrderUpdated, onOrderArchived }) => {
  const { showToast, executeAction } = useAdminFeedback();
  const [currentStatus, setCurrentStatus] = useState(order?.order_status || 'pending');
  const [selectedStatus, setSelectedStatus] = useState(order?.order_status || 'pending');
  const [paymentStatus, setPaymentStatus] = useState(order?.payment_status || 'pending');
  const [notes, setNotes] = useState(order?.notes || '');
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [courierName, setCourierName] = useState(order?.courier_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [emailEvents, setEmailEvents] = useState([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [showPackingSlip, setShowPackingSlip] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Return & Refund States
  const [orderReturn, setOrderReturn] = useState(null);
  const [isLoadingReturn, setIsLoadingReturn] = useState(false);
  const [showInitiateReturnForm, setShowInitiateReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('Fit / Sizing Issue');
  const [returnAdminRemarks, setReturnAdminRemarks] = useState('');
  const [isProcessingReturnAction, setIsProcessingReturnAction] = useState(false);


  useEffect(() => {
    if (order?.id) {
      loadEmailEvents(order.id);
      loadReturnData(order.id);
    }
  }, [order?.id]);

  const loadReturnData = async (orderId) => {
    if (!orderId) return;
    setIsLoadingReturn(true);
    try {
      const res = await fetchOrderReturns({ orderId });
      if (res.success && Array.isArray(res.returns) && res.returns.length > 0) {
        setOrderReturn(res.returns[0]);
      } else {
        setOrderReturn(null);
      }
    } catch (err) {
      console.warn('[AdminOrderDetailModal] Failed to load return data:', err);
      setOrderReturn(null);
    } finally {
      setIsLoadingReturn(false);
    }
  };

  const handleInitiateReturn = async (e) => {
    e?.preventDefault();
    setIsProcessingReturnAction(true);
    try {
      const itemsList = parseItems(order.items);
      const res = await createOrderReturnRequest({
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        items: itemsList,
        returnReason,
        refundAmount: order.total_amount || 0,
        restockInventory: true,
        adminNotes: returnAdminRemarks
      });

      if (res.success) {
        showToast('Return Initiated', `Return request logged for #${order.order_number}`, 'success');
        setOrderReturn(res.returnRequest);
        setShowInitiateReturnForm(false);
      } else {
        showToast('Failed', res.error || 'Could not initiate return.', 'error');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsProcessingReturnAction(false);
    }
  };

  const handleUpdateReturnStatusAction = async (newStatus, restock = true) => {
    if (!orderReturn?.id) return;
    setIsProcessingReturnAction(true);
    try {
      const res = await updateOrderReturnStatus({
        returnId: orderReturn.id,
        newStatus,
        adminNotes: returnAdminRemarks || orderReturn.admin_notes,
        restock
      });

      if (res.success) {
        showToast('Return Status Updated', `Return marked as ${newStatus.toUpperCase()}`, 'success');
        setOrderReturn(prev => ({ ...prev, status: newStatus }));
      } else {
        showToast('Error', res.error, 'error');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsProcessingReturnAction(false);
    }
  };

  const handleExecuteRefundAction = async () => {
    if (!orderReturn?.id) return;
    setIsProcessingReturnAction(true);
    try {
      const res = await executeOrderRefund({
        returnId: orderReturn.id,
        orderId: order.id,
        refundAmount: orderReturn.refund_amount || order.total_amount,
        reason: orderReturn.return_reason,
        restock: true,
        adminNotes: returnAdminRemarks
      });

      if (res.success) {
        showToast('Refund Processed', `₹${(orderReturn.refund_amount || order.total_amount).toLocaleString('en-IN')} refunded successfully.`, 'success');
        setOrderReturn(prev => ({ ...prev, status: 'refunded', refund_status: 'processed', refund_transaction_id: res.data?.refundTransactionId || res.refundTransactionId }));
        setPaymentStatus('refunded');
        if (onOrderUpdated) {
          onOrderUpdated({ ...order, payment_status: 'refunded' });
        }
      } else {
        showToast('Refund Failed', res.error || 'Could not execute refund.', 'error');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsProcessingReturnAction(false);
    }
  };

  const loadEmailEvents = async (orderId) => {
    if (!orderId) return;
    setIsLoadingEmails(true);
    try {
      const res = await fetchOrderEmailEvents(orderId);
      const list = Array.isArray(res?.events) ? res.events : (Array.isArray(res) ? res : []);
      setEmailEvents(list);
    } catch (err) {
      console.warn('[AdminOrderDetailModal] Failed to load email events:', err);
      setEmailEvents([]);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  if (!order) return null;

  const isArchived = currentStatus === 'archived';
  const isCOD = order.payment_method === 'cod';

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    showToast('Copied to Clipboard', text, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Safe data parsers
  const parseAddress = (addr) => {
    if (!addr) return {};
    if (typeof addr === 'object' && addr !== null) return addr;
    if (typeof addr === 'string') {
      try {
        const parsed = JSON.parse(addr);
        return typeof parsed === 'object' && parsed !== null ? parsed : { address: addr };
      } catch {
        return { address: addr };
      }
    }
    return {};
  };

  const parseItems = (rawItems) => {
    if (!rawItems) return [];
    if (Array.isArray(rawItems)) return rawItems;
    if (typeof rawItems === 'string') {
      try {
        const parsed = JSON.parse(rawItems);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    } catch {
      return 'N/A';
    }
  };

  const getNextAvailableStatuses = (status) => {
    switch (status) {
      case 'pending':
        return ['pending', 'confirmed', 'cancelled'];
      case 'confirmed':
        return ['confirmed', 'processing', 'cancelled'];
      case 'processing':
        return ['processing', 'shipped', 'cancelled'];
      case 'shipped':
        return ['shipped', 'delivered'];
      case 'delivered':
        return ['delivered'];
      case 'cancelled':
        return ['cancelled'];
      case 'archived':
        return ['archived', 'pending'];
      default:
        return ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    }
  };

  const allowedStatuses = getNextAvailableStatuses(currentStatus);
  const isTerminal = currentStatus === 'delivered' || currentStatus === 'cancelled';

  const handleUpdate = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const isStatusChanging = selectedStatus !== currentStatus;
    let actionTitle = `Order #${order.order_number} updated`;
    if (isStatusChanging) {
      if (selectedStatus === 'shipped') actionTitle = `Order #${order.order_number} marked as shipped`;
      else if (selectedStatus === 'delivered') actionTitle = `Order #${order.order_number} marked as delivered`;
      else if (selectedStatus === 'cancelled') actionTitle = `Order #${order.order_number} cancelled`;
      else if (selectedStatus === 'processing') actionTitle = `Order #${order.order_number} moved to processing`;
      else if (selectedStatus === 'confirmed') actionTitle = `Order #${order.order_number} confirmed`;
    }

    setIsUpdating(true);

    const outcome = await executeAction(
      `order_update_${order.id}`,
      () => updateOrderStatus({
        orderId: order.id,
        newStatus: selectedStatus,
        notes: notes.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        courierName: courierName.trim() || null
      }),
      {
        label: 'Updating order status...',
        successTitle: actionTitle,
        errorTitle: 'Order status could not be changed',
        entityType: 'order',
        entityId: order.order_number || order.id,
        detail: `Status: ${selectedStatus.toUpperCase()}`
      }
    );

    setIsUpdating(false);

    if (outcome.success) {
      setCurrentStatus(selectedStatus);
      setSuccessMessage(actionTitle);
      loadEmailEvents(order.id);
      if (onOrderUpdated) {
        onOrderUpdated({
          ...order,
          order_status: selectedStatus,
          notes,
          tracking_number: trackingNumber,
          courier_name: courierName
        });
      }
    } else {
      setErrorMessage(outcome.error);
    }
  };

  const handleMarkPaymentStatus = async (newPaymentStatus) => {
    setIsUpdatingPayment(true);
    try {
      const res = await updateOrderPaymentStatus({
        orderId: order.id,
        newPaymentStatus
      });
      if (res.success) {
        setPaymentStatus(newPaymentStatus);
        showToast('Payment Status Updated', `Payment marked as ${newPaymentStatus.toUpperCase()}`, 'success');
        if (onOrderUpdated) {
          onOrderUpdated({
            ...order,
            payment_status: newPaymentStatus
          });
        }
      } else {
        showToast('Failed', res.error || 'Could not update payment status', 'error');
      }
    } catch (err) {
      showToast('Error', err.message || 'Payment update error', 'error');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleArchive = async () => {
    try {
      const res = await archiveAdminOrder({ orderId: order.id, reason: 'Archived from order detail modal' });
      if (res.success) {
        showToast('Order Archived', `Order #${order.order_number} archived.`, 'success');
        if (onOrderArchived) onOrderArchived();
        else if (onOrderUpdated) onOrderUpdated({ ...order, order_status: 'archived' });
        onClose();
      } else {
        showToast('Error', res.error, 'error');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleRestore = async () => {
    try {
      const res = await restoreAdminOrder({ orderId: order.id });
      if (res.success) {
        setCurrentStatus('pending');
        setSelectedStatus('pending');
        showToast('Order Restored', `Order #${order.order_number} restored.`, 'success');
        if (onOrderUpdated) onOrderUpdated({ ...order, order_status: 'pending' });
      } else {
        showToast('Error', res.error, 'error');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteAdminOrder({ orderId: order.id });
      if (res.success) {
        showToast('Order Deleted', `Order #${order.order_number} has been permanently deleted.`, 'success');
        if (onOrderArchived) onOrderArchived();
        else if (onOrderUpdated) onOrderUpdated({ ...order, isDeleted: true });
        onClose();
      } else {
        showToast('Delete Failed', res.error || 'Could not delete order.', 'error');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isPaid = paymentStatus === 'paid';
  const items = parseItems(order.items);
  const address = parseAddress(order.shipping_address);
  const eventsList = Array.isArray(emailEvents) ? emailEvents : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xs animate-fadeIn font-sans">
      <div 
        className="bg-[#141418] border border-[#242430] w-full max-w-3xl max-h-[96vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col font-sans text-[#EDEDF0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#121216]/95 backdrop-blur-md border-b border-[#22222C] p-4 sm:p-5 px-4 sm:px-6 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                {formatOrderNumber(order.order_number)}
              </span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{isCOD ? 'COD Paid' : 'Paid'}</span>
                </span>
              ) : isCOD ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-sky-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>COD Pending</span>
                </span>
              ) : (
                <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500">Unpaid</span>
              )}
              <span className="text-[10px] sm:text-[11px] bg-[#1C1C24] text-zinc-300 px-2 py-0.5 rounded-full font-medium capitalize border border-[#2B2B38]">
                {currentStatus}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-sans">
              <Clock size={12} className="text-zinc-500 shrink-0" />
              <span className="truncate">Placed: {formatDate(order.created_at)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPackingSlip(true)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#1C1C24] hover:bg-[#252530] text-zinc-200 border border-[#2E2E3C] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print Invoice</span>
              <span className="sm:hidden">Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-[#20202A] rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 text-xs text-zinc-300">

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-4 bg-rose-950/50 border border-rose-800/60 text-rose-300 rounded-2xl flex items-center gap-2.5">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="bg-[#111115] border border-[#22222C] p-5 rounded-2xl space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-[#1E1E26] pb-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#181820] border border-[#282834] flex items-center justify-center text-zinc-400">
                  <User size={13} />
                </div>
                <span>Customer Details</span>
              </div>
              <div className="space-y-2 text-zinc-300">
                <div className="text-white font-bold text-sm tracking-tight">{order.customer_name || 'Anonymous Customer'}</div>
                
                {order.customer_email && (
                  <div 
                    onClick={() => handleCopy(order.customer_email, 'email')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 bg-[#16161D] hover:bg-[#1C1C24] p-2 rounded-xl border border-[#22222C] transition-colors cursor-pointer group"
                    title="Click to copy email"
                  >
                    <Mail size={13} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                    <span className="truncate">{order.customer_email}</span>
                    <Copy size={11} className="ml-auto text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                  </div>
                )}

                {order.customer_phone && (
                  <div 
                    onClick={() => handleCopy(order.customer_phone, 'phone')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 bg-[#16161D] hover:bg-[#1C1C24] p-2 rounded-xl border border-[#22222C] transition-colors cursor-pointer group font-mono"
                    title="Click to copy phone"
                  >
                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider shrink-0">Tel</span>
                    <span>{order.customer_phone}</span>
                    <Copy size={11} className="ml-auto text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Destination Box */}
            <div className="bg-[#111115] border border-[#22222C] p-5 rounded-2xl space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-[#1E1E26] pb-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#181820] border border-[#282834] flex items-center justify-center text-rose-400">
                  <MapPin size={13} />
                </div>
                <span>Shipping Destination</span>
              </div>
              <div className="space-y-1.5 text-zinc-300 leading-relaxed">
                <div className="font-semibold text-zinc-200">{address.address || address.addressLine || 'Address on record'}</div>
                {address.apartment && <div className="text-zinc-400">{address.apartment}</div>}
                <div className="text-zinc-400">
                  {[address.city, address.state].filter(Boolean).join(', ')} {address.pincode || ''}
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#181820] border border-[#262634] rounded-md text-[10px] text-zinc-400 font-medium mt-1">
                  <span>Pan-India Studio Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                <Package size={14} className="text-zinc-400" />
                <span>Ordered Items ({items.length})</span>
              </div>
            </div>

            <div className="bg-[#111115] border border-[#22222C] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0E0E12] text-zinc-400 font-semibold border-b border-[#1E1E26] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-3 text-center">Size</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B1B24]">
                    {items.map((item, idx) => {
                      const unitPrice = Number(item.unit_price ?? item.price ?? 0);
                      const qty = Number(item.quantity ?? 1);
                      const lineTotal = Number(item.line_total ?? (unitPrice * qty));
                      const name = item.product_name || item.name || item.title || 'Item';
                      const sku = item.sku || 'SKU';
                      const size = item.size || 'M';

                      return (
                        <tr key={idx} className="hover:bg-[#16161E]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#EDEDF0]">{name}</div>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{sku}</div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="px-2.5 py-0.5 bg-[#1A1A24] border border-[#2A2A3A] rounded-md text-zinc-200 font-mono font-bold text-[11px] shadow-xs">
                              {size}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center text-zinc-200 font-medium font-mono">{qty}</td>
                          <td className="py-3.5 px-4 text-right text-zinc-300 font-mono">₹{unitPrice.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 text-right text-white font-bold font-mono">₹{lineTotal.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pricing Summary Attached to Items Container */}
              <div className="p-5 bg-[#0E0E12] border-t border-[#1E1E26] space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-200 font-mono">₹{Number(order.subtotal_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                {Number(order.discount_amount || 0) > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span>Discount</span>
                      <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded-md text-[10px] font-mono font-semibold">
                        {order.coupon_code || 'PROMO'}
                      </span>
                    </span>
                    <span className="font-mono font-semibold">-₹{Number(order.discount_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-zinc-200 font-mono">
                    {Number(order.shipping_fee || 0) === 0 ? <span className="text-emerald-400 font-semibold">FREE</span> : `₹${Number(order.shipping_fee || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="border-t border-[#1F1F2A] pt-3 flex justify-between items-center text-zinc-100 font-bold">
                  <span className="text-sm">Total Amount</span>
                  <span className="text-white text-lg font-bold font-mono tracking-tight">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Settlement Details */}
          <div className="bg-[#111115] border border-[#22222C] p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#1E1E26] pb-2.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                <div className="w-6 h-6 rounded-lg bg-[#181820] border border-[#282834] flex items-center justify-center text-zinc-400">
                  <CreditCard size={13} />
                </div>
                <span>Payment Information</span>
              </div>
              <div>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shadow-xs">
                    <CheckCircle2 size={11} /> {isCOD ? 'COD Collected' : 'Paid Online'}
                  </span>
                ) : isCOD ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-sky-950/60 text-sky-300 border border-sky-800/60 shadow-xs">
                    <Clock size={11} /> COD Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-[#1A1A24] text-zinc-300 border border-[#2A2A3A] shadow-xs">
                    <Clock size={11} /> Pending Payment
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#16161D] p-3 rounded-xl border border-[#22222C]">
                <span className="text-zinc-500 block text-[11px] mb-0.5">Payment Method</span>
                <span className="font-bold text-zinc-200 uppercase tracking-wide">
                  {isCOD ? 'Cash on Delivery (COD)' : 'Razorpay Online'}
                </span>
              </div>

              <div className="bg-[#16161D] p-3 rounded-xl border border-[#22222C]">
                <span className="text-zinc-500 block text-[11px] mb-0.5">Payment Status</span>
                <span className={`font-semibold capitalize ${isPaid ? 'text-emerald-400' : isCOD ? 'text-sky-300' : 'text-zinc-400'}`}>
                  {paymentStatus}
                </span>
              </div>

              {order.razorpay_payment_id && (
                <div className="sm:col-span-2 bg-[#16161D] p-3 rounded-xl border border-[#22222C]">
                  <span className="text-zinc-500 block text-[11px] mb-1">Razorpay Payment ID</span>
                  <div className="flex items-center justify-between font-mono text-zinc-200 text-xs">
                    <span>{order.razorpay_payment_id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.razorpay_payment_id, 'rzp_id')}
                      className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
                      title="Copy Payment ID"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* If COD and Pending, allow quick payment collection toggle */}
            {isCOD && paymentStatus !== 'paid' && (
              <div className="pt-2 border-t border-[#1E1E26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#16161D] p-4 rounded-xl border border-sky-900/40">
                <div className="space-y-0.5">
                  <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                    <Banknote size={14} className="text-sky-400" />
                    <span>Collect Cash on Delivery</span>
                  </span>
                  <span className="text-[11px] text-zinc-400 block">Mark this COD order as collected once cash is received from the courier partner.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkPaymentStatus('paid')}
                  disabled={isUpdatingPayment}
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  {isUpdatingPayment ? <RefreshCw size={12} className="animate-spin text-zinc-900" /> : <Check size={12} />}
                  <span>Mark COD as Collected</span>
                </button>
              </div>
            )}
          </div>

          {/* Returns & Refunds Lifecycle Management */}
          <div className="bg-[#111115] border border-[#22222C] p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#1E1E26] pb-2.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                <div className="w-6 h-6 rounded-lg bg-[#181820] border border-[#282834] flex items-center justify-center text-zinc-400">
                  <Undo2 size={13} />
                </div>
                <span>Returns & Refund Lifecycle</span>
              </div>
              {orderReturn && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                  orderReturn.status === 'refunded' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' :
                  orderReturn.status === 'approved' ? 'bg-sky-950/50 text-sky-300 border-sky-800/60' :
                  orderReturn.status === 'rejected' ? 'bg-rose-950/50 text-rose-300 border-rose-800/60' :
                  orderReturn.status === 'item_received' ? 'bg-purple-950/50 text-purple-300 border-purple-800/60' :
                  'bg-amber-950/50 text-amber-300 border-amber-800/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    orderReturn.status === 'refunded' ? 'bg-emerald-400' :
                    orderReturn.status === 'approved' ? 'bg-sky-400' :
                    orderReturn.status === 'rejected' ? 'bg-rose-400' :
                    orderReturn.status === 'item_received' ? 'bg-purple-400' :
                    'bg-amber-400'
                  }`} />
                  <span className="capitalize">{orderReturn.status.replace(/_/g, ' ')}</span>
                </span>
              )}
            </div>

            {orderReturn ? (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#16161D] p-3 rounded-xl border border-[#22222C]">
                    <span className="text-zinc-500 block text-[11px] mb-0.5">Return Reason</span>
                    <span className="font-semibold text-zinc-200">{orderReturn.return_reason}</span>
                  </div>
                  <div className="bg-[#16161D] p-3 rounded-xl border border-[#22222C]">
                    <span className="text-zinc-500 block text-[11px] mb-0.5">Refund Value</span>
                    <span className="font-mono font-bold text-white">₹{orderReturn.refund_amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-[#16161D] p-3 rounded-xl border border-[#22222C]">
                    <span className="text-zinc-500 block text-[11px] mb-0.5">Inventory Restock</span>
                    <span className={orderReturn.inventory_restocked_at ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                      {orderReturn.inventory_restocked_at ? 'Restocked to Studio' : 'Pending Receipt'}
                    </span>
                  </div>
                </div>

                {orderReturn.refund_transaction_id && (
                  <div className="bg-[#16161D] p-3 rounded-xl border border-[#22222C] text-xs font-mono flex items-center justify-between">
                    <span className="text-zinc-400">Refund Ref: <span className="text-zinc-200">{orderReturn.refund_transaction_id}</span></span>
                    <span className="text-emerald-400 font-sans font-semibold text-[11px]">Completed</span>
                  </div>
                )}

                {/* Return Action Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {orderReturn.status === 'requested' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateReturnStatusAction('approved')}
                        disabled={isProcessingReturnAction}
                        className="px-3.5 py-2 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Approve Return</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateReturnStatusAction('rejected')}
                        disabled={isProcessingReturnAction}
                        className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <X size={12} />
                        <span>Reject Return</span>
                      </button>
                    </>
                  )}

                  {orderReturn.status === 'approved' && !orderReturn.inventory_restocked_at && (
                    <button
                      type="button"
                      onClick={() => handleUpdateReturnStatusAction('item_received', true)}
                      disabled={isProcessingReturnAction}
                      className="px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Package size={12} />
                      <span>Mark Item Received & Restock</span>
                    </button>
                  )}

                  {orderReturn.status !== 'refunded' && (
                    <button
                      type="button"
                      onClick={handleExecuteRefundAction}
                      disabled={isProcessingReturnAction}
                      className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <DollarSign size={13} />
                      <span>Execute Refund (₹{orderReturn.refund_amount?.toLocaleString('en-IN')})</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {!showInitiateReturnForm ? (
                  <div className="flex items-center justify-between py-1">
                    <p className="text-zinc-500 text-xs">No active return or refund request for this order.</p>
                    <button
                      type="button"
                      onClick={() => setShowInitiateReturnForm(true)}
                      className="px-3.5 py-2 bg-[#16161D] hover:bg-[#1E1E26] text-zinc-200 border border-[#2A2A38] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Undo2 size={12} />
                      <span>Initiate Return Request</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInitiateReturn} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-400 block text-xs mb-1 font-medium">Return Reason</label>
                        <select
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className="w-full bg-[#16161D] border border-[#262634] text-zinc-100 px-3.5 py-2 rounded-xl outline-none text-xs"
                        >
                          <option value="Fit / Sizing Issue">Fit / Sizing Issue</option>
                          <option value="Damaged / Manufacturing Defect">Damaged / Manufacturing Defect</option>
                          <option value="Style / Color Mismatch">Style / Color Mismatch</option>
                          <option value="Customer Cancellation">Customer Cancellation Post-Dispatch</option>
                          <option value="Other">Other Studio Reason</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-zinc-400 block text-xs mb-1 font-medium">Refund Amount (₹)</label>
                        <input
                          type="number"
                          readOnly
                          value={order.total_amount || 0}
                          className="w-full bg-[#16161D] border border-[#262634] text-zinc-300 font-mono font-bold px-3.5 py-2 rounded-xl text-xs outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowInitiateReturnForm(false)}
                        className="px-3 py-1.5 bg-[#16161D] hover:bg-[#202028] text-zinc-400 rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessingReturnAction}
                        className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        {isProcessingReturnAction ? 'Logging...' : 'Submit Return Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Fulfillment Controls */}
          <form onSubmit={handleUpdate} className="bg-[#111115] border border-[#22222C] p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-[#1E1E26] pb-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#181820] border border-[#282834] flex items-center justify-center text-zinc-400">
                <Truck size={13} />
              </div>
              <span>Fulfillment & Shipping Management</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-300 font-medium block mb-1 text-xs">
                  Order Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={isTerminal}
                  className="w-full bg-[#16161D] border border-[#262634] text-zinc-100 px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 capitalize cursor-pointer text-xs shadow-xs"
                >
                  {allowedStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st.charAt(0).toUpperCase() + st.slice(1)} {st === currentStatus ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1 text-xs">
                  Courier Partner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delhivery, Bluedart, DTDC"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-zinc-100 px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 placeholder-zinc-600 text-xs shadow-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-medium block mb-1 text-xs">
                  Tracking / AWB Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWB-98237461928"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-zinc-100 px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 placeholder-zinc-600 font-mono text-xs shadow-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-medium block mb-1 text-xs">
                  Internal Operational Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Add notes, customer delivery remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#16161D] border border-[#262634] text-zinc-100 px-3.5 py-2.5 rounded-xl outline-none focus:border-zinc-400 resize-none placeholder-zinc-600 text-xs shadow-xs"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1E1E26]">
              <div className="flex items-center gap-2 flex-wrap">
                {isArchived ? (
                  <button
                    type="button"
                    onClick={handleRestore}
                    className="px-3.5 py-2.5 bg-[#1A1A22] hover:bg-emerald-950 text-zinc-300 hover:text-emerald-300 border border-[#2A2A38] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs min-h-[40px]"
                  >
                    <RotateCcw size={13} />
                    <span>Restore Order</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleArchive}
                    className="px-3.5 py-2.5 bg-[#1A1A22] hover:bg-amber-950 text-zinc-400 hover:text-amber-300 border border-[#2A2A38] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs min-h-[40px]"
                  >
                    <Archive size={13} />
                    <span>Archive</span>
                  </button>
                )}

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-2.5 bg-[#1A1A22] hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-[#2A2A38] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs min-h-[40px]"
                    title="Delete permanently"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-900/60 p-1 rounded-xl">
                    <span className="text-[10px] text-rose-300 px-1.5 font-medium">Delete forever?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                    >
                      {isDeleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-[#1C1C24] hover:bg-[#252530] text-zinc-400 hover:text-zinc-200 rounded-lg text-[10px] transition-colors cursor-pointer min-h-[36px]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[42px]"
              >
                {isUpdating ? <RefreshCw size={13} className="animate-spin text-zinc-900" /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          </form>

          {/* Email Notification Audit Trail */}
          <div className="bg-[#111115] border border-[#22222C] p-5 rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#1E1E26] pb-2.5">
              <div className="flex items-center gap-2 font-semibold text-zinc-200">
                <div className="w-6 h-6 rounded-lg bg-[#181820] border border-[#282834] flex items-center justify-center text-zinc-400">
                  <Mail size={13} />
                </div>
                <span>Transactional Email Notifications (Resend)</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {isLoadingEmails ? 'Loading...' : `${eventsList.length} dispatch(es)`}
              </span>
            </div>

            {eventsList.length === 0 ? (
              <p className="text-zinc-500 py-1 italic">
                {isLoadingEmails ? 'Checking email logs...' : 'No email audit events recorded for this order yet.'}
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {eventsList.map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#16161D] rounded-xl border border-[#22222C] text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${evt?.status === 'sent' ? 'bg-emerald-400 shadow-xs' : 'bg-rose-400'}`} />
                      <span className="font-medium text-zinc-200 capitalize">{(evt?.event_type || 'Notification').replace(/_/g, ' ')}</span>
                      {evt?.recipient_email && <span className="text-zinc-500 font-mono text-[11px]">({evt.recipient_email})</span>}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {evt?.created_at ? new Date(evt.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Quick Print Thermal Packing Slip Modal */}
      {showPackingSlip && (
        <ThermalPackingSlipModal
          order={order}
          onClose={() => setShowPackingSlip(false)}
        />
      )}
    </div>
  );
};
