import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { X, ArrowRight, Lock, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export const SearchModal = () => {
  const { isSearchOpen, setIsSearchOpen, navigateTo, products } = useShop();
  const [query, setQuery] = useState('');

  const catalog = products && products.length > 0 ? products : STATIC_PRODUCTS;

  const q = query.toLowerCase().trim();

  // Keyword matcher for Access Portal / Login
  const isAuthQuery = q !== '' && (
    'login'.includes(q) ||
    'log in'.includes(q) ||
    'signin'.includes(q) ||
    'sign in'.includes(q) ||
    'admin'.includes(q) ||
    'atelier'.includes(q) ||
    'creator'.includes(q) ||
    'influencer'.includes(q) ||
    'portal'.includes(q) ||
    'dashboard'.includes(q) ||
    'auth'.includes(q) ||
    'account'.includes(q)
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
      if (e.key === 'Enter') {
        if (isAuthQuery) {
          e.preventDefault();
          setIsSearchOpen(false);
          if (q.includes('admin') || q.includes('atelier')) {
            navigateTo('login');
          } else if (q.includes('creator') || q.includes('influencer')) {
            navigateTo('login');
          } else {
            navigateTo('login');
          }
        }
      }
    };
    if (isSearchOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen, isAuthQuery, q, navigateTo]);

  if (!isSearchOpen) return null;

  const results = q === '' ? [] : catalog.filter(product => {
    return (
      (product.name && product.name.toLowerCase().includes(q)) ||
      (product.category && product.category.toLowerCase().includes(q)) ||
      (product.description && product.description.toLowerCase().includes(q)) ||
      (product.sku && product.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden select-none bg-[#080808]/98 backdrop-blur-lg flex flex-col justify-start p-6 sm:p-12 lg:p-20 animate-fadeIn">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        
        {/* Top bar with heading: SEARCH LOOZARS & close */}
        <div className="flex items-center justify-between border-b border-[#181818] pb-6">
          <h2 className="font-editorial text-2xl sm:text-3xl text-[#EDE7DC] uppercase tracking-wide">
            SEARCH LOOZARS
          </h2>
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="text-[#8E8D8A] hover:text-[#EDE7DC] p-1 transition-colors"
            aria-label="Close search"
          >
            <X size={24} />
          </button>
        </div>

        {/* Minimal Search Input */}
        <div className="relative">
          <input
            type="text"
            autoFocus
            placeholder="TYPE TO SEARCH (e.g. 'LOGIN', 'TEES', 'APEX')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-b border-[#222222] focus:border-[#A3E635] text-xl sm:text-3xl font-editorial text-[#EDE7DC] placeholder:text-[#333333] py-4 focus:outline-none transition-colors uppercase"
          />
        </div>

        {/* Search Results */}
        <div className="space-y-3 pt-4 max-h-[55vh] overflow-y-auto pr-1">
          
          {/* Priority Quick Access Portal Card on 'login' / 'admin' / 'creator' queries */}
          {isAuthQuery && (
            <div className="mb-4 bg-gradient-to-r from-[#141414] to-[#1a1a1a] border border-[#2e2e2e] hover:border-[#A3E635] p-4 sm:p-5 rounded-xl transition-all shadow-xl group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center text-[#A3E635] shrink-0 group-hover:scale-105 transition-transform">
                    <Lock size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-[#EDE7DC] font-mono tracking-wide">
                        LOOZARS® ACCESS PORTAL
                      </h3>
                      <span className="text-[10px] bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                        Quick Access
                      </span>
                    </div>
                    <p className="text-xs text-[#8E8D8A] mt-0.5">
                      Unified sign-in for Brand Administrators & Creator Affiliates
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigateTo('login');
                    }}
                    className="px-4 py-2 bg-[#EDE7DC] hover:bg-white text-[#090909] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow"
                  >
                    <span>Open Sign In</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Sub-portal links */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#262626]">
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    navigateTo('login');
                  }}
                  className="p-2 bg-[#121212] hover:bg-[#1c1c1c] border border-[#222222] rounded-lg text-left transition-colors flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-1.5 text-[#EDE7DC]">
                    <Sparkles size={12} className="text-[#A3E635]" />
                    <span>Creator / Partner Portal</span>
                  </span>
                  <ArrowRight size={12} className="text-[#666666]" />
                </button>

                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    navigateTo('login');
                  }}
                  className="p-2 bg-[#121212] hover:bg-[#1c1c1c] border border-[#222222] rounded-lg text-left transition-colors flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-1.5 text-[#EDE7DC]">
                    <ShieldCheck size={12} className="text-[#EDE7DC]" />
                    <span>Admin Atelier Console</span>
                  </span>
                  <ArrowRight size={12} className="text-[#666666]" />
                </button>
              </div>
            </div>
          )}

          {/* Product Results */}
          {results.map(product => (
            <div
              key={product.id}
              onClick={() => {
                setIsSearchOpen(false);
                navigateTo('product', product.id);
              }}
              className="flex items-center justify-between p-3.5 bg-[#111111] border border-[#1a1a1a] hover:border-[#A3E635] cursor-pointer group transition-colors rounded-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-16 bg-[#181818] overflow-hidden border border-[#222222] rounded-sm shrink-0">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#A3E635] tracking-widest">{product.sku}</span>
                  <h3 className="font-editorial text-base sm:text-lg text-[#EDE7DC] group-hover:text-[#A3E635] transition-colors uppercase">
                    {product.name}
                  </h3>
                  <span className="font-mono text-xs text-[#8E8D8A]">{product.formattedPrice}</span>
                </div>
              </div>

              <ArrowRight size={14} className="text-[#8E8D8A] group-hover:text-[#A3E635] group-hover:translate-x-1 transition-transform" />
            </div>
          ))}

          {/* Empty state when no product & not auth query */}
          {q !== '' && results.length === 0 && !isAuthQuery && (
            <div className="text-center py-12 font-mono text-xs text-[#8E8D8A] tracking-widest uppercase">
              NOTHING FOUND FOR "{query.toUpperCase()}".
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
