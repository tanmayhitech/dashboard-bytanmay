import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useShop } from '../../context/ShopContext';
import loozarsLogoImg from '../../assets/images/loozars-official-logo.png';
import campaignShoot01 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-01.png';
import campaignShoot02 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-02.jpeg';
import campaignShoot03 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-03.jpeg';
import campaignShoot04 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-04.jpeg';
import campaignShoot05 from '../../assets/photoshoot/05-campaign-editorial/campaign-shoot-05.jpeg';
import { ArrowRight } from 'lucide-react';

const NUM_SEGMENTS = 7; // L - O - O - Z - A - R - S logical visual slices

export const EditorialHero = () => {
  const { navigateTo } = useShop();
  const [activeThumb, setActiveThumb] = useState(0);

  // Hero container and logo refs
  const heroRef = useRef(null);
  const logoContainerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Mouse & Motion State (stored in refs for 60fps/120fps requestAnimationFrame lerp)
  const mouseState = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    isHoveringHero: false,
    isHoveringLogo: false,
    cursorClientX: 0,
    cursorClientY: 0,
    lastRedDetailTime: 0
  });

  // Reactive visual states
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHoveredLogo, setIsHoveredLogo] = useState(false);
  const [redDetailVisible, setRedDetailVisible] = useState(false);
  const [redDetailStyle, setRedDetailStyle] = useState({ left: '35%', width: '48px', opacity: 0 });

  // Atmospheric Exposure & Flicker State (Irregular Analog Film Shutter Dynamics)
  const [atmosphereFilter, setAtmosphereFilter] = useState({
    brightness: 0.72,
    contrast: 1.15,
    opacity: 1.0
  });

  const heroThumbnails = [
    { id: 0, img: campaignShoot03, label: '01' },
    { id: 1, img: campaignShoot05, label: '02' },
    { id: 2, img: campaignShoot04, label: '03' }
  ];

  const scrollToDrop = () => {
    const el = document.getElementById('drop-01');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigateTo('shop');
    }
  };

  // 1. Accessibility Check: prefers-reduced-motion
  const isReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Scroll Transformation Tracker (Camera Pull-Away Effect over first 350px)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const progress = Math.min(1, Math.max(0, scrollY / 350));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Subtle Blinking / Flickering Background Atmosphere (Organic Irregular Intervals)
  useEffect(() => {
    if (isReducedMotion) return;

    let flickerTimer;
    let resetTimer;
    let isSubscribed = true;

    const runOrganicFlicker = () => {
      if (!isSubscribed) return;

      // Irregular, non-repeating intervals (1.6s to 5.8s)
      const baseDelays = [1800, 2600, 3400, 2100, 4200, 2900, 5800, 3800];
      const selectedDelay = baseDelays[Math.floor(Math.random() * baseDelays.length)] + (Math.random() * 600 - 300);

      flickerTimer = setTimeout(() => {
        if (!isSubscribed) return;

        // Choose from 3 subtle atmospheric variations:
        // 0: Darkness Pulse (0.69 brightness ~ -4%)
        // 1: Light Exposure Pulse (0.755 brightness ~ +4.5%)
        // 2: Micro Double-Flicker (0.745 -> 0.70 -> 0.72)
        const flickerType = Math.floor(Math.random() * 3);

        if (flickerType === 0) {
          setAtmosphereFilter({ brightness: 0.69, contrast: 1.13, opacity: 0.985 });
          resetTimer = setTimeout(() => {
            if (isSubscribed) setAtmosphereFilter({ brightness: 0.72, contrast: 1.15, opacity: 1.0 });
          }, 160);
        } else if (flickerType === 1) {
          setAtmosphereFilter({ brightness: 0.755, contrast: 1.18, opacity: 1.0 });
          resetTimer = setTimeout(() => {
            if (isSubscribed) setAtmosphereFilter({ brightness: 0.72, contrast: 1.15, opacity: 1.0 });
          }, 120);
        } else {
          setAtmosphereFilter({ brightness: 0.745, contrast: 1.17, opacity: 1.0 });
          setTimeout(() => {
            if (isSubscribed) {
              setAtmosphereFilter({ brightness: 0.70, contrast: 1.14, opacity: 0.99 });
              resetTimer = setTimeout(() => {
                if (isSubscribed) setAtmosphereFilter({ brightness: 0.72, contrast: 1.15, opacity: 1.0 });
              }, 130);
            }
          }, 85);
        }

        runOrganicFlicker();
      }, selectedDelay);
    };

    runOrganicFlicker();

    return () => {
      isSubscribed = false;
      clearTimeout(flickerTimer);
      clearTimeout(resetTimer);
    };
  }, [isReducedMotion]);

  // 4. Mouse Proximity & Interactive Displacement Engine (Desktop Only)
  const handleMouseMove = useCallback((e) => {
    if (isReducedMotion || (typeof window !== 'undefined' && window.innerWidth < 768)) return;
    if (!heroRef.current) return;

    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized coordinates [-1, 1] relative to hero center
    const normX = ((x / rect.width) - 0.5) * 2;
    const normY = ((y / rect.height) - 0.5) * 2;

    mouseState.current.targetX = normX;
    mouseState.current.targetY = normY;
    mouseState.current.cursorClientX = e.clientX;
    mouseState.current.cursorClientY = e.clientY;
    mouseState.current.isHoveringHero = true;

    // Check proximity to Logo for rare subtle red detail
    if (logoContainerRef.current) {
      const logoRect = logoContainerRef.current.getBoundingClientRect();
      const isNearLogo = 
        e.clientX >= logoRect.left - 40 &&
        e.clientX <= logoRect.right + 40 &&
        e.clientY >= logoRect.top - 40 &&
        e.clientY <= logoRect.bottom + 40;

      const now = performance.now();
      if (isNearLogo && now - mouseState.current.lastRedDetailTime > 4500 && Math.random() < 0.35) {
        mouseState.current.lastRedDetailTime = now;
        const relativePercent = Math.max(10, Math.min(85, ((e.clientX - logoRect.left) / logoRect.width) * 100));
        setRedDetailStyle({
          left: `${relativePercent}%`,
          width: `${30 + Math.random() * 35}px`,
          opacity: 0.85
        });
        setRedDetailVisible(true);
        setTimeout(() => setRedDetailVisible(false), 380);
      }
    }
  }, [isReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    mouseState.current.targetX = 0;
    mouseState.current.targetY = 0;
    mouseState.current.isHoveringHero = false;
    mouseState.current.isHoveringLogo = false;
    setIsHoveredLogo(false);
  }, []);

  // 5. Continuous 60fps/120fps Animation Loop with Smooth Damped Interpolation (Lerp)
  useEffect(() => {
    if (isReducedMotion) return;

    const logoContainer = logoContainerRef.current;
    const heroEl = heroRef.current;
    if (!heroEl) return;

    const slices = logoContainer ? Array.from(logoContainer.querySelectorAll('.wordmark-segment')) : [];
    const photoEl = heroEl.querySelector('.hero-bg-photo');

    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      const m = mouseState.current;
      // Damped lerp: smoothly chase target position
      m.currentX += (m.targetX - m.currentX) * 0.085;
      m.currentY += (m.targetY - m.currentY) * 0.085;

      // Subtle Background Photo Parallax (opposite 1.5px to 2.5px displacement)
      if (photoEl) {
        const photoDisplaceX = m.currentX * -2.2;
        const photoDisplaceY = m.currentY * -2.0;
        const photoScrollY = scrollProgress * 38;
        const photoScale = 1.02 + scrollProgress * 0.035;
        photoEl.style.transform = `translate3d(${photoDisplaceX.toFixed(2)}px, ${(photoDisplaceY + photoScrollY).toFixed(2)}px, 0) scale(${photoScale.toFixed(3)})`;
      }

      // Segmented Wordmark Magnetic Displacement
      if (logoContainer && slices.length > 0) {
        const logoRect = logoContainer.getBoundingClientRect();
        const cursorX = m.cursorClientX;
        const isHovered = m.isHoveringLogo;

        slices.forEach((slice, idx) => {
          // Calculate horizontal segment center in screen coordinates
          const segmentWidth = logoRect.width / NUM_SEGMENTS;
          const segmentCenterX = logoRect.left + (idx + 0.5) * segmentWidth;

          // Proximity factor (peaks near cursor, decays smoothly across distance)
          const distToCursor = Math.abs(cursorX - segmentCenterX);
          const proximityWeight = m.isHoveringHero ? Math.max(0, 1 - distToCursor / (segmentWidth * 3.5)) : 0;

          // Displacement: Base magnetic 2-5px normal, up to 8-10px maximum
          const segmentDisplaceX = (m.currentX * 4.5) + (m.currentX * 4.0 * proximityWeight);
          const segmentDisplaceY = (m.currentY * 3.2) + (m.currentY * 3.5 * proximityWeight);
          const microScale = isHovered ? 1.008 : 1.0;

          slice.style.transform = `translate3d(${segmentDisplaceX.toFixed(2)}px, ${segmentDisplaceY.toFixed(2)}px, 0) scale(${microScale})`;
        });
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scrollProgress, isReducedMotion]);

  // Dynamic Scroll Transformation Math for the Giant Wordmark
  const wordmarkScrollScale = (1 - scrollProgress * 0.075).toFixed(3);
  const wordmarkScrollY = (-scrollProgress * 28).toFixed(1);
  const wordmarkScrollOpacity = (1 - scrollProgress * 0.18).toFixed(2);

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-screen bg-[#080808] text-[#EDE7DC] flex flex-col justify-between select-none overflow-hidden pt-24 sm:pt-28 pb-12 sm:pb-16 px-5 sm:px-10 lg:px-14"
    >
      
      {/* ============================================================ */}
      {/* LAYER 1: CENTRAL HIGH-CONTRAST CAMPAIGN PHOTOGRAPH           */}
      {/* ============================================================ */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <img
          src={campaignShoot01}
          alt="Loozars 07 Campaign Hero"
          className="hero-bg-photo w-full h-full object-cover object-[center_35%] sm:object-[center_28%] will-change-transform"
          style={{
            filter: `contrast(${atmosphereFilter.contrast}) brightness(${atmosphereFilter.brightness})`,
            opacity: atmosphereFilter.opacity,
            transition: 'filter 160ms cubic-bezier(0.4, 0, 0.2, 1), opacity 160ms ease-out'
          }}
          loading="eager"
        />

        {/* Soft Vignette Gradients & Analog Light Fall-Off */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/75 via-transparent to-[#080808]/75 pointer-events-none" />
      </div>

      {/* ============================================================ */}
      {/* LAYER 2: CINEMATIC MONOCHROMATIC FILM GRAIN TEXTURE          */}
      {/* ============================================================ */}
      <div 
        className="absolute inset-0 z-[2] pointer-events-none opacity-[0.038] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
        aria-hidden="true"
      />

      {/* ============================================================ */}
      {/* LAYER 3: TOP EDITORIAL METADATA & MANIFESTOS                 */}
      {/* ============================================================ */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Top-Left: Section Index & Headline */}
        <div className="md:col-span-5 space-y-3 font-mono">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] text-[#EDE7DC]/70">
            <span>01</span>
            <span className="w-8 h-[1px] bg-[#EDE7DC]/40 inline-block"></span>
          </div>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.22em] leading-relaxed text-[#EDE7DC] max-w-xs uppercase">
            STREETWEAR<br />
            FOR THE<br />
            RESTLESS<br />
            GENERATION.
          </p>
        </div>

        {/* Top-Right: Parking Lot Group Inset + Slanted Script Note */}
        <div className="md:col-span-7 flex flex-col items-end space-y-3">
          
          {/* Tilted / Angled Group Inset Frame */}
          <div className="relative w-48 sm:w-56 aspect-[16/10] bg-[#121212] border border-white/20 overflow-hidden shadow-2xl group">
            <img 
              src={campaignShoot03} 
              alt="Night Streetwear Session" 
              className="w-full h-full object-cover filter contrast-[1.18] brightness-90 group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Slanted Handwritten Text */}
          <div className="text-right space-y-1 pr-1">
            <p className="font-handwriting font-bold text-xl sm:text-2xl text-[#EDE7DC] tracking-wide -rotate-3 leading-tight">
              SAME PEOPLE.<br />
              DIFFERENT NIGHTS.
            </p>
            <div className="w-12 h-[1px] bg-[#EDE7DC]/40 ml-auto" />
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* LAYER 4: MID-LEFT INSET TAILLIGHT/HAND DETAIL + GEOLOCATION  */}
      {/* ============================================================ */}
      <div className="relative z-10 hidden sm:block max-w-xs space-y-2 my-auto -mt-6">
        <div className="w-20 sm:w-24 aspect-[16/10] bg-[#111] border border-white/15 overflow-hidden">
          <img 
            src={campaignShoot02} 
            alt="Hand / Steering Detail" 
            className="w-full h-full object-cover filter contrast-125"
          />
        </div>
        <div className="font-mono text-[9px] text-[#EDE7DC]/60 tracking-[0.2em] uppercase leading-tight">
          26.4499° N<br />
          80.3319° E<br />
          KANPUR
        </div>
      </div>

      {/* ============================================================ */}
      {/* LAYER 5: INTERACTIVE GIANT LOOZARS WORDMARK + CTA CONTROLS   */}
      {/* ============================================================ */}
      <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 gap-6 items-end mt-auto pt-8 sm:pt-16">
        
        {/* Bottom Left Spacer */}
        <div className="md:col-span-2 hidden md:block" />

        {/* Center: Massive Iconic LOOZARS Gothic/Serif Wordmark with Proximity Interaction */}
        <div className="md:col-span-8 flex flex-col items-center justify-center -mb-8 sm:-mb-14">
          <div 
            ref={logoContainerRef}
            onMouseEnter={() => {
              mouseState.current.isHoveringLogo = true;
              setIsHoveredLogo(true);
            }}
            onMouseLeave={() => {
              mouseState.current.isHoveringLogo = false;
              setIsHoveredLogo(false);
            }}
            className="relative w-full max-w-[650px] lg:max-w-[760px] select-none text-center cursor-default transition-all duration-300"
            style={{
              transform: `translate3d(0, ${wordmarkScrollY}px, 0) scale(${wordmarkScrollScale})`,
              opacity: wordmarkScrollOpacity,
              willChange: 'transform, opacity'
            }}
          >
            {/* Primary Base Distressed Wordmark Layer */}
            <img 
              src={loozarsLogoImg} 
              alt="LOOZARS®" 
              className={`w-full h-auto object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)] transition-all duration-300 pointer-events-none ${
                isHoveredLogo ? 'brightness-130 contrast-155' : 'brightness-125 contrast-150'
              }`}
              loading="eager"
            />

            {/* Seamless Sliced Visual Segments (Enables Regional Proximity Shifts) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              {Array.from({ length: NUM_SEGMENTS }).map((_, idx) => {
                const leftPercent = (idx * (100 / NUM_SEGMENTS)).toFixed(4);
                const rightPercent = ((NUM_SEGMENTS - 1 - idx) * (100 / NUM_SEGMENTS)).toFixed(4);
                return (
                  <div
                    key={idx}
                    className="wordmark-segment absolute inset-0 will-change-transform"
                    style={{
                      clipPath: `inset(0% ${rightPercent}% 0% ${leftPercent}%)`,
                      WebkitClipPath: `inset(0% ${rightPercent}% 0% ${leftPercent}%)`
                    }}
                  >
                    <img 
                      src={loozarsLogoImg} 
                      alt="" 
                      className={`w-full h-auto object-contain filter transition-all duration-300 ${
                        isHoveredLogo ? 'brightness-130 contrast-155' : 'brightness-125 contrast-150'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Signature Deep Red Detail: Hairline Scratch/Light Pass */}
            {redDetailVisible && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 h-[1.5px] bg-[#A62626] rounded-full pointer-events-none transition-all duration-300 mix-blend-screen shadow-[0_0_8px_#A62626]"
                style={{
                  left: redDetailStyle.left,
                  width: redDetailStyle.width,
                  opacity: redDetailStyle.opacity
                }}
              />
            )}
          </div>
        </div>

        {/* Bottom-Right: Minimal CTA + Contact Sheet Frames */}
        <div className="md:col-span-2 flex flex-col items-end space-y-3">
          
          {/* Minimalist CTA Button */}
          <button
            onClick={scrollToDrop}
            className="group font-mono text-[11px] sm:text-xs tracking-[0.22em] text-[#EDE7DC] hover:text-[#8E1717] uppercase transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>[ DROP 01 LIVE NOW ]</span>
          </button>

          {/* 3 Contact Sheet Micro-Thumbnails + Circled Arrow */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-sm border border-white/10">
              {heroThumbnails.map((thumb) => (
                <button
                  key={thumb.id}
                  onClick={() => setActiveThumb(thumb.id)}
                  className={`w-8 h-6 border transition-all overflow-hidden cursor-pointer ${
                    activeThumb === thumb.id ? 'border-[#8E1717]' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={thumb.img} alt={thumb.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <button
              onClick={scrollToDrop}
              className="w-7 h-7 rounded-full border border-white/20 hover:border-white text-[#EDE7DC] flex items-center justify-center transition-all hover:bg-white/10 cursor-pointer"
              aria-label="Explore drop"
            >
              <ArrowRight size={12} />
            </button>
          </div>

        </div>

      </div>

    </section>
  );
};

