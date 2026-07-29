import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ProductRibbonBanner({ 
  isVisible = false, 
  name = "Buah Merah Mix", 
  subtext = "Buah Merah Mix • All-Natural Organic Antioxidant",
  price = "₱350.00", 
  imageUrl = "", 
  badgeText = "FEATURED PRODUCT",
  triggerKey = 0,
  holdDuration = 12,
  sheenSpeed = 3.5,
  onAutoHide = null,
  onDoubleClick = null,
  className = '' 
}) {

  // Automatic slide-out after holdDuration seconds
  useEffect(() => {
    if (!isVisible || !holdDuration || holdDuration <= 0) return;

    const timer = setTimeout(() => {
      if (onAutoHide) onAutoHide();
    }, holdDuration * 1000);

    return () => clearTimeout(timer);
  }, [isVisible, holdDuration, triggerKey, onAutoHide]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={triggerKey || 'product-silk-ribbon'}
          initial={{ 
            clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
            opacity: 0.95
          }}
          animate={{ 
            clipPath: 'polygon(0% 0, 100% 0, 100% 100%, 0% 100%)',
            opacity: 1
          }}
          exit={{ 
            clipPath: 'polygon(0% 0, 0% 0, 0% 100%, 0% 100%)',
            opacity: 0
          }}
          transition={{ 
            duration: 0.95, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className={`absolute bottom-[90px] left-0 w-[1920px] h-[75px] bg-white shadow-[0_-8px_32px_rgba(18,9,36,0.25)] z-30 flex items-center justify-between px-10 select-none cursor-pointer overflow-hidden ${className}`}
          onDoubleClick={onDoubleClick}
        >
          {/* 1. Continuous Liquid Sheen Sweep Layer */}
          <div 
            className="absolute inset-0 pointer-events-none silk-sheen-overlay z-10" 
            style={{ animationDuration: `${sheenSpeed || 3.5}s` }}
          />

          {/* 2. Running Gradient Accent Bottom Pinstripe */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] animated-pinstripe z-20" />

          {/* 3. Trailing Electric Purple Leading Edge Accents */}
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#9D5CFF] shadow-[0_0_15px_#9D5CFF] z-20" />
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-[#9D5CFF] shadow-[0_0_15px_#9D5CFF] z-20" />

          {/* 4. Left Section: 3D Floating Product Cutout & Title */}
          <div className="flex items-center gap-6 relative z-20">
            <div className="relative -mt-6 w-[88px] h-[88px] bg-white rounded-2xl border-2 border-[#9D5CFF] shadow-[0_8px_24px_rgba(157,92,255,0.4)] flex items-center justify-center p-2 z-20 shrink-0 animate-product-float">
              {imageUrl ? (
                (imageUrl.match(/\.(mp4|webm|ogg)$/i) || imageUrl.startsWith('data:video/')) ? (
                  <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                ) : (
                  <img src={imageUrl} alt={name} className="w-full h-full object-contain filter drop-shadow-md" />
                )
              ) : (
                /* Fallback SVG 3D Organic Bottle */
                <svg viewBox="0 0 60 80" className="w-12 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="silkBottleGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#4A2080" />
                      <stop offset="70%" stopColor="#7B3FE4" />
                      <stop offset="100%" stopColor="#9D5CFF" />
                    </linearGradient>
                  </defs>
                  <rect x="23" y="10" width="14" height="10" rx="2" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                  <rect x="20" y="5" width="20" height="6" rx="1" fill="#7B3FE4" />
                  <rect x="12" y="20" width="36" height="52" rx="8" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                  <rect x="15" y="32" width="30" height="36" rx="4" fill="url(#silkBottleGrad)" />
                  <path d="M30 38 C34 42, 34 46, 30 48 C26 46, 26 42, 30 38 Z" fill="#FFF" />
                </svg>
              )}
            </div>

            {/* Center Section: Product Name & Subtext Details */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <span className="bg-[#120924] text-[#9D5CFF] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-[#9D5CFF]/40 shadow-sm">
                  {badgeText || "FEATURED PRODUCT"}
                </span>
                <h3 className="font-display font-black text-2xl text-[#120924] tracking-wide uppercase leading-none">
                  {name}
                </h3>
              </div>
              <p className="font-sans text-sm font-bold text-zinc-600 tracking-wide mt-1">
                {subtext}
              </p>
            </div>
          </div>

          {/* 5. Right Section: Beyond Talks Purple Price Badge */}
          <div className="flex items-center gap-4 relative z-20">
            <div className="bg-gradient-to-r from-[#7B3FE4] to-[#4A2080] text-white font-mono font-black text-2xl px-7 py-2 rounded-xl shadow-lg border border-[#9D5CFF]/40 tracking-wider flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-[#E2D1FF]">PRICE:</span>
              <span>{price}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProductRibbonBanner;
