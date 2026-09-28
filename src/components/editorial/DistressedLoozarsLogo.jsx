import React from 'react';

/**
 * Distressed, chiseled brutalist LOOZARS® Wordmark
 * Inspired by high-fashion underground magazine typography
 */
export const DistressedLoozarsLogo = ({ className = '' }) => {
  return (
    <div className={`relative select-none pointer-events-none ${className}`}>
      {/* Distressed SVG Wordmark with eroded texture & brutalist serif geometry */}
      <svg 
        viewBox="0 0 1000 240" 
        className="w-full h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Grunge / Distressed Texture Filter */}
          <filter id="distress-filter" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feComposite in="displaced" in2="noise" operator="arithmetic" k1="0" k2="1" k3="-0.15" k4="0" />
          </filter>
          
          {/* Linear Gradient with Ivory Bone Highlight */}
          <linearGradient id="loozars-bone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#EDE7DC" />
            <stop offset="100%" stopColor="#CFC8BD" />
          </linearGradient>
        </defs>

        <g filter="url(#distress-filter)" fill="url(#loozars-bone)">
          {/* L */}
          <path d="M 40 45 L 88 38 L 88 172 L 155 172 L 160 205 L 35 208 L 40 45 Z" />
          
          {/* O (1) */}
          <path d="M 175 125 C 175 60, 215 35, 275 35 C 335 35, 375 60, 375 125 C 375 190, 335 215, 275 215 C 215 215, 175 190, 175 125 Z M 235 125 C 235 170, 252 182, 275 182 C 298 182, 315 170, 315 125 C 315 80, 298 68, 275 68 C 252 68, 235 80, 235 125 Z" />
          
          {/* O (2) */}
          <path d="M 390 125 C 390 60, 430 35, 490 35 C 550 35, 590 60, 590 125 C 590 190, 550 215, 490 215 C 430 215, 390 190, 390 125 Z M 450 125 C 450 170, 467 182, 490 182 C 513 182, 530 170, 530 125 C 530 80, 513 68, 490 68 C 467 68, 450 80, 450 125 Z" />
          
          {/* Z */}
          <path d="M 605 48 L 710 40 L 710 75 L 642 168 L 718 168 L 722 205 L 600 208 L 600 175 L 670 78 L 605 78 Z" />

          {/* A */}
          <path d="M 728 205 L 778 40 L 832 40 L 882 205 L 835 205 L 824 165 L 782 165 L 772 205 Z M 792 132 L 815 132 L 805 75 Z" />

          {/* R */}
          <path d="M 885 45 L 945 40 C 975 40, 995 55, 995 85 C 995 110, 978 125, 950 130 L 995 205 L 950 205 L 912 138 L 912 205 L 878 205 Z M 918 72 L 918 112 L 940 112 C 958 112, 968 105, 968 92 C 968 79, 958 72, 940 72 Z" />

          {/* S */}
          <path d="M 1000 68 C 1000 45, 1020 35, 1050 35 C 1080 35, 1098 48, 1098 75 C 1098 120, 1025 115, 1025 155 C 1025 175, 1040 182, 1055 182 C 1070 182, 1085 172, 1088 152 L 1120 155 C 1115 195, 1090 215, 1055 215 C 1020 215, 992 195, 992 155 C 992 110, 1065 112, 1065 75 C 1065 58, 1052 52, 1040 52 C 1025 52, 1015 60, 1012 75 Z" transform="scale(0.88) translate(110, 10)" />
        </g>

        {/* Registered Trademark Circle ® */}
        <g fill="#EDE7DC" transform="translate(930, 40) scale(0.65)">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#EDE7DC" strokeWidth="3" />
          <text x="20" y="27" font-family="'Cinzel', 'Bodoni Moda', serif" font-size="20" font-weight="900" text-anchor="middle" fill="#EDE7DC">R</text>
        </g>
      </svg>
    </div>
  );
};
