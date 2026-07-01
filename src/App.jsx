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

const defaultState = {
  "intermission-banner": {
    welcomeText: "Anniversary Live Stream",
    announcement: "Advocating the Organic Way of Living",
    tagline: "16 Years of Wellness & Prosperity"
  },
  "starting": {
    announcement: "Advocating the Organic Way of Living",
    tagline: "16 Years of Wellness & Prosperity",
    countdownSeconds: 300,
    countdownRunning: false,
    tickerItems: [
      "Essensa Naturale: 16 Years of Organic Way of Living",
      "Celebrating 16 Years of Wellness, Credibility, and Prosperity"
    ]
  },
  "main": {
    headerVisible: true,
    segmentName: "Revitalizing Health Anytime, Anywhere.",
    startTime: Date.now(),
    showClock: true,
    tickerVisible: true,
    tickerItems: [
      "Essensa Naturale: 16 Years of Organic Way of Living",
      "Empowering Filipino Networker-Entrepreneurs Worldwide",
      "Revitalizing Health with Non-Toxic, All-Natural organic products",
      "Celebrating 16 Years of Wellness, Credibility, and Prosperity"
    ],
    hostVisible: false,
    hostName: "Juan Dela Cruz",
    hostTitle: "Entrepreneurial Coach",
    hostAutoHide: true,
    productVisible: false,
    productName: "Buah Merah Mix",
    productPrice: "₱350.00",
    productPromo: "Promo: Buy 2 Get 1 Free • Free Shipping Nationwide!",
    productImage: ""
  },
  "brb": {
    bannerText: "Be Right Back",
    countdownSeconds: 300,
    countdownRunning: false,
    announcements: [
      "@EssensaNaturaleOfficial",
      "@essensanaturale",
      "www.essensanaturale.org",
      "Essensa Naturale TV"
    ]
  },
  "ending": {
    title: "Thank you for joining us!",
    description: "Celebrating the Organic Way of Living. Let's continue empowering lives together.",
    signature: "Made with ❤️ Essensa Naturale Family",
    socialHandles: [
      "@EssensaNaturaleOfficial",
      "@essensanaturale",
      "www.essensanaturale.org",
      "Essensa Naturale TV"
    ]
  }
};

