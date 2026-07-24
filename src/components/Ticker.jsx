import React, { useState } from 'react';
import { Logo } from './Logo';

export function Ticker({ 
  items = [
    "Essensa Naturale: 16 Years of Organic Way of Living",
    "Celebrating 16 Years of Wellness, Credibility, and Prosperity"
  ],
  logoUrl = '',
  tickerRightLogoUrl = '',
  speed = 60,
  className = '' 
}) {
  const combinedText = items.join("  •  ");
  
  // Calculate aligned animation start delay relative to system time
  const [delay] = useState(() => -((Date.now() / 1000) % speed));

  return (
    <div
      className={`absolute bottom-0 left-0 w-[1920px] h-[90px] z-40 bg-transparent select-none overflow-hidden ${className}`}
    >
      {/* 1. Dedicated Non-Moving White Logo Block on the Left (90px height) */}
      <div 
        className="absolute left-0 bottom-0 w-[260px] h-[90px] flex items-center pl-8 pr-12 z-50"
        style={{ filter: 'drop-shadow(0px 6px 20px rgba(0, 0, 0, 0.65))' }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 260 90">
          <polygon points="0,0 228,0 260,90 0,90" fill="#ffffff" />
          <polyline points="228,0 260,90 0,90" fill="none" stroke="#D4AF37" strokeWidth="4" />
        </svg>
        {/* Full Essensa Naturale logo (charcoal text on clean white backdrop) */}
        <Logo showText={true} light={false} logoUrl={logoUrl} className="relative z-10 scale-110 origin-left" />
      </div>

      {/* 2. Central Recessed Scrolling Ticker Channel (80px height, starts at 228px, ends at 1920-228 = 1692px) */}
      <div 
        className="absolute bottom-0 left-[228px] right-[228px] h-[80px] bg-brand-charcoal text-white flex items-center border-t border-black/20 shadow-[0_-8px_24px_rgba(0,0,0,0.15)] select-none overflow-hidden z-40"
      >
        {/* Scrolling Marquee Area */}
        <div className="flex-1 h-full flex items-center overflow-hidden bg-brand-charcoal relative">
          <div key={`${combinedText}_${speed}`} className="marquee-container text-2xl font-black tracking-widest text-white uppercase flex items-center">
            {/* Scroll items twice to ensure infinite, seamless repeating loops */}
            <div className="marquee-content gap-8 flex items-center pr-8" style={{ animationDuration: `${speed}s`, animationDelay: `${delay}s` }}>
              <span>{combinedText}</span>
              <span>•</span>
              <span>{combinedText}</span>
              <span>•</span>
            </div>
            <div className="marquee-content gap-8 flex items-center pr-8" aria-hidden="true" style={{ animationDuration: `${speed}s`, animationDelay: `${delay}s` }}>
              <span>{combinedText}</span>
              <span>•</span>
              <span>{combinedText}</span>
              <span>•</span>
            </div>
          </div>
          
          {/* Symmetrical left and right edge fade overlays for premium scrolling text transitions */}
          <div className="absolute top-0 left-0 h-full w-12 bg-gradient-to-r from-brand-charcoal to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-brand-charcoal to-transparent pointer-events-none z-10" />
        </div>
      </div>

      {/* 3. Mirrored Dedicated White Sponsor Logo Block on the Right (90px height) */}
      <div 
        className="absolute right-0 bottom-0 w-[260px] h-[90px] flex items-center justify-center pl-12 pr-8 z-50"
        style={{ filter: 'drop-shadow(0px 6px 20px rgba(0, 0, 0, 0.65))' }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 260 90">
          <polygon points="32,0 260,0 260,90 0,90" fill="#ffffff" />
          <polyline points="260,90 0,90 32,0" fill="none" stroke="#D4AF37" strokeWidth="4" />
        </svg>
        {tickerRightLogoUrl ? (
          <img src={tickerRightLogoUrl} className="h-[82px] max-w-[210px] object-contain relative z-10" alt="Sponsor Logo" />
        ) : (
          <div className="text-zinc-400 font-display font-black text-[10px] uppercase tracking-wider bg-zinc-100/60 px-3.5 py-1.5 rounded border border-zinc-250 relative z-10 select-none">
            Sponsor Logo
          </div>
        )}
      </div>
    </div>
  );
}

export default Ticker;
