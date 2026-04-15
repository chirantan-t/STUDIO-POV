'use client';
import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/app/store/editorStore';

/**
 * MaskOverlay — transparent canvas layer that:
 * 1. Renders the mask as a semi-transparent overlay
 * 2. Handles brush painting/erasing for mask editing
 */
export default function MaskOverlay() {
  const overlayRef = useRef(null);
  const isDrawing = useRef(false);

  const maskData = useEditorStore((s) => s.maskData);
  const maskVisible = useEditorStore((s) => s.maskVisible);
  const maskEnabled = useEditorStore((s) => s.maskEnabled);
  const maskBrushSize = useEditorStore((s) => s.maskBrushSize);
  const maskBrushFeather = useEditorStore((s) => s.maskBrushFeather);
  const maskBrushMode = useEditorStore((s) => s.maskBrushMode);
  const maskImageWidth = useEditorStore((s) => s.maskImageWidth);
  const maskImageHeight = useEditorStore((s) => s.maskImageHeight);
  const setMaskData = useEditorStore((s) => s.setMaskData);
  const zoom = useEditorStore((s) => s.zoom);
  const panOffset = useEditorStore((s) => s.panOffset);
  const canvasRef = useEditorStore((s) => s.canvasRef);

  // Render mask overlay
  const renderOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay || !maskData || !maskVisible || !maskEnabled) {
      if (overlay) {
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
      return;
    }

    const ctx = overlay.getContext('2d');
    overlay.width = maskImageWidth;
    overlay.height = maskImageHeight;

    const imageData = ctx.createImageData(maskImageWidth, maskImageHeight);
    const d = imageData.data;

    for (let i = 0; i < maskData.length; i++) {
      const v = maskData[i];
      if (v > 0) {
        d[i * 4] = 255;      // R — Red selection
        d[i * 4 + 1] = 60;    // G
        d[i * 4 + 2] = 60;    // B
        d[i * 4 + 3] = Math.round(v * 0.6); // Slightly higher Alpha for visibility
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [maskData, maskVisible, maskEnabled, maskImageWidth, maskImageHeight]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  // ── Paint/Erase with brush ──
  const paintAt = useCallback((x, y) => {
    const state = useEditorStore.getState();
    const mask = state.maskData;
    if (!mask) return;

    const w = state.maskImageWidth;
    const h = state.maskImageHeight;
    const radius = state.maskBrushSize / 2;
    const feather = state.maskBrushFeather;
    const mode = state.maskBrushMode;

    const newMask = new Uint8Array(mask);

    const minX = Math.max(0, Math.floor(x - radius - feather));
    const maxX = Math.min(w - 1, Math.ceil(x + radius + feather));
    const minY = Math.max(0, Math.floor(y - radius - feather));
    const maxY = Math.min(h - 1, Math.ceil(y + radius + feather));

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
        if (dist > radius + feather) continue;

        let strength;
        if (dist <= radius) {
          strength = 1;
        } else {
          strength = 1 - (dist - radius) / feather;
        }

        const idx = py * w + px;
        if (mode === 'paint') {
          newMask[idx] = Math.min(255, Math.max(newMask[idx], Math.round(strength * 255)));
        } else {
          newMask[idx] = Math.max(0, Math.round(newMask[idx] * (1 - strength)));
        }
      }
    }

    setMaskData(newMask);
  }, [setMaskData]);

  const getCanvasCoords = useCallback((e) => {
    const overlay = overlayRef.current;
    if (!overlay) return null;

    const rect = overlay.getBoundingClientRect();
    const scaleX = maskImageWidth / rect.width;
    const scaleY = maskImageHeight / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [maskImageWidth, maskImageHeight]);

  const handleMouseDown = useCallback((e) => {
    if (!maskEnabled || e.button !== 0) return;
    isDrawing.current = true;
    const coords = getCanvasCoords(e);
    if (coords) paintAt(coords.x, coords.y);
  }, [maskEnabled, getCanvasCoords, paintAt]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing.current) return;
    const coords = getCanvasCoords(e);
    if (coords) paintAt(coords.x, coords.y);
  }, [getCanvasCoords, paintAt]);

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
  }, []);

  if (!maskEnabled || !maskData) return null;

  return (
    <canvas
      ref={overlayRef}
      className={`mask-overlay-canvas ${maskEnabled ? 'painting' : ''}`}
      id="mask-overlay"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 20
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
