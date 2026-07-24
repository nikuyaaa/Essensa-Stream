import React from 'react';
import { useEditor } from '../contexts/EditorContext';
import { X } from 'lucide-react';

export function InlineEditorDock() {
  const { mode, activeEditor, setActiveEditor, state, updateGlobalState } = useEditor();

  if (mode !== 'edit' || !activeEditor) return null;

  // Render specific panels based on activeEditor.type
  let PanelContent = null;
  switch (activeEditor.type) {
    case 'header':
      PanelContent = () => (
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-sm text-brand-gold">Header Editor</h3>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400">Segment Name</label>
            <input 
              type="text" 
              className="bg-black/50 border border-zinc-700 rounded p-1.5 text-sm"
              value={state.main?.segmentName || ''}
              onChange={(e) => updateGlobalState({ main: { segmentName: e.target.value } })}
            />
          </div>
        </div>
      );
      break;
    case 'ticker':
      PanelContent = () => (
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-sm text-brand-gold">Ticker Editor</h3>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400">Ticker Speed</label>
            <input 
              type="range" 
              min="10" max="120"
              className="w-full"
              value={state.main?.tickerSpeed || 60}
              onChange={(e) => updateGlobalState({ main: { tickerSpeed: Number(e.target.value) } })}
            />
          </div>
        </div>
      );
      break;
    case 'frame':
      PanelContent = () => (
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-sm text-brand-gold">Frame Editor</h3>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400">Border Thickness (px)</label>
            <input 
              type="range" 
              min="2" max="20"
              className="w-full"
              value={state.globalSettings?.borderThickness || 6}
              onChange={(e) => updateGlobalState({ globalSettings: { borderThickness: Number(e.target.value) } })}
            />
          </div>
        </div>
      );
      break;
    case 'scene-text':
      const scene = activeEditor.id || 'intermission-banner';
      PanelContent = () => (
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-sm text-brand-gold capitalize">{scene.replace('-', ' ')} Editor</h3>
          
          {state[scene]?.welcomeText !== undefined && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">Welcome Text / Super Title</label>
              <input 
                type="text" 
                className="bg-black/50 border border-zinc-700 rounded p-1.5 text-sm"
                value={state[scene]?.welcomeText || ''}
                onChange={(e) => updateGlobalState({ [scene]: { welcomeText: e.target.value } })}
              />
            </div>
          )}

          {state[scene]?.announcement !== undefined && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">Main Announcement</label>
              <textarea 
                className="bg-black/50 border border-zinc-700 rounded p-1.5 text-sm h-20"
                value={state[scene]?.announcement || ''}
                onChange={(e) => updateGlobalState({ [scene]: { announcement: e.target.value } })}
              />
            </div>
          )}

          {state[scene]?.rightHeader !== undefined && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">Right Side Header</label>
              <input 
                type="text" 
                className="bg-black/50 border border-zinc-700 rounded p-1.5 text-sm"
                value={state[scene]?.rightHeader || ''}
                onChange={(e) => updateGlobalState({ [scene]: { rightHeader: e.target.value } })}
              />
            </div>
          )}

          {state[scene]?.rightBody !== undefined && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">Right Side Body Text</label>
              <textarea 
                className="bg-black/50 border border-zinc-700 rounded p-1.5 text-sm h-20"
                value={state[scene]?.rightBody || ''}
                onChange={(e) => updateGlobalState({ [scene]: { rightBody: e.target.value } })}
              />
            </div>
          )}
        </div>
      );
      break;
    default:
      PanelContent = () => <div className="text-sm">Editing {activeEditor.type}</div>;
  }

  // Calculate position: trying to put the dock near the clicked element but keeping it on screen.
  // We'll use a fixed floating dock in the bottom-right or near the rect.
  // For simplicity and robust UI, let's float it in the center or right-aligned.
  // The user requested a floating dock. Let's place it at a fixed position for now (e.g. center right), 
  // since tracking bounding boxes precisely while scrolling might get messy.
  
  return (
    <div className="fixed top-1/4 right-8 z-[9999] w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 text-white font-sans animate-fade-in pointer-events-auto">
      <button 
        onClick={() => setActiveEditor(null)}
        className="absolute top-2 right-2 p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <PanelContent />
    </div>
  );
}
