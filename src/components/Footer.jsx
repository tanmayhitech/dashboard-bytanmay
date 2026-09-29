import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import loozarsLogo from '../assets/images/loozars-official-logo.png';
import { Instagram, Youtube, ArrowRight, Check } from 'lucide-react';

export const Footer = () => {
  const { navigateTo, setActiveModal } = useShop();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="relative w-full bg-[#F3F0E8] text-[#080808] py-14 sm:py-20 px-5 sm:px-10 lg:px-14 select-none border-t border-[#080808]/15">
      <div className="max-w-[1760px] mx-auto space-y-12">
        
        {/* Main 4-Column Grid: Brand + Nav Links + Divider + Join List + Socials */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Column 1 (Left): Official Brand Logo & Metadata */}
          <div className="md:col-span-3 space-y-2 font-mono">
            <button
              onClick={() => navigateTo('home')}
              className="text-left group focus:outline-none transition-transform duration-300 hover:scale-[1.02] block"
              aria-label="LOOZARS Home"
            >
              <img 
                src={loozarsLogo} 
                alt="LOOZARS®" 
                className="h-6 sm:h-7 w-auto object-contain filter contrast-125 brightness-0"
              />
            </button>
            <p className="text-[11px] tracking-[0.2em] text-[#080808]/70 uppercase leading-relaxed pt-1">
              MMXXVI<br />
              RACING DIVISION.
            </p>
          </div>

          {/* Column 2 (Center-Left): Navigation Links */}
          <nav className="md:col-span-2 space-y-1 font-mono text-xs tracking-[0.22em] text-[#080808] uppercase">
            <div>
              <button onClick={() => navigateTo('shop')} className="hover:text-[#8E1717] transition-colors">
                Shop
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('about')} className="hover:text-[#8E1717] transition-colors">
                Our Story
              </button>
            </div>
            <div>
              <button onClick={() => navigateTo('drops')} className="hover:text-[#8E1717] transition-colors">
                Lookbook
              </button>
            </div>
          </nav>

          {/* Vertical Architectural Rule */}
          <div className="md:col-span-1 hidden md:flex justify-center pt-2">
            <div className="w-[1px] h-20 bg-[#080808]/20" />
          </div>

          {/* Column 3 (Center-Right): "Join the list" Newsletter Input */}
          <div className="md:col-span-3 space-y-2">
            <span className="font-mono text-[11px] text-[#080808]/80 tracking-[0.2em] uppercase block font-semibold">
              Join the list
            </span>

            {subscribed ? (
              <div className="p-2.5 bg-[#080808] text-[#F3F0E8] font-mono text-[11px] tracking-wider flex items-center gap-2">
                <Check size={12} className="text-[#A3E635]" />
                <span>CONFIRMED. YOU'RE ON THE LIST.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="w-full bg-[#e8e4db] border border-[#080808]/20 px-3.5 py-2.5 pr-10 font-mono text-xs text-[#080808] placeholder-[#080808]/50 focus:outline-none focus:border-[#080808] transition-colors"
                />
                <button
                  type="submit"
                  aria-label="Submit newsletter"
                  className="absolute right-1.5 w-7 h-7 bg-[#080808] text-[#F3F0E8] hover:bg-[#8E1717] rounded-full flex items-center justify-center transition-colors"
                >
                  <ArrowRight size={12} />
                </button>
              </form>
            )}
          </div>

          {/* Column 4 (Right): Social Icons + "MORE THAN CLOTHES." */}
          <div className="md:col-span-3 flex flex-col items-start md:items-end space-y-3">
            <div className="flex items-center gap-4 text-[#080808]">
              <a
                href="https://www.instagram.com/theloozars/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-[#8E1717] transition-colors"
              >
                <Instagram size={17} />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="hover:text-[#8E1717] transition-colors font-bold text-sm"
              >
                𝕏
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="hover:text-[#8E1717] transition-colors"
              >
                <Youtube size={19} />
              </a>
            </div>

            <p className="font-mono text-[10px] sm:text-[11px] text-[#080808]/70 tracking-[0.25em] uppercase">
              MORE THAN CLOTHES.
            </p>
          </div>

        </div>

        {/* Bottom Policy Strip */}
        <div className="pt-6 border-t border-[#080808]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[10px] tracking-[0.2em] text-[#080808]/60 uppercase">
          <div className="flex flex-wrap items-center gap-5">
            <button onClick={() => setActiveModal('shipping')} className="hover:text-[#080808] transition-colors cursor-pointer">
              Shipping
            </button>
            <button onClick={() => setActiveModal('returns')} className="hover:text-[#080808] transition-colors cursor-pointer">
              Returns
            </button>
            <button onClick={() => setActiveModal('sizing')} className="hover:text-[#080808] transition-colors cursor-pointer">
              Sizing
            </button>
            <button onClick={() => setActiveModal('contact')} className="hover:text-[#080808] transition-colors cursor-pointer">
              Contact
            </button>
            <span className="text-[#080808]/30">|</span>
            <button onClick={() => navigateTo('admin')} className="text-[#080808]/70 hover:text-[#8E1717] font-semibold transition-colors cursor-pointer">
              Atelier Portal
            </button>
            <button onClick={() => navigateTo('influencer')} className="text-[#080808]/70 hover:text-[#080808] transition-colors cursor-pointer">
              Partner Portal
            </button>
          </div>

          <div>
            <span>© 2026 LOOZARS® INDIA. ALL RIGHTS RESERVED.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
