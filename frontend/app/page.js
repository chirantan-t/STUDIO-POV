'use client';
import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/app/store/editorStore';
import TopBar from '@/app/components/editor/TopBar';
import AIToolsPanel from '@/app/components/ai/AIToolsPanel';
import EditorCanvas from '@/app/components/editor/EditorCanvas';
import AdjustmentPanel from '@/app/components/editor/AdjustmentPanel';
import MaskOverlay from '@/app/components/editor/MaskOverlay';
import { HiPhoto } from 'react-icons/hi2';

export default function Home() {
  const imageSrc = useEditorStore((s) => s.imageSrc);
  const imageLoaded = useEditorStore((s) => s.imageLoaded);
  const setImageFile = useEditorStore((s) => s.setImageFile);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const fileInputRef = useRef(null);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      // Zoom: Ctrl + / -
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(zoom + 0.1);
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setZoom(zoom - 0.1);
      }
      // Open: Ctrl+O
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, zoom, setZoom]);

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  // 1. Initial Upload Screen
  if (!imageSrc) {
    return (
      <div className="upload-screen">
        <div className="upload-brand">
          <h1>STUDIO POV</h1>
          <p>AI-Powered Professional Photo Editor</p>
        </div>

        <div 
          className="upload-dropzone fade-in" 
          onClick={() => fileInputRef.current?.click()}
          id="initial-upload-dropzone"
        >
          <HiPhoto className="icon" />
          <span className="label">Click to upload or drag image here</span>
          <span className="hint">Supports PNG, JPG, WebP</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileSelect} 
            accept="image/*" 
            className="hidden-file-input"
          />
        </div>
      </div>
    );
  }

  // 2. Editor Layout
  return (
    <div className="editor-layout fade-in">
      <TopBar />
      
      <AIToolsPanel />

      <main className="canvas-area">
        <EditorCanvas />
      </main>

      <AdjustmentPanel />
    </div>
  );
}
