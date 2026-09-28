import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { ArrowRight, SlidersHorizontal, Sparkles } from 'lucide-react';

export const ShopPage = () => {
  const { navigateTo, products } = useShop();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('FEATURED');
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const filters = ['ALL', 'TEES', 'HOODIES', 'WAFFLE', 'OVERSIZED'];

  const catalog = products && products.length > 0 ? products : STATIC_PRODUCTS;

  const filteredProducts = catalog
    .filter(product => product.isActive !== false)
    .filter(product => {
      if (selectedFilter === 'ALL') return true;
      if (selectedFilter === 'TEES') return product.category === 'tees';
      if (selectedFilter === 'HOODIES') return product.category === 'hoodies';
      if (selectedFilter === 'WAFFLE') return product.category === 'waffle';
      if (selectedFilter === 'OVERSIZED') return product.tags?.includes('oversized');
      return true;
    })
    .sort((a, b) => {
      if (selectedSort === 'FEATURED') {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      if (selectedSort === 'PRICE LOW → HIGH') return a.price - b.price;
      if (selectedSort === 'PRICE HIGH → LOW') return b.price - a.price;
      if (selectedSort === 'NEWEST') return b.id.localeCompare(a.id);
      return 0;
    });

  return (
    <div className="w-full min-h-screen bg-[#080808] pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1760px] mx-auto">
        
        {/* Header: SHOP & LATEST LOOZARS PIECES */}
        <div className="border-b border-[#181818] pb-6 sm:pb-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl text-[#EDE7DC] font-normal uppercase leading-none tracking-tight">
              SHOP
            </h1>
            
            <p className="font-mono text-xs sm:text-sm text-[#8E8D8A] uppercase tracking-[0.2em]">
              LATEST LOOZARS PIECES.
            </p>
          </div>
        </div>

        {/* Filters & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#181818] pb-4 mb-8 text-xs font-mono">
          
          {/* Product filters: ALL, TEES, HOODIES, WAFFLE, OVERSIZED */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-4">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 uppercase tracking-[0.2em] transition-colors ${
                  selectedFilter === filter
                    ? 'bg-[#EDE7DC] text-[#080808] font-bold'
                    : 'text-[#8E8D8A] hover:text-[#EDE7DC] bg-[#111111]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Right: SORT BY */}
          <div className="flex items-center gap-2 text-[#8E8D8A]">
            <SlidersHorizontal size={13} className="text-[#8E1717]" />
            <span className="text-[10px] tracking-widest uppercase">SORT BY:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-[#111111] border border-[#222222] text-[#EDE7DC] px-3 py-1 text-xs font-mono uppercase focus:outline-none focus:border-[#8E1717] cursor-pointer"
            >
              <option value="FEATURED">FEATURED</option>
              <option value="NEWEST">NEWEST</option>
              <option value="PRICE LOW → HIGH">PRICE LOW → HIGH</option>
              <option value="PRICE HIGH → LOW">PRICE HIGH → LOW</option>
            </select>
          </div>

        </div>

        {/* Minimal Editorial Product Grid: 3-4 columns desktop, 2 columns mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {filteredProducts.map((product) => {
            const hasAltImage = product.images && product.images.length > 1;
            const isHovered = hoveredProduct === product.id;
            const displayImage = isHovered && hasAltImage ? product.images[1] : product.images[0];

            return (
              <div 
                key={product.id}
                data-cursor="open"
                className="group cursor-pointer flex flex-col space-y-2.5"
                onClick={() => navigateTo('product', product.id)}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                {/* Product Image with Alternate Hover & Subtle Zoom */}
                <div className="relative aspect-[3/4] bg-[#111111] overflow-hidden border border-[#1a1a1a]">
                  <img 
                    src={displayImage} 
                    alt={product.name}
                    className="w-full h-full object-cover object-center filter contrast-[1.05] brightness-[0.93] group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  
                  {/* Subtle Top Left Stamp */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <div className="font-mono text-[8px] sm:text-[9px] text-[#8E8D8A] bg-black/80 px-1.5 py-0.5 tracking-wider">
                      {product.sku}
                    </div>
                    {product.isFeatured && (
                      <div className="font-mono text-[8px] text-[#A3E635] bg-black/80 px-1.5 py-0.5 tracking-wider border border-[#A3E635]/30">
                        FEATURED
                      </div>
                    )}
                  </div>

                  {/* Sale / Out of Stock Badges */}
                  <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
                    {product.isOutOfStock ? (
                      <span className="font-mono text-[9px] text-[#FF8888] bg-black/90 px-2 py-0.5 uppercase tracking-wider font-bold border border-rose-500/30">
                        SOLD OUT
                      </span>
                    ) : product.isSale ? (
                      <span className="font-mono text-[9px] text-white bg-[#8E1717] px-2 py-0.5 uppercase tracking-wider font-bold">
                        SALE
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Minimal Card Details: Product Name, Price, Small Arrow */}
                <div className="pt-1 flex items-baseline justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-editorial text-sm sm:text-base text-[#EDE7DC] group-hover:text-[#8E1717] transition-colors uppercase truncate max-w-[140px] sm:max-w-[200px]">
                      {product.name}
                    </h3>
                    <div className="font-mono text-xs text-[#8E8D8A] flex items-center gap-1.5">
                      <span className="text-[#EDE7DC] font-medium">{product.formattedPrice}</span>
                      {product.isSale && (
                        <span className="text-[#666666] line-through text-[11px]">
                          {product.formattedBasePrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight 
                    size={14} 
                    className="text-[#8E1717] group-hover:translate-x-1 transition-transform shrink-0" 
                  />
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
