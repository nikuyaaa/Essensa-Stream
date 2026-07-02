import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Eye, EyeOff, User, 
  Tag, Clock, List, RefreshCw, Layers, Sparkles, Save, Globe, Facebook, Youtube, Instagram, Settings, Plus, Trash
} from 'lucide-react';
import { Logo } from './Logo';

export function OperatorPanel({ initialState, onStateChange }) {
  const [state, setState] = useState(initialState);
  const [draftState, setDraftState] = useState(initialState);
  const [activeTab, setActiveTab] = useState('main'); // intermission-banner, starting, main, brb, ending, settings
  
  const [channel, setChannel] = useState(null);
  const [socket, setSocket] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [syncedTabsCount, setSyncedTabsCount] = useState(0);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Elapsed time state for main stream clock
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync states when initialState updates (e.g., from network response)
  useEffect(() => {
    // Determine if any core text/layout configurations changed (ignoring live timers)
    const hasConfigChanged = !state ||
      JSON.stringify(initialState['intermission-banner']) !== JSON.stringify(state['intermission-banner']) ||
      initialState.starting.announcement !== state.starting.announcement ||
      initialState.starting.tagline !== state.starting.tagline ||
      JSON.stringify(initialState.starting.tickerItems) !== JSON.stringify(state.starting.tickerItems) ||
      initialState.main.headerVisible !== state.main.headerVisible ||
      initialState.main.segmentName !== state.main.segmentName ||
      initialState.main.showClock !== state.main.showClock ||
      initialState.main.tickerVisible !== state.main.tickerVisible ||
      JSON.stringify(initialState.main.tickerItems) !== JSON.stringify(state.main.tickerItems) ||
      initialState.main.hostVisible !== state.main.hostVisible ||
      initialState.main.hostName !== state.main.hostName ||
      initialState.main.hostTitle !== state.main.hostTitle ||
      initialState.main.hostAutoHide !== state.main.hostAutoHide ||
      JSON.stringify(initialState.main.products) !== JSON.stringify(state.main.products) ||
      initialState.brb.bannerText !== state.brb.bannerText ||
      JSON.stringify(initialState.brb.announcements) !== JSON.stringify(state.brb.announcements) ||
      initialState.ending.title !== state.ending.title ||
      initialState.ending.description !== state.ending.description ||
      initialState.ending.signature !== state.ending.signature ||
      JSON.stringify(initialState.socials) !== JSON.stringify(state.socials) ||
      JSON.stringify(initialState.socialsStyle) !== JSON.stringify(state.socialsStyle) ||
      JSON.stringify(initialState.timerPresets) !== JSON.stringify(state.timerPresets) ||
      initialState.globalLogoUrl !== state.globalLogoUrl;

    setState(initialState);
    if (hasConfigChanged) {
      setDraftState(initialState);
    }
  }, [initialState]);

  // Keep a ref to latest committed state to prevent closure issues in network hooks
  const stateRef = React.useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize BroadcastChannel and WebSocket for Cloud Sync
  useEffect(() => {
    const bc = new BroadcastChannel('essensa_overlay_channel');
    setChannel(bc);

    let ws = null;
    let reconnectTimeout = null;

    const handleIncomingMessage = (type, payload) => {
      if (type === 'REQUEST_STATE') {
        const responseMsg = { type: 'STATE_RESPONSE', payload: stateRef.current };
        bc.postMessage(responseMsg);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(responseMsg));
        }
        setSyncedTabsCount(prev => prev + 1);
        triggerSyncNotice();
      } else if (type === 'OVERLAY_PING') {
        setSyncedTabsCount(prev => Math.max(1, prev));
        triggerSyncNotice();
      }
    };

    bc.onmessage = (event) => {
      const { type, payload } = event.data;
      handleIncomingMessage(type, payload);
    };

    const connectWebSocket = () => {
      const wsUrl = "wss://socketsbay.com/wss/v2/1/demo/";
      ws = new WebSocket(wsUrl);
      setSocket(ws);

      ws.onopen = () => {
        setWsConnected(true);
        ws.send(JSON.stringify({ room: "essensa_stream_nikuyaaa_secure", type: 'STATE_RESPONSE', payload: stateRef.current }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.room === "essensa_stream_nikuyaaa_secure") {
            handleIncomingMessage(msg.type, msg.payload);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.warn("WebSocket closed. Reconnecting in 3 seconds...");
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        setWsConnected(false);
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connectWebSocket();
    bc.postMessage({ type: 'CONTROL_PING' });

    // Periodically broadcast state every 3 seconds to keep overlay sync locked
    const syncInterval = setInterval(() => {
      const syncMsg = { type: 'STATE_RESPONSE', payload: stateRef.current };
      bc.postMessage(syncMsg);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ room: "essensa_stream_nikuyaaa_secure", ...syncMsg }));
      }
    }, 3000);

    return () => {
      bc.close();
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      clearTimeout(reconnectTimeout);
      clearInterval(syncInterval);
    };
  }, []);

  const triggerSyncNotice = () => {
    setShowSyncSuccess(true);
    const t = setTimeout(() => setShowSyncSuccess(false), 2000);
    return () => clearTimeout(t);
  };

  // Broadcast state modifications directly to database & connected sources
  const commitState = (newState) => {
    setState(newState);
    
    const msg = { type: 'UPDATE_STATE', payload: newState };
    if (channel) {
      channel.postMessage(msg);
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ room: "essensa_stream_nikuyaaa_secure", ...msg }));
    }

    // Save state to local Vite server sync API
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newState)
    }).catch(() => {});

    if (onStateChange) {
      onStateChange(newState);
    }
    triggerSyncNotice();
  };

  // Commit dynamic sections independently
  const commitSection = (sectionKey) => {
    const nextState = { ...state };
    if (sectionKey === 'socials') {
      nextState.socials = draftState.socials;
      nextState.socialsStyle = draftState.socialsStyle;
    } else if (sectionKey === 'timerPresets') {
      nextState.timerPresets = draftState.timerPresets;
    } else if (sectionKey === 'globalLogoUrl') {
      nextState.globalLogoUrl = draftState.globalLogoUrl;
    } else {
      nextState[sectionKey] = draftState[sectionKey];
    }
    commitState(nextState);
  };

  // Local state update handler for draft configurations
  const updateDraft = (tab, field, value) => {
    setDraftState(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value
      }
    }));
  };

  // Direct Time controls bypassing the save buffer
  const triggerStartingCountdownAction = (action, val) => {
    setState(prev => {
      let countdownSeconds = prev.starting.countdownSeconds;
      let countdownRunning = prev.starting.countdownRunning;
      
      if (action === 'toggle') {
        countdownRunning = !prev.starting.countdownRunning;
      } else if (action === 'reset') {
        countdownSeconds = val !== undefined ? val : 300;
        countdownRunning = false;
      } else if (action === 'set') {
        countdownSeconds = val;
      }
      
      const nextState = {
        ...prev,
        starting: {
          ...prev.starting,
          countdownSeconds,
          countdownRunning
        }
      };
      
      setDraftState(prevDraft => ({
        ...prevDraft,
        starting: {
          ...prevDraft.starting,
          countdownSeconds,
          countdownRunning
        }
      }));
      
      commitState(nextState);
      return nextState;
    });
  };

  const triggerBrbCountdownAction = (action, val) => {
    setState(prev => {
      let countdownSeconds = prev.brb.countdownSeconds;
      let countdownRunning = prev.brb.countdownRunning;
      
      if (action === 'toggle') {
        countdownRunning = !prev.brb.countdownRunning;
      } else if (action === 'reset') {
        countdownSeconds = val !== undefined ? val : 300;
        countdownRunning = false;
      } else if (action === 'set') {
        countdownSeconds = val;
      }
      
      const nextState = {
        ...prev,
        brb: {
          ...prev.brb,
          countdownSeconds,
          countdownRunning
        }
      };
      
      setDraftState(prevDraft => ({
        ...prevDraft,
        brb: {
          ...prevDraft.brb,
          countdownSeconds,
          countdownRunning
        }
      }));
      
      commitState(nextState);
      return nextState;
    });
  };

  const triggerClockAction = (action) => {
    setState(prev => {
      let startTime = prev.main.startTime;
      if (action === 'start') {
        startTime = Date.now();
      } else if (action === 'stop') {
        startTime = null;
      } else if (action === 'reset') {
        startTime = Date.now();
      }
      
      const nextState = {
        ...prev,
        main: {
          ...prev.main,
          startTime
        }
      };
      
      setDraftState(prevDraft => ({
        ...prevDraft,
        main: {
          ...prevDraft.main,
          startTime
        }
      }));
      
      commitState(nextState);
      return nextState;
    });
  };

  // Direct Host Visibility toggles bypassing buffer
  const triggerHostVisibility = () => {
    setState(prev => {
      const hostVisible = !prev.main.hostVisible;
      const nextState = {
        ...prev,
        main: {
          ...prev.main,
          hostVisible
        }
      };
      setDraftState(prevDraft => ({
        ...prevDraft,
        main: {
          ...prevDraft.main,
          hostVisible
        }
      }));
      commitState(nextState);
      return nextState;
    });
  };

  // Direct Product Visibility toggles bypassing buffer
  const triggerProductVisibility = (productId) => {
    setState(prev => {
      const updatedProducts = prev.main.products.map(p => 
        p.id === productId ? { ...p, visible: !p.visible } : p
      );
      const nextState = {
        ...prev,
        main: {
          ...prev.main,
          products: updatedProducts
        }
      };
      setDraftState(prevDraft => {
        const updatedDraftProducts = prevDraft.main.products.map(p => 
          p.id === productId ? { ...p, visible: !p.visible } : p
        );
        return {
          ...prevDraft,
          main: {
            ...prevDraft.main,
            products: updatedDraftProducts
          }
        };
      });
      commitState(nextState);
      return nextState;
    });
  };

  // Upload processing helper
  const handleFileUpload = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      
      fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileData: base64Data
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            callback(data.url);
          }
        })
        .catch(err => {
          console.error("Upload error:", err);
          callback(base64Data); // fallback to raw base64 data URL
        });
    };
    reader.readAsDataURL(file);
  };

  // Presets definitions
  const productPresets = [
    { name: "Buah Merah Mix", price: "₱350.00", promo: "Promo: Buy 2 Get 1 Free • Free Shipping Nationwide!" },
    { name: "Organic Herbal Soap", price: "₱120.00", promo: "Promo: Buy 5 Get 1 Free • 100% Organic Ingredients!" },
    { name: "Red Mint Pain Relief Cream", price: "₱250.00", promo: "Promo: Get 10% Off on orders above ₱1000!" },
    { name: "Essensa Coffee Mix", price: "₱280.00", promo: "Promo: Free Tumbler for every 3 boxes purchased!" }
  ];

  const segmentPresets = [
    "Opening Ceremony & Welcome Address",
    "Product Presentation: The Power of Organic Living",
    "Special Awarding Ceremony & Recognition",
    "Q&A Session & Open Forum with Top Leaders",
    "Grand Raffle Draw & Concluding Remarks"
  ];

  // Track stream uptime clock
  useEffect(() => {
    if (!state.main.startTime) {
      setElapsedSeconds(0);
      return;
    }

    const initialElapsed = Math.floor((Date.now() - state.main.startTime) / 1000);
    setElapsedSeconds(initialElapsed > 0 ? initialElapsed : 0);

    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - state.main.startTime) / 1000);
      setElapsedSeconds(currentElapsed > 0 ? currentElapsed : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.main.startTime]);

  const formatElapsed = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="w-full h-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none pb-12">
      {/* 1. Header Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Logo showText={true} light={true} logoUrl={state.globalLogoUrl} className="scale-90" />
          <div className="hidden sm:block h-6 w-px bg-zinc-800" />
          <span className="text-xs sm:text-sm font-semibold text-brand-gold tracking-[0.25em] uppercase text-center sm:text-left">
            Broadcast Content Editor
          </span>
        </div>
        
        {/* Sync Status Badge */}
        <div className="flex items-center gap-4">
          {showSyncSuccess && (
            <span className="text-xs text-brand-gold animate-pulse font-black uppercase tracking-wider">
              Updated Live!
            </span>
          )}

          {/* WebSocket Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            wsConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span>Cloud Sync: {wsConnected ? 'Online' : 'Offline'}</span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            syncedTabsCount > 0 
              ? 'bg-brand-green/20 text-brand-gold border border-brand-green/30' 
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}>
            <RefreshCw className={`w-3.5 h-3.5 ${syncedTabsCount > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>
              Sources: {syncedTabsCount > 0 ? `${syncedTabsCount} active` : '0 active'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Navigation Tabs */}
      <div className="flex bg-zinc-900 border-b border-zinc-800 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: 'intermission-banner', label: 'Intermission Banner' },
          { id: 'starting', label: 'Starting Soon' },
          { id: 'main', label: 'Main Stream overlay' },
          { id: 'brb', label: 'Be Right Back (BRB)' },
          { id: 'ending', label: 'Ending outro' },
          { id: 'settings', label: 'Global Settings' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-6 font-black uppercase text-xs tracking-widest border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === tab.id 
                ? 'border-brand-gold text-brand-gold bg-zinc-850/50' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Main Editor Forms Viewport */}
      <div className="flex-1 p-6 overflow-y-auto max-w-[1280px] mx-auto w-full flex flex-col gap-6">
        
        {/* TAB 1: Intermission Banner */}
        {activeTab === 'intermission-banner' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layers className="w-4 h-4" /> Edit Pre-Stream Intermission holding banner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Left-side Header Welcome Text</label>
                <input
                  type="text"
                  value={draftState['intermission-banner'].welcomeText}
                  onChange={(e) => updateDraft('intermission-banner', 'welcomeText', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Left-side Tagline Description</label>
                <input
                  type="text"
                  value={draftState['intermission-banner'].tagline}
                  onChange={(e) => updateDraft('intermission-banner', 'tagline', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Left-side Notice Announcement</label>
                <textarea
                  rows="2"
                  value={draftState['intermission-banner'].announcement}
                  onChange={(e) => updateDraft('intermission-banner', 'announcement', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Right-side Banner Header</label>
                <input
                  type="text"
                  value={draftState['intermission-banner'].rightHeader || ''}
                  onChange={(e) => updateDraft('intermission-banner', 'rightHeader', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Right-side Dynamic Alert Message (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SPECIAL PROMO REVEAL AT 8PM!"
                  value={draftState['intermission-banner'].alertText || ''}
                  onChange={(e) => updateDraft('intermission-banner', 'alertText', e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 border-red-900/30 rounded-lg px-3 py-2 text-sm text-red-400 focus:outline-none focus:border-red-500 font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Right-side Body Subtext</label>
                <textarea
                  rows="2"
                  value={draftState['intermission-banner'].rightBody || ''}
                  onChange={(e) => updateDraft('intermission-banner', 'rightBody', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                />
              </div>
            </div>

            {/* Individual Save Button */}
            <div className="flex justify-end border-t border-zinc-800 pt-4 mt-2">
              <button
                onClick={() => commitSection('intermission-banner')}
                className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2.5 px-6 rounded-lg border border-brand-gold/45 shadow-md transition-all active:scale-95"
              >
                <Save className="w-4 h-4 text-brand-gold" />
                Save Intermission Details
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Starting Soon */}
        {activeTab === 'starting' && (
          <div className="flex flex-col gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Clock className="w-4 h-4" /> Edit Starting Soon Screen Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Header Announcement</label>
                    <input
                      type="text"
                      value={draftState.starting.announcement}
                      onChange={(e) => updateDraft('starting', 'announcement', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Tagline Description</label>
                    <input
                      type="text"
                      value={draftState.starting.tagline}
                      onChange={(e) => updateDraft('starting', 'tagline', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => commitSection('starting')}
                      className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5 text-brand-gold" />
                      Save Starting Details
                    </button>
                  </div>
                </div>

                {/* Countdown Controls (Direct execution bypassing draft) */}
                <div className="flex flex-col gap-4 bg-zinc-950 border border-zinc-800/80 p-5 rounded-xl">
                  <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Live countdown clock setup</span>
                  <div className="flex items-center justify-between">
                    <div className="text-brand-gold font-mono text-3xl font-black tracking-widest tabular-nums">
                      {Math.floor(state.starting.countdownSeconds / 60).toString().padStart(2, '0')}:
                      {(state.starting.countdownSeconds % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => triggerStartingCountdownAction('toggle')}
                        className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider border transition-all ${
                          state.starting.countdownRunning
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-brand-green/20 border-brand-green/30 text-brand-gold hover:bg-brand-green/30'
                        }`}
                      >
                        {state.starting.countdownRunning ? 'PAUSE LIVE' : 'START LIVE'}
                      </button>
                      <button
                        onClick={() => triggerStartingCountdownAction('reset', (state.timerPresets?.starting?.[2] || 5) * 60)}
                        className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 px-3 py-2 rounded-lg text-xs font-black tracking-wider text-zinc-300 transition-all"
                      >
                        RESET (5M)
                      </button>
                    </div>
                  </div>
                  
                  {/* Preset quick actions dynamic grid */}
                  <div className="flex flex-col gap-2 border-t border-zinc-800/60 pt-3">
                    <span className="text-[9px] uppercase font-black text-zinc-500">Duration Presets</span>
                    <div className="grid grid-cols-4 gap-2">
                      {(state.timerPresets?.starting || [1, 3, 5, 10]).map((m) => (
                        <button
                          key={m}
                          onClick={() => triggerStartingCountdownAction('reset', m * 60)}
                          className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-[10px] font-black py-2 rounded-lg text-zinc-350 hover:text-brand-gold transition"
                        >
                          {m} Min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom duration loader */}
                  <div className="flex items-center gap-2 border-t border-zinc-800/60 pt-3">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      min="1"
                      id="starting_custom_min"
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs w-16 text-center font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                    />
                    <button
                      onClick={() => {
                        const val = parseInt(document.getElementById('starting_custom_min').value);
                        if (val > 0) {
                          triggerStartingCountdownAction('reset', val * 60);
                        }
                      }}
                      className="bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/30 text-brand-gold text-[10px] font-black uppercase py-1.5 px-3.5 rounded-lg transition-all"
                    >
                      Apply Custom Time
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrolling Ticker Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                <List className="w-4 h-4" /> Scrolling Announcement Ticker Items
              </h3>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">One statement per line</label>
                <textarea
                  rows="4"
                  value={draftState.starting.tickerItems.join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    updateDraft('starting', 'tickerItems', lines);
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                />
              </div>
              <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                <button
                  onClick={() => commitSection('starting')}
                  className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-brand-gold" />
                  Save Ticker Items
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Main Stream Overlay */}
        {activeTab === 'main' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Headers & Tickers */}
            <div className="flex flex-col gap-6">
              
              {/* Header card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Segment Header Config
                  </h2>
                  <button
                    onClick={() => updateDraft('main', 'headerVisible', !draftState.main.headerVisible)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      draftState.main.headerVisible 
                        ? 'bg-brand-green/20 border-brand-gold text-brand-gold' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {draftState.main.headerVisible ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Show Title</label>
                    <input
                      type="text"
                      value={draftState.main.segmentName}
                      onChange={(e) => updateDraft('main', 'segmentName', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-850 pt-3">
                    <span className="text-xs text-zinc-400 font-bold">Show clock uptime capsule</span>
                    <input 
                      type="checkbox"
                      checked={draftState.main.showClock}
                      onChange={(e) => updateDraft('main', 'showClock', e.target.checked)}
                      className="rounded text-brand-green focus:ring-brand-green h-4 w-4 bg-zinc-950 border-zinc-800 cursor-pointer"
                    />
                  </div>

                  {/* Uptime clock controls (Direct instant execution) */}
                  <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-zinc-500 text-[10px] uppercase font-black tracking-wider font-sans">Uptime Clock</span>
                      <span className="text-brand-gold text-xl font-black tracking-widest tabular-nums">
                        {state.main.startTime ? formatElapsed(elapsedSeconds) : "00:00:00"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => triggerClockAction('start')}
                        className="bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/30 text-brand-gold py-1.5 rounded-md font-bold text-2xs flex items-center justify-center gap-1 transition"
                      >
                        <Play className="w-3 h-3" /> Start Clock
                      </button>
                      <button
                        onClick={() => triggerClockAction('stop')}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-1.5 rounded-md font-bold text-2xs flex items-center justify-center gap-1 transition"
                      >
                        <Pause className="w-3 h-3" /> Stop Clock
                      </button>
                      <button
                        onClick={() => triggerClockAction('reset')}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-1.5 rounded-md font-bold text-2xs flex items-center justify-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>

                  {/* Segment presets */}
                  <div className="border-t border-zinc-850 pt-3">
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block mb-2">Preset Segments</span>
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {segmentPresets.map((seg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => updateDraft('main', 'segmentName', seg)}
                          className={`text-left w-full p-2 rounded-lg text-2xs font-semibold border transition ${
                            draftState.main.segmentName === seg
                              ? 'bg-brand-green border-brand-gold text-white font-bold'
                              : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {seg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                  <button
                    onClick={() => commitSection('main')}
                    className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-brand-gold" />
                    Save Header Settings
                  </button>
                </div>
              </div>

              {/* News ticker card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2">
                    <List className="w-4 h-4" /> Bottom News Ticker
                  </h2>
                  <button
                    onClick={() => updateDraft('main', 'tickerVisible', !draftState.main.tickerVisible)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      draftState.main.tickerVisible 
                        ? 'bg-brand-green/20 border-brand-gold text-brand-gold' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {draftState.main.tickerVisible ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">One news statement per line</label>
                  <textarea
                    rows="4"
                    value={draftState.main.tickerItems.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      updateDraft('main', 'tickerItems', lines);
                    }}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                  />
                </div>
                <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                  <button
                    onClick={() => commitSection('main')}
                    className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-brand-gold" />
                    Save Ticker Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Nameplate & Product Matrix */}
            <div className="flex flex-col gap-6">
              
              {/* Host nameplate card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4" /> Host Nameplate
                  </h2>
                  
                  {/* Dedicated instant PUSH LIVE toggle */}
                  <button
                    onClick={triggerHostVisibility}
                    className={`px-4 py-1.5 text-xs font-black rounded-lg border transition-all ${
                      state.main.hostVisible 
                        ? 'bg-red-600 border-brand-gold text-white shadow-md animate-pulse' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                    }`}
                  >
                    {state.main.hostVisible ? 'DISPLAYED LIVE' : 'DISPLAY LIVE'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Host Name</label>
                    <input
                      type="text"
                      value={draftState.main.hostName}
                      onChange={(e) => updateDraft('main', 'hostName', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Credentials Title</label>
                    <input
                      type="text"
                      value={draftState.main.hostTitle}
                      onChange={(e) => updateDraft('main', 'hostTitle', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>

                  {/* Host visibility timer parameters */}
                  <div className="flex flex-col gap-2 md:col-span-2 border-t border-zinc-850 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-bold">Auto-hide host nameplate automatically</span>
                      <input 
                        type="checkbox"
                        checked={draftState.main.hostAutoHide}
                        onChange={(e) => updateDraft('main', 'hostAutoHide', e.target.checked)}
                        className="rounded text-brand-green focus:ring-brand-green h-4 w-4 bg-zinc-950 border-zinc-800 cursor-pointer"
                      />
                    </div>
                    {draftState.main.hostAutoHide && (
                      <div className="flex flex-col gap-2 mt-1 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                        <span className="text-[9px] uppercase font-black text-zinc-500">Auto-Hide Duration (seconds)</span>
                        <div className="flex gap-2 items-center">
                          {[5, 10, 30].map(s => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => updateDraft('main', 'hostHideDuration', s)}
                              className={`px-3 py-1.5 rounded text-[10px] font-black border transition ${
                                draftState.main.hostHideDuration === s
                                  ? 'bg-brand-green border-brand-gold text-white'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                              }`}
                            >
                              {s}s
                            </button>
                          ))}
                          <input
                            type="number"
                            placeholder="Custom"
                            value={draftState.main.hostHideDuration || ''}
                            onChange={(e) => updateDraft('main', 'hostHideDuration', parseInt(e.target.value) || 0)}
                            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs w-16 text-center font-bold text-zinc-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                  <button
                    onClick={() => commitSection('main')}
                    className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-brand-gold" />
                    Save Nameplate Details
                  </button>
                </div>
              </div>

              {/* Product matrix card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest border-b border-zinc-800 pb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Featured Product Flashcards Grid
                </h2>
                
                <div className="flex flex-col gap-5 max-h-[500px] overflow-y-auto pr-1">
                  {draftState.main.products && draftState.main.products.map((product, idx) => (
                    <div key={product.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col gap-4 relative">
                      
                      {/* Product header & display trigger */}
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="text-xs font-black text-brand-gold">Product Card #{idx + 1}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => triggerProductVisibility(product.id)}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all ${
                              state.main.products?.find(p => p.id === product.id)?.visible
                                ? 'bg-red-600 border-brand-gold text-white shadow-md animate-pulse'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                            }`}
                          >
                            {state.main.products?.find(p => p.id === product.id)?.visible ? 'DISPLAYED LIVE' : 'DISPLAY LIVE'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftState(prev => {
                                const filtered = prev.main.products.filter(p => p.id !== product.id);
                                return { ...prev, main: { ...prev.main, products: filtered } };
                              });
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded text-[10px] font-black"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-black text-zinc-400">Product Name</label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftState(prev => {
                                const updated = prev.main.products.map(p => p.id === product.id ? { ...p, name: val } : p);
                                return { ...prev, main: { ...prev.main, products: updated } };
                              });
                            }}
                            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-black text-zinc-400">Price Pill</label>
                          <input
                            type="text"
                            value={product.price}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftState(prev => {
                                const updated = prev.main.products.map(p => p.id === product.id ? { ...p, price: val } : p);
                                return { ...prev, main: { ...prev.main, products: updated } };
                              });
                            }}
                            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-black text-zinc-400">Promo Scrolling Banner</label>
                        <input
                          type="text"
                          value={product.promoText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftState(prev => {
                              const updated = prev.main.products.map(p => p.id === product.id ? { ...p, promoText: val } : p);
                              return { ...prev, main: { ...prev.main, products: updated } };
                            });
                          }}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                        />
                      </div>

                      {/* Direct file upload wrapper */}
                      <div className="flex flex-col gap-1 bg-zinc-900/60 p-2.5 rounded border border-zinc-850">
                        <span className="text-[8px] uppercase font-black text-zinc-500">Asset File Upload (Image / Animated GIF / Video MP4)</span>
                        <input 
                          type="file" 
                          accept="image/*,video/*"
                          onChange={(e) => {
                            handleFileUpload(e, (url) => {
                              setDraftState(prev => {
                                const updated = prev.main.products.map(p => p.id === product.id ? { ...p, imageUrl: url } : p);
                                return { ...prev, main: { ...prev.main, products: updated } };
                              });
                            });
                          }}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-2xs text-zinc-300 w-full cursor-pointer focus:outline-none"
                        />
                        {product.imageUrl && (
                          <span className="text-[9px] text-brand-gold font-bold truncate max-w-[300px] mt-1.5">
                            Loaded URL: {product.imageUrl.slice(0, 45)}...
                          </span>
                        )}
                      </div>

                      {/* Visibility Timers */}
                      <div className="flex flex-col gap-1.5 border-t border-zinc-850 pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-black text-zinc-400">Stay on screen indefinitely</span>
                          <input 
                            type="checkbox"
                            checked={product.stayOnScreen}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setDraftState(prev => {
                                const updated = prev.main.products.map(p => p.id === product.id ? { ...p, stayOnScreen: val } : p);
                                return { ...prev, main: { ...prev.main, products: updated } };
                              });
                            }}
                            className="rounded text-brand-green focus:ring-brand-green h-4 w-4 bg-zinc-900 border-zinc-800 cursor-pointer"
                          />
                        </div>
                        {!product.stayOnScreen && (
                          <div className="flex flex-col gap-1.5 mt-1 bg-zinc-900 p-2 rounded border border-zinc-850">
                            <span className="text-[8px] uppercase font-black text-zinc-500">Auto-Hide Duration (seconds)</span>
                            <div className="flex gap-2 items-center">
                              {[5, 10, 30].map(s => (
                                <button
                                  type="button"
                                  key={s}
                                  onClick={() => {
                                    setDraftState(prev => {
                                      const updated = prev.main.products.map(p => p.id === product.id ? { ...p, hideDuration: s } : p);
                                      return { ...prev, main: { ...prev.main, products: updated } };
                                    });
                                  }}
                                  className={`px-2 py-1 rounded text-[9px] font-black border transition ${
                                    product.hideDuration === s
                                      ? 'bg-brand-green border-brand-gold text-white'
                                      : 'bg-zinc-950 border-zinc-850 text-zinc-400'
                                  }`}
                                >
                                  {s}s
                                </button>
                              ))}
                              <input
                                type="number"
                                placeholder="Custom"
                                value={product.hideDuration || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setDraftState(prev => {
                                    const updated = prev.main.products.map(p => p.id === product.id ? { ...p, hideDuration: val } : p);
                                    return { ...prev, main: { ...prev.main, products: updated } };
                                  });
                                }}
                                className="bg-zinc-950 border border-zinc-850 rounded px-1.5 py-0.5 text-xs w-12 text-center font-bold text-zinc-100"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Product Presets */}
                      <div className="border-t border-zinc-850 pt-2.5">
                        <span className="text-[8px] uppercase font-black text-zinc-500 block mb-1.5">Apply Presets directly</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {productPresets.map((pr, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => {
                                setDraftState(prev => {
                                  const updated = prev.main.products.map(p => 
                                    p.id === product.id 
                                      ? { ...p, name: pr.name, price: pr.price, promoText: pr.promo } 
                                      : p
                                  );
                                  return { ...prev, main: { ...prev.main, products: updated } };
                                });
                              }}
                              className="text-left p-1.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 rounded text-[9px] font-semibold flex items-center justify-between transition"
                            >
                              <span className="truncate pr-1 font-bold text-zinc-400">{pr.name}</span>
                              <span className="text-brand-gold font-mono shrink-0 font-bold">{pr.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDraftState(prev => {
                      const nextId = prev.main.products?.length > 0 
                        ? Math.max(...prev.main.products.map(p => p.id)) + 1 
                        : 1;
                      const newProd = {
                        id: nextId,
                        visible: false,
                        name: "Organic Product Name",
                        price: "₱0.00",
                        promoText: "Exclusive Anniversary Deals!",
                        imageUrl: "",
                        stayOnScreen: true,
                        hideDuration: 10
                      };
                      return { ...prev, main: { ...prev.main, products: [...(prev.main.products || []), newProd] } };
                    });
                  }}
                  className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-black uppercase text-brand-gold tracking-widest flex items-center justify-center gap-2 mt-2 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product Card
                </button>

                <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                  <button
                    onClick={() => commitSection('main')}
                    className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-brand-gold" />
                    Save Products List
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: Be Right Back */}
        {activeTab === 'brb' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Clock className="w-4 h-4" /> Edit Be Right Back Screen (BRB)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">BRB Banner Header Text</label>
                  <input
                    type="text"
                    value={draftState.brb.bannerText}
                    onChange={(e) => updateDraft('brb', 'bannerText', e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Notices / Status Box Statements (One statement per line)</label>
                  <textarea
                    rows="4"
                    value={draftState.brb.announcements.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      updateDraft('brb', 'announcements', lines);
                    }}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => commitSection('brb')}
                    className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2.5 px-6 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                  >
                    <Save className="w-4 h-4 text-brand-gold" />
                    Save BRB Details
                  </button>
                </div>
              </div>

              {/* Countdown settings (Direct execution) */}
              <div className="flex flex-col gap-4 bg-zinc-950 border border-zinc-800/80 p-5 rounded-xl">
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Return Timer setup</span>
                <div className="flex items-center justify-between">
                  <div className="text-brand-gold font-mono text-3xl font-black tracking-widest tabular-nums">
                    {Math.floor(state.brb.countdownSeconds / 60).toString().padStart(2, '0')}:
                    {(state.brb.countdownSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerBrbCountdownAction('toggle')}
                      className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider border transition-all ${
                        state.brb.countdownRunning
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-brand-green/20 border-brand-green/30 text-brand-gold hover:bg-brand-green/30'
                      }`}
                    >
                      {state.brb.countdownRunning ? 'PAUSE LIVE' : 'START LIVE'}
                    </button>
                    <button
                      onClick={() => triggerBrbCountdownAction('reset', (state.timerPresets?.brb?.[2] || 5) * 60)}
                      className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 px-3 py-2 rounded-lg text-xs font-black tracking-wider text-zinc-300 transition"
                    >
                      RESET (5M)
                    </button>
                  </div>
                </div>
                
                {/* Presets loops */}
                <div className="flex flex-col gap-2 border-t border-zinc-800/60 pt-3">
                  <span className="text-[9px] uppercase font-black text-zinc-500">Duration Presets</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(state.timerPresets?.brb || [1, 3, 5, 10]).map((m) => (
                      <button
                        key={m}
                        onClick={() => triggerBrbCountdownAction('reset', m * 60)}
                        className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-[10px] font-black py-2 rounded-lg text-zinc-350 hover:text-brand-gold transition"
                      >
                        {m} Min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Time */}
                <div className="flex items-center gap-2 border-t border-zinc-800/60 pt-3">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    min="1"
                    id="brb_custom_min"
                    className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs w-16 text-center font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(document.getElementById('brb_custom_min').value);
                      if (val > 0) {
                        triggerBrbCountdownAction('reset', val * 60);
                      }
                    }}
                    className="bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/30 text-brand-gold text-[10px] font-black uppercase py-1.5 px-3.5 rounded-lg transition-all"
                  >
                    Apply Custom Time
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Ending Outro */}
        {activeTab === 'ending' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layers className="w-4 h-4" /> Edit Stream Ending Credits Screen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Closing Main Title</label>
                <input
                  type="text"
                  value={draftState.ending.title}
                  onChange={(e) => updateDraft('ending', 'title', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Credits Signature</label>
                <input
                  type="text"
                  value={draftState.ending.signature}
                  onChange={(e) => updateDraft('ending', 'signature', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Closing Paragraph / Description Notice</label>
                <textarea
                  rows="3"
                  value={draftState.ending.description}
                  onChange={(e) => updateDraft('ending', 'description', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                />
              </div>
            </div>

            {/* Individual Save Button */}
            <div className="flex justify-end border-t border-zinc-800 pt-4 mt-2">
              <button
                onClick={() => commitSection('ending')}
                className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2.5 px-6 rounded-lg border border-brand-gold/45 shadow-md transition-all active:scale-95"
              >
                <Save className="w-4 h-4 text-brand-gold" />
                Save Ending Details
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: Settings (Global Management Panels) */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Global Logo Upload Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Layers className="w-4 h-4" /> Global Logo Customization
              </h2>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase font-black text-zinc-400">Global Logo (static image or animated/video loop)</label>
                <input 
                  type="file" 
                  accept="image/*,video/*"
                  onChange={(e) => {
                    handleFileUpload(e, (url) => {
                      setDraftState(prev => ({
                        ...prev,
                        globalLogoUrl: url
                      }));
                    });
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-350 w-full cursor-pointer focus:outline-none"
                />
                
                {draftState.globalLogoUrl && (
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 flex items-center justify-between gap-3">
                    <span className="text-2xs font-bold text-zinc-400 truncate max-w-[280px]">
                      Current Logo: {draftState.globalLogoUrl.slice(0, 50)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraftState(prev => ({ ...prev, globalLogoUrl: "" }))}
                      className="text-red-400 hover:text-red-300 text-2xs font-black uppercase shrink-0"
                    >
                      Clear logo
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                <button
                  onClick={() => commitSection('globalLogoUrl')}
                  className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-brand-gold" />
                  Save Logo
                </button>
              </div>
            </div>

            {/* Global Timer Presets setup */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Clock className="w-4 h-4" /> Quick Timer Presets (Minutes)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-black text-brand-gold tracking-wider">Starting Screen Presets</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map(i => (
                      <input
                        key={i}
                        type="number"
                        min="1"
                        value={draftState.timerPresets?.starting?.[i] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setDraftState(prev => {
                            const arr = [...(prev.timerPresets?.starting || [1, 3, 5, 10])];
                            arr[i] = val;
                            return {
                              ...prev,
                              timerPresets: { ...prev.timerPresets, starting: arr }
                            };
                          });
                        }}
                        className="bg-zinc-950 border border-zinc-800 rounded px-1 py-2 text-center text-xs font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-black text-brand-gold tracking-wider">BRB Screen Presets</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map(i => (
                      <input
                        key={i}
                        type="number"
                        min="1"
                        value={draftState.timerPresets?.brb?.[i] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setDraftState(prev => {
                            const arr = [...(prev.timerPresets?.brb || [1, 3, 5, 10])];
                            arr[i] = val;
                            return {
                              ...prev,
                              timerPresets: { ...prev.timerPresets, brb: arr }
                            };
                          });
                        }}
                        className="bg-zinc-950 border border-zinc-800 rounded px-1 py-2 text-center text-xs font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                <button
                  onClick={() => commitSection('timerPresets')}
                  className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-brand-gold" />
                  Save Presets
                </button>
              </div>
            </div>

            {/* Centralized Social Media Manager Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 lg:col-span-2">
              <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Globe className="w-4 h-4" /> Centralized Social Media Handles Manager
              </h2>
              
              {/* Display & Layout settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-black text-zinc-400">Display Layout Format</label>
                  <select
                    value={draftState.socialsStyle?.format || 'icon-text'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftState(prev => ({
                        ...prev,
                        socialsStyle: { ...prev.socialsStyle, format: val }
                      }));
                    }}
                    className="bg-zinc-900 border border-zinc-800 text-xs rounded p-2.5 font-bold focus:outline-none focus:border-brand-green text-zinc-200 cursor-pointer"
                  >
                    <option value="icon-text">Show Icon + Text Display</option>
                    <option value="text-only">Show Text Only (Hide Icons)</option>
                    <option value="icon-only">Show Icon Only (Hide Handles)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-black text-zinc-400">Display Grid Alignment</label>
                  <select
                    value={draftState.socialsStyle?.layout || 'grid'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftState(prev => ({
                        ...prev,
                        socialsStyle: { ...prev.socialsStyle, layout: val }
                      }));
                    }}
                    className="bg-zinc-900 border border-zinc-800 text-xs rounded p-2.5 font-bold focus:outline-none focus:border-brand-green text-zinc-200 cursor-pointer"
                  >
                    <option value="grid">2-Column Grid Layout</option>
                    <option value="row">Horizontal Row Layout</option>
                  </select>
                </div>
              </div>

              {/* Social handles rows */}
              <div className="flex flex-col gap-3 mt-2">
                {draftState.socials && draftState.socials.map((handle, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-zinc-950 p-3.5 rounded-xl border border-zinc-850">
                    <div className="flex flex-col gap-1 w-44">
                      <label className="text-[8px] uppercase font-black text-zinc-500">Platform</label>
                      <select
                        value={handle.platform}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftState(prev => {
                            const updated = prev.socials.map((s, sIdx) => sIdx === idx ? { ...s, platform: val } : s);
                            return { ...prev, socials: updated };
                          });
                        }}
                        className="bg-zinc-900 border border-zinc-800 text-xs rounded p-1.5 font-bold text-zinc-350 cursor-pointer"
                      >
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                        <option value="globe">Website (Globe)</option>
                      </select>
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[8px] uppercase font-black text-zinc-500">Display String Handle</label>
                      <input
                        type="text"
                        value={handle.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftState(prev => {
                            const updated = prev.socials.map((s, sIdx) => sIdx === idx ? { ...s, text: val } : s);
                            return { ...prev, socials: updated };
                          });
                        }}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-bold text-zinc-200 focus:outline-none focus:border-brand-green w-full"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDraftState(prev => {
                          const filtered = prev.socials.filter((s, sIdx) => sIdx !== idx);
                          return { ...prev, socials: filtered };
                        });
                      }}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 p-2.5 rounded-lg mt-3 transition shrink-0"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDraftState(prev => ({
                    ...prev,
                    socials: [...(prev.socials || []), { platform: 'globe', text: 'www.newhandle.com' }]
                  }));
                }}
                className="py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-black uppercase text-brand-gold tracking-widest flex items-center justify-center gap-2 mt-2 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Social Handle
              </button>

              <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                <button
                  onClick={() => commitSection('socials')}
                  className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-brand-gold" />
                  Save Social Handles
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default OperatorPanel;
