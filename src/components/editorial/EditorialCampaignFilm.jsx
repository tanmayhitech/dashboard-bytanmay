import React from 'react';
import { useShop } from '../../context/ShopContext';
import campaignShoot05 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import campaignShoot02 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot01 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import heroGirl from '../../assets/images/hero-girl.jpg';

export const EditorialCampaignFilm = () => {
  const { navigateTo } = useShop();

  return (
    <section className="relative w-full bg-[#080808] text-[#EDE7DC] select-none overflow-hidden py-16 sm:py-24 px-5 sm:px-10 lg:px-14 border-t border-b border-white/[0.04]">
      <div className="max-w-[1760px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left 3 Cols: Section 03 & "REAL PEOPLE. REAL PLACES." Typography */}
        <div className="lg:col-span-3 space-y-4 font-mono">
          <div className="flex items-center gap-2 text-[11px] text-[#EDE7DC]/70 tracking-[0.25em]">
            <span>03</span>
            <span className="w-8 h-[1px] bg-[#EDE7DC]/40 inline-block"></span>
          </div>

          <h3 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-bold uppercase leading-[0.95] tracking-tight">
            REAL<br />
            PEOPLE.<br />
            REAL<br />
            PLACES.
          </h3>

          <div className="w-12 h-[1px] bg-[#EDE7DC]/40 pt-1" />
        </div>

        {/* Center 6 Cols: Panoramic Night Automotive & Model Shot */}
        <div className="lg:col-span-6 relative aspect-[16/10] bg-[#0c0c0c] overflow-hidden border border-white/10 shadow-2xl group">
          
          {/* Dual Split Visual: Red Car Tail + Model in Vehicle */}
          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
            {/* Left 4 Cols: Red Car Taillights */}
            <div className="col-span-4 relative h-full overflow-hidden">
              <img
                src={campaignShoot05}
                alt="Automotive Red Lights"
                className="w-full h-full object-cover filter contrast-[1.25] brightness-90 saturate-125"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#080808]/60" />
            </div>

            {/* Right 8 Cols: Girl Model with Sunglasses */}
            <div className="col-span-8 relative h-full overflow-hidden">
              <img
                src={heroGirl}
                alt="Loozars Model in Vehicle"
                className="w-full h-full object-cover object-center filter contrast-[1.18] brightness-85 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
          </div>

          {/* Soft Vignette Overlay */}
          <div className="absolute inset-0 bg-[#080808]/20 pointer-events-none" />
        </div>

        {/* Right 3 Cols: Stacked Dual Inset Thumbnails & Side Manifesto Copy */}
        <div className="lg:col-span-3 flex flex-col items-start lg:items-end space-y-5">
          
          {/* Top Inset Frame: Concrete Overpass */}
          <div className="w-36 sm:w-44 aspect-[16/10] bg-[#121212] border border-white/20 overflow-hidden shadow-xl">
            <img
              src={campaignShoot01}
              alt="Concrete Overpass Location"
              className="w-full h-full object-cover filter contrast-[1.2] brightness-80"
            />
          </div>

          {/* Bottom Inset Frame: Red-Lit Portrait */}
          <div className="w-36 sm:w-44 aspect-[16/10] bg-[#121212] border border-white/20 overflow-hidden shadow-xl">
            <img
              src={campaignShoot05}
              alt="Red Atmospheric Portrait"
              className="w-full h-full object-cover filter contrast-[1.25] brightness-90"
            />
          </div>

          {/* Side Manifesto Text */}
          <div className="font-mono text-[10px] sm:text-[11px] text-[#EDE7DC]/70 tracking-[0.2em] uppercase leading-relaxed text-left lg:text-right max-w-[200px] space-y-1">
            <p>
              BUILT DIFFERENT FOR A RESTLESS GENERATION.
            </p>
            <div className="w-10 h-[1px] bg-[#EDE7DC]/40 ml-0 lg:ml-auto" />
          </div>

        </div>

      </div>
    </section>
  );
};
