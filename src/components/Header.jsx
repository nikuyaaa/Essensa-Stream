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
      style={{ filter: 'drop-shadow(0 16px 24px rgba(0,0,0,0.25))' }}
    >
      {/* Top Center Geometric Angular Shield (Inverted Trapezoid) */}
      <div 
        className="bg-white flex items-center justify-center relative overflow-hidden"
        style={{ 
          width: '520px', 
          height: '110px',
          // 39px indent over 110px height perfectly matches the ~32/90 slope of the Ticker corners
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 39px) 100%, 39px 100%)' 
        }}
      >
        {/* Subtle Premium Shimmer Overlay */}
        <div className="absolute inset-0 shimmer-overlay opacity-30 animate-shimmer pointer-events-none" />

        {/* Scaled Logo Asset Container (85% of height/width max) */}
        {headerCenterLogoUrl ? (
          <img 
            src={headerCenterLogoUrl} 
            className="object-contain relative z-10" 
            style={{ height: '85%', maxWidth: '85%' }}
            alt="Top Header Shield Logo" 
          />
        ) : (
          <span className="text-2xl font-display font-black tracking-widest text-brand-charcoal uppercase select-none relative z-10">
            BEYOND TALKS
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default Header;
