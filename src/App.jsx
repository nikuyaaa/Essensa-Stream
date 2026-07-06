import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Facebook, Instagram, Globe, Youtube, Heart 
} from 'lucide-react';

import { Logo, LogoSunburst } from './components/Logo';
import { Header } from './components/Header';
import { Ticker } from './components/Ticker';
import { LowerThird } from './components/LowerThird';
import { ProductCard } from './components/ProductCard';
import { Countdown } from './components/Countdown';
import { OperatorPanel } from './components/OperatorPanel';
import { CommentsWidget } from './components/CommentsWidget';

const renderSplitToneText = (text, defaultClass = "text-white", greenClass = "keyword-green", goldClass = "gold-sunray-text") => {
  if (!text) return null;
  
  // Match tokens: [color=...][/color], [effect=...][/effect], and legacy split-tone tags
  const regex = /(\[color=[^\]]+\].*?\[\/color\]|\[effect=[^\]]+\].*?\[\/effect\]|\[gold\].*?\[\/gold\]|\[green\].*?\[\/green\]|<b>.*?<\/b>|<gold>.*?<\/gold>)/gi;
  const parts = text.split(regex);
  
  return parts.map((part, idx) => {
    const partLower = part.toLowerCase();
    
    // 1. Dynamic tag: [color=...]...[/color]
    if (partLower.startsWith('[color=') && partLower.endsWith('[/color]')) {
      const openTagMatch = part.match(/^\[color=([^\]]+)\]/i);
      const openTag = openTagMatch ? openTagMatch[1] : '';
      const content = part.replace(/^\[color=[^\]]+\]/i, '').replace(/\[\/color\]$/i, '');
      
      let color = '';
      let effect = 'none';
      
      const attrs = openTag.split(/\s+/);
      if (attrs.length > 0) {
        const firstAttr = attrs[0];
        if (!firstAttr.includes('=')) {
          color = firstAttr;
        }
      }
      
      const colorAttr = openTag.match(/color=([^\]\s]+)/i);
      if (colorAttr) color = colorAttr[1];
      
      const effectAttr = openTag.match(/effect=([a-zA-Z0-9_-]+)/i);
      if (effectAttr) effect = effectAttr[1].toLowerCase();
      
      if (color && /^[0-9a-fA-F]{3,6}$/.test(color)) {
        color = `#${color}`;
      }
      
      const style = {};
      if (color) {
        style['--text-effect-color'] = color;
      }
      
      let className = '';
      if (effect === 'sunray') className = 'dynamic-effect-sunray';
      else if (effect === 'glow') className = 'dynamic-effect-glow';
      else if (effect === 'gradient') className = 'dynamic-effect-gradient';
      else if (effect === 'glitch') className = 'dynamic-effect-glitch';
      else {
        style.color = color || '#FFFFFF';
      }
      
      return (
        <span key={idx} className={className} style={style} data-text={content}>
          {content}
        </span>
      );
    }
    
    // 2. Dynamic tag: [effect=...]...[/effect]
    if (partLower.startsWith('[effect=') && partLower.endsWith('[/effect]')) {
      const openTagMatch = part.match(/^\[effect=([^\]]+)\]/i);
      const openTag = openTagMatch ? openTagMatch[1] : '';
      const content = part.replace(/^\[effect=[^\]]+\]/i, '').replace(/\[\/effect\]$/i, '');
      
      let color = '';
      let effect = 'none';
      
      const attrs = openTag.split(/\s+/);
      if (attrs.length > 0) {
        const firstAttr = attrs[0];
        if (!firstAttr.includes('=')) {
          effect = firstAttr.toLowerCase();
        }
      }
      
      const effectAttr = openTag.match(/effect=([a-zA-Z0-9_-]+)/i);
      if (effectAttr) effect = effectAttr[1].toLowerCase();
      
      const colorAttr = openTag.match(/color=([^\]\s]+)/i);
      if (colorAttr) color = colorAttr[1];
      
      if (color && /^[0-9a-fA-F]{3,6}$/.test(color)) {
        color = `#${color}`;
      }
      
      const style = {};
      if (color) {
        style['--text-effect-color'] = color;
      }
      
      let className = '';
      if (effect === 'sunray') className = 'dynamic-effect-sunray';
      else if (effect === 'glow') className = 'dynamic-effect-glow';
      else if (effect === 'gradient') className = 'dynamic-effect-gradient';
      else if (effect === 'glitch') className = 'dynamic-effect-glitch';
      else {
        style.color = color || '#FFFFFF';
      }
      
      return (
        <span key={idx} className={className} style={style} data-text={content}>
          {content}
        </span>
      );
    }
    
    // 3. Backwards compatibility legacy tags
    if (partLower.startsWith('[gold]') && partLower.endsWith('[/gold]')) {
      const clean = part.substring(6, part.length - 7);
      return <span key={idx} className={goldClass} data-text={clean}>{clean}</span>;
    }
    if (partLower.startsWith('<gold>') && partLower.endsWith('</gold>')) {
      const clean = part.substring(6, part.length - 7);
      return <span key={idx} className={goldClass} data-text={clean}>{clean}</span>;
    }
    if (partLower.startsWith('[green]') && partLower.endsWith('[/green]')) {
      const clean = part.substring(7, part.length - 8);
      return <span key={idx} className={greenClass} data-text={clean}>{clean}</span>;
    }
    if (partLower.startsWith('<b>') && partLower.endsWith('</b>')) {
      const clean = part.substring(3, part.length - 4);
      return <span key={idx} className={greenClass} data-text={clean}>{clean}</span>;
    }
    
    return <span key={idx} className={defaultClass}>{part}</span>;
  });
};

