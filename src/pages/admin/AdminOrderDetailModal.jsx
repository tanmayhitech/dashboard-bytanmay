import React, { useState, useEffect } from 'react';
import { updateOrderStatus, fetchOrderEmailEvents } from '../../services/adminService';
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
  ShieldAlert,
  Clock,
  Database,
  Mail,
  Tag,
  Sparkles,
  Printer
} from 'lucide-react';

export const AdminOrderDetailModal = ({ order, onClose, onOrderUpdated }) => {
  const [currentStatus, setCurrentStatus] = useState(order?.order_status || 'pending');
  const [selectedStatus, setSelectedStatus] = useState(order?.order_status || 'pending');
  const [notes, setNotes] = useState(order?.notes || '');
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [courierName, setCourierName] = useState(order?.courier_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [emailEvents, setEmailEvents] = useState([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [showPackingSlip, setShowPackingSlip] = useState(false);


  useEffect(() => {
    if (order?.id) {
      loadEmailEvents(order.id);
    }
  }, [order?.id]);

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

  // Safe data parsers to guard against null, malformed JSON, or raw string types
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

  const formatTime = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Determine valid allowed next statuses according to the state machine
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
      default:
        return ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    }
  };

  const { executeAction } = useAdminFeedback();
  const [lastDuration, setLastDuration] = useState(null);

  const allowedStatuses = getNextAvailableStatuses(currentStatus);
  const isTerminal = currentStatus === 'delivered' || currentStatus === 'cancelled';

  const handleUpdate = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLastDuration(null);

    const isStatusChanging = selectedStatus !== currentStatus;
    let actionTitle = `Order #${order.order_number} updated`;
    if (isStatusChanging) {
      if (selectedStatus === 'shipped') actionTitle = `Order #${order.order_number} marked as shipped`;
      else if (selectedStatus === 'delivered') actionTitle = `Order #${order.order_number} marked as delivered`;
      else if (selectedStatus === 'cancelled') actionTitle = `Order #${order.order_number} cancelled (Stock Restored)`;
      else if (selectedStatus === 'processing') actionTitle = `Order #${order.order_number} moved to processing`;
      else if (selectedStatus === 'confirmed') actionTitle = `Order #${order.order_number} marked as confirmed`;
    } else if (courierName || trackingNumber) {
      actionTitle = `Tracking saved for #${order.order_number}`;
    }

    const detailString = `Status: ${selectedStatus.toUpperCase()}${courierName ? ` • Courier: ${courierName}` : ''}${trackingNumber ? ` • Tracking: ${trackingNumber}` : ''}`;

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
        detail: detailString
      }
    );

    setIsUpdating(false);

    if (outcome.success) {
      setCurrentStatus(selectedStatus);
      setSuccessMessage(actionTitle);
      setLastDuration(outcome.duration);
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
      setLastDuration(outcome.duration);
    }
  };

  const isPaid = order.payment_status === 'paid';
  const items = parseItems(order.items);
  const address = parseAddress(order.shipping_address);
  const eventsList = Array.isArray(emailEvents) ? emailEvents : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div 
        className="bg-[#121212] border border-[#242424] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#161616] border-b border-[#222222] p-5 flex items-center justify-between z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">Order Details</span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium capitalize border ${
                isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {order.payment_status || 'pending'}
              </span>
              <span className="text-[11px] bg-[#202020] text-zinc-300 px-2.5 py-0.5 rounded-full font-medium capitalize border border-[#282828]">
                {currentStatus}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {order.order_number || 'Order Details'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPackingSlip(true)}
              className="px-3.5 py-1.5 bg-[#202020] hover:bg-white hover:text-black text-zinc-200 border border-[#303030] hover:border-white rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              title="Print Official Retail Bill / Invoice (A4 / PDF)"
            >
              <Printer size={13} />
              <span>Print Bill / Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-[#202020] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>


        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-6">

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span className="font-semibold">Update Failed</span>
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
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
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

          {/* Customer & Shipping Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Customer Box */}
            <div className="bg-[#161616] border border-[#222222] p-4 sm:p-5 rounded-xl space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold border-b border-[#222222] pb-2">
                <User size={14} className="text-zinc-400" />
                <span>Customer Information</span>
              </div>
              <div className="space-y-1 pt-0.5">
                <div className="text-white font-semibold text-sm">{order.customer_name || 'Anonymous Customer'}</div>
                <div className="text-zinc-400">{order.customer_email || 'No email provided'}</div>
                <div className="text-zinc-400">{order.customer_phone || 'No phone provided'}</div>
                <div className="text-[11px] text-zinc-500 pt-1">
                  Placed: {formatDate(order.created_at)}
                </div>
              </div>
            </div>

            {/* Shipping Box */}
            <div className="bg-[#161616] border border-[#222222] p-4 sm:p-5 rounded-xl space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold border-b border-[#222222] pb-2">
                <MapPin size={14} className="text-zinc-400" />
                <span>Delivery Address</span>
              </div>
              <div className="space-y-1 pt-0.5 text-zinc-400">
                <div className="text-white font-medium">{address.address || 'Address not specified'}</div>
                {address.apartment && <div>{address.apartment}</div>}
                <div>
                  {[address.city, address.state].filter(Boolean).join(', ')} {address.pincode || ''}
                </div>
                <div className="text-[11px] text-zinc-500">India (Domestic Pan-India Delivery)</div>
              </div>
            </div>
          </div>

          {/* Ordered Line Items Snapshot */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold">
              <Package size={14} className="text-zinc-400" />
              <span>Ordered Items ({items.length})</span>
            </div>

            <div className="bg-[#161616] border border-[#222222] rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1a1a1a] text-zinc-400 text-[11px] font-medium border-b border-[#222222]">
                  <tr>
                    <th className="py-3 px-4">Item / SKU</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-500 italic">
                        No line items recorded for this order snapshot.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const unitPrice = Number(item.unit_price ?? item.price ?? 0);
                      const qty = Number(item.quantity ?? 1);
                      const lineTotal = Number(item.line_total ?? (unitPrice * qty));
                      const name = item.product_name || item.name || item.title || 'Item';
                      const sku = item.sku || 'N/A';
                      const size = item.size || 'Standard';

                      return (
                        <tr key={idx} className="hover:bg-[#1a1a1a]/50">
                          <td className="py-3 px-4">
                            <div className="text-white font-medium">{name}</div>
                            <div className="text-[11px] text-zinc-500">{sku}</div>
                          </td>
                          <td className="py-3 px-4 text-white font-semibold">{size}</td>
                          <td className="py-3 px-4 text-center text-white">{qty}</td>
                          <td className="py-3 px-4 text-right text-zinc-400">₹{unitPrice.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">₹{lineTotal.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing & Financial Summary */}
          <div className="bg-[#161616] border border-[#222222] p-4 sm:p-5 rounded-xl text-xs space-y-2 shadow-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="text-white">₹{Number(order.subtotal_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            {Number(order.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({order.coupon_code || 'PROMO'})</span>
                <span>-₹{Number(order.discount_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Shipping Fee</span>
              <span className="text-white">{Number(order.shipping_fee || 0) === 0 ? 'FREE' : `₹${Number(order.shipping_fee || 0).toLocaleString('en-IN')}`}</span>
            </div>
            <div className="border-t border-[#222222] pt-2.5 flex justify-between text-white font-semibold text-sm">
              <span>Total Amount</span>
              <span className="text-white text-base">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Creator Attribution & Commission Breakdown */}
          {(order.coupon_code || order.influencer_id || Number(order.influencer_commission_amount) > 0 || order.influencer_handle || order.influencer_name) && (
            <div className="bg-[#161616] border border-amber-500/30 p-4 sm:p-5 rounded-xl text-xs space-y-3 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#242424] pb-2.5">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                  <Tag size={14} className="text-amber-400" />
                  <span>Influencer & Referral Attribution</span>
                </div>
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                  <Sparkles size={11} /> Creator Sale
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-zinc-500 block mb-0.5">Partner Creator</span>
                  <span className="text-white font-medium">
                    {order.influencer_name ? `${order.influencer_name} ` : ''}
                    {order.influencer_handle ? <span className="text-amber-400 font-mono font-semibold">@{order.influencer_handle}</span> : (order.influencer_name || 'Referral Partner')}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Coupon Code Applied</span>
                  <span className="font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {order.coupon_code || order.influencer_coupon || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Influencer Commission</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    ₹{Number(order.influencer_commission_amount || 0).toLocaleString('en-IN')}
                    {order.influencer_commission_rate ? <span className="text-xs text-zinc-400 font-normal"> ({order.influencer_commission_rate}%)</span> : ''}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Commission Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium capitalize">
                    <CheckCircle2 size={12} />
                    <span>Tracked & Recorded</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Gateway Metadata */}
          <div className="bg-[#161616] border border-[#222222] p-4 sm:p-5 rounded-xl text-xs space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold text-xs border-b border-[#222222] pb-2">
              <CreditCard size={14} className="text-zinc-400" />
              <span>Payment Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-zinc-500">Method: </span>
                <span className="text-white uppercase font-medium">{order.payment_method || 'Online'}</span>
              </div>
              <div>
                <span className="text-zinc-500">Status: </span>
                <span className={isPaid ? 'text-emerald-400 font-semibold capitalize' : 'text-amber-400 font-semibold capitalize'}>
                  {order.payment_status || 'pending'}
                </span>
              </div>
              {order.razorpay_order_id && (
                <div>
                  <span className="text-zinc-500">Razorpay Order ID: </span>
                  <span className="text-zinc-300 font-mono text-[11px]">{order.razorpay_order_id}</span>
                </div>
              )}
              {order.razorpay_payment_id && (
                <div>
                  <span className="text-zinc-500">Razorpay Payment ID: </span>
                  <span className="text-zinc-300 font-mono text-[11px]">{order.razorpay_payment_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transactional Email Audit Log */}
          <div className="bg-[#161616] border border-[#222222] p-4 sm:p-5 rounded-xl text-xs space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#222222] pb-2">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold text-xs">
                <Mail size={14} className="text-zinc-400" />
                <span>Transactional Email Notifications (Resend)</span>
              </div>
              <span className="text-[11px] text-zinc-500">
                {isLoadingEmails ? 'Loading...' : `${eventsList.length} event(s)`}
              </span>
            </div>

            {eventsList.length === 0 ? (
              <p className="text-xs text-zinc-500 py-1.5 italic">
                {isLoadingEmails ? 'Fetching email dispatch logs...' : 'No email audit events recorded for this order yet.'}
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {eventsList.map((evt, idx) => {
                  const resendIdStr = typeof evt?.resend_id === 'string' ? evt.resend_id : (typeof evt?.provider_message_id === 'string' ? evt.provider_message_id : '');
                  const displayId = resendIdStr ? `${resendIdStr.slice(0, 10)}...` : null;
                  const eventStatus = evt?.status || 'unknown';
                  const eventType = (evt?.event_type || 'notification').replace(/_/g, ' ');
                  const timeStr = formatTime(evt?.created_at);

                  return (
                    <div key={evt?.id || evt?.idempotency_key || idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-[#181818] p-2.5 rounded-lg border border-[#242424] gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${eventStatus === 'sent' ? 'bg-emerald-400' : eventStatus === 'skipped' ? 'bg-gray-400' : 'bg-rose-400'}`} />
                        <span className="text-white font-medium capitalize">{eventType}</span>
                        {evt?.recipient_email && (
                          <span className="text-zinc-400 text-[11px]">({evt.recipient_email})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        {displayId && <span className="text-zinc-400">ID: {displayId}</span>}
                        {evt?.error_message && (
                          <span className="text-rose-400 truncate max-w-[140px]" title={evt.error_message}>
                            ERR: {evt.error_message}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border ${
                          eventStatus === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          eventStatus === 'skipped' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {eventStatus}
                        </span>
                        {timeStr && (
                          <span className="text-zinc-500">
                            {timeStr}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Status Transition Management Form */}
          <form onSubmit={handleUpdate} className="bg-[#161616] border border-[#222222] p-5 sm:p-6 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-white font-semibold border-b border-[#222222] pb-2.5">
              <Truck size={14} className="text-zinc-400" />
              <span>Status Transition & Fulfillment Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">
                  Update Order Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={isTerminal}
                  className="w-full bg-[#1c1c1c] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none disabled:opacity-50 cursor-pointer capitalize"
                >
                  {allowedStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st.charAt(0).toUpperCase() + st.slice(1)} {st === currentStatus ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
                {selectedStatus === 'cancelled' && currentStatus !== 'cancelled' && (
                  <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1.5">
                    <ShieldAlert size={13} />
                    <span>Inventory will be automatically restored upon cancellation.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">
                  Courier Partner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bluedart, Delhivery, DTDC"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none placeholder-zinc-600"
                >
                </input>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">
                  Tracking / AWB Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWB-98237461928"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none placeholder-zinc-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">
                  Internal Fulfillment Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Add operational notes, dispatch remarks, customer requests..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-[#282828] text-white px-3.5 py-2.5 rounded-lg focus:border-zinc-500 outline-none resize-none placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#1c1c1c] hover:bg-[#262626] text-zinc-400 hover:text-white text-xs font-medium rounded-lg transition-colors border border-[#282828]"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isUpdating || (isTerminal && notes === (order.notes || '') && trackingNumber === (order.tracking_number || ''))}
                className="px-5 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {isUpdating ? <RefreshCw size={13} className="animate-spin text-black" /> : null}
                <span>{isUpdating ? 'Updating...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Dedicated Thermal Packing Slip Modal */}
      {showPackingSlip && (
        <ThermalPackingSlipModal
          order={order}
          onClose={() => setShowPackingSlip(false)}
        />
      )}
    </div>
  );
};

