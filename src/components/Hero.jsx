import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useShop } from '../context/ShopContext';
import officialLogoImg from '../assets/images/loozars-official-logo.png';
import campaignHeroImg from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import velo01 from '../assets/photoshoot/01-lzr-velo-07-black/velo-01.jpeg';
import burgundy01 from '../assets/photoshoot/02-lzr-racing-division-burgundy/burgundy-01.jpeg';
import apex02 from '../assets/photoshoot/03-lzr-apex-club-offwhite/apex-02.jpeg';
import { Search } from 'lucide-react';

export const Hero = () => {
  const { navigateTo, setIsSearchOpen, setIsCartOpen, cartCount } = useShop();
  const [isHoveredCta, setIsHoveredCta] = useState(false);
  
  // Background exposure flicker state
  const [atmosphereFilter, setAtmosphereFilter] = useState({
    brightness: 0.98,
    contrast: 1.08,
    opacity: 1.0
  });

  // Organic irregular background flicker
  useEffect(() => {
    let flickerTimer;
    let resetTimer;
    let isSubscribed = true;

    const runOrganicFlicker = () => {
      if (!isSubscribed) return;
      const baseDelays = [2200, 3100, 1800, 4400, 2700, 5600, 3900];
      const delay = baseDelays[Math.floor(Math.random() * baseDelays.length)] + (Math.random() * 600 - 300);

      flickerTimer = setTimeout(() => {
        if (!isSubscribed) return;
        const type = Math.floor(Math.random() * 3);
        if (type === 0) {
          setAtmosphereFilter({ brightness: 0.94, contrast: 1.06, opacity: 0.985 });
          resetTimer = setTimeout(() => {
            if (isSubscribed) setAtmosphereFilter({ brightness: 0.98, contrast: 1.08, opacity: 1.0 });
          }, 160);
        } else if (type === 1) {
          setAtmosphereFilter({ brightness: 1.025, contrast: 1.11, opacity: 1.0 });
          resetTimer = setTimeout(() => {
            if (isSubscribed) setAtmosphereFilter({ brightness: 0.98, contrast: 1.08, opacity: 1.0 });
          }, 120);
        } else {
          setAtmosphereFilter({ brightness: 1.015, contrast: 1.10, opacity: 1.0 });
          setTimeout(() => {
            if (isSubscribed) {
              setAtmosphereFilter({ brightness: 0.95, contrast: 1.07, opacity: 0.99 });
              resetTimer = setTimeout(() => {
                if (isSubscribed) setAtmosphereFilter({ brightness: 0.98, contrast: 1.08, opacity: 1.0 });
              }, 130);
            }
          }, 85);
        }
        runOrganicFlicker();
      }, delay);
    };

    runOrganicFlicker();
    return () => {
      isSubscribed = false;
      clearTimeout(flickerTimer);
      clearTimeout(resetTimer);
    };
  }, []);

  return (
    <section className="relative w-full bg-[#080808] text-[#EDE7DC] min-h-[92vh] flex flex-col justify-between select-none overflow-hidden border-b border-[#141414] px-4 sm:px-8 lg:px-14 pt-5 sm:pt-7 pb-6 sm:pb-8">
      
      {/* ============================================================ */}
      {/* 00. GIANT CROPPED WORD FRAGMENT (LOW CONTRAST POSTER LAYER)  */}
      {/* ============================================================ */}
      <div 
        className="absolute -bottom-10 left-[-3vw] font-editorial text-[18vw] leading-none text-white/[0.025] font-black pointer-events-none select-none tracking-tighter uppercase z-0"
        aria-hidden="true"
      >
        LOOZ
      </div>

      {/* ============================================================ */}
      {/* 01. QUIET EDITORIAL HEADER INSIDE HERO */}
      {/* ============================================================ */}
      <header className="relative w-full max-w-[1760px] mx-auto flex items-center justify-between z-20 pb-4 border-b border-[#141414]/80">
        
        {/* Left: Official LOOZARS® Brand Logo */}
        <div className="flex-1 flex items-center">
          <button 
            onClick={() => navigateTo('home')}
            className="text-left group flex items-center gap-1.5 focus:outline-none"
            aria-label="LOOZARS Home"
          >
            <img 
              src={officialLogoImg} 
              alt="LOOZARS®" 
              className="h-5 sm:h-6 w-auto object-contain brightness-110 group-hover:opacity-80 transition-opacity" 
            />
          </button>
        </div>

        {/* Center: Quiet Condensed Uppercase Navigation */}
        <nav className="hidden md:flex items-center justify-center space-x-10 lg:space-x-16 text-xs font-mono tracking-[0.3em] text-[#8E8D8A]">
          <button 
            onClick={() => navigateTo('shop')}
            className="hover:text-[#EDE7DC] transition-colors uppercase py-1"
          >
            SHOP
          </button>
          
          <button 
            onClick={() => navigateTo('drops')}
            className="hover:text-[#EDE7DC] transition-colors uppercase py-1"
          >
            DROPS
          </button>
          
          <button 
            onClick={() => navigateTo('about')}
            className="hover:text-[#EDE7DC] transition-colors uppercase py-1"
          >
            ABOUT
          </button>
        </nav>

        {/* Right: Search & Cart */}
        <div className="flex-1 flex items-center justify-end space-x-6 sm:space-x-8 text-xs font-mono tracking-[0.25em]">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors uppercase"
            aria-label="Search"
          >
            <span>SEARCH</span>
            <Search size={12} className="text-[#8E8D8A]" />
          </button>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 text-[#EDE7DC] hover:text-[#8E1717] transition-colors uppercase"
            aria-label="Cart"
          >
            <span>CART</span>
            <span className="font-mono text-[10px] text-[#8E1717]">
              ({cartCount})
            </span>
          </button>
        </div>

      </header>

      {/* ============================================================ */}
      {/* 02. EDITORIAL COMPOSITION (BROKEN GRID + DOMINANT CAMPAIGN PHOTO) */}
      {/* ============================================================ */}
      <div className="relative w-full max-w-[1760px] mx-auto my-auto py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10">
        
        {/* Left Editorial Text Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:space-y-8 order-2 lg:order-1 relative">
          
          {/* Top Label & Broken Archive Tag */}
          <div className="flex items-center justify-between font-mono text-[10px] text-[#8E8D8A] tracking-[0.25em] uppercase">
            <div className="flex items-center gap-2">
              <span className="text-[#8E1717]">🞊</span>
              <span>DROP 01 // 2026</span>
            </div>
            <span className="text-[9px] text-[#8E8D8A]/60 border-b border-[#222222] pb-0.5">
              UNAUTHORIZED EDITION
            </span>
          </div>

          {/* Experimental Headline with Typographic Tension */}
          <div className="space-y-1 relative">
            
            {/* Single Red Hand-Drawn Mark */}
            <div className="absolute -top-3 -left-3 text-[#8E1717] opacity-85 pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 5 L19 19 M19 5 L5 19" stroke="#8E1717" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-normal uppercase leading-[1.04] tracking-tight pl-2 sm:pl-3">
              <div>WEAR WHAT</div>
              <div className="pl-5 sm:pl-10 italic text-[#8E8D8A] tracking-normal">
                SHOULDN'T
              </div>
              <div>EXIST.</div>
            </h1>
          </div>

          {/* Separated Text Link CTA: SHOP THE DROP  → */}
          <div className="pt-2 pl-2 sm:pl-3">
            <button
              onClick={() => navigateTo('shop')}
              onMouseEnter={() => setIsHoveredCta(true)}
              onMouseLeave={() => setIsHoveredCta(false)}
              className="group inline-flex flex-col cursor-pointer focus:outline-none"
              aria-label="Shop the Drop"
            >
              <div className="flex items-center gap-4 font-mono text-xs sm:text-sm tracking-[0.25em] text-[#EDE7DC] group-hover:text-[#8E1717] transition-colors uppercase">
                <span>SHOP THE DROP</span>
                <span className="text-[#8E1717] transform transition-transform duration-300 group-hover:translate-x-2">
                  →
                </span>
              </div>
              
              {/* Tiny Red Underline */}
              <div 
                className={`h-[1px] bg-[#8E1717] transition-all duration-300 ease-out mt-1.5 ${
                  isHoveredCta ? 'w-full' : 'w-8'
                }`} 
              />
            </button>
          </div>

          {/* Microcopy Stacked Editorial Annotation */}
          <div className="pt-4 border-t border-[#141414] flex items-end justify-between">
            <div className="space-y-0.5 font-mono text-[9px] sm:text-[10px] text-[#8E8D8A] tracking-[0.25em] uppercase leading-tight">
              <div>STREET</div>
              <div>PEOPLE</div>
              <div>LOST SIGNALS</div>
              <div>LOUD STORIES</div>
            </div>

            <div className="font-mono text-[10px] text-[#8E8D8A] tracking-[0.25em] uppercase">
              EST. 2025 // INDIA
            </div>
          </div>

        </div>

        {/* Right Main Column: Dominant Campaign Photograph + Contact Sheet (7 cols) */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex items-center gap-4 sm:gap-6 justify-center lg:justify-end">
          
          {/* Main Campaign Frame: Breaks the rectangular box slightly */}
          <div className="relative w-full max-w-3xl">
            
            {/* The Main Photograph with Physical Poster Framing */}
            <div 
              onClick={() => navigateTo('drops')}
              data-cursor="view"
              className="relative w-full max-w-[540px] aspect-[4/5] bg-[#0c0c0c] overflow-hidden border border-[#1c1c1c] cursor-pointer group shadow-2xl mx-auto lg:ml-auto"
            >
              <img 
                src={campaignHeroImg} 
                alt="LOOZARS Drop 01 Official Campaign Shoot" 
                className="w-full h-full object-cover object-top will-change-transform group-hover:scale-[1.02] transition-transform duration-1000 ease-out"
                style={{
                  filter: `contrast(${atmosphereFilter.contrast}) brightness(${atmosphereFilter.brightness})`,
                  opacity: atmosphereFilter.opacity,
                  transition: 'filter 160ms cubic-bezier(0.4, 0, 0.2, 1), opacity 160ms ease-out'
                }}
                loading="eager"
              />

              {/* Subtle Analog Poster Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Broken Frame Accent: Slight bottom-left overlap tab */}
              <div className="absolute bottom-2 left-2 font-mono text-[8px] sm:text-[9px] text-[#EDE7DC]/80 bg-black/85 px-2 py-0.5 tracking-widest uppercase border border-white/10">
                DROP 01 // ARCHIVE
              </div>
            </div>

            {/* Vertical Magazine Registration Label on Edge */}
            <div className="absolute -right-7 top-1/2 -translate-y-1/2 hidden sm:block [writing-mode:vertical-rl] rotate-180 font-mono text-[8px] text-[#8E8D8A]/70 tracking-[0.3em] uppercase pointer-events-none">
              LOOZARS® // DROP 01 // 2026
            </div>

          </div>

          {/* Tiny 3-Frame Contact-Sheet Strips */}
          <div className="hidden xl:flex flex-col gap-3 shrink-0 font-mono text-[8px] text-[#8E8D8A]">
            
            {/* Frame 01 */}
            <div 
              onClick={() => navigateTo('product', 'lzr-velo-07')}
              className="space-y-0.5 cursor-pointer group"
            >
              <span className="tracking-widest block text-[#8E8D8A] group-hover:text-[#8E1717] transition-colors">01</span>
              <div className="w-11 h-14 bg-[#111111] border border-[#1e1e1e] group-hover:border-[#8E1717] overflow-hidden transition-colors">
                <img src={velo01} alt="LZR Velo 07" className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all" />
              </div>
            </div>

            {/* Frame 02 */}
            <div 
              onClick={() => navigateTo('product', 'lzr-racing-division')}
              className="space-y-0.5 cursor-pointer group"
            >
              <span className="tracking-widest block text-[#8E8D8A] group-hover:text-[#8E1717] transition-colors">02</span>
              <div className="w-11 h-14 bg-[#111111] border border-[#1e1e1e] group-hover:border-[#8E1717] overflow-hidden transition-colors">
                <img src={burgundy01} alt="LZR Racing Division" className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all" />
              </div>
            </div>

            {/* Frame 03 */}
            <div 
              onClick={() => navigateTo('product', 'lzr-apex-club')}
              className="space-y-0.5 cursor-pointer group"
            >
              <span className="tracking-widest block text-[#8E8D8A] group-hover:text-[#8E1717] transition-colors">03</span>
              <div className="w-11 h-14 bg-[#111111] border border-[#1e1e1e] group-hover:border-[#8E1717] overflow-hidden transition-colors">
                <img src={apex02} alt="LZR Apex Club" className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all" />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* 03. HERO TRANSITION (SEAMLESS HAIRLINE + 01 / 04 ANNOTATION)  */}
      {/* ============================================================ */}
      <div className="w-full max-w-[1760px] mx-auto flex items-center justify-between text-[10px] font-mono tracking-[0.25em] text-[#8E8D8A] uppercase pt-3 border-t border-[#141414]/80">
        <div>
          "AN UNNECESSARY CLOTHING BRAND."
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">KANPUR, UTTAR PRADESH // INDIA</span>
          <span className="text-[#8E1717] font-bold">01 / 04</span>
        </div>
      </div>

    </section>
  );
};
