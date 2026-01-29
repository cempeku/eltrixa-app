
import React from 'react';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg', white?: boolean, withMargin?: boolean }> = ({ size = 'md', white = false, withMargin = false }) => {
  const containerSizes = {
    sm: 'h-14 text-xl',
    md: 'h-24 text-3xl',
    lg: 'h-40 text-5xl'
  };
  
  const logoSizes = {
    sm: 50,
    md: 90,
    lg: 140
  };

  return (
    <div className={`flex flex-col items-center justify-center font-black tracking-tighter ${containerSizes[size]} ${white ? 'text-white' : 'text-cyan-400'} ${withMargin ? 'mt-8' : ''}`}>
      <div className="relative mb-3">
        {/* Glow effect behind the logo */}
        <div className="absolute inset-0 bg-blue-500/20 blur-[30px] rounded-full animate-glow"></div>
        
        <svg 
          width={logoSizes[size]} 
          height={logoSizes[size]} 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="neon">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Hexagon Outer Frame */}
          <path 
            d="M100 15 L173.6 57.5 L173.6 142.5 L100 185 L26.4 142.5 L26.4 57.5 Z" 
            stroke="url(#logoGrad)" 
            strokeWidth="5" 
            fill="rgba(15, 23, 42, 0.4)"
            filter="url(#neon)"
          />
          
          {/* Inner Circuit Patterns */}
          <g opacity="0.4" stroke="url(#logoGrad)" strokeWidth="1.5">
            <path d="M60 45 L80 45 M80 45 L90 35 M50 100 L70 100 M130 155 L150 155" />
            <circle cx="60" cy="45" r="3" fill="url(#logoGrad)" />
            <circle cx="90" cy="35" r="3" fill="url(#logoGrad)" />
            <circle cx="150" cy="155" r="3" fill="url(#logoGrad)" />
            <path d="M140 45 L120 45 M120 45 L110 35 M150 100 L130 100 M70 155 L50 155" />
            <circle cx="140" cy="45" r="3" fill="url(#logoGrad)" />
            <circle cx="110" cy="35" r="3" fill="url(#logoGrad)" />
            <circle cx="50" cy="155" r="3" fill="url(#logoGrad)" />
          </g>

          {/* Stylized 'E' and 'X' parts */}
          <g filter="url(#neon)">
            {/* Left side part (E-like) */}
            <path d="M65 75 H90 M65 100 H85 M65 125 H90 M65 75 V125" stroke="url(#logoGrad)" strokeWidth="6" strokeLinecap="round" />
            {/* Right side part (X-like) */}
            <path d="M115 75 L145 125 M145 75 L115 125" stroke="url(#logoGrad)" strokeWidth="6" strokeLinecap="round" />
          </g>

          {/* Large Lightning Bolt in center */}
          <path 
            d="M115 20 L80 105 H110 L85 180 L135 90 H105 L115 20Z" 
            fill="url(#logoGrad)" 
            filter="url(#neon)"
            className="animate-pulse"
          />
        </svg>
      </div>

      <div className="flex flex-col items-center">
        <span 
          className="tracking-[0.2em] font-black italic drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]"
          style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: 'linear-gradient(to bottom, #fff, #93c5fd, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.15em'
          }}
        >
          ELTRIXA
        </span>
        {/* Adjusted mt-1 (originally mt-2) to bring the subtext closer to the brand name */}
        <span className="text-[6.5px] font-bold uppercase tracking-[0.1em] text-blue-400/80 mt-1 max-w-[280px] text-center leading-tight">
          Sistem Pencarian Data Pelanggan, Input Data TRX PLN Mobile, Download Draft Tunggakan
        </span>
      </div>
    </div>
  );
};
