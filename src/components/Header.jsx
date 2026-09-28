import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import headerLogoImg from '../assets/images/loozars-official-logo.png';
import { Search, Menu } from 'lucide-react';
import { MobileMenu } from './MobileMenu';

export const Header = () => {
  const { currentView, navigateTo, cartCount, setIsCartOpen, setIsSearchOpen } = useShop();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show floating header when scrolled or on non-home pages
  const shouldShow = isScrolled || currentView !== 'home';

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          shouldShow 
            ? 'bg-[#080808]/95 backdrop-blur-md py-3.5 border-b border-[#181818] opacity-100 translate-y-0 shadow-xl' 
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
          
          {/* Left: Official LOOZARS® Brand Logo */}
          <div className="flex-1 flex items-center">
            <button 
              onClick={() => navigateTo('home')}
              className="text-left flex items-center gap-1 group"
              aria-label="LOOZARS Home"
            >
              <img 
                src={headerLogoImg} 
                alt="LOOZARS®" 
                className="h-5 sm:h-6 w-auto object-contain filter brightness-110 group-hover:opacity-80 transition-opacity" 
              />
            </button>
          </div>

          {/* Center: Desktop Quiet Editorial Navigation */}
          <nav className="hidden md:flex items-center justify-center space-x-8 sm:space-x-12 lg:space-x-16 text-[11px] sm:text-xs font-mono tracking-[0.25em] text-[#8E8D8A]">
            <button 
              onClick={() => navigateTo('shop')}
              className={`transition-colors uppercase relative py-0.5 ${
                currentView === 'shop' ? 'text-[#EDE7DC] border-b border-[#8E1717]' : 'hover:text-[#EDE7DC]'
              }`}
            >
              SHOP
            </button>
            
            <button 
              onClick={() => navigateTo('drops')}
              className={`transition-colors uppercase relative py-0.5 ${
                currentView === 'drops' ? 'text-[#EDE7DC] border-b border-[#8E1717]' : 'hover:text-[#EDE7DC]'
              }`}
            >
              DROPS
            </button>
            
            <button 
              onClick={() => navigateTo('about')}
              className={`transition-colors uppercase relative py-0.5 ${
                currentView === 'about' ? 'text-[#EDE7DC] border-b border-[#8E1717]' : 'hover:text-[#EDE7DC]'
              }`}
            >
              ABOUT
            </button>
          </nav>

          {/* Right: Desktop (SEARCH + CART) / Mobile (MENU + CART) */}
          <div className="flex-1 flex items-center justify-end space-x-5 sm:space-x-7 text-[11px] sm:text-xs font-mono tracking-[0.2em]">
            
            {/* Desktop Search */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-1.5 text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors uppercase"
              aria-label="Search"
            >
              <span>SEARCH</span>
              <Search size={12} className="text-[#8E8D8A]" />
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-1 text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors uppercase text-xs"
              aria-label="Open menu"
            >
              <span>MENU</span>
              <Menu size={14} className="text-[#EDE7DC]" />
            </button>

            {/* Cart Trigger */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 text-[#EDE7DC] hover:text-[#8E1717] transition-colors uppercase"
              aria-label="Cart"
            >
              <span>CART</span>
              <span className="font-mono text-[10px] text-[#8E1717]">
                ({cartCount})
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* Fullscreen Mobile Editorial Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
};
