import React from 'react';
import { useShop } from '../context/ShopContext';
import officialLogoImg from '../assets/images/loozars-official-logo.png';
import { Globe } from 'lucide-react';

export const Footer = () => {
  const { navigateTo, setActiveModal } = useShop();

  return (
    <footer className="relative w-full py-12 sm:py-16 px-4 sm:px-8 lg:px-12 bg-[#080808] border-t border-[#141414] select-none">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 sm:gap-6">
        
        {/* Left: Brand Name & Exact Slogan */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <button 
            onClick={() => navigateTo('home')}
            className="text-left group flex items-center focus:outline-none"
            aria-label="LOOZARS Home"
          >
            <img 
              src={officialLogoImg} 
              alt="LOOZARS®" 
              className="h-6 sm:h-7 w-auto object-contain filter brightness-110 group-hover:opacity-80 transition-opacity" 
            />
          </button>

          <span className="font-mono text-[10px] sm:text-[11px] text-[#8E8D8A] tracking-[0.2em] uppercase">
            "AN UNNECESSARY CLOTHING BRAND."
          </span>
        </div>

        {/* Right: Minimal Footer Links & Copyright */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-mono text-[11px] tracking-[0.2em] uppercase text-[#8E8D8A]">
          <a 
            href="https://www.instagram.com/theloozars/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-[#EDE7DC] transition-colors"
          >
            INSTAGRAM
          </a>

          <button 
            onClick={() => setActiveModal('contact')}
            className="hover:text-[#EDE7DC] transition-colors uppercase"
          >
            CONTACT
          </button>

          <button 
            onClick={() => setActiveModal('shipping')}
            className="hover:text-[#EDE7DC] transition-colors uppercase"
          >
            SHIPPING
          </button>

          <button 
            onClick={() => setActiveModal('returns')}
            className="hover:text-[#EDE7DC] transition-colors uppercase"
          >
            RETURNS
          </button>

          <div className="flex items-center gap-1.5 text-[#8E8D8A]">
            <Globe size={13} className="text-[#8E1717]" />
            <span>© 2026 LOOZARS. ALL RIGHTS RESERVED.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
