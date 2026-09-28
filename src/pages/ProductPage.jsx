import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Plus, Minus, Truck, RefreshCw, Ruler, Tag } from 'lucide-react';

export const ProductPage = () => {
  const { 
    currentProduct, 
    addToCart, 
    navigateTo, 
    setActiveModal 
  } = useShop();

  const product = currentProduct || STATIC_PRODUCTS[0];
  const variants = product?.variants || [];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState('description'); // 'description' | 'size_guide' | 'shipping'
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Synchronize variant selection on product change
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
  }, [product?.id, product?.db_id]);

  // Current selected variant and live stock
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
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    if (isSelectedOutOfStock) return;
    addToCart(product, selectedSize, quantity, selectedVariant);
    navigateTo('checkout');
  };

  const toggleAccordion = (id) => {
    setActiveAccordion(prev => (prev === id ? null : id));
  };

  return (
    <div className="w-full min-h-screen bg-[#080808] pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1760px] mx-auto">
        
        {/* Back Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between border-b border-[#181818] pb-4 mb-8 sm:mb-12 text-xs font-mono">
          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-2 text-[#8E8D8A] hover:text-[#EDE7DC] uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} />
            <span>BACK TO SHOP</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-[#8E8D8A]">
            <span>LOOZARS®</span>
            <span>/</span>
            <span>{product.drop}</span>
            <span>/</span>
            <span className="text-[#EDE7DC]">{product.name}</span>
          </div>
        </div>

        {/* Main Product Layout (Asymmetric Editorial Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Left: Large Image Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 sm:gap-6">
            
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 shrink-0">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  data-cursor="view"
                  className={`w-16 h-20 sm:w-20 sm:h-24 bg-[#111111] overflow-hidden border transition-all ${
                    selectedImageIndex === idx
                      ? 'border-[#8E1717] ring-1 ring-[#8E1717]'
                      : 'border-[#222222] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} detail view ${idx + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Large Active Image Frame */}
            <div 
              data-cursor="view"
              className="flex-1 relative aspect-[4/5] bg-[#111111] overflow-hidden border border-[#1c1c1c] group"
            >
              <img 
                src={product.images[selectedImageIndex] || product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover object-center filter contrast-[1.05] brightness-[0.94] group-hover:scale-105 transition-transform duration-700"
              />

              {/* Red Archival SKU Stamp */}
              <div className="absolute top-4 left-4 font-mono text-[9px] text-[#8E1717] bg-black/85 px-2.5 py-1 tracking-widest border border-[#8E1717]/30">
                {product.sku} // {product.drop}
              </div>

              {/* Sale Pill Badge */}
              {product.isSale && (
                <div className="absolute top-4 right-4 bg-[#8E1717] text-white font-mono text-[10px] font-bold px-2.5 py-1 tracking-widest uppercase shadow-md">
                  SPECIAL SALE
                </div>
              )}
            </div>

          </div>

          {/* Right: Product Information & Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Product Title & Price */}
            <div className="space-y-2 border-b border-[#181818] pb-6">
              <div className="flex items-center gap-2 font-mono text-xs text-[#8E1717] tracking-[0.25em] uppercase">
                <span>{product.badge}</span>
                {product.isFeatured && (
                  <span className="text-[#A3E635] text-[10px] border border-[#A3E635]/30 px-1.5 py-0.5">
                    FEATURED
                  </span>
                )}
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl text-[#EDE7DC] font-normal uppercase leading-[1.05] tracking-tight">
                {product.name}
              </h1>

              <div className="pt-2 flex items-baseline gap-3">
                <span className="font-mono text-2xl sm:text-3xl text-[#EDE7DC] font-light">
                  {product.formattedPrice}
                </span>
                {product.isSale && (
                  <>
                    <span className="font-mono text-lg text-[#666666] line-through font-light">
                      {product.formattedBasePrice}
                    </span>
                    <span className="bg-[#8E1717] text-white text-[10px] font-mono font-bold px-2 py-0.5 tracking-widest uppercase">
                      SAVE ₹{(product.basePrice - product.price).toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Short Description */}
            <p className="font-mono text-xs sm:text-sm text-[#8E8D8A] leading-relaxed">
              {product.description}
            </p>

            {/* Size Selector: Minimal Rectangular Controls */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="tracking-widest text-[#EDE7DC] uppercase">SIZE</span>
                <button 
                  onClick={() => toggleAccordion('size_guide')}
                  className="text-[10px] text-[#8E8D8A] hover:text-[#8E1717] underline uppercase tracking-wider"
                >
                  SIZE GUIDE
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2 font-mono text-xs">
                {product.sizes.map((size) => {
                  const v = variants.find(item => item.size === size);
                  const stockForSize = v ? (v.availableStock ?? v.stockQuantity ?? 0) : (product?.stock?.[size] ?? 0);
                  const isOutOfStock = stockForSize <= 0;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      disabled={isOutOfStock}
                      onClick={() => handleSizeSelect(size)}
                      className={`py-3 text-center uppercase tracking-widest transition-colors border ${
                        isOutOfStock
                          ? 'bg-[#0c0c0c] text-[#444444] border-[#181818] line-through cursor-not-allowed opacity-40'
                          : isSelected
                          ? 'bg-[#EDE7DC] text-[#080808] border-[#EDE7DC] font-bold'
                          : 'bg-[#111111] text-[#8E8D8A] border-[#222222] hover:border-[#8E1717] hover:text-[#EDE7DC]'
                      }`}
                      title={isOutOfStock ? `Size ${size} — Sold out` : `Size ${size} — ${stockForSize} available`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {/* Stock Status Notice */}
              <div className="flex items-center justify-between font-mono text-[10px] tracking-wider pt-1">
                {isSelectedOutOfStock ? (
                  <span className="text-[#8E8D8A] uppercase">
                    [ SOLD OUT IN SIZE {selectedSize} ]
                  </span>
                ) : availableStock <= 5 ? (
                  <span className="text-[#8E1717] font-bold uppercase">
                    [ ONLY {availableStock} {availableStock === 1 ? 'PIECE' : 'PIECES'} REMAINING IN SIZE {selectedSize} ]
                  </span>
                ) : (
                  <span className="text-[#8E8D8A] uppercase">
                    [ IN STOCK — READY TO DISPATCH ]
                  </span>
                )}
                <span className="text-[#555555]">{selectedVariant?.sku || `${product.sku}-${selectedSize}`}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-2 font-mono text-xs">
              <span className="tracking-widest text-[#EDE7DC] uppercase">QTY:</span>
              <div className={`flex items-center border bg-[#111111] ${isSelectedOutOfStock ? 'border-[#181818] opacity-40' : 'border-[#222222]'}`}>
                <button
                  disabled={isSelectedOutOfStock}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-2 text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-[#EDE7DC] font-bold">
                  {isSelectedOutOfStock ? 0 : quantity}
                </span>
                <button
                  disabled={isSelectedOutOfStock || quantity >= availableStock}
                  onClick={() => setQuantity(q => Math.min(availableStock, q + 1))}
                  className="p-2 text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              {!isSelectedOutOfStock && quantity >= availableStock && availableStock > 0 && (
                <span className="text-[10px] text-[#8E1717] font-mono">MAX QUANTITY</span>
              )}
            </div>

            {/* CTA Buttons: ADD TO CART & BUY NOW */}
            <div className="space-y-3 pt-4 font-mono text-xs">
              <button
                disabled={isSelectedOutOfStock}
                onClick={handleAddToCart}
                className={`w-full py-4 uppercase font-bold tracking-[0.25em] transition-colors duration-300 flex items-center justify-center gap-2 ${
                  isSelectedOutOfStock
                    ? 'bg-[#141414] text-[#555555] border border-[#222222] cursor-not-allowed'
                    : 'bg-[#EDE7DC] text-[#080808] hover:bg-[#8E1717] hover:text-white'
                }`}
              >
                {isSelectedOutOfStock ? (
                  <span>OUT OF STOCK</span>
                ) : addedFeedback ? (
                  <>
                    <Check size={16} />
                    <span>ADDED TO CART</span>
                  </>
                ) : (
                  <span>ADD TO CART</span>
                )}
              </button>

              <button
                disabled={isSelectedOutOfStock}
                onClick={handleBuyNow}
                className={`w-full py-3.5 uppercase tracking-[0.2em] border transition-colors ${
                  isSelectedOutOfStock
                    ? 'bg-[#0f0f0f] border-[#1a1a1a] text-[#444444] cursor-not-allowed opacity-40'
                    : 'bg-[#111111] border-[#262626] text-[#EDE7DC] hover:border-[#8E1717] hover:text-white'
                }`}
              >
                BUY IT NOW →
              </button>
            </div>

            {/* Collapsible Accordions: DESCRIPTION, SIZE GUIDE, SHIPPING & RETURNS */}
            <div className="border-t border-[#181818] pt-4 divide-y divide-[#181818] font-mono text-xs">
              
              {/* 1. DESCRIPTION */}
              <div className="py-3.5">
                <button
                  onClick={() => toggleAccordion('description')}
                  className="w-full flex items-center justify-between text-left text-[#EDE7DC] tracking-widest uppercase hover:text-[#8E1717] transition-colors"
                >
                  <span>DESCRIPTION</span>
                  {activeAccordion === 'description' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {activeAccordion === 'description' && (
                  <div className="pt-3 pb-1 text-[#8E8D8A] space-y-2 leading-relaxed">
                    <ul className="list-disc list-inside space-y-1">
                      {product.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                    <p className="pt-2 text-[11px] text-[#EDE7DC]">
                      FIT: {product.fit}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. SIZE GUIDE */}
              <div className="py-3.5">
                <button
                  onClick={() => toggleAccordion('size_guide')}
                  className="w-full flex items-center justify-between text-left text-[#EDE7DC] tracking-widest uppercase hover:text-[#8E1717] transition-colors"
                >
                  <span>SIZE GUIDE</span>
                  {activeAccordion === 'size_guide' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {activeAccordion === 'size_guide' && (
                  <div className="pt-3 pb-1 text-[#8E8D8A] space-y-3">
                    <p className="text-[11px]">
                      Measurements in inches. Boxy oversized streetwear fit.
                    </p>
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-[#222222] text-[#EDE7DC]">
                          <th className="py-1">SIZE</th>
                          <th className="py-1">CHEST</th>
                          <th className="py-1">LENGTH</th>
                          <th className="py-1">SHOULDER</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(product.measurements || {}).map(([sz, meas]) => (
                          <tr key={sz} className="border-b border-[#181818]">
                            <td className="py-1 text-[#EDE7DC] font-bold">{sz}</td>
                            <td className="py-1">{meas.chest}</td>
                            <td className="py-1">{meas.length}</td>
                            <td className="py-1">{meas.shoulder || meas.thigh}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. SHIPPING & RETURNS */}
              <div className="py-3.5">
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between text-left text-[#EDE7DC] tracking-widest uppercase hover:text-[#8E1717] transition-colors"
                >
                  <span>SHIPPING & RETURNS</span>
                  {activeAccordion === 'shipping' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {activeAccordion === 'shipping' && (
                  <div className="pt-3 pb-1 text-[#8E8D8A] space-y-2 leading-relaxed text-[11px]">
                    <div className="flex items-center gap-2 text-[#EDE7DC]">
                      <Truck size={14} className="text-[#8E1717]" />
                      <span>Free Pan-India shipping on orders above ₹2,000.</span>
                    </div>
                    <p>
                      Dispatched within 24-48 business hours via Delhivery / Bluedart. Expected delivery in 3-5 business days.
                    </p>
                    <div className="flex items-center gap-2 text-[#EDE7DC] pt-1">
                      <RefreshCw size={14} className="text-[#8E1717]" />
                      <span>7-Day Hassle-Free Size Exchange & Returns.</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
