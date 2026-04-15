'use client';
import { useRef } from 'react';
import { useEditorStore } from '@/app/store/editorStore';
import {
  HiArrowUpTray,
  HiArrowUturnLeft,
  HiArrowUturnRight,
  HiPlus,
  HiMinus,
  HiArrowDownTray,
} from 'react-icons/hi2';

export default function TopBar() {
  const fileRef = useRef(null);
  const {
    setImageFile,
    undo, redo,
    zoom, setZoom,
    history, historyIndex,
    imageLoaded,
    canvasRef,
  } = useEditorStore();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
    // Reset input so re-uploading the same file works
    e.target.value = '';
  };

  const handleExport = () => {
    if (!canvasRef) return;
    const link = document.createElement('a');
    link.download = 'studio-pov-export.png';
    link.href = canvasRef.toDataURL('image/png');
    link.click();
  };

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <header className="topbar" id="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          STUDIO <span>POV</span>
        </div>

        <div className="topbar-divider" />

        <button
          className="btn btn-ghost"
          onClick={() => fileRef.current?.click()}
          id="upload-btn"
        >
          <HiArrowUpTray size={16} />
          {imageLoaded ? 'Replace' : 'Open'}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden-file-input"
          onChange={handleFileChange}
          id="file-input"
        />
      </div>

      <div className="topbar-center">
        <button
          className="btn btn-icon btn-ghost"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          id="undo-btn"
        >
          <HiArrowUturnLeft size={16} />
        </button>
        <button
          className="btn btn-icon btn-ghost"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          id="redo-btn"
        >
          <HiArrowUturnRight size={16} />
        </button>

        <div className="topbar-divider" />

        <button
          className="btn btn-icon btn-ghost"
          onClick={() => setZoom(zoom - 0.1)}
          title="Zoom Out"
          id="zoom-out-btn"
        >
          <HiMinus size={16} />
        </button>
        <span className="zoom-indicator" id="zoom-display">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="btn btn-icon btn-ghost"
          onClick={() => setZoom(zoom + 0.1)}
          title="Zoom In"
          id="zoom-in-btn"
        >
          <HiPlus size={16} />
        </button>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => setZoom(1)}
          title="Reset Zoom"
          id="zoom-reset-btn"
        >
          Fit
        </button>
      </div>

      <div className="topbar-right">
        {imageLoaded && (
          <button
            className="btn btn-primary"
            onClick={handleExport}
            id="export-btn"
          >
            <HiArrowDownTray size={16} />
            Export
          </button>
        )}
      </div>
    </header>
  );
}
