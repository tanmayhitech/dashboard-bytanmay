import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  Crown, 
  Search, 
  Download, 
  RefreshCw, 
  MessageSquare, 
  Mail, 
  MapPin, 
  TrendingUp, 
  ChevronRight,
  Sparkles,
  LayoutGrid,
  ListFilter,
  ShoppingBag,
  ArrowUpRight,
  Phone,
  Tag,
  Star,
  Compass,
  CreditCard,
  Layers,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Send,
  RotateCcw
} from 'lucide-react';
import { fetchAllCustomers, exportCustomersCSV, generateWhatsAppUrl } from '../../services/crmService';
import { fetchAbandonedCarts, updateAbandonedCartStatus } from '../../services/adminService';
import { CustomerGrowthChart } from '../../components/admin/CustomerGrowthChart';
import { AdminCustomerDossierModal } from './AdminCustomerDossierModal';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';

export const AdminCRM = ({ onSelectOrder }) => {
  const { showToast } = useAdminFeedback();
  const [activeSubTab, setActiveSubTab] = useState('directory'); // 'directory' | 'abandoned'

  // CRM Directory State
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [sortBy, setSortBy] = useState('spend_desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Abandoned Carts State
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [abandonedLoading, setAbandonedLoading] = useState(false);
  const [abandonedSearch, setAbandonedSearch] = useState('');
  const [abandonedStatusFilter, setAbandonedStatusFilter] = useState('all');

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error('[AdminCRM] Error loading customers:', err);
      showToast('Data Error', 'Failed to load customers.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const loadAbandonedCarts = useCallback(async () => {
    setAbandonedLoading(true);
    try {
      const res = await fetchAbandonedCarts({ status: abandonedStatusFilter });
      setAbandonedCarts(res.carts || []);
    } catch (err) {
      console.error('[AdminCRM] Error loading abandoned carts:', err);
    } finally {
      setAbandonedLoading(false);
    }
  }, [abandonedStatusFilter]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (activeSubTab === 'abandoned') {
      loadAbandonedCarts();
    }
  }, [activeSubTab, loadAbandonedCarts]);

  useEffect(() => {
    const handleUpdate = () => {
      loadCustomers();
    };
    window.addEventListener('loozars_crm_updated', handleUpdate);
    window.addEventListener('loozars_orders_updated', handleUpdate);
    return () => {
      window.removeEventListener('loozars_crm_updated', handleUpdate);
      window.removeEventListener('loozars_orders_updated', handleUpdate);
    };
  }, [loadCustomers]);

  useEffect(() => {
    const handleAbandonedUpdate = () => {
      loadAbandonedCarts();
    };
    window.addEventListener('loozars_abandoned_updated', handleAbandonedUpdate);
    return () => {
      window.removeEventListener('loozars_abandoned_updated', handleAbandonedUpdate);
    };
  }, [loadAbandonedCarts]);

  // Aggregated Customer Directory Insights
  const metrics = useMemo(() => {
    const total = customers.length;
    if (total === 0) {
      return {
        totalCustomers: 0,
        vipCount: 0,
        repeatCount: 0,
        firstTimeCount: 0,
        repeatRate: 0,
        avgLtv: 0,
        totalRevenue: 0,
        topCities: []
      };
    }

    const vipCount = customers.filter(c => c.is_vip || c.tier === 'vip').length;
    const repeatCount = customers.filter(c => c.orderCount >= 2).length;
    const firstTimeCount = total - repeatCount;
    const repeatRate = Math.round((repeatCount / total) * 100);
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
    const avgLtv = Math.round(totalRevenue / total);

    const cityMap = {};
    customers.forEach(c => {
      const city = (c.city || 'Kanpur').trim();
      cityMap[city] = (cityMap[city] || 0) + 1;
    });

    const topCities = Object.entries(cityMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      totalCustomers: total,
      vipCount,
      repeatCount,
      firstTimeCount,
      repeatRate,
      avgLtv,
      totalRevenue,
      topCities
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.state || '').toLowerCase().includes(q) ||
        (c.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (selectedTier !== 'all') {
      if (selectedTier === 'vip') {
        result = result.filter(c => c.is_vip || c.tier === 'vip');
      } else if (selectedTier === 'repeat') {
        result = result.filter(c => c.orderCount >= 2 && !c.is_vip);
      } else if (selectedTier === 'first_time') {
        result = result.filter(c => c.orderCount <= 1 && !c.is_vip);
      }
    }

    switch (sortBy) {
      case 'spend_desc':
        result.sort((a, b) => b.totalSpend - a.totalSpend);
        break;
      case 'orders_desc':
        result.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case 'date_desc':
        result.sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
        break;
      case 'name_asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      default:
        result.sort((a, b) => b.totalSpend - a.totalSpend);
    }

    return result;
  }, [customers, searchQuery, selectedTier, sortBy]);

  const handleExport = () => {
    if (filteredCustomers.length === 0) {
      showToast('Export Empty', 'No customer records to export.', 'info');
      return;
    }
    exportCustomersCSV(filteredCustomers);
    showToast('CSV Exported', `Exported ${filteredCustomers.length} customer records.`, 'success');
  };

  // Aggregated Abandoned Carts Metrics
  const abandonedMetrics = useMemo(() => {
    const total = abandonedCarts.length;
    const active = abandonedCarts.filter(c => c.recovery_status === 'abandoned').length;
    const contacted = abandonedCarts.filter(c => c.recovery_status === 'contacted').length;
    const recovered = abandonedCarts.filter(c => c.recovery_status === 'recovered').length;
    const totalPipeline = abandonedCarts
      .filter(c => c.recovery_status === 'abandoned' || c.recovery_status === 'contacted')
      .reduce((sum, c) => sum + (Number(c.cart_value) || 0), 0);
    const recoveredValue = abandonedCarts
      .filter(c => c.recovery_status === 'recovered')
      .reduce((sum, c) => sum + (Number(c.cart_value) || 0), 0);
    const recoveryRate = total > 0 ? Math.round((recovered / total) * 100) : 0;

    return {
      total,
      active,
      contacted,
      recovered,
      totalPipeline,
      recoveredValue,
      recoveryRate
    };
  }, [abandonedCarts]);

  const filteredAbandonedCarts = useMemo(() => {
    let result = [...abandonedCarts];
    if (abandonedSearch.trim()) {
      const q = abandonedSearch.toLowerCase().trim();
      result = result.filter(c => 
        (c.customer_name || '').toLowerCase().includes(q) ||
        (c.customer_email || '').toLowerCase().includes(q) ||
        (c.customer_phone || '').toLowerCase().includes(q) ||
        (c.items || []).some(item => (item.name || '').toLowerCase().includes(q))
      );
    }
    if (abandonedStatusFilter !== 'all') {
      result = result.filter(c => c.recovery_status === abandonedStatusFilter);
    }
    return result;
  }, [abandonedCarts, abandonedSearch, abandonedStatusFilter]);

  const handleWhatsAppRecovery = async (cart) => {
    const phone = (cart.customer_phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : (phone.length === 10 ? `91${phone}` : phone);
    const firstName = (cart.customer_name || 'there').split(' ')[0];
    const itemsList = (cart.items || []).map(i => `${i.name || 'Atelier Item'} (${i.size || 'Free Size'})`).join(', ');
    
    const message = `Hello ${firstName}, this is the Loozars Atelier Concierge. We noticed you left ${itemsList || 'exclusive pieces'} in your shopping bag. Would you like assistance completing your reservation before stock clears?`;
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    await updateAbandonedCartStatus({ cartId: cart.id, recoveryStatus: 'contacted' });
    setAbandonedCarts(prev => prev.map(c => c.id === cart.id ? { ...c, recovery_status: 'contacted' } : c));
    showToast('Concierge Dispatched', `WhatsApp recovery link prepared for ${cart.customer_name || 'Shopper'}.`, 'success');
    window.open(waUrl, '_blank');
  };

  const handleStatusChange = async (cartId, newStatus) => {
    try {
      const res = await updateAbandonedCartStatus({ cartId, recoveryStatus: newStatus });
      if (res.success) {
        setAbandonedCarts(prev => prev.map(c => (c.id === cartId || c.session_id === cartId) ? { ...c, recovery_status: newStatus } : c));
        showToast('Cart Updated', `Cart status changed to ${newStatus}.`, 'success');
      }
    } catch (err) {
      showToast('Error', err.message || 'Failed to update cart status', 'error');
    }
  };

  const formatTimeAgo = (dateVal) => {
    if (!dateVal) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(dateVal).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  // Segments ratio for visual bar
  const vipPercent = metrics.totalCustomers > 0 ? Math.round((metrics.vipCount / metrics.totalCustomers) * 100) : 0;
  const repeatPercent = metrics.totalCustomers > 0 ? Math.round((metrics.repeatCount / metrics.totalCustomers) * 100) : 0;
  const firstTimePercent = Math.max(0, 100 - vipPercent - repeatPercent);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Sub-Navigation Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-[#121216] border border-[#22222C] rounded-2xl w-fit shadow-xs">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'directory'
              ? 'bg-[#22222C] text-white border border-[#3A3A4C] shadow-xs font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users size={14} className={activeSubTab === 'directory' ? 'text-zinc-200' : 'text-zinc-500'} />
          <span>Customer Intelligence</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#181820] text-[10px] text-zinc-400 font-mono">
            {metrics.totalCustomers}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('abandoned')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'abandoned'
              ? 'bg-[#22222C] text-white border border-[#3A3A4C] shadow-xs font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShoppingCart size={14} className={activeSubTab === 'abandoned' ? 'text-zinc-200' : 'text-zinc-500'} />
          <span>Abandoned Carts</span>
          {abandonedMetrics.active > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/60 text-[10px] font-mono font-semibold">
              {abandonedMetrics.active} active
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'directory' ? (
        <>
          {/* 1. Header & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-[#EDEDF0] tracking-tight">Customer Directory</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#18181F] text-zinc-300 border border-[#2A2A36] text-[11px] font-mono font-medium">
                  {metrics.totalCustomers} Profiles
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Lifetime spend records, sizing profiles, VIP whitelists, and 1-click concierge outreach.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="flex items-center bg-[#141418] border border-[#24242E] rounded-xl p-0.5 shadow-xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-[#262632] text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Table View"
                >
                  <ListFilter size={14} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-[#262632] text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>

              <button
                onClick={loadCustomers}
                className="px-3 py-1.5 bg-[#16161A] hover:bg-[#202028] text-zinc-300 border border-[#262630] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExport}
                className="px-3.5 py-1.5 bg-[#16161A] hover:bg-[#202028] text-zinc-300 border border-[#262630] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 2. Flat Matte Atelier KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* Total Customers */}
            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Total Customers</span>
                <Users size={15} className="text-zinc-500" />
              </div>
              <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{metrics.totalCustomers || 0}</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">
                Verified profiles in ledger
              </div>
            </div>

            {/* New Customers */}
            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                  <span>New Customers</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-[#1C1C24] px-2 py-0.5 rounded-md border border-[#2A2A38]">
                  {firstTimePercent}%
                </span>
              </div>
              <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{metrics.firstTimeCount || 0}</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">
                First-time buyers (1 order)
              </div>
            </div>

            {/* Returning Customers */}
            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                  <span>Returning Customers</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-[#1C1C24] px-2 py-0.5 rounded-md border border-[#2A2A38]">
                  {repeatPercent}%
                </span>
              </div>
              <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{metrics.repeatCount || 0}</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">
                Repeat drop collectors (2+ orders)
              </div>
            </div>

            {/* Repeat Purchase Rate */}
            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Repeat Purchase Rate</span>
                <TrendingUp size={15} className="text-zinc-400" />
              </div>
              <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{metrics.repeatRate || 0}%</div>
              <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
                Gross: ₹{(metrics.totalRevenue || 0).toLocaleString('en-IN')} (Avg: ₹{(metrics.avgLtv || 0).toLocaleString('en-IN')})
              </div>
            </div>
          </div>

          {/* 3. Customer Growth & Retention Interactive Line Chart */}
          <CustomerGrowthChart customers={customers} />

          {/* 3. Creative Visual: Segment Distribution & Top Geographic Hubs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Segment Ratio Visual Bar */}
            <div className="lg:col-span-7 bg-[#16161A] border border-[#24242E] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Layers size={13} className="text-zinc-400" />
                    <span>Customer Composition</span>
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">Segmentation Ratio</span>
                </div>

                <div className="w-full h-3.5 bg-[#101014] rounded-full overflow-hidden flex gap-1 p-0.5 border border-[#262632]">
                  <div 
                    style={{ width: `${vipPercent}%` }} 
                    className="h-full bg-gradient-to-r from-zinc-400 to-zinc-200 rounded-l-full transition-all duration-500 shadow-xs" 
                    title={`VIP: ${metrics.vipCount} (${vipPercent}%)`} 
                  />
                  <div 
                    style={{ width: `${repeatPercent}%` }} 
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 shadow-xs" 
                    title={`Repeat: ${metrics.repeatCount} (${repeatPercent}%)`} 
                  />
                  <div 
                    style={{ width: `${firstTimePercent}%` }} 
                    className="h-full bg-zinc-700 rounded-r-full transition-all duration-500" 
                    title={`First-Time: ${metrics.firstTimeCount} (${firstTimePercent}%)`} 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-[#202028] text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
                  <span className="text-zinc-200 font-medium">VIP Whitelist ({metrics.vipCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />
                  <span className="text-violet-300 font-medium">Repeat Buyers ({metrics.repeatCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                  <span className="text-zinc-400">First-Time ({metrics.firstTimeCount})</span>
                </div>
              </div>
            </div>

            {/* Top Hub Geographies */}
            <div className="lg:col-span-5 bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <MapPin size={13} className="text-zinc-400" />
                  <span>Top Destinations</span>
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">Volume Share</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {metrics.topCities.map((city, idx) => (
                  <div key={idx} className="bg-[#181820] border border-[#262634] p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-200 text-xs">{city.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{city.count} patrons</div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-zinc-400 bg-[#20202C] px-2 py-0.5 rounded-md">
                      {city.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Search, Filter & Sorter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search customers by name, phone, email, city, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#16161A] border border-[#262632] focus:border-zinc-500 text-zinc-100 pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none transition-colors placeholder-zinc-600 shadow-xs"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full bg-[#16161A] border border-[#262632] focus:border-zinc-500 text-zinc-200 px-3.5 py-2.5 text-xs rounded-xl outline-none transition-colors cursor-pointer shadow-xs"
              >
                <option value="all">All Tiers & Segments</option>
                <option value="vip">VIP Whitelist Only</option>
                <option value="repeat">Repeat Buyers (2+ Orders)</option>
                <option value="first_time">First-Time Customers</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#16161A] border border-[#262632] focus:border-zinc-500 text-zinc-200 px-3.5 py-2.5 text-xs rounded-xl outline-none transition-colors cursor-pointer shadow-xs"
              >
                <option value="spend_desc">Sort by: Highest Spend (LTV)</option>
                <option value="orders_desc">Sort by: Most Orders</option>
                <option value="date_desc">Sort by: Most Recent Order</option>
                <option value="name_asc">Sort by: Name (A to Z)</option>
              </select>
            </div>
          </div>

          {/* 5. Directory Grid or Table */}
          {isLoading ? (
            <div className="bg-[#16161A] border border-[#24242E] rounded-2xl p-16 text-center text-zinc-500">
              <RefreshCw size={24} className="animate-spin mx-auto text-zinc-500 mb-2" />
              <p className="text-xs">Loading customer intelligence...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-[#16161A] border border-[#24242E] rounded-2xl p-16 text-center text-zinc-500">
              <p className="font-semibold text-zinc-300 text-sm">No Customers Found</p>
              <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters or search keywords.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredCustomers.map((c) => {
                const isVip = c.is_vip || c.tier === 'vip';
                const waUrl = generateWhatsAppUrl(c, 'vip_drop_invite');

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="bg-[#16161A] border border-[#24242E] hover:border-[#383848] p-4 rounded-2xl shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#1F1F2A] border border-[#2E2E3C] text-white flex items-center justify-center font-bold text-xs shadow-xs tracking-wider">
                            {c.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-[#EDEDF0] flex items-center gap-1.5 text-xs">
                              <span>{c.name}</span>
                              {isVip && <Crown size={12} className="text-zinc-300 fill-zinc-300/30" />}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate max-w-[150px]">{c.email}</div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isVip 
                            ? 'bg-[#1E1E28] text-zinc-200 border-[#323244]' 
                            : c.orderCount >= 2 
                            ? 'bg-violet-950/50 text-violet-300 border-violet-800/60'
                            : 'bg-[#121216] text-zinc-400 border-[#24242E]'
                        }`}>
                          {isVip ? 'VIP' : c.orderCount >= 2 ? 'Repeat' : 'First-Time'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-[#121216] border border-[#202028] p-2.5 rounded-xl mb-3 text-[11px]">
                        <div>
                          <div className="text-zinc-500 text-[10px]">Lifetime Spend</div>
                          <div className="font-bold text-[#EDEDF0] font-mono mt-0.5">₹{c.totalSpend.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-[10px]">Orders Placed</div>
                          <div className="font-bold text-zinc-200 font-mono mt-0.5">{c.orderCount}</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-[10px] text-zinc-500 mb-1">Acquired Sizes</div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {c.sizesList && c.sizesList.length > 0 ? (
                            c.sizesList.map((sz, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-[#1E1E28] text-zinc-300 border border-[#2B2B36] text-[10px] font-mono font-bold">
                                {sz}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-500 text-[10px]">Standard</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-[#202028] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Last: {new Date(c.lastOrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 transition-colors"
                          title="Concierge WhatsApp"
                        >
                          <MessageSquare size={13} />
                        </a>
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-3 py-1.5 bg-[#1C1C24] hover:bg-[#252532] text-zinc-200 border border-[#2C2C38] hover:border-[#3D3D4E] rounded-xl text-xs font-medium flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                        >
                          <span>Dossier</span>
                          <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table / Card View */
            <div className="bg-[#16161A] border border-[#24242E] rounded-2xl shadow-xs overflow-hidden">
              {/* Mobile Customer Cards (< md) */}
              <div className="md:hidden divide-y divide-[#202028]">
                {filteredCustomers.map((c) => {
                  const isVip = c.is_vip || c.tier === 'vip';
                  const waUrl = generateWhatsAppUrl(c, 'vip_drop_invite');

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="p-4 space-y-3 hover:bg-[#1A1A22] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#1C1C24] text-white border border-[#2E2E3C] flex items-center justify-center font-bold text-xs shadow-xs tracking-wider shrink-0">
                            {c.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-[#EDEDF0] flex items-center gap-1.5 text-xs">
                              <span>{c.name}</span>
                              {isVip && <Crown size={12} className="text-zinc-300 fill-zinc-300/30" />}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate max-w-[180px]">{c.email || c.phone || 'No contact'}</div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                          isVip
                            ? 'bg-[#1E1E28] text-zinc-200 border-[#323244]'
                            : c.orderCount >= 2
                            ? 'bg-violet-950/50 text-violet-300 border-violet-800/60'
                            : 'bg-[#121216] text-zinc-400 border-[#24242E]'
                        }`}>
                          {isVip ? 'VIP' : c.orderCount >= 2 ? 'Repeat' : 'First-Time'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-[#121216] border border-[#202028] p-2.5 rounded-xl text-center text-[11px]">
                        <div>
                          <div className="text-zinc-500 text-[10px]">Spend</div>
                          <div className="font-bold text-[#EDEDF0] font-mono mt-0.5">₹{c.totalSpend.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-[10px]">Orders</div>
                          <div className="font-bold text-zinc-200 font-mono mt-0.5">{c.orderCount}</div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-[10px]">City</div>
                          <div className="font-medium text-zinc-300 truncate mt-0.5">{c.city || 'Kanpur'}</div>
                        </div>
                      </div>

                      {c.sizesList && c.sizesList.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-zinc-500">Sizes:</span>
                          {c.sizesList.map((sz, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-[#1E1E28] text-zinc-300 border border-[#2B2B36] text-[10px] font-mono font-bold">
                              {sz}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[#202028]" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Last: {new Date(c.lastOrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>

                        <div className="flex items-center gap-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 transition-colors"
                            title="WhatsApp Concierge"
                          >
                            <MessageSquare size={13} />
                          </a>

                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="px-3 py-1.5 rounded-xl bg-[#1C1C24] hover:bg-[#252532] text-zinc-200 border border-[#2C2C38] text-xs font-medium flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          >
                            <span>Dossier</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121216] text-zinc-400 font-semibold border-b border-[#24242E]">
                    <tr>
                      <th className="py-3 px-4">Customer Profile</th>
                      <th className="py-3 px-4">City / Region</th>
                      <th className="py-3 px-3 text-center">Orders</th>
                      <th className="py-3 px-4 text-right">Lifetime Spend</th>
                      <th className="py-3 px-4">Size Run</th>
                      <th className="py-3 px-4 text-center">Tier Status</th>
                      <th className="py-3 px-4">Last Active</th>
                      <th className="py-3 px-4 text-right">Concierge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202028]">
                    {filteredCustomers.map((c) => {
                      const isVip = c.is_vip || c.tier === 'vip';
                      const waUrl = generateWhatsAppUrl(c, 'vip_drop_invite');

                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCustomer(c)}
                          className="hover:bg-[#1A1A22] transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1C1C24] text-white border border-[#2E2E3C] flex items-center justify-center font-bold text-xs shadow-xs tracking-wider">
                                {c.initials}
                              </div>
                              <div>
                                <div className="font-semibold text-[#EDEDF0] flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  {isVip && <Crown size={12} className="text-zinc-300 fill-zinc-300/30" />}
                                </div>
                                <div className="text-[11px] text-zinc-500">{c.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-zinc-300">
                            <div className="font-medium text-zinc-200">{c.city || 'Kanpur'}</div>
                            <div className="text-[11px] text-zinc-500">{c.state || 'UP'}</div>
                          </td>

                          <td className="py-3.5 px-3 text-center font-bold text-[#EDEDF0] font-mono">
                            {c.orderCount}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#EDEDF0] font-mono">
                            ₹{c.totalSpend.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1 flex-wrap">
                              {c.sizesList && c.sizesList.length > 0 ? (
                                c.sizesList.map((sz, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-md bg-[#1C1C24] text-zinc-300 border border-[#2B2B36] text-[10px] font-mono font-bold">
                                    {sz}
                                  </span>
                                ))
                              ) : (
                                <span className="text-zinc-500 text-[11px]">Standard</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border inline-block ${
                              isVip
                                ? 'bg-[#1E1E28] text-zinc-200 border-[#323244]'
                                : c.orderCount >= 2
                                ? 'bg-violet-950/50 text-violet-300 border-violet-800/60'
                                : 'bg-[#121216] text-zinc-400 border-[#24242E]'
                            }`}>
                              {isVip ? 'VIP' : c.orderCount >= 2 ? 'Repeat' : 'First-Time'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-zinc-400 text-xs font-mono">
                            <div>{new Date(c.lastOrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          </td>

                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 transition-colors"
                                title="WhatsApp Concierge"
                              >
                                <MessageSquare size={13} />
                              </a>

                              <button
                                onClick={() => setSelectedCustomer(c)}
                                className="px-3 py-1.5 rounded-xl bg-[#1C1C24] hover:bg-[#252532] text-zinc-200 border border-[#2C2C38] hover:border-[#3D3D4E] text-xs font-medium flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                              >
                                <span>Dossier</span>
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Customer Dossier Modal */}
          {selectedCustomer && (
            <AdminCustomerDossierModal
              customer={selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
              onRefresh={loadCustomers}
              onSelectOrder={(order) => {
                setSelectedCustomer(null);
                if (onSelectOrder) onSelectOrder(order);
              }}
            />
          )}
        </>
      ) : (
        /* ABANDONED CARTS RECOVERY SUB-TAB */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-[#EDEDF0] tracking-tight">Abandoned Carts Recovery</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-950/40 text-rose-300 border border-rose-800/50 text-[11px] font-mono font-semibold">
                  ₹{abandonedMetrics.totalPipeline.toLocaleString('en-IN')} Pipeline
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Real-time drop abandonment tracking, recoverable reservation value, and 1-click WhatsApp concierge conversion.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAbandonedCarts}
                className="px-3.5 py-1.5 bg-[#16161A] hover:bg-[#202028] text-zinc-300 border border-[#262630] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RefreshCw size={13} className={abandonedLoading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Abandoned Carts KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* Active Abandoned */}
            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Active Unrecovered</span>
                <ShoppingCart size={15} className="text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{abandonedMetrics.active}</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">
                Require concierge follow-up
              </div>
            </div>

            {/* Recoverable Pipeline */}
            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Recoverable Pipeline</span>
                <TrendingUp size={15} className="text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-300 tracking-tight font-mono">₹{abandonedMetrics.totalPipeline.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">
                In-cart pending value
              </div>
            </div>

            {/* Recovered Value */}
            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Recovered Revenue</span>
                <CheckCircle2 size={15} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">₹{abandonedMetrics.recoveredValue.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">
                {abandonedMetrics.recovered} carts converted
              </div>
            </div>

            {/* Recovery Rate */}
            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Recovery Rate</span>
                <Crown size={15} className="text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{abandonedMetrics.recoveryRate}%</div>
              <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
                {abandonedMetrics.contacted} in active outreach
              </div>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-7 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by shopper name, phone, email, or product..."
                value={abandonedSearch}
                onChange={(e) => setAbandonedSearch(e.target.value)}
                className="w-full bg-[#16161A] border border-[#262632] focus:border-zinc-500 text-zinc-100 pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none transition-colors placeholder-zinc-600 shadow-xs"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-5 flex items-center gap-1 bg-[#121216] p-1 rounded-xl border border-[#22222C] text-xs overflow-x-auto">
              {[
                { id: 'all', label: 'All Baskets' },
                { id: 'abandoned', label: 'Abandoned' },
                { id: 'contacted', label: 'Contacted' },
                { id: 'recovered', label: 'Recovered' },
                { id: 'expired', label: 'Expired' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAbandonedStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                    abandonedStatusFilter === tab.id
                      ? 'bg-[#22222C] text-white border border-[#3A3A4C] shadow-xs font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Abandoned Carts Table / Cards */}
          <div className="bg-[#16161A] border border-[#24242E] rounded-2xl shadow-xs overflow-hidden">
            {/* Mobile Abandoned Cart Cards (< md) */}
            <div className="md:hidden">
              {abandonedLoading ? (
                <div className="py-16 text-center text-zinc-500">
                  <RefreshCw size={20} className="animate-spin mx-auto text-zinc-500 mb-2" />
                  <span>Loading abandoned carts...</span>
                </div>
              ) : filteredAbandonedCarts.length === 0 ? (
                <div className="py-16 text-center text-zinc-500">
                  <p className="font-semibold text-zinc-300 text-sm">No Abandoned Carts Found</p>
                  <p className="text-xs text-zinc-500 mt-1">No shopping sessions match the selected status filter.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#202028]">
                  {filteredAbandonedCarts.map((cart) => {
                    const timeAgoStr = formatTimeAgo(cart.last_activity_at || cart.created_at);
                    const items = Array.isArray(cart.items) ? cart.items : [];

                    return (
                      <div key={cart.id || cart.session_id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-[#EDEDF0] text-xs">{cart.customer_name || 'Anonymous Shopper'}</div>
                            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{cart.customer_phone || cart.customer_email || 'No contact info'}</div>
                          </div>

                          {cart.recovery_status === 'recovered' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Recovered</span>
                            </span>
                          ) : cart.recovery_status === 'contacted' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>Contacted</span>
                            </span>
                          ) : cart.recovery_status === 'expired' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                              <span>Expired</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                              <span>Abandoned</span>
                            </span>
                          )}
                        </div>

                        {/* Cart Items Matrix */}
                        <div className="bg-[#121216] border border-[#202028] p-2.5 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#1C1C24]">
                            <span className="text-zinc-500">Cart Value</span>
                            <span className="font-bold text-[#EDEDF0] font-mono text-xs">₹{Number(cart.cart_value || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="space-y-1 pt-0.5">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <span className="font-medium text-zinc-200 truncate max-w-[200px]">{item.name || 'Atelier Piece'}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.size && (
                                    <span className="px-1.5 py-0.2 rounded bg-[#20202C] text-zinc-300 border border-[#2E2E3E] font-mono text-[9px]">
                                      {item.size}
                                    </span>
                                  )}
                                  <span className="text-zinc-500 font-mono text-[10px]">x{item.quantity || 1}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <Clock size={11} className="text-zinc-500" />
                            <span>{timeAgoStr}</span>
                          </div>
                          {cart.last_activity_at && (
                            <span className="font-mono text-[10px]">
                              {new Date(cart.last_activity_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[#202028]">
                          <button
                            onClick={() => handleWhatsAppRecovery(cart)}
                            className="flex-1 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[38px]"
                          >
                            <MessageSquare size={13} />
                            <span>WhatsApp Recovery</span>
                          </button>

                          <select
                            value={cart.recovery_status || 'abandoned'}
                            onChange={(e) => handleStatusChange(cart.id, e.target.value)}
                            className="bg-[#1A1A24] border border-[#2C2C3C] text-zinc-300 text-xs rounded-xl px-2.5 py-2 outline-none cursor-pointer min-h-[38px]"
                          >
                            <option value="abandoned">Abandoned</option>
                            <option value="contacted">Contacted</option>
                            <option value="recovered">Recovered</option>
                            <option value="expired">Expired</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Abandoned Carts Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121216] text-zinc-400 font-semibold border-b border-[#24242E]">
                  <tr>
                    <th className="py-3 px-4">Shopper</th>
                    <th className="py-3 px-4">Cart Contents</th>
                    <th className="py-3 px-4 text-right">Value</th>
                    <th className="py-3 px-4">Abandoned</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Concierge Recovery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202028]">
                  {abandonedLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500">
                        <RefreshCw size={20} className="animate-spin mx-auto text-zinc-500 mb-2" />
                        <span>Loading abandoned carts...</span>
                      </td>
                    </tr>
                  ) : filteredAbandonedCarts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500">
                        <p className="font-semibold text-zinc-300 text-sm">No Abandoned Carts Found</p>
                        <p className="text-xs text-zinc-500 mt-1">No shopping sessions match the selected status filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAbandonedCarts.map((cart) => {
                      const timeAgoStr = formatTimeAgo(cart.last_activity_at || cart.created_at);
                      const items = Array.isArray(cart.items) ? cart.items : [];

                      return (
                        <tr key={cart.id || cart.session_id} className="hover:bg-[#1A1A22] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#EDEDF0]">{cart.customer_name || 'Anonymous Shopper'}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">{cart.customer_phone || 'No phone'}</div>
                            {cart.customer_email && (
                              <div className="text-[10px] text-zinc-500">{cart.customer_email}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1 max-w-[280px]">
                              {items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                  <span className="font-medium text-zinc-200 truncate">{item.name || 'Atelier Item'}</span>
                                  {item.size && (
                                    <span className="px-1.5 py-0.2 rounded bg-[#20202C] text-zinc-300 border border-[#2E2E3E] font-mono text-[9px]">
                                      {item.size}
                                    </span>
                                  )}
                                  <span className="text-zinc-500 font-mono text-[10px]">x{item.quantity || 1}</span>
                                </div>
                              ))}
                              {items.length > 3 && (
                                <div className="text-[10px] text-zinc-500 font-mono">+{items.length - 3} more pieces</div>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#EDEDF0] font-mono">
                            ₹{Number(cart.cart_value || 0).toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-4 text-zinc-400 text-xs">
                            <div className="flex items-center gap-1 text-zinc-300 font-medium">
                              <Clock size={11} className="text-zinc-500" />
                              <span>{timeAgoStr}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              {cart.last_activity_at ? new Date(cart.last_activity_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {cart.recovery_status === 'recovered' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>Recovered</span>
                              </span>
                            ) : cart.recovery_status === 'contacted' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>Contacted</span>
                              </span>
                            ) : cart.recovery_status === 'expired' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                <span>Expired</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                                <span>Abandoned</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1-Click WhatsApp Concierge */}
                              <button
                                onClick={() => handleWhatsAppRecovery(cart)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                title="Send tailored 1-click WhatsApp concierge recovery"
                              >
                                <MessageSquare size={13} />
                                <span>WhatsApp Recovery</span>
                              </button>

                              {/* Status Action Dropdown */}
                              <select
                                value={cart.recovery_status || 'abandoned'}
                                onChange={(e) => handleStatusChange(cart.id, e.target.value)}
                                className="bg-[#1A1A24] border border-[#2C2C3C] text-zinc-300 text-[11px] rounded-lg px-2 py-1 outline-none cursor-pointer"
                              >
                                <option value="abandoned">Mark Abandoned</option>
                                <option value="contacted">Mark Contacted</option>
                                <option value="recovered">Mark Recovered</option>
                                <option value="expired">Mark Expired</option>
                              </select>
                            </div>
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
      )}

    </div>
  );
};
