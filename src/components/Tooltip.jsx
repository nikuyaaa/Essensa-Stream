import React, { useState, useRef, useEffect } from 'react';

export function Tooltip({ text }) {
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState('top');
  const triggerRef = useRef(null);

  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Tooltip dimensions are approx 256px wide (w-64) and 120px tall
      const tooltipWidth = 256;
      const tooltipHeight = 120;

      let bestPlacement = 'top';

      // Check vertical space
      const hasSpaceTop = rect.top > tooltipHeight;
      const hasSpaceBottom = viewportHeight - rect.bottom > tooltipHeight;
      
      // Check horizontal space
      const hasSpaceLeft = rect.left > tooltipWidth;
      const hasSpaceRight = viewportWidth - rect.right > tooltipWidth;

      if (!hasSpaceTop && hasSpaceBottom) {
        bestPlacement = 'bottom';
      } else if (!hasSpaceRight && hasSpaceLeft) {
        bestPlacement = 'left';
      } else if (!hasSpaceLeft && hasSpaceRight) {
        bestPlacement = 'right';
      }

      setPlacement(bestPlacement);
    }
  }, [visible]);

  // Position class names
  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-flex items-center ml-1.5 group select-none"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      ref={triggerRef}
    >
      {/* Small question mark trigger icon with micro-glow outline */}
      <button
        type="button"
        className="w-3.5 h-3.5 rounded-full border border-brand-gold/30 flex items-center justify-center text-[9px] font-black text-brand-gold bg-zinc-950/80 hover:bg-brand-gold/15 hover:border-brand-gold hover:shadow-[0_0_6px_rgba(212,175,55,0.4)] transition-all duration-200 cursor-pointer focus:outline-none shrink-0"
      >
        ?
      </button>

      {/* Floating Tooltip Card */}
      {visible && (
        <div 
          className={`absolute z-[9999] w-64 p-3 bg-zinc-950/95 border border-brand-gold/35 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none tooltip-fade-in ${placementClasses[placement]}`}
        >
          <div className="text-[11px] font-medium text-zinc-300 leading-normal font-sans normal-case tracking-normal text-left">
            {text}
          </div>
          {/* Subtle Indicator Arrow */}
          <div 
            className={`absolute w-1.5 h-1.5 bg-zinc-950 border-brand-gold/35 rotate-45 ${
              placement === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-r border-b' :
              placement === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-l border-t' :
              placement === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2 border-r border-t' :
              'right-full top-1/2 -translate-y-1/2 translate-x-1/2 border-l border-b'
            }`}
          />
        </div>
      )}
    </div>
  );
}
