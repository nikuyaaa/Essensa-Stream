import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Eye, EyeOff, User, 
  Tag, Clock, List, RefreshCw, Layers, Sparkles, Save, Globe, Facebook, Youtube, Instagram, Settings, Plus, Trash
} from 'lucide-react';
import { Logo } from './Logo';
import { Tooltip } from './Tooltip';
import { TooltipTexts } from './TooltipTexts';

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

  // Field-isolated formatting states dictionary for dynamic text token builder
  const [formattingStates, setFormattingStates] = useState({});

  // Live selection tracking state
  const [activeSelection, setActiveSelection] = useState(null);

  // Sync states when initialState updates (e.g., from network response)
  useEffect(() => {
    const hasConfigChanged = !state ||
      JSON.stringify(initialState['intermission-banner']) !== JSON.stringify(state['intermission-banner']) ||
      JSON.stringify(initialState.starting) !== JSON.stringify(state.starting) ||
      JSON.stringify(initialState.main) !== JSON.stringify(state.main) ||
      JSON.stringify(initialState.brb) !== JSON.stringify(state.brb) ||
      JSON.stringify(initialState.ending) !== JSON.stringify(state.ending) ||
      JSON.stringify(initialState['dual-pov']) !== JSON.stringify(state['dual-pov']) ||
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

  // Keyword split-tone tag formatting helpers
  const handleTextSelect = (inputId, tab, field, event) => {
    const input = event.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    if (start !== end && start !== null && end !== null) {
      setActiveSelection({
        inputId,
        tab,
        field,
        start,
        end,
        selectedText: input.value.substring(start, end)
      });
    } else {
      setActiveSelection(null);
    }
  };

  const handleLiveFormattingUpdate = (inputId, newColor, newEffect) => {
    if (!activeSelection || activeSelection.inputId !== inputId) return;
    
    const { tab, field, start, end } = activeSelection;
    const text = draftState[tab]?.[field] || "";
    
    let tagOpen = "";
    let tagClose = "";
    
    if (newEffect === 'none') {
      tagOpen = `[color=${newColor}]`;
      tagClose = `[/color]`;
    } else {
      tagOpen = `[effect=${newEffect} color=${newColor}]`;
      tagClose = `[/effect]`;
    }
    
    const selectedText = text.substring(start, end);
    const cleanSelected = selectedText.replace(/\[\/?gold\]|\[\/?green\]|<\/?b>|<\/?gold>|\[color=[^\]]+\]|\[\/color\]|\[effect=[^\]]+\]|\[\/effect\]/gi, "");
    
    const newText = text.substring(0, start) + `${tagOpen}${cleanSelected}${tagClose}` + text.substring(end);
    updateDraft(tab, field, newText);
    
    const newEnd = start + tagOpen.length + cleanSelected.length + tagClose.length;
    
    setActiveSelection({
      inputId,
      tab,
      field,
      start,
      end: newEnd,
      selectedText: `${tagOpen}${cleanSelected}${tagClose}`
    });
    
    setTimeout(() => {
      const input = document.getElementById(inputId);
      if (input) {
        input.focus();
        input.setSelectionRange(start, newEnd);
      }
    }, 50);
  };

  const applyDynamicTag = (tab, field, inputId) => {
    const formatState = formattingStates[inputId] || { color: '#D4AF37', effect: 'none' };
    const colorVal = formatState.color;
    const effectVal = formatState.effect;

    if (activeSelection && activeSelection.inputId === inputId) {
      handleLiveFormattingUpdate(inputId, colorVal, effectVal);
      return;
    }

    let tagOpen = "";
    let tagClose = "";
    
    if (effectVal === 'none') {
      tagOpen = `[color=${colorVal}]`;
      tagClose = `[/color]`;
    } else {
      tagOpen = `[effect=${effectVal} color=${colorVal}]`;
      tagClose = `[/effect]`;
    }
    
    const text = draftState[tab]?.[field] || "";
    
    // Fallback: wrap the last word
    const clean = text.replace(/\[\/?gold\]|\[\/?green\]|<\/?b>|<\/?gold>|\[color=[^\]]+\]|\[\/color\]|\[effect=[^\]]+\]|\[\/effect\]/gi, "");
    const words = clean.trim().split(/\s+/);
    if (words.length > 0 && words[0] !== "") {
      words[words.length - 1] = `${tagOpen}${words[words.length - 1]}${tagClose}`;
      updateDraft(tab, field, words.join(" "));
    }
  };

  const clearInputTags = (tab, field, inputId) => {
    const input = document.getElementById(inputId);
    const text = input ? input.value : (draftState[tab]?.[field] || "");
    const clean = text.replace(/\[\/?gold\]|\[\/?green\]|<\/?b>|<\/?gold>|\[color=[^\]]+\]|\[\/color\]|\[effect=[^\]]+\]|\[\/effect\]/gi, "");
    updateDraft(tab, field, clean);
    setActiveSelection(null);
  };

  const renderFormatterButtons = (tab, field, inputId) => {
    const formatState = formattingStates[inputId] || { color: '#D4AF37', effect: 'none' };
    const activeColor = formatState.color;
    const activeEffect = formatState.effect;

    return (
      <div className="flex flex-wrap items-center gap-3 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-850 select-none mt-1 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-zinc-500 uppercase tracking-wider font-sans">Color:</span>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 relative cursor-pointer active:scale-[0.98] transition hover:border-zinc-700" title="Select custom color">
            <input
              type="color"
              value={activeColor}
              onChange={(e) => {
                const val = e.target.value;
                setFormattingStates(prev => ({
                  ...prev,
                  [inputId]: {
                    ...(prev[inputId] || { color: '#D4AF37', effect: 'none' }),
                    color: val
                  }
                }));
                handleLiveFormattingUpdate(inputId, val, activeEffect);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-3.5 h-3.5 rounded border border-black/40 shadow-inner" style={{ backgroundColor: activeColor }} />
            <span className="text-[9px] text-zinc-300 font-mono font-bold uppercase tracking-wider">{activeColor}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-black text-zinc-500 uppercase tracking-wider">Effect:</span>
          <select
            value={activeEffect}
            onChange={(e) => {
              const val = e.target.value;
              setFormattingStates(prev => ({
                ...prev,
                [inputId]: {
                  ...(prev[inputId] || { color: '#D4AF37', effect: 'none' }),
                  effect: val
                }
              }));
              handleLiveFormattingUpdate(inputId, activeColor, val);
            }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold px-1.5 py-0.5 rounded text-[9px] outline-none cursor-pointer focus:border-brand-green"
          >
            <option value="none">Solid Color</option>
            <option value="sunray">Metallic Sunray</option>
            <option value="glow">Neon Glow</option>
            <option value="gradient">Metallic Gradient</option>
            <option value="glitch">Glitch Aberration</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => applyDynamicTag(tab, field, inputId)}
            className="bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/35 text-brand-gold font-black uppercase tracking-wider text-[9px] px-2.5 py-0.5 rounded cursor-pointer transition active:scale-95"
            title="Wrap text with selected color & effect"
          >
            Wrap Text
          </button>
          <button
            type="button"
            onClick={() => clearInputTags(tab, field, inputId)}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 font-black uppercase tracking-wider text-[9px] px-2 py-0.5 rounded cursor-pointer transition active:scale-95"
            title="Clear format tags"
          >
            Clear
          </button>
        </div>
      </div>
    );
  };

  const renderEffectSliders = (tab) => (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Broadcast Text Effects Animation Settings</span>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* 1. Metallic Sunray */}
        <div className="flex flex-col gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
          <span className="text-[10px] uppercase font-black text-brand-gold">Metallic Sunray Animation Settings</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                <span>Speed (seconds) <Tooltip text={TooltipTexts['animation.sunraySpeed']} /></span>
                <span className="text-zinc-200 font-bold">{draftState[tab]?.sunraySpeed || 4}s</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="15" 
                step="0.5"
                value={draftState[tab]?.sunraySpeed || 4} 
                onChange={(e) => updateDraft(tab, 'sunraySpeed', parseFloat(e.target.value))}
                className="w-full accent-brand-gold bg-zinc-900 border border-zinc-800 rounded h-2 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                <span>Glow Intensity <Tooltip text={TooltipTexts['animation.sunrayIntensity']} /></span>
                <span className="text-zinc-200 font-bold">{(draftState[tab]?.sunrayIntensity ?? 0.3).toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={draftState[tab]?.sunrayIntensity ?? 0.3} 
                onChange={(e) => updateDraft(tab, 'sunrayIntensity', parseFloat(e.target.value))}
                className="w-full accent-brand-gold bg-zinc-900 border border-zinc-800 rounded h-2 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. Neon Glow */}
        <div className="flex flex-col gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
          <span className="text-[10px] uppercase font-black text-brand-green">Neon Glow Animation Settings</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                <span>Speed (seconds) <Tooltip text={TooltipTexts['animation.glowSpeed']} /></span>
                <span className="text-zinc-200 font-bold">{draftState[tab]?.glowSpeed || 2.5}s</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="15" 
                step="0.5"
                value={draftState[tab]?.glowSpeed || 2.5} 
                onChange={(e) => updateDraft(tab, 'glowSpeed', parseFloat(e.target.value))}
                className="w-full accent-brand-green bg-zinc-900 border border-zinc-800 rounded h-2 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                <span>Glow Intensity <Tooltip text={TooltipTexts['animation.glowIntensity']} /></span>
                <span className="text-zinc-200 font-bold">{(draftState[tab]?.glowIntensity ?? 0.3).toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={draftState[tab]?.glowIntensity ?? 0.3} 
                onChange={(e) => updateDraft(tab, 'glowIntensity', parseFloat(e.target.value))}
                className="w-full accent-brand-green bg-zinc-900 border border-zinc-800 rounded h-2 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Metallic Gradient */}
        <div className="flex flex-col gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
          <span className="text-[10px] uppercase font-black text-cyan-400">Metallic Gradient Animation Settings</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                <span>Speed (seconds) <Tooltip text={TooltipTexts['animation.gradientSpeed']} /></span>
                <span className="text-zinc-200 font-bold">{draftState[tab]?.gradientSpeed || 6}s</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="15" 
                step="0.5"
                value={draftState[tab]?.gradientSpeed || 6} 
                onChange={(e) => updateDraft(tab, 'gradientSpeed', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-zinc-900 border border-zinc-800 rounded h-2 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                <span>Shimmer Intensity <Tooltip text={TooltipTexts['animation.gradientIntensity']} /></span>
                <span className="text-zinc-200 font-bold">{(draftState[tab]?.gradientIntensity ?? 0.45).toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={draftState[tab]?.gradientIntensity ?? 0.45} 
                onChange={(e) => updateDraft(tab, 'gradientIntensity', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-zinc-900 border border-zinc-800 rounded h-2 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. Glitch Aberration */}
        <div className="flex flex-col gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
          <span className="text-[10px] uppercase font-black text-orange-400">Glitch Aberration Animation Settings</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                <span>Speed (seconds) <Tooltip text={TooltipTexts['animation.glitchSpeed']} /></span>
                <span className="text-zinc-200 font-bold">{draftState[tab]?.glitchSpeed || 3}s</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="15" 
                step="0.5"
                value={draftState[tab]?.glitchSpeed || 3} 
                onChange={(e) => updateDraft(tab, 'glitchSpeed', parseFloat(e.target.value))}
                className="w-full accent-orange-400 bg-zinc-900 border border-zinc-800 rounded h-2 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                <span>Glitch Offset <Tooltip text={TooltipTexts['animation.glitchIntensity']} /></span>
                <span className="text-zinc-200 font-bold">{(draftState[tab]?.glitchIntensity ?? 0.75).toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={draftState[tab]?.glitchIntensity ?? 0.75} 
                onChange={(e) => updateDraft(tab, 'glitchIntensity', parseFloat(e.target.value))}
                className="w-full accent-orange-400 bg-zinc-900 border border-zinc-800 rounded h-2 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );



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

  const formatSecondsHMS = (totalSecs) => {
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
          { id: 'dual-pov', label: 'Dual-POV Overlay' },
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
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Left-side Header Welcome Text <Tooltip text={TooltipTexts['intermission.welcomeText']} /></label>
                <input
                  type="text"
                  id="intermission_welcomeText"
                  value={draftState['intermission-banner'].welcomeText}
                  onChange={(e) => updateDraft('intermission-banner', 'welcomeText', e.target.value)}
                  onSelect={(e) => handleTextSelect('intermission_welcomeText', 'intermission-banner', 'welcomeText', e)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
                {renderFormatterButtons('intermission-banner', 'welcomeText', 'intermission_welcomeText')}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Left-side Tagline Description <Tooltip text={TooltipTexts['intermission.tagline']} /></label>
                <input
                  type="text"
                  value={draftState['intermission-banner'].tagline}
                  onChange={(e) => updateDraft('intermission-banner', 'tagline', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Left-side Notice Announcement <Tooltip text={TooltipTexts['intermission.announcement']} /></label>
                <textarea
                  rows="2"
                  id="intermission_announcement"
                  value={draftState['intermission-banner'].announcement}
                  onChange={(e) => updateDraft('intermission-banner', 'announcement', e.target.value)}
                  onSelect={(e) => handleTextSelect('intermission_announcement', 'intermission-banner', 'announcement', e)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                />
                {renderFormatterButtons('intermission-banner', 'announcement', 'intermission_announcement')}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Right-side Banner Header <Tooltip text={TooltipTexts['intermission.rightHeader']} /></label>
                <input
                  type="text"
                  id="intermission_rightHeader"
                  value={draftState['intermission-banner'].rightHeader || ''}
                  onChange={(e) => updateDraft('intermission-banner', 'rightHeader', e.target.value)}
                  onSelect={(e) => handleTextSelect('intermission_rightHeader', 'intermission-banner', 'rightHeader', e)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
                {renderFormatterButtons('intermission-banner', 'rightHeader', 'intermission_rightHeader')}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Right-side Dynamic Alert Message (Optional) <Tooltip text={TooltipTexts['intermission.alertText']} /></label>
                <input
                  type="text"
                  placeholder="e.g. SPECIAL PROMO REVEAL AT 8PM!"
                  value={draftState['intermission-banner'].alertText || ''}
                  onChange={(e) => updateDraft('intermission-banner', 'alertText', e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-sm text-red-400 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Right-side Body Subtext <Tooltip text={TooltipTexts['intermission.rightBody']} /></label>
                <textarea
                  rows="2"
                  value={draftState['intermission-banner'].rightBody || ''}
                  onChange={(e) => updateDraft('intermission-banner', 'rightBody', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                />
              </div>

              {/* Standalone Brand Logo Form */}
              <div className="flex flex-col gap-1.5 md:col-span-2 bg-zinc-950 p-4 rounded-xl border border-zinc-855">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Scene Brand Logo (Image/Video Loop) <Tooltip text={TooltipTexts['intermission.logoUrl']} /></label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    handleFileUpload(e, (url) => {
                      updateDraft('intermission-banner', 'logoUrl', url);
                    });
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 w-full cursor-pointer focus:outline-none"
                />
                {draftState['intermission-banner'].logoUrl && (
                  <span className="text-[9px] text-brand-gold font-bold truncate max-w-[400px] mt-1.5">
                    Loaded URL: {draftState['intermission-banner'].logoUrl}
                  </span>
                )}
              </div>
            </div>

            {/* Intermission Specific Social Media handles config */}
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 flex flex-col gap-4 mt-2">
              <h3 className="text-xs font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2">
                <Globe className="w-3.5 h-3.5" /> Intermission-Specific Social Media Handles
              </h3>
              <div className="flex flex-col gap-3">
                {(draftState['intermission-banner'].socials || []).map((handle, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    <div className="flex flex-col gap-1 w-36">
                      <label className="text-[8px] uppercase font-black text-zinc-500">Platform</label>
                      <select
                        value={handle.platform}
                        onChange={(e) => {
                          const val = e.target.value;
                          const arr = [...draftState['intermission-banner'].socials];
                          arr[idx] = { ...arr[idx], platform: val };
                          updateDraft('intermission-banner', 'socials', arr);
                        }}
                        className="bg-zinc-950 border border-zinc-800 text-xs rounded p-1.5 font-bold text-zinc-350 cursor-pointer"
                      >
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                        <option value="globe">Website (Globe)</option>
                      </select>
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[8px] uppercase font-black text-zinc-500">Display Handle text</label>
                      <input
                        type="text"
                        value={handle.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          const arr = [...draftState['intermission-banner'].socials];
                          arr[idx] = { ...arr[idx], text: val };
                          updateDraft('intermission-banner', 'socials', arr);
                        }}
                        className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs font-bold text-zinc-200 focus:outline-none w-full"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const arr = draftState['intermission-banner'].socials.filter((s, sIdx) => sIdx !== idx);
                        updateDraft('intermission-banner', 'socials', arr);
                      }}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 p-2 rounded mt-3 transition shrink-0"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const arr = [...(draftState['intermission-banner'].socials || []), { platform: 'facebook', text: '@MyHandle' }];
                  updateDraft('intermission-banner', 'socials', arr);
                }}
                className="py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-2xs font-black uppercase text-brand-gold tracking-widest flex items-center justify-center gap-1.5 mt-1 transition"
              >
                <Plus className="w-3 h-3" /> Add Custom Intermission Handle
              </button>
            </div>

            {/* Effect animation sliders */}
            <div className="mt-4">
              {renderEffectSliders('intermission-banner')}
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
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Supertitle Header <Tooltip text={TooltipTexts['starting.superTitle']} /></label>
                    <input
                      type="text"
                      id="starting_superTitle"
                      value={draftState.starting.superTitle || ''}
                      onChange={(e) => updateDraft('starting', 'superTitle', e.target.value)}
                      onSelect={(e) => handleTextSelect('starting_superTitle', 'starting', 'superTitle', e)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                    {renderFormatterButtons('starting', 'superTitle', 'starting_superTitle')}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Header Announcement <Tooltip text={TooltipTexts['starting.announcement']} /></label>
                    <input
                      type="text"
                      id="starting_announcement"
                      value={draftState.starting.announcement}
                      onChange={(e) => updateDraft('starting', 'announcement', e.target.value)}
                      onSelect={(e) => handleTextSelect('starting_announcement', 'starting', 'announcement', e)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                    {renderFormatterButtons('starting', 'announcement', 'starting_announcement')}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Core Subtitle Layer <Tooltip text={TooltipTexts['starting.subTitle']} /></label>
                    <input
                      type="text"
                      id="starting_subTitle"
                      value={draftState.starting.subTitle || ''}
                      onChange={(e) => updateDraft('starting', 'subTitle', e.target.value)}
                      onSelect={(e) => handleTextSelect('starting_subTitle', 'starting', 'subTitle', e)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                    {renderFormatterButtons('starting', 'subTitle', 'starting_subTitle')}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Tagline Description <Tooltip text={TooltipTexts['starting.tagline']} /></label>
                    <input
                      type="text"
                      value={draftState.starting.tagline}
                      onChange={(e) => updateDraft('starting', 'tagline', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                  </div>

                  {/* Standalone Logo Uploader */}
                  <div className="flex flex-col gap-1.5 bg-zinc-950 p-4 rounded-xl border border-zinc-855">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Scene Brand Logo (Image/Video Loop) <Tooltip text={TooltipTexts['starting.logoUrl']} /></label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        handleFileUpload(e, (url) => {
                          updateDraft('starting', 'logoUrl', url);
                        });
                      }}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 w-full cursor-pointer focus:outline-none"
                    />
                    {draftState.starting.logoUrl && (
                      <span className="text-[9px] text-brand-gold font-bold truncate max-w-[400px] mt-1.5">
                        Loaded URL: {draftState.starting.logoUrl}
                      </span>
                    )}
                  </div>

                  {/* Effect animation sliders */}
                  <div className="mt-4">
                    {renderEffectSliders('starting')}
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
                      {formatSecondsHMS(state.starting.countdownSeconds)}
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
                        onClick={() => triggerStartingCountdownAction('reset', (state.timerPresets?.starting?.[2] || 900))}
                        className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 px-3 py-2 rounded-lg text-xs font-black tracking-wider text-zinc-300 transition-all"
                      >
                        RESET (15M)
                      </button>
                    </div>
                  </div>
                  
                  {/* Preset quick actions dynamic grid */}
                  <div className="flex flex-col gap-2 border-t border-zinc-800/60 pt-3">
                    <span className="text-[9px] uppercase font-black text-zinc-500">Duration Presets <Tooltip text={TooltipTexts['starting.durationPresets']} /></span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(state.timerPresets?.starting || [300, 600, 900, 1800, 3600]).map((seconds) => {
                        const mins = Math.floor(seconds / 60);
                        return (
                          <button
                            key={seconds}
                            onClick={() => triggerStartingCountdownAction('reset', seconds)}
                            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-[10px] font-black py-2 rounded-lg text-zinc-350 hover:text-brand-gold transition-all"
                          >
                            {mins} Min
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* HMS Custom duration loader */}
                  <div className="flex flex-col gap-2 border-t border-zinc-800/60 pt-3">
                    <span className="text-[9px] uppercase font-black text-zinc-500">Set Custom Temporal Time <Tooltip text={TooltipTexts['starting.customTime']} /></span>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <label className="text-[8px] uppercase text-zinc-500 font-bold mb-1">HH</label>
                        <input 
                          type="number" 
                          placeholder="00" 
                          min="0"
                          max="23"
                          id="starting_custom_hh"
                          defaultValue="0"
                          className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs w-12 text-center font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                        />
                      </div>
                      <span className="text-zinc-600 font-bold mt-4">:</span>
                      <div className="flex flex-col items-center">
                        <label className="text-[8px] uppercase text-zinc-500 font-bold mb-1">MM</label>
                        <input 
                          type="number" 
                          placeholder="05" 
                          min="0"
                          max="59"
                          id="starting_custom_mm"
                          defaultValue="5"
                          className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs w-12 text-center font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                        />
                      </div>
                      <span className="text-zinc-600 font-bold mt-4">:</span>
                      <div className="flex flex-col items-center">
                        <label className="text-[8px] uppercase text-zinc-500 font-bold mb-1">SS</label>
                        <input 
                          type="number" 
                          placeholder="00" 
                          min="0"
                          max="59"
                          id="starting_custom_ss"
                          defaultValue="0"
                          className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs w-12 text-center font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const hh = parseInt(document.getElementById('starting_custom_hh').value) || 0;
                          const mm = parseInt(document.getElementById('starting_custom_mm').value) || 0;
                          const ss = parseInt(document.getElementById('starting_custom_ss').value) || 0;
                          const totalSeconds = (hh * 3600) + (mm * 60) + ss;
                          if (totalSeconds > 0) {
                            triggerStartingCountdownAction('reset', totalSeconds);
                          }
                        }}
                        className="bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/30 text-brand-gold text-[10px] font-black uppercase py-2 px-3.5 rounded-lg transition-all mt-4"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
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
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Show Title <Tooltip text={TooltipTexts['main.segmentName']} /></label>
                    <input
                      type="text"
                      id="main_segmentName"
                      value={draftState.main.segmentName}
                      onChange={(e) => updateDraft('main', 'segmentName', e.target.value)}
                      onSelect={(e) => handleTextSelect('main_segmentName', 'main', 'segmentName', e)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                    {renderFormatterButtons('main', 'segmentName', 'main_segmentName')}
                  </div>

                  {/* Standalone Logo Uploader for Ticker branding */}
                  <div className="flex flex-col gap-1.5 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">News Ticker Brand Logo (Image/Video Loop) <Tooltip text={TooltipTexts['main.logoUrl']} /></label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        handleFileUpload(e, (url) => {
                          updateDraft('main', 'logoUrl', url);
                        });
                      }}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-350 w-full cursor-pointer focus:outline-none"
                    />
                    {draftState.main.logoUrl && (
                      <span className="text-[9px] text-brand-gold font-bold truncate max-w-[400px] mt-1.5">
                        Loaded URL: {draftState.main.logoUrl}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-855 pt-3">
                    <span className="text-xs text-zinc-400 font-bold">Show clock uptime capsule <Tooltip text={TooltipTexts['main.clockUptime']} /></span>
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
                      <span className="text-zinc-500 text-[10px] uppercase font-black tracking-wider font-sans">Uptime Clock <Tooltip text={TooltipTexts['main.uptimeClock']} /></span>
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
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block mb-2">Preset Segments <Tooltip text={TooltipTexts['main.presetSegments']} /></span>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">One news statement per line <Tooltip text={TooltipTexts['main.tickerItems']} /></label>
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
                
                {/* News Ticker Speed slider */}
                <div className="flex flex-col gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                  <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                    <span>Ticker Scrolling Duration (Seconds) <Tooltip text={TooltipTexts['main.tickerSpeed']} /></span>
                    <span className="text-zinc-200 font-bold">{draftState.main.tickerSpeed || 60}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="180" 
                    step="5"
                    value={draftState.main.tickerSpeed || 60} 
                    onChange={(e) => updateDraft('main', 'tickerSpeed', parseInt(e.target.value) || 60)}
                    className="w-full accent-brand-gold bg-zinc-900 border border-zinc-800 rounded h-2 cursor-pointer"
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

              {/* Text Animation Settings */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Sparkles className="w-4 h-4 text-brand-gold" /> Text Animation Settings
                </h2>
                <div>
                  {renderEffectSliders('main')}
                </div>
                <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                  <button
                    onClick={() => commitSection('main')}
                    className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-brand-gold" />
                    Save Text Animation Settings
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
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Host Name <Tooltip text={TooltipTexts['main.hostName']} /></label>
                    <input
                      type="text"
                      id="main_hostName"
                      value={draftState.main.hostName}
                      onChange={(e) => updateDraft('main', 'hostName', e.target.value)}
                      onSelect={(e) => handleTextSelect('main_hostName', 'main', 'hostName', e)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                    {renderFormatterButtons('main', 'hostName', 'main_hostName')}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Credentials Title <Tooltip text={TooltipTexts['main.hostTitle']} /></label>
                    <input
                      type="text"
                      id="main_hostTitle"
                      value={draftState.main.hostTitle}
                      onChange={(e) => updateDraft('main', 'hostTitle', e.target.value)}
                      onSelect={(e) => handleTextSelect('main_hostTitle', 'main', 'hostTitle', e)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                    />
                    {renderFormatterButtons('main', 'hostTitle', 'main_hostTitle')}
                  </div>

                  {/* Host visibility timer parameters */}
                  <div className="flex flex-col gap-2 md:col-span-2 border-t border-zinc-850 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-bold">Auto-hide host nameplate automatically <Tooltip text={TooltipTexts['main.hostAutoHide']} /></span>
                      <input 
                        type="checkbox"
                        checked={draftState.main.hostAutoHide}
                        onChange={(e) => updateDraft('main', 'hostAutoHide', e.target.checked)}
                        className="rounded text-brand-green focus:ring-brand-green h-4 w-4 bg-zinc-950 border-zinc-800 cursor-pointer"
                      />
                    </div>
                    {draftState.main.hostAutoHide && (
                      <div className="flex flex-col gap-2 mt-1 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                        <span className="text-[9px] uppercase font-black text-zinc-500">Auto-Hide Duration (seconds) <Tooltip text={TooltipTexts['main.hostHideDuration']} /></span>
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
                          <label className="text-[9px] uppercase font-black text-zinc-400">Product Name <Tooltip text={TooltipTexts['main.productName']} /></label>
                          <input
                            type="text"
                            value={product.name || ''}
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
                          <label className="text-[9px] uppercase font-black text-zinc-400">Price Pill <Tooltip text={TooltipTexts['main.productPrice']} /></label>
                          <div className="flex bg-zinc-900 border border-zinc-800 focus-within:border-brand-green rounded overflow-hidden">
                            <span className="bg-zinc-950 px-2.5 py-1.5 text-xs text-brand-gold font-bold select-none border-r border-zinc-850 flex items-center">
                              ₱
                            </span>
                            <input
                              type="text"
                              value={(product.price || '').replace(/^₱/, '')}
                              onChange={(e) => {
                                const rawVal = e.target.value.replace(/₱/g, '');
                                const val = `₱${rawVal}`;
                                setDraftState(prev => {
                                  const updated = prev.main.products.map(p => p.id === product.id ? { ...p, price: val } : p);
                                  return { ...prev, main: { ...prev.main, products: updated } };
                                });
                              }}
                              className="bg-transparent px-2.5 py-1.5 text-xs font-bold text-zinc-100 focus:outline-none w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-black text-zinc-400">Promo Scrolling Banner <Tooltip text={TooltipTexts['main.productPromoText']} /></label>
                        <input
                          type="text"
                          value={product.promoText || ''}
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

                      {/* Product Marquee Ticker Speed Slider */}
                      <div className="flex flex-col gap-2 bg-zinc-900/60 p-3 rounded border border-zinc-855">
                        <div className="flex justify-between text-[9px] uppercase font-black text-zinc-400">
                          <span>Scrolling Speed (Seconds) <Tooltip text={TooltipTexts['main.productTickerSpeed']} /></span>
                          <span className="text-zinc-200 font-bold">{product.speed || 25}s</span>
                        </div>
                        <input 
                          type="range" 
                          min="5" 
                          max="100" 
                          step="5"
                          value={product.speed || 25} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 25;
                            setDraftState(prev => {
                              const updated = prev.main.products.map(p => p.id === product.id ? { ...p, speed: val } : p);
                              return { ...prev, main: { ...prev.main, products: updated } };
                            });
                          }}
                          className="w-full accent-brand-gold bg-zinc-950 border border-zinc-800 rounded h-1.5 cursor-pointer"
                        />
                      </div>

                      {/* Direct file upload wrapper */}
                      <div className="flex flex-col gap-1 bg-zinc-900/60 p-2.5 rounded border border-zinc-850">
                        <span className="text-[8px] uppercase font-black text-zinc-500">Asset File Upload (Image / Animated GIF / Video MP4) <Tooltip text={TooltipTexts['main.productImage']} /></span>
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
                          <span className="text-[9px] uppercase font-black text-zinc-400">Stay on screen indefinitely <Tooltip text={TooltipTexts['main.productPermanent']} /></span>
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
                            <span className="text-[8px] uppercase font-black text-zinc-500">Auto-Hide Duration (seconds) <Tooltip text={TooltipTexts['main.productHideDuration']} /></span>
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
                        <span className="text-[8px] uppercase font-black text-zinc-500 block mb-1.5">Apply Presets directly <Tooltip text={TooltipTexts['main.productPresets']} /></span>
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
                              className="text-left p-1.5 bg-zinc-900 border border-zinc-855 hover:bg-zinc-850 rounded text-[9px] font-semibold flex items-center justify-between transition"
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

        {/* TAB: Dual-POV Overlay */}
        {activeTab === 'dual-pov' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6 animate-fade-in">
            <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layers className="w-4 h-4 text-brand-gold" /> Edit Dual-POV Screen Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                      Header Title <Tooltip text={TooltipTexts['dual-pov.segmentName']} />
                    </label>
                    {renderFormatterButtons('dual-pov', 'segmentName', 'dual_pov_segmentName')}
                  </div>
                  <input
                    type="text"
                    id="dual_pov_segmentName"
                    value={draftState['dual-pov']?.segmentName || ''}
                    onChange={(e) => updateDraft('dual-pov', 'segmentName', e.target.value)}
                    onSelect={(e) => handleTextSelect('dual_pov_segmentName', 'dual-pov', 'segmentName', e)}
                    className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs font-semibold text-zinc-100 placeholder-zinc-650 w-full focus:outline-none focus:border-brand-green/60 shadow-inner"
                    placeholder="Enter header title text..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                      Cam 1 Label (Host) <Tooltip text={TooltipTexts['dual-pov.cam1Label']} />
                    </label>
                    {renderFormatterButtons('dual-pov', 'cam1Label', 'dual_pov_cam1Label')}
                  </div>
                  <input
                    type="text"
                    id="dual_pov_cam1Label"
                    value={draftState['dual-pov']?.cam1Label || ''}
                    onChange={(e) => updateDraft('dual-pov', 'cam1Label', e.target.value)}
                    onSelect={(e) => handleTextSelect('dual_pov_cam1Label', 'dual-pov', 'cam1Label', e)}
                    className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs font-semibold text-zinc-100 placeholder-zinc-650 w-full focus:outline-none focus:border-brand-green/60 shadow-inner"
                    placeholder="Enter camera 1 label..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                      Cam 2 Label (Guest) <Tooltip text={TooltipTexts['dual-pov.cam2Label']} />
                    </label>
                    {renderFormatterButtons('dual-pov', 'cam2Label', 'dual_pov_cam2Label')}
                  </div>
                  <input
                    type="text"
                    id="dual_pov_cam2Label"
                    value={draftState['dual-pov']?.cam2Label || ''}
                    onChange={(e) => updateDraft('dual-pov', 'cam2Label', e.target.value)}
                    onSelect={(e) => handleTextSelect('dual_pov_cam2Label', 'dual-pov', 'cam2Label', e)}
                    className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs font-semibold text-zinc-100 placeholder-zinc-650 w-full focus:outline-none focus:border-brand-green/60 shadow-inner"
                    placeholder="Enter camera 2 label..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                      Sub-text Metadata <Tooltip text={TooltipTexts['dual-pov.subText']} />
                    </label>
                    {renderFormatterButtons('dual-pov', 'subText', 'dual_pov_subText')}
                  </div>
                  <input
                    type="text"
                    id="dual_pov_subText"
                    value={draftState['dual-pov']?.subText || ''}
                    onChange={(e) => updateDraft('dual-pov', 'subText', e.target.value)}
                    onSelect={(e) => handleTextSelect('dual_pov_subText', 'dual-pov', 'subText', e)}
                    className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs font-semibold text-zinc-100 placeholder-zinc-650 w-full focus:outline-none focus:border-brand-green/60 shadow-inner"
                    placeholder="Enter bottom sub-text..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                      Sharp Accent Tag <Tooltip text={TooltipTexts['dual-pov.accentTag']} />
                    </label>
                    {renderFormatterButtons('dual-pov', 'accentTag', 'dual_pov_accentTag')}
                  </div>
                  <input
                    type="text"
                    id="dual_pov_accentTag"
                    value={draftState['dual-pov']?.accentTag || ''}
                    onChange={(e) => updateDraft('dual-pov', 'accentTag', e.target.value)}
                    onSelect={(e) => handleTextSelect('dual_pov_accentTag', 'dual-pov', 'accentTag', e)}
                    className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs font-semibold text-zinc-100 placeholder-zinc-650 w-full focus:outline-none focus:border-brand-green/60 shadow-inner"
                    placeholder="Enter accent capsule pill text..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              {renderEffectSliders('dual-pov')}
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={() => commitSection('dual-pov')}
                className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2.5 px-6 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
              >
                <Save className="w-4 h-4 text-brand-gold" />
                Save Dual-POV Details
              </button>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">BRB Banner Header Text <Tooltip text={TooltipTexts['brb.bannerText']} /></label>
                  <input
                    type="text"
                    id="brb_bannerText"
                    value={draftState.brb.bannerText}
                    onChange={(e) => updateDraft('brb', 'bannerText', e.target.value)}
                    onSelect={(e) => handleTextSelect('brb_bannerText', 'brb', 'bannerText', e)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                  />
                  {renderFormatterButtons('brb', 'bannerText', 'brb_bannerText')}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Notices / Status Box Statements (One statement per line) <Tooltip text={TooltipTexts['brb.announcements']} /></label>
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

                {/* Standalone Logo Uploader */}
                <div className="flex flex-col gap-1.5 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                  <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Scene Brand Logo (Image/Video Loop) <Tooltip text={TooltipTexts['brb.logoUrl']} /></label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      handleFileUpload(e, (url) => {
                        updateDraft('brb', 'logoUrl', url);
                      });
                    }}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-350 w-full cursor-pointer focus:outline-none"
                  />
                  {draftState.brb.logoUrl && (
                    <span className="text-[9px] text-brand-gold font-bold truncate max-w-[400px] mt-1.5">
                      Loaded URL: {draftState.brb.logoUrl}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  {renderEffectSliders('brb')}
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
                    {formatSecondsHMS(state.brb.countdownSeconds)}
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
                      onClick={() => triggerBrbCountdownAction('reset', (state.timerPresets?.brb?.[2] || 900))}
                      className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 px-3 py-2 rounded-lg text-xs font-black tracking-wider text-zinc-300 transition"
                    >
                      RESET (15M)
                    </button>
                  </div>
                </div>
                
                {/* Presets loops */}
                <div className="flex flex-col gap-2 border-t border-zinc-800/60 pt-3">
                  <span className="text-[9px] uppercase font-black text-zinc-500">Duration Presets <Tooltip text={TooltipTexts['brb.durationPresets']} /></span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(state.timerPresets?.brb || [300, 600, 900, 1800, 3600]).map((seconds) => {
                      const mins = Math.floor(seconds / 60);
                      return (
                        <button
                          key={seconds}
                          onClick={() => triggerBrbCountdownAction('reset', seconds)}
                          className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-[10px] font-black py-2 rounded-lg text-zinc-350 hover:text-brand-gold transition"
                        >
                          {mins} Min
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* HMS Custom Time Setup */}
                <div className="flex flex-col gap-2 border-t border-zinc-800/60 pt-3">
                  <span className="text-[9px] uppercase font-black text-zinc-500">Set Custom Temporal Time <Tooltip text={TooltipTexts['brb.customTime']} /></span>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <label className="text-[8px] uppercase text-zinc-500 font-bold mb-1">HH</label>
                      <input 
                        type="number" 
                        placeholder="00" 
                        min="0"
                        max="23"
                        id="brb_custom_hh"
                        defaultValue="0"
                        className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs w-12 text-center font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                    <span className="text-zinc-600 font-bold mt-4">:</span>
                    <div className="flex flex-col items-center">
                      <label className="text-[8px] uppercase text-zinc-500 font-bold mb-1">MM</label>
                      <input 
                        type="number" 
                        placeholder="05" 
                        min="0"
                        max="59"
                        id="brb_custom_mm"
                        defaultValue="5"
                        className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs w-12 text-center font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                    <span className="text-zinc-600 font-bold mt-4">:</span>
                    <div className="flex flex-col items-center">
                      <label className="text-[8px] uppercase text-zinc-500 font-bold mb-1">SS</label>
                      <input 
                        type="number" 
                        placeholder="00" 
                        min="0"
                        max="59"
                        id="brb_custom_ss"
                        defaultValue="0"
                        className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs w-12 text-center font-bold text-zinc-100 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const hh = parseInt(document.getElementById('brb_custom_hh').value) || 0;
                        const mm = parseInt(document.getElementById('brb_custom_mm').value) || 0;
                        const ss = parseInt(document.getElementById('brb_custom_ss').value) || 0;
                        const totalSeconds = (hh * 3600) + (mm * 60) + ss;
                        if (totalSeconds > 0) {
                          triggerBrbCountdownAction('reset', totalSeconds);
                        }
                      }}
                      className="bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/30 text-brand-gold text-[10px] font-black uppercase py-2 px-3.5 rounded-lg transition-all mt-4"
                    >
                      Apply
                    </button>
                  </div>
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
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Closing Main Title <Tooltip text={TooltipTexts['ending.title']} /></label>
                <input
                  type="text"
                  id="ending_title"
                  value={draftState.ending.title}
                  onChange={(e) => updateDraft('ending', 'title', e.target.value)}
                  onSelect={(e) => handleTextSelect('ending_title', 'ending', 'title', e)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
                {renderFormatterButtons('ending', 'title', 'ending_title')}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Credits Signature <Tooltip text={TooltipTexts['ending.signature']} /></label>
                <input
                  type="text"
                  value={draftState.ending.signature}
                  onChange={(e) => updateDraft('ending', 'signature', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Closing Paragraph / Description Notice <Tooltip text={TooltipTexts['ending.description']} /></label>
                <textarea
                  rows="3"
                  value={draftState.ending.description}
                  onChange={(e) => updateDraft('ending', 'description', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-brand-green font-bold resize-none"
                />
              </div>

              {/* Standalone Logo Uploader */}
              <div className="flex flex-col gap-1.5 md:col-span-2 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Ending Outro Logo Asset (Image/Video Loop) <Tooltip text={TooltipTexts['ending.logoUrl']} /></label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    handleFileUpload(e, (url) => {
                      updateDraft('ending', 'logoUrl', url);
                    });
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-350 w-full cursor-pointer focus:outline-none"
                />
                {draftState.ending.logoUrl && (
                  <span className="text-[9px] text-brand-gold font-bold truncate max-w-[400px] mt-1.5">
                    Loaded URL: {draftState.ending.logoUrl}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4">
              {renderEffectSliders('ending')}
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
                <Layers className="w-4 h-4" /> Default Fallback Logo Customization
              </h2>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase font-black text-zinc-400">Fallback Brand Logo (static image or animated/video loop) <Tooltip text={TooltipTexts['settings.logoUrl']} /></label>
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

            {/* Typography & Background Theme Swatches */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
              <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Settings className="w-4 h-4" /> Typography & Banner Theme Styles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Typography color picker */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-black text-zinc-400">Typography Base Color <Tooltip text={TooltipTexts['settings.typographyColor']} /></span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={draftState.globalSettings?.typographyColor || '#FFFFFF'} 
                      onChange={(e) => updateDraft('globalSettings', 'typographyColor', e.target.value)}
                      className="w-8 h-8 rounded border border-zinc-800 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={draftState.globalSettings?.typographyColor || '#FFFFFF'} 
                      onChange={(e) => updateDraft('globalSettings', 'typographyColor', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs w-24 font-bold text-zinc-200"
                    />
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {['#1B7339', '#4CAF50', '#D4AF37', '#1A1A1A', '#F8F9FA'].map(hex => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => updateDraft('globalSettings', 'typographyColor', hex)}
                        className="w-5 h-5 rounded border border-zinc-800 cursor-pointer hover:scale-105 transition"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>

                {/* Banner background color picker */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-black text-zinc-400">Banner Background Color <Tooltip text={TooltipTexts['settings.bannerBgColor']} /></span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={draftState.globalSettings?.bannerBgColor || '#1A1A1A'} 
                      onChange={(e) => updateDraft('globalSettings', 'bannerBgColor', e.target.value)}
                      className="w-8 h-8 rounded border border-zinc-800 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={draftState.globalSettings?.bannerBgColor || '#1A1A1A'} 
                      onChange={(e) => updateDraft('globalSettings', 'bannerBgColor', e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs w-24 font-bold text-zinc-200"
                    />
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {['#1B7339', '#4CAF50', '#D4AF37', '#1A1A1A', '#F8F9FA'].map(hex => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => updateDraft('globalSettings', 'bannerBgColor', hex)}
                        className="w-5 h-5 rounded border border-zinc-800 cursor-pointer hover:scale-105 transition"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>
              </div>



              <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                <button
                  onClick={() => commitSection('globalSettings')}
                  className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase tracking-wider text-xs py-2 px-4 rounded-lg border border-brand-gold/45 shadow-sm active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-brand-gold" />
                  Save Style Theme
                </button>
              </div>
            </div>


            {/* Global Timer Presets setup */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h2 className="text-sm font-black text-brand-gold uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Clock className="w-4 h-4" /> Quick Timer Presets (Minutes, max 60m)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-black text-brand-gold tracking-wider">Starting Presets <Tooltip text={TooltipTexts['settings.timerPresets']} /></span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map(i => {
                      const mins = draftState.timerPresets?.starting?.[i]
                        ? Math.floor(draftState.timerPresets.starting[i] / 60)
                        : 5;
                      return (
                        <div key={i} className="flex flex-col gap-1 items-center">
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={mins}
                            onChange={(e) => {
                              const val = Math.min(60, Math.max(1, parseInt(e.target.value) || 1));
                              setDraftState(prev => {
                                const arr = [...(prev.timerPresets?.starting || [300, 600, 900, 1800, 3600])];
                                arr[i] = val * 60;
                                return {
                                  ...prev,
                                  timerPresets: { ...prev.timerPresets, starting: arr }
                                };
                              });
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded px-1 py-1.5 text-center text-xs font-bold text-zinc-100 w-11 focus:outline-none focus:border-brand-green"
                          />
                          <span className="text-[8px] text-zinc-500 font-bold">P{i+1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-black text-brand-gold tracking-wider">BRB Presets <Tooltip text={TooltipTexts['settings.timerPresets']} /></span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map(i => {
                      const mins = draftState.timerPresets?.brb?.[i]
                        ? Math.floor(draftState.timerPresets.brb[i] / 60)
                        : 5;
                      return (
                        <div key={i} className="flex flex-col gap-1 items-center">
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={mins}
                            onChange={(e) => {
                              const val = Math.min(60, Math.max(1, parseInt(e.target.value) || 1));
                              setDraftState(prev => {
                                const arr = [...(prev.timerPresets?.brb || [300, 600, 900, 1800, 3600])];
                                arr[i] = val * 60;
                                return {
                                  ...prev,
                                  timerPresets: { ...prev.timerPresets, brb: arr }
                                };
                              });
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded px-1 py-1.5 text-center text-xs font-bold text-zinc-100 w-11 focus:outline-none focus:border-brand-green"
                          />
                          <span className="text-[8px] text-zinc-500 font-bold">P{i+1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-zinc-850 pt-4">
                {renderEffectSliders('main')}
              </div>

              <div className="flex justify-end border-t border-zinc-800 pt-3 mt-1">
                <button
                  onClick={() => {
                    commitSection('timerPresets');
                    commitSection('main');
                  }}
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
                  <label className="text-[9px] uppercase font-black text-zinc-400">Display Layout Format <Tooltip text={TooltipTexts['settings.socialFormat']} /></label>
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
                  <label className="text-[9px] uppercase font-black text-zinc-400">Display Grid Alignment <Tooltip text={TooltipTexts['settings.socialLayout']} /></label>
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
                        className="bg-zinc-900 border border-zinc-800 text-xs rounded p-1.5 font-bold text-zinc-355 cursor-pointer"
                      >
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                        <option value="globe">Website (Globe)</option>
                      </select>
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[8px] uppercase font-black text-zinc-500">Display String Handle <Tooltip text={TooltipTexts['settings.socialHandles']} /></label>
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
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-bold text-zinc-200 focus:outline-none w-full"
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
