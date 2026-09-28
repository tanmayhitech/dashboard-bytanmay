import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { ArrowRight, ChevronDown } from 'lucide-react';

// Real Photoshoot & Campaign Assets
import heroGirlImg from '../assets/images/hero-girl.jpg';
import apex02 from '../assets/photoshoot/03-lzr-apex-club-offwhite/apex-02.jpeg';
import campaignShoot02 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot05 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import campaignCarBack from '../assets/photoshoot/05-campaign-editorial/Screenshot_20260727_013045.jpg.jpeg';
import campaignGlasses from '../assets/photoshoot/05-campaign-editorial/Screenshot_20260727_013151.jpg.jpeg';

export const ShopPage = () => {
  const { navigateTo, products } = useShop();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('FEATURED');
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const filters = ['ALL', 'TEES', 'HOODIES', 'OVERSIZED', 'RACING DIVISION'];

  const catalog = products && products.length > 0 ? products : STATIC_PRODUCTS;

  // Filter logic
  const filteredProducts = catalog
    .filter(product => product.isActive !== false)
    .filter(product => {
      if (selectedFilter === 'ALL') return true;
      if (selectedFilter === 'TEES') return product.category === 'tees';
      if (selectedFilter === 'HOODIES') return product.category === 'hoodies';
      if (selectedFilter === 'OVERSIZED') return product.tags?.includes('oversized');
      if (selectedFilter === 'RACING DIVISION') return product.tags?.includes('racing') || product.drop?.includes('RACING');
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

  // Secondary editorial campaign stills (matches 05-08 in reference design)
  const secondaryEditorialStills = [
    {
      id: 'archive-still-05',
      num: '05',
      image: campaignShoot02,
      name: 'LZR RACING CAP & HOODIE',
      price: 'ARCHIVE ARCHIVAL',
      targetId: 'lzr-velo-07'
    },
    {
      id: 'archive-still-06',
      num: '06',
      image: campaignShoot05,
      name: 'LZR APEX OVERSIZED TEE',
      price: '₹899',
      targetId: 'lzr-apex-club'
    },
    {
      id: 'archive-still-07',
      num: '07',
      image: campaignCarBack,
      name: 'LZR SPEEDWAY HOODIE BACK',
      price: 'DROP 01 ARCHIVE',
      targetId: 'lzr-ocean-speedway'
    },
    {
      id: 'archive-still-08',
      num: '08',
      image: campaignGlasses,
      name: 'LZR MOTORSPORT BURGUNDY',
      price: '₹899',
      targetId: 'lzr-racing-division'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F1EEE6] text-[#0A0A0A] pt-16 sm:pt-20 pb-24 select-none">
      
      {/* ========================================================================= */}
      {/* 1. CINEMATIC EDITORIAL HERO (Matches Reference Exactly)                   */}
      {/* ========================================================================= */}
      <section className="relative w-full border-b border-[#0A0A0A]/15 overflow-hidden bg-[#F1EEE6] min-h-[300px] sm:min-h-[340px] lg:min-h-[360px] flex items-center">
        
        {/* Full-Height Background Cinematic Image with Seamless Edge Feathering */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden flex items-center justify-center">
          <img 
            src={heroGirlImg} 
            alt="Loozars 07 Jersey Archive" 
            className="w-full h-full object-cover object-[center_32%] filter contrast-[1.08] brightness-[0.97]"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, transparent 18%, rgba(0,0,0,0.1) 25%, rgba(0,0,0,0.7) 38%, black 50%, black 65%, rgba(0,0,0,0.6) 78%, transparent 92%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 18%, rgba(0,0,0,0.1) 25%, rgba(0,0,0,0.7) 38%, black 50%, black 65%, rgba(0,0,0,0.6) 78%, transparent 92%)'
            }}
          />
        </div>

        {/* Hero Content Container */}
        <div className="max-w-[1760px] w-full mx-auto px-5 sm:px-10 lg:px-14 py-8 sm:py-10 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            {/* Left Hero Content: 01, ARCHIVE, Subtitle, Allocation */}
            <div className="space-y-3 sm:space-y-4 max-w-xl">
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#0A0A0A]/60 tracking-[0.22em]">
                <span>01</span>
                <span className="w-8 h-[1px] bg-[#0A0A0A]/35 inline-block"></span>
              </div>

              <h1 className="font-editorial text-5xl sm:text-7xl lg:text-[5.75rem] font-bold text-[#0A0A0A] uppercase tracking-tight leading-[0.88]">
                ARCHIVE
              </h1>

              <p className="font-mono text-[11px] sm:text-xs text-[#0A0A0A]/75 uppercase tracking-[0.2em] pt-1">
                CURATED HEAVYWEIGHT SILHOUETTES.
              </p>

              <div className="font-mono text-[11px] text-[#8E1717] font-bold tracking-[0.2em]">
                [ ALLOCATION {filteredProducts.length} PIECES ]
              </div>
            </div>

            {/* Right Hero Content: Red Signature, Vertical Categories, Inset Thumbnail */}
            <div className="flex items-center justify-between lg:justify-end gap-6 sm:gap-10 pt-2 lg:pt-0">
              
              {/* Vertical Category Labels & Red Signature */}
              <div className="space-y-3 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#0A0A0A]/80">
                {/* Red Handwritten Tag Accent */}
                <div className="font-handwriting text-2xl sm:text-3xl text-[#8E1717] font-bold -rotate-6 select-none leading-none">
                  Loozars
                </div>

                <div className="space-y-1">
                  <div className="hover:text-[#0A0A0A] transition-colors cursor-pointer" onClick={() => setSelectedFilter('TEES')}>TEES</div>
                  <div className="hover:text-[#0A0A0A] transition-colors cursor-pointer" onClick={() => setSelectedFilter('HOODIES')}>HOODIES</div>
                  <div className="hover:text-[#0A0A0A] transition-colors cursor-pointer" onClick={() => setSelectedFilter('OVERSIZED')}>OVERSIZED</div>
                  <div className="flex items-center gap-1 font-bold text-[#0A0A0A] cursor-pointer" onClick={() => setSelectedFilter('ALL')}>
                    <span>ALL</span>
                    <span className="w-3 h-[1px] bg-[#0A0A0A]/60 inline-block"></span>
                  </div>
                </div>
              </div>

              {/* Inset Photo & Micro Editorial Quote */}
              <div className="flex flex-col items-start space-y-2">
                <div className="w-20 sm:w-24 aspect-[4/5] bg-[#E8E4DA] overflow-hidden border border-[#0A0A0A]/15 shadow-sm">
                  <img 
                    src={apex02} 
                    alt="Loozars Apex Club Inset" 
                    className="w-full h-full object-cover filter contrast-[1.05]"
                  />
                </div>
                <div className="font-mono text-[9px] sm:text-[10px] text-[#0A0A0A]/60 uppercase tracking-[0.16em] leading-tight">
                  <p>SAME PEOPLE.</p>
                  <p>DIFFERENT NIGHTS.</p>
                  <span className="w-4 h-[1px] bg-[#0A0A0A]/30 inline-block mt-1"></span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. EDITORIAL FILTER BAR & SORTING (Warm Ivory Canvas)                     */}
      {/* ========================================================================= */}
      <div className="max-w-[1760px] mx-auto px-5 sm:px-10 lg:px-14 pt-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#0A0A0A]/10 pb-4 font-mono text-xs">
          
          {/* Rectangular Editorial Filter Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
            {filters.map(filter => {
              const isSelected = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3.5 sm:px-4 py-1.5 uppercase text-[10px] sm:text-[11px] font-mono tracking-[0.2em] transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#0A0A0A] text-[#F1EEE6] font-bold shadow-sm'
                      : 'text-[#0A0A0A]/70 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Compact Sort Selector */}
          <div className="flex items-center gap-2 text-[#0A0A0A]/80 self-end sm:self-auto shrink-0">
            <span className="text-[#8E1717] font-bold text-xs tracking-tighter">::</span>
            <span className="text-[10px] font-mono tracking-widest uppercase">SORT:</span>
            <div className="relative">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="appearance-none bg-transparent border border-[#0A0A0A]/20 hover:border-[#0A0A0A]/60 text-[#0A0A0A] pl-3 pr-7 py-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider focus:outline-none cursor-pointer rounded-none"
              >
                <option value="FEATURED">FEATURED</option>
                <option value="NEWEST">NEWEST</option>
                <option value="PRICE LOW → HIGH">PRICE LOW → HIGH</option>
                <option value="PRICE HIGH → LOW">PRICE HIGH → LOW</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#0A0A0A]/60" />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PRIMARY PRODUCT GRID (4 Columns Desktop / 2 Columns Mobile)            */}
      {/* ========================================================================= */}
      <div className="max-w-[1760px] mx-auto px-5 sm:px-10 lg:px-14 pt-4">
        
        {filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="py-24 text-center space-y-4 font-mono">
            <div className="text-xs text-[#0A0A0A]/50 tracking-[0.25em] uppercase">00 // ARCHIVE STATUS</div>
            <h3 className="font-editorial text-3xl sm:text-4xl text-[#0A0A0A] uppercase font-bold">NOTHING HERE YET.</h3>
            <p className="text-xs text-[#0A0A0A]/70 uppercase tracking-widest">No pieces found matching the current filter selection.</p>
            <button
              onClick={() => setSelectedFilter('ALL')}
              className="mt-4 px-6 py-2.5 bg-[#0A0A0A] hover:bg-[#8E1717] text-[#F1EEE6] text-xs font-mono font-bold uppercase tracking-widest transition-colors"
            >
              [ RESET FILTERS ]
            </button>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            
            {/* ROW 1: First 4 Products (Direct on warm ivory canvas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-12">
              {filteredProducts.slice(0, 4).map((product, idx) => {
                const hasAltImage = product.images && product.images.length > 1;
                const isHovered = hoveredProduct === product.id;
                const displayImage = isHovered && hasAltImage ? product.images[1] : product.images[0];

                return (
                  <div 
                    key={product.id}
                    onClick={() => navigateTo('product', product.id)}
                    onMouseEnter={() => setHoveredProduct(product.id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                    className="group cursor-pointer flex flex-col"
                  >
                    {/* Visual Garment Frame */}
                    <div className="relative aspect-[4/5] bg-[#E8E4DA] overflow-hidden">
                      <img 
                        src={displayImage} 
                        alt={product.name}
                        loading={idx > 2 ? 'lazy' : 'eager'}
                        className="w-full h-full object-cover filter contrast-[1.05] brightness-95 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      />

                      {/* Micro Technical Index in Top-Left (Matches Reference) */}
                      <div className="absolute top-3 left-3 font-mono text-[10px] text-[#F1EEE6] tracking-[0.2em] flex items-center gap-1.5 z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                        <span>0{idx + 1}</span>
                        <span className="w-4 h-[1px] bg-white/70 inline-block"></span>
                      </div>

                      {/* Stock / Status Badge */}
                      {product.isOutOfStock && (
                        <div className="absolute bottom-3 right-3 font-mono text-[9px] text-white bg-[#8E1717] px-2 py-0.5 uppercase tracking-widest font-bold">
                          SOLD OUT
                        </div>
                      )}
                    </div>

                    {/* Metadata Under Image: Name + Price (Left), Circle Arrow (Right) */}
                    <div className="pt-3.5 flex items-start justify-between gap-3 font-mono text-xs">
                      <div className="space-y-0.5">
                        <h3 className="font-mono text-[11px] sm:text-[12px] font-bold text-[#0A0A0A] group-hover:text-[#8E1717] transition-colors uppercase tracking-[0.14em]">
                          {product.name}
                        </h3>
                        <p className="text-[11px] sm:text-[12px] text-[#555] tracking-wider">
                          {product.formattedPrice || `₹${product.price}`}
                        </p>
                      </div>

                      {/* Circular Arrow Button (Matches Reference) */}
                      <div className="w-7 h-7 rounded-full border border-[#0A0A0A]/25 flex items-center justify-center text-[#0A0A0A] group-hover:bg-[#0A0A0A] group-hover:text-[#F1EEE6] group-hover:border-[#0A0A0A] transition-all duration-300 shrink-0">
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* ===================================================================== */}
            {/* 4. EDITORIAL CAMPAIGN STRIP INTERRUPTION (Kinetic Moving Ticker)       */}
            {/* ===================================================================== */}
            <div className="w-full bg-[#0A0A0A] text-[#F1EEE6] py-3.5 sm:py-4 overflow-hidden border-t border-b border-[#222222] font-mono text-[10px] sm:text-[11px] tracking-[0.25em] uppercase marquee-container select-none">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
                  <span className="font-bold text-white">DROP 01 // RACING DIVISION</span>
                  <span className="text-[#8E8D8A]">· 320 GSM COMBED HEAVYWEIGHT COTTON</span>
                </span>
                <span className="text-[#8E8D8A]">KANPUR // UTTAR PRADESH // SPEEDWAY ARCHIVE</span>
                <span className="text-[#8E1717] font-bold">LIMITED ALLOCATION</span>
                <span className="text-white/40">·</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
                  <span className="font-bold text-white">BY THE RARE. FOR THE RARE.</span>
                </span>
                <span className="text-[#8E8D8A]">ENGINEERED FOR RAW MOTION</span>
                <span className="text-white/40">·</span>
                {/* Duplicate for seamless infinite loop */}
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
                  <span className="font-bold text-white">DROP 01 // RACING DIVISION</span>
                  <span className="text-[#8E8D8A]">· 320 GSM COMBED HEAVYWEIGHT COTTON</span>
                </span>
                <span className="text-[#8E8D8A]">KANPUR // UTTAR PRADESH // SPEEDWAY ARCHIVE</span>
                <span className="text-[#8E1717] font-bold">LIMITED ALLOCATION</span>
                <span className="text-white/40">·</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
                  <span className="font-bold text-white">BY THE RARE. FOR THE RARE.</span>
                </span>
                <span className="text-[#8E8D8A]">ENGINEERED FOR RAW MOTION</span>
                <span className="text-white/40">·</span>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* 5. ROW 2: Remaining Catalog Products or Archive Editorial Stills     */}
            {/* ===================================================================== */}
            {filteredProducts.length > 4 ? (
              /* If more dynamic products exist */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-12">
                {filteredProducts.slice(4).map((product, idx) => {
                  const hasAltImage = product.images && product.images.length > 1;
                  const isHovered = hoveredProduct === product.id;
                  const displayImage = isHovered && hasAltImage ? product.images[1] : product.images[0];

                  return (
                    <div 
                      key={product.id}
                      onClick={() => navigateTo('product', product.id)}
                      onMouseEnter={() => setHoveredProduct(product.id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-[4/5] bg-[#E8E4DA] overflow-hidden">
                        <img 
                          src={displayImage} 
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover filter contrast-[1.05] brightness-95 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                        />

                        <div className="absolute top-3 left-3 font-mono text-[10px] text-[#F1EEE6] tracking-[0.2em] flex items-center gap-1.5 z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                          <span>0{idx + 5}</span>
                          <span className="w-4 h-[1px] bg-white/70 inline-block"></span>
                        </div>
                      </div>

                      <div className="pt-3.5 flex items-start justify-between gap-3 font-mono text-xs">
                        <div className="space-y-0.5">
                          <h3 className="font-mono text-[11px] sm:text-[12px] font-bold text-[#0A0A0A] group-hover:text-[#8E1717] transition-colors uppercase tracking-[0.14em]">
                            {product.name}
                          </h3>
                          <p className="text-[11px] sm:text-[12px] text-[#555] tracking-wider">
                            {product.formattedPrice || `₹${product.price}`}
                          </p>
                        </div>

                        <div className="w-7 h-7 rounded-full border border-[#0A0A0A]/25 flex items-center justify-center text-[#0A0A0A] group-hover:bg-[#0A0A0A] group-hover:text-[#F1EEE6] group-hover:border-[#0A0A0A] transition-all duration-300 shrink-0">
                          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* If 4 main pieces exist in Drop 01, render Row 2 Archive Stills (05-08) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-12">
                {secondaryEditorialStills.map((still) => (
                  <div 
                    key={still.id}
                    onClick={() => navigateTo('product', still.targetId)}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-[4/5] bg-[#E8E4DA] overflow-hidden">
                      <img 
                        src={still.image} 
                        alt={still.name}
                        loading="lazy"
                        className="w-full h-full object-cover filter contrast-[1.05] brightness-95 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      />

                      {/* Micro Technical Index (05, 06, 07, 08) */}
                      <div className="absolute top-3 left-3 font-mono text-[10px] text-[#F1EEE6] tracking-[0.2em] flex items-center gap-1.5 z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                        <span>{still.num}</span>
                        <span className="w-4 h-[1px] bg-white/70 inline-block"></span>
                      </div>
                    </div>

                    {/* Metadata Under Image */}
                    <div className="pt-3.5 flex items-start justify-between gap-3 font-mono text-xs">
                      <div className="space-y-0.5">
                        <h3 className="font-mono text-[11px] sm:text-[12px] font-bold text-[#0A0A0A] group-hover:text-[#8E1717] transition-colors uppercase tracking-[0.14em]">
                          {still.name}
                        </h3>
                        <p className="text-[11px] sm:text-[12px] text-[#555] tracking-wider">
                          {still.price}
                        </p>
                      </div>

                      <div className="w-7 h-7 rounded-full border border-[#0A0A0A]/25 flex items-center justify-center text-[#0A0A0A] group-hover:bg-[#0A0A0A] group-hover:text-[#F1EEE6] group-hover:border-[#0A0A0A] transition-all duration-300 shrink-0">
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
