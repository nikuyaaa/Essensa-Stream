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
          className={`absolute bottom-[130px] right-[80px] w-[420px] z-30 select-none ${className}`}
        >
          {/* Main Card Container */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[8px_8px_32px_rgba(0,0,0,0.18)] flex flex-col border border-brand-green/15">
            
            {/* Header Tag / Active Flash - Solid Brand Green */}
            <div className="bg-brand-green text-white text-xs uppercase font-black tracking-[0.2em] px-6 py-3 flex items-center justify-between rounded-t-2xl">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
                Featured Product
              </span>
              <span className="bg-red-600 text-white px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest animate-pulse">
                ON AIR
              </span>
            </div>

            {/* Product Body: Image & Info */}
            <div className="p-6 flex gap-5 items-center bg-white">
              
              {/* Product Image Wrapper */}
              <div className="w-[110px] h-[110px] bg-brand-cream rounded-xl border border-brand-green/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-3">
                {imageUrl ? (
                  (imageUrl.match(/\.(mp4|webm|ogg)$/i) || imageUrl.startsWith('data:video/')) ? (
                    <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                  ) : (
                    <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
                  )
                ) : (
                  /* Fallback SVG Mockup of Organic Bottle */
                  <svg viewBox="0 0 60 80" className="w-14 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <div className="flex-1 flex flex-col justify-between h-[110px] py-1">
                {/* Product Name */}
                <h4 className="font-display font-black text-2xl text-brand-charcoal leading-tight line-clamp-2 uppercase">
                  {name}
                </h4>
                
                {/* Price Pill (Gold/Ochre) */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="bg-brand-gold text-brand-charcoal font-mono font-black text-2xl px-5 py-1 rounded-full shadow-md tracking-wider">
                    {price}
                  </div>
                  <span className="text-[10px] text-brand-charcoal/50 font-black uppercase tracking-wider">
                    VAT INCL.
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Marquee Promo Tag - Solid Black */}
            <div className="bg-brand-charcoal text-white border-t border-zinc-800 flex items-center relative overflow-hidden h-[44px] rounded-b-2xl select-none">
              {/* 1. Left static tag icon block (mimics main ticker logo block) */}
              <div className="h-full bg-brand-charcoal flex items-center px-4 relative z-20 shrink-0 border-r border-zinc-800/65 text-brand-gold">
                <Tag className="w-4 h-4" />
              </div>

              {/* 2. Scrolling Marquee Area */}
              <div className="flex-1 h-full flex items-center overflow-hidden bg-brand-charcoal relative">
                <div className="marquee-container text-xs font-black uppercase tracking-wider text-white flex items-center">
                  {/* Duplicate scrolling text for smooth infinite loop */}
                  <div className="marquee-content gap-12 flex items-center pr-12 animate-shimmer" style={{ animationDuration: '25s' }}>
                    <span>{promoText}</span>
                    <span>•</span>
                    <span>{promoText}</span>
                    <span>•</span>
                  </div>
                  <div className="marquee-content gap-12 flex items-center pr-12 animate-shimmer" style={{ animationDuration: '25s' }} aria-hidden="true">
                    <span>{promoText}</span>
                    <span>•</span>
                    <span>{promoText}</span>
                    <span>•</span>
                  </div>
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
