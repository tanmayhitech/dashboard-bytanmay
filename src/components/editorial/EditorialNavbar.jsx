import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import loozarsLogoImg from '../../assets/images/loozars-official-logo.png';
import { Search, ShoppingBag, ChevronDown, Menu } from 'lucide-react';
import { MobileMenu } from '../MobileMenu';

export const EditorialNavbar = () => {
  const { currentView, navigateTo, cartCount, setIsCartOpen, setIsSearchOpen } = useShop();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 select-none ${
          isScrolled 
            ? 'bg-[#080808]/92 backdrop-blur-xl py-3 sm:py-3.5 border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.8)]' 
            : 'bg-transparent py-4 sm:py-5'
        }`}
      >
        {/* Subtle Ambient Top Shimmer Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none opacity-60" />

        <div className="max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-3 items-center">
          
          {/* Left: Editorial Navigation Links & Status Micro-Badge */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <nav className="flex items-center space-x-6 lg:space-x-8 text-[11px] font-mono tracking-[0.24em] text-[#EDE7DC]/80">
              <button
                onClick={() => navigateTo('shop')}
                className="relative py-1 uppercase tracking-[0.25em] transition-all group hover:text-white"
              >
                <span>SHOP</span>
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#A62626] transition-all duration-300 group-hover:w-full" />
              </button>

              <button
                onClick={() => navigateTo('about')}
                className="relative py-1 uppercase tracking-[0.25em] transition-all group hover:text-white"
              >
                <span>OUR STORY</span>
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#A62626] transition-all duration-300 group-hover:w-full" />
              </button>

              <button
                onClick={() => navigateTo('drops')}
                className="relative py-1 uppercase tracking-[0.25em] transition-all group hover:text-white"
              >
                <span>LOOKBOOK</span>
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#A62626] transition-all duration-300 group-hover:w-full" />
              </button>
            </nav>

            {/* Live Drop Editorial Micro-Pill */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-mono tracking-widest text-[#8E8D8A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A62626] animate-pulse shadow-[0_0_6px_#A62626]"></span>
              <span className="uppercase text-[#EDE7DC]/70">DROP 01 LIVE</span>
            </div>
          </div>

          {/* Left Mobile Menu Trigger */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-[#EDE7DC] hover:text-white transition-colors flex items-center gap-2"
              aria-label="Open menu"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                <Menu size={16} />
              </div>
            </button>
          </div>

          {/* Center: Dominant Centered LOOZARS Brand Logo */}
          <div className="flex items-center justify-center">
            <button 
              onClick={() => navigateTo('home')}
              className="group focus:outline-none transition-all duration-300 hover:scale-[1.04] relative py-1"
              aria-label="LOOZARS Home"
            >
              <img 
                src={loozarsLogoImg} 
                alt="LOOZARS®" 
                className="h-5 sm:h-6 lg:h-7 w-auto object-contain filter brightness-110 contrast-125 transition-all group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]"
              />
            </button>
          </div>

          {/* Right: Search + Hero Textured Bag Pill */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-4 text-[11px] font-mono tracking-[0.2em] text-[#EDE7DC]/80">
            
            {/* Tactile Search Capsule Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-[#EDE7DC]/80 hover:text-white transition-all flex items-center gap-2 group"
              aria-label="Search Archive"
            >
              <Search size={13} className="text-[#8E8D8A] group-hover:text-white transition-colors" />
              <span className="hidden sm:inline text-[10px] font-mono tracking-widest text-[#8E8D8A] group-hover:text-[#EDE7DC]">
                SEARCH
              </span>
            </button>

            {/* HERO TEXTURED BAG PILL */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="nav-textured-pill px-3.5 sm:px-4 py-1.5 rounded-xl flex items-center gap-2 sm:gap-2.5 transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] group cursor-pointer"
              aria-label="Shopping Bag"
            >
              <div className="relative">
                <ShoppingBag size={14} className="text-[#EDE7DC] group-hover:text-white transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#A62626] animate-ping" />
                )}
              </div>

              <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest text-[#EDE7DC] group-hover:text-white">
                BAG
              </span>

              {/* Dynamic Pill Counter */}
              <span className={`font-mono text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-all ${
                cartCount > 0 
                  ? 'bg-[#A62626] text-white shadow-[0_0_10px_rgba(166,38,38,0.7)]' 
                  : 'bg-white/[0.08] text-[#8E8D8A] border border-white/10 group-hover:text-[#EDE7DC]'
              }`}>
                {cartCount > 0 ? (cartCount < 10 ? `0${cartCount}` : cartCount) : '0'}
              </span>
            </button>

          </div>

        </div>
      </header>

      {/* Fullscreen Mobile Navigation Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};
