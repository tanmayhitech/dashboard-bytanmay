import React from 'react';
import { INSTAGRAM_POSTS } from '../data/products';
import { ArrowRight } from 'lucide-react';

export const InstagramSection = () => {
  return (
    <section className="relative w-full bg-[#080808] py-14 sm:py-20 px-4 sm:px-8 lg:px-12 border-t border-[#141414]">
      <div className="max-w-[1720px] mx-auto">
        
        {/* Section Header: ON INSTAGRAM ———— (Direct link to @theloozars) */}
        <div className="flex items-center justify-between pb-6 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-mono text-xs sm:text-sm tracking-[0.25em] text-[#EDE7DC] uppercase">
              ON INSTAGRAM
            </h3>
            <div className="w-10 sm:w-14 h-[1px] bg-[#8E1717]" />
            <span className="font-mono text-[10px] text-[#8E8D8A] tracking-wider hidden sm:inline">
              @theloozars
            </span>
          </div>

          <a 
            href="https://www.instagram.com/theloozars/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-xs font-mono tracking-[0.2em] text-[#8E8D8A] hover:text-[#EDE7DC] transition-colors uppercase"
          >
            <span>FOLLOW US</span>
            <ArrowRight size={13} className="text-[#8E1717] group-hover:translate-x-1.5 transition-transform" />
          </a>
        </div>

        {/* 6 Square Editorial Photographs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {INSTAGRAM_POSTS.slice(0, 6).map((post, idx) => (
            <a 
              key={post.id}
              href="https://www.instagram.com/theloozars/" 
              target="_blank" 
              rel="noopener noreferrer"
              data-cursor="view"
              className="relative aspect-square overflow-hidden bg-[#111111] group cursor-pointer block border border-[#1a1a1a]"
            >
              <img 
                src={post.image} 
                alt={`LOOZARS Archive ${idx + 1}`} 
                className="w-full h-full object-cover filter contrast-[1.08] brightness-[0.92] group-hover:scale-105 group-hover:brightness-100 transition-all duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 border border-transparent group-hover:border-[#8E1717]/60 transition-colors pointer-events-none" />
            </a>
          ))}
        </div>

      </div>
    </section>
  );
};
