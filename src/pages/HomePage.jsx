import React from 'react';
import { Hero } from '../components/Hero';
import { Campaign } from '../components/Campaign';
import { FeaturedDrop } from '../components/FeaturedDrop';
import { EditorialCollage } from '../components/EditorialCollage';
import { InstagramSection } from '../components/InstagramSection';

export const HomePage = () => {
  return (
    <main className="w-full bg-[#090909]">
      {/* 02 — HERO */}
      <Hero />
      
      {/* 03 — CAMPAIGN */}
      <Campaign />
      
      {/* 04 — FEATURED DROP */}
      <FeaturedDrop />
      
      {/* 05 — EDITORIAL COLLAGE / MANIFESTO */}
      <EditorialCollage />
      
      {/* 06 — INSTAGRAM */}
      <InstagramSection />
    </main>
  );
};
