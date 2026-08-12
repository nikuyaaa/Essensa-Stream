import React, { useEffect, useRef } from 'react';
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
             STAGE 2 & 3: DYNAMIC SVG PATH-DRAWN RIBBON ENGINE (Zero translateX)
             Strokes draw along Bezier curves using stroke-dashoffset animation,
             then morph control points in a live sine-wave idle loop.
             ========================================================================= */}
          <motion.svg
            key={`ribbon-svg-engine-${triggerKey}`}
            viewBox="0 0 1920 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-[80px] left-0 w-full h-[120px] pointer-events-none z-10"
            preserveAspectRatio="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              exit: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
            }}
          >
            <defs>
              {/* Tapered Opacity Gradients for Stroke Strands */}
              <linearGradient id="morphStrokeGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7B3FE4" stopOpacity="0" />
                <stop offset="8%" stopColor="#7B3FE4" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#9D5CFF" stopOpacity="1" />
                <stop offset="88%" stopColor="#E056FD" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#E056FD" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="morphStrokeGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E056FD" stopOpacity="0" />
                <stop offset="12%" stopColor="#E056FD" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#7B3FE4" stopOpacity="1" />
                <stop offset="90%" stopColor="#9D5CFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#9D5CFF" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="morphStrokeGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A2080" stopOpacity="0" />
                <stop offset="15%" stopColor="#4A2080" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#9D5CFF" stopOpacity="0.9" />
                <stop offset="85%" stopColor="#E2D1FF" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#E2D1FF" stopOpacity="0" />
              </linearGradient>

              {/* Tapered Fill Gradients for Closed Ribbon Paths */}
              <linearGradient id="morphFillGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7B3FE4" stopOpacity="0" />
                <stop offset="10%" stopColor="#7B3FE4" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#9D5CFF" stopOpacity="0.7" />
                <stop offset="90%" stopColor="#E056FD" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#E056FD" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="morphFillGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9D5CFF" stopOpacity="0" />
                <stop offset="15%" stopColor="#9D5CFF" stopOpacity="0.4" />
                <stop offset="55%" stopColor="#E056FD" stopOpacity="0.6" />
                <stop offset="88%" stopColor="#7B3FE4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#7B3FE4" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* FILLED RIBBON STRAND 1: Closed Tapered Path with Live Morphing */}
            <path 
              className="filled-ribbon-morph-1"
              d="M0,60 C200,20 450,100 700,40 C950,80 1200,10 1500,70 C1700,30 1860,60 1920,50 L1920,80 C1700,60 1500,90 1200,40 C950,100 700,60 450,110 C200,50 0,80 0,60 Z"
              fill="url(#morphFillGrad1)"
            />

            {/* FILLED RIBBON STRAND 2: Offset Staggered Closed Path */}
            <path 
              className="filled-ribbon-morph-2"
              d="M0,45 C250,85 500,5 750,65 C1000,25 1300,90 1550,35 C1750,75 1880,30 1920,45 L1920,70 C1880,55 1750,85 1550,55 C1300,100 1000,45 750,80 C500,25 250,95 0,60 Z"
              fill="url(#morphFillGrad2)"
            />

            {/* STROKE-DRAWN RIBBON STRAND 1: Primary Bold Path Draw */}
            <path 
              className="ribbon-morph-1"
              d="M0,60 C200,20 450,100 700,40 C950,80 1200,10 1500,70 C1700,30 1860,60 1920,50"
              stroke="url(#morphStrokeGrad1)"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />

            {/* STROKE-DRAWN RIBBON STRAND 2: Secondary Offset Draw */}
            <path 
              className="ribbon-morph-2"
              d="M0,45 C250,85 500,5 750,65 C1000,25 1300,90 1550,35 C1750,75 1880,30 1920,45"
              stroke="url(#morphStrokeGrad2)"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />

            {/* STROKE-DRAWN RIBBON STRAND 3: Fine Accent Pinstripe */}
            <path 
              className="ribbon-morph-3"
              d="M0,55 C300,30 600,75 900,30 C1100,65 1400,15 1650,55 C1800,25 1900,50 1920,48"
              stroke="url(#morphStrokeGrad3)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </motion.svg>

          {/* =========================================================================
             STAGE 1: FLASHCARD POP & PRICE RELOCATION (0s)
             Card pops in FIRST with elastic overshoot. Price is far LEFT, z-50.
             ========================================================================= */}
          <div 
            className="absolute bottom-[118px] right-12 w-[640px] z-40 pointer-events-auto cursor-pointer flex flex-col items-end"
            onDoubleClick={onDoubleClick}
          >
            {/* Main White Flashcard */}
            <motion.div
              key={`product-pop-card-${triggerKey}`}
              initial={{ scale: 0, opacity: 0, x: 50 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0, x: 50 }}
              transition={{ 
                duration: 0.45, 
                ease: [0.34, 1.56, 0.64, 1],
                exit: { duration: 0.35, ease: [0.55, 0, 1, 0.45] }
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
                          <linearGradient id="morphBottleGrad" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#4A2080" />
                            <stop offset="70%" stopColor="#7B3FE4" />
                            <stop offset="100%" stopColor="#9D5CFF" />
                          </linearGradient>
                        </defs>
                        <rect x="23" y="10" width="14" height="10" rx="2" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                        <rect x="20" y="5" width="20" height="6" rx="1" fill="#7B3FE4" />
                        <rect x="12" y="20" width="36" height="52" rx="8" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                        <rect x="15" y="32" width="30" height="36" rx="4" fill="url(#morphBottleGrad)" />
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

            {/* PRICE TAG (FAR LEFT) & BADGE PLATE — z-50 (Never Obstructed) */}
            <motion.div
              key={`product-pop-accent-${triggerKey}`}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ 
                delay: 0.08,
                duration: 0.45, 
                ease: [0.34, 1.56, 0.64, 1],
                exit: { duration: 0.3, ease: [0.55, 0, 1, 0.45] }
              }}
              className="relative w-[590px] h-[40px] -mt-3 bg-gradient-to-r from-[#7B3FE4] via-[#9D5CFF] to-[#4A2080] rounded-br-xl shadow-[0_8px_25px_rgba(123,63,228,0.4)] border border-[#9D5CFF]/60 flex items-center justify-between px-6 -skew-x-[12deg] z-[50]"
            >
              {/* Un-skewed Content: Price is FAR LEFT, Badge is RIGHT */}
              <div className="skew-x-[12deg] flex items-center justify-between w-full text-white font-mono font-black tracking-wider pt-2">
                
                {/* FAR LEFT: Relocated High-Contrast Price Tag (z-50, fully unobstructed) */}
                <div className="flex items-center gap-2.5">
                  <span className="bg-[#120924] text-[#E2D1FF] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-[#9D5CFF]/40 shadow-sm">
                    PRICE
                  </span>
                  <span className="text-white text-2xl font-mono font-black tracking-wide drop-shadow-md">
                    {price}
                  </span>
                </div>

                {/* RIGHT: Featured Product Badge */}
                <span className="bg-[#120924]/80 text-[#9D5CFF] text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded border border-[#9D5CFF]/40 shadow-sm">
                  {badgeText || "FEATURED PRODUCT"}
                </span>

              </div>
            </motion.div>
          </div>

        </div>
      )}
    </AnimatePresence>
  );
}

export default ProductRibbonBanner;
