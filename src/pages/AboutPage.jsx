import React from 'react';
import { useShop } from '../context/ShopContext';
import { ArrowRight, ArrowDown } from 'lucide-react';

// Campaign Assets
import masterHero from '../assets/images/master-hero-original.jpg';
import heroGirl from '../assets/images/hero-girl.jpg';
import campaignShoot01 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot02 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot03 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import campaignCarNight from '../assets/photoshoot/05-campaign-editorial/Screenshot_20260727_013151.jpg.jpeg';
import apex02 from '../assets/photoshoot/03-lzr-apex-club-offwhite/apex-02.jpeg';

export const AboutPage = () => {
  const { navigateTo } = useShop();

  return (
    <div className="w-full min-h-screen bg-[#090909] text-[#EDE7DC] select-none overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 01. FULL-BLEED HERO VIEWPORT (100vw Campaign Hero)                        */}
      {/* ========================================================================= */}
      <section className="relative w-full h-screen min-h-[640px] flex items-end justify-between overflow-hidden">
        
        {/* Full Viewport Photographic Layer */}
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src={campaignShoot04} 
            alt="LOOZARS Origin Story Hero" 
            className="w-full h-full object-cover object-[center_35%] filter contrast-[1.14] brightness-[0.78]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-black/60" />
        </div>

        {/* Top-Left Metadata */}
        <div className="absolute top-24 sm:top-28 left-5 sm:left-10 lg:left-14 z-10 font-mono text-[11px] text-[#EDE7DC]/70 tracking-[0.25em] uppercase space-y-1">
          <div className="flex items-center gap-2">
            <span>05</span>
            <span className="w-8 h-[1px] bg-[#EDE7DC]/40 inline-block"></span>
            <span>BRAND MANIFESTO</span>
          </div>
          <p className="text-[10px] text-[#8E1717] font-bold">
            LOOZARS® // ORIGIN
          </p>
        </div>

        {/* Top-Right Micro Statement */}
        <div className="absolute top-24 sm:top-28 right-5 sm:right-10 lg:right-14 z-10 hidden sm:block font-mono text-[10px] text-right uppercase tracking-[0.2em] text-[#EDE7DC]/60">
          <p className="text-white font-bold">LOOZARS®</p>
          <p>INDEPENDENT STREETWEAR</p>
          <p className="text-[#8E1717]">MMXXVI</p>
        </div>

        {/* Bottom Hero Typography */}
        <div className="relative z-10 max-w-[1760px] w-full mx-auto px-5 sm:px-10 lg:px-14 pb-12 sm:pb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="font-editorial text-5xl sm:text-7xl lg:text-9xl text-[#EDE7DC] font-bold uppercase leading-[0.88] tracking-tight">
              OUR STORY
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#8E8D8A] uppercase tracking-[0.25em]">
              BUILT FROM THE RESTLESS.
            </p>
          </div>

          <div className="font-mono text-[10px] sm:text-[11px] text-[#EDE7DC]/70 uppercase tracking-[0.2em] flex items-center gap-3">
            <span>EST. 2025 // INDIA</span>
            <span className="text-[#8E1717]">·</span>
            <div className="flex items-center gap-1.5 text-[#EDE7DC]/90 animate-bounce">
              <span>SCROLL TO EXPLORE</span>
              <ArrowDown size={12} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. FIRST EDITORIAL STATEMENT (Warm Ivory #F1EEE6)                        */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-[#F1EEE6] text-[#0A0A0A] py-20 sm:py-32 px-5 sm:px-10 lg:px-14 border-t border-b border-[#0A0A0A]/15">
        <div className="max-w-[1760px] mx-auto space-y-8">
          
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-[#8E1717] font-bold tracking-[0.25em] uppercase">
              <span>01</span>
              <span className="w-8 h-[1px] bg-[#8E1717] inline-block"></span>
              <span>THE PURPOSE</span>
            </div>

            <h2 className="font-editorial text-4xl sm:text-7xl lg:text-8xl font-bold uppercase leading-[0.9] tracking-tight">
              MORE THAN<br />
              <span className="italic text-[#555] font-normal font-serif">CLOTHES.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-[#0A0A0A]/15">
            <div className="lg:col-span-6 font-mono text-xs sm:text-sm text-[#0A0A0A]/80 leading-relaxed uppercase tracking-wider space-y-3">
              <p>
                Loozars is an independent streetwear label built for a generation that refuses the ordinary. Born from midnight speedways, underground garage sessions, and the raw kinetic energy of Indian youth culture.
              </p>
              <p className="text-[#0A0A0A]/60 text-[11px]">
                We reject fast-fashion mass-production. Every silhouette is built around heavyweight textiles, boxy architectures, and motorsport-inspired visual storytelling.
              </p>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-between items-start lg:items-end font-mono text-[11px] text-[#0A0A0A]/60 uppercase tracking-widest space-y-4">
              <div>
                <span className="text-[#8E1717] font-bold block mb-1">STANDARD // 320 GSM</span>
                <p>100% COMBED FRENCH TERRY COTTON</p>
                <p>PRE-SHRUNK ENZYME MINERAL PATINA</p>
              </div>

              <div className="text-[#8E1717] font-bold text-xs">
                BY THE RARE. FOR THE RARE.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Kinetic Moving Manifesto Ticker */}
      <div className="w-full bg-[#090909] text-[#EDE7DC] py-3.5 overflow-hidden border-b border-white/10 font-mono text-[10px] sm:text-[11px] tracking-[0.25em] uppercase marquee-container select-none">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">WEAR WHAT SHOULDN'T EXIST</span>
            <span className="text-[#8E8D8A]">· INDEPENDENT ATELIER</span>
          </span>
          <span className="text-[#8E8D8A]">BOMBAY // INDIA</span>
          <span className="text-[#8E1717] font-bold">BY THE RARE. FOR THE RARE.</span>
          <span className="text-white/30">·</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">320 GSM FRENCH TERRY</span>
          </span>
          <span className="text-[#8E8D8A]">FOR THE RESTLESS GENERATION</span>
          <span className="text-white/30">·</span>
          {/* Duplicate loop */}
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">WEAR WHAT SHOULDN'T EXIST</span>
            <span className="text-[#8E8D8A]">· INDEPENDENT ATELIER</span>
          </span>
          <span className="text-[#8E8D8A]">BOMBAY // INDIA</span>
          <span className="text-[#8E1717] font-bold">BY THE RARE. FOR THE RARE.</span>
          <span className="text-white/30">·</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">320 GSM FRENCH TERRY</span>
          </span>
          <span className="text-[#8E8D8A]">FOR THE RESTLESS GENERATION</span>
          <span className="text-white/30">·</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 03. BRAND ORIGIN SECTION (Asymmetric Split Layout)                        */}
      {/* ========================================================================= */}
      <section className="relative w-full py-20 sm:py-32 px-5 sm:px-10 lg:px-14 bg-[#090909]">
        <div className="max-w-[1760px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left: Large Editorial Campaign Still (60% width / 7 cols) */}
          <div className="lg:col-span-7 relative aspect-[4/3] bg-[#141414] overflow-hidden border border-white/10 group">
            <img 
              src={masterHero} 
              alt="Loozars Brand Origin" 
              className="w-full h-full object-cover filter contrast-[1.1] brightness-85 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
            <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#EDE7DC] bg-black/80 px-2.5 py-1 uppercase tracking-widest border border-white/10">
              01 // SPEEDWAY ARCHIVE
            </div>
          </div>

          {/* Right: Origin Text (40% width / 5 cols) */}
          <div className="lg:col-span-5 space-y-6 font-mono">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#8E1717] font-bold tracking-[0.25em] uppercase">
                <span>01</span>
                <span className="w-8 h-[1px] bg-[#8E1717] inline-block"></span>
                <span>ORIGIN</span>
              </div>
              <h3 className="font-editorial text-3xl sm:text-5xl text-[#EDE7DC] font-bold uppercase tracking-tight">
                WHERE IT STARTED.
              </h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#8E8D8A] leading-relaxed uppercase tracking-wider">
              <p>
                Streetwear was never meant to be sterile. It was meant to be loud, heavy, and unapologetic.
              </p>
              <p>
                Loozars began with a singular rebellion: to create garments with the tactile presence of motorsport uniforms and the unrefined spirit of late-night asphalt.
              </p>
              <p className="text-[11px] text-[#EDE7DC]/60 pt-2 border-t border-white/10">
                NO SEASONS. NO COMPROMISE. ONLY TIMELESS HEAVYWEIGHT PIECES.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04. BRAND PHILOSOPHY (3 Principles Spread on Dark Canvas)                 */}
      {/* ========================================================================= */}
      <section className="relative w-full py-20 sm:py-32 px-5 sm:px-10 lg:px-14 bg-[#0E0E0E] border-t border-b border-white/10">
        <div className="max-w-[1760px] mx-auto space-y-16 sm:space-y-24">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 font-mono">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#8E1717] font-bold tracking-[0.25em] uppercase">
                <span>02</span>
                <span className="w-8 h-[1px] bg-[#8E1717] inline-block"></span>
                <span>THE PILLARS</span>
              </div>
              <h3 className="font-editorial text-3xl sm:text-5xl text-[#EDE7DC] font-bold uppercase tracking-tight">
                WHAT WE BELIEVE.
              </h3>
            </div>

            <div className="text-[10px] text-[#8E8D8A] uppercase tracking-widest">
              THREE EDITORIAL CODES
            </div>
          </div>

          {/* 3 Large Spaced Editorial Principles (No corporate cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Principle 01 */}
            <div className="space-y-4 font-mono">
              <div className="text-sm font-bold text-[#8E1717] tracking-widest">01</div>
              <div className="w-full h-[1px] bg-white/15"></div>
              <h4 className="font-editorial text-2xl sm:text-3xl text-[#EDE7DC] uppercase font-bold tracking-tight">
                MOVE<br />DIFFERENT.
              </h4>
              <p className="text-xs text-[#8E8D8A] leading-relaxed uppercase tracking-wider pt-2">
                Refuse to follow the prescribed path. Build your own momentum in silence and let the presence speak for itself.
              </p>
            </div>

            {/* Principle 02 */}
            <div className="space-y-4 font-mono">
              <div className="text-sm font-bold text-[#8E1717] tracking-widest">02</div>
              <div className="w-full h-[1px] bg-white/15"></div>
              <h4 className="font-editorial text-2xl sm:text-3xl text-[#EDE7DC] uppercase font-bold tracking-tight">
                MAKE YOUR<br />OWN RULES.
              </h4>
              <p className="text-xs text-[#8E8D8A] leading-relaxed uppercase tracking-wider pt-2">
                Wear what shouldn't exist. Reject mass conformity and fast-fashion cycles designed to be discarded in weeks.
              </p>
            </div>

            {/* Principle 03 */}
            <div className="space-y-4 font-mono">
              <div className="text-sm font-bold text-[#8E1717] tracking-widest">03</div>
              <div className="w-full h-[1px] bg-white/15"></div>
              <h4 className="font-editorial text-2xl sm:text-3xl text-[#EDE7DC] uppercase font-bold tracking-tight">
                WEAR THE WORLD<br />YOU BELONG TO.
              </h4>
              <p className="text-xs text-[#8E8D8A] leading-relaxed uppercase tracking-wider pt-2">
                Heavyweight 320 GSM combed cotton woven for the real asphalt, midnight garages, and genuine human culture.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 05. THE PEOPLE (Editorial Photographic Collage)                           */}
      {/* ========================================================================= */}
      <section className="relative w-full py-20 sm:py-32 px-5 sm:px-10 lg:px-14 bg-[#090909]">
        <div className="max-w-[1760px] mx-auto space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4 font-mono">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#8E1717] font-bold tracking-[0.25em] uppercase">
                <span>03</span>
                <span className="w-8 h-[1px] bg-[#8E1717] inline-block"></span>
                <span>THE COMMUNITY</span>
              </div>
              <h3 className="font-editorial text-3xl sm:text-5xl text-[#EDE7DC] font-bold uppercase tracking-tight">
                THE PEOPLE.
              </h3>
            </div>

            <p className="text-xs text-[#8E8D8A] uppercase tracking-widest">
              REAL PEOPLE · REAL PLACES · NO STAGED LIGHTING
            </p>
          </div>

          {/* Asymmetrical Collage: 1 Large + 2 Medium + 1 Detail */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Dominant Frame (7 cols) */}
            <div className="md:col-span-7 relative aspect-[4/3] bg-[#141414] overflow-hidden border border-white/10 group">
              <img 
                src={campaignShoot01} 
                alt="The Squad" 
                className="w-full h-full object-cover filter contrast-[1.12] brightness-85 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-3 left-3 font-mono text-[9px] text-[#EDE7DC] bg-black/80 px-2 py-0.5 tracking-widest uppercase border border-white/10">
                KANPUR SPEEDWAY ARCHIVE
              </div>
            </div>

            {/* Stacked Frames (5 cols) */}
            <div className="md:col-span-5 grid grid-cols-2 gap-4 sm:gap-6">
              <div className="aspect-square bg-[#141414] overflow-hidden border border-white/10 group">
                <img 
                  src={campaignCarNight} 
                  alt="After Hours" 
                  className="w-full h-full object-cover filter contrast-[1.15] brightness-85 group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
              <div className="aspect-square bg-[#141414] overflow-hidden border border-white/10 group">
                <img 
                  src={apex02} 
                  alt="Apex 88 Silhouette" 
                  className="w-full h-full object-cover filter contrast-[1.06] brightness-90 group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
              <div className="col-span-2 aspect-[21/9] bg-[#141414] overflow-hidden border border-white/10 group">
                <img 
                  src={campaignShoot02} 
                  alt="Night Run" 
                  className="w-full h-full object-cover filter contrast-[1.12] brightness-85 group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06. "FOR THE RESTLESS" (100vw Full-Bleed Manifesto Break)                 */}
      {/* ========================================================================= */}
      <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[420px] bg-black overflow-hidden border-t border-b border-white/10 flex items-center">
        <img 
          src={campaignShoot03} 
          alt="For The Restless Generation" 
          className="absolute inset-0 w-full h-full object-cover filter contrast-[1.18] brightness-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/90" />

        <div className="relative z-10 max-w-[1760px] w-full mx-auto px-5 sm:px-10 lg:px-14 py-16">
          <div className="max-w-2xl space-y-4 font-mono">
            <span className="text-xs text-[#8E1717] font-bold tracking-[0.3em] uppercase block">
              [ MANIFESTO // 04 ]
            </span>

            <h3 className="font-editorial text-4xl sm:text-6xl lg:text-7xl text-[#EDE7DC] font-bold uppercase leading-[0.88] tracking-tight">
              FOR THE<br />
              <span className="italic text-[#8E8D8A] font-serif font-normal">RESTLESS</span><br />
              GENERATION.
            </h3>

            <p className="text-xs text-[#8E8D8A] uppercase tracking-[0.2em] pt-2">
              WE DO NOT BUILD CLOTHES FOR EVERYONE. WE BUILD FOR THE FEW WHO CARE.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 07. TECHNICAL ARCHIVAL DETAILS (Warm Ivory #F1EEE6)                       */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-[#F1EEE6] text-[#0A0A0A] py-16 sm:py-24 px-5 sm:px-10 lg:px-14 select-none">
        <div className="max-w-[1760px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 font-mono text-xs border-t border-b border-[#0A0A0A]/15 py-8">
          
          <div className="space-y-1">
            <span className="text-[10px] text-[#8E1717] font-bold tracking-widest uppercase block">LABEL</span>
            <p className="font-bold text-sm text-[#0A0A0A]">LOOZARS®</p>
            <p className="text-[#0A0A0A]/60 text-[10px]">INDEPENDENT ATELIER</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-[#8E1717] font-bold tracking-widest uppercase block">ORIGIN</span>
            <p className="font-bold text-sm text-[#0A0A0A]">BOMBAY // IND</p>
            <p className="text-[#0A0A0A]/60 text-[10px]">SPEEDWAY ARCHIVE</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-[#8E1717] font-bold tracking-widest uppercase block">CURRENT CAPSULE</span>
            <p className="font-bold text-sm text-[#0A0A0A]">DROP 01</p>
            <p className="text-[#0A0A0A]/60 text-[10px]">RACING DIVISION</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-[#8E1717] font-bold tracking-widest uppercase block">TEXTILE STANDARD</span>
            <p className="font-bold text-sm text-[#0A0A0A]">320 GSM</p>
            <p className="text-[#0A0A0A]/60 text-[10px]">COMBED COTTON</p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 08. FINAL CLOSING STATEMENT & DUAL CTAs (Dark Finale)                     */}
      {/* ========================================================================= */}
      <section className="relative w-full py-20 sm:py-32 px-5 sm:px-10 lg:px-14 bg-[#090909] text-[#EDE7DC] text-center select-none">
        <div className="max-w-[1760px] mx-auto space-y-8">
          
          <div className="font-mono text-xs text-[#8E1717] font-bold tracking-[0.3em] uppercase">
            BY THE RARE. FOR THE RARE.
          </div>

          <h2 className="font-editorial text-4xl sm:text-7xl lg:text-8xl font-bold uppercase tracking-tight leading-[0.9]">
            WEAR WHAT<br />
            <span className="italic text-[#8E8D8A] font-serif font-normal">SHOULDN'T</span> EXIST.
          </h2>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 font-mono text-xs">
            <button
              onClick={() => navigateTo('shop')}
              className="w-full sm:w-auto px-8 py-4 bg-[#EDE7DC] text-[#080808] hover:bg-[#8E1717] hover:text-white font-bold uppercase tracking-[0.25em] transition-all rounded-none shadow-xl flex items-center justify-center gap-2 group"
            >
              <span>EXPLORE THE DROP</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigateTo('drops')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-[#EDE7DC] hover:border-white hover:text-white font-bold uppercase tracking-[0.25em] transition-all rounded-none"
            >
              <span>ENTER THE LOOKBOOK →</span>
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
