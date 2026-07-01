import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LowerThird({ 
  isOpen = false, 
  name = "Juan Dela Cruz", 
  title = "Entrepreneurial Coach",
  autoHide = true,
  onClose = null,
  className = '' 
}) {

  useEffect(() => {
    if (isOpen && autoHide) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 8000); // Auto close after 8 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoHide, name, title, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 18, 
            stiffness: 85,
            mass: 0.8
          }}
          className={`fixed bottom-[74px] sm:bottom-[94px] left-4 sm:left-[50px] z-30 select-none max-w-[calc(100%-32px)] flex flex-col items-start ${className}`}
        >
          {/* Layer 1: Host Name (Solid Black block with white text and forest green left border) */}
          <div className="bg-brand-charcoal h-[40px] sm:h-[46px] flex items-center px-4 sm:px-6 min-w-[200px] sm:min-w-[300px] border-l-4 border-brand-green shadow-lg rounded-tr-md relative">
            <motion.h3 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="font-display font-extrabold text-xs sm:text-base text-white leading-tight tracking-wide uppercase truncate"
            >
              {name}
            </motion.h3>
          </div>

          {/* Layer 2: Host Title (Organic Gold tag resting directly below the name block) */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="origin-left h-[22px] sm:h-[26px] bg-brand-gold flex items-center px-3 sm:px-4 shadow-md rounded-br-md"
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="font-sans text-[8px] sm:text-[10px] font-black tracking-widest text-brand-charcoal uppercase truncate"
            >
              {title}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LowerThird;
