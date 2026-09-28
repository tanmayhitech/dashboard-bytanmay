import React from 'react';
import { useShop } from '../context/ShopContext';
import campaignShoot03 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import { ArrowRight } from 'lucide-react';

export const Campaign = () => {
  const { navigateTo } = useShop();

  return (
    <section className="relative w-full bg-[#080808] py-8 sm:py-16 px-4 sm:px-8 lg:px-12 border-t border-[#141414]">
      <div className="max-w-[1720px] mx-auto">
        
        {/* Full-width Exact Campaign Image Frame */}
        <div 
          onClick={() => navigateTo('drops')}
          data-cursor="view"
          className="relative w-full bg-[#0d0d0d] overflow-hidden border border-[#181818] group cursor-pointer shadow-2xl aspect-[16/9] sm:aspect-[21/9]"
        >
          <img 
            src={campaignShoot03} 
            alt="LOOZARS Drop 01 Racing Division Campaign" 
            className="w-full h-full object-cover object-center filter contrast-[1.08] group-hover:scale-[1.01] transition-transform duration-700 ease-out"
          />

          {/* Subtle Red Graphic Marks on Top Corner */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 text-[#8E1717] opacity-80 pointer-events-none">
            <span className="font-mono text-xs">✕ ✕</span>
          </div>

          {/* Quiet Cinematic Editorial Overlay in Bottom-Left */}
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 z-10 bg-black/85 backdrop-blur-md p-4 sm:p-6 border border-white/10 max-w-sm sm:max-w-md">
            
            {/* Small Drop Tag */}
            <div className="flex items-center gap-2 font-mono text-[9px] sm:text-[10px] text-[#8E1717] tracking-[0.25em] uppercase mb-1">
              <span>DROP 01</span>
              <span>•</span>
              <span>RACING DIVISION</span>
            </div>

            {/* Campaign Headline */}
            <h3 className="font-editorial text-lg sm:text-2xl text-[#EDE7DC] font-normal leading-tight tracking-tight uppercase mb-2">
              FOUR TEES.
              <br />
              <span className="italic text-[#8E8D8A]">ONE RACING LANGUAGE.</span>
            </h3>

            <p className="font-mono text-[10px] text-[#8E8D8A] tracking-wider uppercase mb-3">
              "BY THE RARE. FOR THE RARE."
            </p>

            {/* CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateTo('drops');
              }}
              className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-[0.2em] text-[#EDE7DC] hover:text-[#8E1717] uppercase transition-colors group/btn"
            >
              <span>EXPLORE COLLECTION</span>
              <ArrowRight size={13} className="text-[#8E1717] group-hover/btn:translate-x-1.5 transition-transform" />
            </button>

          </div>

        </div>

      </div>
    </section>
  );
};
