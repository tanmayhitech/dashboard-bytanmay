import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Tag, 
  MessageSquare, 
  Send, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Plus, 
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Copy,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { 
  toggleCustomerVip, 
  updateCustomerTags, 
  addCustomerNote, 
  deleteCustomerNote, 
  generateWhatsAppUrl 
} from '../../services/crmService';
import { formatOrderNumber } from '../../services/orderService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';

export const AdminCustomerDossierModal = ({ customer, onClose, onRefresh, onSelectOrder }) => {
  const { showToast } = useAdminFeedback();
  const [activeTab, setActiveTab] = useState('overview');
  const [isVipState, setIsVipState] = useState(customer?.is_vip || false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [tagsList, setTagsList] = useState(customer?.tags || []);
  const [notesList, setNotesList] = useState(customer?.notes || []);
  const [selectedWaTemplate, setSelectedWaTemplate] = useState('vip_drop_invite');
  const [copiedField, setCopiedField] = useState(null);

  if (!customer) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    showToast('Copied to Clipboard', `${text}`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleVip = () => {
    const nextState = !isVipState;
    setIsVipState(nextState);
    toggleCustomerVip(customer.id, nextState);
    showToast(
      nextState ? 'VIP Whitelist Assigned' : 'VIP Whitelist Removed',
      nextState ? `${customer.name} marked as VIP Collector.` : `${customer.name} reverted to standard tier.`,
      'success'
    );
    if (onRefresh) onRefresh();
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const createdNote = addCustomerNote(customer.id, newNoteText, 'Admin');
    if (createdNote) {
      setNotesList([createdNote, ...notesList]);
      setNewNoteText('');
      showToast('Note Saved', 'Customer note added.', 'success');
      if (onRefresh) onRefresh();
    }
  };

  const handleDeleteNote = (noteId) => {
    deleteCustomerNote(customer.id, noteId);
    setNotesList(notesList.filter(n => n.id !== noteId));
    showToast('Note Removed', 'Customer note deleted.', 'info');
    if (onRefresh) onRefresh();
  };

  const handleAddTag = (tagToAdd) => {
    const clean = (tagToAdd || newTagInput).trim();
    if (!clean || tagsList.includes(clean)) return;

    const updated = [...tagsList, clean];
    setTagsList(updated);
    setNewTagInput('');
    updateCustomerTags(customer.id, updated);
    showToast('Tag Added', `Tag "${clean}" added.`, 'success');
    if (onRefresh) onRefresh();
  };

  const handleRemoveTag = (tagToRemove) => {
    const updated = tagsList.filter(t => t !== tagToRemove);
    setTagsList(updated);
    updateCustomerTags(customer.id, updated);
    showToast('Tag Removed', `Tag "${tagToRemove}" removed.`, 'info');
    if (onRefresh) onRefresh();
  };

  const whatsAppUrl = generateWhatsAppUrl(customer, selectedWaTemplate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/85 backdrop-blur-xs animate-fadeIn font-sans">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#141418] border border-[#242430] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#EDEDF0] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-4 bg-[#121216]/95 backdrop-blur-md border-b border-[#22222C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#1C1C24] text-white border border-[#2E2E3C] flex items-center justify-center text-sm sm:text-base font-bold shadow-xs tracking-wider shrink-0">
              {customer.initials}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
                  {customer.name}
                </h2>
                {isVipState ? (
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#1C1C26] border border-[#3E3E4E] text-zinc-100 text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                    <Crown size={11} className="text-zinc-300 fill-zinc-300/30" />
                    <span>VIP Whitelist</span>
                  </span>
                ) : customer.orderCount >= 2 ? (
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-violet-950/50 border border-violet-800/60 text-violet-300 text-[10px] sm:text-[11px] font-medium">
                    Repeat Collector
                  </span>
                ) : (
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#1C1C24] border border-[#2C2C38] text-zinc-400 text-[10px] sm:text-[11px]">
                    First-Time Buyer
                  </span>
                )}
              </div>

              <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                {customer.email && (
                  <button
                    onClick={() => handleCopy(customer.email, 'email')}
                    className="hover:text-zinc-200 transition-colors flex items-center gap-1 group cursor-pointer max-w-[180px] sm:max-w-none truncate"
                    title="Click to copy email"
                  >
                    <Mail size={11} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </button>
                )}

                {customer.phone && (
                  <>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <button
                      onClick={() => handleCopy(customer.phone, 'phone')}
                      className="hover:text-zinc-200 transition-colors flex items-center gap-1 group font-mono cursor-pointer"
                      title="Click to copy phone"
                    >
                      <Phone size={11} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                      <span>{customer.phone}</span>
                    </button>
                  </>
                )}

                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <MapPin size={11} className="text-zinc-500 shrink-0" />
                  <span>{customer.city || 'Kanpur'}, {customer.state || 'UP'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#1E1E26]">
            <button
              onClick={handleToggleVip}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer min-h-[36px] ${
                isVipState
                  ? 'bg-[#22222E] text-zinc-100 border-[#3E3E50] hover:bg-[#2A2A38]'
                  : 'bg-[#1C1C24] hover:bg-[#252530] text-zinc-300 border-[#2E2E3C]'
              }`}
            >
              <Crown size={12} className={isVipState ? 'text-zinc-200 fill-zinc-300/30' : 'text-zinc-500'} />
              <span>{isVipState ? 'VIP Whitelist Active' : 'Promote to VIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-[#20202A] rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 border-b border-[#22222C] bg-[#121216] flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {[
            { id: 'overview', label: 'Overview & Metrics', icon: Sparkles },
            { id: 'orders', label: `Orders (${customer.orderCount})`, icon: ShoppingBag },
            { id: 'concierge', label: 'WhatsApp Concierge', icon: MessageSquare },
            { id: 'notes', label: `Staff Notes (${notesList.length})`, icon: FileText },
            { id: 'tags', label: `Tags (${tagsList.length})`, icon: Tag }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 sm:px-3.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer min-h-[40px] ${
                  isActive
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-zinc-300">
          
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-1.5 shadow-xs">
                  <span className="text-zinc-400 block text-xs font-medium">Lifetime Spend (LTV)</span>
                  <p className="text-xl font-bold text-white font-mono tracking-tight">₹{customer.totalSpend.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-1.5 shadow-xs">
                  <span className="text-zinc-400 block text-xs font-medium">Completed Orders</span>
                  <p className="text-xl font-bold text-white tracking-tight">{customer.orderCount}</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-1.5 shadow-xs">
                  <span className="text-zinc-400 block text-xs font-medium">Average Order Value</span>
                  <p className="text-xl font-bold text-white font-mono tracking-tight">₹{(customer.aov || Math.round(customer.totalSpend / Math.max(1, customer.orderCount))).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-1.5 shadow-xs">
                  <span className="text-zinc-400 block text-xs font-medium">Primary Location</span>
                  <p className="text-sm font-bold text-zinc-200 truncate mt-1">{customer.city || 'Kanpur'}, {customer.state || 'UP'}</p>
                </div>
              </div>

              {/* Sizing & Delivery Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-3 shadow-xs">
                  <h3 className="font-semibold text-zinc-200 text-xs flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#181820] border border-[#282834] flex items-center justify-center text-zinc-400 shrink-0">
                      <Compass size={14} />
                    </div>
                    <span>Sizing & Silhouette Profile</span>
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    {customer.sizesList && customer.sizesList.length > 0 ? (
                      customer.sizesList.map((sz, idx) => (
                        <span key={idx} className="px-3 py-1.5 rounded-xl bg-[#1A1A24] border border-[#2A2A3A] text-zinc-200 font-mono font-bold text-xs shadow-xs">
                          Size {sz}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-500">Boxy Oversized Standard</span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500">Affinity calculated across confirmed atelier orders.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#111115] border border-[#22222C] space-y-2.5 shadow-xs leading-relaxed">
                  <h3 className="font-semibold text-zinc-200 text-xs flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#181820] border border-[#282834] flex items-center justify-center text-rose-400 shrink-0">
                      <MapPin size={14} />
                    </div>
                    <span>Shipping Address on Record</span>
                  </h3>
                  <p className="text-zinc-100 font-bold text-xs">{customer.address_line || 'Address details on file'}</p>
                  <p className="text-zinc-400 text-xs">{customer.city}, {customer.state} — {customer.pincode}</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#181820] border border-[#262634] rounded-lg text-[11px] text-zinc-300 font-medium mt-1">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span>Verified Destination</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Orders History */}
          {activeTab === 'orders' && (
            <div className="space-y-3.5">
              {customer.orders && customer.orders.length > 0 ? (
                customer.orders.map((ord, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => onSelectOrder && onSelectOrder(ord)}
                    className="p-5 bg-[#111115] border border-[#22222C] hover:border-[#383848] rounded-2xl space-y-3 shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-white font-mono text-xs group-hover:text-zinc-300 transition-colors">{formatOrderNumber(ord.order_number)}</span>
                        {ord.payment_status === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Paid</span>
                          </span>
                        ) : ord.payment_method === 'cod' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-sky-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            <span>COD Pending</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-zinc-500">Unpaid</span>
                        )}
                      </div>
                      <span className="text-zinc-500 text-xs font-mono">{new Date(ord.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400 pt-2.5 border-t border-[#1C1C24]">
                      <span className="capitalize text-zinc-300 font-medium text-xs">Status: <strong className="text-white">{ord.order_status}</strong> ({ord.payment_method === 'cod' ? 'COD' : 'Online Prepaid'})</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm font-mono">₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}</span>
                        <ChevronRight size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-500 bg-[#111115] border border-[#22222C] rounded-2xl shadow-xs">
                  <ShoppingBag size={24} className="mx-auto mb-2 text-zinc-600" />
                  <p className="font-medium text-xs text-zinc-400">No past orders found in record.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. Concierge WhatsApp */}
          {activeTab === 'concierge' && (
            <div className="space-y-4">
              <div className="p-5 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl text-emerald-300 space-y-1.5 shadow-xs">
                <span className="font-bold block text-xs flex items-center gap-2">
                  <MessageSquare size={14} className="text-emerald-400" />
                  <span>Atelier VIP Concierge Link</span>
                </span>
                <p className="text-xs text-emerald-400/90 leading-relaxed">
                  Generate tailored 1-click WhatsApp concierge messages with order details, VIP drop whitelists, and sizing recommendations for {customer.name}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'vip_drop_invite', title: 'VIP Secret Drop Whitelist Invite' },
                  { id: 'order_tracking', title: 'Order Handoff & Courier Tracking' },
                  { id: 'exclusive_voucher', title: 'Atelier Member Exclusive Gift' },
                  { id: 'concierge_sizing', title: 'Custom Sizing & Boxy Fit Consult' }
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedWaTemplate(tpl.id)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      selectedWaTemplate === tpl.id
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                        : 'bg-[#16161D] border-[#242430] text-zinc-300 hover:bg-[#1C1C24]'
                    }`}
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-[#111115] border border-[#22222C] rounded-2xl whitespace-pre-wrap font-mono text-xs text-zinc-300 leading-relaxed shadow-xs">
                {decodeURIComponent(whatsAppUrl.split('text=')[1] || '')}
              </div>

              <div className="flex justify-end pt-1">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer min-h-[44px]"
                >
                  <Send size={14} />
                  <span>Launch WhatsApp Outreach</span>
                </a>
              </div>
            </div>
          )}

          {/* 4. Staff Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Add private staff note (e.g., requested gift box, preferred courier)..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 bg-[#16161D] border border-[#262634] px-4 py-2.5 rounded-xl text-xs text-zinc-100 outline-none focus:border-zinc-400 shadow-xs placeholder-zinc-600 min-h-[42px]"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer min-h-[42px] flex items-center justify-center"
                >
                  Add Note
                </button>
              </form>

              <div className="space-y-2.5">
                {notesList && notesList.length > 0 ? (
                  notesList.map((n) => (
                    <div key={n.id} className="p-4 bg-[#111115] border border-[#22222C] rounded-2xl flex justify-between items-start shadow-xs">
                      <div>
                        <p className="text-zinc-200 text-xs leading-relaxed">{n.text}</p>
                        <span className="text-[10px] text-zinc-500 mt-1.5 block font-mono">
                          Recorded by {n.author || 'Admin'} • {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <button onClick={() => handleDeleteNote(n.id)} className="text-zinc-500 hover:text-rose-400 p-2 rounded-lg hover:bg-[#1C1C24] cursor-pointer transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-zinc-500 bg-[#111115] border border-[#22222C] rounded-2xl shadow-xs">
                    <p className="text-xs">No internal notes for this customer yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Custom Tags */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleAddTag(); }} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Add customer tag (e.g. VIP Whitelist, Heavy Spender, Stylist)..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="flex-1 bg-[#16161D] border border-[#262634] px-4 py-2.5 rounded-xl text-xs text-zinc-100 outline-none focus:border-zinc-400 shadow-xs placeholder-zinc-600 min-h-[42px]"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer min-h-[42px] flex items-center justify-center"
                >
                  Add Tag
                </button>
              </form>

              <div className="flex items-center gap-2 flex-wrap">
                {tagsList.map((t, idx) => (
                  <span key={idx} className="px-3 py-2 bg-[#16161D] border border-[#262634] text-zinc-200 rounded-xl text-xs flex items-center gap-2 shadow-xs font-medium">
                    <span>#{t}</span>
                    <button onClick={() => handleRemoveTag(t)} className="text-zinc-500 hover:text-rose-400 cursor-pointer p-0.5">
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
