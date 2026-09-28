import React from 'react';
import { useShop } from '../../context/ShopContext';
import campaignShoot02 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import velo02 from '../../assets/photoshoot/01-lzr-velo-07-black/velo-02.jpeg';
import { ArrowRight } from 'lucide-react';

export const EditorialSplitBanner = () => {
  const { navigateTo } = useShop();

  return (
    <section className="relative w-full bg-[#070707] text-[#EDE7DC] select-none overflow-hidden border-b border-white/[0.04]">
      <div className="w-full grid grid-cols-1 md:grid-cols-12 items-stretch">
        
        {/* ========================================================== */}
        {/* LEFT HALF: RED TINTED HOODED / EYE CLOSE-UP (6 COLS)       */}
        {/* ========================================================== */}
        <div 
          onClick={() => navigateTo('drops')}
          className="md:col-span-6 relative aspect-[16/9] sm:aspect-[21/9] md:aspect-auto md:min-h-[360px] lg:min-h-[420px] bg-[#120505] overflow-hidden group cursor-pointer border-b md:border-b-0 md:border-r border-white/[0.04]"
        >
          <img 
            src={campaignShoot02} 
            alt="LOOZARS Nocturne Close-up" 
            className="w-full h-full object-cover filter contrast-[1.25] brightness-[0.85] sepia-[0.3] hue-rotate-[320deg] group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Deep Red Atmosphere Tint */}
          <div className="absolute inset-0 bg-[#8E1717]/30 mix-blend-multiply pointer-events-none" />

          {/* Handwritten Diagonal Script Overlay: "SAME PEOPLE DIFFERENT NIGHTS" */}
          <div className="absolute top-1/2 right-6 sm:right-12 -translate-y-1/2 z-10 pointer-events-none">
            <div className="font-handwriting text-3xl sm:text-4xl lg:text-5xl text-[#EDE7DC] tracking-wide rotate-[-8deg] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] opacity-95">
              SAME<br />PEOPLE<br />DIFFERENT<br />NIGHTS
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* RIGHT HALF: MACRO GARMENT HOOD / CAR CROP (6 COLS)         */}
        {/* ========================================================== */}
        <div 
          onClick={() => navigateTo('drops')}
          className="md:col-span-6 relative aspect-[16/9] sm:aspect-[21/9] md:aspect-auto md:min-h-[360px] lg:min-h-[420px] bg-[#0c0c0c] overflow-hidden group cursor-pointer flex items-center justify-end p-6 sm:p-12 lg:p-16"
        >
          <img 
            src={velo02} 
            alt="LOOZARS Speedway Detail" 
            className="absolute inset-0 w-full h-full object-cover filter contrast-[1.15] brightness-[0.75] group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          
          {/* Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/40 to-black/85 pointer-events-none" />

          {/* Right Metadata Block */}
          <div className="relative z-10 space-y-4 text-right">
            
            <div className="space-y-1 font-mono text-xs sm:text-sm text-[#EDE7DC] tracking-[0.25em] uppercase">
              <div className="text-[#8E8D8A] text-[10px] sm:text-xs">
                // DROP 01
              </div>
              <div className="font-bold tracking-widest text-sm sm:text-base">
                SPEEDWAY DIVISION
              </div>
            </div>

            {/* View Collection Link */}
            <div className="pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo('drops');
                }}
                className="font-mono text-xs sm:text-sm text-[#EDE7DC] hover:text-[#8E1717] tracking-[0.25em] uppercase transition-colors inline-flex items-center gap-2 font-bold group/btn"
              >
                <span>[ VIEW COLLECTION → ]</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
