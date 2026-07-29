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
    <AnimatePresence initial={false}>
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
          {/* Layer 1: Host Name (Solid Dark Midnight block with white text and electric purple left border) */}
          <div className="bg-[#120924] h-[72px] flex items-center px-10 border-l-[6px] border-[#9D5CFF] shadow-[0_8px_24px_rgba(26,11,46,0.8)] rounded-tr-xl relative">
            <motion.h3 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="font-display font-black text-4xl text-white leading-none tracking-wider uppercase truncate"
            >
              {name}
            </motion.h3>
          </div>

          {/* Layer 2: Host Title (Beyond Talks Purple gradient tag) */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="origin-left h-[38px] bg-gradient-to-r from-[#7B3FE4] to-[#4A2080] border border-[#9D5CFF]/40 flex items-center px-8 shadow-md rounded-br-xl"
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="font-sans text-sm font-black tracking-[0.2em] text-white uppercase truncate"
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
