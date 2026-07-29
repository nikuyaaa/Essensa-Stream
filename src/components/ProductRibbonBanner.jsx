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
        <div 
          className="absolute bottom-[95px] right-12 w-[620px] h-[84px] z-30 pointer-events-auto select-none cursor-pointer"
          onDoubleClick={onDoubleClick}
        >
          {/* LAYER 1: Secondary Beyond Talks Purple Offset Accent Plate (Bottom / Right-focused) */}
          <motion.div
            key={`skew-accent-${triggerKey}`}
            initial={{ x: 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 450, opacity: 0 }}
            transition={{ 
              duration: 0.55, 
              ease: [0.16, 1, 0.3, 1],
              exit: { delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }
            }}
            className="absolute bottom-0 right-0 w-[560px] h-[38px] bg-gradient-to-r from-[#7B3FE4] via-[#9D5CFF] to-[#4A2080] rounded-r-xl shadow-[0_8px_25px_rgba(123,63,228,0.4)] border border-[#9D5CFF]/60 flex items-center justify-between px-6 -skew-x-[12deg] z-10"
          >
            {/* Un-skewed Accent Content */}
            <div className="skew-x-[12deg] flex items-center justify-between w-full text-white font-mono font-black tracking-wider">
              <span className="bg-[#120924] text-[#9D5CFF] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-[#9D5CFF]/40 shadow-sm">
                {badgeText || "FEATURED PRODUCT"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-[#E2D1FF]">PRICE:</span>
                <span className="text-white text-2xl font-black text-shadow">{price}</span>
              </div>
            </div>
          </motion.div>

          {/* LAYER 2: Primary Skewed White Card (Top / Right-focused) */}
          <motion.div
            key={`skew-card-${triggerKey}`}
            initial={{ x: 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 450, opacity: 0 }}
            transition={{ 
              delay: 0.1,
              duration: 0.7, 
              ease: [0.34, 1.56, 0.64, 1], // Elastic Overshoot Snap
              exit: { delay: 0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
            }}
            className={`absolute top-0 right-4 w-[580px] h-[58px] bg-white border-l-4 border-b-2 border-[#9D5CFF] rounded-l-xl shadow-[-8px_8px_30px_rgba(18,9,36,0.3)] z-20 flex items-center justify-between px-6 -skew-x-[12deg] overflow-visible ${className}`}
          >
            {/* Liquid Sheen Sweep Layer */}
            <div className="absolute inset-0 pointer-events-none silk-sheen-overlay z-10 rounded-l-xl" />

            {/* Un-skewed Inner Content */}
            <div className="skew-x-[12deg] flex items-center justify-between w-full relative z-20">
              
              {/* Left Section: 3D Floating Product Cutout & Title */}
              <div className="flex items-center gap-4">
                {/* 3D Floating Product Thumbnail */}
                <div className="relative -mt-5 w-[76px] h-[76px] bg-white rounded-2xl border-2 border-[#9D5CFF] shadow-[0_8px_22px_rgba(157,92,255,0.45)] flex items-center justify-center p-1.5 z-30 shrink-0 animate-product-float">
                  {imageUrl ? (
                    (imageUrl.match(/\.(mp4|webm|ogg)$/i) || imageUrl.startsWith('data:video/')) ? (
                      <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                    ) : (
                      <img src={imageUrl} alt={name} className="w-full h-full object-contain filter drop-shadow-md" />
                    )
                  ) : (
                    /* Fallback SVG 3D Organic Bottle */
                    <svg viewBox="0 0 60 80" className="w-10 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="rightSkewBottleGrad" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#4A2080" />
                          <stop offset="70%" stopColor="#7B3FE4" />
                          <stop offset="100%" stopColor="#9D5CFF" />
                        </linearGradient>
                      </defs>
                      <rect x="23" y="10" width="14" height="10" rx="2" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                      <rect x="20" y="5" width="20" height="6" rx="1" fill="#7B3FE4" />
                      <rect x="12" y="20" width="36" height="52" rx="8" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                      <rect x="15" y="32" width="30" height="36" rx="4" fill="url(#rightSkewBottleGrad)" />
                      <path d="M30 38 C34 42, 34 46, 30 48 C26 46, 26 42, 30 38 Z" fill="#FFF" />
                    </svg>
                  )}
                </div>

                {/* Product Name & Subtext */}
                <div className="flex flex-col justify-center">
                  <h3 className="font-display font-black text-xl text-[#120924] tracking-wide uppercase leading-tight">
                    {name}
                  </h3>
                  <p className="font-sans text-[11px] font-extrabold text-zinc-600 tracking-wide line-clamp-1">
                    {subtext}
                  </p>
                </div>
              </div>

              {/* Right Tag Accent */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="w-2 h-2 rounded-full bg-[#9D5CFF] animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#7B3FE4]">SPOTLIGHT</span>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ProductRibbonBanner;
