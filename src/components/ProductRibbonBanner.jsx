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
        <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
          
          {/* =========================================================================
             STEP 2 & 3: BACK SVG RIBBON STRAND (Right-Wrap -> Left-Sweep)
             Enters right, wraps right card edge, shoots left across screen
             ========================================================================= */}
          <motion.div
            key={`organic-ribbon-back-${triggerKey}`}
            initial={{ x: '100%', opacity: 0, scaleX: 0.1 }}
            animate={{ x: '0%', opacity: 1, scaleX: 1 }}
            exit={{ x: '-2000px', opacity: 0 }}
            transition={{ 
              delay: 0.18,
              duration: 0.85, 
              ease: [0.25, 1, 0.5, 1],
              exit: { duration: 0.75, ease: [0.25, 1, 0.5, 1] }
            }}
            className="absolute bottom-[85px] left-0 right-0 h-[130px] pointer-events-none z-10 origin-right"
          >
            <svg 
              viewBox="0 0 1920 130" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-full h-full object-cover animate-wave-undulate"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Strand 1 Tapered Opacity Gradient */}
                <linearGradient id="rightWrapBackGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7B3FE4" stopOpacity="0" />
                  <stop offset="12%" stopColor="#7B3FE4" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#9D5CFF" stopOpacity="0.95" />
                  <stop offset="92%" stopColor="#E056FD" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#E056FD" stopOpacity="0" />
                </linearGradient>

                {/* Strand 2 Tapered Opacity Gradient */}
                <linearGradient id="rightWrapBackGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9D5CFF" stopOpacity="0" />
                  <stop offset="18%" stopColor="#9D5CFF" stopOpacity="0.75" />
                  <stop offset="70%" stopColor="#E056FD" stopOpacity="0.9" />
                  <stop offset="90%" stopColor="#7B3FE4" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#7B3FE4" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Tapered Ribbon Strand 1: Right-Wrap to Left-Sweep Geometry */}
              <path 
                d="M-60,65 C350,15 800,105 1300,25 C1650,75 1880,25 1960,45 C1900,65 1650,95 1300,55 C800,125 350,45 -60,65 Z" 
                fill="url(#rightWrapBackGrad1)" 
              />

              {/* Tapered Ribbon Strand 2 */}
              <path 
                d="M-20,40 C380,85 850,20 1350,75 C1700,25 1900,55 1940,40 C1900,65 1700,45 1350,100 C850,45 380,105 -20,40 Z" 
                fill="url(#rightWrapBackGrad2)" 
              />

              {/* Fine Accent Vector Pinstripe Tail */}
              <path 
                d="M-40,55 C360,40 820,70 1320,40 C1675,55 1890,35 1950,45" 
                stroke="#E2D1FF" 
                strokeWidth="2.5" 
                strokeOpacity="0.75"
              />
            </svg>
          </motion.div>

          {/* =========================================================================
             STEP 1: FLASHCARD & LEFT-SHIFTED PRICE POP (0s)
             Card pops in FIRST; Price is relocated to the LEFT SIDE (unobstructed)
             ========================================================================= */}
          <div 
            className="absolute bottom-[118px] right-12 w-[640px] z-20 pointer-events-auto cursor-pointer flex flex-col items-end"
            onDoubleClick={onDoubleClick}
          >
            {/* Main High-Contrast White Product Card */}
            <motion.div
              key={`product-pop-card-${triggerKey}`}
              initial={{ scale: 0, opacity: 0, x: 50 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ x: -2000, opacity: 1 }}
              transition={{ 
                duration: 0.45, 
                ease: [0.34, 1.56, 0.64, 1], // Elastic Scale Pop
                exit: { duration: 0.75, ease: [0.25, 1, 0.5, 1] }
              }}
              className={`relative w-[620px] h-[64px] bg-white border-l-4 border-b-2 border-[#9D5CFF] rounded-xl shadow-[0_10px_30px_rgba(18,9,36,0.4)] z-20 flex items-center justify-between px-6 -skew-x-[12deg] overflow-visible ${className}`}
            >
              {/* Liquid Sheen Sweep Layer */}
              <div className="absolute inset-0 pointer-events-none silk-sheen-overlay z-10 rounded-xl" />

              {/* Un-skewed Inner Content */}
              <div className="skew-x-[12deg] flex items-center justify-between w-full relative z-20">
                
                {/* Left Section: 3D Floating Product Cutout & Title */}
                <div className="flex items-center gap-5">
                  {/* 3D Floating Product Thumbnail */}
                  <div className="relative -mt-6 w-[80px] h-[80px] bg-white rounded-2xl border-2 border-[#9D5CFF] shadow-[0_8px_24px_rgba(157,92,255,0.45)] flex items-center justify-center p-1.5 z-30 shrink-0 animate-product-float">
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
                          <linearGradient id="rightWrapSpotlightBottleGrad" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#4A2080" />
                            <stop offset="70%" stopColor="#7B3FE4" />
                            <stop offset="100%" stopColor="#9D5CFF" />
                          </linearGradient>
                        </defs>
                        <rect x="23" y="10" width="14" height="10" rx="2" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                        <rect x="20" y="5" width="20" height="6" rx="1" fill="#7B3FE4" />
                        <rect x="12" y="20" width="36" height="52" rx="8" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                        <rect x="15" y="32" width="30" height="36" rx="4" fill="url(#rightWrapSpotlightBottleGrad)" />
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

            {/* STEP 1: RELOCATED PRICE TAG (LEFT SIDE) & BADGE PLATE */}
            <motion.div
              key={`product-pop-accent-${triggerKey}`}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ x: -2000, opacity: 1 }}
              transition={{ 
                delay: 0.08,
                duration: 0.45, 
                ease: [0.34, 1.56, 0.64, 1],
                exit: { duration: 0.65, ease: [0.25, 1, 0.5, 1] }
              }}
              className="relative w-[590px] h-[40px] -mt-3 bg-gradient-to-r from-[#7B3FE4] via-[#9D5CFF] to-[#4A2080] rounded-br-xl shadow-[0_8px_25px_rgba(123,63,228,0.4)] border border-[#9D5CFF]/60 flex items-center justify-between px-6 -skew-x-[12deg] z-20"
            >
              {/* Un-skewed Accent Content: PRICE IS NOW ON THE LEFT SIDE! */}
              <div className="skew-x-[12deg] flex items-center justify-between w-full text-white font-mono font-black tracking-wider pt-2">
                
                {/* LEFT SIDE: Relocated High-Contrast Price Tag (100% Unobstructed) */}
                <div className="flex items-center gap-2.5 z-30">
                  <span className="bg-[#120924] text-[#E2D1FF] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-[#9D5CFF]/40 shadow-sm">
                    PRICE
                  </span>
                  <span className="text-white text-2xl font-mono font-black tracking-wide drop-shadow-md">
                    {price}
                  </span>
                </div>

                {/* RIGHT SIDE: Featured Product Badge */}
                <span className="bg-[#120924]/80 text-[#9D5CFF] text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded border border-[#9D5CFF]/40 shadow-sm">
                  {badgeText || "FEATURED PRODUCT"}
                </span>

              </div>
            </motion.div>
          </div>

          {/* =========================================================================
             STEP 2: FRONT OVERLAPPING SVG RIBBON STRAND (Wraps Right Edge of Card)
             0.28s Delay: Loops around right vertical edge of white card
             ========================================================================= */}
          <motion.div
            key={`organic-ribbon-front-${triggerKey}`}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: '0%', opacity: 1 }}
            exit={{ x: '-2000px', opacity: 0 }}
            transition={{ 
              delay: 0.28,
              duration: 0.9, 
              ease: [0.25, 1, 0.5, 1],
              exit: { duration: 0.8, ease: [0.25, 1, 0.5, 1] }
            }}
            className="absolute bottom-[75px] left-0 right-0 h-[110px] pointer-events-none z-30"
          >
            <svg 
              viewBox="0 0 1920 110" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-full h-full object-cover animate-wave-undulate"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="rightWrapFrontGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E056FD" stopOpacity="0" />
                  <stop offset="20%" stopColor="#E056FD" stopOpacity="0.85" />
                  <stop offset="75%" stopColor="#7B3FE4" stopOpacity="0.95" />
                  <stop offset="90%" stopColor="#9D5CFF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#9D5CFF" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Overlapping Front Strand Path Wrapping Right Edge of Card */}
              <path 
                d="M10,55 C420,15 880,95 1380,30 C1720,80 1890,20 1950,35 C1910,52 1720,100 1380,60 C880,120 420,40 10,55 Z" 
                fill="url(#rightWrapFrontGrad)" 
              />
            </svg>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}

export default ProductRibbonBanner;
