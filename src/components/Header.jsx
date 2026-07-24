import React from 'react';
import { motion } from 'framer-motion';

export function Header({ 
  headerCenterLogoUrl = '',
  className = '' 
}) {
  return (
    <motion.div
      initial={{ y: -120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -120, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-start ${className}`}
      style={{ filter: 'drop-shadow(0px 6px 20px rgba(0, 0, 0, 0.65))' }}
    >
      {/* Top Center Geometric Angular Shield (80px shallower height) */}
      <div className="relative flex items-center justify-center w-[520px] h-[80px]">
        {/* SVG Background for crisp rendering of the trapezoid and the 2px Broadcast Gold pinstripe */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 520 80">
          <polygon points="0,0 520,0 492,80 28,80" fill="#ffffff" />
          <polyline points="0,0 28,80 492,80 520,0" fill="none" stroke="#D4AF37" strokeWidth="4" />
        </svg>

        {/* Subtle Premium Shimmer Overlay constrained to the shield shape */}
        <div 
          className="absolute inset-0 shimmer-overlay opacity-30 animate-shimmer pointer-events-none" 
          style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 28px) 100%, 28px 100%)' }}
        />

        {/* Scaled Logo Asset Container (85% of shallower height max) */}
        {headerCenterLogoUrl ? (
          <img 
            src={headerCenterLogoUrl} 
            className="object-contain relative z-10 mt-[-4px]" 
            style={{ height: '80%', maxWidth: '85%' }}
            alt="Top Header Shield Logo" 
          />
        ) : (
          <span className="text-2xl font-display font-black tracking-widest text-brand-charcoal uppercase select-none relative z-10 mt-[-4px]">
            BEYOND TALKS
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default Header;
