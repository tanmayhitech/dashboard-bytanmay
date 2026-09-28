import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const AdminAccessDenied = () => {
  const { user, signOut } = useAuth();
  const { navigateTo } = useShop();

  return (
    <div className="w-full min-h-screen bg-[#090909] text-[#E5E0D8] pt-28 sm:pt-36 pb-24 px-5 flex items-center justify-center font-sans">
      <div className="w-full max-w-lg bg-[#121212]/90 backdrop-blur-xl border border-[#261818] p-8 sm:p-12 rounded-3xl space-y-6 text-center shadow-2xl">
        
        <div className="w-16 h-16 rounded-2xl bg-[#8E1717]/10 border border-[#8E1717]/30 flex items-center justify-center text-[#8E1717] mx-auto shadow-inner">
          <ShieldAlert size={30} />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#8E1717] tracking-wider uppercase">
            Restricted Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#EDE7DC] tracking-tight">
            Administrator Privileges Required
          </h1>
          <p className="text-sm text-[#8E8D8A] leading-relaxed max-w-md mx-auto">
            The authenticated account <strong className="text-[#EDE7DC] font-medium">{user?.email}</strong> does not have access permissions for the Loozars Atelier dashboard.
          </p>
        </div>

        <div className="pt-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row gap-3 justify-center text-sm font-medium">
          <button
            onClick={() => signOut()}
            className="px-6 py-3 bg-[#181818] hover:bg-[#252525] text-[#EDE7DC] transition-all flex items-center justify-center gap-2 rounded-xl border border-[#242424]"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="px-6 py-3 bg-[#EDE7DC] hover:bg-white text-[#090909] font-semibold transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg"
          >
            <ArrowLeft size={15} />
            <span>Return to Storefront</span>
          </button>
        </div>

      </div>
    </div>
  );
};
