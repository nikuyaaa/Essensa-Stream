import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountdownTimer } from '../hooks/useCountdownTimer';
import { Settings, Play, Pause, RotateCcw, X, Clock } from 'lucide-react';

export function Countdown({ 
  textColor = 'text-white',
  useGradient = false,
  numberSizeClass = '',
  showLabel = false,
  className = ''
}) {
  const editMode = new URLSearchParams(window.location.search).get('mode') === 'edit';
  const timer = useCountdownTimer(5); // Default 5 mins
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isZero = timer.timeLeft === 0;
  const sizeClass = numberSizeClass || 'text-[54px] sm:text-[80px] md:text-[96px]';
  const colorClass = useGradient 
    ? 'bg-gradient-to-r from-[var(--product-primary)] to-[var(--product-secondary)] bg-clip-text text-transparent drop-shadow-[0_4px_12px_var(--product-surface-tint)]'
    : textColor;

  // Spacebar Hotkey
  useEffect(() => {
    if (!editMode) return;
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (timer.isRunning) timer.pause();
        else timer.start();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode, timer.isRunning, timer.start, timer.pause]);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(customInput, 10);
    if (!isNaN(mins) && mins > 0) {
      timer.setDurationMinutes(mins);
      setCustomInput("");
    }
  };

  return (
    <>
      <div 
        className={`flex flex-col items-center justify-center relative ${className}`}
        onMouseEnter={() => editMode && setIsHovered(true)}
        onMouseLeave={() => editMode && setIsHovered(false)}
        onDoubleClick={() => editMode && setIsModalOpen(true)}
      >
        {/* Editor Hover Overlay */}
        {editMode && (
          <AnimatePresence>
            {isHovered && !isModalOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--product-dark)]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--product-accent)]/30 shadow-xl z-50 cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              >
                <Settings className="w-4 h-4 text-[var(--product-accent)] animate-spin-slow" />
                <span className="text-xs font-bold text-white tracking-widest uppercase">Edit Timer</span>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Timer Display Container */}
        <div className={`relative flex items-center justify-center ${editMode ? 'cursor-pointer' : ''} ${editMode && isHovered ? 'scale-[1.02] transition-transform duration-300' : 'transition-transform duration-300'}`}>
          {/* Glow backdrop when timer is active or hits 0 */}
          <AnimatePresence>
            {isZero ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[var(--product-surface-tint)] blur-3xl rounded-full animate-flare pointer-events-none"
              />
            ) : (
              timer.isRunning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[var(--product-surface-tint)] blur-2xl rounded-full pointer-events-none"
                />
              )
            )}
          </AnimatePresence>

          {/* Digital Time Numbers */}
          <motion.div
            animate={isZero ? {
              scale: [1, 1.03, 1],
            } : {}}
            transition={isZero ? {
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut"
            } : {}}
            className={`font-display font-black tracking-widest tabular-nums leading-none select-none relative z-10 ${sizeClass} ${isZero ? 'text-[var(--product-accent)] animate-flare' : colorClass}`}
          >
            {formatTime(timer.timeLeft)}
          </motion.div>
        </div>

        {/* Label under Countdown (Optional) */}
        {showLabel && (
          <AnimatePresence mode="wait">
            <motion.p
              key={isZero ? 'started' : 'starting'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 0.7, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`mt-4 text-sm uppercase tracking-[0.3em] font-bold ${textColor}`}
            >
              {isZero 
                ? (timer.endAction === 'text' ? 'STREAMING SHORTLY' : '') 
                : 'MINUTES REMAINING'}
            </motion.p>
          </AnimatePresence>
        )}
      </div>

      {/* Countdown Editor Modal */}
      {editMode && (
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--product-dark)]/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-[var(--product-dark)] border border-[var(--product-accent)]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--product-accent)]/20 flex items-center justify-between bg-[var(--product-mid)]">
                  <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--product-accent)]" />
                    Timer Configuration
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                  {/* Quick Presets */}
                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Quick Presets</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 5, 10, 15].map(mins => (
                        <button
                          key={mins}
                          onClick={() => timer.setDurationMinutes(mins)}
                          className={`py-2 rounded-lg text-sm font-bold border transition ${
                            timer.duration === mins * 60
                              ? 'bg-[var(--product-primary)] border-[var(--product-accent)] text-white shadow-[0_0_15px_var(--product-surface-tint)]'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Minutes Input */}
                  <form onSubmit={handleCustomSubmit} className="flex gap-2">
                    <input 
                      type="number"
                      min="1"
                      placeholder="Custom minutes..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-[var(--product-accent)]"
                    />
                    <button type="submit" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold border border-white/10 transition">
                      Set
                    </button>
                  </form>

                  <div className="w-full h-px bg-white/10" />

                  {/* Playback Controls */}
                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Playback Controls</label>
                    <div className="flex gap-3">
                      {timer.isRunning ? (
                        <button 
                          onClick={timer.pause}
                          className="flex-1 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/50 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition"
                        >
                          <Pause className="w-5 h-5" /> Pause
                        </button>
                      ) : (
                        <button 
                          onClick={timer.start}
                          className="flex-1 py-3 bg-[var(--product-primary)] hover:bg-[var(--product-primary)]/80 text-white border border-[var(--product-accent)]/50 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_var(--product-surface-tint)] transition"
                        >
                          <Play className="w-5 h-5 fill-current" /> Start
                        </button>
                      )}
                      
                      <button 
                        onClick={timer.reset}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition flex items-center justify-center gap-2"
                        title="Reset Timer"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2 text-center">
                      Pro-tip: Press <kbd className="px-1 py-0.5 bg-white/10 rounded font-mono">Spacebar</kbd> to toggle play/pause
                    </p>
                  </div>

                  <div className="w-full h-px bg-white/10" />

                  {/* Advanced Toggles */}
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm font-bold text-white/80 group-hover:text-white transition">Auto-Start on Broadcast</span>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${timer.autoStart ? 'bg-[var(--product-accent)]' : 'bg-white/10'}`} onClick={() => timer.setAutoStart(!timer.autoStart)}>
                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${timer.autoStart ? 'translate-x-5' : ''}`} />
                      </div>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm font-bold text-white/80 group-hover:text-white transition">Flash "STREAMING SHORTLY" on Zero</span>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${timer.endAction === 'text' ? 'bg-[var(--product-accent)]' : 'bg-white/10'}`} onClick={() => timer.setEndAction(timer.endAction === 'text' ? 'flash' : 'text')}>
                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${timer.endAction === 'text' ? 'translate-x-5' : ''}`} />
                      </div>
                    </label>
                  </div>

                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
