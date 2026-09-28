import React from 'react';
import { useShop } from '../context/ShopContext';
import campaignShoot04 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';

export const EditorialCollage = () => {
  const { navigateTo } = useShop();

  return (
    <section className="relative w-full bg-[#080808] py-16 sm:py-24 px-4 sm:px-8 lg:px-12 border-t border-[#141414] overflow-hidden select-none">
      <div className="max-w-[1720px] mx-auto">
        
        {/* Asymmetrical 3-Part Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* 1. Left: Authentic Speedway Duo Shot (5 cols) */}
          <div className="lg:col-span-5 relative group">
            <div 
              data-cursor="view"
              className="relative aspect-[4/5] sm:aspect-[4/3] bg-[#121212] overflow-hidden border border-[#222222]"
            >
              <img 
                src={campaignShoot04} 
                alt="LOOZARS Speedway Duo Editorial" 
                className="w-full h-full object-cover filter contrast-[1.08] group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute top-3 left-3 font-mono text-[9px] text-[#8E1717] bg-black/85 px-2 py-0.5 tracking-widest border border-[#8E1717]/30">
                ARCHIVE // DROP 01
              </div>
            </div>
          </div>

          {/* 2. Center: Authentic Racing Division Shoot Element (3 cols) */}
          <div className="lg:col-span-3">
            <div 
              data-cursor="view"
              className="relative aspect-[4/5] sm:aspect-[4/3] bg-[#111111] overflow-hidden border border-[#1e1e1e] group"
            >
              <img 
                src={campaignShoot05} 
                alt="LOOZARS Racing Division Shoot" 
                className="w-full h-full object-cover filter contrast-[1.08] group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
          </div>

          {/* 3. Right: Huge Editorial Manifesto Statement (4 cols) */}
          <div className="lg:col-span-4 space-y-4 lg:pl-6 relative">
            
            {/* Red Spiked Star Accent in the Top Corner */}
            <div className="text-[#8E1717] opacity-80 mb-2">
              <svg width="32" height="32" viewBox="0 0 100 100">
                <path d="M50 0 L53 45 L98 50 L53 55 L50 100 L47 55 L2 50 L47 45 Z" fill="#8E1717" />
                <line x1="20" y1="20" x2="80" y2="80" stroke="#8E1717" strokeWidth="3" />
                <line x1="80" y1="20" x2="20" y2="80" stroke="#8E1717" strokeWidth="3" />
              </svg>
            </div>

            {/* Exact Headline in High-Contrast Editorial Serif */}
            <div className="space-y-0.5 select-none">
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-normal leading-[0.98] tracking-tight uppercase">
                CLOTHES
              </h2>
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-normal leading-[0.98] tracking-tight uppercase">
                FOR PEOPLE
              </h2>
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-normal leading-[0.98] tracking-tight uppercase">
                WHO DON'T
              </h2>
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-normal leading-[0.98] tracking-tight uppercase">
                NEED
              </h2>
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#8E8D8A] italic font-normal leading-[0.98] tracking-tight uppercase">
                PERMISSION.
              </h2>
            </div>

            {/* Bottom Spiked Corner Glyph */}
            <div className="pt-4 flex items-center gap-2 text-[#8E1717] opacity-70">
              <span className="font-mono text-xs">✦ ✦ ✦</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