// OverlayWrapper allows layouts to stretch natively to fill the browser viewport fluidly,
// aligning elements nicely on all device sizes and custom OBS overlay dimensions.
function OverlayWrapper({ children, currentView }) {
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
    <div className={`w-full min-h-screen ${bgClass} relative overflow-hidden flex flex-col`}>
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

  const isControlView = urlView === 'control' || urlView === 'dashboard';
  const currentView = isControlView 
    ? urlView 
    : (urlView || 'main'); // Default is main overlay view

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

  // Social handles helper
  const socialHandles = [
    { icon: <Facebook className="w-4 h-4" />, text: "@EssensaNaturaleOfficial" },
    { icon: <Instagram className="w-4 h-4" />, text: "@essensanaturale" },
    { icon: <Globe className="w-4 h-4" />, text: "www.essensanaturale.org" },
    { icon: <Youtube className="w-4 h-4" />, text: "Essensa Naturale TV" }
  ];

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
        <OverlayWrapper currentView={currentView}>
          <div className="canvas-1080p flex flex-row bg-white select-none">
            {/* Left Half: Charcoal Black */}
            <div className="w-[960px] h-[1080px] bg-brand-charcoal flex flex-col justify-between p-24 text-white relative overflow-hidden">
              {/* Rotating sunburst backdrop */}
              <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-15 pointer-events-none">
                <LogoSunburst className="w-[800px] h-[800px]" />
              </div>

              {/* Brand Logo */}
              <div className="relative z-10">
                <Logo showText={true} light={true} className="scale-[1.6] origin-left" />
              </div>

              {/* Elegant Title */}
              <div className="flex flex-col gap-4 mt-8 relative z-10">
                <span className="font-sans text-sm font-black text-brand-gold tracking-[0.4em] uppercase">
                  {state['intermission-banner'].welcomeText}
                </span>
                <h1 className="font-display font-black text-5xl text-white tracking-wide uppercase leading-tight">
                  Advocating the <span className="text-brand-green block">Organic Way</span> of Living
                </h1>
              </div>

              {/* Tagline */}
              <div className="text-xs text-white/50 uppercase tracking-[0.3em] font-black mt-8 relative z-10">
                {state['intermission-banner'].tagline}
              </div>
            </div>

            {/* Right Half: Pure White */}
            <div className="w-[960px] h-[1080px] bg-[#FFFFFF] flex flex-col justify-between p-24 text-brand-charcoal relative">
              {/* Top spacing */}
              <div className="hidden md:block" />

              {/* Welcome Notice in the center */}
              <div className="flex flex-col items-center justify-center gap-6 py-8 relative z-10 text-center px-12">
                <h2 className="text-3xl font-black text-brand-gold uppercase tracking-wider">
                  Live Stream Starting Soon
                </h2>
                <div className="w-24 h-1 bg-brand-green rounded-full" />
                <p className="text-zinc-600 text-lg font-bold max-w-[400px] leading-relaxed">
                  {state['intermission-banner'].announcement}
                </p>
              </div>

              {/* Social Media Grid */}
              <div className="w-full border-t border-black/10 pt-8 mt-4 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  {socialHandles.map((handle, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-brand-cream border border-black/10 px-6 py-4 rounded-2xl transition-all duration-300 hover:border-brand-green/30 group">
                      {React.cloneElement(handle.icon, { className: "w-6 h-6 text-brand-charcoal group-hover:text-brand-green transition-colors duration-300" })}
                      <span className="text-lg font-bold text-brand-charcoal/80 group-hover:text-brand-green transition-colors duration-300 truncate">
                        {handle.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 3: Starting Soon Screen
    case 'starting':
      return (
        <OverlayWrapper currentView={currentView}>
          <div className="canvas-1080p flex flex-row bg-white select-none">
            {/* Left Half: Charcoal Black */}
            <div className="w-[960px] h-[1080px] bg-brand-charcoal flex flex-col justify-between p-24 text-white relative overflow-hidden">
              {/* Rotating sunburst backdrop */}
              <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-15 pointer-events-none">
                <LogoSunburst className="w-[800px] h-[800px]" />
              </div>

              {/* Brand Logo */}
              <div className="relative z-10">
                <Logo showText={true} light={true} className="scale-[1.6] origin-left" />
              </div>

              {/* Elegant Title */}
              <div className="flex flex-col gap-4 mt-8 relative z-10">
                <span className="font-sans text-sm font-black text-brand-gold tracking-[0.4em] uppercase">
                  Anniversary Live Stream
                </span>
                <h1 className="font-display font-black text-5xl text-white tracking-wide uppercase leading-tight">
                  {state.starting.announcement}
                </h1>
              </div>

              {/* Tagline */}
              <div className="text-xs text-white/50 uppercase tracking-[0.3em] font-black mt-8 relative z-10">
                {state.starting.tagline}
              </div>
            </div>

            {/* Right Half: Pure White */}
            <div className="w-[960px] h-[1080px] bg-[#FFFFFF] flex flex-col justify-between p-24 text-brand-charcoal relative">
              {/* Top spacing */}
              <div className="hidden md:block" />

              {/* Countdown in the center */}
              <div className="flex flex-col items-center justify-center gap-4 py-8 relative z-10">
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
                  textColor="text-brand-gold"
                />
              </div>

              {/* Social Media Grid */}
              <div className="w-full border-t border-black/10 pt-8 mt-4 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  {socialHandles.map((handle, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-brand-cream border border-black/10 px-6 py-4 rounded-2xl transition-all duration-300 hover:border-brand-green/30 group">
                      {React.cloneElement(handle.icon, { className: "w-6 h-6 text-brand-charcoal group-hover:text-brand-green transition-colors duration-300" })}
                      <span className="text-lg font-bold text-brand-charcoal/80 group-hover:text-brand-green transition-colors duration-300 truncate">
                        {handle.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 4: Be Right Back (BRB)
    case 'brb':
      return (
        <OverlayWrapper currentView={currentView}>
          <div className="canvas-1080p bg-brand-cream flex flex-col items-center justify-center relative select-none">
            {/* Rotating sunburst backdrop */}
            <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-15 pointer-events-none">
              <LogoSunburst className="w-[800px] h-[800px]" />
            </div>

            {/* Centered BRB Card */}
            <div className="flex flex-col items-center gap-10 text-center relative z-10 w-[900px] bg-white p-16 rounded-[32px] border border-brand-sage shadow-2xl">
              <Logo showText={true} light={false} className="scale-150 mb-6" />

              <div className="flex flex-col items-center gap-4">
                <h2 className="font-display font-black text-6xl text-brand-charcoal tracking-widest uppercase">
                  {state.brb.bannerText}
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

              {/* Social Grid */}
              <div className="flex flex-wrap items-center gap-8 mt-8 border-t border-brand-sage pt-8 w-full justify-center">
                {state.brb.announcements.map((text, idx) => {
                  let icon = <Globe className="w-6 h-6 text-brand-green shrink-0" />;
                  if (text.includes('@')) {
                    icon = <Facebook className="w-6 h-6 text-brand-green shrink-0" />;
                  } else if (text.includes('TV')) {
                    icon = <Youtube className="w-6 h-6 text-brand-green shrink-0" />;
                  }
                  return (
                    <div key={idx} className="flex items-center gap-3 text-lg font-black text-brand-charcoal/75">
                      {icon}
                      <span className="truncate">{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 5: Stream Ending Outro
    case 'ending':
      return (
        <OverlayWrapper currentView={currentView}>
          <div className="canvas-1080p bg-brand-cream flex flex-col items-center justify-center relative select-none">
            {/* Rotating sunburst backdrop */}
            <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-15 pointer-events-none">
              <LogoSunburst className="w-[800px] h-[800px]" />
            </div>

            <div className="flex flex-col items-center gap-10 text-center relative z-10 w-[960px] bg-white p-16 rounded-[32px] border border-brand-sage shadow-2xl">
              {/* Centered Brand Logo */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.3, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                <Logo showText={true} light={false} className="scale-[1.8] origin-center mb-10" />
              </motion.div>

              <div className="flex flex-col gap-4">
                <h2 className="font-display font-black text-4xl text-brand-charcoal uppercase tracking-wider">
                  {state.ending.title}
                </h2>
                <p className="font-sans text-brand-charcoal/80 text-xl max-w-[700px] leading-relaxed mx-auto font-bold">
                  {state.ending.description}
                </p>
              </div>

              {/* Outro Social handles block */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 border-t border-brand-sage pt-8 w-full">
                {state.ending.socialHandles.map((text, idx) => {
                  let icon = <Globe className="w-5 h-5 text-brand-green shrink-0" />;
                  if (text.includes('@')) {
                    icon = <Facebook className="w-5 h-5 text-brand-green shrink-0" />;
                  } else if (text.includes('TV')) {
                    icon = <Youtube className="w-5 h-5 text-brand-green shrink-0" />;
                  }
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-brand-cream border border-brand-sage/60 px-6 py-3 rounded-2xl text-base font-black text-brand-charcoal/85 shadow-md">
                      {icon}
                      <span className="truncate">{text}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Heart signature */}
              <div className="text-xs text-brand-charcoal/40 uppercase tracking-[0.3em] font-black mt-4 flex items-center gap-1.5">
                {state.ending.signature}
              </div>
            </div>
          </div>
        </OverlayWrapper>
      );

    // View 6 (Default): Main Live Stream Overlay
    case 'main':
    default:
      return (
        <OverlayWrapper currentView={currentView}>
          <div className="canvas-1080p bg-transparent overflow-hidden">
            
            {/* Top Banner Header */}
            <AnimatePresence>
              {state.main.headerVisible && (
                <Header 
                  segmentName={state.main.segmentName} 
                  startTime={state.main.startTime} 
                  showClock={state.main.showClock} 
                />
              )}
            </AnimatePresence>

            {/* Lower Third (Host Nameplate) */}
            <LowerThird 
              isOpen={state.main.hostVisible} 
              name={state.main.hostName} 
              title={state.main.hostTitle}
              autoHide={state.main.hostAutoHide}
              onClose={() => setState(prev => ({
                ...prev,
                main: {
                  ...prev.main,
                  hostVisible: false
                }
              }))}
            />

            {/* Product Flashcard template */}
            <ProductCard 
              isOpen={state.main.productVisible}
              name={state.main.productName}
              price={state.main.productPrice}
              promoText={state.main.productPromo}
              imageUrl={state.main.productImage}
            />

            {/* Bottom News Ticker */}
            <AnimatePresence>
              {state.main.tickerVisible && (
                <Ticker items={state.main.tickerItems} />
              )}
            </AnimatePresence>

          </div>
        </OverlayWrapper>
      );
  }
}

export default App;
