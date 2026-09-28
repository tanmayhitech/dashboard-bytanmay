import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowDown, 
  Maximize2 
} from 'lucide-react';

// Campaign Assets
import campaignShoot01 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot02 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot03 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import campaignCarNight from '../assets/photoshoot/05-campaign-editorial/Screenshot_20260727_013151.jpg.jpeg';
import campaignCarRear from '../assets/photoshoot/05-campaign-editorial/Screenshot_20260727_013045.jpg.jpeg';
import masterHero from '../assets/images/master-hero-original.jpg';
import heroGirl from '../assets/images/hero-girl.jpg';
import apex02 from '../assets/photoshoot/03-lzr-apex-club-offwhite/apex-02.jpeg';
import velo01 from '../assets/photoshoot/01-lzr-velo-07-black/velo-01.jpeg';
import burgundy01 from '../assets/photoshoot/02-lzr-racing-division-burgundy/burgundy-01.jpeg';
import navy01 from '../assets/photoshoot/04-lzr-ocean-speedway-navy/navy-01.jpeg';

export const DropsPage = () => {
  const { navigateTo } = useShop();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Gallery Stills for Editorial Spread & Lightbox
  const editorialStills = [
    {
      id: 'lookbook-01',
      src: campaignShoot03,
      title: 'THE SQUAD RUN',
      subtitle: '35MM SPEEDWAY ARCHIVE',
      caption: '01 / NIGHT DRIVE',
      orientation: 'landscape'
    },
    {
      id: 'lookbook-02',
      src: heroGirl,
      title: 'LZR VELO 07',
      subtitle: 'BOX-FIT RACING JERSEY',
      caption: '02 / RACING DIVISION',
      orientation: 'portrait'
    },
    {
      id: 'lookbook-03',
      src: campaignCarNight,
      title: 'AFTER HOURS',
      subtitle: 'MIDNIGHT GARAGE SESSIONS',
      caption: '03 / AFTER HOURS',
      orientation: 'portrait'
    },
    {
      id: 'lookbook-04',
      src: apex02,
      title: 'APEX DRIVER 88',
      subtitle: 'OFF-WHITE HEAVYWEIGHT SILHOUETTE',
      caption: '04 / ENGINEERED FOR MOTION',
      orientation: 'portrait'
    },
    {
      id: 'lookbook-05',
      src: campaignShoot05,
      title: 'BURGUNDY DIVISION',
      subtitle: 'RAW TEXTILE PATINA',
      caption: '05 / STREET ARCHIVE',
      orientation: 'landscape'
    },
    {
      id: 'lookbook-06',
      src: campaignCarRear,
      title: 'MOTORSPORT HOODIE',
      subtitle: 'BACK GRAPHIC BLUEPRINT',
      caption: '06 / CHASSIS BLUEPRINT',
      orientation: 'portrait'
    },
    {
      id: 'lookbook-07',
      src: campaignShoot04,
      title: 'DUO ATELIER',
      subtitle: 'VELO & APEX SILHOUETTES',
      caption: '07 / THE DUO',
      orientation: 'portrait'
    },
    {
      id: 'lookbook-08',
      src: campaignShoot01,
      title: 'MIDNIGHT TROLLEY',
      subtitle: '4 FRIENDS · MUMBAI SPEEDWAY',
      caption: '08 / REAL PEOPLE',
      orientation: 'landscape'
    }
  ];

  // Lightbox Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % editorialStills.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + editorialStills.length) % editorialStills.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  return (
    <div className="w-full min-h-screen bg-[#090909] text-[#EDE7DC] select-none overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 01. FULL-BLEED HERO VIEWPORT (100vw Campaign Hero)                        */}
      {/* ========================================================================= */}
      <section className="relative w-full h-screen min-h-[640px] flex items-end justify-between overflow-hidden">
        
        {/* Full Viewport Photographic Layer */}
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src={campaignShoot03} 
            alt="LOOZARS Lookbook Campaign Hero" 
            className="w-full h-full object-cover object-[center_35%] filter contrast-[1.12] brightness-[0.82]"
          />
          {/* Film Grain & Soft Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-black/60" />
        </div>

        {/* Top-Left Editorial Metadata Marker */}
        <div className="absolute top-24 sm:top-28 left-5 sm:left-10 lg:left-14 z-10 font-mono text-[11px] text-[#EDE7DC]/70 tracking-[0.25em] uppercase space-y-1">
          <div className="flex items-center gap-2">
            <span>04</span>
            <span className="w-8 h-[1px] bg-[#EDE7DC]/40 inline-block"></span>
            <span>CAMPAIGN ARCHIVE</span>
          </div>
          <p className="text-[10px] text-[#8E1717] font-bold">
            DROP 01 // RACING DIVISION
          </p>
        </div>

        {/* Bottom Hero Typography Spread */}
        <div className="relative z-10 max-w-[1760px] w-full mx-auto px-5 sm:px-10 lg:px-14 pb-12 sm:pb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="font-editorial text-5xl sm:text-7xl lg:text-9xl text-[#EDE7DC] font-bold uppercase leading-[0.88] tracking-tight">
              LOOKBOOK
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#8E8D8A] uppercase tracking-[0.25em]">
              SAME PEOPLE. DIFFERENT NIGHTS.
            </p>
          </div>

          <div className="font-mono text-[10px] sm:text-[11px] text-[#EDE7DC]/70 uppercase tracking-[0.2em] flex items-center gap-3">
            <span>01 / 08 STILLS</span>
            <span className="text-[#8E1717]">·</span>
            <div className="flex items-center gap-1.5 text-[#EDE7DC]/90 animate-bounce">
              <span>SCROLL TO EXPLORE</span>
              <ArrowDown size={12} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. EDITORIAL INTRODUCTION (Warm Ivory Magazine Transition)               */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-[#F1EEE6] text-[#0A0A0A] py-16 sm:py-24 px-5 sm:px-10 lg:px-14 border-t border-b border-[#0A0A0A]/15">
        <div className="max-w-[1760px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          <div className="lg:col-span-5 space-y-3 font-mono">
            <div className="flex items-center gap-2 text-xs text-[#8E1717] font-bold tracking-[0.25em] uppercase">
              <span>01</span>
              <span className="w-6 h-[1px] bg-[#8E1717] inline-block"></span>
              <span>THE PHILOSOPHY</span>
            </div>
            
            <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#0A0A0A] font-bold uppercase leading-[0.92] tracking-tight">
              FOUR PIECES.<br />
              <span className="italic text-[#666] font-normal">ONE RACING</span><br />
              LANGUAGE.
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-4 font-mono text-xs sm:text-sm text-[#0A0A0A]/80 leading-relaxed uppercase tracking-wide border-l border-[#0A0A0A]/15 pl-0 lg:pl-10">
            <p>
              A digital photo journal documenting Drop 01 in its natural habitat — asphalt, midnight garages, and underground street culture.
            </p>
            <p className="text-[#0A0A0A]/60 text-[11px]">
              Every garment is cut from 320 GSM combed French Terry cotton, engineered for raw motion and pre-shrunk with an enzyme mineral finish.
            </p>
            <div className="pt-2 flex items-center gap-4 text-[10px] text-[#8E1717] font-bold tracking-widest">
              <span>EST. 2025 // INDIA</span>
              <span>·</span>
              <span>BY THE RARE. FOR THE RARE.</span>
            </div>
          </div>

        </div>
      </section>

      {/* Kinetic Moving Film Ticker */}
      <div className="w-full bg-[#090909] text-[#EDE7DC] py-3.5 overflow-hidden border-b border-white/10 font-mono text-[10px] sm:text-[11px] tracking-[0.25em] uppercase marquee-container select-none">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">35MM ANALOG ARCHIVE</span>
            <span className="text-[#8E8D8A]">· RAW ASPHALT SESSIONS</span>
          </span>
          <span className="text-[#8E8D8A]">NO STAGED LIGHTING</span>
          <span className="text-[#8E1717] font-bold">REAL PEOPLE // REAL PLACES</span>
          <span className="text-white/30">·</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">DROP 01 RACING DIVISION</span>
          </span>
          <span className="text-[#8E8D8A]">BOMBAY SPEEDWAY</span>
          <span className="text-white/30">·</span>
          {/* Duplicate loop */}
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">35MM ANALOG ARCHIVE</span>
            <span className="text-[#8E8D8A]">· RAW ASPHALT SESSIONS</span>
          </span>
          <span className="text-[#8E8D8A]">NO STAGED LIGHTING</span>
          <span className="text-[#8E1717] font-bold">REAL PEOPLE // REAL PLACES</span>
          <span className="text-white/30">·</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">DROP 01 RACING DIVISION</span>
          </span>
          <span className="text-[#8E8D8A]">BOMBAY SPEEDWAY</span>
          <span className="text-white/30">·</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 03. ASYMMETRIC MAGAZINE PHOTO SPREAD (Stills 01 - 04)                     */}
      {/* ========================================================================= */}
      <section className="relative w-full py-16 sm:py-24 px-5 sm:px-10 lg:px-14 bg-[#090909]">
        <div className="max-w-[1760px] mx-auto space-y-20 sm:space-y-32">
          
          {/* Row A: Large Portrait (Left 7 cols) + Inset Stacks (Right 5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Main Portrait Frame */}
            <div 
              onClick={() => setLightboxIndex(1)}
              className="lg:col-span-7 relative aspect-[3/4] bg-[#141414] overflow-hidden border border-white/10 group cursor-pointer"
            >
              <img 
                src={heroGirl} 
                alt="LZR Velo 07 Campaign Still" 
                className="w-full h-full object-cover filter contrast-[1.08] brightness-90 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
              <div className="absolute top-4 left-4 font-mono text-[10px] text-[#EDE7DC] bg-black/80 px-2.5 py-1 tracking-widest uppercase border border-white/10">
                02 / RACING DIVISION · VELO 07
              </div>
              <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-[#EDE7DC] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                <Maximize2 size={11} />
                <span>EXPAND VIEW</span>
              </div>
            </div>

            {/* Right Story Column + Secondary Still */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3 font-mono">
                <span className="text-[10px] text-[#8E1717] tracking-[0.25em] uppercase font-bold">
                  FRAME // 02
                </span>
                <h3 className="font-editorial text-2xl sm:text-4xl text-[#EDE7DC] font-bold uppercase tracking-tight">
                  LZR VELO 07
                </h3>
                <p className="text-xs text-[#8E8D8A] leading-relaxed tracking-wider uppercase">
                  Dominated by bold 07 rear typography and technical track stripes, reworked for everyday boxy streetwear.
                </p>
              </div>

              <div 
                onClick={() => setLightboxIndex(2)}
                className="relative aspect-[4/3] bg-[#141414] overflow-hidden border border-white/10 group cursor-pointer"
              >
                <img 
                  src={campaignCarNight} 
                  alt="Midnight Garage Campaign Still" 
                  className="w-full h-full object-cover filter contrast-[1.12] brightness-85 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
                <div className="absolute bottom-3 left-3 font-mono text-[9px] text-[#EDE7DC] bg-black/80 px-2 py-0.5 tracking-widest uppercase border border-white/10">
                  03 / AFTER HOURS SESSIONS
                </div>
              </div>
            </div>

          </div>

          {/* Row B: Split Duo Composition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-end">
            
            <div 
              onClick={() => setLightboxIndex(3)}
              className="relative aspect-[4/5] bg-[#141414] overflow-hidden border border-white/10 group cursor-pointer"
            >
              <img 
                src={apex02} 
                alt="Apex Driver 88" 
                className="w-full h-full object-cover filter contrast-[1.06] brightness-90 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
              <div className="absolute top-4 left-4 font-mono text-[10px] text-[#EDE7DC] bg-black/80 px-2.5 py-1 tracking-widest uppercase border border-white/10">
                04 / APEX DRIVER 88
              </div>
            </div>

            <div 
              onClick={() => setLightboxIndex(4)}
              className="relative aspect-[4/5] bg-[#141414] overflow-hidden border border-white/10 group cursor-pointer"
            >
              <img 
                src={campaignShoot05} 
                alt="Burgundy Racing Division" 
                className="w-full h-full object-cover filter contrast-[1.1] brightness-90 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
              <div className="absolute top-4 left-4 font-mono text-[10px] text-[#EDE7DC] bg-black/80 px-2.5 py-1 tracking-widest uppercase border border-white/10">
                05 / BURGUNDY DIVISION
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04. FULL-WIDTH CINEMATIC RESET (100vw Bleed Image)                        */}
      {/* ========================================================================= */}
      <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-black overflow-hidden border-t border-b border-white/10 group">
        <img 
          src={campaignShoot01} 
          alt="Loozars Midnight Trolley Archive" 
          className="w-full h-full object-cover filter contrast-[1.15] brightness-80 group-hover:scale-[1.01] transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

        <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-12 lg:p-16 pointer-events-none">
          <div className="font-mono text-[10px] sm:text-xs text-[#8E1717] font-bold tracking-[0.25em] uppercase">
            [ 35MM PANORAMIC CAMPAIGN STILL ]
          </div>

          <div className="max-w-xl space-y-2 font-mono">
            <h3 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#EDE7DC] uppercase leading-[0.9] font-bold">
              REAL PEOPLE.<br />
              REAL PLACES.
            </h3>
            <p className="text-xs text-[#8E8D8A] tracking-widest uppercase">
              NO SETS. NO STAGED LIGHTING. RAW MUMBAI STREET CULTURE.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 05. CONTACT-SHEET PHOTO GRID (Editorial Stills 05 - 08)                   */}
      {/* ========================================================================= */}
      <section className="relative w-full py-16 sm:py-24 px-5 sm:px-10 lg:px-14 bg-[#090909]">
        <div className="max-w-[1760px] mx-auto space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[#8E1717] tracking-[0.25em] uppercase font-bold">
                03 // CONTACT SHEET SPEC
              </span>
              <h3 className="font-editorial text-2xl sm:text-4xl text-[#EDE7DC] font-bold uppercase tracking-tight">
                ARCHIVE STILLS
              </h3>
            </div>
            <div className="text-[10px] text-[#8E8D8A] uppercase tracking-widest">
              CLICK ANY FRAME TO EXPAND
            </div>
          </div>

          {/* 4-Frame Asymmetrical Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {editorialStills.slice(4).map((still, idx) => (
              <div 
                key={still.id}
                onClick={() => setLightboxIndex(idx + 4)}
                className="group cursor-pointer flex flex-col space-y-3"
              >
                <div className="relative aspect-[3/4] bg-[#141414] overflow-hidden border border-white/10 group-hover:border-white/30 transition-all duration-500">
                  <img 
                    src={still.src} 
                    alt={still.title} 
                    className="w-full h-full object-cover filter contrast-[1.08] brightness-85 group-hover:scale-105 group-hover:brightness-100 transition-all duration-700"
                  />
                  <div className="absolute top-2.5 left-2.5 font-mono text-[8px] bg-black/85 text-[#EDE7DC] px-2 py-0.5 border border-white/10 uppercase tracking-widest">
                    {still.caption}
                  </div>
                </div>

                <div className="font-mono text-xs space-y-0.5 pt-1 border-t border-white/10">
                  <h4 className="font-bold text-[#EDE7DC] uppercase tracking-wider group-hover:text-[#8E1717] transition-colors">
                    {still.title}
                  </h4>
                  <p className="text-[10px] text-[#8E8D8A] uppercase tracking-wide">
                    {still.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06. LOOKBOOK → SHOP TRANSITION CTA (Warm Ivory Canvas)                    */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-[#F1EEE6] text-[#0A0A0A] py-16 sm:py-24 px-5 sm:px-10 lg:px-14 border-t border-[#0A0A0A]/15 select-none">
        <div className="max-w-[1760px] mx-auto text-center space-y-6">
          
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-[#8E1717] font-bold tracking-[0.25em] uppercase">
            <span>04</span>
            <span className="w-8 h-[1px] bg-[#8E1717] inline-block"></span>
            <span>RACING DIVISION CAPSULE</span>
          </div>

          <h2 className="font-editorial text-4xl sm:text-7xl lg:text-8xl font-bold uppercase tracking-tight leading-[0.9]">
            DISCOVER THE PIECES
          </h2>

          <p className="font-mono text-xs sm:text-sm text-[#0A0A0A]/70 uppercase tracking-[0.2em] max-w-md mx-auto">
            ALL 4 HEAVYWEIGHT COTTON SILHOUETTES FROM DROP 01 ARE NOW LIVE IN THE ARCHIVE.
          </p>

          <div className="pt-4">
            <button
              onClick={() => navigateTo('shop')}
              className="inline-flex items-center gap-3 bg-[#0A0A0A] text-[#F1EEE6] hover:bg-[#8E1717] hover:text-white px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.25em] transition-all rounded-none shadow-xl group"
            >
              <span>EXPLORE THE ARCHIVE</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 07. MINIMAL LIGHTBOX VIEWER                                               */}
      {/* ========================================================================= */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-5 sm:p-10 select-none animate-fadeIn"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between font-mono text-xs text-[#EDE7DC] border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#8E1717] font-bold">
                0{lightboxIndex + 1} / 0{editorialStills.length}
              </span>
              <span>·</span>
              <span className="uppercase tracking-widest">
                {editorialStills[lightboxIndex].title}
              </span>
            </div>

            <button
              onClick={() => setLightboxIndex(null)}
              className="text-[#8E8D8A] hover:text-white p-1 transition-colors flex items-center gap-1.5 uppercase tracking-widest text-[11px]"
            >
              <span>CLOSE</span>
              <X size={15} />
            </button>
          </div>

          {/* Large Focused Image with Prev/Next Controls */}
          <div 
            className="flex-1 flex items-center justify-center relative py-4 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxIndex((prev) => (prev - 1 + editorialStills.length) % editorialStills.length)}
              className="absolute left-2 sm:left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white text-black hover:text-black flex items-center justify-center text-white transition-all z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>

            <img 
              src={editorialStills[lightboxIndex].src} 
              alt={editorialStills[lightboxIndex].title}
              className="max-h-[75vh] max-w-full object-contain filter contrast-[1.08] shadow-2xl"
            />

            <button
              onClick={() => setLightboxIndex((prev) => (prev + 1) % editorialStills.length)}
              className="absolute right-2 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white text-black hover:text-black flex items-center justify-center text-white transition-all z-10"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Lightbox Caption Footer */}
          <div className="flex items-center justify-between font-mono text-[10px] sm:text-[11px] text-[#8E8D8A] uppercase tracking-widest border-t border-white/10 pt-4">
            <div>
              <span className="text-white font-bold">{editorialStills[lightboxIndex].subtitle}</span>
            </div>
            <div className="text-[9px] text-[#666]">
              [ ESC TO EXIT · USE ARROW KEYS ]
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