const defaultState = {
  "globalLogoUrl": "",
  "globalSettings": {
    "typographyColor": "#FFFFFF",
    "bannerBgColor": "#1A1A1A",
    "sunraySpeed": 4,
    "sunrayIntensity": 0.3
  },
  "socials": [
    { "platform": "facebook", "text": "@EssensaNaturaleOfficial" },
    { "platform": "instagram", "text": "@essensanaturale" },
    { "platform": "globe", "text": "www.essensanaturale.org" },
    { "platform": "youtube", "text": "Essensa Naturale TV" }
  ],
  "socialsStyle": {
    "format": "icon-text",
    "layout": "grid"
  },
  "timerPresets": {
    "starting": [300, 600, 900, 1800, 3600], // 5m, 10m, 15m, 30m, 60m
    "brb": [300, 600, 900, 1800, 3600] // 5m, 10m, 15m, 30m, 60m
  },
  "intermission-banner": {
    "welcomeText": "Anniversary [gold]Live Stream[/gold]",
    "announcement": "Advocating the [green]Organic Way[/green] of Living",
    "tagline": "16 Years of Wellness & Prosperity",
    "rightHeader": "Live Stream [gold]Starting Soon[/gold]",
    "rightBody": "Our broadcast will begin shortly. Sit back, relax, and get ready for an organic way of living!",
    "alertText": "ALERT: Special anniversary promo packages will be revealed during the live show!",
    "logoUrl": "",
    "socials": [],
    "sunraySpeed": 4,
    "sunrayIntensity": 0.3,
    "glowSpeed": 2.5,
    "glowIntensity": 0.3,
    "gradientSpeed": 6,
    "gradientIntensity": 0.45,
    "glitchSpeed": 3,
    "glitchIntensity": 0.75,
    "greenSpeed": 4,
    "greenIntensity": 0.45
  },
  "starting": {
    "announcement": "Advocating the [green]Organic Way[/green] of Living",
    "tagline": "16 Years of Wellness & Prosperity",
    "superTitle": "Anniversary [gold]Live Stream[/gold]",
    "subTitle": "Stream Starting [gold]Soon[/gold]",
    "countdownSeconds": 300,
    "countdownRunning": false,
    "logoUrl": "",
    "tickerItems": [
      "Essensa Naturale: 16 Years of Organic Way of Living",
      "Celebrating 16 Years of Wellness, Credibility, and Prosperity"
    ],
    "sunraySpeed": 4,
    "sunrayIntensity": 0.3,
    "glowSpeed": 2.5,
    "glowIntensity": 0.3,
    "gradientSpeed": 6,
    "gradientIntensity": 0.45,
    "glitchSpeed": 3,
    "glitchIntensity": 0.75,
    "greenSpeed": 4,
    "greenIntensity": 0.45
  },
  "main": {
    "headerVisible": true,
    "segmentName": "Revitalizing Health [gold]Anytime, Anywhere[/gold].",
    "startTime": Date.now(),
    "showClock": true,
    "tickerVisible": true,
    "logoUrl": "",
    "tickerItems": [
      "Essensa Naturale: 16 Years of Organic Way of Living",
      "Empowering Filipino Networker-Entrepreneurs Worldwide",
      "Revitalizing Health with Non-Toxic, All-Natural organic products",
      "Celebrating 16 Years of Wellness, Credibility, and Prosperity"
    ],
    "hostVisible": false,
    "hostName": "Juan [gold]Dela Cruz[/gold]",
    "hostTitle": "Entrepreneurial [green]Coach[/green]",
    "hostAutoHide": true,
    "hostHideDuration": 8,
    "products": [
      {
        "id": 1,
        "visible": false,
        "name": "Buah Merah Mix",
        "price": "₱350.00",
        "promoText": "Promo: Buy 2 Get 1 Free • Free Shipping!",
        "imageUrl": "",
        "stayOnScreen": true,
        "hideDuration": 10,
        "speed": 25
      }
    ],
    "sunraySpeed": 4,
    "sunrayIntensity": 0.3,
    "glowSpeed": 2.5,
    "glowIntensity": 0.3,
    "gradientSpeed": 6,
    "gradientIntensity": 0.45,
    "glitchSpeed": 3,
    "glitchIntensity": 0.75,
    "greenSpeed": 4,
    "greenIntensity": 0.45,
    "tickerSpeed": 60
  },
  "brb": {
    "bannerText": "Be Right [gold]Back[/gold]",
    "countdownSeconds": 300,
    "countdownRunning": false,
    "logoUrl": "",
    "announcements": [
      "Taking a short 5 minute break.",
      "Stay tuned for the awarding ceremony next!"
    ],
    "sunraySpeed": 4,
    "sunrayIntensity": 0.3,
    "glowSpeed": 2.5,
    "glowIntensity": 0.3,
    "gradientSpeed": 6,
    "gradientIntensity": 0.45,
    "glitchSpeed": 3,
    "glitchIntensity": 0.75,
    "greenSpeed": 4,
    "greenIntensity": 0.45
  },
  "ending": {
    "title": "Thank you for [gold]joining us[/gold]!",
    "description": "Celebrating the Organic Way of Living. Let's continue empowering lives together.",
    "signature": "Made with ❤️ Essensa Naturale Family",
    "logoUrl": "",
    "sunraySpeed": 4,
    "sunrayIntensity": 0.3,
    "glowSpeed": 2.5,
    "glowIntensity": 0.3,
    "gradientSpeed": 6,
    "gradientIntensity": 0.45,
    "glitchSpeed": 3,
    "glitchIntensity": 0.75,
    "greenSpeed": 4,
    "greenIntensity": 0.45
  }
};

