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
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -70, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className={`absolute top-4 left-1/2 -translate-x-1/2 w-[1200px] h-[58px] z-50 bg-white text-brand-charcoal flex items-center justify-between px-6 rounded-2xl border border-black/15 shadow-2xl select-none overflow-hidden ${className}`}
    >
      {/* Subtle Shimmer Overlay */}
      <div className="absolute inset-0 shimmer-overlay opacity-30 animate-shimmer pointer-events-none" />

      {/* Left: Brand / Tagline */}
      <div className="flex items-center gap-3 relative z-10 min-w-0">
        {/* Pulsing Green dot */}
        <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse shrink-0" />
        <span className="font-display font-black text-lg tracking-[0.2em] uppercase text-brand-green shrink-0">
          Live Event
        </span>
        <div className="h-5 w-0.5 bg-black/20 shrink-0" />
        <span className="font-sans font-black text-base tracking-wide text-brand-charcoal/90 truncate max-w-[720px]">
          {segmentName}
        </span>
      </div>

      {/* Right Content Group: Live Capsule Uptime Clock */}
      {showClock && (
        <div className="flex items-center gap-4 shrink-0 relative z-10">
          <div className="flex items-center gap-2.5 bg-brand-charcoal border border-white/10 px-5 py-1.5 rounded-lg shadow-md shrink-0">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/60">LIVE</span>
            <span className="font-mono text-lg font-black tracking-widest text-brand-gold ml-1">
              {startTime ? formatRuntime(elapsedSeconds) : "00:00:00"}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Header;
