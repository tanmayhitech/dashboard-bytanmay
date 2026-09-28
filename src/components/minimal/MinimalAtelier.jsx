import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { ArrowRight, Layers, ShieldCheck, Scissors, Sparkles } from 'lucide-react';

export const MinimalAtelier = () => {
  const { navigateTo } = useShop();
  const [selectedSpec, setSelectedSpec] = useState(0);

  const specs = [
    {
      icon: Layers,
      tag: '01 // TEXTILE',
      title: '320 GSM French Terry',
      desc: '100% long-staple combed cotton woven on vintage circular looms. Substantial tactile weight with an ultra-breathable interior loopback knit.',
      metric: '320 GSM WEIGHT'
    },
    {
      icon: Scissors,
      tag: '02 // ARCHITECTURE',
      title: 'Engineered Boxy Drape',
      desc: 'Precision drop-shoulder cut with elongated sleeves and a structured hemline that hangs without clinging, tailored for unrestricted movement.',
      metric: 'RELAXED PROPORTION'
    },
    {
      icon: ShieldCheck,
      tag: '03 // TREATMENT',
      title: 'Pre-Shrunk Mineral Wash',
      desc: 'Custom garment-dyed wash treated with bio-enzymes. Guarantees true-to-size dimensional stability and an authentic broken-in vintage patina.',
      metric: 'ZERO SHRINKAGE'
    },
    {
      icon: Sparkles,
      tag: '04 // IMPRINT',
      title: 'Archival Screen Printing',
      desc: 'Hand-pulled high-density plastisol and water-based pigments cured at 180°C. Resists fading, cracking, or peeling over countless washes.',
      metric: 'HIGH DENSITY INK'
    }
  ];

  return (
    <section className="relative w-full bg-[#070707] text-[#EDE7DC] py-20 sm:py-32 px-5 sm:px-10 lg:px-14 select-none border-t border-white/[0.04]">
      <div className="max-w-[1760px] mx-auto space-y-16">
        
        {/* Top Manifesto Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8 border-b border-white/[0.06]">
          <div className="lg:col-span-8 space-y-3">
            <span className="font-mono text-[10px] text-[#8E1717] tracking-[0.3em] uppercase block font-bold">
              ● THE ATELIER PHILOSOPHY
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-normal uppercase leading-[1.05] tracking-tight">
              NO COMPROMISE. <br />
              <span className="italic text-[#8E8D8A] font-serif">NO MASS PRODUCTION.</span>
            </h2>
          </div>

          <div className="lg:col-span-4 font-mono text-xs text-[#8E8D8A] leading-relaxed space-y-3">
            <p>
              Each LOOZARS garment is crafted in strictly limited allocations out of our Bombay atelier. Engineered for the modern silhouette with uncompromising heavyweight textile standards.
            </p>
            <button
              onClick={() => navigateTo('about')}
              className="inline-flex items-center gap-2 text-[#EDE7DC] hover:text-[#8E1717] tracking-[0.2em] uppercase font-bold transition-colors"
            >
              <span>READ THE MANIFESTO</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* 4 Interactive Spec Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specs.map((spec, idx) => {
            const IconComponent = spec.icon;
            const isSelected = selectedSpec === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setSelectedSpec(idx)}
                onClick={() => setSelectedSpec(idx)}
                className={`p-6 sm:p-8 bg-[#0c0c0c] border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer ${
                  isSelected 
                    ? 'border-[#EDE7DC] bg-[#121212]' 
                    : 'border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-[#8E8D8A] tracking-widest uppercase">
                      {spec.tag}
                    </span>
                    <IconComponent size={16} className={isSelected ? 'text-[#8E1717]' : 'text-[#8E8D8A]'} />
                  </div>

                  <h3 className="font-editorial text-xl text-[#EDE7DC] font-normal tracking-tight">
                    {spec.title}
                  </h3>

                  <p className="font-mono text-xs text-[#8E8D8A] leading-relaxed">
                    {spec.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] font-mono text-[9px] tracking-widest text-[#8E1717] uppercase font-bold">
                  {spec.metric}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Location & Atelier Coordinates Banner */}
        <div className="bg-[#0c0c0c] p-6 sm:p-8 border border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#8E8D8A]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#8E1717]"></span>
            <span className="text-[#EDE7DC]">BOMBAY DESIGN STUDIO // 18.9220° N, 72.8347° E</span>
          </div>

          <div className="flex items-center gap-6">
            <span>LIMITED WORLDWIDE RELEASE</span>
            <span className="text-[#EDE7DC] font-bold">EDITION 01</span>
          </div>
        </div>

      </div>
    </section>
  );
};
