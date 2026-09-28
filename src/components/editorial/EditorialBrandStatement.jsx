import React from 'react';
import { useShop } from '../../context/ShopContext';
import masterHeroOriginal from '../../assets/images/master-hero-original.jpg';
import campaignShoot02 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';

export const EditorialBrandStatement = () => {
  const { navigateTo } = useShop();

  return (
    <section className="relative w-full bg-[#F3F0E8] text-[#080808] py-20 sm:py-28 px-5 sm:px-10 lg:px-14 select-none border-t border-[#080808]/10 overflow-hidden">
      <div className="max-w-[1760px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left 4 Cols: Section 05 & "A WORLD OF OUR OWN." Typography + Red Accent */}
        <div className="lg:col-span-4 space-y-3 font-mono">
          <div className="flex items-center gap-2 text-[11px] text-[#080808]/70 tracking-[0.25em]">
            <span>05</span>
            <span className="w-8 h-[1px] bg-[#080808]/30 inline-block"></span>
          </div>

          <div className="relative">
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-bold text-[#080808] uppercase leading-[0.92] tracking-tight">
              A WORLD<br />
              OF OUR OWN.
            </h2>

            {/* Red Dynamic Brush Accent Beside "WORLD" */}
            <svg 
              className="absolute -top-1 right-2 sm:right-8 w-16 sm:w-24 h-6 pointer-events-none" 
              viewBox="0 0 100 24" 
              fill="none"
            >
              <path 
                d="M5 18 C30 8, 70 5, 95 12" 
                stroke="#8E1717" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />
              <path 
                d="M20 20 C45 10, 80 8, 92 14" 
                stroke="#8E1717" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                opacity="0.6" 
              />
            </svg>
          </div>
        </div>

        {/* Center 5 Cols: Wide Cinematic Car on Bridge Strip */}
        <div className="lg:col-span-5 relative aspect-[16/8] bg-[#111] overflow-hidden border border-[#080808]/15 shadow-xl group">
          <img
            src={masterHeroOriginal || campaignShoot02}
            alt="Cinematic Dusk Highway Run"
            className="w-full h-full object-cover filter contrast-[1.2] brightness-90 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Right 3 Cols: Side Manifesto Copy */}
        <div className="lg:col-span-3 flex flex-col items-start lg:items-end space-y-3 font-mono text-[11px] text-[#080808]/70 tracking-[0.2em] uppercase leading-relaxed text-left lg:text-right">
          <p>
            BUILT DIFFERENT FOR A RESTLESS GENERATION.
          </p>
          <div className="w-10 h-[1px] bg-[#080808]/30 ml-0 lg:ml-auto" />
        </div>

      </div>
    </section>
  );
};
