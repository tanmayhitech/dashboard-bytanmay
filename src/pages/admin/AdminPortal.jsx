import React, { useState } from 'react';
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
  ShieldCheck,
  Store
} from 'lucide-react';

import { AdminFeedbackProvider } from '../../context/AdminFeedbackContext';
import { AdminActionToastContainer } from '../../components/admin/AdminActionToastContainer';

export const AdminPortalContent = () => {
  const { user, isAuthenticated, isAdmin, adminRole, isLoading, signOut } = useAuth();
  const { navigateTo } = useShop();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'inventory' | 'products' | 'coupons' | 'influencers' | 'logs'
  const [modalOrder, setModalOrder] = useState(null);
  const [modalStockItem, setModalStockItem] = useState(null);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center mb-3">
          <RefreshCw size={18} className="animate-spin text-rose-500" />
        </div>
        <p className="text-sm font-medium text-zinc-300">
          Loading admin console...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State → Unified Login Page (Admin Atelier Tab)
  if (!isAuthenticated) {
    return <LoginPage defaultTab="admin" />;
  }

  // 3. Authenticated Non-Admin State → Access Denied
  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  // 4. Authenticated Admin State → Master Dashboard
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'products', label: 'Products', icon: Layers },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'influencers', label: 'Influencers', icon: Users },
    { id: 'logs', label: 'Audit Logs', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans flex flex-col relative">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#111111] border-b border-[#222222] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-base tracking-tight text-white">
              LOOZARS
            </span>
            <span className="text-[11px] font-medium bg-[#1c1c1c] text-zinc-400 border border-[#2a2a2a] px-2.5 py-0.5 rounded-md">
              Admin Console
            </span>
          </div>

          {/* User Session & Quick Navigation */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#171717] border border-[#262626] px-3 py-1.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-zinc-300 font-medium">{user?.email}</span>
              <span className="text-zinc-500 font-normal">({adminRole || 'Superadmin'})</span>
            </div>

            <button
              onClick={() => navigateTo('home')}
              className="px-3 py-1.5 bg-[#171717] hover:bg-[#222222] text-zinc-300 hover:text-white border border-[#2a2a2a] transition-colors rounded-lg flex items-center gap-1.5 text-xs font-medium"
              title="Return to customer storefront"
            >
              <Store size={13} />
              <span>Storefront</span>
              <ExternalLink size={11} className="text-zinc-500" />
            </button>

            <button
              onClick={async () => {
                await signOut();
                navigateTo('home');
              }}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors rounded-lg flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-[#181818]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-black' : 'text-zinc-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <AdminOverview
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectOrder={(order) => setModalOrder(order)}
            onOpenStockModal={(item) => setModalStockItem(item)}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrders />
        )}

        {activeTab === 'inventory' && (
          <AdminInventory />
        )}

        {activeTab === 'products' && (
          <AdminProducts />
        )}

        {activeTab === 'coupons' && (
          <AdminCoupons />
        )}

        {activeTab === 'influencers' && (
          <AdminInfluencers />
        )}

        {activeTab === 'logs' && (
          <AdminInventoryLogs />
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

      {/* Global Admin Action Feedback Toast Stack */}
      <AdminActionToastContainer />

      {/* Clean Admin Footer */}
      <footer className="border-t border-[#1a1a1a] bg-[#0c0c0c] py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <span>LOOZARS Admin Console • Supabase & Razorpay Connected</span>
          <span className="font-mono text-[11px] text-zinc-600">User ID: {user?.id?.slice(0, 8)}...</span>
        </div>
      </footer>

    </div>
  );
};

export const AdminPortal = () => {
  return (
    <AdminFeedbackProvider>
      <AdminPortalContent />
    </AdminFeedbackProvider>
  );
};

