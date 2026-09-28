import React, { useState } from 'react';
import { supabase } from '../../supabase/client.js';
import { verifyInfluencerCredentials } from '../../services/influencerService';
import { Sparkles, Lock, Mail, AlertCircle, RefreshCw, ArrowRight, Store } from 'lucide-react';
import { useShop } from '../../context/ShopContext.jsx';

export const InfluencerLoginPage = ({ onLoginSuccess }) => {
  const { navigateTo } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please provide your creator email address and password.');
      setIsLoading(false);
      return;
    }

    // 1. Verify against assigned creator credentials in store
    const credCheck = verifyInfluencerCredentials(cleanEmail, cleanPassword);
    if (credCheck.valid) {
      localStorage.setItem('loozars_active_influencer_email', credCheck.influencer.email || credCheck.influencer.instagram_handle);
      if (onLoginSuccess) {
        onLoginSuccess({ email: cleanEmail, id: credCheck.influencer.id });
      }
      setIsLoading(false);
      return;
    }

    // 2. Try Supabase Auth
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
        setErrorMessage(credCheck.error || 'Invalid creator email/handle or password.');
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        localStorage.setItem('loozars_active_influencer_email', targetAuthEmail);
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      }
    } catch (err) {
      console.error('[InfluencerLogin] Authentication failed:', err.message);
      setErrorMessage(credCheck.error || 'Invalid creator email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col justify-between font-sans selection:bg-white selection:text-black">
      
      {/* Top Bar */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-[#181818]">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-sm tracking-tight text-white">LOOZARS®</span>
          <span className="text-[10px] uppercase font-mono tracking-widest bg-[#181818] text-zinc-400 border border-[#262626] px-2 py-0.5 rounded">
            Creator Panel
          </span>
        </div>

        <button
          onClick={() => navigateTo('home')}
          className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Store size={13} />
          <span>Return to Store</span>
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#121212] border border-[#222222] p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
          
          <div className="space-y-1.5 text-center">
            <div className="w-10 h-10 bg-white/5 border border-[#262626] rounded-xl mx-auto flex items-center justify-center text-white mb-3 shadow-inner">
              <Sparkles size={18} />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Creator & Partner Portal
            </h1>
            <p className="text-xs text-zinc-400">
              Sign in to view your live referral sales, track earnings, and monitor payouts
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1.5 font-medium">
                Creator Email or Instagram Handle
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="yourname@creator.loozars.com or @handle"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-400 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none placeholder-zinc-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-400 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none placeholder-zinc-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-black" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Creator Dashboard</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#1c1c1c] text-center text-[11px] text-zinc-500">
            Need creator access or lost credentials? Contact <span className="text-zinc-400">creators@theloozars.com</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-zinc-600 border-t border-[#141414]">
        LOOZARS® Creator Affiliate Network • Zero-Trust Attribution Engine
      </footer>

    </div>
  );
};
