import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Countdown({ 
  secondsLeft = 300, 
  isRunning = false, 
  onTick = null, 
  textColor = 'text-white',
  className = '' 
}) {
  const [localSeconds, setLocalSeconds] = useState(secondsLeft);

  useEffect(() => {
    setLocalSeconds(secondsLeft);
  }, [secondsLeft]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setLocalSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onTick) onTick(0);
          return 0;
        }
        const next = prev - 1;
        if (onTick) onTick(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTick]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isZero = localSeconds === 0;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Timer Display Container */}
      <div className="relative">
        {/* Glow backdrop when timer is active or hits 0 */}
        <AnimatePresence>
          {isZero ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-accent/25 blur-3xl rounded-full animate-flare"
            />
          ) : (
            isRunning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-accent/10 blur-xl rounded-full"
              />
            )
          )}
        </AnimatePresence>

        {/* Digital Time Numbers */}
        <motion.div
          animate={isZero ? {
            scale: [1, 1.03, 1],
            color: ['#FFFFFF', '#4CAF50', '#FFFFFF']
          } : {}}
          transition={isZero ? {
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut"
          } : {}}
          className={`font-display font-black tracking-widest tabular-nums leading-none select-none relative z-10
            ${isZero ? 'text-brand-accent animate-flare text-[54px] sm:text-[80px] md:text-[96px]' : `${textColor} text-[54px] sm:text-[80px] md:text-[96px]`}
          `}
        >
          {formatTime(localSeconds)}
        </motion.div>
      </div>

      {/* Label under Countdown */}
      <AnimatePresence mode="wait">
        <motion.p
          key={isZero ? 'started' : 'starting'}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 0.7, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className={`text-[9px] sm:text-xs uppercase tracking-[0.3em] font-bold mt-4 z-10
            ${textColor === 'text-brand-gold' ? 'text-brand-charcoal/60' : 'text-brand-cream/85'}
          `}
        >
          {isZero ? "The Show Has Begun!" : "STREAM STARTING SOON"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default Countdown;
