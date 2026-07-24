import React, { createContext, useContext, useState } from 'react';

const EditorContext = createContext(null);

export function EditorProvider({ children, state, updateGlobalState, mode, setMode }) {
  const [activeEditor, setActiveEditor] = useState(null);

  // activeEditor format: { type: 'header' | 'ticker' | 'frame' | 'scene-text' | 'nameplate' | 'product', id?: string, rect: DOMRect }
  
  return (
    <EditorContext.Provider value={{ 
      state, 
      updateGlobalState, 
      mode, 
      setMode,
      activeEditor,
      setActiveEditor
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    // Return a dummy context if not wrapped (e.g. if we forget to wrap somewhere)
    return {
      state: {},
      updateGlobalState: () => {},
      mode: 'broadcast',
      setMode: () => {},
      activeEditor: null,
      setActiveEditor: () => {}
    };
  }
  return context;
}
