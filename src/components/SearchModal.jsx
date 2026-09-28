import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { X, ArrowRight, Lock, Search } from 'lucide-react';

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
          navigateTo('login');
        }
      }
    };
    if (isSearchOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen, isAuthQuery, navigateTo]);

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
    <div className="fixed inset-0 z-[100] overflow-hidden select-none bg-[#070707]/98 backdrop-blur-xl flex flex-col justify-start p-6 sm:p-12 lg:p-16 animate-fadeIn text-[#EDE7DC] font-sans">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        
        {/* Top bar with index tag and close */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[11px] tracking-[0.25em] text-[#8E8D8A] uppercase">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E1717] animate-pulse"></span>
            <span>SEARCH ARCHIVE</span>
          </div>

          <button 
            onClick={() => setIsSearchOpen(false)}
            className="text-[#8E8D8A] hover:text-[#EDE7DC] p-1 transition-colors"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* Minimal Sans-Serif Search Input */}
        <div className="relative">
          <input
            type="text"
            autoFocus
            placeholder="TYPE TO SEARCH (e.g. 'VELO', 'APEX', 'BURGUNDY', 'LOGIN')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-b border-white/15 focus:border-[#EDE7DC] text-lg sm:text-2xl font-sans font-medium text-[#EDE7DC] placeholder:text-[#8E8D8A]/40 py-3 focus:outline-none transition-colors uppercase tracking-wider"
          />
        </div>

        {/* Search Results Container */}
        <div className="space-y-2.5 pt-2 max-h-[55vh] overflow-y-auto pr-1">
          
          {/* Quick Access Portal Card on 'login' / 'admin' / 'creator' queries */}
          {isAuthQuery && (
            <div className="mb-3 bg-[#111111] border border-white/15 p-4 transition-all shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#181818] border border-white/10 flex items-center justify-center text-[#8E1717] shrink-0">
                    <Lock size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#EDE7DC] font-mono tracking-wider uppercase">
                      LOOZARS® ACCESS PORTAL
                    </h3>
                    <p className="text-[11px] text-[#8E8D8A] font-sans">
                      Staff Admin & Creator Affiliates Sign In
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    navigateTo('login');
                  }}
                  className="px-3.5 py-1.5 bg-[#EDE7DC] hover:bg-[#8E1717] hover:text-white text-[#080808] text-[11px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>Open</span>
                  <ArrowRight size={12} />
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
              className="flex items-center justify-between p-3 bg-[#0e0e0e] border border-white/10 hover:border-white/30 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-14 bg-[#161616] overflow-hidden border border-white/10 shrink-0">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div>
                  <span className="font-mono text-[9px] text-[#8E1717] tracking-widest block uppercase">{product.sku}</span>
                  <h3 className="font-sans text-sm font-semibold text-[#EDE7DC] group-hover:text-[#8E1717] transition-colors uppercase tracking-wide">
                    {product.name}
                  </h3>
                  <span className="font-mono text-xs text-[#8E8D8A]">{product.formattedPrice || `₹${product.price}`}</span>
                </div>
              </div>

              <ArrowRight size={13} className="text-[#8E8D8A] group-hover:text-[#EDE7DC] group-hover:translate-x-0.5 transition-transform" />
            </div>
          ))}

          {/* Empty state */}
          {q !== '' && results.length === 0 && !isAuthQuery && (
            <div className="text-center py-10 font-mono text-xs text-[#8E8D8A] tracking-[0.25em] uppercase">
              NO PIECES MATCH "{query.toUpperCase()}".
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
