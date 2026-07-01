import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Eye, EyeOff, User, 
  Tag, Clock, List, RefreshCw, Layers, Award, Sparkles, Check, Save, Globe, Facebook, Youtube, Instagram
} from 'lucide-react';
import { Logo } from './Logo';

export function OperatorPanel({ initialState, onStateChange }) {
  const [state, setState] = useState(initialState);
  const [draftState, setDraftState] = useState(initialState);
  const [activeTab, setActiveTab] = useState('main'); // intermission, starting, main, brb, ending
  
  const [channel, setChannel] = useState(null);
  const [socket, setSocket] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [syncedTabsCount, setSyncedTabsCount] = useState(0);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Elapsed time state for main stream clock
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync states when initialState updates (e.g., from network response)
  useEffect(() => {
    setState(initialState);
    setDraftState(initialState);
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
    fetch('http://localhost:5173/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newState)
    })
      .catch(() => fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState)
      }))
      .catch(() => {});

    if (onStateChange) {
      onStateChange(newState);
    }
    triggerSyncNotice();
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

  // Apply Changes buffer click handler
  const handleApplyChanges = () => {
    commitState(draftState);
  };

  // Preset definitions
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
    <div className="w-full h-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* 1. Header Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Logo showText={true} light={true} className="scale-90" />
          <div className="hidden sm:block h-6 w-px bg-zinc-800" />
          <span className="text-xs sm:text-sm font-semibold text-brand-gold tracking-[0.25em] uppercase text-center sm:text-left">
            Broadcast Content Editor
          </span>
        </div>
        
        {/* Sync Status Badge & Save Changes Button */}
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

          <button 
            onClick={handleApplyChanges}
            className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2.5 px-6 rounded-lg border border-brand-gold/45 shadow-[0_4px_12px_rgba(212,175,55,0.15)] transition-all duration-300 transform active:scale-95"
          >
            <Save className="w-4 h-4 text-brand-gold" />
            Save Design Edits
          </button>
        </div>
      </header>

      {/* 2. Navigation Tabs */}
      <div className="flex bg-zinc-900 border-b border-zinc-800 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: 'intermission-banner', label: 'Intermission Banner' },
          { id: 'starting', label: 'Starting Soon' },
          { id: 'main', label: 'Main Stream overlay' },
          { id: 'brb', label: 'Be Right Back (BRB)' },
          { id: 'ending', label: 'Ending outro' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-6 font-black uppercase text-xs tracking-widest border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === tab.id 
                ? 'border-brand-gold text-brand-gold bg-zinc-850/50' 
                : 'border-transparent text-zinc-455 hover:text-zinc-250 hover:bg-zinc-850/20'
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
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Welcome Text / Label</label>
                <input
                  type="text"
                  value={draftState['intermission-banner'].welcomeText}
                  onChange={(e) => updateDraft('intermission-banner', 'welcomeText', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Secondary Tagline</label>
                <input
                  type="text"
                  value={draftState['intermission-banner'].tagline}
                  onChange={(e) => updateDraft('intermission-banner', 'tagline', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Announcement / Notice Announcement</label>
                <textarea
                  rows="3"
                  value={draftState['intermission-banner'].announcement}
                  onChange={(e) => updateDraft('intermission-banner', 'announcement', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Starting Soon */}
        {activeTab === 'starting' && (
          <div className="flex flex-col gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
              <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Clock className="w-4 h-4" /> Edit Starting Soon Countdown & Title
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
                </div>

                {/* Countdown Controls */}
                <div className="flex flex-col gap-4 bg-zinc-950 border border-zinc-800/80 p-5 rounded-xl">
                  <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Starting Soon Timer Setup</span>
                  <div className="flex items-center justify-between">
                    <div className="text-brand-gold font-mono text-3xl font-black tracking-widest">
                      {Math.floor(draftState.starting.countdownSeconds / 60).toString().padStart(2, '0')}:
                      {(draftState.starting.countdownSeconds % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateDraft('starting', 'countdownRunning', !draftState.starting.countdownRunning)}
                        className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider border transition-all ${
                          draftState.starting.countdownRunning
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-brand-green/20 border-brand-green/30 text-brand-gold hover:bg-brand-green/30'
                        }`}
                      >
                        {draftState.starting.countdownRunning ? 'PAUSE LIVE' : 'START LIVE'}
                      </button>
                      <button
                        onClick={() => {
                          updateDraft('starting', 'countdownSeconds', 300);
                          updateDraft('starting', 'countdownRunning', false);
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2 rounded-lg text-xs font-black tracking-wider text-zinc-300"
                      >
                        RESET (5M)
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 border-t border-zinc-800/60 pt-3">
                    {[1, 3, 5, 10].map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          updateDraft('starting', 'countdownSeconds', m * 60);
                          updateDraft('starting', 'countdownRunning', false);
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-[10px] font-black tracking-wider py-2 rounded-lg"
                      >
                        {m} Min
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Minor Ticker */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                <List className="w-4 h-4" /> Pre-Show Scrolling Ticker Items
              </h3>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">One announcement statement per line</label>
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
            </div>
          </div>
        )}

        {/* TAB 3: Main Stream Overlay */}
        {activeTab === 'main' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Banner Header & Ticker */}
            <div className="flex flex-col gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Top Segment Header Overlay
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
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Active Segment/Show Title</label>
                    <input
                      type="text"
                      value={draftState.main.segmentName}
                      onChange={(e) => updateDraft('main', 'segmentName', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-850 pt-3">
                    <span className="text-xs text-zinc-400 font-bold">Display clock uptime capsule</span>
                    <input 
                      type="checkbox"
                      checked={draftState.main.showClock}
                      onChange={(e) => updateDraft('main', 'showClock', e.target.checked)}
                      className="rounded text-brand-green focus:ring-brand-green h-4 w-4 bg-zinc-950 border-zinc-800 cursor-pointer"
                    />
                  </div>

                  {/* Uptime clock controls */}
                  <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-zinc-500 text-[10px] uppercase font-black tracking-wider font-sans">Uptime Clock</span>
                      <span className="text-brand-gold text-xl font-black tracking-widest tabular-nums">
                        {draftState.main.startTime ? formatElapsed(elapsedSeconds) : "00:00:00"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => updateDraft('main', 'startTime', Date.now())}
                        className="bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/30 text-brand-gold py-1.5 rounded-md font-bold text-2xs flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Start
                      </button>
                      <button
                        onClick={() => updateDraft('main', 'startTime', null)}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-1.5 rounded-md font-bold text-2xs flex items-center justify-center gap-1"
                      >
                        <Pause className="w-3 h-3" /> Stop
                      </button>
                      <button
                        onClick={() => updateDraft('main', 'startTime', Date.now())}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-1.5 rounded-md font-bold text-2xs flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>

                  {/* Segment presets */}
                  <div className="border-t border-zinc-850 pt-3">
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block mb-2">Segment Title Presets</span>
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {segmentPresets.map((seg, idx) => (
                        <button
                          key={idx}
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
              </div>

              {/* Scrolling ticker */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2">
                    <List className="w-4 h-4" /> Scrolling News Ticker
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
              </div>
            </div>

            {/* Host Lower-Third & Product Card */}
            <div className="flex flex-col gap-6">
              
              {/* Host Lower Third */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4" /> Host Lower-Third Nameplate
                  </h2>
                  <button
                    onClick={() => updateDraft('main', 'hostVisible', !draftState.main.hostVisible)}
                    className={`px-4 py-1.5 text-xs font-black rounded-lg border transition-all ${
                      draftState.main.hostVisible 
                        ? 'bg-brand-green border-brand-gold text-white shadow-sm' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {draftState.main.hostVisible ? 'VISIBLE' : 'HIDDEN'}
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
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Host Title / Credentials</label>
                    <input
                      type="text"
                      value={draftState.main.hostTitle}
                      onChange={(e) => updateDraft('main', 'hostTitle', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between md:col-span-2 border-t border-zinc-850 pt-3">
                    <span className="text-xs text-zinc-400 font-bold">Auto-hide nameplate after 8 seconds</span>
                    <input 
                      type="checkbox"
                      checked={draftState.main.hostAutoHide}
                      onChange={(e) => updateDraft('main', 'hostAutoHide', e.target.checked)}
                      className="rounded text-brand-green focus:ring-brand-green h-4 w-4 bg-zinc-950 border-zinc-800 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Product Flashcard */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Featured Product Flashcard
                  </h2>
                  <button
                    onClick={() => updateDraft('main', 'productVisible', !draftState.main.productVisible)}
                    className={`px-4 py-1.5 text-xs font-black rounded-lg border transition-all ${
                      draftState.main.productVisible 
                        ? 'bg-brand-green border-brand-gold text-white shadow-sm' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {draftState.main.productVisible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Product Name</label>
                      <input
                        type="text"
                        value={draftState.main.productName}
                        onChange={(e) => updateDraft('main', 'productName', e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Price Tag</label>
                      <input
                        type="text"
                        value={draftState.main.productPrice}
                        onChange={(e) => updateDraft('main', 'productPrice', e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Promo Marquee Banner Text</label>
                    <input
                      type="text"
                      value={draftState.main.productPromo}
                      onChange={(e) => updateDraft('main', 'productPromo', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Product Image URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. /images/soap.jpg"
                      value={draftState.main.productImage}
                      onChange={(e) => updateDraft('main', 'productImage', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>

                  {/* Product Presets */}
                  <div className="border-t border-zinc-850 pt-3">
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block mb-2">Apply Product Presets</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {productPresets.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            updateDraft('main', 'productName', p.name);
                            updateDraft('main', 'productPrice', p.price);
                            updateDraft('main', 'productPromo', p.promo);
                          }}
                          className="text-left p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-lg text-2xs font-semibold flex items-center justify-between transition"
                        >
                          <span className="truncate pr-2 font-bold text-zinc-350">{p.name}</span>
                          <span className="text-brand-gold font-mono shrink-0 font-bold">{p.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Notices / Scroll Items (One per line)</label>
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
              </div>

              {/* Countdown settings */}
              <div className="flex flex-col gap-4 bg-zinc-950 border border-zinc-800/80 p-5 rounded-xl">
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500">Return Timer setup</span>
                <div className="flex items-center justify-between">
                  <div className="text-brand-gold font-mono text-3xl font-black tracking-widest">
                    {Math.floor(draftState.brb.countdownSeconds / 60).toString().padStart(2, '0')}:
                    {(draftState.brb.countdownSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateDraft('brb', 'countdownRunning', !draftState.brb.countdownRunning)}
                      className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider border transition-all ${
                        draftState.brb.countdownRunning
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-brand-green/20 border-brand-green/30 text-brand-gold hover:bg-brand-green/30'
                      }`}
                    >
                      {draftState.brb.countdownRunning ? 'PAUSE LIVE' : 'START LIVE'}
                    </button>
                    <button
                      onClick={() => {
                        updateDraft('brb', 'countdownSeconds', 300);
                        updateDraft('brb', 'countdownRunning', false);
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2 rounded-lg text-xs font-black tracking-wider text-zinc-300"
                      >
                      RESET (5M)
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 border-t border-zinc-800/60 pt-3">
                  {[1, 3, 5, 10].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        updateDraft('brb', 'countdownSeconds', m * 60);
                        updateDraft('brb', 'countdownRunning', false);
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-[10px] font-black tracking-wider py-2 rounded-lg"
                    >
                      {m} Min
                    </button>
                  ))}
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
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Social Handles (One per line)</label>
                <textarea
                  rows="4"
                  value={draftState.ending.socialHandles.join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    updateDraft('ending', 'socialHandles', lines);
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default OperatorPanel;
