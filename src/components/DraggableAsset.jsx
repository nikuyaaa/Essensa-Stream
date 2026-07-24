import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEditor } from '../contexts/EditorContext';

export function DraggableAsset({ id, type = 'asset', defaultX = 0, defaultY = 0, children, className = '', initial, animate, exit, transition }) {
  const { mode, state, updateGlobalState, setActiveEditor, activeEditor } = useEditor();
  const ref = useRef(null);

  const isEditMode = mode === 'edit';
  const isActive = activeEditor?.id === id;

  // Retrieve saved position from state, or fallback to default
  const savedPos = state?.positions?.[id] || { x: defaultX, y: defaultY };

  const handleDoubleClick = (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setActiveEditor({ type, id, rect });
    }
  };

  const handleDragEnd = (e, info) => {
    if (!isEditMode) return;
    
    // Calculate new absolute position (since framer-motion tracks translation, we add it to the existing savedPos)
    // Wait, if we use animate={savedPos} and drag, `info.point` gives the absolute viewport position, but `info.offset` gives the movement.
    // However, the cleanest way with framer-motion is to just let it manage x/y natively and we sync the final x/y.
    const newX = savedPos.x + info.offset.x;
    const newY = savedPos.y + info.offset.y;
    
    // Update global state
    updateGlobalState({
      positions: {
        ...(state.positions || {}),
        [id]: { x: newX, y: newY }
      }
    });
  };

  return (
    <motion.div
      ref={ref}
      drag={isEditMode}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={initial}
      animate={{ ...animate, x: (animate?.x || 0) + savedPos.x, y: (animate?.y || 0) + savedPos.y }}
      exit={exit}
      transition={{ ...transition, type: "spring", bounce: 0, duration: 0.2 }}
      onDoubleClick={handleDoubleClick}
      className={`
        ${className} 
        ${isEditMode ? 'hover:ring-2 hover:ring-brand-gold/60 cursor-move transition-shadow duration-200' : ''}
        ${isActive && isEditMode ? 'ring-2 ring-brand-green bg-brand-green/5' : ''}
      `}
      style={{ position: 'absolute' }} // Base absolute positioning
    >
      {/* Visual cue in edit mode */}
      {isEditMode && (
        <div className={`absolute inset-0 z-50 pointer-events-none transition-colors duration-200 ${isActive ? 'bg-brand-green/10' : 'hover:bg-brand-gold/10'}`} />
      )}
      {children}
    </motion.div>
  );
}
