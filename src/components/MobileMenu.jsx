import React from 'react';
import { useShop } from '../context/ShopContext';
import headerLogoImg from '../assets/images/loozars-official-logo.png';
import { X, ArrowRight, Instagram, Search, ShoppingBag } from 'lucide-react';

export const MobileMenu = ({ isOpen, onClose }) => {
  const { navigateTo, setActiveModal, setIsSearchOpen, cartCount, setIsCartOpen } = useShop();

  if (!isOpen) return null;

  const handleNav = (view) => {
    navigateTo(view);
    onClose();
  };

  const handleSearchClick = () => {
    onClose();
    setIsSearchOpen(true);
  };

  const handleCartClick = () => {
    onClose();
    setIsCartOpen(true);
  };

  const handleModal = (modalName) => {
    setActiveModal(modalName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#070707] flex flex-col justify-between p-6 sm:p-8 select-none overflow-y-auto animate-fadeIn text-[#EDE7DC] font-sans">
      
      {/* Top Bar: Brand Logo + Cart + Close */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <button onClick={() => handleNav('home')} className="focus:outline-none">
          <img 
            src={headerLogoImg} 
            alt="LOOZARS®" 
            className="h-5 w-auto object-contain brightness-125 contrast-125" 
          />
        </button>

        <div className="flex items-center gap-2.5">
          {/* Quick Textured Cart Trigger */}
          <button
            onClick={handleCartClick}
            className="nav-textured-pill px-3 py-1.5 rounded-xl flex items-center gap-2 text-[#EDE7DC] hover:text-white transition-all duration-300"
            aria-label="View bag"
          >
            <ShoppingBag size={13} className="text-[#EDE7DC]" />
            <span className="font-mono text-[10px] tracking-widest font-bold">BAG</span>
            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
              cartCount > 0 
                ? 'bg-[#A62626] text-white shadow-[0_0_8px_rgba(166,38,38,0.7)]' 
                : 'bg-white/[0.08] text-[#8E8D8A]'
            }`}>
              {cartCount > 0 ? (cartCount < 10 ? `0${cartCount}` : cartCount) : '0'}
            </span>
          </button>

          {/* Close Menu Button */}
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#EDE7DC] hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Minimal Search Trigger Bar */}
      <div className="pt-5 pb-2">
        <button
          onClick={handleSearchClick}
          className="w-full bg-[#111111] border border-white/10 px-4 py-2.5 text-left font-mono text-xs text-[#8E8D8A] hover:text-[#EDE7DC] hover:border-white/25 transition-all flex items-center justify-between uppercase tracking-wider"
        >
          <span>SEARCH THE ARCHIVE...</span>
          <Search size={13} className="text-[#8E1717]" />
        </button>
      </div>

      {/* Center Nav Links with Minimal Sans-Serif Typography */}
      <nav className="flex flex-col space-y-5 sm:space-y-6 my-auto py-6 font-sans">
        
        <button
          onClick={() => handleNav('shop')}
          className="group text-left flex items-center justify-between text-2xl sm:text-3xl font-medium tracking-[0.15em] text-[#EDE7DC] hover:text-[#8E1717] transition-colors uppercase"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-[#8E8D8A] group-hover:text-[#8E1717] tracking-widest">01</span>
            <span>SHOP</span>
          </div>
          <ArrowRight size={16} className="text-[#8E1717] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => handleNav('about')}
          className="group text-left flex items-center justify-between text-2xl sm:text-3xl font-medium tracking-[0.15em] text-[#EDE7DC] hover:text-[#8E1717] transition-colors uppercase"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-[#8E8D8A] group-hover:text-[#8E1717] tracking-widest">02</span>
            <span>OUR STORY</span>
          </div>
          <ArrowRight size={16} className="text-[#8E1717] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => handleNav('drops')}
          className="group text-left flex items-center justify-between text-2xl sm:text-3xl font-medium tracking-[0.15em] text-[#EDE7DC] hover:text-[#8E1717] transition-colors uppercase"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-[#8E8D8A] group-hover:text-[#8E1717] tracking-widest">03</span>
            <span>LOOKBOOK</span>
          </div>
          <ArrowRight size={16} className="text-[#8E1717] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

      </nav>

      {/* Bottom Minimal Policy & Region Footer */}
      <div className="border-t border-white/[0.08] pt-4 space-y-3 font-mono text-[10px] text-[#8E8D8A] tracking-[0.2em] uppercase">
        
        {/* Policy Modals Row */}
        <div className="flex flex-wrap items-center gap-3 text-[#8E8D8A]">
          <button onClick={() => handleModal('shipping')} className="hover:text-[#EDE7DC] transition-colors">
            SHIPPING
          </button>
          <span>•</span>
          <button onClick={() => handleModal('returns')} className="hover:text-[#EDE7DC] transition-colors">
            RETURNS
          </button>
          <span>•</span>
          <button onClick={() => handleModal('sizing')} className="hover:text-[#EDE7DC] transition-colors">
            SIZING
          </button>
          <span>•</span>
          <button onClick={() => handleModal('contact')} className="hover:text-[#EDE7DC] transition-colors">
            CONTACT
          </button>
        </div>

        {/* Region & Instagram Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[9px]">
          <div className="flex items-center gap-2 text-[#EDE7DC]/80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E1717] animate-pulse"></span>
            <span>INDIA (₹) // 18°55'N 72°50'E</span>
          </div>

          <a
            href="https://www.instagram.com/theloozars/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#EDE7DC] hover:text-[#8E1717] transition-colors"
          >
            <span>INSTAGRAM</span>
            <Instagram size={11} className="text-[#8E1717]" />
          </a>
        </div>

      </div>

    </div>
  );
};
