import React from 'react';
import { useShop } from '../../context/ShopContext';
import campaignShoot03 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import velo01 from '../../assets/photoshoot/01-lzr-velo-07-black/velo-01.jpeg';
import { ArrowRight } from 'lucide-react';

export const EditorialNightManifesto = () => {
  const { navigateTo } = useShop();

  const communityCrops = [
    { id: 1, img: campaignShoot04, alt: 'Street Duo' },
    { id: 2, img: campaignShoot05, alt: 'Red Corridor' },
    { id: 3, img: velo01, alt: 'Velo Cutout' },
  ];

  return (
    <section className="relative w-full bg-[#070707] text-[#EDE7DC] select-none overflow-hidden border-b border-white/[0.04]">
      
      {/* Full-width Cinematic Speed Visual Frame */}
      <div 
        onClick={() => navigateTo('drops')}
        className="relative w-full aspect-[16/10] sm:aspect-[21/9] md:aspect-[24/9] min-h-[380px] sm:min-h-[460px] bg-[#0c0c0c] overflow-hidden group cursor-pointer"
      >
        {/* Night Drift / Speed Background Image */}
        <img 
          src={campaignShoot03} 
          alt="LOOZARS Night Run Speed" 
          className="w-full h-full object-cover object-center filter contrast-[1.2] brightness-[0.8] group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 pointer-events-none" />

        {/* Top Left: [ 02 ] + Handwritten "IT'S A MINDSET // →" */}
        <div className="absolute top-6 left-6 sm:top-10 sm:left-12 z-20 space-y-3">
          <div className="font-mono text-xs text-[#8E8D8A] tracking-widest uppercase">
            [ 02 ]
          </div>

          <div className="font-handwriting text-3xl sm:text-5xl text-[#EDE7DC] tracking-wide rotate-[-5deg] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            IT'S A<br />MINDSET<br />
            <span className="text-2xl sm:text-4xl text-[#8E8D8A] font-mono tracking-normal block pt-1">// →</span>
          </div>
        </div>

        {/* Right Overlay: REAL PEOPLE. REAL PLACES. LOOZARS EVERYWHERE. + 3 Community Frames */}
        <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-12 z-20 flex flex-col items-end space-y-4">
          
          {/* Manifesto Text Block */}
          <div className="text-right font-mono text-[9px] sm:text-xs text-[#EDE7DC] tracking-[0.22em] uppercase leading-relaxed border-r-2 border-white/40 pr-3">
            <div>REAL PEOPLE.</div>
            <div>REAL PLACES.</div>
            <div className="text-[#8E8D8A]">LOOZARS EVERYWHERE.</div>
          </div>

          {/* 3 Square Contact Sheet Polaroids */}
          <div className="flex items-center gap-2 sm:gap-3 pt-1">
            {communityCrops.map((crop, idx) => (
              <div 
                key={crop.id || idx}
                className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 aspect-square overflow-hidden bg-[#111111] border border-white/20 shadow-xl group-hover:border-white/50 transition-colors"
              >
                <img 
                  src={crop.img} 
                  alt={crop.alt} 
                  className="w-full h-full object-cover filter contrast-[1.1] grayscale"
                />
              </div>
            ))}
          </div>

        </div>

      </div>

    </section>
  );
};
