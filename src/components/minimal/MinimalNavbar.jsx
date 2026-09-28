import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { Search, ShoppingBag, Menu } from 'lucide-react';
import { MobileMenu } from '../MobileMenu';

export const MinimalNavbar = () => {
  const { currentView, navigateTo, cartCount, setIsCartOpen, setIsSearchOpen } = useShop();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 select-none ${
          isScrolled 
            ? 'bg-[#070707]/90 backdrop-blur-md py-3.5 border-b border-white/[0.05]' 
            : 'bg-transparent py-5 sm:py-6'
        }`}
      >
        <div className="max-w-[1760px] mx-auto px-5 sm:px-10 lg:px-14 flex items-center justify-between">
          
          {/* Left: Minimal Wordmark */}
          <button 
            onClick={() => navigateTo('home')}
            className="text-left font-sans text-xs sm:text-sm font-black tracking-[0.3em] text-[#EDE7DC] hover:text-white uppercase transition-colors"
          >
            LOOZARS®
          </button>

          {/* Center: Quiet Floating Links */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-12 text-[11px] font-mono tracking-[0.25em] text-[#8E8D8A]">
            <button 
              onClick={() => navigateTo('shop')}
              className="hover:text-[#EDE7DC] uppercase transition-colors relative group py-1"
            >
              <span>ARCHIVE</span>
              <span className="text-[9px] text-[#8E1717] ml-1 font-bold">(04)</span>
            </button>
            <button 
              onClick={() => navigateTo('drops')}
              className="hover:text-[#EDE7DC] uppercase transition-colors py-1"
            >
              LOOKBOOK
            </button>
            <button 
              onClick={() => navigateTo('about')}
              className="hover:text-[#EDE7DC] uppercase transition-colors py-1"
            >
              ATELIER
            </button>
          </nav>

          {/* Right: Search + Bag */}
          <div className="flex items-center space-x-5 sm:space-x-7 text-[11px] font-mono tracking-[0.2em]">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors flex items-center gap-1.5"
              aria-label="Search"
            >
              <Search size={13} />
              <span className="hidden sm:inline text-[10px]">SEARCH</span>
            </button>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="text-[#EDE7DC] hover:text-[#8E1717] transition-colors flex items-center gap-1.5"
              aria-label="Cart"
            >
              <ShoppingBag size={13} />
              <span className="text-[10px] tracking-widest font-bold">
                BAG [{cartCount}]
              </span>
            </button>

            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-[#EDE7DC] p-1"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>
          </div>

        </div>
      </header>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
};
