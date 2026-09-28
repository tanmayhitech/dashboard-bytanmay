import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../../data/products';
import { ArrowRight, ShoppingBag, Check, Eye } from 'lucide-react';

export const MinimalCatalog = () => {
  const { navigateTo, products, addToCart } = useShop();
  const [hoveredId, setHoveredId] = useState(null);
  const [quickAddedId, setQuickAddedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const catalog = (products && products.length > 0 ? products : STATIC_PRODUCTS)
    .filter(p => p.isActive !== false);

  const filterOptions = [
    { label: 'ALL PIECES', key: 'ALL' },
    { label: 'BLACK', key: 'black' },
    { label: 'BURGUNDY', key: 'burgundy' },
    { label: 'OFF-WHITE', key: 'offwhite' },
    { label: 'NAVY', key: 'navy' }
  ];

  const filteredPieces = catalog.filter(p => {
    if (activeFilter === 'ALL') return true;
    const nameLower = (p.name + ' ' + (p.subtitle || '') + ' ' + (p.slug || '')).toLowerCase();
    return nameLower.includes(activeFilter.toLowerCase());
  });

  const handleQuickAdd = (e, product, size) => {
    e.stopPropagation();
    const variant = product.variants?.find(v => v.size === size) || null;
    addToCart(product, size, 1, variant);
    setQuickAddedId(`${product.id}-${size}`);
    setTimeout(() => setQuickAddedId(null), 1800);
  };

  return (
    <section className="relative w-full bg-[#070707] text-[#EDE7DC] py-20 sm:py-32 px-5 sm:px-10 lg:px-14 border-t border-white/[0.04] select-none">
      <div className="max-w-[1760px] mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Header: Minimal Archival Manifesto */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.06]">
          <div className="space-y-2">
            <span className="font-mono text-[10px] text-[#8E1717] tracking-[0.3em] uppercase block font-bold">
              ● DROP 01 CURATION
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-normal uppercase tracking-tight">
              THE FOUR PIECES
            </h2>
          </div>

          {/* Minimal Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[10px] tracking-widest uppercase">
            {filterOptions.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 transition-all ${
                  activeFilter === f.key
                    ? 'bg-[#EDE7DC] text-[#070707] font-bold'
                    : 'bg-[#121212] text-[#8E8D8A] hover:text-[#EDE7DC] border border-white/[0.06]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Column Clean Floating Garment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {filteredPieces.map((product, idx) => {
            const isHovered = hoveredId === product.id;
            const hasAltImage = product.images && product.images.length > 1;
            const displayImage = isHovered && hasAltImage ? product.images[1] : product.images[0];
            const sizes = product.sizes || ['S', 'M', 'L', 'XL'];

            return (
              <div
                key={product.id}
                onClick={() => navigateTo('product', product.id)}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
                data-cursor="open"
                className="group cursor-pointer flex flex-col space-y-4"
              >
                {/* Floating Garment Visual Frame */}
                <div className="relative aspect-[3/4] bg-[#0d0d0d] overflow-hidden p-6 sm:p-8 flex items-center justify-center border border-white/[0.04] group-hover:border-white/20 transition-all duration-500 shadow-xl">
                  
                  {/* High-Res Garment Image */}
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-contain filter contrast-[1.05] brightness-[0.95] group-hover:scale-105 group-hover:brightness-105 transition-all duration-700 ease-out"
                  />

                  {/* Top Item Index */}
                  <div className="absolute top-3 left-3 font-mono text-[9px] text-[#8E8D8A] tracking-widest uppercase">
                    0{idx + 1} // {product.sku}
                  </div>

                  {/* Hover Front/Back Indicator */}
                  {hasAltImage && (
                    <div className="absolute top-3 right-3 font-mono text-[8px] text-[#8E8D8A] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      {isHovered ? 'BACK ART' : 'FRONT'}
                    </div>
                  )}

                  {/* 1-Click Quick-Add Size Pills Overlay */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-3 left-3 right-3 bg-black/90 backdrop-blur-md p-2 border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-20"
                  >
                    <div className="flex items-center justify-between text-[8px] font-mono text-[#8E8D8A] tracking-widest uppercase">
                      <span>ADD SIZE:</span>
                      <ShoppingBag size={10} className="text-[#8E1717]" />
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {sizes.map((sz) => {
                        const isAdded = quickAddedId === `${product.id}-${sz}`;
                        return (
                          <button
                            key={sz}
                            onClick={(e) => handleQuickAdd(e, product, sz)}
                            className={`py-1 text-[9px] font-mono font-bold tracking-wider transition-all flex items-center justify-center ${
                              isAdded 
                                ? 'bg-[#A3E635] text-black font-black' 
                                : 'bg-[#181818] hover:bg-[#8E1717] text-[#EDE7DC] hover:text-white border border-white/10'
                            }`}
                          >
                            {isAdded ? <Check size={10} /> : sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Minimalist Metadata */}
                <div className="space-y-1 pt-1 font-mono uppercase">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-editorial text-lg sm:text-xl text-[#EDE7DC] font-normal tracking-tight group-hover:text-[#8E1717] transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-xs font-semibold text-[#EDE7DC]">
                      {product.formattedPrice}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#8E8D8A] tracking-wider">
                    {product.subtitle || 'HEAVYWEIGHT OVERSIZED TEE'}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
