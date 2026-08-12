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
import { InlineEditorWrapper } from './components/InlineEditorWrapper';
import { MapPin, Phone } from 'lucide-react';

const TikTokIcon = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.84 2.91 2.08 3.67.01 1.25.01 2.5 0 3.75-1.34-.01-2.58-.69-3.37-1.78-.02 1.93-.01 3.86-.01 5.79 0 2.27-1.02 4.41-2.88 5.48-2.39 1.48-5.69.84-7.29-1.42-1.76-2.38-.85-6.09 1.91-7.18.97-.39 2.05-.39 3.03-.02v3.91c-.69-.26-1.48-.19-2.09.24-.87.56-1.12 1.76-.56 2.62.53.84 1.63 1.13 2.5.6.87-.51 1.16-1.63.74-2.58-.02-3.41-.01-6.82-.01-10.23.01-.22-.05-.48.1-.67.35-.46.9-.62 1.47-.56Z" />
  </svg>
);

// Error Boundary – catches React render crashes and shows a diagnostic panel
// instead of a blank white screen, making future issues easy to diagnose.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', color: '#fff', fontFamily: 'monospace', padding: '40px', zIndex: 9999, overflow: 'auto' }}>
          <div style={{ background: '#1a0000', border: '2px solid #ff4444', borderRadius: '12px', padding: '24px', maxWidth: '900px' }}>
            <h1 style={{ color: '#ff4444', fontSize: '18px', marginBottom: '12px' }}>⚠ Application Crash — React Error Boundary</h1>
            <p style={{ color: '#ffaaaa', fontSize: '13px', marginBottom: '16px' }}>{this.state.error?.message}</p>
            <pre style={{ color: '#ff8888', fontSize: '11px', whiteSpace: 'pre-wrap', background: '#0d0000', padding: '16px', borderRadius: '8px' }}>{this.state.error?.stack}</pre>
            <button onClick={() => this.setState({ hasError: false, error: null })} style={{ marginTop: '16px', background: '#ff4444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Retry</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  "headerCenterLogoUrl": "/uploads/BEYOND_TALK_LOGO_2.1_2.png",
  "tickerRightLogoUrl": "/uploads/ORGANIC_WAY_OF_LIVING.png",
  "globalSettings": {
    "typographyColor": "#FFFFFF",
    "bannerBgColor": "#120924",
    "sunraySpeed": 4,
    "sunrayIntensity": 0.3,
    "borderThickness": 6
  },
  "socials": [
    { "platform": "tiktok", "text": "@essensa.naturale" },
    { "platform": "facebook", "text": "Essensa Naturale" },
    { "platform": "instagram", "text": "@essensanaturaleofficial" },
    { "platform": "youtube", "text": "@EssensaNaturaleOfficial" }
  ],
  "contactInfo": {
    "address": "108 West Insula Condominium, 135 West Avenue, 1105 Quezon City, Philippines",
    "phone": "+(632) 8284-3577",
    "website": "essensanaturale.org"
  },
  "socialsStyle": {
    "format": "icon-text",
    "layout": "grid"
  },
  "timerPresets": {
    "starting": [300, 600, 900, 1800, 3600], // 5m, 10m, 15m, 30m, 60m
    "brb": [300, 600, 900, 1800, 3600] // 5m, 10m, 15m, 30m, 60m
  },
  "intermission-banner": {
    "welcomeText": "Beyond Talks [gold]Live Stream[/gold]",
    "announcement": "Advocating the [green]Organic Way[/green] of Living",
    "tagline": "16 Years of Wellness & Prosperity",
    "rightHeader": "Live Stream <b>Starting Soon</b>",
    "rightBody": "We are preparing the live stream. Stay tuned for exciting announcements and prizes!",
    "alertText": "🏆 GRAND RAFFLE DRAWING AT THE END OF THE STREAM",
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
    "welcomeText": "Live Broadcast [gold]Starting Soon[/gold]",
    "superTitle": "Beyond Talks [gold]Live Stream[/gold]",
    "announcement": "Advocating the [green]Organic Way[/green] of Living",
    "tagline": "16 Years of Wellness & Prosperity",
    "countdownSeconds": 300,
    "countdownRunning": false,
    "logoUrl": "",
    "rightHeader": "Welcome to [green]Essensa Naturale[/green]",
    "rightBody": "Please take your seats. The stream will commence shortly.",
    "alertText": "🎁 EXCLUSIVE PROMO CODES WILL BE DROPPED LIVE",
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
    "hostName": "Dr. Jane Doe",
    "hostTitle": "Naturopathic Consultant & Wellness Specialist",
    "hostAutoHide": true,
    "hostHideDuration": 8,
    "products": [
      {
        "id": 1,
        "visible": false,
        "name": "Buah Merah Mix",
        "price": "₱350.00",
        "promoText": "Promo: Buy 2 Get 1 Free • Free Shipping Nationwide • Limited Stock Only!",
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
function OverlayWrapper({ children, currentView, style, state, onStateChange }) {
  const searchParams = new URLSearchParams(window.location.search);
  const isChromaKey = searchParams.get('chromakey') === 'true';

  let bgClass = "bg-transparent";
  if (isChromaKey) {
    bgClass = "bg-[#00ff00]";
  } else if (['intermission-banner', 'intermission', 'starting', 'brb', 'ending'].includes(currentView)) {
    bgClass = "bg-[#120924]";
  }

  return (
    <div className={`w-full min-h-screen ${bgClass} relative overflow-hidden flex flex-col`} style={style}>
      <InlineEditorWrapper state={state} onStateChange={onStateChange} currentView={currentView}>
        {children}
      </InlineEditorWrapper>
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
        setState(prev => {
          // Deep merge nested section objects so partial payloads don't wipe required fields
          const sectionKeys = ['main', 'starting', 'brb', 'ending', 'intermission-banner', 'dual-pov', 'globalSettings'];
          const merged = { ...prev, ...payload };
          sectionKeys.forEach(key => {
            if (payload[key] && prev[key]) merged[key] = { ...prev[key], ...payload[key] };
          });
          // Never overwrite a valid logo URL with an empty string from synced state
          if (!payload.headerCenterLogoUrl) merged.headerCenterLogoUrl = prev.headerCenterLogoUrl;
          if (!payload.tickerRightLogoUrl) merged.tickerRightLogoUrl = prev.tickerRightLogoUrl;
          if (!payload.globalLogoUrl && prev.globalLogoUrl) merged.globalLogoUrl = prev.globalLogoUrl;
          return merged;
        });
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
              setState(prev => {
                // Deep merge nested section objects so partial server data doesn't wipe required fields
                const sectionKeys = ['main', 'starting', 'brb', 'ending', 'intermission-banner', 'dual-pov', 'globalSettings'];
                const merged = { ...prev, ...data };
                sectionKeys.forEach(key => {
                  if (data[key] && prev[key]) merged[key] = { ...prev[key], ...data[key] };
                });
                // Preserve default logo URLs when server returns empty strings
                if (!data.headerCenterLogoUrl) merged.headerCenterLogoUrl = prev.headerCenterLogoUrl;
                if (!data.tickerRightLogoUrl) merged.tickerRightLogoUrl = prev.tickerRightLogoUrl;
                if (!data.globalLogoUrl && prev.globalLogoUrl) merged.globalLogoUrl = prev.globalLogoUrl;
                return merged;
              });
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
      case 'facebook': return <Facebook className="w-6 h-6 text-[#9D5CFF] shrink-0" />;
      case 'instagram': return <Instagram className="w-6 h-6 text-[#9D5CFF] shrink-0" />;
      case 'tiktok': return <TikTokIcon className="w-6 h-6 text-[#9D5CFF] shrink-0" />;
      case 'youtube': return <Youtube className="w-6 h-6 text-[#9D5CFF] shrink-0" />;
      default: return <Globe className="w-6 h-6 text-[#9D5CFF] shrink-0" />;
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
              className={`flex items-center gap-4 ${bgClass} border px-6 py-4.5 rounded-2xl transition-all duration-300 hover:border-[#9D5CFF]/50 group shadow-md shrink-0`}
            >
              {showIcon && React.cloneElement(icon, { 
                className: `w-7 h-7 ${isDarkBg ? "text-brand-gold group-hover:text-white" : "text-[#9D5CFF] group-hover:text-brand-purple"} transition-colors duration-300 shrink-0` 
              })}
              {showText && (
                <span className={`text-xl font-black ${textClass} transition-colors duration-300 truncate`}>
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
        <OverlayWrapper currentView={currentView} state={state} onStateChange={setState} style={{
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
                <span className="font-sans text-xl font-black text-white/90 tracking-[0.4em] uppercase">
                  {renderSplitToneText(state['intermission-banner'].welcomeText, "text-white/90", "keyword-green", "keyword-gold")}
                </span>
                <h1 className="font-display font-black text-6xl text-white tracking-wide uppercase leading-tight">
                  {renderSplitToneText(state['intermission-banner'].announcement, "text-white", "keyword-green", "keyword-gold")}
                </h1>
              </div>

              {/* Tagline */}
              <div className="text-base text-white/90 uppercase tracking-[0.3em] font-black mt-8 relative z-10 text-protected">
                {state['intermission-banner'].tagline}
              </div>
            </div>

            {/* Right Half: Pure White (Identical Container to Starting Scene for Pixel-Perfect Alignment) */}
            <div className="w-[960px] h-[1080px] bg-[#FFFFFF] flex flex-col justify-between p-16 md:px-20 md:py-16 text-brand-charcoal relative select-none">
              
              {/* Upper Section: Vertically Centered Welcome Notice */}
              <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10 text-center px-8">
                <h2 className="text-5xl font-black text-[#120924] uppercase tracking-wider leading-snug">
                  {renderSplitToneText(state['intermission-banner'].rightHeader || "Live Stream <b>Starting Soon</b>", "text-[#120924]", "keyword-green", "keyword-gold")}
                </h2>
                <div className="w-32 h-1.5 bg-[#9D5CFF] rounded-full" />
                <p className="text-zinc-800 text-2xl font-extrabold max-w-[540px] leading-relaxed">
                  {state['intermission-banner'].rightBody}
                </p>
                {state['intermission-banner'].alertText && (
                  <div className="mt-2 alert-banner-premium font-black uppercase text-base tracking-widest px-10 py-5 rounded-2xl shadow-xl">
                    {state['intermission-banner'].alertText}
                  </div>
                )}
              </div>

              {/* Subtle Horizontal Trim Line (Identical to Starting Scene) */}
              <div className="w-full h-px bg-zinc-200/80 mb-6 relative z-10" />

              {/* Lower Section: Social Media Grid & Official Contact Footer */}
              <div className="w-full relative z-10 flex flex-col gap-4">
                {renderGlobalSocials(false, state['intermission-banner'].socials)}
                
                {/* Official Address & Contact Bar */}
                <div className="flex flex-col items-center justify-center gap-1.5 text-sm md:text-base text-zinc-900 font-bold text-center pt-2.5 border-t border-black/5 mt-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                    <span>108 West Insula Condominium, 135 West Avenue, 1105 Quezon City, Philippines</span>
                  </div>
                  <div className="flex items-center justify-center gap-5">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                      <span>+(632) 8284-3577</span>
                    </span>
                    <span className="text-[#9D5CFF] font-black">•</span>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                      <span>essensanaturale.org</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 3: Starting Soon Screen
    case 'starting':
      return (
        <OverlayWrapper currentView={currentView} state={state} onStateChange={setState} style={{
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
                <span className="font-sans text-xl font-black text-white/90 tracking-[0.4em] uppercase">
                  {renderSplitToneText(state.starting.superTitle || state['intermission-banner']?.welcomeText || "Beyond Talks <b>Live Stream</b>", "text-white/90", "keyword-green", "keyword-gold")}
                </span>
                <h1 className="font-display font-black text-6xl text-white tracking-wide uppercase leading-tight">
                  {renderSplitToneText(state.starting.announcement || state['intermission-banner']?.announcement || "Advocating the [green]Organic Way[/green] of Living", "text-white", "keyword-green", "keyword-gold")}
                </h1>
              </div>

              {/* Tagline */}
              <div className="text-base text-white/90 uppercase tracking-[0.3em] font-black mt-8 relative z-10 text-protected">
                {state.starting.tagline || state['intermission-banner']?.tagline || "16 Years of Wellness & Prosperity"}
              </div>
            </div>

            {/* Right Half: Pure White (Timer Centered between Top Edge & Socials) */}
            <div className="w-[960px] h-[1080px] bg-[#FFFFFF] flex flex-col justify-between p-16 md:px-20 md:py-16 text-brand-charcoal relative select-none">
              
              {/* Upper Section: Vertically Centered Timer Block between Top Edge & Divider */}
              <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <span className="text-zinc-600 text-lg md:text-xl font-black uppercase tracking-[0.25em] mb-4 text-reveal-active">
                  {renderSplitToneText(state.starting.subTitle || "Stream Starting <b>Soon</b>", "text-zinc-600", "keyword-green", "keyword-gold")}
                </span>
                
                <Countdown 
                  secondsLeft={state.starting.countdownSeconds} 
                  isRunning={state.starting.countdownRunning} 
                  useGradient={true}
                  numberSizeClass="text-[12rem] md:text-[14.5rem]"
                  onTick={(seconds) => {
                    setState(prev => ({
                      ...prev,
                      starting: {
                        ...prev.starting,
                        countdownSeconds: seconds
                      }
                    }));
                  }}
                />
              </div>

              {/* Subtle Horizontal Trim Line */}
              <div className="w-full h-px bg-zinc-200/80 mb-6 relative z-10" />

              {/* Lower Section: Social Media Grid & Official Contact Footer */}
              <div className="w-full relative z-10 flex flex-col gap-4">
                {renderGlobalSocials(false)}
                
                {/* Official Address & Contact Bar */}
                <div className="flex flex-col items-center justify-center gap-1.5 text-sm md:text-base text-zinc-900 font-bold text-center pt-2.5 border-t border-black/5 mt-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                    <span>108 West Insula Condominium, 135 West Avenue, 1105 Quezon City, Philippines</span>
                  </div>
                  <div className="flex items-center justify-center gap-5">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                      <span>+(632) 8284-3577</span>
                    </span>
                    <span className="text-[#9D5CFF] font-black">•</span>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                      <span>essensanaturale.org</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 4: Be Right Back (BRB)
    case 'brb':
      return (
        <OverlayWrapper currentView={currentView} state={state} onStateChange={setState} style={{
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
          <div className="canvas-1080p bg-white/15 flex flex-col items-center justify-center relative select-none">
            {/* Rotating sunburst backdrop */}
            <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-15 pointer-events-none">
              <LogoSunburst className="w-[800px] h-[800px]" />
            </div>

            {/* Centered BRB Card */}
            <div className="flex flex-col items-center gap-10 text-center relative z-10 w-[900px] bg-white p-16 rounded-[32px] border border-brand-sage shadow-2xl gold-ambient-glow-soft">
              <Logo showText={true} light={false} logoUrl={state.brb.logoUrl || state.globalLogoUrl} className="scale-150 mb-6" />

              <div className="flex flex-col items-center gap-4">
                <h2 className="font-display font-black text-7xl text-[#120924] tracking-widest uppercase">
                  {renderSplitToneText(state.brb.bannerText, "text-[#120924]", "keyword-green", "keyword-gold")}
                </h2>
                {/* Thin purple highlight line */}
                <div className="w-44 h-2 bg-[#9D5CFF] rounded-full" />
              </div>

              {/* Expected return countdown block */}
              <div className="flex items-center gap-4 bg-[#120924]/5 border border-[#9D5CFF]/30 px-12 py-5 rounded-full shadow-inner mt-4">
                <span className="text-lg font-black text-zinc-600 uppercase tracking-widest">Expected Return in</span>
                <span className="font-mono text-4xl font-black text-[#7B3FE4] tracking-wider tabular-nums">
                  {Math.floor(state.brb.countdownSeconds / 60).toString().padStart(2, '0')}:
                  {(state.brb.countdownSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Dynamic Notification / Status fields */}
              {state.brb.announcements && state.brb.announcements.length > 0 && (
                <div className="flex flex-col gap-3 w-full max-w-[700px] mt-2">
                  {state.brb.announcements.map((text, idx) => (
                    <div key={idx} className="bg-[#120924]/5 border border-[#9D5CFF]/30 px-8 py-4 rounded-2xl text-xl font-black text-zinc-900 shadow-sm">
                      {text}
                    </div>
                  ))}
                </div>
              )}

              {/* Social Grid & Contact Footer */}
              <div className="w-full border-t border-zinc-200 pt-8 mt-4 flex flex-col gap-4">
                {renderGlobalSocials(false)}
                
                <div className="flex flex-col items-center justify-center gap-1.5 text-sm md:text-base text-zinc-900 font-bold text-center pt-2.5 border-t border-black/5 mt-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                    <span>108 West Insula Condominium, 135 West Avenue, 1105 Quezon City, Philippines</span>
                  </div>
                  <div className="flex items-center justify-center gap-5">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                      <span>+(632) 8284-3577</span>
                    </span>
                    <span className="text-[#9D5CFF] font-black">•</span>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                      <span>essensanaturale.org</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 5: Stream Ending Outro
    case 'ending':
      return (
        <OverlayWrapper currentView={currentView} state={state} onStateChange={setState} style={{
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
          <div className="canvas-1080p bg-white/15 flex flex-col items-center justify-center relative select-none">
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
                <h2 className="font-display font-black text-6xl text-[#120924] uppercase tracking-wider">
                  {renderSplitToneText(state.ending.title, "text-[#120924]", "keyword-green", "keyword-gold")}
                </h2>
                <p className="font-sans text-zinc-800 text-2xl max-w-[800px] leading-relaxed mx-auto font-black">
                  {state.ending.description}
                </p>
              </div>

              {/* Outro Social handles block & Contact Footer */}
              <div className="w-full border-t border-zinc-200 pt-8 mt-4 flex flex-col gap-4">
                {renderGlobalSocials(false)}

                <div className="flex flex-col items-center justify-center gap-1.5 text-sm md:text-base text-zinc-900 font-bold text-center pt-2.5 border-t border-black/5 mt-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                    <span>108 West Insula Condominium, 135 West Avenue, 1105 Quezon City, Philippines</span>
                  </div>
                  <div className="flex items-center justify-center gap-5">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                      <span>+(632) 8284-3577</span>
                    </span>
                    <span className="text-[#9D5CFF] font-black">•</span>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#9D5CFF] shrink-0" />
                      <span>essensanaturale.org</span>
                    </span>
                  </div>
                </div>
              </div>
              {/* Heart signature */}
              <div className="text-sm text-zinc-600 uppercase tracking-[0.3em] font-black mt-4 flex items-center justify-center gap-1.5">
                {state.ending.signature}
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View: Dual-POV Stream Overlay layout
    case 'dual-pov':
      return (
        <OverlayWrapper currentView={currentView} state={state} onStateChange={setState} style={{
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
            segmentName={state['dual-pov']?.segmentName || state.main.segmentName} 
            startTime={state.main.startTime} 
            showClock={state.main.showClock} 
            headerCenterLogoUrl={state.headerCenterLogoUrl || state.main.headerCenterLogoUrl}
          />
          {/* Continuous Edge-to-Edge Perimeter Border - The new top-center shield (z-50) overlays this to create a seamless connection */}
          <div className="absolute left-0 top-0 bottom-[90px] bg-white z-40 pointer-events-none" style={{ width: `${state.globalSettings?.borderThickness ?? 6}px`, boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.65)' }} />
          <div className="absolute right-0 top-0 bottom-[90px] bg-white z-40 pointer-events-none" style={{ width: `${state.globalSettings?.borderThickness ?? 6}px`, boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.65)' }} />
          <div className="absolute left-0 right-0 top-0 bg-white z-40 pointer-events-none" style={{ height: `${state.globalSettings?.borderThickness ?? 6}px`, boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.65)' }} />

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



          <Ticker items={state.main.tickerItems} logoUrl={state.globalLogoUrl} tickerRightLogoUrl={state.tickerRightLogoUrl || state.main.tickerRightLogoUrl} speed={state.main.tickerSpeed || 60} />
        </OverlayWrapper>
      );

    // View 6 (Default): Main Live Stream Overlay
    case 'main':
    default:
      return (
        <OverlayWrapper currentView={currentView} state={state} onStateChange={setState} style={{
          '--sunray-speed': `${state.main?.sunraySpeed || 4}s`,
          '--sunray-glow': state.main?.sunrayIntensity ?? 0.3,
          '--glow-speed': `${state.main?.glowSpeed || 2.5}s`,
          '--glow-intensity': state.main?.glowIntensity ?? 0.3,
          '--gradient-speed': `${state.main?.gradientSpeed || 6}s`,
          '--gradient-intensity': state.main?.gradientIntensity ?? 0.45,
          '--glitch-speed': `${state.main?.glitchSpeed || 3}s`,
          '--glitch-intensity': state.main?.glitchIntensity ?? 0.45
        }}>
          <div className="canvas-1080p bg-transparent overflow-hidden">
            
            {/* Top Banner Header */}
            <AnimatePresence>
              {state.main.headerVisible && (
                <Header 
                  segmentName={state.main.segmentName} 
                  startTime={state.main.startTime} 
                  showClock={state.main.showClock} 
                  headerCenterLogoUrl={state.headerCenterLogoUrl || state.main.headerCenterLogoUrl}
                />
              )}
            </AnimatePresence>
            {/* Continuous Edge-to-Edge Perimeter Border - The new top-center shield (z-50) overlays this to create a seamless connection */}
            <div className="absolute left-0 top-0 bottom-[90px] bg-white z-40 pointer-events-none" style={{ width: `${state.globalSettings?.borderThickness ?? 6}px`, boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.65)' }} />
            <div className="absolute right-0 top-0 bottom-[90px] bg-white z-40 pointer-events-none" style={{ width: `${state.globalSettings?.borderThickness ?? 6}px`, boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.65)' }} />
            <div className="absolute left-0 right-0 top-0 bg-white z-40 pointer-events-none" style={{ height: `${state.globalSettings?.borderThickness ?? 6}px`, boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.65)' }} />

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
                 <Ticker items={state.main.tickerItems} logoUrl={state.globalLogoUrl} tickerRightLogoUrl={state.tickerRightLogoUrl || state.main.tickerRightLogoUrl} speed={state.main.tickerSpeed || 60} />
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
    <div className="w-[1920px] h-[1080px] bg-transparent select-none relative overflow-hidden">
      {/* Event Poster Edge-to-Edge Backdrop Mask using clipping paths */}
      <div 
        className="absolute inset-0 bg-white/10 z-10 pointer-events-none" 
        style={{
          clipPath: "path('M 0,0 L 1920,0 L 1920,1080 L 0,1080 Z M 52,216 A 16,16 0 0 0 36,232 L 36,704 A 16,16 0 0 0 52,720 L 916,720 A 16,16 0 0 0 932,704 L 932,232 A 16,16 0 0 0 916,216 Z M 1004,216 A 16,16 0 0 0 988,232 L 988,704 A 16,16 0 0 0 1004,720 L 1868,720 A 16,16 0 0 0 1884,704 L 1884,232 A 16,16 0 0 0 1868,216 Z')"
        }}
      />
      
      {/* Camera 1 White Card Frame Housing & Animated Glowing Trim */}
      <div className="absolute left-[24px] top-[216px] w-[920px] h-[528px] bg-transparent border-[12px] border-white rounded-[28px] shadow-lg z-20 pointer-events-auto" />
      <div className="absolute left-[22px] top-[214px] w-[924px] h-[532px] bg-transparent border-2 rounded-[30px] animate-border-glow z-30 pointer-events-auto">
        {/* Camera label */}
        <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-[#120924]/90 border border-[#9D5CFF]/50 rounded-lg text-xs font-black uppercase text-white tracking-widest text-protected z-10 shadow-md">
          {renderSplitToneText(dualPOVConfig.cam1Label || "CAM 01 - HOST", "text-white", "keyword-green", "keyword-gold")}
        </div>
      </div>

      {/* Center Divider Line */}
      <div className="absolute left-[959.5px] top-[154px] w-px h-[700px] bg-black/10 z-20 pointer-events-none" />

      {/* Camera 2 White Card Frame Housing & Animated Glowing Trim */}
      <div className="absolute left-[976px] top-[216px] w-[920px] h-[528px] bg-transparent border-[12px] border-white rounded-[28px] shadow-lg z-20 pointer-events-auto" />
      <div className="absolute left-[974px] top-[214px] w-[924px] h-[532px] bg-transparent border-2 rounded-[30px] animate-border-glow z-30 pointer-events-auto">
        {/* Camera label */}
        <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-[#120924]/90 border border-[#9D5CFF]/50 rounded-lg text-xs font-black uppercase text-white tracking-widest text-protected z-10 shadow-md">
          {renderSplitToneText(dualPOVConfig.cam2Label || "CAM 02 - GUEST", "text-white", "keyword-green", "keyword-gold")}
        </div>
      </div>
    </div>
  );
}

const AppWithBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithBoundary;
