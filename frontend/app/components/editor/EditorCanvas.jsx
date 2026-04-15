'use client';
import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/app/store/editorStore';
import MaskOverlay from './MaskOverlay';

/**
 * EditorCanvas — Main canvas-based image editor.
 *
 * Loads the uploaded image, applies adjustments in real-time via
 * pixel manipulation, and supports zoom/pan. When a mask is active
 * and enabled, adjustments are applied only to masked pixels.
 */
export default function EditorCanvas() {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const frameRef = useRef(null);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const imageSrc = useEditorStore((s) => s.imageSrc);
  const adjustments = useEditorStore((s) => s.adjustments);
  const zoom = useEditorStore((s) => s.zoom);
  const panOffset = useEditorStore((s) => s.panOffset);
  const setImageLoaded = useEditorStore((s) => s.setImageLoaded);
  const originalImageData = useEditorStore((s) => s.originalImageData);
  const setOriginalImageData = useEditorStore((s) => s.setOriginalImageData);
  const setCanvasRef = useEditorStore((s) => s.setCanvasRef);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPanOffset = useEditorStore((s) => s.setPanOffset);
  const maskData = useEditorStore((s) => s.maskData);
  const maskEnabled = useEditorStore((s) => s.maskEnabled);

  // Load image when src changes
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      setCanvasRef(canvas);

      // Store original pixel data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(img, 0, 0);
      const origData = tempCtx.getImageData(0, 0, img.width, img.height);
      setOriginalImageData(origData);
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc, setImageLoaded, setOriginalImageData, setCanvasRef]);

  // Apply adjustments pipeline
  const applyAdjustments = useCallback(() => {
    const canvas = canvasRef.current;
    const origData = useEditorStore.getState().originalImageData;
    if (!canvas || !origData) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clone original data
    const imageData = ctx.createImageData(width, height);
    const src = origData.data;
    const dst = imageData.data;
    const adj = adjustments;

    // Get current mask state
    const state = useEditorStore.getState();
    const mask = state.maskData;
    const hasMask = state.maskEnabled && mask && mask.length === width * height;

    // Pre-compute adjustment factors
    const exposureMul = Math.pow(2, adj.exposure);
    const contrastFactor = (259 * (adj.contrast + 255)) / (255 * (259 - adj.contrast));
    const highlightStr = adj.highlights / 100;
    const shadowStr = adj.shadows / 100;
    const vibranceStr = adj.vibrance / 100;
    const saturationStr = adj.saturation / 100;
    const sharpenStr = adj.sharpening / 100;

    // Process pixels
    for (let i = 0; i < src.length; i += 4) {
      const pixelIdx = i / 4;

      // If mask is active and this pixel is not masked, keep original
      if (hasMask && mask[pixelIdx] === 0) {
        dst[i] = src[i];
        dst[i + 1] = src[i + 1];
        dst[i + 2] = src[i + 2];
        dst[i + 3] = src[i + 3];
        continue;
      }

      let r = src[i];
      let g = src[i + 1];
      let b = src[i + 2];

      // For partially masked pixels, we'll blend later
      const maskAlpha = hasMask ? mask[pixelIdx] / 255 : 1;

      // ── Exposure ──
      r *= exposureMul;
      g *= exposureMul;
      b *= exposureMul;

      // ── Contrast ──
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;

      // ── Highlights / Shadows ──
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (highlightStr !== 0) {
        const highlightMask = Math.max(0, (lum - 128) / 127);
        const hAdj = highlightStr * highlightMask * 60;
        r += hAdj;
        g += hAdj;
        b += hAdj;
      }

      if (shadowStr !== 0) {
        const shadowMask = Math.max(0, 1 - lum / 128);
        const sAdj = shadowStr * shadowMask * 60;
        r += sAdj;
        g += sAdj;
        b += sAdj;
      }

      // ── Vibrance (smart saturation — boosts less saturated colors more) ──
      if (vibranceStr !== 0) {
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const currentSat = maxC === 0 ? 0 : (maxC - minC) / maxC;
        const vibAdj = vibranceStr * (1 - currentSat) * 0.5;
        const avg = (r + g + b) / 3;
        r += (r - avg) * vibAdj;
        g += (g - avg) * vibAdj;
        b += (b - avg) * vibAdj;
      }

      // ── Saturation ──
      if (saturationStr !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const satMul = 1 + saturationStr;
        r = gray + (r - gray) * satMul;
        g = gray + (g - gray) * satMul;
        b = gray + (b - gray) * satMul;
      }

      // Clamp
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      // Blend with original if partially masked
      if (hasMask && maskAlpha < 1) {
        r = src[i] + (r - src[i]) * maskAlpha;
        g = src[i + 1] + (g - src[i + 1]) * maskAlpha;
        b = src[i + 2] + (b - src[i + 2]) * maskAlpha;
      }

      dst[i] = r;
      dst[i + 1] = g;
      dst[i + 2] = b;
      dst[i + 3] = src[i + 3];
    }

    ctx.putImageData(imageData, 0, 0);

    // ── Sharpening (unsharp mask approximation) ──
    if (sharpenStr > 0) {
      // We apply sharpening as a post-process using canvas compositing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
      tempCtx.filter = `blur(1px)`;
      tempCtx.drawImage(canvas, 0, 0);

      // Subtract blurred from original
      const sharpData = ctx.getImageData(0, 0, width, height);
      const blurData = tempCtx.getImageData(0, 0, width, height);
      const sd = sharpData.data;
      const bd = blurData.data;

      for (let i = 0; i < sd.length; i += 4) {
        sd[i] = Math.max(0, Math.min(255, sd[i] + (sd[i] - bd[i]) * sharpenStr * 2));
        sd[i + 1] = Math.max(0, Math.min(255, sd[i + 1] + (sd[i + 1] - bd[i + 1]) * sharpenStr * 2));
        sd[i + 2] = Math.max(0, Math.min(255, sd[i + 2] + (sd[i + 2] - bd[i + 2]) * sharpenStr * 2));
      }
      ctx.putImageData(sharpData, 0, 0);
    }

    // ── Vignette ──
    if (adj.vignette > 0) {
      const vigStr = adj.vignette / 100;
      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.sqrt(cx * cx + cy * cy);
      const gradient = ctx.createRadialGradient(cx, cy, maxRadius * 0.3, cx, cy, maxRadius);
      gradient.addColorStop(0, `rgba(0,0,0,0)`);
      gradient.addColorStop(1, `rgba(0,0,0,${vigStr * 0.8})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // ── Grain ──
    if (adj.grain > 0) {
      const grainStr = adj.grain / 100;
      const grainData = ctx.getImageData(0, 0, width, height);
      const gd = grainData.data;
      for (let i = 0; i < gd.length; i += 4) {
        const noise = (Math.random() - 0.5) * grainStr * 60;
        gd[i] = Math.max(0, Math.min(255, gd[i] + noise));
        gd[i + 1] = Math.max(0, Math.min(255, gd[i + 1] + noise));
        gd[i + 2] = Math.max(0, Math.min(255, gd[i + 2] + noise));
      }
      ctx.putImageData(grainData, 0, 0);
    }
  }, [adjustments]);

  // Re-render when adjustments, mask, or original image changes
  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(applyAdjustments);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [applyAdjustments, maskData, maskEnabled, originalImageData]);

  // ── Mouse wheel zoom ──
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  }, [zoom, setZoom]);

  // ── Pan via middle mouse or space+drag ──
  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
  }, [panOffset, setPanOffset]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  if (!imageSrc) {
    return (
      <div className="canvas-area" id="canvas-area">
        <div className="canvas-empty">
          <span style={{ fontSize: 48, opacity: 0.3 }}>📷</span>
          <span>Upload an image to start editing</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="canvas-area"
      id="canvas-area"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="canvas-container"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning.current ? 'none' : 'transform 0.1s ease',
        }}
      >
        <canvas ref={canvasRef} className="editor-canvas" id="editor-canvas" />
        <MaskOverlay />
      </div>
    </div>
  );
}
