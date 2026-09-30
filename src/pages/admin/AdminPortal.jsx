import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { LoginPage } from '../auth/LoginPage';
import { AdminAccessDenied } from './AdminAccessDenied';
import { AdminOverview } from './AdminOverview';
import { AdminOrders } from './AdminOrders';
import { AdminInventory } from './AdminInventory';
import { AdminProducts } from './AdminProducts';
import { AdminCoupons } from './AdminCoupons';
import { AdminInfluencers } from './AdminInfluencers';
import { AdminInventoryLogs } from './AdminInventoryLogs';
import { AdminCRM } from './AdminCRM';
import { StockAdjustModal } from './StockAdjustModal';
import { AdminOrderDetailModal } from './AdminOrderDetailModal';
import { 
  testTelegramPing 
} from '../../services/adminService';
import { 
  LogOut, 
  ExternalLink, 
  RefreshCw, 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Layers, 
  Tag, 
  Users,
  FileText,
  Store,
  Search,
  Settings,
  Bell,
  CheckCircle2,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Star,
  AlertTriangle,
  Moon,
  Zap,
  MessageSquare
} from 'lucide-react';

import { AdminFeedbackProvider } from '../../context/AdminFeedbackContext';
import { AdminActionToastContainer } from '../../components/admin/AdminActionToastContainer';

