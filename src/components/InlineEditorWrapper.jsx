import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Edit3, X, Save, Upload, Type, Layers, Image as ImageIcon } from 'lucide-react';

export function InlineEditorWrapper({ state, onStateChange, children, currentView }) {
  const [editMode, setEditMode] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'headerLogo' | 'ticker' | 'frame' | 'headline'
  const [isObsBroadcast, setIsObsBroadcast] = useState(false);
  const [formState, setFormState] = useState({});

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    if (mode === 'broadcast') {
      setIsObsBroadcast(true);
      setEditMode(false);
    } else if (mode === 'edit') {
      setEditMode(true);
    }
  }, []);

  // Save updated state and broadcast to channel & API
  const saveState = (updatedState) => {
    onStateChange(updatedState);
    const bc = new BroadcastChannel('essensa_overlay_channel');
    bc.postMessage({ type: 'UPDATE_STATE', payload: updatedState });
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedState)
    }).catch(() => {});
  };

  // Image Upload helper converting files to Base64/Data URLs for instant local previews
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.url) {
        setFormState(prev => ({ ...prev, [fieldName]: data.url }));
      }
    })
    .catch(() => {
      // Local Base64 fallback if server upload route is unavailable
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormState(prev => ({ ...prev, [fieldName]: event.target.result }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Open modal handlers
  const openHeaderLogoModal = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    setFormState({
      headerCenterLogoUrl: state.headerCenterLogoUrl || state.main?.headerCenterLogoUrl || ''
    });
    setActiveModal('headerLogo');
  };

  const openTickerModal = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    setFormState({
      items: state.main?.tickerItems ? state.main.tickerItems.join('\n') : '',
      speed: state.main?.tickerSpeed || 60,
      logoUrl: state.globalLogoUrl || '',
      tickerRightLogoUrl: state.tickerRightLogoUrl || state.main?.tickerRightLogoUrl || ''
    });
    setActiveModal('ticker');
  };

  const openFrameModal = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    setFormState({
      borderThickness: state.globalSettings?.borderThickness ?? 6,
      typographyColor: state.globalSettings?.typographyColor || '#FFFFFF',
      bannerBgColor: state.globalSettings?.bannerBgColor || '#1A1A1A'
    });
    setActiveModal('frame');
  };

  const openHeadlineModal = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    const currentSceneState = state[currentView] || state.main || {};
    setFormState({
      segmentName: currentSceneState?.segmentName || state.main?.segmentName || '',
      welcomeText: currentSceneState?.welcomeText || '',
      announcement: currentSceneState?.announcement || '',
      tagline: currentSceneState?.tagline || ''
    });
    setActiveModal('headline');
  };

  // Save Modal Submissions
  const handleSaveHeaderLogo = () => {
    const nextState = {
      ...state,
      headerCenterLogoUrl: formState.headerCenterLogoUrl,
      main: {
        ...state.main,
        headerCenterLogoUrl: formState.headerCenterLogoUrl
      }
    };
    saveState(nextState);
    setActiveModal(null);
  };

  const handleSaveTicker = () => {
    const rawItems = formState.items ? formState.items.split('\n').filter(line => line.trim().length > 0) : [];
    const nextState = {
      ...state,
      globalLogoUrl: formState.logoUrl,
      tickerRightLogoUrl: formState.tickerRightLogoUrl,
      main: {
        ...state.main,
        tickerItems: rawItems.length > 0 ? rawItems : state.main.tickerItems,
        tickerSpeed: parseInt(formState.speed, 10) || 60,
        tickerRightLogoUrl: formState.tickerRightLogoUrl
      }
    };
    saveState(nextState);
    setActiveModal(null);
  };

  const handleSaveFrame = () => {
    const nextState = {
      ...state,
      globalSettings: {
        ...state.globalSettings,
        borderThickness: parseInt(formState.borderThickness, 10) || 6,
        typographyColor: formState.typographyColor,
        bannerBgColor: formState.bannerBgColor
      }
    };
    saveState(nextState);
    setActiveModal(null);
  };

  const handleSaveHeadline = () => {
    const sceneKey = ['intermission-banner', 'starting', 'brb', 'ending', 'dual-pov'].includes(currentView) ? currentView : 'main';
    const nextState = {
      ...state,
      main: {
        ...state.main,
        segmentName: formState.segmentName || state.main.segmentName
      },
      [sceneKey]: {
        ...(state[sceneKey] || {}),
        segmentName: formState.segmentName,
        welcomeText: formState.welcomeText,
        announcement: formState.announcement,
        tagline: formState.tagline
      }
    };
    saveState(nextState);
    setActiveModal(null);
  };

  const openProductRibbonModal = () => {
    setFormState({
      name: state.productRibbon?.name || "Buah Merah Mix",
      subtext: state.productRibbon?.subtext || "Buah Merah Mix • All-Natural Organic Antioxidant",
      price: state.productRibbon?.price || "₱350.00",
      imageUrl: state.productRibbon?.imageUrl || "",
      badgeText: state.productRibbon?.badgeText || "FEATURED PRODUCT",
      holdDuration: state.productRibbon?.holdDuration || 12,
      sheenSpeed: state.productRibbon?.sheenSpeed || 3.5,
      animationSpeed: state.productRibbon?.animationSpeed || 0.65
    });
    setActiveModal('productRibbon');
  };

  const handleSaveProductRibbon = () => {
    const nextState = {
      ...state,
      productRibbon: {
        ...state.productRibbon,
        name: formState.name,
        subtext: formState.subtext,
        price: formState.price,
        imageUrl: formState.imageUrl,
        badgeText: formState.badgeText,
        holdDuration: parseInt(formState.holdDuration, 10) || 12,
        sheenSpeed: parseFloat(formState.sheenSpeed) || 3.5,
        animationSpeed: parseFloat(formState.animationSpeed) || 0.65,
        visible: true,
        triggerKey: Date.now()
      }
    };
    saveState(nextState);
    setActiveModal(null);
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Primary Children Scene Content */}
      {children}

      {/* NON-DESTRUCTIVE ON-CANVAS DOUBLE-CLICK HOTSPOTS (Only active in EDIT MODE) */}
      {editMode && (
        <>
          {/* Top Header Shield Hotspot */}
          <div 
            onDoubleClick={openHeaderLogoModal}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[85px] z-[60] cursor-pointer hover:outline hover:outline-2 hover:outline-dashed hover:outline-[var(--product-accent)] rounded-b-2xl transition-all group"
            title="Double-click to edit Top Header Shield Logo"
          >
            <div className="hidden group-hover:flex absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[var(--product-dark)]/90 text-[var(--product-accent)] text-[10px] font-bold uppercase tracking-wider rounded border border-[var(--product-accent)]/40 shadow pointer-events-none">
              Edit Top Logo
            </div>
          </div>

          {/* Bottom Ticker Hotspot */}
          <div 
            onDoubleClick={openTickerModal}
            className="absolute bottom-0 left-0 w-full h-[90px] z-[60] cursor-pointer hover:outline hover:outline-2 hover:outline-dashed hover:outline-[var(--product-accent)] transition-all group"
            title="Double-click to edit News Ticker & Sponsor Logos"
          >
            <div className="hidden group-hover:flex absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[var(--product-dark)]/90 text-[var(--product-accent)] text-[10px] font-bold uppercase tracking-wider rounded border border-[var(--product-accent)]/40 shadow pointer-events-none">
              Edit Ticker & Sponsor Logos
            </div>
          </div>

          {/* Left Frame Border Hotspot */}
          <div 
            onDoubleClick={openFrameModal}
            className="absolute left-0 top-0 w-[16px] h-[calc(100%-90px)] z-[60] cursor-pointer hover:outline hover:outline-2 hover:outline-dashed hover:outline-[var(--product-accent)] transition-all group"
            title="Double-click to edit Frame Thickness & Colors"
          />

          {/* Right Frame Border Hotspot */}
          <div 
            onDoubleClick={openFrameModal}
            className="absolute right-0 top-0 w-[16px] h-[calc(100%-90px)] z-[60] cursor-pointer hover:outline hover:outline-2 hover:outline-dashed hover:outline-[var(--product-accent)] transition-all group"
            title="Double-click to edit Frame Thickness & Colors"
          />

          {/* Center Utility Scene Headline Hotspot (for starting, intermission, brb, ending) */}
          {['intermission-banner', 'intermission', 'starting', 'brb', 'ending'].includes(currentView) && (
            <div 
              onDoubleClick={openHeadlineModal}
              className="absolute left-[15%] top-[15%] w-[70%] h-[60%] z-[55] cursor-pointer hover:outline hover:outline-2 hover:outline-dashed hover:outline-[var(--product-accent)] rounded-3xl transition-all group"
              title="Double-click to edit Headlines & Scene Text"
            >
              <div className="hidden group-hover:flex absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[var(--product-dark)]/90 text-[var(--product-accent)] text-xs font-bold uppercase tracking-wider rounded-lg border border-[var(--product-accent)]/40 shadow pointer-events-none">
                Edit Scene Text & Headlines
              </div>
            </div>
          )}

          {/* Lower-Third Product Ribbon Hotspot (Focused on Right Side) */}
          <div 
            onDoubleClick={openProductRibbonModal}
            className="absolute bottom-[118px] right-12 w-[640px] h-[95px] z-[60] cursor-pointer hover:outline hover:outline-2 hover:outline-dashed hover:outline-[var(--product-accent)] bg-[var(--product-accent)]/5 transition-all group rounded-xl"
            title="Double-click to edit Lower-Third Product Ribbon Banner"
          >
            <div className="hidden group-hover:flex absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--product-dark)]/90 text-[var(--product-accent)] text-xs font-bold uppercase tracking-wider rounded-lg border border-[var(--product-accent)]/40 shadow pointer-events-none">
              Edit Product Ribbon
            </div>
          </div>
        </>
      )}

      {/* INVISIBLE AT IDLE, FADES IN ON HOVER IN BOTTOM-RIGHT CORNER (Hidden when ?mode=broadcast) */}
      {!isObsBroadcast && (
        <div className="fixed bottom-3 right-3 z-[100] select-none flex items-center gap-3 opacity-0 hover:opacity-100 transition-opacity duration-300 p-2 rounded-2xl">
          {/* Quick Trigger Button for Product Ribbon */}
          <button
            onClick={() => {
              const nextState = {
                ...state,
                productRibbon: {
                  ...state.productRibbon,
                  visible: !state.productRibbon?.visible,
                  triggerKey: Date.now()
                }
              };
              saveState(nextState);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-md ${
              state.productRibbon?.visible 
                ? 'bg-[var(--product-primary)] border-[var(--product-accent)] text-white shadow-[0_0_15px_var(--product-accent)]' 
                : 'bg-[var(--product-dark)]/90 border-[var(--product-accent)]/60 text-white hover:bg-[var(--product-dark)] hover:border-[var(--product-accent)]'
            }`}
            title="Trigger Right-to-Left Product Ribbon Slide"
          >
            <span className={`w-2 h-2 rounded-full ${state.productRibbon?.visible ? 'bg-[var(--product-accent)] animate-pulse shadow-[0_0_8px_var(--product-accent)]' : 'bg-[var(--product-accent)]'}`} />
            <span className="tracking-wider uppercase font-mono text-[11px]">
              {state.productRibbon?.visible ? 'RIBBON ON AIR' : 'TRIGGER PRODUCT RIBBON'}
            </span>
          </button>

          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--product-dark)]/90 backdrop-blur-md border border-[var(--product-accent)]/60 text-white text-xs font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[var(--product-accent)]"
            title="Toggle Edit / Broadcast Mode"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${editMode ? 'bg-[var(--product-accent)] animate-pulse shadow-[0_0_10px_var(--product-accent)]' : 'bg-red-500'}`} />
            <span className="tracking-wider uppercase font-mono text-[11px]">
              {editMode ? 'EDIT MODE (ON)' : 'BROADCAST MODE'}
            </span>
          </button>
        </div>
      )}

      {/* CONTEXTUAL EDIT MODALS */}
      {activeModal === 'headerLogo' && (
        <ModalContainer title="Edit Top Header Logo" onClose={() => setActiveModal(null)} onSave={handleSaveHeaderLogo}>
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider">Top Shield Logo (BEYOND TALKS)</label>
            <input 
              type="text" 
              value={formState.headerCenterLogoUrl || ''} 
              onChange={(e) => setFormState({ ...formState, headerCenterLogoUrl: e.target.value })}
              placeholder="/uploads/BEYOND_TALK_LOGO_2.1.png"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-xs font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-gold" />
                Upload New Image
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'headerCenterLogoUrl')} className="hidden" />
              </label>
            </div>
            {formState.headerCenterLogoUrl && (
              <div className="mt-2 p-3 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center h-24">
                <img src={formState.headerCenterLogoUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        </ModalContainer>
      )}

      {activeModal === 'ticker' && (
        <ModalContainer title="Edit News Ticker & Sponsor Logos" onClose={() => setActiveModal(null)} onSave={handleSaveTicker}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Scrolling Ticker Items (1 item per line)</label>
              <textarea 
                rows={4}
                value={formState.items || ''} 
                onChange={(e) => setFormState({ ...formState, items: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Scroll Speed (seconds per loop)</label>
              <input 
                type="number" 
                value={formState.speed || 60} 
                onChange={(e) => setFormState({ ...formState, speed: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Left Logo (Essensa Naturale)</label>
              <input 
                type="text" 
                value={formState.logoUrl || ''} 
                onChange={(e) => setFormState({ ...formState, logoUrl: e.target.value })}
                placeholder="Leave blank for default Essensa Logo"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Right Logo (Organic Way of Living)</label>
              <input 
                type="text" 
                value={formState.tickerRightLogoUrl || ''} 
                onChange={(e) => setFormState({ ...formState, tickerRightLogoUrl: e.target.value })}
                placeholder="/uploads/ORGANIC_WAY_OF_LIVING.png"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>
        </ModalContainer>
      )}

      {activeModal === 'frame' && (
        <ModalContainer title="Edit Frame Style & Border Thickness" onClose={() => setActiveModal(null)} onSave={handleSaveFrame}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Border Thickness (px)</label>
              <input 
                type="range" 
                min="2"
                max="12"
                value={formState.borderThickness || 6} 
                onChange={(e) => setFormState({ ...formState, borderThickness: e.target.value })}
                className="w-full accent-[#D4AF37]"
              />
              <div className="text-right text-xs text-brand-gold font-mono font-bold mt-1">{formState.borderThickness || 6}px</div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Banner Background Color</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={formState.bannerBgColor || '#1A1A1A'} 
                  onChange={(e) => setFormState({ ...formState, bannerBgColor: e.target.value })}
                  className="w-10 h-10 rounded bg-transparent border-0 cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formState.bannerBgColor || '#1A1A1A'} 
                  onChange={(e) => setFormState({ ...formState, bannerBgColor: e.target.value })}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>
          </div>
        </ModalContainer>
      )}

      {activeModal === 'headline' && (
        <ModalContainer title="Edit Scene Text & Headlines" onClose={() => setActiveModal(null)} onSave={handleSaveHeadline}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Stream Topic / Headline</label>
              <input 
                type="text" 
                value={formState.segmentName || ''} 
                onChange={(e) => setFormState({ ...formState, segmentName: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            {formState.welcomeText !== undefined && (
              <div>
                <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Welcome Subtext</label>
                <input 
                  type="text" 
                  value={formState.welcomeText || ''} 
                  onChange={(e) => setFormState({ ...formState, welcomeText: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            )}
            {formState.announcement !== undefined && (
              <div>
                <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Announcement Header</label>
                <input 
                  type="text" 
                  value={formState.announcement || ''} 
                  onChange={(e) => setFormState({ ...formState, announcement: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            )}
          </div>
        </ModalContainer>
      )}

      {activeModal === 'productRibbon' && (
        <ModalContainer title="Edit Lower-Third Product Ribbon" onClose={() => setActiveModal(null)} onSave={handleSaveProductRibbon}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Product Name / Title</label>
              <input 
                type="text" 
                value={formState.name || ''} 
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="Buah Merah Mix"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--product-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Subtext / Key Benefits</label>
              <input 
                type="text" 
                value={formState.subtext || ''} 
                onChange={(e) => setFormState({ ...formState, subtext: e.target.value })}
                placeholder="Buah Merah Mix • All-Natural Organic Antioxidant"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--product-accent)] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Price</label>
                <input 
                  type="text" 
                  value={formState.price || ''} 
                  onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                  placeholder="₱350.00"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--product-accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Badge Tag</label>
                <input 
                  type="text" 
                  value={formState.badgeText || ''} 
                  onChange={(e) => setFormState({ ...formState, badgeText: e.target.value })}
                  placeholder="FEATURED PRODUCT"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--product-accent)] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Product Image Cutout URL</label>
              <input 
                type="text" 
                value={formState.imageUrl || ''} 
                onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                placeholder="Leave blank for default 3D Organic Bottle graphic"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--product-accent)] focus:outline-none"
              />
              <div className="flex items-center gap-3 mt-2">
                <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-xs font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[var(--product-accent)]" />
                  Upload Image Cutout
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">Hold Duration On Screen (Seconds)</label>
              <input 
                type="number" 
                value={formState.holdDuration || 12} 
                onChange={(e) => setFormState({ ...formState, holdDuration: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--product-accent)] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-1 block">
                Animation Speed — <span className="text-[var(--product-accent)] font-mono">{parseFloat(formState.animationSpeed || 0.65).toFixed(2)}s</span>
              </label>
              <input 
                type="range" 
                min="0.2" 
                max="2.0" 
                step="0.05" 
                value={formState.animationSpeed || 0.65} 
                onChange={(e) => setFormState({ ...formState, animationSpeed: parseFloat(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--product-accent)]"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>0.20s (Fast)</span>
                <span>1.00s</span>
                <span>2.00s (Slow)</span>
              </div>
            </div>
          </div>
        </ModalContainer>
      )}
    </div>
  );
}

// Reusable Modal Component
function ModalContainer({ title, onClose, onSave, children }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--product-dark)]/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--product-dark)] border border-[var(--product-accent)]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--product-accent)]/20 flex items-center justify-between bg-[var(--product-mid)]">
          <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[var(--product-accent)]" />
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--product-accent)]/20 flex justify-end gap-3 bg-[var(--product-mid)]">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button 
            onClick={onSave} 
            className="px-5 py-2 rounded-lg text-xs font-bold uppercase text-white bg-gradient-to-r from-[var(--product-primary)] to-[var(--product-secondary)] hover:brightness-110 border border-[var(--product-accent)]/40 transition shadow flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
