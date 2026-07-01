import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Eye, EyeOff, User, 
  Tag, Clock, List, RefreshCw, Layers, Award, Sparkles, Check, MessageSquare
} from 'lucide-react';
import { Logo } from './Logo';

export function OperatorPanel({ initialState, onStateChange }) {
  const [state, setState] = useState(initialState);
  const [channel, setChannel] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // Temporary input states
  const [tickerInput, setTickerInput] = useState(initialState.tickerItems.join('\n'));
  const [segmentInput, setSegmentInput] = useState(initialState.segmentName);
  const [hostNameInput, setHostNameInput] = useState(initialState.hostName);
  const [hostTitleInput, setHostTitleInput] = useState(initialState.hostTitle);
  const [productNameInput, setProductNameInput] = useState(initialState.productName);
  const [productPriceInput, setProductPriceInput] = useState(initialState.productPrice);
  const [productPromoInput, setProductPromoInput] = useState(initialState.productPromo);
  const [countdownMinutes, setCountdownMinutes] = useState(5);
  
  const [customCommentName, setCustomCommentName] = useState("");
  const [customCommentMessage, setCustomCommentMessage] = useState("");
  const [customCommentPlatform, setCustomCommentPlatform] = useState("facebook");
  
  // Notification of sync
  const [syncedTabsCount, setSyncedTabsCount] = useState(0);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Store the latest state in a ref to let WebSocket/BroadcastChannel handlers
  // read it without triggering constant reconnection cycles on state change
  const stateRef = React.useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize BroadcastChannel & WebSocket (Internet Sync for Streamlabs)
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
      const wsUrl = "wss://itty.ws/c/essensa_stream_nikuyaaa_secure";
      ws = new WebSocket(wsUrl);
      setSocket(ws);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'STATE_RESPONSE', payload: stateRef.current }));
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          handleIncomingMessage(type, payload);
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        console.warn("WebSocket closed. Reconnecting in 3 seconds...");
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connectWebSocket();
    bc.postMessage({ type: 'CONTROL_PING' });

    // Periodically broadcast state every 3 seconds to keep any newly loaded/reopened overlay synced
    const syncInterval = setInterval(() => {
      const syncMsg = { type: 'STATE_RESPONSE', payload: stateRef.current };
      bc.postMessage(syncMsg);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(syncMsg));
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

  // Broadcast any local state change
  const updateState = (updatedFields) => {
    const newState = { ...state, ...updatedFields };
    setState(newState);
    
    const msg = { type: 'UPDATE_STATE', payload: newState };
    if (channel) {
      channel.postMessage(msg);
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }

    if (onStateChange) {
      onStateChange(newState);
    }
  };

  // Handle countdown setup
  const setCountdownTime = (minutes) => {
    updateState({ countdownSeconds: minutes * 60, countdownRunning: false });
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

  const applyProductPreset = (p) => {
    setProductNameInput(p.name);
    setProductPriceInput(p.price);
    setProductPromoInput(p.promo);
    updateState({
      productName: p.name,
      productPrice: p.price,
      productPromo: p.promo
    });
  };

  const mockCommentPresets = [
    { username: "Maria Santos", message: "Wow, Buah Merah Mix is so effective!", platform: "facebook" },
    { username: "Dr. Alex Reyes", message: "Very informative segment coach! 💚", platform: "youtube" },
    { username: "Kaye Almeda", message: "Celebrating 16 years of wellness! 👏", platform: "instagram" },
    { username: "Robert Lopez", message: "Supporting organic health advocates! 🇵🇭", platform: "facebook" },
    { username: "VlogLife PH", message: "Is the buy-2-get-1 promo still active?", platform: "tiktok" }
  ];

  const injectComment = (comment) => {
    const newComment = {
      id: Date.now(),
      avatar: "",
      ...comment
    };
    
    const newComments = [...(state.comments || []), newComment];
    if (newComments.length > 4) {
      newComments.shift();
    }
    
    updateState({ comments: newComments });
    
    const msg = { type: 'ADD_COMMENT', payload: newComment };
    if (channel) {
      channel.postMessage(msg);
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* 1. Header Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Logo showText={true} light={true} className="scale-90" />
          <div className="hidden sm:block h-6 w-px bg-zinc-800" />
          <span className="text-xs sm:text-sm font-semibold text-brand-gold tracking-[0.25em] uppercase text-center sm:text-left">
            Broadcast Control Deck
          </span>
        </div>
        
        {/* Sync Status Badge */}
        <div className="flex items-center gap-3">
          {showSyncSuccess && (
            <span className="text-xs text-brand-gold animate-pulse font-medium">
              State Broadcasted!
            </span>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            syncedTabsCount > 0 
              ? 'bg-brand-green/20 text-brand-gold border border-brand-green/30' 
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}>
            <RefreshCw className={`w-3.5 h-3.5 ${syncedTabsCount > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>
              {syncedTabsCount > 0 
                ? `Connected to Overlay: ${syncedTabsCount} active` 
                : 'No Overlay tabs detected'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Deck Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-y-auto max-w-[1920px] mx-auto w-full">
        
        {/* Column 1: Scenes & Global Controls */}
        <div className="flex flex-col gap-6 xl:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layers className="w-4 h-4 text-brand-gold" /> Active Screen State
            </h2>
            <div className="flex flex-col gap-2">
              {[
                { id: 'intermission', label: 'Starting Soon (Countdown)' },
                { id: 'main', label: 'Main Stream Overlay' },
                { id: 'brb', label: 'Be Right Back' },
                { id: 'ending', label: 'Ending Credits' }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => updateState({ activeView: view.id })}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-left transition-all text-sm flex items-center justify-between border ${
                    state.activeView === view.id
                      ? 'bg-brand-green border-brand-gold text-white shadow-[0_4px_12px_rgba(212,175,55,0.15)]'
                      : 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-300'
                  }`}
                >
                  {view.label}
                  {state.activeView === view.id && <Check className="w-4 h-4 text-brand-gold" />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Clock className="w-4 h-4 text-brand-gold" /> Stream Clock
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-3 rounded-lg font-mono text-lg text-center">
                <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider font-sans">Elapsed</span>
                <span className="text-white font-bold tracking-widest">
                  {state.startTime ? "ACTIVE" : "STOPPED"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateState({ startTime: Date.now() })}
                  className="bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/40 text-brand-gold py-2 rounded font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Start
                </button>
                <button
                  onClick={() => updateState({ startTime: null })}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-2 rounded font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" /> Stop
                </button>
                <button
                  onClick={() => updateState({ startTime: Date.now() })} // Reset to now
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 py-2 rounded font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Header & Ticker Overlays */}
        <div className="flex flex-col gap-6 xl:col-span-1">
          {/* Header Bar Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-gold" /> Top Header Overlay
              </h2>
              <button
                onClick={() => updateState({ headerVisible: !state.headerVisible })}
                className={`p-1.5 rounded border transition-all ${
                  state.headerVisible 
                    ? 'bg-brand-green/20 border-brand-gold text-brand-gold' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}
              >
                {state.headerVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Segment / Tagline Message
                </label>
                <input
                  type="text"
                  value={segmentInput}
                  onChange={(e) => setSegmentInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green"
                />
              </div>
              <button
                onClick={() => updateState({ segmentName: segmentInput })}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded text-xs transition"
              >
                Apply Segment Text
              </button>
              
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-xs text-zinc-400">Show LIVE clock badge</span>
                <input 
                  type="checkbox"
                  checked={state.showClock}
                  onChange={(e) => updateState({ showClock: e.target.checked })}
                  className="rounded text-brand-green focus:ring-brand-accent h-4 w-4 bg-zinc-950 border-zinc-800 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Scrolling Ticker Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <List className="w-4 h-4 text-brand-gold" /> Bottom Ticker Crawl
              </h2>
              <button
                onClick={() => updateState({ tickerVisible: !state.tickerVisible })}
                className={`p-1.5 rounded border transition-all ${
                  state.tickerVisible 
                    ? 'bg-brand-green/20 border-brand-gold text-brand-gold' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}
              >
                {state.tickerVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Ticker Items (One per line)
                </label>
                <textarea
                  rows="4"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-green resize-none"
                />
              </div>
              <button
                onClick={() => {
                  const items = tickerInput.split('\n').filter(line => line.trim() !== '');
                  updateState({ tickerItems: items });
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded text-xs transition"
              >
                Update Ticker Items
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Host Nameplate (Lower Third) & Countdowns */}
        <div className="flex flex-col gap-6 xl:col-span-1">
          {/* Host Lower Third Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4 text-brand-gold" /> Host Lower-Third
              </h2>
              <button
                onClick={() => updateState({ hostVisible: !state.hostVisible })}
                className={`px-3 py-1 text-xs font-bold rounded border transition-all ${
                  state.hostVisible 
                    ? 'bg-brand-green border-brand-gold text-white shadow-sm' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {state.hostVisible ? 'Active' : 'Trigger'}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Host Name</label>
                <input
                  type="text"
                  value={hostNameInput}
                  onChange={(e) => setHostNameInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Host Title</label>
                <input
                  type="text"
                  value={hostTitleInput}
                  onChange={(e) => setHostTitleInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green"
                />
              </div>
              
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-xs text-zinc-400">Auto-hide after 8 seconds</span>
                <input 
                  type="checkbox"
                  checked={state.hostAutoHide}
                  onChange={(e) => updateState({ hostAutoHide: e.target.checked })}
                  className="rounded text-brand-green focus:ring-brand-green h-4 w-4 bg-zinc-950 border-zinc-800 cursor-pointer"
                />
              </div>

              <button
                onClick={() => updateState({ 
                  hostName: hostNameInput, 
                  hostTitle: hostTitleInput,
                  hostVisible: true // Trigger it as visible
                })}
                className="w-full bg-brand-green hover:bg-brand-green/90 border border-brand-gold/40 text-white font-bold py-2 rounded text-xs transition mt-1"
              >
                Update & Trigger Nameplate
              </button>
            </div>
          </div>

          {/* Countdown Clock Setup */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Clock className="w-4 h-4 text-brand-gold" /> Intermission Countdown
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 justify-between bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                <span className="text-zinc-500 text-xs font-bold font-sans uppercase">Timer State</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateState({ countdownRunning: !state.countdownRunning })}
                    className={`px-3 py-1 rounded text-xs font-extrabold ${
                      state.countdownRunning
                        ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                        : 'bg-brand-green/20 border border-brand-green/30 text-brand-gold'
                    }`}
                  >
                    {state.countdownRunning ? 'PAUSE' : 'START'}
                  </button>
                  <button
                    onClick={() => updateState({ countdownSeconds: 300, countdownRunning: false })}
                    className="bg-zinc-800 border border-zinc-700 px-2 py-1 rounded text-xs font-bold text-zinc-450 hover:bg-zinc-700"
                  >
                    RESET
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Set Timer Duration
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 3, 5, 10].map((m) => (
                    <button
                      key={m}
                      onClick={() => setCountdownTime(m)}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-xs font-bold py-1.5 rounded"
                    >
                      {m} Min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Chat Controller Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-gold" /> Live Chat Overlay
              </h2>
              <button
                onClick={() => updateState({ commentsVisible: !state.commentsVisible })}
                className={`px-3 py-1 text-xs font-bold rounded border transition-all ${
                  state.commentsVisible 
                    ? 'bg-brand-green border-brand-gold text-white shadow-sm' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {state.commentsVisible ? 'Active' : 'Trigger'}
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Variant Style Selection */}
              <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Style Variant</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateState({ commentsVariant: 'A' })}
                    className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest transition ${
                      state.commentsVariant === 'A'
                        ? 'bg-brand-green border border-brand-gold text-white'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-750'
                    }`}
                  >
                    A: GLASS
                  </button>
                  <button
                    onClick={() => updateState({ commentsVariant: 'B' })}
                    className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest transition ${
                      state.commentsVariant === 'B'
                        ? 'bg-brand-green border border-brand-gold text-white'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-750'
                    }`}
                  >
                    B: CARD
                  </button>
                </div>
              </div>

              {/* Preset mock comments to click-inject */}
              <div className="border-t border-zinc-800 pt-3">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-2">
                  Inject Viewer Comment
                </label>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
                  {mockCommentPresets.map((cmt, idx) => (
                    <button
                      key={idx}
                      onClick={() => injectComment(cmt)}
                      className="text-left w-full p-2 bg-zinc-800 hover:bg-zinc-750 text-[10px] rounded text-zinc-300 border border-zinc-750 flex flex-col gap-0.5 transition"
                    >
                      <span className="font-bold text-zinc-200 uppercase tracking-wide flex items-center justify-between w-full">
                        {cmt.username}
                        <span className="text-[8px] opacity-60 uppercase">{cmt.platform}</span>
                      </span>
                      <span className="truncate w-full text-zinc-400">{cmt.message}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom comment injection form */}
              <div className="border-t border-zinc-800 pt-3 flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                  Custom Comment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Username"
                    value={customCommentName}
                    onChange={(e) => setCustomCommentName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-green"
                  />
                  <select
                    value={customCommentPlatform}
                    onChange={(e) => setCustomCommentPlatform(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-green font-semibold"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Type message..."
                  value={customCommentMessage}
                  onChange={(e) => setCustomCommentMessage(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-green w-full"
                />
                <button
                  onClick={() => {
                    if (!customCommentName.trim() || !customCommentMessage.trim()) return;
                    injectComment({
                      username: customCommentName,
                      message: customCommentMessage,
                      platform: customCommentPlatform
                    });
                    setCustomCommentMessage("");
                  }}
                  className="bg-brand-green hover:bg-brand-green/90 border border-brand-gold/40 text-white font-bold py-1.5 rounded text-[10px] tracking-widest uppercase transition"
                >
                  Send to Live Chat
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Column 4: Product Showcase Card */}
        <div className="flex flex-col gap-6 xl:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-gold" /> Product Flashcard
              </h2>
              <button
                onClick={() => updateState({ productVisible: !state.productVisible })}
                className={`px-3 py-1 text-xs font-bold rounded border transition-all ${
                  state.productVisible 
                    ? 'bg-brand-green border-brand-gold text-white shadow-sm' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {state.productVisible ? 'Visible' : 'Hide'}
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Product Name</label>
                <input
                  type="text"
                  value={productNameInput}
                  onChange={(e) => setProductNameInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Price Tag</label>
                <input
                  type="text"
                  value={productPriceInput}
                  onChange={(e) => setProductPriceInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-mono"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Promo Marquee Text</label>
                <input
                  type="text"
                  value={productPromoInput}
                  onChange={(e) => setProductPromoInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green"
                />
              </div>

              <button
                onClick={() => updateState({ 
                  productName: productNameInput,
                  productPrice: productPriceInput,
                  productPromo: productPromoInput,
                  productVisible: true
                })}
                className="w-full bg-brand-green hover:bg-brand-green/90 border border-brand-gold/40 text-white font-bold py-2 rounded text-xs transition"
              >
                Update & Show Product
              </button>

              {/* Product Presets */}
              <div className="border-t border-zinc-800 pt-3 mt-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-2">
                  Select Product Preset
                </label>
                <div className="flex flex-col gap-1">
                  {productPresets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyProductPreset(p)}
                      className="text-left w-full px-2 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-[11px] font-semibold rounded text-zinc-300 border border-zinc-750 flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{p.name}</span>
                      <span className="text-brand-gold font-mono shrink-0">{p.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Footer Segment Presets Area */}
      <footer className="bg-zinc-900 border-t border-zinc-800 p-6 shrink-0">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-brand-gold" /> Segment Preset Selector
        </h3>
        <div className="flex flex-wrap gap-2">
          {segmentPresets.map((seg, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSegmentInput(seg);
                updateState({ segmentName: seg });
              }}
              className={`px-4 py-2 rounded text-xs font-semibold border transition-all ${
                state.segmentName === seg
                  ? 'bg-brand-green border-brand-gold text-white font-bold'
                  : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default OperatorPanel;
