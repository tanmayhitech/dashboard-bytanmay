import React from 'react';
import { useShop } from '../context/ShopContext';
import { ArrowRight } from 'lucide-react';

export const NotFoundPage = () => {
  const { navigateTo } = useShop();

  return (
    <div className="w-full min-h-[80vh] bg-[#080808] flex flex-col items-center justify-center text-center px-4 pt-28 pb-20 select-none">
      <div className="max-w-md space-y-6">
        
        {/* Red Accent Glyph */}
        <div className="text-[#8E1717] font-mono text-2xl font-bold">
          ✕ ✕
        </div>

        {/* 404 Heading */}
        <div className="space-y-1">
          <span className="font-mono text-xs text-[#8E1717] tracking-[0.3em] uppercase block">
            ERROR // 404
          </span>
          <h1 className="font-editorial text-4xl sm:text-6xl text-[#EDE7DC] font-normal uppercase leading-tight tracking-tight">
            LOST SIGNAL.
          </h1>
          <p className="font-mono text-xs text-[#8E8D8A] tracking-widest uppercase">
            PAGE NOT FOUND.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <button
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-2.5 bg-[#EDE7DC] text-[#080808] px-6 py-3.5 text-xs font-mono font-bold tracking-[0.2em] uppercase hover:bg-[#8E1717] hover:text-white transition-colors"
          >
            <span>BACK TO LOOZARS</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};
