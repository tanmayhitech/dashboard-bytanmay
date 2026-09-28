import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { supabase, isSupabaseConfigured } from '../../supabase/client';
import { verifyInfluencerCredentials } from '../../services/influencerService';
import { 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  Mail, 
  KeyRound,
  Store,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginPage = ({ defaultTab, onLoginSuccess }) => {
  const { signIn } = useAuth();
  const { navigateTo } = useShop();

  // Tab state: 'creator' | 'admin'
  const [activeTab, setActiveTab] = useState(() => {
    if (defaultTab === 'admin' || defaultTab === 'atelier') return 'admin';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const role = params.get('role') || params.get('tab');
      if (role === 'admin' || role === 'atelier') return 'admin';
    }
    return 'creator';
  });

  // Creator form state
  const [creatorEmail, setCreatorEmail] = useState('');
  const [creatorPassword, setCreatorPassword] = useState('');
  const [showCreatorPassword, setShowCreatorPassword] = useState(false);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [creatorError, setCreatorError] = useState(null);

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);

  const adminEmailRef = useRef(null);

  // Focus input when tab changes
  useEffect(() => {
    if (activeTab === 'admin') {
      setTimeout(() => {
        adminEmailRef.current?.focus();
      }, 50);
    }
  }, [activeTab]);

  // Handle Creator Login
  const handleCreatorSubmit = async (e) => {
    e?.preventDefault();
    setCreatorLoading(true);
    setCreatorError(null);

    const cleanEmail = creatorEmail.trim().toLowerCase();
    const cleanPassword = creatorPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      setCreatorError('Please enter both your email and password.');
      setCreatorLoading(false);
      return;
    }

    // Auto-redirect admin credentials entered in creator tab
    if (cleanEmail === 'tanmayyadavbca@gmail.com' || cleanEmail.startsWith('admin@')) {
      const { error } = await signIn({ email: cleanEmail, password: cleanPassword });
      setCreatorLoading(false);
      if (!error) {
        navigateTo('admin');
        return;
      }
    }

    // 1. Verify against assigned creator credentials in store
    const credCheck = verifyInfluencerCredentials(cleanEmail, cleanPassword);
    if (credCheck.valid) {
      localStorage.setItem('loozars_active_influencer_email', credCheck.influencer.email || credCheck.influencer.instagram_handle);
      setTimeout(() => {
        setCreatorLoading(false);
        navigateTo('influencer');
      }, 250);
      return;
    }

    // 2. If not found locally, try live Supabase Auth
    try {
      let targetAuthEmail = cleanEmail;
      if (!targetAuthEmail.includes('@')) {
        const { data: infRow } = await supabase
          .from('influencers')
          .select('email')
          .ilike('instagram_handle', targetAuthEmail.replace(/^@/, ''))
          .single();
        if (infRow?.email) {
          targetAuthEmail = infRow.email.toLowerCase().trim();
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetAuthEmail,
        password: cleanPassword
      });

      if (error) {
        setCreatorError(credCheck.error || 'Invalid creator email/handle or password.');
        setCreatorLoading(false);
        return;
      }

      if (data?.session) {
        localStorage.setItem('loozars_active_influencer_email', targetAuthEmail);
        navigateTo('influencer');
      }
    } catch (err) {
      console.error('[LoginPage] Creator authentication failed:', err.message);
      setCreatorError(credCheck.error || 'Creator sign in failed. Please verify your assigned password.');
    } finally {
      setCreatorLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminSubmit = async (e) => {
    e?.preventDefault();
    setAdminLoading(true);
    setAdminError(null);

    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      setAdminError('Please enter your administrator email and password.');
      setAdminLoading(false);
      return;
    }

    try {
      const { error } = await signIn({ email: cleanEmail, password: cleanPassword });
      if (error) {
        setAdminError(error.message || 'Invalid administrator credentials.');
      } else {
        navigateTo('admin');
      }
    } catch (err) {
      setAdminError('An unexpected authentication error occurred.');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#080808] text-[#EDE7DC] pt-28 sm:pt-36 pb-24 px-4 sm:px-6 flex items-center justify-center font-sans relative">
      
      {/* Background Accent Gradients */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8E1717]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#A3E635]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-[#0e0e0e]/95 backdrop-blur-2xl border border-[#1f1f1f] p-6 sm:p-10 rounded-2xl space-y-7 shadow-2xl relative z-10">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-tight text-white font-mono">LOOZARS®</span>
            <span className="text-[10px] uppercase font-mono tracking-widest bg-[#181818] text-[#8E8D8A] border border-[#262626] px-2 py-0.5 rounded">
              Access Portal
            </span>
          </div>

          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <Store size={13} />
            <span>Storefront</span>
          </button>
        </div>

        {/* 2-Option Tab Switcher: Creator & Admin */}
        <div className="grid grid-cols-2 p-1 bg-[#141414] border border-[#222222] rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('creator')}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'creator'
                ? 'bg-[#EDE7DC] text-[#090909] font-semibold shadow-md'
                : 'text-[#8E8D8A] hover:text-[#EDE7DC]'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'creator' ? 'text-[#8E1717]' : 'text-[#8E8D8A]'} />
            <span>Creator / Influencer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-[#EDE7DC] text-[#090909] font-semibold shadow-md'
                : 'text-[#8E8D8A] hover:text-[#EDE7DC]'
            }`}
          >
            <Lock size={14} className={activeTab === 'admin' ? 'text-[#8E1717]' : 'text-[#8E8D8A]'} />
            <span>Admin Atelier</span>
          </button>
        </div>

        {/* TAB 1: CREATOR & INFLUENCER SIGN IN */}
        {activeTab === 'creator' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-semibold text-[#EDE7DC] tracking-tight flex items-center gap-2">
                <span>Creator & Partner Portal</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#8E8D8A] leading-relaxed">
                Sign in to view attributed customer orders, live commission ledger, discount analytics, and UPI payout history.
              </p>
            </div>

            {creatorError && (
              <div className="p-3 bg-[#201010] border border-[#8E1717]/40 rounded-xl text-xs text-[#FF9999] flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 text-[#EF4444] mt-0.5" />
                <span>{creatorError}</span>
              </div>
            )}

            <form onSubmit={handleCreatorSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A39E99] block">
                  Creator Email or Instagram Handle
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type="text"
                    value={creatorEmail}
                    onChange={(e) => setCreatorEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full bg-[#141414] border border-[#242424] text-[#EDE7DC] pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#A3E635] rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A39E99] block">
                  Password
                </label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type={showCreatorPassword ? "text" : "password"}
                    value={creatorPassword}
                    onChange={(e) => setCreatorPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-[#141414] border border-[#242424] text-[#EDE7DC] pl-10 pr-10 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#A3E635] rounded-xl transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatorPassword(!showCreatorPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#EDE7DC] transition-colors"
                  >
                    {showCreatorPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={creatorLoading}
                className="w-full py-3 bg-[#EDE7DC] hover:bg-white text-[#090909] text-xs sm:text-sm font-semibold tracking-wide transition-all disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.99] mt-2 cursor-pointer"
              >
                {creatorLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-[#090909]" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Creator Dashboard</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: ADMIN CONSOLE SIGN IN */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-semibold text-[#EDE7DC] tracking-tight flex items-center gap-2">
                <span>Sign In to Admin Atelier</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#8E8D8A] leading-relaxed">
                Enter authorized administrator credentials to manage products, live stock, orders, shipments, coupons, and creator payouts.
              </p>
            </div>

            {adminError && (
              <div className="p-3 bg-[#201010] border border-[#8E1717]/40 rounded-xl text-xs text-[#FF9999] flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 text-[#EF4444] mt-0.5" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A39E99] block">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    ref={adminEmailRef}
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full bg-[#141414] border border-[#242424] text-[#EDE7DC] pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#8E1717] rounded-xl transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A39E99] block">
                  Password
                </label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-[#141414] border border-[#242424] text-[#EDE7DC] pl-10 pr-10 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#8E1717] rounded-xl transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#EDE7DC] transition-colors"
                  >
                    {showAdminPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3 bg-[#EDE7DC] hover:bg-white text-[#090909] text-xs sm:text-sm font-semibold tracking-wide transition-all disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.99] mt-2 cursor-pointer"
              >
                {adminLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-[#090909]" />
                    <span>Verifying Admin Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Console</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Security / Compliance Badge */}
        <div className="pt-2 border-t border-[#181818] text-center text-[11px] text-[#666666] flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-[#A3E635]" />
          <span>Secured by PostgreSQL Row-Level Security & Role-Based Access</span>
        </div>

      </div>
    </div>
  );
};
