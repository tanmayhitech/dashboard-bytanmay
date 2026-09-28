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
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 select-none ${
          isScrolled 
            ? 'bg-[#080808]/90 backdrop-blur-md py-3 sm:py-3.5 border-b border-white/[0.06] shadow-2xl' 
            : 'bg-transparent py-4 sm:py-5'
        }`}
      >
        <div className="max-w-[1760px] mx-auto px-5 sm:px-10 lg:px-14 grid grid-cols-3 items-center">
          
          {/* Left: Editorial Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-[11px] font-mono tracking-[0.22em] text-[#EDE7DC]/80">
            <button
              onClick={() => navigateTo('shop')}
              className="hover:text-white transition-colors uppercase tracking-[0.25em]"
            >
              SHOP
            </button>
            <button
              onClick={() => navigateTo('about')}
              className="hover:text-white transition-colors uppercase tracking-[0.25em]"
            >
              OUR STORY
            </button>
            <button
              onClick={() => navigateTo('drops')}
              className="hover:text-white transition-colors uppercase tracking-[0.25em]"
            >
              LOOKBOOK
            </button>
          </nav>

          {/* Left Mobile Menu Trigger */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-[#EDE7DC] p-1 -ml-1"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Center: Dominant Centered LOOZARS Brand Logo */}
          <div className="flex items-center justify-center">
            <button 
              onClick={() => navigateTo('home')}
              className="group focus:outline-none transition-transform duration-300 hover:scale-[1.03]"
              aria-label="LOOZARS Home"
            >
              <img 
                src={loozarsLogoImg} 
                alt="LOOZARS®" 
                className="h-5 sm:h-6 lg:h-7 w-auto object-contain filter brightness-110 contrast-125"
              />
            </button>
          </div>

          {/* Right: Currency + Search + Bag */}
          <div className="flex items-center justify-end space-x-4 sm:space-x-6 text-[11px] font-mono tracking-[0.2em] text-[#EDE7DC]/80">
            
            {/* Country / Currency */}
            <div className="hidden sm:flex items-center gap-1 cursor-default text-[#EDE7DC]/90">
              <span className="text-[10px]">India (₹)</span>
              <ChevronDown size={11} className="text-[#EDE7DC]/60" />
            </div>

            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-[#EDE7DC]/80 hover:text-white transition-colors p-1"
              aria-label="Search"
            >
              <Search size={14} />
            </button>

            {/* Shopping Bag Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-[#EDE7DC] hover:text-[#8E1717] transition-colors p-1 flex items-center gap-1.5 relative"
              aria-label="Shopping Bag"
            >
              <ShoppingBag size={14} />
              {cartCount > 0 && (
                <span className="font-mono text-[9px] text-[#8E1717] font-bold">
                  [{cartCount}]
                </span>
              )}
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