export const AdminPortalContent = () => {
  const { user, isAuthenticated, isAdmin, adminRole, isLoading, signOut } = useAuth();
  const { navigateTo } = useShop();

  const [activeTab, setActiveTab] = useState('overview');
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['overview']));
  const [modalOrder, setModalOrder] = useState(null);
  const [modalStockItem, setModalStockItem] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramPingResult, setTelegramPingResult] = useState(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const handleTelegramTest = async () => {
    setIsTestingTelegram(true);
    setTelegramPingResult(null);
    try {
      const res = await testTelegramPing();
      if (res.success) {
        setTelegramPingResult({ success: true, message: 'Telegram test ping dispatched successfully to configured channel.' });
      } else {
        setTelegramPingResult({ success: false, message: res.reason || 'Telegram ping logged.' });
      }
    } catch (err) {
      setTelegramPingResult({ success: false, message: err.message || 'Error triggering test ping.' });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Purge legacy client test data caches from browser storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const PURGE_KEY = 'loozars_client_data_purged_v2';
      if (!localStorage.getItem(PURGE_KEY)) {
        localStorage.removeItem('loozars_store_orders_v1');
        localStorage.removeItem('loozars_abandoned_carts');
        localStorage.removeItem('loozars_product_reviews');
        localStorage.removeItem('loozars_order_returns');
        localStorage.removeItem('loozars_crm_metadata_v1');
        localStorage.removeItem('loozars_influencer_commissions');
        localStorage.setItem(PURGE_KEY, 'true');
      }
    }
  }, []);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setIsMobileSearchOpen(prev => !prev);
        } else {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }
      if (e.key === 'Escape') {
        if (isMobileSearchOpen) setIsMobileSearchOpen(false);
        if (isMobileNavOpen) setIsMobileNavOpen(false);
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSearchOpen, isMobileNavOpen]);

  // Mobile body scroll lock
  useEffect(() => {
    if (isMobileNavOpen || isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen, isMobileSearchOpen]);

  // Focus mobile search input when opened
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 100);
    }
  }, [isMobileSearchOpen]);

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    setVisitedTabs(prev => new Set(prev).add(tabId));
    setIsMobileNavOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleGlobalRefresh = () => {
    setIsGlobalRefreshing(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('loozars_admin_refresh_all'));
      window.dispatchEvent(new CustomEvent('loozars_orders_updated'));
      window.dispatchEvent(new CustomEvent('loozars_catalog_updated'));
    }
    setTimeout(() => {
      setIsGlobalRefreshing(false);
    }, 600);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#0B0B0D] text-zinc-100 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 rounded-xl bg-[#16161A] border border-[#24242A] shadow-lg flex items-center justify-center mb-3">
          <RefreshCw size={18} className="animate-spin text-zinc-300" />
        </div>
        <p className="text-xs font-medium text-zinc-400">
          Loading Admin Dashboard...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State → Unified Login Page
  if (!isAuthenticated) {
    return <LoginPage defaultTab="admin" />;
  }

  // 3. Authenticated Non-Admin State → Access Denied
  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  // 4. Navigation Group Structure
  const navigationGroups = [
    {
      title: null,
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      title: 'STORE',
      items: [
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'products', label: 'Products', icon: Layers },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'coupons', label: 'Coupons', icon: Tag }
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        { id: 'crm', label: 'Customers', icon: Users },
        { id: 'influencers', label: 'Influencers', icon: Users }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'logs', label: 'Activity Log', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  const getPageTitle = () => {
    for (const group of navigationGroups) {
      const match = group.items.find(i => i.id === activeTab);
      if (match) return match.label;
    }
    return 'Overview';
  };

  const adminDisplayName = user?.user_metadata?.full_name || 
    (user?.email?.split('@')[0] ? user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Tanmay Yadav');

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#EDEDF0] font-sans flex flex-col md:flex-row antialiased">
      
      {/* Mobile Backdrop Overlay (Click to Dismiss) */}
      {isMobileNavOpen && (
        <div 
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#121215] border-b border-[#1F1F24] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 -ml-1.5 text-zinc-300 hover:text-white rounded-xl hover:bg-[#1C1C21] active:scale-95 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm tracking-widest text-zinc-100">LOOZARS</span>
            <span className="text-[10px] font-semibold bg-[#1C1C24] text-zinc-300 px-1.5 py-0.5 rounded border border-[#2E2E3C] font-mono uppercase tracking-wider">
              Atelier
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile Quick Search Button */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-[#1C1C21] active:scale-95 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Open Search"
          >
            <Search size={18} />
          </button>

          {/* Mobile Quick Refresh */}
          <button
            onClick={handleGlobalRefresh}
            disabled={isGlobalRefreshing}
            className="p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-[#1C1C21] active:scale-95 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Refresh Data"
          >
            <RefreshCw size={17} className={isGlobalRefreshing ? 'animate-spin text-zinc-200' : ''} />
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 z-50 md:z-40 h-screen w-64 bg-[#121215] border-r border-[#1F1F24] flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0
        ${isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Sidebar Header */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="h-14 px-5 border-b border-[#1F1F24] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-sm tracking-widest text-zinc-100">LOOZARS</span>
              <span className="text-[10px] font-semibold bg-[#1C1C24] text-zinc-300 px-1.5 py-0.5 rounded border border-[#2E2E3C] font-mono uppercase tracking-wider">
                Atelier
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative" title="System Online">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>

              {/* Mobile Close Button */}
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#1C1C21] transition-colors"
                aria-label="Close Navigation"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-5 flex-1">
            {navigationGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {group.title && (
                  <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSwitch(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer min-h-[40px] ${
                        isActive
                          ? 'bg-[#1C1C24] text-white font-semibold border border-[#2E2E3C] shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181D]'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-white' : 'text-zinc-500'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom User & System Status */}
        <div className="p-3 border-t border-[#1F1F24] bg-[#0E0E10] space-y-3">
          {/* Online Indicator */}
          <div className="flex items-center justify-between px-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Store Online
            </span>
            <button
              onClick={() => navigateTo('home')}
              className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 text-[11px] py-1 px-1.5 -mr-1.5 rounded hover:bg-[#1C1C21]"
              title="Open storefront"
            >
              <span>View</span>
              <ExternalLink size={10} />
            </button>
          </div>

          {/* User Details & Sign Out */}
          <div className="bg-[#16161A] border border-[#24242A] rounded-xl p-2.5 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-zinc-200 truncate">
                {adminDisplayName}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono capitalize">
                {adminRole || 'Superadmin'}
              </p>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigateTo('home');
              }}
              className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Dark Top Bar (Desktop / Tablet) */}
        <header className="hidden md:flex sticky top-0 z-30 bg-[#121215]/95 backdrop-blur-md border-b border-[#1F1F24] h-14 px-4 sm:px-6 lg:px-8 items-center justify-between gap-4">
          
          {/* Left: Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          {/* Center: Global Search Input */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  if (activeTab !== 'orders' && e.target.value.trim().length > 0) {
                    handleTabSwitch('orders');
                  }
                }}
                placeholder="Search orders, customers, products..."
                className="w-full pl-9 pr-8 py-1.5 bg-[#18181D] border border-[#24242A] hover:border-zinc-700 focus:border-zinc-500 text-xs text-zinc-200 placeholder-zinc-500 rounded-xl focus:outline-none transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-zinc-500 bg-[#121215] border border-[#24242A] px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGlobalRefresh}
              disabled={isGlobalRefreshing}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-[#1C1C21] rounded-xl transition-colors border border-transparent hover:border-[#24242A] min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title="Refresh store data"
              aria-label="Refresh store data"
            >
              <RefreshCw size={14} className={isGlobalRefreshing ? 'animate-spin text-zinc-200' : ''} />
            </button>

            <button
              onClick={() => navigateTo('home')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#1C1C21] rounded-xl transition-colors border border-[#24242A]"
            >
              <Store size={13} />
              <span>Storefront</span>
              <ExternalLink size={10} className="text-zinc-500" />
            </button>
          </div>
        </header>

        {/* Content Body View Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {visitedTabs.has('overview') && (
            <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
              <AdminOverview
                isActive={activeTab === 'overview'}
                onNavigateTab={(tab) => handleTabSwitch(tab)}
                onSelectOrder={(order) => setModalOrder(order)}
                onOpenStockModal={(item) => setModalStockItem(item)}
              />
            </div>
          )}

          {visitedTabs.has('orders') && (
            <div className={activeTab === 'orders' ? 'block' : 'hidden'}>
              <AdminOrders searchQueryProp={globalSearch} />
            </div>
          )}

          {visitedTabs.has('products') && (
            <div className={activeTab === 'products' ? 'block' : 'hidden'}>
              <AdminProducts />
            </div>
          )}

          {visitedTabs.has('inventory') && (
            <div className={activeTab === 'inventory' ? 'block' : 'hidden'}>
              <AdminInventory />
            </div>
          )}

          {visitedTabs.has('coupons') && (
            <div className={activeTab === 'coupons' ? 'block' : 'hidden'}>
              <AdminCoupons />
            </div>
          )}

          {visitedTabs.has('crm') && (
            <div className={activeTab === 'crm' ? 'block' : 'hidden'}>
              <AdminCRM onSelectOrder={(order) => setModalOrder(order)} />
            </div>
          )}

          {visitedTabs.has('influencers') && (
            <div className={activeTab === 'influencers' ? 'block' : 'hidden'}>
              <AdminInfluencers />
            </div>
          )}

          {visitedTabs.has('logs') && (
            <div className={activeTab === 'logs' ? 'block' : 'hidden'}>
              <AdminInventoryLogs />
            </div>
          )}

          {visitedTabs.has('settings') && (
            <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
              <div className="space-y-6">
                
                {/* Store Settings & Identity */}
                <div className="bg-[#16161A] border border-[#24242A] rounded-2xl p-5 sm:p-6 space-y-6">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">Store Settings & Atelier Metadata</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Core brand metadata, payment gateways, and studio fulfillment configuration.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 border border-[#24242A] rounded-xl bg-[#121215] space-y-1.5">
                      <span className="text-zinc-500 font-medium">Brand Identity</span>
                      <p className="font-semibold text-zinc-200">LOOZARS® Atelier Kanpur</p>
                      <p className="text-[11px] text-zinc-400">Kanpur, Uttar Pradesh · Pan-India Studio Fulfillment</p>
                    </div>
                    <div className="p-4 border border-[#24242A] rounded-xl bg-[#121215] space-y-1.5">
                      <span className="text-zinc-500 font-medium">Payment Gateways</span>
                      <p className="font-semibold text-zinc-200">Razorpay Online Gateway & Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-zinc-400">Instant UPI, Cards, Netbanking & Verified COD</p>
                    </div>
                  </div>
                </div>

                {/* Operational Telegram Alerts & Mobile Command Center */}
                <div className="bg-[#16161A] border border-[#24242A] rounded-2xl p-5 sm:p-6 space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222228] pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#1C1C24] border border-[#2A2A38] flex items-center justify-center text-zinc-200">
                          <Bell size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-zinc-100">Telegram Atelier Operational Bot</h3>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                              Live Sync Active
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Real-time order dispatch, VIP alerts, instant 1-tap fulfillment, and full mobile remote management via <span className="font-mono text-zinc-300">@loozarsbot</span>.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="https://t.me/loozarsbot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-[#20202A] hover:bg-[#2A2A38] text-zinc-200 border border-[#323242] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
                      >
                        <ExternalLink size={13} className="text-zinc-400" />
                        <span>Open @loozarsbot</span>
                      </a>
                    </div>
                  </div>

                  {/* Test Status Feedback Banner */}
                  {telegramPingResult && (
                    <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
                      telegramPingResult.success 
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                        : 'bg-[#181820] border-[#2C2C3C] text-zinc-300'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className={telegramPingResult.success ? 'text-emerald-400' : 'text-zinc-400'} />
                        <span className="font-medium">{telegramPingResult.message}</span>
                      </div>
                      <button
                        onClick={() => setTelegramPingResult(null)}
                        className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 rounded"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* 1-Click Operational Test Ping */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                        Bot Connectivity Test
                      </span>
                      <span className="text-[11px] text-zinc-500">Admin Channel: Connected</span>
                    </div>

                    <div className="max-w-md">
                      <button
                        onClick={handleTelegramTest}
                        disabled={isTestingTelegram}
                        className="w-full p-3.5 bg-[#121215] hover:bg-[#1A1A22] active:scale-[0.98] border border-[#24242E] rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50 flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Zap size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                              Send Test Ping
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              Dispatches an instant health check ping to your Telegram account
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 font-mono">
                          {isTestingTelegram ? 'Pinging...' : 'Ping Now →'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Operations & Integrity Policies */}
                <div className="bg-[#16161A] border border-[#24242A] rounded-2xl p-5 sm:p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-100">Atelier Invariants & Architecture Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-400">
                    <div className="space-y-1">
                      <span className="font-semibold text-zinc-200">Server-Authoritative Pricing</span>
                      <p className="text-[11px] text-zinc-500">
                        Order totals and coupon discount amounts are strictly calculated server-side. Zero client-controlled price mutation.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-zinc-200">Zero-Duplication Dual Mode</span>
                      <p className="text-[11px] text-zinc-500">
                        Seamless operation in live PostgreSQL Supabase mode and simulated offline local cache without data desync.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>

        {/* Mobile 1-Tap Quick Search / Command Palette Drawer Modal */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 font-sans animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#24242A]">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-200">Quick Command & Search</span>
              </div>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-[#1C1C21] min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="pt-4 pb-2">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                  }}
                  placeholder="Type to filter orders, customers, SKUs..."
                  className="w-full pl-10 pr-4 py-3 bg-[#16161A] border border-[#2E2E3C] text-sm text-zinc-100 placeholder-zinc-500 rounded-2xl focus:outline-none focus:border-white transition-all shadow-lg"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-4">
              {globalSearch.trim().length > 0 && (
                <button
                  onClick={() => {
                    handleTabSwitch('orders');
                  }}
                  className="w-full p-3.5 bg-white text-black font-semibold rounded-2xl text-xs flex items-center justify-between shadow-lg"
                >
                  <span>Search "{globalSearch}" in Orders</span>
                  <ArrowRight size={14} />
                </button>
              )}

              <div>
                <p className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 px-1 pb-2">
                  Jump to Module
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                    { id: 'orders', label: 'Orders', icon: ShoppingBag },
                    { id: 'crm', label: 'CRM Dossiers', icon: Users },
                    { id: 'products', label: 'Products', icon: Layers },
                    { id: 'inventory', label: 'Inventory', icon: Package },
                    { id: 'coupons', label: 'Coupons', icon: Tag },
                    { id: 'influencers', label: 'Influencers', icon: Users },
                    { id: 'logs', label: 'Activity Logs', icon: FileText }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleTabSwitch(m.id)}
                        className="p-3 bg-[#16161A] hover:bg-[#1E1E24] border border-[#24242A] rounded-xl text-left flex items-center gap-2.5 text-xs text-zinc-200 active:scale-98 transition-all min-h-[48px]"
                      >
                        <Icon size={16} className="text-zinc-400 shrink-0" />
                        <span className="truncate font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Modals */}
        {modalOrder && (
          <AdminOrderDetailModal
            order={modalOrder}
            onClose={() => setModalOrder(null)}
          />
        )}

        {modalStockItem && (
          <StockAdjustModal
            item={modalStockItem}
            onClose={() => setModalStockItem(null)}
          />
        )}

        {/* Global Action Feedback Toast Stack */}
        <AdminActionToastContainer />

        {/* Mobile Sticky Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#121215]/95 backdrop-blur-md border-t border-[#1F1F24] px-1 py-1.5 flex items-center justify-around shadow-2xl">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'products', label: 'Products', icon: Layers },
            { id: 'inventory', label: 'Stock', icon: Package },
            { id: 'crm', label: 'Customers', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-[#22222C] text-white' : ''}`}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </button>
            );
          })}
          
          {/* More / Menu Drawer Toggle */}
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] ${
              ['coupons', 'influencers', 'logs', 'settings'].includes(activeTab)
                ? 'text-white font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${['coupons', 'influencers', 'logs', 'settings'].includes(activeTab) ? 'bg-[#22222C] text-white' : ''}`}>
              <Menu size={18} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
          </button>
        </nav>
      </div>

    </div>
  );
};

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AdminPortal] Caught runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-screen bg-[#0B0B0D] text-zinc-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#16161A] border border-[#24242A] p-8 rounded-2xl space-y-5 text-center shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/50 text-[#E66A6A] flex items-center justify-center mx-auto">
              <LogOut size={18} className="rotate-180" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Admin Console Notice</h2>
              <p className="text-xs text-zinc-400">
                {this.state.error?.message || 'An unexpected issue occurred while rendering the console.'}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Reload Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AdminPortal = () => {
  return (
    <AdminErrorBoundary>
      <AdminFeedbackProvider>
        <AdminPortalContent />
      </AdminFeedbackProvider>
    </AdminErrorBoundary>
  );
};
