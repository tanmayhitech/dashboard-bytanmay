import React from 'react';
import { useShop } from '../context/ShopContext';
import headerLogoImg from '../assets/images/loozars-official-logo.png';
import { X, ArrowRight, Instagram, Globe } from 'lucide-react';

export const MobileMenu = ({ isOpen, onClose }) => {
  const { navigateTo, setActiveModal } = useShop();

  if (!isOpen) return null;

  const handleNav = (view) => {
    navigateTo(view);
    onClose();
  };

  const handleModal = (modalName) => {
    setActiveModal(modalName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#080808] flex flex-col justify-between p-6 sm:p-10 select-none animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#181818] pb-4">
        <button onClick={() => handleNav('home')}>
          <img 
            src={headerLogoImg} 
            alt="LOOZARS®" 
            className="h-6 w-auto object-contain brightness-110" 
          />
        </button>

        <button 
          onClick={onClose}
          className="p-2 border border-[#222222] text-[#8E8D8A] hover:text-[#EDE7DC] hover:border-[#8E1717] transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Center Nav Links in Bold Editorial Serif */}
      <nav className="flex flex-col space-y-6 sm:space-y-8 my-auto">
        <button
          onClick={() => handleNav('shop')}
          className="group text-left flex items-center justify-between font-editorial text-4xl sm:text-5xl text-[#EDE7DC] hover:text-[#8E1717] transition-colors uppercase tracking-tight"
        >
          <span>SHOP</span>
          <ArrowRight size={24} className="text-[#8E1717] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => handleNav('drops')}
          className="group text-left flex items-center justify-between font-editorial text-4xl sm:text-5xl text-[#EDE7DC] hover:text-[#8E1717] transition-colors uppercase tracking-tight"
        >
          <span>DROPS</span>
          <ArrowRight size={24} className="text-[#8E1717] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => handleNav('about')}
          className="group text-left flex items-center justify-between font-editorial text-4xl sm:text-5xl text-[#EDE7DC] hover:text-[#8E1717] transition-colors uppercase tracking-tight"
        >
          <span>ABOUT</span>
          <ArrowRight size={24} className="text-[#8E1717] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <a
          href="https://www.instagram.com/theloozars/"
          target="_blank"
          rel="noopener noreferrer"
          className="group text-left flex items-center justify-between font-editorial text-4xl sm:text-5xl text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors uppercase tracking-tight"
        >
          <span>INSTAGRAM</span>
          <Instagram size={24} className="text-[#8E1717]" />
        </a>

        <button
          onClick={() => handleModal('contact')}
          className="group text-left flex items-center justify-between font-editorial text-4xl sm:text-5xl text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors uppercase tracking-tight"
        >
          <span>CONTACT</span>
          <ArrowRight size={24} className="text-[#8E1717] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </nav>

      {/* Bottom Metadata */}
      <div className="border-t border-[#181818] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[10px] sm:text-xs text-[#8E8D8A] tracking-[0.2em] uppercase">
        <div className="flex items-center gap-2">
          <span className="text-[#8E1717]">🞊</span>
          <span>EST. 2025 // INDIA</span>
        </div>
        <div>
          "AN UNNECESSARY CLOTHING BRAND."
        </div>
      </div>

    </div>
  );
};
