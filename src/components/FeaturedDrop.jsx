import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export const FeaturedDrop = () => {
  const { navigateTo, products } = useShop();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeThumbIndex, setActiveThumbIndex] = useState(0);

  const catalog = (products && products.length > 0 ? products : STATIC_PRODUCTS)
    .filter(p => p.isActive !== false);

  const safeIndex = currentIndex >= catalog.length ? 0 : currentIndex;
  const product = catalog[safeIndex] || catalog[0];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? catalog.length - 1 : prev - 1));
    setActiveThumbIndex(0);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === catalog.length - 1 ? 0 : prev + 1));
    setActiveThumbIndex(0);
  };

  if (!product) return null;

  return (
    <section className="relative w-full bg-[#080808] py-16 sm:py-24 px-4 sm:px-8 lg:px-12 border-t border-[#141414]">
      <div className="max-w-[1720px] mx-auto">
        
        {/* Main 3-Column Editorial Grid with Outer Navigation Arrows */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Outer Left Navigation Button (Desktop) */}
          <button
            onClick={handlePrev}
            className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-[#222222] bg-[#0c0c0c]/90 backdrop-blur-sm flex items-center justify-center text-[#8E8D8A] hover:text-[#EDE7DC] hover:border-[#8E1717] transition-colors hidden sm:flex"
            aria-label="Previous piece"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Left Column: Index & Product Headline & CTA (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:pl-6">
            
            {/* Section Index */}
            <div className="flex items-center gap-2 font-mono text-xs text-[#8E8D8A] tracking-[0.25em]">
              <span className="text-[#8E1717] font-bold">0{safeIndex + 1} / 0{catalog.length}</span>
              <span>•</span>
              <span className="uppercase text-[10px]">{product.badge}</span>
              {product.isFeatured && (
                <>
                  <span>•</span>
                  <span className="text-[#A3E635] text-[10px] uppercase">FEATURED</span>
                </>
              )}
            </div>

            {/* Product Title in Editorial Serif */}
            <div className="space-y-1">
              <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-normal uppercase leading-[1.02] tracking-tight">
                {product.name}
              </h2>
              {product.subtitle && (
                <span className="font-mono text-xs sm:text-sm text-[#8E1717] uppercase tracking-widest block pt-1">
                  {product.subtitle}
                </span>
              )}
            </div>

            {/* Price & Sale */}
            <div className="font-mono text-xl sm:text-2xl text-[#EDE7DC] font-light flex items-baseline gap-3">
              <span>{product.formattedPrice}</span>
              {product.isSale && (
                <span className="text-[#666666] line-through text-base">
                  {product.formattedBasePrice}
                </span>
              )}
            </div>

            {/* Short Product Info */}
            <p className="font-mono text-xs text-[#8E8D8A] leading-relaxed max-w-sm">
              {product.description}
            </p>

            {/* CTA */}
            <div className="pt-2">
              <button
                onClick={() => navigateTo('product', product.id)}
                className="group inline-flex items-center gap-2.5 font-mono text-xs text-[#EDE7DC] hover:text-[#8E1717] tracking-[0.25em] uppercase border-b border-[#EDE7DC]/40 pb-1 hover:border-[#8E1717] transition-colors"
              >
                <span>VIEW PRODUCT</span>
                <ArrowRight size={13} className="text-[#8E1717] group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>

            {/* Mobile Prev/Next */}
            <div className="flex sm:hidden items-center gap-3 pt-2">
              <button onClick={handlePrev} className="p-2 border border-[#222222] text-[#8E8D8A] hover:text-white">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNext} className="p-2 border border-[#222222] text-[#8E8D8A] hover:text-white">
                <ChevronRight size={16} />
              </button>
            </div>

          </div>

          {/* Center Column: Big Flatlay Tee (6 cols) */}
          <div className="lg:col-span-6 flex justify-center">
            <div 
              onClick={() => navigateTo('product', product.id)}
              data-cursor="open"
              className="relative w-full max-w-xl aspect-[4/3] sm:aspect-[4/3] overflow-hidden bg-[#0c0c0c] border border-[#1a1a1a] cursor-pointer group flex items-center justify-center p-4 shadow-xl"
            >
              <img 
                src={product.images[activeThumbIndex] || product.images[0]} 
                alt={product.name}
                className="w-full h-full object-contain filter contrast-[1.05] group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>
          </div>

          {/* Right Column: 3 Stacked Detail Crops (2 cols) */}
          <div className="lg:col-span-2 flex flex-row lg:flex-col justify-center gap-3 lg:gap-4">
            {product.detailThumbnails && product.detailThumbnails.length > 0 ? (
              product.detailThumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumbIndex(idx)}
                  data-cursor="view"
                  className={`relative aspect-square w-24 sm:w-28 lg:w-full overflow-hidden bg-[#121212] border transition-all ${
                    activeThumbIndex === idx
                      ? 'border-[#8E1717] ring-1 ring-[#8E1717]'
                      : 'border-[#222222] opacity-70 hover:opacity-100 hover:border-[#444444]'
                  }`}
                >
                  <img 
                    src={thumb.img} 
                    alt={thumb.label} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))
            ) : (
              product.images.slice(0, 3).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumbIndex(idx)}
                  data-cursor="view"
                  className={`relative aspect-square w-24 sm:w-28 lg:w-full overflow-hidden bg-[#121212] border transition-all ${
                    activeThumbIndex === idx
                      ? 'border-[#8E1717] ring-1 ring-[#8E1717]'
                      : 'border-[#222222] opacity-70 hover:opacity-100 hover:border-[#444444]'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} preview ${idx + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))
            )}
          </div>

          {/* Outer Right Navigation Button (Desktop) */}
          <button
            onClick={handleNext}
            className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-[#222222] bg-[#0c0c0c]/90 backdrop-blur-sm flex items-center justify-center text-[#8E8D8A] hover:text-[#EDE7DC] hover:border-[#8E1717] transition-colors hidden sm:flex"
            aria-label="Next piece"
          >
            <ChevronRight size={18} />
          </button>

        </div>

      </div>
    </section>
  );
};
