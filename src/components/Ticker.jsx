import React from 'react';
import { Logo } from './Logo';

export function Ticker({ 
  items = [
    "Essensa Naturale: 16 Years of Organic Way of Living",
    "Empowering Filipino Networker-Entrepreneurs Worldwide",
    "Revitalizing Health with Non-Toxic, All-Natural organic products",
    "Celebrating 16 Years of Wellness, Credibility, and Prosperity"
  ],
  className = '' 
}) {
  const combinedText = items.join("  •  ");

  return (
    <div
      className={`absolute bottom-0 left-0 w-[1920px] h-[90px] z-40 bg-brand-charcoal text-white flex items-center border-t border-black/20 shadow-[0_-8px_24px_rgba(0,0,0,0.15)] select-none overflow-hidden ${className}`}
    >
      {/* 1. Dedicated Non-Moving White Logo Block on the Left */}
      <div 
        className="h-full bg-white flex items-center pl-8 pr-16 relative z-50 shrink-0 shadow-[4px_0_12px_rgba(0,0,0,0.15)]"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 32px) 0, 100% 100%, 0 100%)'
        }}
      >
        {/* Full Essensa Naturale logo (charcoal text on clean white backdrop) */}
        <Logo showText={true} light={false} className="relative z-10 scale-110 origin-left" />
      </div>

      {/* 2. Scrolling Marquee Area */}
      <div className="flex-1 h-full flex items-center overflow-hidden bg-brand-charcoal relative">
        <div className="marquee-container text-2xl font-black tracking-widest text-white uppercase flex items-center">
          {/* Scroll items twice to ensure infinite, seamless repeating loops */}
          <div className="marquee-content gap-24 flex items-center pr-24">
            <span>{combinedText}</span>
            <span>•</span>
            <span>{combinedText}</span>
            <span>•</span>
          </div>
          <div className="marquee-content gap-24 flex items-center pr-24" aria-hidden="true">
            <span>{combinedText}</span>
            <span>•</span>
            <span>{combinedText}</span>
            <span>•</span>
          </div>
        </div>
        
        {/* Soft edge fade overlay */}
        <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-brand-charcoal to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}

export default Ticker;
