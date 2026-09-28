import React, { useRef, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import campaignShoot01 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot02 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot03 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import { ArrowLeft, ArrowRight, ArrowUpRight, Camera } from 'lucide-react';

export const MinimalRunway = () => {
  const { navigateTo } = useShop();
  const scrollContainerRef = useRef(null);
  const [activeFrame, setActiveFrame] = useState(0);

  const frames = [
    {
      id: 'frame-01',
      src: campaignShoot03,
      look: 'LOOK 01',
      title: 'URBAN SILHOUETTE',
      caption: 'VELO 07 HEAVYWEIGHT COTTON // 320 GSM',
      location: 'BOMBAY DOCKS'
    },
    {
      id: 'frame-02',
      src: campaignShoot04,
      look: 'LOOK 02',
      title: 'APEX CONTRAST',
      caption: 'OFF-WHITE DRAPED PROFILE // DROP 01',
      location: 'FORT DISTRICT'
    },
    {
      id: 'frame-03',
      src: campaignShoot05,
      look: 'LOOK 03',
      title: 'BURGUNDY SHADOW',
      caption: 'RACING DIVISION SILKSCREEN PRINT',
      location: 'STUDIO ARCHIVE'
    },
    {
      id: 'frame-04',
      src: campaignShoot01,
      look: 'LOOK 04',
      title: 'COMPOSITIONAL ANATOMY',
      caption: 'ARCHIVAL BACK GRAPHICS // ACID TONE',
      location: 'MARINE DRIVE'
    },
    {
      id: 'frame-05',
      src: campaignShoot02,
      look: 'LOOK 05',
      title: 'NOCTURNAL RUN',
      caption: 'OCEAN SPEEDWAY BOXY FIT // PAN-INDIA',
      location: 'BANDRA NIGHTS'
    }
  ];

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      const newPos = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollContainerRef.current.scrollTo({
        left: newPos,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollEvent = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const itemWidth = 340; // approx card width + gap
      const newIndex = Math.min(Math.max(Math.round(scrollLeft / itemWidth), 0), frames.length - 1);
      setActiveFrame(newIndex);
    }
  };

  return (
    <section className="relative w-full bg-[#050505] text-[#EDE7DC] py-20 sm:py-32 select-none border-t border-white/[0.04] overflow-hidden">
      <div className="max-w-[1760px] mx-auto px-5 sm:px-10 lg:px-14 space-y-8 sm:space-y-12">
        
        {/* Header with Runway Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-4 border-b border-white/[0.06]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#8E1717] tracking-[0.3em] uppercase font-bold">
              <Camera size={12} />
              <span>VISUAL CAMPAIGN // AUTUMN WINTER</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#EDE7DC] font-normal uppercase tracking-tight">
              THE RUNWAY REEL
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('drops')}
              className="group inline-flex items-center gap-2 font-mono text-xs text-[#8E8D8A] hover:text-[#EDE7DC] tracking-[0.2em] uppercase transition-colors"
            >
              <span>FULL LOOKBOOK</span>
              <ArrowUpRight size={13} className="text-[#8E1717] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            {/* Scroller Nav Arrows */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => handleScroll('left')}
                className="w-10 h-10 border border-white/10 flex items-center justify-center text-[#8E8D8A] hover:text-[#EDE7DC] hover:border-white/30 transition-all"
                aria-label="Scroll left"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="w-10 h-10 border border-white/10 flex items-center justify-center text-[#8E8D8A] hover:text-[#EDE7DC] hover:border-white/30 transition-all"
                aria-label="Scroll right"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Filmstrip Scroller */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScrollEvent}
          className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-none pb-4 pt-2 -mx-5 px-5 sm:-mx-10 sm:px-10 lg:-mx-14 lg:px-14 scroll-smooth snap-x snap-mandatory"
        >
          {frames.map((frame, idx) => (
            <div
              key={frame.id}
              onClick={() => navigateTo('drops')}
              className="flex-shrink-0 w-[280px] sm:w-[360px] lg:w-[420px] snap-start group cursor-pointer"
            >
              {/* Image Frame */}
              <div className="relative aspect-[3/4] bg-[#0c0c0c] overflow-hidden border border-white/[0.05] group-hover:border-[#8E1717]/60 transition-all duration-500 shadow-2xl">
                <img
                  src={frame.src}
                  alt={frame.title}
                  className="w-full h-full object-cover filter contrast-[1.1] brightness-[0.9] group-hover:scale-105 group-hover:brightness-100 transition-all duration-700 ease-out"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-60 group-hover:opacity-30 transition-opacity" />

                {/* Top Corner Meta */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between font-mono text-[9px] tracking-widest text-[#EDE7DC] uppercase">
                  <span className="bg-black/80 px-2 py-0.5 border border-white/10">{frame.look}</span>
                  <span className="text-[#8E8D8A]">{frame.location}</span>
                </div>

                {/* Bottom Title Pill */}
                <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-sm p-3 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#EDE7DC] tracking-wider uppercase font-semibold">
                    <span>{frame.title}</span>
                    <span className="text-[#8E1717]">{`0${idx + 1}/0${frames.length}`}</span>
                  </div>
                  <p className="font-mono text-[8px] text-[#8E8D8A] tracking-widest uppercase truncate">
                    {frame.caption}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scrubber Progress Bar */}
        <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-[#8E8D8A] tracking-[0.2em] uppercase">
          <span>RUNWAY ARCHIVE [05 FRAMES]</span>
          <div className="flex items-center gap-1.5">
            {frames.map((_, i) => (
              <span
                key={i}
                className={`h-1 transition-all duration-300 ${
                  activeFrame === i ? 'w-8 bg-[#8E1717]' : 'w-2 bg-white/15'
                }`}
              />
            ))}
          </div>
          <span className="text-white/40">SCROLL TO DISCOVER →</span>
        </div>

      </div>
    </section>
  );
};
