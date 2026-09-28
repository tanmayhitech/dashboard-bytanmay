import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../../data/products';
import velo01 from '../../assets/photoshoot/01-lzr-velo-07-black/velo-01.jpeg';
import burgundy01 from '../../assets/photoshoot/02-lzr-racing-division-burgundy/burgundy-01.jpeg';
import apex02 from '../../assets/photoshoot/03-lzr-apex-club-offwhite/apex-02.jpeg';
import navy01 from '../../assets/photoshoot/04-lzr-ocean-speedway-navy/navy-01.jpeg';
import { ArrowRight } from 'lucide-react';

export const EditorialTheDrop = () => {
  const { navigateTo, products } = useShop();
  const [hoveredId, setHoveredId] = useState(null);

  const catalog = (products && products.length > 0 ? products : STATIC_PRODUCTS)
    .filter(p => p.isActive !== false);

  // Exact 4 editorial items mapping to reference screenshot
  const dropItems = [
    {
      id: catalog[0]?.id || 'lzr-velo-07',
      num: '01',
      name: 'LZR VELO 07 TEE',
      price: catalog[0]?.formattedPrice || '₹899',
      image: velo01,
      altImage: catalog[0]?.images?.[1] || velo01,
      aspect: 'aspect-[3/4]',
    },
    {
      id: catalog[1]?.id || 'lzr-racing-division',
      num: '02',
      name: 'LZR APEX CLUB TEE',
      price: catalog[1]?.formattedPrice || '₹899',
      image: burgundy01,
      altImage: catalog[1]?.images?.[1] || burgundy01,
      aspect: 'aspect-[3/4]',
    },
    {
      id: catalog[2]?.id || 'lzr-apex-club',
      num: '03',
      name: 'LZR RACING DIVISION TEE',
      price: catalog[2]?.formattedPrice || '₹899',
      image: apex02,
      altImage: catalog[2]?.images?.[0] || apex02,
      aspect: 'aspect-[4/3] sm:aspect-[3/4]',
      showTopNum: true
    },
    {
      id: catalog[3]?.id || 'lzr-ocean-speedway',
      num: '04',
      name: 'LZR OCEAN SPEEDWAY TEE',
      price: catalog[3]?.formattedPrice || '₹899',
      image: navy01,
      altImage: catalog[3]?.images?.[1] || navy01,
      aspect: 'aspect-[3/4]',
    }
  ];

  return (
    <section id="drop-01" className="relative w-full bg-[#F3F0E8] text-[#080808] py-20 sm:py-28 px-5 sm:px-10 lg:px-14 select-none">
      <div className="max-w-[1760px] mx-auto space-y-12 sm:space-y-16">
        
        {/* Section 02 Header: Dual Aligned Editorial Typography */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[#080808]/10">
          
          {/* Left: Drop 01 Title & Subheader */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#080808]/70 tracking-[0.25em]">
              <span>02</span>
              <span className="w-8 h-[1px] bg-[#080808]/30 inline-block"></span>
            </div>
            
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#080808] uppercase leading-[0.95]">
              DROP 01
            </h2>

            <div className="flex items-center gap-4 pt-1 font-mono text-xs tracking-[0.22em] text-[#080808]/80 uppercase">
              <span className="font-semibold">RACING DIVISION.</span>
              <span>•</span>
              <button
                onClick={() => navigateTo('shop')}
                className="hover:text-[#8E1717] transition-colors flex items-center gap-1 font-bold"
              >
                <span>[ SHOP ALL → ]</span>
              </button>
            </div>
          </div>

          {/* Right: Minimal Manifesto Statement */}
          <div className="font-mono text-xs sm:text-sm tracking-[0.2em] text-[#080808]/80 text-left md:text-right uppercase leading-relaxed space-y-1">
            <p>FOUR PIECES.<br />A FASTER STATE<br />OF MIND.</p>
            <div className="w-12 h-[1px] bg-[#080808]/40 ml-0 md:ml-auto pt-0.5" />
          </div>

        </div>

        {/* 4-Piece Editorial Layout Grid Matching Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 items-start">
          {dropItems.map((item) => {
            const isHovered = hoveredId === item.id;
            const displayImage = isHovered && item.altImage ? item.altImage : item.image;

            return (
              <div
                key={item.id}
                onClick={() => navigateTo('product', item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group cursor-pointer flex flex-col space-y-3"
              >
                {/* Optional Top Number Badge for Piece 03 */}
                {item.showTopNum && (
                  <div className="font-mono text-[11px] text-[#080808]/60 tracking-widest uppercase pb-1">
                    {item.num}
                  </div>
                )}

                {/* Editorial Photoshoot Frame (No card boxes, sits directly on #F3F0E8 canvas) */}
                <div className={`relative ${item.aspect} w-full overflow-hidden bg-[#e5e1d8] border border-[#080808]/10 group-hover:border-[#080808]/30 transition-all duration-500 shadow-md`}>
                  <img
                    src={displayImage}
                    alt={item.name}
                    className="w-full h-full object-cover filter contrast-[1.08] brightness-95 group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Editorial Typographic Label & Price & Arrow */}
                <div className="pt-2 border-t border-[#080808]/15 flex items-end justify-between font-mono text-xs tracking-wider uppercase text-[#080808]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#080808]/60 font-semibold block">
                      {item.num}
                    </span>
                    <h3 className="font-bold text-xs sm:text-[13px] tracking-widest group-hover:text-[#8E1717] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-[#080808]/80 font-medium">
                      {item.price}
                    </p>
                  </div>

                  {/* Minimal Circular Arrow Action ( → ) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('product', item.id);
                    }}
                    aria-label={`View ${item.name}`}
                    className="w-7 h-7 rounded-full border border-[#080808]/30 group-hover:border-[#080808] flex items-center justify-center transition-all group-hover:bg-[#080808] group-hover:text-[#F3F0E8]"
                  >
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
