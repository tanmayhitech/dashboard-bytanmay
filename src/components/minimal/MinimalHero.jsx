import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../../data/products';
import campaignShoot01 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot03 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import velo01 from '../../assets/photoshoot/01-lzr-velo-07-black/velo-01.jpeg';
import burgundy01 from '../../assets/photoshoot/02-lzr-racing-division-burgundy/burgundy-01.jpeg';
import apex02 from '../../assets/photoshoot/03-lzr-apex-club-offwhite/apex-02.jpeg';
import navy01 from '../../assets/photoshoot/04-lzr-ocean-speedway-navy/navy-01.jpeg';
import { ArrowRight, Sparkles } from 'lucide-react';

export const MinimalHero = () => {
  const { navigateTo, products } = useShop();
  const [activeIndex, setActiveIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const catalog = products && products.length > 0 ? products : STATIC_PRODUCTS;

  const slides = [
    {
      id: catalog[0]?.id || 'lzr-velo-07',
      num: '01',
      title: 'LZR VELO 07',
      subtitle: 'HEAVYWEIGHT BLACK // 320 GSM',
      price: '₹899',
      bgImg: campaignShoot01,
      cutoutImg: velo01,
      coordinates: '18°55\'N 72°50\'E',
    },
    {
      id: catalog[1]?.id || 'lzr-racing-division',
      num: '02',
      title: 'RACING DIVISION',
      subtitle: 'DEEP BURGUNDY // 320 GSM',
      price: '₹899',
      bgImg: campaignShoot05,
      cutoutImg: burgundy01,
      coordinates: 'BOMBAY ATELIER',
    },
    {
      id: catalog[2]?.id || 'lzr-apex-club',
      num: '03',
      title: 'APEX 88 CLUB',
      subtitle: 'OFF-WHITE HEAVY COTTON',
      price: '₹899',
      bgImg: campaignShoot04,
      cutoutImg: apex02,
      coordinates: 'FW26 EDITION 01',
    },
    {
      id: catalog[3]?.id || 'lzr-ocean-speedway',
      num: '04',
      title: 'OCEAN SPEEDWAY',
      subtitle: 'DEEP NAVY // RELAXED BOXY',
      price: '₹899',
      bgImg: campaignShoot03,
      cutoutImg: navy01,
      coordinates: 'PAN-INDIA ALLOCATION',
    },
  ];

  const currentSlide = slides[activeIndex];

  // Subtle mouse parallax effect
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 15;
    const y = (clientY / innerHeight - 0.5) * 15;
    setMousePos({ x, y });
  };

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen min-h-[700px] max-h-[1080px] bg-[#070707] text-[#EDE7DC] flex flex-col justify-between select-none overflow-hidden px-5 sm:px-10 lg:px-14 pt-24 pb-8 sm:pb-12"
    >
      {/* Background Cinematic Atmosphere Image with Smooth Crossfade */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {slides.map((s, idx) => (
          <img
            key={idx}
            src={s.bgImg}
            alt={s.title}
            className={`absolute inset-0 w-full h-full object-cover object-center filter contrast-[1.1] brightness-[0.45] transition-opacity duration-1000 ease-out scale-105 ${
              activeIndex === idx ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `scale(1.05) translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`,
              transition: 'transform 0.4s ease-out, opacity 1s ease-out'
            }}
          />
        ))}
        {/* Deep Black Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/60 to-[#070707]/40" />
      </div>

      {/* Top Metadata Line */}
      <div className="relative z-10 flex items-center justify-between text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#8E8D8A] uppercase">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8E1717] animate-pulse"></span>
          <span>DROP 01 // AUTUMN WINTER 2026</span>
        </div>
        <div className="hidden sm:block text-white/40">
          {currentSlide.coordinates}
        </div>
      </div>

      {/* Center Cinematic Typography & Floating Garment Focus */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto">
        
        {/* Left: Giant Minimal Headline */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          <div className="space-y-1">
            <h1 className="font-editorial text-4xl sm:text-7xl lg:text-8xl xl:text-9xl text-[#EDE7DC] font-normal uppercase leading-[0.92] tracking-tight">
              <div>WEAR WHAT</div>
              <div className="italic text-[#8E8D8A] font-serif pl-4 sm:pl-12">
                SHOULDN'T
              </div>
              <div>EXIST.</div>
            </h1>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => navigateTo('product', currentSlide.id)}
              className="group inline-flex items-center gap-3 px-6 py-3.5 bg-[#EDE7DC] text-[#070707] font-mono text-xs font-bold tracking-[0.25em] uppercase transition-all duration-300 hover:bg-[#8E1717] hover:text-white"
            >
              <span>INSPECT {currentSlide.title}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button
              onClick={() => navigateTo('shop')}
              className="px-5 py-3.5 font-mono text-xs text-[#8E8D8A] hover:text-[#EDE7DC] tracking-[0.2em] uppercase transition-colors"
            >
              VIEW ALL (4)
            </button>
          </div>
        </div>

        {/* Right: Floating Elevated Garment Focus Card */}
        <div className="hidden lg:flex lg:col-span-4 justify-end">
          <div 
            onClick={() => navigateTo('product', currentSlide.id)}
            className="relative w-72 aspect-[3/4] bg-[#0c0c0c]/80 backdrop-blur-md p-4 border border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.8)] cursor-pointer group hover:border-[#8E1717]/60 transition-all duration-500"
            style={{
              transform: `translate(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          >
            <img 
              src={currentSlide.cutoutImg} 
              alt={currentSlide.title} 
              className="w-full h-full object-contain filter contrast-[1.05] group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Minimal Price & Title Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#EDE7DC] bg-black/80 px-2.5 py-1.5 border border-white/10">
              <span className="font-semibold">{currentSlide.title}</span>
              <span className="text-[#8E8D8A]">{currentSlide.price}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Interactive Piece Cycler Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
        
        {/* 4 Interactive Capsule Switcher Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto font-mono text-[10px] tracking-widest uppercase">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setActiveIndex(idx)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`px-3 py-2 text-left transition-all duration-300 flex items-center gap-2 border ${
                activeIndex === idx 
                  ? 'bg-[#EDE7DC] text-[#070707] font-bold border-[#EDE7DC]' 
                  : 'bg-[#101010]/60 text-[#8E8D8A] hover:text-[#EDE7DC] border-white/[0.06] hover:border-white/20'
              }`}
            >
              <span>{slide.num}</span>
              <span className="truncate">{slide.title}</span>
            </button>
          ))}
        </div>

        {/* Right Piece Subtitle Spec */}
        <div className="font-mono text-[10px] text-[#8E8D8A] tracking-widest uppercase hidden lg:block">
          {currentSlide.subtitle} • <span className="text-[#EDE7DC]">{currentSlide.price}</span>
        </div>

      </div>

    </section>
  );
};
