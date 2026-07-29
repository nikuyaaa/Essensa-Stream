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
          key={triggerKey || 'product-ribbon'}
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '-100%' }}
          transition={{ 
            duration: 0.8, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className={`absolute bottom-[90px] left-0 w-[1920px] h-[72px] bg-white border-b-4 border-[#9D5CFF] shadow-[0_-8px_30px_rgba(18,9,36,0.2)] z-30 flex items-center justify-between px-10 select-none cursor-pointer ${className}`}
          onDoubleClick={onDoubleClick}
        >
          {/* Left Section: 3D Pop-Out Product Image Cutout & Title */}
          <div className="flex items-center gap-6">
            <div className="relative -mt-5 w-[85px] h-[85px] bg-white rounded-2xl border-2 border-[#9D5CFF] shadow-[0_8px_24px_rgba(157,92,255,0.35)] flex items-center justify-center p-2 z-10 shrink-0">
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
                    <linearGradient id="ribbonBottleGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#4A2080" />
                      <stop offset="70%" stopColor="#7B3FE4" />
                      <stop offset="100%" stopColor="#9D5CFF" />
                    </linearGradient>
                  </defs>
                  <rect x="23" y="10" width="14" height="10" rx="2" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                  <rect x="20" y="5" width="20" height="6" rx="1" fill="#7B3FE4" />
                  <rect x="12" y="20" width="36" height="52" rx="8" fill="#FFFFFF" stroke="#7B3FE4" strokeWidth="2" />
                  <rect x="15" y="32" width="30" height="36" rx="4" fill="url(#ribbonBottleGrad)" />
                  <path d="M30 38 C34 42, 34 46, 30 48 C26 46, 26 42, 30 38 Z" fill="#FFF" />
                </svg>
              )}
            </div>

            {/* Center Section: Product Name & Subtext Details */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <span className="bg-[#120924] text-[#9D5CFF] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-[#9D5CFF]/30 shadow-sm">
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

          {/* Right Section: Beyond Talks Purple Price Badge */}
          <div className="flex items-center gap-4">
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
