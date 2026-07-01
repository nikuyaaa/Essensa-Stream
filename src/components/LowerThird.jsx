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
          initial={{ x: -600, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -600, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 18, 
            stiffness: 85,
            mass: 0.8
          }}
          className={`absolute bottom-[130px] left-[80px] z-30 select-none flex flex-col items-start ${className}`}
        >
          {/* Layer 1: Host Name (Solid Black block with white text and forest green left border) */}
          <div className="bg-brand-charcoal h-[64px] flex items-center px-8 border-l-[6px] border-brand-green shadow-xl rounded-tr-lg relative">
            <motion.h3 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="font-display font-black text-3xl text-white leading-none tracking-wider uppercase truncate"
            >
              {name}
            </motion.h3>
          </div>

          {/* Layer 2: Host Title (Organic Gold tag resting directly below the name block) */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="origin-left h-[32px] bg-brand-gold flex items-center px-6 shadow-md rounded-br-lg"
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="font-sans text-xs font-black tracking-[0.2em] text-brand-charcoal uppercase truncate"
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
