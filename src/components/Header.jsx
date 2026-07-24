import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Radio } from 'lucide-react';

export function Header({ 
  segmentName = "Revitalizing Health Anytime, Anywhere.", 
  startTime = null, 
  showClock = true,
  headerCenterLogoUrl = '',
  className = '' 
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Runtime clock calculation
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

  const renderText = (text, defaultClass = "text-white/95") => {
    if (!text) return "";
    
    // Convert html-like tags to standard bracket tokens
    let processed = text
      .replace(/<b>(.*?)<\/b>/gi, "[green]$1[/green]")
      .replace(/<gold>(.*?)<\/gold>/gi, "[gold]$1[/gold]");

    // Regex to capture [gold]...[/gold] or [green]...[/green]
    const regex = /(\[(?:gold|green)\][\s\S]*?\[\/(?:gold|green)\])/gi;
    const parts = processed.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      if (/^\[gold\]([\s\S]*)\[\/gold\]$/i.test(part)) {
        const clean = part.replace(/^\[gold\]|\[\/gold\]$/gi, '');
        return <span key={idx} className="text-brand-gold font-black">{clean}</span>;
      }

      if (/^\[green\]([\s\S]*)\[\/green\]$/i.test(part)) {
        const clean = part.replace(/^\[green\]|\[\/green\]$/gi, '');
        return <span key={idx} className="text-emerald-400 font-black">{clean}</span>;
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
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 110 }}
      className={`absolute top-0 left-0 w-[1920px] h-[85px] z-50 pointer-events-none select-none ${className}`}
      style={{ filter: 'drop-shadow(0px 8px 24px rgba(0, 0, 0, 0.65))' }}
    >
      {/* 1. Left Wing Bar */}
      <div className="absolute left-0 top-0 w-[740px] h-[52px] pointer-events-auto">
        {/* Outer Dark Charcoal Frame with angled right cutout */}
        <div 
          className="w-full h-full bg-[#161616] border-b-2 border-[#D4AF37] flex items-center pl-8 pr-12 relative overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 24px) 100%, 0 100%)' }}
        >
          {/* Inner Accent Strip (Brand Green gradient) */}
          <div className="absolute inset-y-1.5 left-6 right-8 bg-gradient-to-r from-[#022B13] via-[#054D24] to-[#022B13] rounded-lg border border-[#D4AF37]/30 flex items-center px-4 shadow-inner overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer-overlay opacity-20 animate-shimmer pointer-events-none" />
            
            {/* Category Tag */}
            <div className="flex items-center gap-1.5 mr-3 px-2.5 py-0.5 bg-black/40 border border-[#D4AF37]/40 rounded text-[11px] font-black uppercase text-brand-gold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-ping" />
              <span>TOPIC</span>
            </div>

            {/* Segment / Topic Text */}
            <div className="font-sans text-sm font-black tracking-wide text-white uppercase truncate relative z-10">
              {renderText(leftText || "Revitalizing Health Anytime, Anywhere.")}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Center Geometric Angular Shield (Houses Beyond Talks Logo) */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="relative flex items-center justify-center w-[460px] h-[80px]">
          {/* SVG Background with Crisp 2px Gold Stroke */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 460 80">
            <polygon points="0,0 460,0 435,80 25,80" fill="#ffffff" />
            <polyline points="0,0 25,80 435,80 460,0" fill="none" stroke="#D4AF37" strokeWidth="4" />
          </svg>

          {/* Shimmer Overlay */}
          <div 
            className="absolute inset-0 shimmer-overlay opacity-25 animate-shimmer pointer-events-none" 
            style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 25px) 100%, 25px 100%)' }}
          />

          {/* Centered Logo Asset */}
          {headerCenterLogoUrl ? (
            <img 
              src={headerCenterLogoUrl} 
              className="object-contain relative z-10 mt-[-2px]" 
              style={{ height: '78%', maxWidth: '85%' }}
              alt="Top Header Shield Logo" 
            />
          ) : (
            <span className="text-2xl font-display font-black tracking-widest text-brand-charcoal uppercase select-none relative z-10 mt-[-2px]">
              BEYOND TALKS
            </span>
          )}
        </div>
      </div>

      {/* 3. Right Wing Bar */}
      <div className="absolute right-0 top-0 w-[740px] h-[52px] pointer-events-auto">
        {/* Outer Dark Charcoal Frame with angled left cutout */}
        <div 
          className="w-full h-full bg-[#161616] border-b-2 border-[#D4AF37] flex items-center justify-end pl-12 pr-8 relative overflow-hidden"
          style={{ clipPath: 'polygon(24px 0, 100% 0, 100% 100%, 0 100%)' }}
        >
          {/* Inner Accent Strip */}
          <div className="absolute inset-y-1.5 left-8 right-6 bg-gradient-to-r from-[#022B13] via-[#054D24] to-[#022B13] rounded-lg border border-[#D4AF37]/30 flex items-center justify-between px-4 shadow-inner overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer-overlay opacity-20 animate-shimmer pointer-events-none" />

            {/* Right text (or secondary topic) */}
            <div className="font-sans text-xs font-bold tracking-wider text-zinc-200 uppercase truncate max-w-[360px] relative z-10">
              {renderText(rightText || "Essensa Naturale Official Stream")}
            </div>

            {/* Live Runtime Clock Badge */}
            {showClock && (
              <div className="flex items-center gap-2 px-3 py-1 bg-black/60 border border-[#D4AF37]/50 rounded-md shrink-0 relative z-10 shadow">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span className="text-xs font-mono font-black tracking-widest text-brand-gold">
                  {formatRuntime(elapsedSeconds)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Header;
