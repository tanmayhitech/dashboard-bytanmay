import React from 'react';
import { EditorialNavbar } from '../components/editorial/EditorialNavbar';
import { EditorialHero } from '../components/editorial/EditorialHero';
import { EditorialTheDrop } from '../components/editorial/EditorialTheDrop';
import { EditorialCampaignFilm } from '../components/editorial/EditorialCampaignFilm';
import { EditorialLookbookSection } from '../components/editorial/EditorialLookbookSection';
import { EditorialBrandStatement } from '../components/editorial/EditorialBrandStatement';
import { EditorialFooter } from '../components/editorial/EditorialFooter';

export const HomePage = () => {
  return (
    <main className="w-full bg-[#080808] text-[#EDE7DC] min-h-screen select-none overflow-x-hidden">
      {/* 00 — FLOATING EDITORIAL NAVIGATION */}
      <EditorialNavbar />

      {/* 01 — HERO / CAMPAIGN + GIANT OVERLAPPING LOOZARS WORDMARK */}
      <EditorialHero />

      {/* 02 — DROP 01 / RACING DIVISION (WARM OFF-WHITE CANVAS #F3F0E8) */}
      <EditorialTheDrop />

      {/* Kinetic Moving Ticker Banner */}
      <div className="w-full bg-[#080808] text-[#EDE7DC] py-3.5 overflow-hidden border-t border-b border-white/10 font-mono text-[10px] sm:text-[11px] tracking-[0.25em] uppercase marquee-container select-none">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">LOOZARS® // RACING DIVISION</span>
            <span className="text-[#8E8D8A]">· DROP 01 LIVE</span>
          </span>
          <span className="text-[#8E8D8A]">320 GSM HEAVYWEIGHT FRENCH TERRY</span>
          <span className="text-[#8E1717] font-bold">LIMITED ALLOCATION</span>
          <span className="text-white/30">·</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">BY THE RARE. FOR THE RARE.</span>
          </span>
          <span className="text-[#8E8D8A]">KANPUR SPEEDWAY ARCHIVE</span>
          <span className="text-white/30">·</span>
          {/* Duplicate loop */}
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">LOOZARS® // RACING DIVISION</span>
            <span className="text-[#8E8D8A]">· DROP 01 LIVE</span>
          </span>
          <span className="text-[#8E8D8A]">320 GSM HEAVYWEIGHT FRENCH TERRY</span>
          <span className="text-[#8E1717] font-bold">LIMITED ALLOCATION</span>
          <span className="text-white/30">·</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8E1717] inline-block"></span>
            <span className="font-bold text-white">BY THE RARE. FOR THE RARE.</span>
          </span>
          <span className="text-[#8E8D8A]">KANPUR SPEEDWAY ARCHIVE</span>
          <span className="text-white/30">·</span>
        </div>
      </div>

      {/* 03 — FULL-BLEED CAMPAIGN / REAL PEOPLE (DARK CINEMATIC) */}
      <EditorialCampaignFilm />

      {/* 04 — ASYMMETRICAL EDITORIAL LOOKBOOK */}
      <EditorialLookbookSection />

      {/* 05 — FINAL BRAND STATEMENT (NEGATIVE SPACE & DISPLAY TYPOGRAPHY) */}
      <EditorialBrandStatement />

      {/* 06 — EDITORIAL FOOTER (WARM OFF-WHITE CANVAS) */}
      <EditorialFooter />
    </main>
  );
};
