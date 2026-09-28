import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client.js';
import { fetchInfluencerDashboardData } from '../../services/influencerService';
import { LoginPage } from '../auth/LoginPage';
import { useShop } from '../../context/ShopContext.jsx';
import { 
  Sparkles, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  LogOut, 
  Store, 
  RefreshCw, 
  AlertCircle, 
  Tag, 
  ExternalLink,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export const InfluencerPortal = () => {
  const { navigateTo } = useShop();
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // 1. Listen to Supabase Auth State and Local Creator Session
  useEffect(() => {
    const localActive = typeof window !== 'undefined' ? localStorage.getItem('loozars_active_influencer_email') : null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
      } else if (localActive) {
        setSession({ user: { email: localActive, isLocalCreatorSession: true } });
      } else {
        setSession(null);
      }
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
      } else {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('loozars_active_influencer_email') : null;
        if (stored) {
          setSession({ user: { email: stored, isLocalCreatorSession: true } });
        } else {
          setSession(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load Creator Performance Data
  const loadDashboard = async () => {
    setIsLoadingData(true);
    setErrorMessage(null);
    try {
      const res = await fetchInfluencerDashboardData();
      if (res.success) {
        setDashboardData(res);
      } else {
        throw new Error(res.error || 'Failed to load creator dashboard.');
      }
    } catch (err) {
      console.error('[InfluencerPortal] Load error:', err);
      setErrorMessage(err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadDashboard();
    }
  }, [session]);

  // Real-time listener: Auto-reload dashboard whenever a new order is attributed to this creator!
  useEffect(() => {
    if (!session) return;
    const handleOrderAttributed = () => {
      loadDashboard();
    };
    window.addEventListener('loozars_influencer_updated', handleOrderAttributed);
    window.addEventListener('loozars_catalog_updated', handleOrderAttributed);
    window.addEventListener('storage', handleOrderAttributed);

    return () => {
      window.removeEventListener('loozars_influencer_updated', handleOrderAttributed);
      window.removeEventListener('loozars_catalog_updated', handleOrderAttributed);
      window.removeEventListener('storage', handleOrderAttributed);
    };
  }, [session]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('loozars_active_influencer_email');
    setSession(null);
    setDashboardData(null);
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = (code) => {
    if (!code) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://theloozars.com';
    const refUrl = `${origin}/?ref=${code}`;
    navigator.clipboard.writeText(refUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 3. Auth Loading Screen
  if (isAuthLoading) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center mb-3">
          <RefreshCw size={18} className="animate-spin text-white" />
        </div>
        <p className="text-sm font-medium text-zinc-300">
          Loading creator console...
        </p>
      </div>
    );
  }

  // 4. Unauthenticated State -> Unified Login Page (Creator Tab)
  if (!session) {
    return (
      <LoginPage 
        defaultTab="creator"
        onLoginSuccess={(user) => {
          const email = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('loozars_active_influencer_email') : '');
          setSession({ user: { email, isLocalCreatorSession: true } });
          loadDashboard();
        }} 
      />
    );
  }

  const influencer = dashboardData?.influencer || {};
  const metrics = dashboardData?.metrics || {};
  const orders = dashboardData?.orders || [];

  const couponCode = influencer.coupon_code || 'CREATOR10';
  const customerDiscount = influencer.customer_discount_value ? `${influencer.customer_discount_value}${influencer.customer_discount_type === 'percentage' ? '%' : '₹'}` : '10%';
  const commissionRate = influencer.commission_value ? `${influencer.commission_value}${influencer.commission_type === 'percentage' ? '%' : '₹'}` : '8%';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans flex flex-col selection:bg-white selection:text-black">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#111111] border-b border-[#222222] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-base tracking-tight text-white">
              LOOZARS
            </span>
            <span className="text-[11px] font-medium bg-[#1c1c1c] text-zinc-300 border border-[#2a2a2a] px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-400" />
              <span>Creator Panel</span>
            </span>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#171717] border border-[#262626] px-3 py-1.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-zinc-200 font-medium">@{influencer.instagram_handle || session?.user?.email?.split('@')[0]}</span>
            </div>

            <button
              onClick={() => navigateTo('home')}
              className="px-3 py-1.5 bg-[#171717] hover:bg-[#222222] text-zinc-300 hover:text-white border border-[#2a2a2a] transition-colors rounded-lg flex items-center gap-1.5 text-xs font-medium"
            >
              <Store size={13} />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors rounded-lg flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Creator Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Welcome & Creator Details Banner */}
        <div className="bg-[#121212] border border-[#222222] p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <span>Creator Partnership</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium capitalize">{influencer.collaboration_type || 'Active'} Partner</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome back, @{influencer.instagram_handle || 'Creator'}
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Your personalized creator promo code and referral link automatically apply a <strong className="text-white">{customerDiscount} customer discount</strong> at checkout and credit you with <strong className="text-emerald-400">{commissionRate} commission</strong> on every order.
            </p>
          </div>

          {/* Quick Copy Promo Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-[#161616] p-3 rounded-xl border border-[#262626]">
            <div className="px-3.5 py-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-center font-mono font-bold text-white text-sm tracking-wider">
              {couponCode}
            </div>

            <button
              onClick={() => handleCopyCode(couponCode)}
              className="px-3.5 py-2 bg-[#222222] hover:bg-[#2c2c2c] text-zinc-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-[#333333]"
            >
              {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={() => handleCopyLink(couponCode)}
              className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {copiedLink ? <Check size={13} className="text-emerald-600" /> : <ExternalLink size={13} />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Referral Link'}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Lifetime Earnings & Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
              <span>Sales Generated</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {isLoadingData ? '...' : `₹${(metrics.total_sales_generated || 0).toLocaleString('en-IN')}`}
            </div>
            <div className="text-[11px] text-zinc-500">
              From {metrics.total_orders || 0} customer order(s)
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
              <span>Total Earned</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <DollarSign size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {isLoadingData ? '...' : `₹${(metrics.total_earned || 0).toLocaleString('en-IN')}`}
            </div>
            <div className="text-[11px] text-zinc-500">
              Lifetime creator earnings
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
              <span>Eligible Payout</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Clock size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-300 tracking-tight">
              {isLoadingData ? '...' : `₹${(metrics.eligible_amount || 0).toLocaleString('en-IN')}`}
            </div>
            <div className="text-[11px] text-zinc-500">
              Ready in next payout cycle
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222222] p-4 sm:p-5 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
              <span>Paid Out</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {isLoadingData ? '...' : `₹${(metrics.paid_amount || 0).toLocaleString('en-IN')}`}
            </div>
            <div className="text-[11px] text-zinc-500">
              Settled to your bank/UPI
            </div>
          </div>
        </div>

        {/* Attributed Orders History Table */}
        <div className="bg-[#121212] border border-[#222222] rounded-2xl overflow-hidden shadow-sm space-y-0">
          
          <div className="p-5 bg-[#161616] border-b border-[#222222] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Attributed Customer Orders
              </h2>
              <p className="text-[11px] text-zinc-400">
                Live ledger of purchases placed with your code (Customer privacy strictly protected)
              </p>
            </div>

            <button
              onClick={loadDashboard}
              className="px-3 py-1.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={isLoadingData ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#141414] text-zinc-400 text-[11px] font-medium border-b border-[#222222]">
                <tr>
                  <th className="py-3.5 px-5">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-right">Order Value</th>
                  <th className="py-3.5 px-4 text-right">Your Commission</th>
                  <th className="py-3.5 px-5 text-center">Payout Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1c]">
                {isLoadingData ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={16} className="animate-spin text-zinc-400" />
                        <span>Loading order ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-zinc-500 space-y-1">
                      <ShoppingBag size={24} className="mx-auto text-zinc-600 mb-1" />
                      <p className="font-semibold text-zinc-400">No Orders Recorded Yet</p>
                      <p className="text-[11px] text-zinc-600">
                        Share your promo code <strong className="text-zinc-300 font-mono">{couponCode}</strong> with your audience to start earning!
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((ord, idx) => {
                    const isPaidOut = ord.commission_status === 'paid';
                    const isEligible = ord.commission_status === 'eligible';

                    return (
                      <tr key={idx} className="hover:bg-[#181818] transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-white">
                          {ord.order_number}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-200 font-medium">
                          {ord.customer_display_name || 'Customer'}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">
                          {new Date(ord.order_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-center text-zinc-300">
                          {ord.items_count || 1}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-white">
                          ₹{Number(ord.order_total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                          +₹{Number(ord.commission_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium capitalize border ${
                            isPaidOut ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            isEligible ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          }`}>
                            {ord.commission_status}
                          </span>
                          {ord.payout_reference && (
                            <span className="block text-[10px] text-zinc-500 font-mono mt-0.5">
                              Ref: {ord.payout_reference}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-[#141414] border-t border-[#1c1c1c] p-4 text-[11px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Commissions are credited upon verified payment and paid out via direct bank/UPI transfer.</span>
            <span className="font-mono text-zinc-600">ID: {influencer.id?.slice(0, 8)}...</span>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] bg-[#0c0c0c] py-4 px-4 sm:px-6 lg:px-8 mt-auto text-center text-xs text-zinc-500">
        LOOZARS® Creator Affiliate Network • Designed for High-Impact Partnerships
      </footer>

    </div>
  );
};
