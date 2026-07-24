import React, { useRef } from 'react';
import { useEditor } from '../contexts/EditorContext';

export function EditableRegion({ type, children, className = '' }) {
  const { mode, setActiveEditor, activeEditor } = useEditor();
  const ref = useRef(null);

  const isEditMode = mode === 'edit';
  const isActive = activeEditor?.type === type;

  const handleDoubleClick = (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setActiveEditor({ type, rect });
    }
  };

  return (
    <div
      ref={ref}
      onDoubleClick={handleDoubleClick}
      className={`
        ${className} 
        ${isEditMode ? 'hover:ring-2 hover:ring-brand-gold/60 cursor-pointer transition-all duration-200' : ''}
        ${isActive && isEditMode ? 'ring-2 ring-brand-green bg-brand-green/5' : ''}
      `}
    >
      {/* If edit mode, overlay a very subtle tint on hover to indicate interactability */}
      {isEditMode && (
        <div className={`absolute inset-0 z-50 pointer-events-none transition-colors duration-200 ${isActive ? 'bg-brand-green/10' : 'hover:bg-brand-gold/10'}`} />
      )}
      {children}
    </div>
  );
}
