import React from 'react';
import { useShop } from '../context/ShopContext';
import campaignShoot01 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot02 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot03 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot05 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import { ArrowRight } from 'lucide-react';

export const AboutPage = () => {
  const { navigateTo } = useShop();

  return (
    <div className="w-full min-h-screen bg-[#080808] pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1760px] mx-auto space-y-12 sm:space-y-16">
        
        {/* Section 17 Header: ABOUT LOOZARS */}
        <div className="border-b border-[#181818] pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl text-[#EDE7DC] font-normal uppercase leading-none tracking-tight">
              ABOUT LOOZARS
            </h1>
            
            <div className="font-mono text-xs text-[#8E1717] uppercase tracking-[0.25em] flex items-center gap-2">
              <span>EST. 2025</span>
              <span>//</span>
              <span>INDIA</span>
            </div>
          </div>
        </div>

        {/* Cinematic Image Collage */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          <div className="md:col-span-7 aspect-[16/10] bg-[#111111] overflow-hidden border border-[#1a1a1a]">
            <img 
              src={campaignShoot03} 
              alt="LOOZARS Drop 01 Group Campaign" 
              className="w-full h-full object-cover filter contrast-[1.08]"
            />
          </div>
          <div className="md:col-span-5 grid grid-cols-2 gap-4 sm:gap-6">
            <div className="aspect-square bg-[#111111] overflow-hidden border border-[#1a1a1a]">
              <img 
                src={campaignShoot05} 
                alt="LOOZARS Racing Division Editorial" 
                className="w-full h-full object-cover filter contrast-[1.05]" 
              />
            </div>
            <div className="aspect-square bg-[#111111] overflow-hidden border border-[#1a1a1a]">
              <img 
                src={campaignShoot01} 
                alt="LOOZARS Velo 07 Speedway Campaign" 
                className="w-full h-full object-cover filter contrast-[1.05]" 
              />
            </div>
          </div>
        </div>

        {/* Concise Editorial Brand Statement */}
        <div className="max-w-3xl space-y-6 pt-4">
          <p className="font-editorial text-2xl sm:text-3xl text-[#EDE7DC] leading-snug">
            LOOZARS is an Indian streetwear label built around individuality, graphic storytelling, youth culture and clothing that does not try to fit into conventional fashion.
          </p>

          <p className="font-mono text-xs sm:text-sm text-[#8E8D8A] leading-relaxed">
            Crafted in limited runs with heavy custom-milled cottons, raw distressed seams, and bold racing-inspired graphic artwork. Wear what shouldn't exist.
          </p>

          <div className="pt-4">
            <button
              onClick={() => navigateTo('shop')}
              className="inline-flex items-center gap-2 bg-[#EDE7DC] text-[#080808] px-6 py-3.5 text-xs font-mono font-bold tracking-[0.2em] uppercase hover:bg-[#8E1717] hover:text-white transition-colors"
            >
              <span>EXPLORE PIECES</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
