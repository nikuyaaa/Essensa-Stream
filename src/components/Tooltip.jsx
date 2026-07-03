import React, { useState, useRef, useEffect } from 'react';

export function Tooltip({ text }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Tooltip dimensions are estimated at 260px wide and 100px tall
      const tooltipWidth = 260;
      const tooltipHeight = 90; 

      let bestPlacement = 'top';

      // Determine vertical and horizontal spacing
      const hasSpaceTop = rect.top > tooltipHeight + 15;
      const hasSpaceBottom = viewportHeight - rect.bottom > tooltipHeight + 15;
      const hasSpaceLeft = rect.left > tooltipWidth + 15;
      const hasSpaceRight = viewportWidth - rect.right > tooltipWidth + 15;

      if (!hasSpaceTop && hasSpaceBottom) {
        bestPlacement = 'bottom';
      } else if (!hasSpaceRight && hasSpaceLeft) {
        bestPlacement = 'left';
      } else if (!hasSpaceLeft && hasSpaceRight) {
        bestPlacement = 'right';
      }

      // Compute fixed coordinates
      let top = 0;
      let left = 0;
      const offset = 8;

      if (bestPlacement === 'top') {
        top = rect.top - tooltipHeight - offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else if (bestPlacement === 'bottom') {
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else if (bestPlacement === 'left') {
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - offset;
      } else {
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + offset;
      }

      // Constrain within viewport safety margins
      left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10));
      top = Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10));

      setCoords({ top, left });
    }
  }, [visible]);

  return (
    <span 
      className="inline-flex items-center ml-1.5 group select-none"
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

      {/* Floating Tooltip Card positioned fixed in viewport */}
      {visible && (
        <span 
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: '260px',
            zIndex: 99999
          }}
          className="p-3 bg-zinc-950/98 border border-brand-gold/45 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none tooltip-fade-in text-left block"
        >
          <span className="text-[11px] font-medium text-zinc-300 leading-normal font-sans normal-case tracking-normal block">
            {text}
          </span>
        </span>
      )}
    </span>
  );
}
