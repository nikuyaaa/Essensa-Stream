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
      className={`fixed bottom-0 left-0 w-full h-[54px] z-40 bg-brand-charcoal text-white flex items-center border-t border-black/20 shadow-[0_-8px_24px_rgba(0,0,0,0.15)] select-none overflow-hidden ${className}`}
    >
      {/* 1. Dedicated Non-Moving White Logo Block on the Left */}
      <div 
        className="h-full bg-white flex items-center pl-4 sm:pl-6 pr-8 sm:pr-12 relative z-50 shrink-0 shadow-[4px_0_12px_rgba(0,0,0,0.1)]"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 100%, 0 100%)'
        }}
      >
        {/* Full Essensa Naturale logo (charcoal text on clean white backdrop) */}
        <Logo showText={true} light={false} className="relative z-10 scale-75 sm:scale-90 origin-left" />
      </div>

      {/* 2. Scrolling Marquee Area */}
      <div className="flex-1 h-full flex items-center overflow-hidden bg-brand-charcoal relative">
        <div className="marquee-container text-xs sm:text-sm font-extrabold tracking-widest text-white uppercase flex items-center">
          {/* Scroll items twice to ensure infinite, seamless repeating loops */}
          <div className="marquee-content gap-16 flex items-center pr-16">
            <span>{combinedText}</span>
            <span>•</span>
            <span>{combinedText}</span>
            <span>•</span>
          </div>
          <div className="marquee-content gap-16 flex items-center pr-16" aria-hidden="true">
            <span>{combinedText}</span>
            <span>•</span>
            <span>{combinedText}</span>
            <span>•</span>
          </div>
        </div>
        
        {/* Soft edge fade overlay */}
        <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-brand-charcoal to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}

export default Ticker;
