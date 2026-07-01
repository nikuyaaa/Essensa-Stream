import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Tag } from 'lucide-react';

export function ProductCard({ 
  isOpen = false, 
  name = "Buah Merah Mix", 
  price = "₱350.00", 
  imageUrl = "", 
  promoText = "Promo: Buy 2 Get 1 Free • Free Shipping Nationwide • Limited Stock Only!", 
  className = '' 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 450, opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 450, opacity: 0, scale: 0.95 }}
          transition={{ 
            type: 'spring', 
            damping: 20, 
            stiffness: 90 
          }}
          className={`fixed bottom-[160px] md:bottom-[94px] left-4 md:left-auto right-4 md:right-[50px] w-[calc(100%-32px)] md:w-[350px] z-30 select-none ${className}`}
        >
          {/* Main Card Container */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[8px_8px_32px_rgba(0,0,0,0.15)] flex flex-col border border-brand-green/10">
            
            {/* Header Tag / Active Flash */}
            <div className="bg-brand-charcoal text-white text-[10px] uppercase font-bold tracking-[0.2em] px-4 py-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                Featured Product
              </span>
              <span className="bg-brand-green text-white px-2 py-0.5 rounded text-[8px] font-black tracking-widest animate-pulse">
                ON AIR
              </span>
            </div>

            {/* Product Body: Image & Info */}
            <div className="p-4 sm:p-5 flex gap-4 items-center">
              
              {/* Product Image Wrapper */}
              <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] bg-brand-cream rounded-xl border border-brand-green/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-2">
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
                ) : (
                  /* Fallback SVG Mockup of Organic Bottle */
                  <svg viewBox="0 0 60 80" className="w-10 h-14 sm:w-12 sm:h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="liquidGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#1B7339" />
                        <stop offset="70%" stopColor="#4CAF50" />
                        <stop offset="100%" stopColor="#A5D6A7" />
                      </linearGradient>
                    </defs>
                    {/* Bottle Neck */}
                    <rect x="23" y="10" width="14" height="10" rx="2" fill="#FFFFFF" stroke="#1B7339" strokeWidth="2" />
                    {/* Cap */}
                    <rect x="20" y="5" width="20" height="6" rx="1" fill="#1B7339" />
                    {/* Bottle Body */}
                    <rect x="12" y="20" width="36" height="52" rx="8" fill="#FFFFFF" stroke="#1B7339" strokeWidth="2" />
                    {/* Liquid fill */}
                    <rect x="15" y="32" width="30" height="36" rx="4" fill="url(#liquidGrad)" opacity="0.85" />
                    {/* Leaf Label symbol */}
                    <path d="M30 38 C34 42, 34 46, 30 48 C26 46, 26 42, 30 38 Z" fill="#FFF" />
                  </svg>
                )}
              </div>

              {/* Product Text details */}
              <div className="flex-1 flex flex-col justify-between h-[80px] sm:h-[100px] py-0.5 sm:py-1">
                {/* Product Name */}
                <h4 className="font-display font-extrabold text-xs sm:text-base text-brand-charcoal leading-tight line-clamp-2 uppercase">
                  {name}
                </h4>
                
                {/* Price Pill (Gold/Ochre) */}
                <div className="flex items-center gap-1.5 mt-1 sm:mt-2">
                  <div className="bg-brand-gold text-brand-charcoal font-mono font-black text-xs sm:text-sm px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-sm tracking-wide">
                    {price}
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-brand-charcoal/50 font-bold uppercase tracking-wider">
                    VAT INCL.
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Marquee Promo Tag (Forest Green background) */}
            <div className="bg-brand-green text-white py-2 border-t border-brand-green/10 flex items-center relative overflow-hidden h-[28px]">
              <div className="absolute left-2 z-10 bg-brand-green pr-2 text-brand-gold">
                <Tag className="w-3.5 h-3.5 shrink-0" />
              </div>
              <div className="marquee-container text-[8px] sm:text-[9px] font-bold uppercase tracking-wider pl-8 text-white">
                {/* Duplicate scrolling text for smooth infinite loop */}
                <div className="marquee-content gap-8 flex items-center pr-8 animate-shimmer" style={{ animationDuration: '25s' }}>
                  <span>{promoText}</span>
                  <span>•</span>
                  <span>{promoText}</span>
                  <span>•</span>
                </div>
                <div className="marquee-content gap-8 flex items-center pr-8 animate-shimmer" style={{ animationDuration: '25s' }} aria-hidden="true">
                  <span>{promoText}</span>
                  <span>•</span>
                  <span>{promoText}</span>
                  <span>•</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProductCard;
