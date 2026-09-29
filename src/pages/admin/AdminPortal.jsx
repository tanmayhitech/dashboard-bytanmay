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
  X
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
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    setVisitedTabs(prev => new Set(prev).add(tabId));
    setIsMobileNavOpen(false);
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
      
      {/* Mobile Header */}
      <div className="md:hidden bg-[#121215] border-b border-[#1F1F24] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm tracking-widest text-zinc-100">LOOZARS</span>
          <span className="text-[10px] font-medium bg-[#1F1F24] text-zinc-400 px-1.5 py-0.5 rounded">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-[#1C1C21]"
          aria-label="Toggle Navigation"
        >
          {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 z-40 h-screen w-64 bg-[#121215] border-r border-[#1F1F24] flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0
        ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Sidebar Header */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="h-14 px-6 border-b border-[#1F1F24] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-sm tracking-widest text-zinc-100">LOOZARS</span>
              <span className="text-[10px] font-semibold bg-[#1C1C24] text-zinc-300 px-1.5 py-0.5 rounded border border-[#2E2E3C] font-mono uppercase tracking-wider">
                Atelier
              </span>
            </div>
            <span className="flex h-2 w-2 relative" title="System Online">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
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
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#1C1C24] text-white font-semibold border border-[#2E2E3C] shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181D]'
                      }`}
                    >
                      <Icon size={15} className={isActive ? 'text-white' : 'text-zinc-500'} />
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
              className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 text-[11px]"
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
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
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
        
        {/* Dark Top Bar */}
        <header className="sticky top-0 z-30 bg-[#121215]/95 backdrop-blur-md border-b border-[#1F1F24] h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
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
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#1C1C21] rounded-lg transition-colors border border-transparent hover:border-[#24242A]"
              title="Refresh store data"
              aria-label="Refresh store data"
            >
              <RefreshCw size={14} className={isGlobalRefreshing ? 'animate-spin text-[#E66A6A]' : ''} />
            </button>

            <button
              onClick={() => navigateTo('home')}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#1C1C21] rounded-xl transition-colors border border-[#24242A]"
            >
              <Store size={13} />
              <span>Storefront</span>
              <ExternalLink size={10} className="text-zinc-500" />
            </button>
          </div>
        </header>

        {/* Content Body View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
              <div className="bg-[#16161A] border border-[#24242A] rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">Store Settings</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Core brand metadata, payment gateways, and studio fulfillments.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 border border-[#24242A] rounded-xl bg-[#121215] space-y-1.5">
                    <span className="text-zinc-500 font-medium">Brand Identity</span>
                    <p className="font-semibold text-zinc-200">LOOZARS® Atelier Kanpur</p>
                    <p className="text-[11px] text-zinc-400">Kanpur, Uttar Pradesh · Pan-India Studio Fulfillment</p>
                  </div>
                  <div className="p-4 border border-[#24242A] rounded-xl bg-[#121215] space-y-1.5">
                    <span className="text-zinc-500 font-medium">Payment Options Active</span>
                    <p className="font-semibold text-zinc-200">Razorpay Online Gateway & Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-zinc-400">Instant UPI, Cards, Netbanking & Verified COD</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

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
