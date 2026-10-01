import React from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { 
  ArrowRight, 
  Search, 
  ShoppingBag, 
  Compass, 
  Sparkles, 
  ArrowLeft,
  Flame,
  Truck,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const NotFoundPage = () => {
  const { navigateTo, setIsSearchOpen, products } = useShop();

  const catalog = (products && products.length > 0 ? products : STATIC_PRODUCTS)
    .filter(p => p.isActive !== false)
    .slice(0, 4);

  return (
    <div className="w-full min-h-screen bg-[#08080A] text-[#EDE7DC] pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-14 select-none font-sans relative overflow-hidden">
      
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[350px] sm:h-[450px] bg-[#8E1717]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16 relative z-10">
        
        {/* Main 404 Hero Card */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#161214] border border-[#8E1717]/40 text-[#8E1717] font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E1717] animate-pulse" />
            <span>ERROR 404 // ROUTE NOT FOUND</span>
          </div>

          {/* Giant Stylized 404 Number */}
          <div className="relative select-none">
            <div className="font-editorial text-7xl sm:text-9xl lg:text-[160px] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-[#EDE7DC] to-zinc-800 leading-none">
              404
            </div>
            <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-[#8E1717] to-transparent opacity-80" />
          </div>

          {/* Editorial Headline & Subtitle */}
          <div className="space-y-2.5 pt-2">
            <h1 className="font-editorial text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#EDE7DC]">
              Signal Interrupted.
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#8E8D8A] uppercase tracking-wider max-w-md mx-auto leading-relaxed">
              The page or piece you are searching for does not exist or has been moved.
            </p>
          </div>

          {/* Search Trigger Capsule */}
          <div className="pt-2 max-w-md mx-auto">
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="bg-[#121218] hover:bg-[#181822] border border-[#242432] hover:border-[#8E1717]/60 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition-all duration-300 shadow-lg group"
            >
              <div className="flex items-center gap-3 text-xs font-mono text-[#8E8D8A]">
                <Search size={15} className="text-[#8E1717] group-hover:text-white transition-colors" />
                <span className="group-hover:text-[#EDE7DC] transition-colors">Search hoodies, tees, or sizes...</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#8E8D8A] bg-[#1C1C26] px-2 py-0.5 rounded-md border border-[#282836] group-hover:text-white group-hover:border-zinc-500">
                SEARCH ↵
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 font-mono">
            <button
              onClick={() => navigateTo('shop')}
              className="w-full sm:w-auto bg-[#EDE7DC] hover:bg-[#8E1717] text-[#080808] hover:text-white px-8 py-3.5 text-xs font-bold tracking-[0.25em] uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-[0_0_24px_rgba(142,23,23,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Explore Drop 01</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => navigateTo('drops')}
              className="w-full sm:w-auto bg-[#121218] hover:bg-[#1A1A24] text-[#8E8D8A] hover:text-[#EDE7DC] border border-[#242432] hover:border-[#8E1717]/50 px-6 py-3.5 text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-colors cursor-pointer text-center"
            >
              <span>View Lookbook</span>
            </button>
          </div>

        </div>

        {/* Quick Jump: Featured Drop 01 Silhouettes */}
        <div className="space-y-6 pt-6 border-t border-[#1C1C24]">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] text-[#8E1717] uppercase tracking-[0.25em] font-bold">
                <Flame size={13} className="text-[#8E1717]" />
                <span>ACTIVE COLLECTION</span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-wide text-[#EDE7DC] mt-0.5">
                Drop 01 — Racing Division
              </h2>
            </div>

            <button
              onClick={() => navigateTo('shop')}
              className="text-xs font-mono font-bold tracking-widest text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors flex items-center gap-1 uppercase"
            >
              <span>[ SHOP ALL PIECES → ]</span>
            </button>
          </div>

          {/* 4-Item Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {catalog.map((item, idx) => {
              const itemImg = item.images?.[0] || '';
              return (
                <div
                  key={item.id}
                  onClick={() => navigateTo('product', item.id)}
                  className="bg-[#101015] border border-[#202028] hover:border-[#8E1717]/60 rounded-2xl p-4 space-y-3 cursor-pointer group transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Thumbnail with zoom */}
                  <div className="w-full aspect-[3/4] bg-[#16161E] rounded-xl overflow-hidden border border-[#242430] group-hover:border-[#8E1717] relative transition-colors">
                    {itemImg ? (
                      <img 
                        src={itemImg} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8E8D8A] font-mono text-xs">
                        LZR
                      </div>
                    )}
                    <span className="absolute top-2 left-2 font-mono text-[9px] font-bold bg-black/80 text-white px-2 py-0.5 rounded-md border border-white/10">
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-editorial text-sm sm:text-base font-bold uppercase tracking-wider text-[#EDE7DC] group-hover:text-[#8E1717] transition-colors truncate">
                        {item.name}
                      </h3>
                      <span className="font-mono text-xs font-bold text-[#EDE7DC]">
                        {item.formattedPrice || `₹${item.price}`}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-[#8E8D8A] line-clamp-1">
                      {item.subtitle || '320 GSM 100% Combed Cotton'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Reassurance Footer Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 font-mono text-xs uppercase tracking-wider text-[#8E8D8A]">
          <div className="p-4 bg-[#101015] border border-[#202028] rounded-2xl flex items-center justify-center gap-2.5 text-center shadow-sm">
            <Truck size={15} className="text-[#8E1717] shrink-0" />
            <span>FREE PAN-INDIA DELIVERY OVER ₹2,000</span>
          </div>
          <div className="p-4 bg-[#101015] border border-[#202028] rounded-2xl flex items-center justify-center gap-2.5 text-center shadow-sm">
            <ShieldCheck size={15} className="text-[#8E1717] shrink-0" />
            <span>100% SECURE ENCRYPTED CHECKOUT</span>
          </div>
          <div className="p-4 bg-[#101015] border border-[#202028] rounded-2xl flex items-center justify-center gap-2.5 text-center shadow-sm">
            <RotateCcw size={15} className="text-[#8E1717] shrink-0" />
            <span>7-DAY HASSLE-FREE EXCHANGES</span>
          </div>
        </div>

      </div>
    </div>
  );
};
