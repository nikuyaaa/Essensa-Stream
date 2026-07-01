import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Instagram, Youtube } from 'lucide-react';

const TikTokIcon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.84 2.91 2.08 3.67.01 1.25.01 2.5 0 3.75-1.34-.01-2.58-.69-3.37-1.78-.02 1.93-.01 3.86-.01 5.79 0 2.27-1.02 4.41-2.88 5.48-2.39 1.48-5.69.84-7.29-1.42-1.76-2.38-.85-6.09 1.91-7.18.97-.39 2.05-.39 3.03-.02v3.91c-.69-.26-1.48-.19-2.09.24-.87.56-1.12 1.76-.56 2.62.53.84 1.63 1.13 2.5.6.87-.51 1.16-1.63.74-2.58-.02-3.41-.01-6.82-.01-10.23.01-.22-.05-.48.1-.67.35-.46.9-.62 1.47-.56Z" />
  </svg>
);

export function Header({ 
  segmentName = "Revitalizing Health Anytime, Anywhere.", 
  startTime = null, 
  showClock = true,
  className = '' 
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentSocialIdx, setCurrentSocialIdx] = useState(0);

  // Social handles list
  const socialHandles = [
    { icon: <Facebook className="w-3.5 h-3.5" />, text: "/essensanaturaleofficial" },
    { icon: <TikTokIcon className="w-3.5 h-3.5" />, text: "@essensanaturale" },
    { icon: <Instagram className="w-3.5 h-3.5" />, text: "@essensanaturale" },
    { icon: <Youtube className="w-3.5 h-3.5" />, text: "Essensa Naturale TV" }
  ];

  useEffect(() => {
    if (!startTime) {
      setElapsedSeconds(0);
      return;
    }

    const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
    setElapsedSeconds(initialElapsed > 0 ? initialElapsed : 0);

    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(currentElapsed > 0 ? currentElapsed : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Rotates socials index every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSocialIdx((prev) => (prev + 1) % socialHandles.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [socialHandles.length]);

  const formatRuntime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className={`fixed top-0 left-0 w-full h-[54px] z-40 bg-white text-brand-charcoal flex items-center justify-between px-4 sm:px-8 border-b border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)] select-none overflow-hidden ${className}`}
    >
      {/* Subtle Shimmer Overlay */}
      <div className="absolute inset-0 shimmer-overlay opacity-30 animate-shimmer pointer-events-none" />

      {/* Left: Brand / Tagline */}
      <div className="flex items-center gap-2 sm:gap-3 relative z-10 min-w-0">
        {/* Pulsing Green dot */}
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-brand-green rounded-full animate-pulse shrink-0" />
        <span className="font-display font-extrabold text-[11px] sm:text-[13px] tracking-[0.25em] uppercase text-brand-green shrink-0">
          Live Event
        </span>
        <div className="hidden sm:block h-4 w-px bg-black/10 shrink-0" />
        <span className="hidden sm:inline font-sans font-semibold text-[11px] sm:text-[13px] tracking-wide text-brand-charcoal/80 text-ellipsis overflow-hidden max-w-[200px] md:max-w-[400px] whitespace-nowrap">
          {segmentName}
        </span>
      </div>

      {/* Right Content Group: Socials Dock & Live Capsule */}
      <div className="flex items-center relative z-10 shrink-0">
        
        {/* Variant 1: Desktop Socials Dock (Side-by-side row) */}
        <div className="hidden lg:flex items-center gap-5 mr-6 shrink-0 border-r border-black/5 pr-6">
          {socialHandles.map((handle, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-1.5 text-[11px] font-bold text-brand-charcoal/70 hover:text-brand-green transition-colors duration-300"
            >
              <span className="shrink-0 text-brand-charcoal/50">{handle.icon}</span>
              <span className="font-mono tracking-tight">{handle.text}</span>
            </div>
          ))}
        </div>

        {/* Variant 2: Mobile/Compact Socials Dock (Animated Cycle) */}
        <div className="flex lg:hidden items-center mr-4 shrink-0 border-r border-black/5 pr-4 h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSocialIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex items-center gap-1.5 text-[11px] font-extrabold text-brand-charcoal/70"
            >
              <span className="shrink-0 text-brand-green">{socialHandles[currentSocialIdx].icon}</span>
              <span className="font-mono tracking-tight max-w-[120px] truncate">
                {socialHandles[currentSocialIdx].text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stream Runtime Clock (HH:MM:SS) */}
        {showClock && (
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-brand-charcoal border border-white/5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-semibold tracking-widest text-brand-cream shadow-md">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
              <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-[0.15em] text-white/50">LIVE</span>
              <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-brand-gold ml-1">
                {startTime ? formatRuntime(elapsedSeconds) : "00:00:00"}
              </span>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}

export default Header;
