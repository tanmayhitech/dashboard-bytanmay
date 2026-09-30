import React, { useEffect, useRef } from 'react';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { formatOrderNumber } from '../../services/orderService';
import { 
  Printer, 
  X, 
  Check, 
  Package, 
  Truck, 
  User, 
  MapPin, 
  FileText,
  CreditCard, 
  Download,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  ExternalLink,
  QrCode
} from 'lucide-react';

/**
 * Converts a numeric amount to Indian Currency Words
 */
const numberToWordsINR = (num) => {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n === 0) return 'Zero';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  };

  const amount = Math.floor(Math.abs(Number(num) || 0));
  return inWords(amount) + ' Rupees Only';
};

/**
 * ThermalPackingSlipModal / OrderInvoiceBillModal
 * 
 * Generates an ultra-clear, high-contrast, professional retail tax invoice and packing slip
 * with official LOOZARS, Kanpur Atelier fulfillment branding, formatted for A4 print and PDF export.
 */
export const ThermalPackingSlipModal = ({ order, onClose }) => {
  const { showToast } = useAdminFeedback();
  const printRef = useRef(null);

  useEffect(() => {
    if (order?.order_number) {
      showToast({
        type: 'info',
        title: 'Invoice bill ready',
        detail: `Invoice for ${order.order_number} • Ready to Print / Save as PDF`
      });
    }
  }, [order?.order_number, showToast]);

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
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const address = parseAddress(order.shipping_address || order.shippingAddress);
  const items = parseItems(order.items);
  const orderNumber = formatOrderNumber(order.order_number || order.orderNumber || order.orderId);
  const invoiceNumber = `INV-LZR-${orderNumber.replace(/[^A-Za-z0-9]/g, '')}`;
  const orderDate = formatDate(order.created_at || order.createdAt || order.date);

  const customerName = order.customer_name || order.customerName || (address.firstName ? `${address.firstName} ${address.lastName || ''}`.trim() : 'Customer');
  const customerEmail = order.customer_email || order.customerEmail || address.email || '';
  const customerPhone = order.customer_phone || order.customerPhone || address.phone || '';

  const subtotal = Number(order.subtotal_amount ?? order.subtotal ?? 0);
  const discount = Number(order.discount_amount ?? order.discount ?? 0);
  const shippingFee = Number(order.shipping_fee ?? order.shipping ?? 0);
  const total = Number(order.total_amount ?? order.total ?? 0);

  const paymentStatus = (order.payment_status || order.paymentStatus || 'paid').toUpperCase();
  const paymentMethod = (order.payment_method || order.paymentMethod || 'online').toUpperCase();
  const orderStatus = order.order_status || order.orderStatus || 'confirmed';

  const courierName = order.courier_name || order.courierName || 'Delhivery / Bluedart Surface';
  const trackingNumber = order.tracking_number || order.trackingNumber || `TRK-LZR-${orderNumber.replace(/[^0-9]/g, '') || Date.now().toString().slice(-6)}`;
  const isShipped = orderStatus === 'shipped' || orderStatus === 'delivered';

  const amountInWords = numberToWordsINR(total);

  // Generate standalone complete HTML for isolated iframe or new tab printing
  const generatePrintableHtml = () => {
    const invoiceElem = document.getElementById('official-retail-invoice');
    const invoiceContent = invoiceElem ? invoiceElem.innerHTML : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>LOOZARS Invoice - ${orderNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #000000;
      background: #ffffff;
    }
    .invoice-a4-sheet {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      color: #000000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }
    th, td {
      border: 1px solid #1c1c1c;
      padding: 6px 8px;
    }
    th {
      background-color: #000000 !important;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; }
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .border-b-2 { border-bottom: 2px solid #000000; }
    .border-t-2 { border-top: 2px solid #000000; }
    .border-b { border-bottom: 1px solid #000000; }
    .border { border: 1px solid #000000; }
    .bg-zinc-50 { background-color: #f9f9f9 !important; }
    .bg-zinc-100 { background-color: #f0f0f0 !important; }
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
</head>
<body>
  <div class="invoice-a4-sheet">
    ${invoiceContent}
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    if (typeof window === 'undefined') return;

    showToast({
      type: 'success',
      title: 'Preparing Print / PDF View',
      detail: `Invoice ${orderNumber}`
    });

    try {
      let iframe = document.getElementById('loozars_invoice_print_frame');
      if (iframe) {
        iframe.remove();
      }

      iframe = document.createElement('iframe');
      iframe.id = 'loozars_invoice_print_frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const html = generatePrintableHtml();
      const frameDoc = iframe.contentWindow.document;
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (printErr) {
          console.warn('[ThermalPackingSlipModal] Iframe print exception, fallback to window.print():', printErr);
          window.print();
        }
      }, 400);
    } catch (e) {
      console.warn('[ThermalPackingSlipModal] Print setup fallback:', e);
      window.print();
    }
  };

  const handleOpenInNewTab = () => {
    if (typeof window === 'undefined') return;
    const html = generatePrintableHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn font-sans loozars-modal-overlay">
      
      {/* Modal Card */}
      <div 
        className="bg-[#121212] border border-[#262626] w-full max-w-4xl max-h-[96vh] sm:max-h-[94vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200 loozars-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screen Header Toolbar (Hidden in Print) */}
        <div className="bg-[#181818] border-b border-[#262626] px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold shrink-0">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <span>Tax Invoice & Packing Slip</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-mono border border-zinc-700">
                    A4 / PDF
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400 truncate">
                  Order {orderNumber} • LOOZARS, Kanpur Atelier
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="sm:hidden p-2 text-zinc-400 hover:text-white hover:bg-[#242424] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="hidden sm:flex px-3 py-2 bg-[#222222] hover:bg-[#2e2e2e] text-zinc-300 hover:text-white text-xs font-medium rounded-xl transition-colors items-center gap-1.5 border border-[#333333] min-h-[38px]"
              title="Open full bill in separate tab"
            >
              <ExternalLink size={13} />
              <span>Open Tab</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[40px]"
              title="Print or Save as PDF"
            >
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="hidden sm:flex p-2 text-zinc-400 hover:text-white hover:bg-[#242424] rounded-xl transition-colors min-h-[38px] min-w-[38px] items-center justify-center"
              title="Close Preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex justify-center bg-[#0a0a0a] loozars-invoice-scroll-area">
          
          {/* =========================================================================
              THE OFFICIAL RETAIL TAX INVOICE & BILL DOCUMENT
              Standard A4 Page Ratio (210mm x 297mm)
             ========================================================================= */}
          <div 
            ref={printRef}
            id="official-retail-invoice"
            className="invoice-a4-sheet w-full max-w-[780px] bg-white text-black font-sans text-[12px] leading-normal p-6 sm:p-9 shadow-2xl border border-zinc-300 select-text"
          >
            {/* Header: Company Details & Invoice Metadata */}
            <div className="flex flex-col sm:flex-row justify-between items-start pb-5 border-b-2 border-black gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-3xl font-black tracking-tighter uppercase font-sans text-black">
                    LOOZARS<span className="text-zinc-600 font-light text-lg">®</span>
                  </h1>
                  <span className="font-mono text-[10px] tracking-widest text-zinc-700 font-bold uppercase bg-zinc-100 px-2 py-0.5 border border-zinc-300 rounded">
                    Kanpur Atelier
                  </span>
                </div>
                
                <p className="text-xs font-bold tracking-wider uppercase text-zinc-900 mt-1">
                  Streetwear & Archive Apparel Atelier
                </p>
                
                <div className="text-[11px] text-zinc-700 mt-1 space-y-0.5 font-sans leading-snug">
                  <p><strong>Fulfillment Center & Registered Atelier:</strong> Kanpur, Uttar Pradesh - 208001, India</p>
                  <p><strong>GSTIN:</strong> 09AAHCL5829Q1Z4 (UP Division) | <strong>State:</strong> Uttar Pradesh (09)</p>
                  <p><strong>Web:</strong> www.theloozars.com | <strong>Support:</strong> support@theloozars.com</p>
                </div>
              </div>

              <div className="sm:text-right space-y-1 sm:min-w-[240px]">
                <div className="inline-block px-3 py-1 bg-black text-white font-bold text-xs uppercase tracking-wider rounded-sm mb-1 text-center w-full">
                  Retail Tax Invoice
                </div>
                <div className="text-xs space-y-1 bg-zinc-50 p-2.5 rounded border border-zinc-300">
                  <p className="flex justify-between sm:justify-end gap-2">
                    <span className="text-zinc-600 font-medium">Invoice No:</span>
                    <strong className="font-mono text-black font-bold">{invoiceNumber}</strong>
                  </p>
                  <p className="flex justify-between sm:justify-end gap-2">
                    <span className="text-zinc-600 font-medium">Order No:</span>
                    <strong className="font-mono text-black font-bold">{orderNumber}</strong>
                  </p>
                  <p className="flex justify-between sm:justify-end gap-2">
                    <span className="text-zinc-600 font-medium">Invoice Date:</span>
                    <strong className="text-black">{orderDate}</strong>
                  </p>
                  <p className="flex justify-between sm:justify-end gap-2 items-center">
                    <span className="text-zinc-600 font-medium">Payment:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                      {paymentStatus} ({paymentMethod})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Customer & Shipping Addresses (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-zinc-300 text-xs">
              <div className="bg-zinc-50 p-3.5 rounded border border-zinc-300 space-y-1">
                <div className="font-bold text-[10px] text-zinc-700 uppercase tracking-wider border-b border-zinc-200 pb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-black">
                    <User size={12} className="text-black" />
                    <span>Billed To (Customer Details):</span>
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">CONSUMER</span>
                </div>
                <div className="font-bold text-sm text-black pt-1">
                  {customerName}
                </div>
                {customerEmail && (
                  <div className="text-zinc-800 flex items-center gap-1">
                    <Mail size={11} className="text-zinc-600" />
                    <span>{customerEmail}</span>
                  </div>
                )}
                {customerPhone && (
                  <div className="text-zinc-800 flex items-center gap-1">
                    <Phone size={11} className="text-zinc-600" />
                    <span>+91 {customerPhone}</span>
                  </div>
                )}
                <div className="text-zinc-700 text-[11px] pt-1 border-t border-zinc-200 mt-1">
                  Place of Supply: <strong className="text-black">{address.state || 'Uttar Pradesh'}</strong>
                </div>
              </div>

              <div className="bg-zinc-50 p-3.5 rounded border border-zinc-300 space-y-1">
                <div className="font-bold text-[10px] text-zinc-700 uppercase tracking-wider border-b border-zinc-200 pb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-black">
                    <MapPin size={12} className="text-black" />
                    <span>Shipped To (Delivery Destination):</span>
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">DOMESTIC</span>
                </div>
                <div className="font-bold text-sm text-black pt-1">
                  {customerName}
                </div>
                <div className="text-zinc-900 leading-snug">
                  {address.address || 'Address on record'}
                  {address.apartment && `, ${address.apartment}`}
                </div>
                <div className="font-bold text-black">
                  {[address.city, address.state].filter(Boolean).join(', ')} {address.pincode ? `- ${address.pincode}` : ''}
                </div>
                <div className="text-zinc-700 text-[11px] pt-1 border-t border-zinc-200 mt-1">
                  Country: <strong className="text-black">India (IN)</strong>
                </div>
              </div>
            </div>

            {/* Logistics & Tracking Bar */}
            <div className="py-2.5 px-4 bg-zinc-100 border border-zinc-300 rounded my-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Truck size={13} className="text-black" />
                <span className="text-zinc-600">Carrier: </span>
                <strong className="text-black">{courierName}</strong>
              </div>
              <div>
                <span className="text-zinc-600">AWB Tracking #: </span>
                <strong className="font-mono text-black font-bold">{trackingNumber}</strong>
              </div>
              <div>
                <span className="text-zinc-600">Fulfillment Hub: </span>
                <strong className="text-black">Kanpur Central, UP</strong>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="my-3 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-black">
                <thead className="bg-black text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-2 border border-black w-8 text-center bg-black text-white">#</th>
                    <th className="p-2 border border-black bg-black text-white">Description of Goods</th>
                    <th className="p-2 border border-black w-16 text-center bg-black text-white">Size</th>
                    <th className="p-2 border border-black w-12 text-center bg-black text-white">Qty</th>
                    <th className="p-2 border border-black w-24 text-right bg-black text-white">Unit Price</th>
                    <th className="p-2 border border-black w-28 text-right bg-black text-white">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-300">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-zinc-500 italic">
                        No line items recorded in order snapshot.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const itemName = item.product_name || item.name || 'LOOZARS Heavyweight Archive Tee';
                      const itemSize = item.size || 'M';
                      const itemSku = item.sku || `${item.productId || 'LZR'}-${itemSize}`;
                      const itemQty = Math.max(1, parseInt(item.quantity, 10) || 1);
                      const itemPrice = Number(item.unit_price || item.unitPrice || item.price || 899);
                      const lineTotal = Number(item.line_total || item.totalPrice || (itemPrice * itemQty));

                      return (
                        <tr key={item.id || item.variantId || idx} className="hover:bg-zinc-50">
                          <td className="p-2.5 border border-zinc-300 text-center font-medium text-zinc-600">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 border border-zinc-300">
                            <div className="font-bold text-black uppercase text-xs">{itemName}</div>
                            <div className="text-[10px] font-mono text-zinc-600">SKU: {itemSku} • HSN 61091000</div>
                          </td>
                          <td className="p-2.5 border border-zinc-300 text-center font-black text-black">
                            <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 rounded font-mono">
                              {itemSize}
                            </span>
                          </td>
                          <td className="p-2.5 border border-zinc-300 text-center font-bold text-black">
                            {itemQty}
                          </td>
                          <td className="p-2.5 border border-zinc-300 text-right font-mono text-zinc-900">
                            ₹{itemPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 border border-zinc-300 text-right font-mono font-bold text-black">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Totals & Legal Declarations */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-2 border-t-2 border-black text-xs">
              
              {/* Left Column: Words & Declarations */}
              <div className="sm:col-span-7 space-y-2.5">
                <div className="bg-zinc-50 p-3 rounded border border-zinc-300">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-0.5">
                    Amount in Words (INR):
                  </span>
                  <p className="font-bold text-black capitalize text-xs">
                    {amountInWords}
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 rounded border border-zinc-300 space-y-1 text-[10px] text-zinc-700 leading-tight">
                  <p className="font-bold uppercase text-black">Terms & Declarations:</p>
                  <p>1. This is a computer-generated tax invoice and retail packing slip from LOOZARS, Kanpur Atelier.</p>
                  <p>2. Products are 100% authentic archival heavyweight streetwear manufactured under strict ISO quality control.</p>
                  <p>3. For exchanges or size queries, contact <strong>support@theloozars.com</strong> within 7 days of delivery.</p>
                </div>
              </div>

              {/* Right Column: Calculations & Signatory */}
              <div className="sm:col-span-5 space-y-1.5">
                <div className="flex justify-between py-1 border-b border-zinc-200 text-zinc-800">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-black">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-zinc-200 text-emerald-800 font-medium">
                    <span>Discount ({order.coupon_code || 'PROMO'}):</span>
                    <span className="font-mono font-bold">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-zinc-200 text-zinc-800">
                  <span>Shipping & Packaging:</span>
                  <span className="font-mono font-bold text-black">{shippingFee === 0 ? 'FREE' : `₹${shippingFee.toLocaleString('en-IN')}`}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-200 text-zinc-600 text-[11px]">
                  <span>GST (IGST / CGST+SGST):</span>
                  <span>Inclusive (All Taxes Paid)</span>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-b-2 border-black font-black text-sm text-black bg-zinc-100 px-2 rounded">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base">₹{total.toLocaleString('en-IN')}</span>
                </div>

                {/* Authorized Signatory Block */}
                <div className="pt-3 text-right">
                  <p className="text-[10px] font-bold text-zinc-700 uppercase">For LOOZARS® (Kanpur Atelier)</p>
                  <div className="h-7 flex items-end justify-end">
                    <span className="font-serif italic text-xs font-bold text-black tracking-wider border-b border-zinc-400 pb-0.5">
                      Authorized Signatory
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Bottom Branding */}
            <div className="mt-6 pt-3 border-t border-zinc-300 flex flex-col sm:flex-row justify-between items-center text-[10px] text-zinc-600 gap-1 font-mono">
              <p>LOOZARS • Kanpur, Uttar Pradesh, India</p>
              <p>Thank you for supporting independent streetwear • www.theloozars.com</p>
            </div>

          </div>
        </div>

        {/* Modal Footer (Hidden on Print) */}
        <div className="bg-[#181818] border-t border-[#262626] p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>LOOZARS, Kanpur Atelier • Ready for A4 Print / PDF Export</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleOpenInNewTab}
              className="px-3.5 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-zinc-300 hover:text-white border border-[#333333] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ExternalLink size={13} />
              <span>Open in New Tab</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-zinc-300 hover:text-white border border-[#333333] text-xs font-medium rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Standard A4 / PDF Direct Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 12mm;
          }
          
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide everything except the invoice sheet */
          .no-print,
          .film-grain,
          header,
          footer,
          nav {
            display: none !important;
          }

          .loozars-modal-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            inset: auto !important;
            display: block !important;
          }

          .loozars-modal-card {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
          }

          .loozars-invoice-scroll-area {
            background: transparent !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
          }

          #official-retail-invoice {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
          }

          .invoice-a4-sheet {
            page-break-after: auto;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

// Aliased export
export const OrderInvoiceBillModal = ThermalPackingSlipModal;
