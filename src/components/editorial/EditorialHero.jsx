import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import loozarsLogoImg from '../../assets/images/loozars-official-logo.png';
import campaignShoot01 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot02 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot03 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import velo01 from '../../assets/photoshoot/01-lzr-velo-07-black/velo-01.jpeg';
import velo05 from '../../assets/photoshoot/01-lzr-velo-07-black/velo-05.jpeg';
import { ArrowRight } from 'lucide-react';

export const EditorialHero = () => {
  const { navigateTo } = useShop();
  const [activeThumb, setActiveThumb] = useState(0);

  const heroThumbnails = [
    { id: 0, img: campaignShoot03, label: '01' },
    { id: 1, img: campaignShoot05, label: '02' },
    { id: 2, img: campaignShoot04, label: '03' }
  ];

  const scrollToDrop = () => {
    const el = document.getElementById('drop-01');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigateTo('shop');
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-[#080808] text-[#EDE7DC] flex flex-col justify-between select-none overflow-hidden pt-24 sm:pt-28 pb-12 sm:pb-16 px-5 sm:px-10 lg:px-14">
      
      {/* Central High-Contrast Gritty Model 07 Back View Campaign Photograph */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <img
          src={campaignShoot01}
          alt="Loozars 07 Campaign Hero"
          className="w-full h-full object-cover object-[center_35%] sm:object-[center_28%] filter contrast-[1.15] brightness-[0.72] scale-[1.02]"
        />
        {/* Soft Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/70 via-transparent to-[#080808]/70" />
      </div>

      {/* Top Layer: Section 01 Tag & Editorial Manifestos */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Top-Left: Section Index & Headline */}
        <div className="md:col-span-5 space-y-3 font-mono">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] text-[#EDE7DC]/70">
            <span>01</span>
            <span className="w-8 h-[1px] bg-[#EDE7DC]/40 inline-block"></span>
          </div>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.22em] leading-relaxed text-[#EDE7DC] max-w-xs uppercase">
            STREETWEAR<br />
            FOR THE<br />
            RESTLESS<br />
            GENERATION.
          </p>
        </div>

        {/* Top-Right: Parking Lot Group Inset + Slanted Script Note */}
        <div className="md:col-span-7 flex flex-col items-end space-y-3">
          
          {/* Tilted / Angled Group Inset Frame */}
          <div className="relative w-48 sm:w-56 aspect-[16/10] bg-[#121212] border border-white/20 overflow-hidden shadow-2xl group">
            <img 
              src={campaignShoot03} 
              alt="Night Streetwear Session" 
              className="w-full h-full object-cover filter contrast-[1.18] brightness-90 group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Slanted Handwritten Text */}
          <div className="text-right space-y-1 pr-1">
            <p className="font-handwriting font-bold text-xl sm:text-2xl text-[#EDE7DC] tracking-wide -rotate-3 leading-tight">
              SAME PEOPLE.<br />
              DIFFERENT NIGHTS.
            </p>
            <div className="w-12 h-[1px] bg-[#EDE7DC]/40 ml-auto" />
          </div>

        </div>

      </div>

      {/* Mid Layer: Mid-Left Inset Taillight/Hand Shot + Geolocation */}
      <div className="relative z-10 hidden sm:block max-w-xs space-y-2 my-auto -mt-6">
        <div className="w-20 sm:w-24 aspect-[16/10] bg-[#111] border border-white/15 overflow-hidden">
          <img 
            src={campaignShoot02} 
            alt="Hand / Steering Detail" 
            className="w-full h-full object-cover filter contrast-125"
          />
        </div>
        <div className="font-mono text-[9px] text-[#EDE7DC]/60 tracking-[0.2em] uppercase leading-tight">
          20.0467° N<br />
          80.9462° E<br />
          IND
        </div>
      </div>

      {/* Bottom Layer: Giant Center LOOZARS Wordmark Overlapping and Bleeding Down + Bottom-Right CTA */}
      <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 gap-6 items-end mt-auto pt-8 sm:pt-16">
        
        {/* Bottom Left Spacer */}
        <div className="md:col-span-2 hidden md:block" />

        {/* Center: Massive Iconic LOOZARS Gothic/Serif Wordmark Overlapping and Bleeding Down */}
        <div className="md:col-span-8 flex flex-col items-center justify-center -mb-8 sm:-mb-14 pointer-events-none">
          <div className="relative w-full max-w-[650px] lg:max-w-[760px] select-none text-center">
            <img 
              src={loozarsLogoImg} 
              alt="LOOZARS®" 
              className="w-full h-auto object-contain filter brightness-125 contrast-150 drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]"
            />
          </div>
        </div>

        {/* Bottom-Right: Minimal CTA + Contact Sheet Frames */}
        <div className="md:col-span-2 flex flex-col items-end space-y-3">
          
          {/* Minimalist CTA Button */}
          <button
            onClick={scrollToDrop}
            className="group font-mono text-[11px] sm:text-xs tracking-[0.22em] text-[#EDE7DC] hover:text-[#8E1717] uppercase transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>[ DROP 01 LIVE NOW ]</span>
          </button>

          {/* 3 Contact Sheet Micro-Thumbnails + Circled Arrow */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-sm border border-white/10">
              {heroThumbnails.map((thumb) => (
                <button
                  key={thumb.id}
                  onClick={() => setActiveThumb(thumb.id)}
                  className={`w-8 h-6 border transition-all overflow-hidden ${
                    activeThumb === thumb.id ? 'border-[#8E1717]' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={thumb.img} alt={thumb.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <button
              onClick={scrollToDrop}
              className="w-7 h-7 rounded-full border border-white/20 hover:border-white text-[#EDE7DC] flex items-center justify-center transition-all hover:bg-white/10"
              aria-label="Explore drop"
            >
              <ArrowRight size={12} />
            </button>
          </div>

        </div>

      </div>

    </section>
  );
};
