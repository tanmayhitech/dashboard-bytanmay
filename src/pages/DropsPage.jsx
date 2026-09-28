import React from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS, DROP_INFO } from '../data/products';
import campaignShoot01 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot02 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot03 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import { ArrowRight } from 'lucide-react';

export const DropsPage = () => {
  const { navigateTo, products } = useShop();
  const catalog = products && products.length > 0 ? products : STATIC_PRODUCTS;

  return (
    <div className="w-full min-h-screen bg-[#080808] pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1760px] mx-auto space-y-16 sm:space-y-24">
        
        {/* Drop 01 Header & Statement */}
        <div className="border-b border-[#181818] pb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8E1717]"></span>
                <span className="font-mono text-xs text-[#8E1717] tracking-[0.3em] uppercase">
                  DROP 01 // RACING DIVISION
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-7xl lg:text-8xl text-[#EDE7DC] font-normal leading-[0.95] tracking-tight">
                RACING DIVISION
              </h1>
              <p className="font-editorial text-2xl sm:text-4xl text-[#8E8D8A] italic">
                FOUR TEES. ONE RACING LANGUAGE.
              </p>
            </div>

            <div className="space-y-2 max-w-md font-mono text-xs text-[#8E8D8A]">
              <p>{DROP_INFO.curation}</p>
              <div className="pt-2 flex items-center gap-4 text-[10px] text-[#8E1717] uppercase tracking-widest font-bold">
                <span>BY THE RARE. FOR THE RARE.</span>
                <span>•</span>
                <span>{DROP_INFO.season}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lookbook Hero Visual (Full-bleed) */}
        <div 
          data-cursor="view"
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#111111] overflow-hidden border border-[#1a1a1a] shadow-2xl"
        >
          <img 
            src={campaignShoot03} 
            alt="Drop 01 Racing Division Campaign Lookbook" 
            className="w-full h-full object-cover object-center filter contrast-[1.08]"
          />
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 bg-black/85 backdrop-blur-sm p-4 sm:p-6 border border-white/10 max-w-md">
            <span className="font-mono text-[9px] text-[#8E1717] tracking-widest block mb-1">
              LOOKBOOK // 35MM SPEEDWAY ARCHIVE
            </span>
            <p className="font-editorial text-sm sm:text-base text-[#EDE7DC]">
              "Translating racing-inspired graphics, technical typography, driver numbers, track details, and bold jersey construction into everyday streetwear."
            </p>
          </div>
        </div>

        {/* Drop Pieces Breakdown (Curated Lookbook Grid of 4 Tees) */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-[#181818] pb-4">
            <span className="font-mono text-xs text-[#8E1717] tracking-[0.25em] uppercase">
              [ 04 PIECES // RACING CAPSULE ]
            </span>
            <button 
              onClick={() => navigateTo('shop')}
              className="font-mono text-xs text-[#8E8D8A] hover:text-[#EDE7DC] tracking-widest uppercase transition-colors"
            >
              SHOP ALL →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {catalog.map((piece, index) => (
              <div 
                key={piece.id}
                data-cursor="open"
                onClick={() => navigateTo('product', piece.id)}
                className="group cursor-pointer flex flex-col space-y-3"
              >
                <div className="relative aspect-[4/5] bg-[#111111] overflow-hidden border border-[#1a1a1a]">
                  <img 
                    src={piece.images[0]} 
                    alt={piece.name} 
                    className="w-full h-full object-cover filter contrast-[1.05] group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 font-mono text-[9px] text-[#EDE7DC] bg-black/80 px-2 py-0.5">
                    PIECE 0{index + 1} // {piece.sku}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-[#EDE7DC] text-black px-3 py-1.5 text-xs font-mono font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                    VIEW PIECE →
                  </div>
                </div>

                <div className="flex items-baseline justify-between border-t border-[#181818] pt-2 font-mono">
                  <div>
                    <h3 className="font-editorial text-xl sm:text-2xl text-[#EDE7DC] uppercase group-hover:text-[#8E1717] transition-colors">
                      {piece.name}
                    </h3>
                    <span className="text-[11px] text-[#8E8D8A] uppercase tracking-wider block">
                      {piece.subtitle}
                    </span>
                  </div>
                  <span className="text-[#EDE7DC] text-sm">
                    {piece.formattedPrice}
                  </span>
                </div>

                <p className="font-mono text-xs text-[#8E8D8A] line-clamp-2">
                  {piece.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Editorial Lookbook Multi-Photo Spread */}
        <div className="border-t border-[#181818] pt-16 space-y-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#8E1717] tracking-[0.25em] uppercase">
              SPEEDWAY EDITORIAL FRAMES
            </span>
            <span className="font-mono text-[10px] text-[#8E8D8A] uppercase tracking-wider">
              SHOT ON LOCATION // MUMBAI // DELHI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div data-cursor="view" className="relative aspect-[3/4] bg-[#111111] overflow-hidden border border-[#1a1a1a] group">
              <img 
                src={campaignShoot01} 
                alt="Editorial Frame 01 - LZR Velo 07" 
                className="w-full h-full object-cover filter contrast-[1.08] group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute bottom-2 left-2 font-mono text-[8px] text-[#8E1717] bg-black/80 px-1.5 py-0.5 tracking-widest">
                FRAME 01 // VELO 07
              </div>
            </div>
            <div data-cursor="view" className="relative aspect-[3/4] bg-[#111111] overflow-hidden border border-[#1a1a1a] group">
              <img 
                src={campaignShoot05} 
                alt="Editorial Frame 02 - Racing Division" 
                className="w-full h-full object-cover filter contrast-[1.08] group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute bottom-2 left-2 font-mono text-[8px] text-[#8E1717] bg-black/80 px-1.5 py-0.5 tracking-widest">
                FRAME 02 // BURGUNDY
              </div>
            </div>
            <div data-cursor="view" className="relative aspect-[3/4] bg-[#111111] overflow-hidden border border-[#1a1a1a] group">
              <img 
                src={campaignShoot04} 
                alt="Editorial Frame 03 - Apex 88 & 07" 
                className="w-full h-full object-cover filter contrast-[1.08] group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute bottom-2 left-2 font-mono text-[8px] text-[#8E1717] bg-black/80 px-1.5 py-0.5 tracking-widest">
                FRAME 03 // APEX 88
              </div>
            </div>
            <div data-cursor="view" className="relative aspect-[3/4] bg-[#111111] overflow-hidden border border-[#1a1a1a] group">
              <img 
                src={campaignShoot02} 
                alt="Editorial Frame 04 - Night Speedway" 
                className="w-full h-full object-cover filter contrast-[1.08] group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute bottom-2 left-2 font-mono text-[8px] text-[#8E1717] bg-black/80 px-1.5 py-0.5 tracking-widest">
                FRAME 04 // NIGHT SPEEDWAY
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
