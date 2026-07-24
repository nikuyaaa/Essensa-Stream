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
  headerCenterLogoUrl = '',
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

  const renderText = (text, defaultClass = "text-brand-charcoal") => {
    if (!text) return "";
    let processed = text;
    processed = processed.replace(/\[gold\](.*?)\[\/gold\]/gi, "||GOLD||$1||GOLD||");
    processed = processed.replace(/\[green\](.*?)\[\/green\]/gi, "||GREEN||$1||GREEN||");
    processed = processed.replace(/<b>(.*?)<\/b>/gi, "||GREEN||$1||GREEN||");
    processed = processed.replace(/<gold>(.*?)<\/gold>/gi, "||GOLD||$1||GOLD||");
    processed = processed.replace(/\[(?:color=([^\]\s]+)\s+effect=([^\]\s]+)|effect=([^\]\s]+)\s+color=([^\]\s]+))\](.*?)\[\/(?:color|effect)\]/gi, "||STYLE||$5||STYLE||");
    processed = processed.replace(/\[color=([^\]]+)\](.*?)\[\/color\]/gi, "||STYLE||$2||STYLE||");
    processed = processed.replace(/\[effect=([^\]]+)\](.*?)\[\/effect\]/gi, "||STYLE||$2||STYLE||");
    
    const parts = processed.split("||");
    return parts.map((part, idx) => {
      if (!part) return null;
      if (part.startsWith("GOLD||")) {
        const clean = part.substring(6);
        return <span key={idx} className="keyword-gold font-black">{clean}</span>;
      }
      if (part.startsWith("GREEN||")) {
        const clean = part.substring(7);
        return <span key={idx} className="keyword-green font-black">{clean}</span>;
      }
      if (part.startsWith("STYLE||")) {
        const clean = part.substring(7);
        return <span key={idx} className="keyword-gold font-black animate-pulse">{clean}</span>;
      }
      return <span key={idx} className={defaultClass}>{part}</span>;
    });
  };

  const titleString = typeof segmentName === 'string' ? segmentName : '';
  const parts = titleString.split('|');
  const leftText = parts[0] ? parts[0].trim() : '';
  const rightText = parts[1] ? parts[1].trim() : '';

  return (
    <motion.div
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -70, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[58px] z-50 bg-white text-brand-charcoal flex items-center justify-between px-0 rounded-b-2xl border-x border-b border-black/15 shadow-2xl select-none overflow-visible ${className}`}
    >
      {/* Subtle Shimmer Overlay */}
      <div className="absolute inset-0 shimmer-overlay opacity-30 animate-shimmer pointer-events-none rounded-b-2xl" />

      {/* Left side text container */}
      <div className="flex items-center pl-8 justify-start text-left font-sans font-black text-sm tracking-widest text-brand-charcoal/90 uppercase truncate w-[470px] z-10 gap-1">
        {renderText(leftText, "text-brand-charcoal/90")}
      </div>

      {/* Center Symmetrical Rounded-Full Capsule Logo badge (Hangs 18px below header card with shadow to stand out without borders) */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 bg-zinc-50 rounded-b-3xl px-6 h-[76px] min-w-[170px] flex items-center justify-center shadow-xl z-20">
        <div className="flex items-center justify-center">
          {headerCenterLogoUrl ? (
            <img src={headerCenterLogoUrl} className="h-8 max-w-[150px] object-contain" alt="Header Center Logo" />
          ) : (
            <span className="text-[10px] font-display font-black tracking-widest text-brand-charcoal uppercase select-none">BEYOND TALKS</span>
          )}
        </div>
      </div>

      {/* Right side text container */}
      <div className="flex items-center pr-8 justify-end text-right font-sans font-black text-xs tracking-wider text-zinc-550 uppercase truncate w-[470px] z-10 gap-1">
        {renderText(rightText, "text-zinc-550")}
      </div>
    </motion.div>
  );
}

export default Header;
