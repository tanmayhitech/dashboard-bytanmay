import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { Lock, ArrowRight, ArrowLeft, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

export const AdminLoginPage = () => {
  const { signIn } = useAuth();
  const { navigateTo } = useShop();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await signIn({ email, password });
      if (error) {
        setErrorMessage(error.message || 'Invalid email or password.');
      }
    } catch (err) {
      setErrorMessage('An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#090909] text-[#E5E0D8] pt-28 sm:pt-36 pb-24 px-5 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-[#121212]/90 backdrop-blur-xl border border-[#202020] p-8 sm:p-10 rounded-3xl space-y-7 shadow-2xl relative">
        
        {/* Subtle Brand Tag */}
        <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-4">
          <span className="text-xs font-semibold text-[#8E1717] tracking-wider uppercase flex items-center gap-1.5">
            <Lock size={13} />
            <span>Loozars Atelier</span>
          </span>
          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft size={13} />
            <span>Storefront</span>
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#EDE7DC] tracking-tight">
            Sign In to Atelier
          </h1>
          <p className="text-sm text-[#8E8D8A] leading-relaxed">
            Enter authorized administrator credentials to manage orders, inventory, and operations.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#A39E99] block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@theloozars.com"
              required
              autoComplete="email"
              className="w-full bg-[#181818] border border-[#262626] text-[#EDE7DC] px-4 py-3 text-sm focus:outline-none focus:border-[#8E1717] focus:ring-1 focus:ring-[#8E1717] rounded-xl transition-all placeholder-[#555555]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#A39E99] block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-[#181818] border border-[#262626] text-[#EDE7DC] px-4 py-3 text-sm focus:outline-none focus:border-[#8E1717] focus:ring-1 focus:ring-[#8E1717] rounded-xl transition-all placeholder-[#555555]"
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-[#201010] border border-[#8E1717]/40 rounded-xl text-xs text-[#FF9999] flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-[#EF4444]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign In CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#EDE7DC] hover:bg-white text-[#090909] text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="pt-2 border-t border-[#1a1a1a] text-center text-xs text-[#666666] flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Protected by PostgreSQL Row Level Security</span>
        </div>

      </div>
    </div>
  );
};