// OverlayWrapper allows layouts to stretch natively to fill the browser viewport fluidly,
// aligning elements nicely on all device sizes and custom OBS overlay dimensions.
function OverlayWrapper({ children, currentView, style }) {
  const searchParams = new URLSearchParams(window.location.search);
  const isChromaKey = searchParams.get('chromakey') === 'true';

  let bgClass = "bg-transparent";
  if (isChromaKey) {
    bgClass = "bg-[#00ff00]";
  } else if (currentView === 'intermission-banner' || currentView === 'starting') {
    bgClass = "bg-brand-charcoal";
  } else if (currentView === 'brb' || currentView === 'ending') {
    bgClass = "bg-brand-cream";
  }

  return (
    <div className={`w-full min-h-screen ${bgClass} relative overflow-hidden flex flex-col`} style={style}>
      {children}
    </div>
  );
}

function App() {
  const [state, setState] = useState(defaultState);
  const [urlView, setUrlView] = useState(null);
  const [lock, setLock] = useState(false);

  // Read view parameter from URL query string or pathname
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const viewQuery = searchParams.get('view');
    const isLocked = searchParams.get('lock') === 'true';
    
    // Parse route from pathname (e.g. /overlay/main or /overlay/intermission-banner)
    const path = window.location.pathname;
    let view = null;
    
    if (path.startsWith('/overlay/')) {
      view = path.substring('/overlay/'.length);
    } else if (viewQuery) {
      view = viewQuery;
    }
    
    if (view) {
      setUrlView(view);
      setLock(isLocked);
    }
  }, []);

  // Sync state via BroadcastChannel and WebSocket (Internet Sync for Streamlabs)
  useEffect(() => {
    const bc = new BroadcastChannel('essensa_overlay_channel');
    let socket = null;
    let reconnectTimeout = null;

    const handleIncomingMessage = (type, payload) => {
      if (type === 'UPDATE_STATE' || type === 'STATE_RESPONSE') {
        setState(prev => ({
          ...prev,
          ...payload
        }));
      } else if (type === 'CONTROL_PING') {
        bc.postMessage({ type: 'OVERLAY_PING' });
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'OVERLAY_PING' }));
        }
      }
    };

    bc.onmessage = (event) => {
      const { type, payload } = event.data;
      handleIncomingMessage(type, payload);
    };

    // Initialize WebSocket connection for remote sync (e.g. Streamlabs Browser Source)
    const connectWebSocket = () => {
      const wsUrl = "wss://socketsbay.com/wss/v2/1/demo/";
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        socket.send(JSON.stringify({ room: "essensa_stream_nikuyaaa_secure", type: 'REQUEST_STATE' }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.room === "essensa_stream_nikuyaaa_secure") {
            handleIncomingMessage(msg.type, msg.payload);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      socket.onclose = () => {
        console.warn("WebSocket closed. Reconnecting in 3 seconds...");
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
      };
    };

    connectWebSocket();
    bc.postMessage({ type: 'REQUEST_STATE' });

    // Local Dev Server Polling Fallback (runs every 1 second when WebSocket is not active)
    const pollInterval = setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        // Try localhost first, then relative path
        fetch('http://localhost:5173/api/state')
          .catch(() => fetch('/api/state'))
          .then(res => res.json())
          .then(data => {
            if (data && (data.main || data['intermission-banner'])) {
              setState(prev => ({
                ...prev,
                ...data
              }));
            }
          })
          .catch(() => {});
      }
    }, 1000);

    return () => {
      bc.close();
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, []);

  const isControlView = !urlView || urlView === 'control' || urlView === 'dashboard';
  const currentView = isControlView 
    ? (urlView || 'control') 
    : urlView; // Default is operator control dashboard

  // Adjust body overflow dynamically based on view (enables touchpad scrolling in control panel)
  useEffect(() => {
    if (isControlView) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, [isControlView]);

  // Let local state tick down if countdowns are active
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        let updated = false;
        const nextState = { ...prev };

        if (prev.starting.countdownRunning && prev.starting.countdownSeconds > 0) {
          nextState.starting = {
            ...nextState.starting,
            countdownSeconds: prev.starting.countdownSeconds - 1,
            countdownRunning: prev.starting.countdownSeconds > 1
          };
          updated = true;
        }

        if (prev.brb.countdownRunning && prev.brb.countdownSeconds > 0) {
          nextState.brb = {
            ...nextState.brb,
            countdownSeconds: prev.brb.countdownSeconds - 1,
            countdownRunning: prev.brb.countdownSeconds > 1
          };
          updated = true;
        }

        return updated ? nextState : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-hide handler for host nameplate
  useEffect(() => {
    if (state.main.hostVisible && state.main.hostAutoHide) {
      const duration = (state.main.hostHideDuration || 8) * 1000;
      const timer = setTimeout(() => {
        setState(prev => {
          const nextState = {
            ...prev,
            main: {
              ...prev.main,
              hostVisible: false
            }
          };
          // Broadcast and save
          const bc = new BroadcastChannel('essensa_overlay_channel');
          bc.postMessage({ type: 'UPDATE_STATE', payload: nextState });
          fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nextState)
          }).catch(() => {});
          return nextState;
        });
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [state.main.hostVisible, state.main.hostAutoHide, state.main.hostHideDuration]);

  // Auto-hide handler for multiple product flashcards
  useEffect(() => {
    const activeProducts = state.main.products?.filter(p => p.visible && !p.stayOnScreen) || [];
    if (activeProducts.length === 0) return;

    const timers = activeProducts.map(product => {
      const duration = (product.hideDuration || 10) * 1000;
      return setTimeout(() => {
        setState(prev => {
          const updatedProducts = prev.main.products.map(p => 
            p.id === product.id ? { ...p, visible: false } : p
          );
          const nextState = {
            ...prev,
            main: {
              ...prev.main,
              products: updatedProducts
            }
          };
          // Broadcast and save
          const bc = new BroadcastChannel('essensa_overlay_channel');
          bc.postMessage({ type: 'UPDATE_STATE', payload: nextState });
          fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nextState)
          }).catch(() => {});
          return nextState;
        });
      }, duration);
    });

    return () => timers.forEach(clearTimeout);
  }, [state.main.products]);

  // Social handles helpers
  const getSocialIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'facebook': return <Facebook className="w-6 h-6 text-brand-green shrink-0" />;
      case 'instagram': return <Instagram className="w-6 h-6 text-brand-green shrink-0" />;
      case 'youtube': return <Youtube className="w-6 h-6 text-brand-green shrink-0" />;
      default: return <Globe className="w-6 h-6 text-brand-green shrink-0" />;
    }
  };

  const renderGlobalSocials = (isDarkBg = false, customSocials = null) => {
    const textClass = isDarkBg 
      ? "text-white/80 group-hover:text-brand-gold" 
      : "text-brand-charcoal/80 group-hover:text-brand-green";
    
    const bgClass = isDarkBg
      ? "bg-brand-charcoal/40 border-white/10"
      : "bg-brand-cream border-black/10";

    const layoutClass = state.socialsStyle?.layout === 'row'
      ? "flex flex-wrap items-center justify-center gap-6"
      : "grid grid-cols-2 gap-6";

    const showIcon = state.socialsStyle?.format !== 'text-only';
    const showText = state.socialsStyle?.format !== 'icon-only';

    const activeSocials = customSocials && customSocials.length > 0
      ? customSocials
      : state.socials;

    return (
      <div className={`${layoutClass} w-full`}>
        {activeSocials.map((handle, idx) => {
          const icon = getSocialIcon(handle.platform);
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-4 ${bgClass} border px-6 py-4 rounded-2xl transition-all duration-300 hover:border-brand-green/30 group shadow-md shrink-0`}
            >
              {showIcon && React.cloneElement(icon, { 
                className: `w-6 h-6 ${isDarkBg ? "text-brand-gold group-hover:text-white" : "text-brand-green group-hover:text-brand-gold"} transition-colors duration-300 shrink-0` 
              })}
              {showText && (
                <span className={`text-lg font-bold ${textClass} transition-colors duration-300 truncate`}>
                  {handle.text}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render individual views
  switch (currentView) {
    
    // View 1: Control Panel / Operator Dashboard
    case 'control':
    case 'dashboard':
      return (
        <OperatorPanel 
          initialState={state} 
          onStateChange={(updatedState) => setState(updatedState)} 
        />
      );

    // View 2: Intermission Banner Screen (Holding Page)
    case 'intermission-banner':
    case 'intermission':
      return (
        <OverlayWrapper currentView={currentView} style={{
          '--sunray-speed': `${state['intermission-banner']?.sunraySpeed || 4}s`,
          '--sunray-glow': state['intermission-banner']?.sunrayIntensity ?? 0.3,
          '--glow-speed': `${state['intermission-banner']?.glowSpeed || 2.5}s`,
          '--glow-intensity': state['intermission-banner']?.glowIntensity ?? 0.3,
          '--gradient-speed': `${state['intermission-banner']?.gradientSpeed || 6}s`,
          '--gradient-intensity': state['intermission-banner']?.gradientIntensity ?? 0.45,
          '--glitch-speed': `${state['intermission-banner']?.glitchSpeed || 3}s`,
          '--glitch-intensity': state['intermission-banner']?.glitchIntensity ?? 0.75,
          '--green-speed': `${state['intermission-banner']?.greenSpeed || 4}s`,
          '--green-glow': state['intermission-banner']?.greenIntensity ?? 0.45
        }}>
          <div className="canvas-1080p flex flex-row bg-transparent select-none">
            {/* Left Half: Transparent overlay with faint dark backdrop blur for readability */}
            <div className="w-[960px] h-[1080px] bg-black/20 backdrop-blur-[6px] flex flex-col justify-between p-24 text-white relative overflow-hidden">
              {/* Rotating sunburst backdrop */}
              <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-10 pointer-events-none">
                <LogoSunburst className="w-[800px] h-[800px]" />
              </div>

              {/* Brand Logo */}
              <div className="relative z-10">
                <Logo showText={true} light={true} logoUrl={state['intermission-banner'].logoUrl || state.globalLogoUrl} className="scale-[1.6] origin-left" />
              </div>

              {/* Elegant Title */}
              <div className="flex flex-col gap-4 mt-8 relative z-10 text-reveal-active brand-text-glow text-protected">
                <span className="font-sans text-sm font-black text-white/90 tracking-[0.4em] uppercase">
                  {renderSplitToneText(state['intermission-banner'].welcomeText, "text-white/90", "keyword-green", "keyword-gold")}
                </span>
                <h1 className="font-display font-black text-5xl text-white tracking-wide uppercase leading-tight">
                  {renderSplitToneText(state['intermission-banner'].announcement, "text-white", "keyword-green", "keyword-gold")}
                </h1>
              </div>

              {/* Tagline */}
              <div className="text-xs text-white/90 uppercase tracking-[0.3em] font-black mt-8 relative z-10 text-protected">
                {state['intermission-banner'].tagline}
              </div>
            </div>

            {/* Right Half: Pure White */}
            <div className="w-[960px] h-[1080px] bg-[#FFFFFF] flex flex-col justify-between p-24 text-brand-charcoal relative">
              {/* Top spacing */}
              <div className="hidden md:block" />

              {/* Welcome Notice in the center */}
              <div className="flex flex-col items-center justify-center gap-6 py-8 relative z-10 text-center px-12">
                <h2 className="text-3xl font-black text-brand-charcoal uppercase tracking-wider">
                  {renderSplitToneText(state['intermission-banner'].rightHeader || "Live Stream <b>Starting Soon</b>", "text-brand-charcoal", "keyword-green", "keyword-gold")}
                </h2>
                <div className="w-24 h-1 bg-brand-green rounded-full" />
                <p className="text-zinc-600 text-lg font-bold max-w-[400px] leading-relaxed">
                  {state['intermission-banner'].rightBody}
                </p>
                {state['intermission-banner'].alertText && (
                  <div className="mt-4 alert-banner-premium font-black uppercase text-xs tracking-widest px-8 py-4 rounded-2xl shadow-lg">
                    {state['intermission-banner'].alertText}
                  </div>
                )}
              </div>

              {/* Social Media Grid */}
              <div className="w-full border-t border-black/10 pt-8 mt-4 relative z-10">
                {renderGlobalSocials(false, state['intermission-banner'].socials)}
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 3: Starting Soon Screen
    case 'starting':
      return (
        <OverlayWrapper currentView={currentView} style={{
          '--sunray-speed': `${state.starting?.sunraySpeed || 4}s`,
          '--sunray-glow': state.starting?.sunrayIntensity ?? 0.3,
          '--glow-speed': `${state.starting?.glowSpeed || 2.5}s`,
          '--glow-intensity': state.starting?.glowIntensity ?? 0.3,
          '--gradient-speed': `${state.starting?.gradientSpeed || 6}s`,
          '--gradient-intensity': state.starting?.gradientIntensity ?? 0.45,
          '--glitch-speed': `${state.starting?.glitchSpeed || 3}s`,
          '--glitch-intensity': state.starting?.glitchIntensity ?? 0.75,
          '--green-speed': `${state.starting?.greenSpeed || 4}s`,
          '--green-glow': state.starting?.greenIntensity ?? 0.45
        }}>
          <div className="canvas-1080p flex flex-row bg-transparent select-none">
            {/* Left Half: Transparent overlay with faint dark backdrop blur for readability */}
            <div className="w-[960px] h-[1080px] bg-black/20 backdrop-blur-[6px] flex flex-col justify-between p-24 text-white relative overflow-hidden">
              {/* Rotating sunburst backdrop */}
              <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-10 pointer-events-none">
                <LogoSunburst className="w-[800px] h-[800px]" />
              </div>

              {/* Brand Logo */}
              <div className="relative z-10">
                <Logo showText={true} light={true} logoUrl={state.starting.logoUrl || state.globalLogoUrl} className="scale-[1.6] origin-left" />
              </div>

              {/* Elegant Title */}
              <div className="flex flex-col gap-4 mt-8 relative z-10 text-reveal-active brand-text-glow text-protected">
                <span className="font-sans text-sm font-black text-white/90 tracking-[0.4em] uppercase">
                  {renderSplitToneText(state.starting.superTitle || "Anniversary <b>Live Stream</b>", "text-white/90", "keyword-green", "keyword-gold")}
                </span>
                <h1 className="font-display font-black text-5xl text-white tracking-wide uppercase leading-tight">
                  {renderSplitToneText(state.starting.announcement, "text-white", "keyword-green", "keyword-gold")}
                </h1>
              </div>

              {/* Tagline */}
              <div className="text-xs text-white/90 uppercase tracking-[0.3em] font-black mt-8 relative z-10 text-protected">
                {state.starting.tagline}
              </div>
            </div>

            {/* Right Half: Pure White */}
            <div className="w-[960px] h-[1080px] bg-[#FFFFFF] flex flex-col justify-between p-24 text-brand-charcoal relative pb-32">
              {/* Top spacing */}
              <div className="hidden md:block" />

              {/* Countdown in the center */}
              <div className="flex flex-col items-center justify-center gap-4 py-8 relative z-10">
                <span className="text-zinc-400 text-xs font-black uppercase tracking-[0.3em] mb-2 text-reveal-active">
                  {renderSplitToneText(state.starting.subTitle || "Stream Starting <b>Soon</b>", "text-zinc-400", "keyword-green", "keyword-gold")}
                </span>
                <Countdown 
                  secondsLeft={state.starting.countdownSeconds} 
                  isRunning={state.starting.countdownRunning} 
                  onTick={(seconds) => {
                    setState(prev => ({
                      ...prev,
                      starting: {
                        ...prev.starting,
                        countdownSeconds: seconds
                      }
                    }));
                  }}
                  textColor="text-brand-green"
                />
              </div>

              {/* Social Media Grid */}
              <div className="w-full border-t border-black/10 pt-8 mt-4 relative z-10">
                {renderGlobalSocials(false)}
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 4: Be Right Back (BRB)
    case 'brb':
      return (
        <OverlayWrapper currentView={currentView} style={{
          '--sunray-speed': `${state.brb?.sunraySpeed || 4}s`,
          '--sunray-glow': state.brb?.sunrayIntensity ?? 0.3,
          '--glow-speed': `${state.brb?.glowSpeed || 2.5}s`,
          '--glow-intensity': state.brb?.glowIntensity ?? 0.3,
          '--gradient-speed': `${state.brb?.gradientSpeed || 6}s`,
          '--gradient-intensity': state.brb?.gradientIntensity ?? 0.45,
          '--glitch-speed': `${state.brb?.glitchSpeed || 3}s`,
          '--glitch-intensity': state.brb?.glitchIntensity ?? 0.75,
          '--green-speed': `${state.brb?.greenSpeed || 4}s`,
          '--green-glow': state.brb?.greenIntensity ?? 0.45
        }}>
          <div className="canvas-1080p bg-brand-cream flex flex-col items-center justify-center relative select-none">
            {/* Rotating sunburst backdrop */}
            <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-15 pointer-events-none">
              <LogoSunburst className="w-[800px] h-[800px]" />
            </div>

            {/* Centered BRB Card */}
            <div className="flex flex-col items-center gap-10 text-center relative z-10 w-[900px] bg-white p-16 rounded-[32px] border border-brand-sage shadow-2xl gold-ambient-glow-soft">
              <Logo showText={true} light={false} logoUrl={state.brb.logoUrl || state.globalLogoUrl} className="scale-150 mb-6" />

              <div className="flex flex-col items-center gap-4">
                <h2 className="font-display font-black text-6xl text-brand-charcoal tracking-widest uppercase">
                  {renderSplitToneText(state.brb.bannerText, "text-brand-charcoal", "keyword-green", "keyword-gold")}
                </h2>
                {/* Thin forest green highlight line */}
                <div className="w-36 h-2 bg-brand-green rounded-full" />
              </div>

              {/* Expected return countdown block */}
              <div className="flex items-center gap-4 bg-brand-cream border border-brand-sage/80 px-10 py-4 rounded-full shadow-inner mt-4">
                <span className="text-sm font-black text-brand-charcoal/60 uppercase tracking-widest">Expected Return in</span>
                <span className="font-mono text-3xl font-black text-brand-gold tracking-wider tabular-nums">
                  {Math.floor(state.brb.countdownSeconds / 60).toString().padStart(2, '0')}:
                  {(state.brb.countdownSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Dynamic Notification / Status fields */}
              {state.brb.announcements && state.brb.announcements.length > 0 && (
                <div className="flex flex-col gap-3 w-full max-w-[600px] mt-2">
                  {state.brb.announcements.map((text, idx) => (
                    <div key={idx} className="bg-brand-cream border border-brand-sage/40 px-6 py-3.5 rounded-2xl text-base font-bold text-brand-charcoal/80 shadow-sm">
                      {text}
                    </div>
                  ))}
                </div>
              )}

              {/* Social Grid */}
              <div className="w-full border-t border-brand-sage pt-8 mt-4">
                {renderGlobalSocials(false)}
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 5: Stream Ending Outro
    case 'ending':
      return (
        <OverlayWrapper currentView={currentView} style={{
          '--sunray-speed': `${state.ending?.sunraySpeed || 4}s`,
          '--sunray-glow': state.ending?.sunrayIntensity ?? 0.3,
          '--glow-speed': `${state.ending?.glowSpeed || 2.5}s`,
          '--glow-intensity': state.ending?.glowIntensity ?? 0.3,
          '--gradient-speed': `${state.ending?.gradientSpeed || 6}s`,
          '--gradient-intensity': state.ending?.gradientIntensity ?? 0.45,
          '--glitch-speed': `${state.ending?.glitchSpeed || 3}s`,
          '--glitch-intensity': state.ending?.glitchIntensity ?? 0.75,
          '--green-speed': `${state.ending?.greenSpeed || 4}s`,
          '--green-glow': state.ending?.greenIntensity ?? 0.45
        }}>
          <div className="canvas-1080p bg-brand-cream flex flex-col items-center justify-center relative select-none">
            {/* Rotating sunburst backdrop */}
            <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-15 pointer-events-none">
              <LogoSunburst className="w-[800px] h-[800px]" />
            </div>

            <div className="flex flex-col items-center gap-10 text-center relative z-10 w-[960px] bg-white p-16 rounded-[32px] border border-brand-sage shadow-2xl gold-ambient-glow-soft">
              {/* Centered Brand Logo */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.3, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                <Logo showText={true} light={false} logoUrl={state.ending.logoUrl || state.globalLogoUrl} className="scale-[1.8] origin-center mb-10" />
              </motion.div>

              <div className="flex flex-col gap-4">
                <h2 className="font-display font-black text-4xl text-brand-charcoal uppercase tracking-wider">
                  {renderSplitToneText(state.ending.title, "text-brand-charcoal", "keyword-green", "keyword-gold")}
                </h2>
                <p className="font-sans text-brand-charcoal/80 text-xl max-w-[700px] leading-relaxed mx-auto font-bold">
                  {state.ending.description}
                </p>
              </div>

              {/* Outro Social handles block */}
              <div className="w-full border-t border-brand-sage pt-8 mt-4">
                {renderGlobalSocials(false)}
              </div>
              
              {/* Heart signature */}
              <div className="text-xs text-brand-charcoal/40 uppercase tracking-[0.3em] font-black mt-4 flex items-center gap-1.5">
                {state.ending.signature}
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View: Dual-POV Stream Overlay layout
    case 'dual-pov':
      return (
        <OverlayWrapper currentView={currentView} style={{
          '--sunray-speed': `${state['dual-pov']?.sunraySpeed || 4}s`,
          '--sunray-glow': state['dual-pov']?.sunrayIntensity ?? 0.3,
          '--glow-speed': `${state['dual-pov']?.glowSpeed || 2.5}s`,
          '--glow-intensity': state['dual-pov']?.glowIntensity ?? 0.3,
          '--gradient-speed': `${state['dual-pov']?.gradientSpeed || 6}s`,
          '--gradient-intensity': state['dual-pov']?.gradientIntensity ?? 0.45,
          '--glitch-speed': `${state['dual-pov']?.glitchSpeed || 3}s`,
          '--glitch-intensity': state['dual-pov']?.glitchIntensity ?? 0.75,
          '--green-speed': `${state['dual-pov']?.greenSpeed || 4}s`,
          '--green-glow': state['dual-pov']?.greenIntensity ?? 0.45
        }}>
          <Header 
            segmentName={renderSplitToneText(state['dual-pov']?.segmentName || state.main.segmentName, "text-brand-charcoal", "keyword-green", "keyword-gold")} 
            startTime={state.main.startTime} 
            showClock={state.main.showClock} 
            className="!shadow-[0_8px_24px_rgba(0,0,0,0.15)] !z-40"
          />
          <DualPOVOverlay state={state} />

          {/* Lower Third (Host Nameplate) */}
          <LowerThird 
            isOpen={state.main.hostVisible} 
            name={renderSplitToneText(state.main.hostName, "text-white", "keyword-green", "keyword-gold")} 
            title={renderSplitToneText(state.main.hostTitle, "text-white/80", "keyword-green", "keyword-gold")}
            autoHide={state.main.hostAutoHide}
            onClose={() => setState(prev => ({
              ...prev,
              main: {
                ...prev.main,
                hostVisible: false
              }
            }))}
          />

          {/* Multiple Product Flashcards (Stacked Vertically) */}
          <div className="absolute bottom-[130px] right-[80px] z-30 flex flex-col-reverse gap-6 items-end select-none">
            {state.main.products && state.main.products.map(product => (
              <ProductCard 
                key={product.id}
                isOpen={product.visible}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                promoText={product.promoText}
                speed={product.speed || 25}
                className="relative !bottom-auto !right-auto"
              />
            ))}
          </div>

          <Ticker items={state.main.tickerItems} logoUrl={state.globalLogoUrl} speed={state.main.tickerSpeed || 60} />
        </OverlayWrapper>
      );

    // View 6 (Default): Main Live Stream Overlay
    case 'main':
    default:
      return (
        <OverlayWrapper currentView={currentView} style={{
          '--sunray-speed': `${state.main?.sunraySpeed || 4}s`,
          '--sunray-glow': state.main?.sunrayIntensity ?? 0.3,
          '--glow-speed': `${state.main?.glowSpeed || 2.5}s`,
          '--glow-intensity': state.main?.glowIntensity ?? 0.3,
          '--gradient-speed': `${state.main?.gradientSpeed || 6}s`,
          '--gradient-intensity': state.main?.gradientIntensity ?? 0.45,
          '--glitch-speed': `${state.main?.glitchSpeed || 3}s`,
          '--glitch-intensity': state.main?.glitchIntensity ?? 0.75,
          '--green-speed': `${state.main?.greenSpeed || 4}s`,
          '--green-glow': state.main?.greenIntensity ?? 0.45
        }}>
          <div className="canvas-1080p bg-transparent overflow-hidden">
            
            {/* Top Banner Header */}
            <AnimatePresence>
              {state.main.headerVisible && (
                <Header 
                  segmentName={renderSplitToneText(state.main.segmentName, "text-brand-charcoal", "keyword-green", "keyword-gold")} 
                  startTime={state.main.startTime} 
                  showClock={state.main.showClock} 
                />
              )}
            </AnimatePresence>

            {/* Middle Zone Edge-to-Edge Backdrop (solid green background with transparent centered single camera cutout) */}
            <div 
              className="absolute left-0 top-[64px] w-[1920px] h-[926px] bg-[#022B13] z-10 pointer-events-none select-none"
              style={{
                clipPath: "path('M 0,0 L 1920,0 L 1920,926 L 0,926 Z M 496,193 A 16,16 0 0 0 480,209 L 480,717 A 16,16 0 0 0 496,733 L 1424,733 A 16,16 0 0 0 1440,717 L 1440,209 A 16,16 0 0 0 1424,193 Z')"
              }}
            />

            {/* Camera White Card Frame Housing & Animated Glowing Trim */}
            <div className="absolute left-0 top-[64px] w-[1920px] h-[926px] z-20 pointer-events-none select-none">
              {/* White rounded card frame boundary */}
              <div className="absolute left-[470px] top-[174px] w-[980px] h-[560px] bg-transparent border-[10px] border-white rounded-[24px] shadow-lg pointer-events-auto" />
              
              {/* Surrounding animated glowing ring */}
              <div className="absolute left-[468px] top-[172px] w-[984px] h-[564px] bg-transparent border-2 rounded-[26px] animate-border-glow pointer-events-auto" />
            </div>

            {/* Lower Third (Host Nameplate) */}
            <LowerThird 
              isOpen={state.main.hostVisible} 
              name={renderSplitToneText(state.main.hostName, "text-white", "keyword-green", "keyword-gold")} 
              title={renderSplitToneText(state.main.hostTitle, "text-white/80", "keyword-green", "keyword-gold")}
              autoHide={state.main.hostAutoHide}
              onClose={() => setState(prev => ({
                ...prev,
                main: {
                  ...prev.main,
                  hostVisible: false
                }
              }))}
            />

            {/* Multiple Product Flashcards (Stacked Vertically) */}
            <div className="absolute bottom-[130px] right-[80px] z-30 flex flex-col-reverse gap-6 items-end select-none">
              {state.main.products && state.main.products.map(product => (
                <ProductCard 
                  key={product.id}
                  isOpen={product.visible}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.imageUrl}
                  promoText={product.promoText}
                  speed={product.speed || 25}
                  className="relative !bottom-auto !right-auto"
                />
              ))}
            </div>

            {/* Bottom News Ticker */}
            <AnimatePresence>
              {state.main.tickerVisible && (
                 <Ticker items={state.main.tickerItems} logoUrl={state.globalLogoUrl} speed={state.main.tickerSpeed || 60} />
              )}
            </AnimatePresence>

          </div>
        </OverlayWrapper>
      );
  }
}

function DualPOVOverlay({ state }) {
  const dualPOVConfig = state['dual-pov'] || {};

  return (
    <div className="w-[1920px] h-[1080px] bg-transparent flex flex-col select-none relative overflow-hidden">
      {/* 1. Header Spacer (64px) - matches replicated absolute Header */}
      <div className="h-[64px] w-full bg-transparent shrink-0" />

      {/* 2. Middle Zone (926px) with Edge-to-Edge Backdrop and Symmetrical Dual Cutouts */}
      <div className="h-[926px] w-full bg-transparent relative z-10 shrink-0 pointer-events-none">
        {/* Solid Green Edge-to-Edge Backdrop Mask using clipping paths */}
        <div 
          className="absolute inset-0 bg-[#022B13] z-10 pointer-events-none" 
          style={{
            clipPath: "path('M 0,0 L 1920,0 L 1920,926 L 0,926 Z M 176,204 A 16,16 0 0 0 160,220 L 160,620 A 16,16 0 0 0 176,636 L 912,636 A 16,16 0 0 0 928,620 L 928,220 A 16,16 0 0 0 912,204 Z M 1008,204 A 16,16 0 0 0 992,220 L 992,620 A 16,16 0 0 0 1008,636 L 1744,636 A 16,16 0 0 0 1760,620 L 1760,220 A 16,16 0 0 0 1744,204 Z')"
          }}
        />
        
        {/* Camera 1 White Card Frame Housing & Animated Glowing Trim */}
        <div className="absolute left-[150px] top-[194px] w-[788px] h-[452px] bg-transparent border-[10px] border-white rounded-[24px] shadow-lg z-20 pointer-events-auto" />
        <div className="absolute left-[148px] top-[192px] w-[792px] h-[456px] bg-transparent border-2 rounded-[26px] animate-border-glow z-30 pointer-events-auto">
          {/* Camera label */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 border border-[#D4AF37]/30 rounded text-xs font-black uppercase text-brand-gold tracking-widest text-protected z-10">
            {renderSplitToneText(dualPOVConfig.cam1Label || "CAM 01 - HOST", "text-brand-gold", "keyword-green", "keyword-gold")}
          </div>
        </div>

        {/* Center Divider Line */}
        <div className="absolute left-[959.5px] top-[90px] w-px h-[700px] bg-black/10 z-20 pointer-events-none" />

        {/* Camera 2 White Card Frame Housing & Animated Glowing Trim */}
        <div className="absolute left-[982px] top-[194px] w-[788px] h-[452px] bg-transparent border-[10px] border-white rounded-[24px] shadow-lg z-20 pointer-events-auto" />
        <div className="absolute left-[980px] top-[192px] w-[792px] h-[456px] bg-transparent border-2 rounded-[26px] animate-border-glow z-30 pointer-events-auto">
          {/* Camera label */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 border border-[#D4AF37]/30 rounded text-xs font-black uppercase text-brand-gold tracking-widest text-protected z-10">
            {renderSplitToneText(dualPOVConfig.cam2Label || "CAM 02 - GUEST", "text-brand-gold", "keyword-green", "keyword-gold")}
          </div>
        </div>
        
      </div>

      {/* 3. Footer Spacer (90px) - matches replicated absolute Ticker */}
      <div className="h-[90px] w-full bg-transparent shrink-0" />
    </div>
  );
}

export default App;
