import React from 'react';
import { useShop } from '../../context/ShopContext';
import campaignShoot03 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot01 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import velo01 from '../../assets/photoshoot/01-lzr-velo-07-black/velo-01.jpeg';
import burgundy01 from '../../assets/photoshoot/02-lzr-racing-division-burgundy/burgundy-01.jpeg';
import heroGirl from '../../assets/images/hero-girl.jpg';
import shoot01 from '../../assets/photoshoot/05-campaign-editorial/Screenshot_20260727_013151.jpg.jpeg';
import shoot02 from '../../assets/photoshoot/05-campaign-editorial/Screenshot_20260727_013045.jpg.jpeg';
import shoot04 from '../../assets/photoshoot/05-campaign-editorial/Screenshot_20260801_235207.jpg.jpeg';
import { ArrowRight } from 'lucide-react';

export const EditorialLookbookSection = () => {
  const { navigateTo } = useShop();

  const lookbookFrames = [
    { id: 'lb-1', img: shoot01 || heroGirl, num: '01' },
    { id: 'lb-2', img: shoot02 || burgundy01, num: '02' },
    { id: 'lb-3', img: velo01 || campaignShoot01, num: '03' },
    { id: 'lb-4', img: shoot04 || campaignShoot03, num: '04' },
  ];

  return (
    <section className="relative w-full bg-[#080808] text-[#EDE7DC] py-16 sm:py-24 px-5 sm:px-10 lg:px-14 select-none border-t border-white/[0.04] overflow-hidden">
      <div className="max-w-[1760px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left 5 Cols: Large Wide Campaign Gang / Shopping Cart Photograph */}
        <div className="lg:col-span-5 relative aspect-[4/3] sm:aspect-[4/3.5] bg-[#0c0c0c] overflow-hidden border border-white/10 shadow-2xl group">
          <img
            src={campaignShoot03}
            alt="Loozars Group Editorial Session"
            className="w-full h-full object-cover filter contrast-[1.14] brightness-90 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/50 via-transparent to-transparent" />
        </div>

        {/* Right 7 Cols: Lookbook Typography & 4-Frame Contact Sheet Strip */}
        <div className="lg:col-span-7 space-y-6 lg:pl-4">
          
          {/* Top: Section 04 Header & Tag */}
          <div className="space-y-2 font-mono">
            <div className="flex items-center gap-2 text-[11px] text-[#EDE7DC]/70 tracking-[0.25em]">
              <span>04</span>
              <span className="w-8 h-[1px] bg-[#EDE7DC]/40 inline-block"></span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <h2 className="font-editorial text-4xl sm:text-6xl font-bold tracking-tight text-[#EDE7DC] uppercase">
                LOOKBOOK
              </h2>

              {/* Minimal Circled Arrow Action */}
              <button
                onClick={() => navigateTo('drops')}
                className="w-10 h-10 rounded-full border border-white/30 hover:border-white text-[#EDE7DC] hover:text-[#8E1717] flex items-center justify-center transition-all hover:bg-white/10 flex-shrink-0"
                aria-label="View full lookbook"
              >
                <ArrowRight size={16} />
              </button>
            </div>

            <p className="text-xs sm:text-sm tracking-[0.2em] text-[#EDE7DC]/80 uppercase leading-relaxed">
              SAME PEOPLE.<br />
              DIFFERENT NIGHTS.
            </p>
          </div>

          {/* 4-Frame Contact Sheet Film Strip Reel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {lookbookFrames.map((frame) => (
              <div
                key={frame.id}
                onClick={() => navigateTo('drops')}
                className="group cursor-pointer relative aspect-[3/4] bg-[#111] overflow-hidden border border-white/15 hover:border-white/40 transition-all duration-300 shadow-md"
              >
                <img
                  src={frame.img}
                  alt={`Lookbook Frame ${frame.num}`}
                  className="w-full h-full object-cover filter contrast-[1.12] brightness-85 group-hover:scale-105 group-hover:brightness-100 transition-all duration-500"
                />
                
                {/* Index Pill in Corner */}
                <div className="absolute bottom-1.5 right-1.5 font-mono text-[9px] text-[#EDE7DC] bg-black/85 px-1.5 py-0.5 border border-white/15 tracking-widest uppercase">
                  {frame.num}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
