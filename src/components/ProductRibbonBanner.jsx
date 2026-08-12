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
  animationSpeed = 0.65,
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
          className="absolute bottom-[118px] right-12 w-[640px] z-30 pointer-events-auto select-none cursor-pointer flex flex-col items-end"
          onDoubleClick={onDoubleClick}
        >
          {/* LAYER 1: Primary Skewed White Card (Top / Front) */}
          <motion.div
            key={`skew-card-${triggerKey}`}
            initial={{ x: 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -2000 }}
            transition={{ 
              duration: animationSpeed, 
              ease: [0.34, 1.56, 0.64, 1] // Elastic Overshoot Snap
            }}
            className={`relative w-[620px] h-[64px] bg-white border-l-4 border-b-2 border-[var(--product-accent)] rounded-tl-xl shadow-[-8px_8px_30px_rgba(18,9,36,0.35)] z-20 flex items-center justify-between px-6 -skew-x-[12deg] overflow-visible ${className}`}
          >
            {/* Liquid Sheen Sweep Layer */}
            <div className="absolute inset-0 pointer-events-none silk-sheen-overlay z-10 rounded-tl-xl" />

            {/* Un-skewed Inner Content */}
            <div className="skew-x-[12deg] flex items-center justify-between w-full relative z-20">
              
              {/* Left Section: 3D Floating Product Cutout & Title */}
              <div className="flex items-center gap-5">
                {/* 3D Floating Product Thumbnail */}
                <div className="relative -mt-6 w-[80px] h-[80px] bg-white rounded-2xl border-2 border-[var(--product-accent)] shadow-[0_8px_24px_var(--product-surface-tint)] flex items-center justify-center p-1.5 z-30 shrink-0 animate-product-float">
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
                        <linearGradient id="rightSpotlightBottleGrad" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="var(--product-secondary)" />
                          <stop offset="70%" stopColor="var(--product-primary)" />
                          <stop offset="100%" stopColor="var(--product-accent)" />
                        </linearGradient>
                      </defs>
                      <rect x="23" y="10" width="14" height="10" rx="2" fill="#FFFFFF" stroke="var(--product-primary)" strokeWidth="2" />
                      <rect x="20" y="5" width="20" height="6" rx="1" fill="var(--product-primary)" />
                      <rect x="12" y="20" width="36" height="52" rx="8" fill="#FFFFFF" stroke="var(--product-primary)" strokeWidth="2" />
                      <rect x="15" y="32" width="30" height="36" rx="4" fill="url(#rightSpotlightBottleGrad)" />
                      <path d="M30 38 C34 42, 34 46, 30 48 C26 46, 26 42, 30 38 Z" fill="#FFF" />
                    </svg>
                  )}
                </div>

                {/* Product Name & Subtext */}
                <div className="flex flex-col justify-center pl-1">
                  <h3 className="font-display font-extrabold text-2xl text-[#120924] tracking-[0.04em] uppercase leading-none">
                    {name}
                  </h3>
                  <p className="font-sans text-xs font-semibold text-[#3A3A4A] tracking-wide mt-1 line-clamp-1">
                    {subtext}
                  </p>
                </div>
              </div>

            </div>
          </motion.div>

          {/* LAYER 2: Secondary Beyond Talks Purple Offset Accent Plate (Bottom / Stepped) */}
          <motion.div
            key={`skew-accent-${triggerKey}`}
            initial={{ x: 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -2000 }}
            transition={{ 
              delay: animationSpeed * 0.12,
              duration: animationSpeed * 0.85, 
              ease: [0.16, 1, 0.3, 1]
            }}
            className="relative w-[590px] h-[40px] -mt-3 bg-gradient-to-r from-[var(--product-primary)] via-[var(--product-accent)] to-[var(--product-secondary)] rounded-br-xl shadow-[0_8px_25px_var(--product-surface-tint)] border border-[var(--product-accent)] flex items-center justify-between px-6 -skew-x-[12deg] z-10"
          >
            {/* Un-skewed Accent Content */}
            <div className="skew-x-[12deg] flex items-center justify-between w-full text-white font-mono font-black tracking-wider pt-2">
              {/* Left Badge */}
              <span className="bg-[#120924] text-[var(--product-accent)] text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded border border-[var(--product-accent)] shadow-sm">
                {badgeText || "FEATURED PRODUCT"}
              </span>

              {/* Right Price Tag Readout */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-[#E2D1FF]">PRICE:</span>
                <span className="text-white text-2xl font-mono font-black tracking-wide drop-shadow-md">{price}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ProductRibbonBanner;
