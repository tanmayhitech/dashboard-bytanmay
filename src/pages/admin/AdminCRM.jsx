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
  Layers
} from 'lucide-react';
import { fetchAllCustomers, exportCustomersCSV, generateWhatsAppUrl } from '../../services/crmService';
import { AdminCustomerDossierModal } from './AdminCustomerDossierModal';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';

export const AdminCRM = ({ onSelectOrder }) => {
  const { showToast } = useAdminFeedback();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [sortBy, setSortBy] = useState('spend_desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

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

  // Aggregated Insights & Top Geographies
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

  // Segments ratio for the visual bar
  const vipPercent = metrics.totalCustomers > 0 ? Math.round((metrics.vipCount / metrics.totalCustomers) * 100) : 0;
  const repeatPercent = metrics.totalCustomers > 0 ? Math.round((metrics.repeatCount / metrics.totalCustomers) * 100) : 0;
  const firstTimePercent = Math.max(0, 100 - vipPercent - repeatPercent);

  return (
    <div className="space-y-6 font-sans">
      
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
        {/* Total Profiles */}
        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="font-medium text-zinc-300">Total Profiles</span>
            <Users size={15} className="text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{metrics.totalCustomers}</div>
          <div className="text-[11px] text-zinc-500 mt-1.5">
            Verified shoppers in ledger
          </div>
        </div>

        {/* VIP Whitelist */}
        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="font-medium text-zinc-300 flex items-center gap-1.5">
              <span>VIP Whitelist</span>
              <Crown size={13} className="text-zinc-400 fill-zinc-400/30" />
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-[#1C1C24] px-2 py-0.5 rounded-md border border-[#2A2A38]">
              {vipPercent}%
            </span>
          </div>
          <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{metrics.vipCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1.5">
            High-LTV drop collectors
          </div>
        </div>

        {/* Repeat Rate */}
        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="font-medium text-zinc-300">Repeat Order Rate</span>
            <TrendingUp size={15} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{metrics.repeatRate}%</div>
          <div className="text-[11px] text-zinc-500 mt-1.5">
            {metrics.repeatCount} returning collectors
          </div>
        </div>

        {/* Average Customer Spend (LTV) */}
        <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#333342] transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="font-medium text-zinc-300">Avg Lifetime Spend</span>
            <ShoppingBag size={15} className="text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">₹{metrics.avgLtv.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
            Gross: ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

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

            {/* Zero-Weight Native CSS Segmented Progress Bar */}
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

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {metrics.topCities.map((c, idx) => (
              <div key={idx} className="bg-[#101014] border border-[#1E1E28] rounded-xl px-3 py-2.5 hover:border-[#2A2A38] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 text-xs truncate flex items-center gap-1">
                    <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                    <span>{c.name}</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 font-medium">{c.percentage}%</span>
                </div>
                <div className="w-full bg-[#1A1A22] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-zinc-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, c.percentage * 2)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Search, Sort & Tier Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, city, or tag..."
            className="w-full bg-[#16161A] border border-[#24242E] focus:border-zinc-500 text-zinc-100 pl-9 pr-4 py-2 text-xs rounded-xl outline-none transition-colors placeholder-zinc-600 shadow-xs"
          />
        </div>

        {/* Tier Tabs */}
        <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-xl border border-[#202028] text-xs overflow-x-auto">
          {[
            { id: 'all', label: `All (${customers.length})` },
            { id: 'vip', label: `VIP (${metrics.vipCount})` },
            { id: 'repeat', label: `Repeat (${metrics.repeatCount})` },
            { id: 'first_time', label: `First-Time (${metrics.firstTimeCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTier(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedTier === tab.id
                  ? 'bg-[#262632] text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="w-full sm:w-44">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-[#16161A] border border-[#24242E] focus:border-zinc-500 text-zinc-200 px-3 py-2 text-xs rounded-xl outline-none transition-colors cursor-pointer shadow-xs"
          >
            <option value="spend_desc">Highest Spend (LTV)</option>
            <option value="orders_desc">Most Orders</option>
            <option value="date_desc">Most Recent Order</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 5. Content View: Table or Grid */}
      {isLoading ? (
        <div className="bg-[#16161A] border border-[#24242E] rounded-2xl py-20 text-center text-zinc-400 flex flex-col items-center justify-center gap-2 shadow-xs">
          <RefreshCw size={20} className="animate-spin text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">Loading Customer Profiles...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-[#16161A] border border-[#24242E] rounded-2xl py-20 text-center text-zinc-500 shadow-xs">
          <Users size={32} className="mx-auto text-zinc-600 mb-2" />
          <p className="font-semibold text-zinc-300 text-sm">No Customer Records Found</p>
          <p className="text-xs text-zinc-500 mt-0.5">Try searching with a different term or filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCustomers.map((c) => {
            const isVip = c.is_vip || c.tier === 'vip';
            const waUrl = generateWhatsAppUrl(c, 'vip_drop_invite');

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className="bg-[#16161A] border border-[#24242E] hover:border-[#383848] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1C1C24] text-white border border-[#2E2E3C] flex items-center justify-center font-bold text-xs shadow-xs tracking-wider">
                        {c.initials}
                      </div>
                      <div>
                        <div className="font-bold text-[#EDEDF0] text-sm flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {isVip && <Crown size={13} className="text-zinc-300 fill-zinc-300/30" />}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[170px]">{c.email}</div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isVip
                        ? 'bg-[#1E1E28] text-zinc-200 border-[#323244]'
                        : c.orderCount >= 2
                        ? 'bg-violet-950/50 text-violet-300 border-violet-800/60'
                        : 'bg-[#121216] text-zinc-400 border-[#24242E]'
                    }`}>
                      {isVip ? 'VIP Whitelist' : c.orderCount >= 2 ? 'Repeat' : 'First-Time'}
                    </span>
                  </div>

                  {/* Financial & Location Snapshot */}
                  <div className="grid grid-cols-3 gap-2 bg-[#111115] border border-[#22222C] rounded-xl p-3 mb-3.5 text-center">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Orders</span>
                      <span className="font-bold text-[#EDEDF0] text-xs">{c.orderCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Lifetime Spend</span>
                      <span className="font-bold text-[#EDEDF0] text-xs font-mono">₹{c.totalSpend.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">City</span>
                      <span className="font-semibold text-zinc-300 text-xs truncate block">{c.city || 'Kanpur'}</span>
                    </div>
                  </div>

                  {/* Sizes Profile */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] text-zinc-500 font-medium">Sizes:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {c.sizesList && c.sizesList.length > 0 ? (
                        c.sizesList.map((sz, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#1C1C24] text-zinc-300 border border-[#2B2B36] rounded-md text-[10px] font-mono font-bold">
                            {sz}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500 text-[10px]">Standard</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
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
        /* Table View */
        <div className="bg-[#16161A] border border-[#24242E] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
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

    </div>
  );
};
