import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Plus, 
  Minus, 
  Truck, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Campaign Assets for Dark Breakout Section
import campaignShoot01 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot03 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import campaignCarNight from '../assets/photoshoot/05-campaign-editorial/Screenshot_20260727_013151.jpg.jpeg';

export const ProductPage = () => {
  const { 
    currentProduct, 
    products,
    addToCart, 
    navigateTo 
  } = useShop();

  const catalog = products && products.length > 0 ? products : STATIC_PRODUCTS;
  const product = currentProduct || catalog[0];
  const variants = product?.variants || [];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [openAccordions, setOpenAccordions] = useState({
    details: true,
    fit: false,
    care: false,
    shipping: false
  });
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const buyButtonRef = useRef(null);

  // Sync size on product change
  useEffect(() => {
    setSelectedImageIndex(0);
    const prodVariants = product?.variants || [];
    const firstInStockVariant = prodVariants.find(v => (v.availableStock ?? v.stockQuantity ?? 0) > 0);
    if (firstInStockVariant) {
      setSelectedSize(firstInStockVariant.size);
    } else if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product?.id, product?.db_id]);

  // Mobile sticky buy bar observer
  useEffect(() => {
    const handleScroll = () => {
      if (buyButtonRef.current) {
        const rect = buyButtonRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const selectedVariant = variants.find(v => v.size === selectedSize) || null;
  const availableStock = selectedVariant 
    ? (selectedVariant.availableStock ?? selectedVariant.stockQuantity ?? 0) 
    : (product?.stock?.[selectedSize] ?? 0);
  const isSelectedOutOfStock = availableStock <= 0;

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    const v = variants.find(item => item.size === size);
    const stockForSize = v ? (v.availableStock ?? v.stockQuantity ?? 0) : (product?.stock?.[size] ?? 0);
    if (stockForSize > 0 && quantity > stockForSize) {
      setQuantity(stockForSize);
    }
  };

  const handleAddToCart = () => {
    if (isSelectedOutOfStock) return;
    addToCart(product, selectedSize, quantity, selectedVariant);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2200);
  };

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const nextImage = () => {
    if (!product.images || product.images.length === 0) return;
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    if (!product.images || product.images.length === 0) return;
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  // Previous & Next Product Cycling
  const currentIndex = catalog.findIndex(p => p.id === product.id);
  const prevProduct = catalog[(currentIndex - 1 + catalog.length) % catalog.length];
  const nextProduct = catalog[(currentIndex + 1) % catalog.length];

  // 4 Related Products for Bottom Grid
  const relatedProducts = catalog
    .filter(p => p.id !== product.id && p.isActive !== false)
    .slice(0, 4);

  // Dynamic Detail Frames
  const detailFrames = product.detailThumbnails && product.detailThumbnails.length > 0
    ? product.detailThumbnails
    : (product.images || []).slice(0, 4).map((img, i) => ({
        img,
        label: i === 0 ? '01 / FRONT GRAPHIC' : i === 1 ? '02 / BACK PRINT' : i === 2 ? '03 / SLEEVE DETAIL' : '04 / FABRIC DETAIL'
      }));

  // Campaign background still selection
  const campaignStill = product.id.includes('velo') 
    ? campaignCarNight 
    : product.id.includes('burgundy') || product.id.includes('racing')
    ? campaignShoot05
    : product.id.includes('apex')
    ? campaignShoot04
    : campaignShoot03;

  return (
    <div className="w-full min-h-screen bg-[#F1EEE6] text-[#0A0A0A] select-none overflow-x-hidden pt-16 sm:pt-20">
      
      {/* ========================================================================= */}
      {/* 01. BREADCRUMBS & PREV / NEXT BAR (Warm Ivory Canvas)                     */}
      {/* ========================================================================= */}
      <div className="max-w-[1760px] mx-auto px-5 sm:px-10 lg:px-14 pt-4 sm:pt-6 pb-4">
        <div className="flex items-center justify-between border-b border-[#0A0A0A]/10 pb-3 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#0A0A0A]/60">
          
          {/* Breadcrumb Links */}
          <div className="flex items-center gap-2 truncate">
            <button onClick={() => navigateTo('home')} className="hover:text-[#0A0A0A] transition-colors">Home</button>
            <span>/</span>
            <button onClick={() => navigateTo('shop')} className="hover:text-[#0A0A0A] transition-colors">Shop</button>
            <span>/</span>
            <span className="hidden sm:inline hover:text-[#0A0A0A] transition-colors">{product.category || 'Racing Division'}</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-[#0A0A0A] font-bold truncate">{product.name}</span>
          </div>

          {/* Prev / Next Archive Controls */}
          <div className="flex items-center gap-3 shrink-0 text-[#0A0A0A]/80">
            <button
              onClick={() => navigateTo('product', prevProduct.id)}
              className="hover:text-[#8E1717] transition-colors flex items-center gap-1"
            >
              <span>&lt; PREV</span>
            </button>
            <span className="text-[#0A0A0A]/30">|</span>
            <button
              onClick={() => navigateTo('product', nextProduct.id)}
              className="hover:text-[#8E1717] transition-colors flex items-center gap-1"
            >
              <span>NEXT &gt;</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 02. PRIMARY PRODUCT DOSSIER: ~65% GALLERY / ~35% PURCHASING DOSSIER       */}
      {/* ========================================================================= */}
      <div className="max-w-[1760px] mx-auto px-5 sm:px-10 lg:px-14 pt-4 sm:pt-6 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* --------------------------------------------------------------------- */}
          {/* LEFT: Dominant Editorial Gallery (~65% width / 7 cols)                */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            
            {/* Column 1: Vertical Contact Sheet Thumbnails (Desktop) */}
            <div className="hidden md:flex md:col-span-2 flex-col space-y-2.5">
              {(product.images || []).map((img, idx) => {
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-[3/4] bg-[#E8E4DA] overflow-hidden transition-all duration-200 border ${
                      isSelected
                        ? 'border-[#8E1717] ring-1 ring-[#8E1717]'
                        : 'border-[#0A0A0A]/15 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover filter contrast-[1.05]"
                    />
                  </button>
                );
              })}
            </div>

            {/* Column 2: Large Dominant Primary Garment Frame */}
            <div className="md:col-span-10 relative aspect-[4/5] bg-[#E8E4DA] overflow-hidden border border-[#0A0A0A]/10 group">
              <img 
                src={product.images?.[selectedImageIndex] || product.images?.[0]} 
                alt={product.name}
                className="w-full h-full object-cover filter contrast-[1.05] brightness-95 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />

              {/* Monospace Image Counter (Lower Left) */}
              <div className="absolute bottom-3 left-3 font-mono text-[10px] text-[#F1EEE6] bg-[#0A0A0A]/70 px-2 py-0.5 tracking-[0.2em] backdrop-blur-sm">
                0{selectedImageIndex + 1} / 0{product.images?.length || 1}
              </div>

              {/* Minimal Circular Navigation Arrows (Lower Right) */}
              {product.images?.length > 1 && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="w-7 h-7 rounded-full bg-[#0A0A0A]/80 hover:bg-[#0A0A0A] text-[#F1EEE6] flex items-center justify-center transition-colors shadow-sm"
                    aria-label="Previous view"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="w-7 h-7 rounded-full bg-[#0A0A0A]/80 hover:bg-[#0A0A0A] text-[#F1EEE6] flex items-center justify-center transition-colors shadow-sm"
                    aria-label="Next view"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Thumbnails Row */}
            <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              {(product.images || []).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 aspect-[3/4] shrink-0 bg-[#E8E4DA] overflow-hidden border ${
                    selectedImageIndex === idx
                      ? 'border-[#8E1717] ring-1 ring-[#8E1717]'
                      : 'border-[#0A0A0A]/15 opacity-70'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

          </div>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT: Purchasing Dossier Column (~35% width / 5 cols)                */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col space-y-5 lg:sticky lg:top-24">
            
            {/* Top Metadata Row: Drop Tag + Red Scribble + SKU */}
            <div className="flex items-center justify-between border-b border-[#0A0A0A]/10 pb-2.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#0A0A0A]/70">
              <div>
                <p>DROP 01</p>
                <p className="font-bold text-[#0A0A0A]">RACING DIVISION</p>
              </div>

              {/* Red Handwritten Tag Accent */}
              <div className="font-handwriting text-2xl text-[#8E1717] font-bold -rotate-3 select-none leading-none">
                Loozars
              </div>

              <div className="text-right">
                <span className="text-[#0A0A0A]/50">#{product.sku?.replace('LZR-D01-', '') || '001'}</span>
              </div>
            </div>

            {/* Large Editorial Product Title */}
            <div className="space-y-2">
              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[3.5rem] text-[#0A0A0A] font-bold uppercase leading-[0.92] tracking-tight">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-center gap-3 pt-1">
                <span className="font-mono text-xl sm:text-2xl text-[#0A0A0A] font-bold">
                  {product.formattedPrice || `₹${product.price}`}
                </span>
                <span className="font-mono text-[10px] text-[#0A0A0A]/50 tracking-widest uppercase">
                  (INCL. ALL TAXES)
                </span>
              </div>
            </div>

            {/* Concise Product Description */}
            <p className="font-mono text-[11px] sm:text-xs text-[#0A0A0A]/75 leading-relaxed">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between font-mono text-xs tracking-wider text-[#0A0A0A]">
                <span className="font-bold uppercase text-[11px]">SIZE</span>
                <button 
                  onClick={() => toggleAccordion('fit')}
                  className="text-[10px] text-[#0A0A0A]/70 hover:text-[#8E1717] underline uppercase tracking-wider transition-colors"
                >
                  SIZE GUIDE →
                </button>
              </div>

              {/* Rectangular Size Pills */}
              <div className="grid grid-cols-6 gap-2 font-mono text-xs">
                {(product.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL']).map((size) => {
                  const v = variants.find(item => item.size === size);
                  const stockForSize = v ? (v.availableStock ?? v.stockQuantity ?? 0) : (product?.stock?.[size] ?? 0);
                  const isOutOfStock = stockForSize <= 0;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      disabled={isOutOfStock}
                      onClick={() => handleSizeSelect(size)}
                      className={`py-2.5 text-center uppercase tracking-widest transition-all rounded-none border ${
                        isOutOfStock
                          ? 'bg-[#E5E1D8] text-[#999] border-[#0A0A0A]/10 line-through cursor-not-allowed opacity-50'
                          : isSelected
                          ? 'bg-[#0A0A0A] text-[#F1EEE6] border-[#0A0A0A] font-bold shadow-sm'
                          : 'bg-transparent text-[#0A0A0A] border-[#0A0A0A]/20 hover:border-[#0A0A0A]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Stock Indicator */}
              <div className="font-mono text-[10px] tracking-wider pt-0.5 text-[#0A0A0A]/70 uppercase">
                {isSelectedOutOfStock ? (
                  <span className="text-[#8E1717] font-bold">[ SOLD OUT IN SIZE {selectedSize} ]</span>
                ) : availableStock <= 5 ? (
                  <span className="text-[#8E1717] font-bold">[ ONLY {availableStock} LEFT IN SIZE {selectedSize} ]</span>
                ) : (
                  <span>[ IN STOCK — READY TO DISPATCH ]</span>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-1.5 pt-1 font-mono text-xs text-[#0A0A0A]">
              <span className="tracking-widest uppercase font-bold text-[10px]">QUANTITY</span>
              <div className="flex items-center w-36 border border-[#0A0A0A]/20 bg-transparent justify-between px-2 py-1.5">
                <button
                  disabled={isSelectedOutOfStock}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-1 text-[#0A0A0A]/70 hover:text-[#0A0A0A] transition-colors disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus size={12} />
                </button>
                <span className="text-center text-[#0A0A0A] font-bold text-xs">
                  {isSelectedOutOfStock ? '00' : String(quantity).padStart(2, '0')}
                </span>
                <button
                  disabled={isSelectedOutOfStock || quantity >= availableStock}
                  onClick={() => setQuantity(q => Math.min(availableStock, q + 1))}
                  className="p-1 text-[#0A0A0A]/70 hover:text-[#0A0A0A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Primary Action Button (Add to Bag) */}
            <div ref={buyButtonRef} className="pt-2">
              <button
                disabled={isSelectedOutOfStock}
                onClick={handleAddToCart}
                className={`w-full py-4 uppercase font-bold tracking-[0.25em] font-mono text-xs transition-all duration-300 flex items-center justify-center gap-2 rounded-none ${
                  isSelectedOutOfStock
                    ? 'bg-[#d5d1c8] text-[#888] border border-[#0A0A0A]/15 cursor-not-allowed'
                    : 'bg-[#0A0A0A] text-[#F1EEE6] hover:bg-[#8E1717] hover:text-white shadow-md'
                }`}
              >
                {isSelectedOutOfStock ? (
                  <span>OUT OF STOCK</span>
                ) : addedFeedback ? (
                  <>
                    <Check size={14} />
                    <span>ADDED TO BAG</span>
                  </>
                ) : (
                  <span>ADD TO BAG →</span>
                )}
              </button>
            </div>

            {/* Shipping Note */}
            <div className="pt-1 font-mono text-[10px] text-[#0A0A0A]/70 tracking-wider uppercase space-y-0.5">
              <div className="flex items-center gap-1.5 text-[#0A0A0A] font-bold">
                <Truck size={12} className="text-[#8E1717]" />
                <span>FREE SHIPPING ON ORDERS ₹2,000+</span>
              </div>
              <p className="pl-4 text-[#0A0A0A]/60">₹99 SHIPPING ON ORDERS BELOW ₹2,000.</p>
            </div>

            {/* Collapsible Accordions with Thin Borders */}
            <div className="border-t border-[#0A0A0A]/15 pt-2 divide-y divide-[#0A0A0A]/10 font-mono text-xs text-[#0A0A0A]">
              
              {/* DETAILS */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('details')}
                  className="w-full flex items-center justify-between text-left font-bold tracking-widest uppercase hover:text-[#8E1717] transition-colors"
                >
                  <span>DETAILS</span>
                  <span>{openAccordions.details ? '−' : '+'}</span>
                </button>

                {openAccordions.details && (
                  <div className="pt-3 pb-1 text-[#0A0A0A]/75 space-y-1.5 leading-relaxed text-[11px]">
                    <ul className="list-disc list-inside space-y-1">
                      {product.details?.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* FIT */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('fit')}
                  className="w-full flex items-center justify-between text-left font-bold tracking-widest uppercase hover:text-[#8E1717] transition-colors"
                >
                  <span>FIT</span>
                  <span>{openAccordions.fit ? '−' : '+'}</span>
                </button>

                {openAccordions.fit && (
                  <div className="pt-3 pb-1 text-[#0A0A0A]/75 space-y-3 text-[11px]">
                    {product.fit && (
                      <p className="font-medium text-[#0A0A0A]">{product.fit}</p>
                    )}
                    {product.measurements && (
                      <table className="w-full text-left border-collapse font-mono text-[10px]">
                        <thead>
                          <tr className="border-b border-[#0A0A0A]/20 font-bold">
                            <th className="py-1">SIZE</th>
                            <th className="py-1">CHEST</th>
                            <th className="py-1">LENGTH</th>
                            <th className="py-1">SHOULDER</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#0A0A0A]/80">
                          {Object.entries(product.measurements).map(([sz, meas]) => (
                            <tr key={sz} className="border-b border-[#0A0A0A]/10">
                              <td className="py-1 font-bold text-[#0A0A0A]">{sz}</td>
                              <td className="py-1">{meas.chest}</td>
                              <td className="py-1">{meas.length}</td>
                              <td className="py-1">{meas.shoulder || meas.thigh}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* CARE */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('care')}
                  className="w-full flex items-center justify-between text-left font-bold tracking-widest uppercase hover:text-[#8E1717] transition-colors"
                >
                  <span>CARE</span>
                  <span>{openAccordions.care ? '−' : '+'}</span>
                </button>

                {openAccordions.care && (
                  <div className="pt-3 pb-1 text-[#0A0A0A]/75 space-y-1 text-[11px]">
                    <p>• Machine wash cold inside out with similar colors.</p>
                    <p>• Do not tumble dry. Line dry in shade.</p>
                    <p>• Cool iron on reverse. Do not iron directly on graphics.</p>
                  </div>
                )}
              </div>

              {/* SHIPPING & RETURNS */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between text-left font-bold tracking-widest uppercase hover:text-[#8E1717] transition-colors"
                >
                  <span>SHIPPING & RETURNS</span>
                  <span>{openAccordions.shipping ? '−' : '+'}</span>
                </button>

                {openAccordions.shipping && (
                  <div className="pt-3 pb-1 text-[#0A0A0A]/75 space-y-2 text-[11px]">
                    <p>• Dispatched within 24-48 business hours via Bluedart / Delhivery.</p>
                    <p>• Delivery across India within 3-5 business days.</p>
                    <p>• 7-day hassle-free size exchange & return policy for unused items.</p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 03. FULL-BLEED 100vw DARK CAMPAIGN SECTION                                */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-[420px] sm:min-h-[500px] bg-[#080808] text-[#EDE7DC] flex items-center overflow-hidden border-t border-b border-white/10 select-none">
        
        {/* Cinematic Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src={campaignStill} 
            alt={`${product.name} Campaign`} 
            className="w-full h-full object-cover filter contrast-[1.15] brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/90 via-[#080808]/40 to-[#080808]/85" />
        </div>

        <div className="relative z-10 max-w-[1760px] w-full mx-auto px-5 sm:px-10 lg:px-14 py-16">
          <div className="max-w-md space-y-4">
            <h2 className="font-editorial text-4xl sm:text-6xl text-[#EDE7DC] font-bold uppercase leading-[0.9] tracking-tight">
              RACING<br />DIVISION.
            </h2>

            <div className="w-10 h-[1px] bg-[#8E1717]"></div>

            <div className="font-mono text-xs text-[#8E8D8A] uppercase tracking-[0.2em] space-y-1">
              <p>SAME PEOPLE.</p>
              <p>DIFFERENT NIGHTS.</p>
            </div>

            <div className="font-mono text-[10px] text-[#8E1717] font-bold tracking-[0.25em]">
              [ 01 ]
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04. PRODUCT DETAIL IMAGE CONTACT SHEET STRIP                              */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-[#F1EEE6] py-12 px-5 sm:px-10 lg:px-14 border-b border-[#0A0A0A]/10 select-none">
        <div className="max-w-[1760px] mx-auto">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {detailFrames.map((frame, idx) => (
              <div key={idx} className="space-y-2">
                <div className="relative aspect-square bg-[#E8E4DA] overflow-hidden border border-[#0A0A0A]/10">
                  <img 
                    src={frame.img} 
                    alt={frame.label}
                    className="w-full h-full object-cover filter contrast-[1.05]"
                  />
                </div>
                <div className="font-mono text-[9px] sm:text-[10px] text-[#0A0A0A]/70 uppercase tracking-[0.18em]">
                  {frame.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 05. RELATED PRODUCTS ("YOU MAY ALSO LIKE")                                */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-[#F1EEE6] py-16 sm:py-20 px-5 sm:px-10 lg:px-14 border-b border-[#0A0A0A]/15 select-none">
        <div className="max-w-[1760px] mx-auto space-y-10 sm:space-y-12">
          
          {/* Section Heading with Thin Line */}
          <div className="flex items-center justify-between gap-4 font-mono">
            <h3 className="font-editorial text-2xl sm:text-4xl text-[#0A0A0A] font-bold uppercase tracking-tight shrink-0">
              YOU MAY ALSO LIKE
            </h3>

            <div className="flex-1 h-[1px] bg-[#0A0A0A]/15 mx-4 hidden sm:block"></div>

            <button
              onClick={() => navigateTo('shop')}
              className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] uppercase text-[#0A0A0A] hover:text-[#8E1717] transition-colors shrink-0"
            >
              [ MORE PRODUCTS → ]
            </button>
          </div>

          {/* 4-Column Product Grid Matching Shop Visual System */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-8">
            {relatedProducts.map((relPiece, idx) => (
              <div
                key={relPiece.id}
                onClick={() => navigateTo('product', relPiece.id)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Visual Image Frame */}
                <div className="relative aspect-[4/5] bg-[#E8E4DA] overflow-hidden">
                  <img 
                    src={relPiece.images?.[0]} 
                    alt={relPiece.name} 
                    className="w-full h-full object-cover filter contrast-[1.05] brightness-95 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />

                  {/* Micro Number Index */}
                  <div className="absolute top-3 left-3 font-mono text-[10px] text-[#F1EEE6] tracking-[0.2em] flex items-center gap-1.5 z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                    <span>0{idx + 1}</span>
                    <span className="w-4 h-[1px] bg-white/70 inline-block"></span>
                  </div>
                </div>

                {/* Metadata Row Underneath */}
                <div className="pt-3.5 flex items-start justify-between gap-3 font-mono text-xs">
                  <div className="space-y-0.5">
                    <h4 className="font-mono text-[11px] sm:text-[12px] font-bold text-[#0A0A0A] group-hover:text-[#8E1717] transition-colors uppercase tracking-[0.14em]">
                      {relPiece.name}
                    </h4>
                    <p className="text-[11px] sm:text-[12px] text-[#555] tracking-wider">
                      {relPiece.formattedPrice || `₹${relPiece.price}`}
                    </p>
                  </div>

                  {/* Circular Arrow Button */}
                  <div className="w-7 h-7 rounded-full border border-[#0A0A0A]/25 flex items-center justify-center text-[#0A0A0A] group-hover:bg-[#0A0A0A] group-hover:text-[#F1EEE6] group-hover:border-[#0A0A0A] transition-all duration-300 shrink-0">
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06. MOBILE STICKY PURCHASE BAR                                            */}
      {/* ========================================================================= */}
      {showStickyBar && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/10 p-3.5 flex items-center justify-between font-mono text-xs text-[#EDE7DC] pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div className="space-y-0.5">
            <span className="font-bold text-[11px] tracking-wider uppercase truncate block max-w-[150px]">
              {product.name}
            </span>
            <span className="text-[#8E8D8A] text-[10px]">
              {product.formattedPrice || `₹${product.price}`} • SIZE {selectedSize}
            </span>
          </div>

          <button
            disabled={isSelectedOutOfStock}
            onClick={handleAddToCart}
            className={`px-5 py-2.5 font-bold uppercase tracking-widest text-[11px] font-mono transition-colors flex items-center gap-1.5 rounded-none ${
              isSelectedOutOfStock
                ? 'bg-[#222] text-[#666] cursor-not-allowed'
                : 'bg-[#F1EEE6] text-[#0A0A0A] hover:bg-[#8E1717] hover:text-white'
            }`}
          >
            {addedFeedback ? (
              <>
                <Check size={12} />
                <span>ADDED</span>
              </>
            ) : (
              <span>ADD TO BAG →</span>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
