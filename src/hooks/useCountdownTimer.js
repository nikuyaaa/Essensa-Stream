import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  DURATION: 'overlay_countdown_duration',
  TIME_LEFT: 'overlay_countdown_left',
  IS_RUNNING: 'overlay_countdown_running',
  AUTO_START: 'overlay_countdown_autostart',
  END_ACTION: 'overlay_countdown_endaction',
};

export function useCountdownTimer(defaultMinutes = 5) {
  // Read initial states from localStorage or defaults
  const getInitialState = (key, defaultVal, isNum = false) => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      if (isNum) return parseInt(val, 10);
      return val === 'true' || val === 'false' ? val === 'true' : val;
    }
    return defaultVal;
  };

  const defaultSeconds = defaultMinutes * 60;

  const [duration, setDuration] = useState(() => getInitialState(STORAGE_KEYS.DURATION, defaultSeconds, true));
  const [timeLeft, setTimeLeft] = useState(() => getInitialState(STORAGE_KEYS.TIME_LEFT, defaultSeconds, true));
  const [isRunning, setIsRunning] = useState(() => getInitialState(STORAGE_KEYS.IS_RUNNING, false));
  const [autoStart, setAutoStart] = useState(() => getInitialState(STORAGE_KEYS.AUTO_START, false));
  const [endAction, setEndAction] = useState(() => getInitialState(STORAGE_KEYS.END_ACTION, 'flash'));

  // Sync to local storage on change
  useEffect(() => localStorage.setItem(STORAGE_KEYS.DURATION, duration.toString()), [duration]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.IS_RUNNING, isRunning.toString()), [isRunning]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.AUTO_START, autoStart.toString()), [autoStart]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.END_ACTION, endAction), [endAction]);
  
  // Debounce syncing timeLeft to avoid hammering localStorage every second
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.TIME_LEFT, timeLeft.toString());
    }, 500);
    return () => clearTimeout(timeout);
  }, [timeLeft]);

  // Main Tick Interval
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    
    // Use an exact timestamp delta calculation to avoid browser interval throttling drift
    let expected = Date.now() + 1000;
    let timer;
    
    const tick = () => {
      const now = Date.now();
      const dt = now - expected; // drift

      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
      
      expected += 1000;
      timer = setTimeout(tick, Math.max(0, 1000 - dt)); 
    };
    
    timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  }, [isRunning, timeLeft]);

  // Auto Start Handling on Mount (if inside Broadcast mode or freshly reloaded)
  useEffect(() => {
    if (autoStart && timeLeft > 0 && !isRunning) {
      // Small delay to ensure render completes before starting
      const t = setTimeout(() => setIsRunning(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  // Controls
  const start = useCallback(() => {
    if (timeLeft > 0) setIsRunning(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(duration);
    localStorage.setItem(STORAGE_KEYS.TIME_LEFT, duration.toString());
  }, [duration]);

  const setDurationMinutes = useCallback((minutes) => {
    const newSeconds = Math.floor(minutes * 60);
    setDuration(newSeconds);
    setTimeLeft(newSeconds);
    setIsRunning(false);
  }, []);

  // Global window bindings for OBS / Touch Portal
  useEffect(() => {
    window.startCountdown = start;
    window.pauseCountdown = pause;
    window.resetCountdown = reset;
    window.setCountdownMinutes = setDurationMinutes;

    return () => {
      delete window.startCountdown;
      delete window.pauseCountdown;
      delete window.resetCountdown;
      delete window.setCountdownMinutes;
    };
  }, [start, pause, reset, setDurationMinutes]);

  return {
    timeLeft,
    duration,
    isRunning,
    autoStart,
    endAction,
    start,
    pause,
    reset,
    setDurationMinutes,
    setAutoStart,
    setEndAction
  };
}
