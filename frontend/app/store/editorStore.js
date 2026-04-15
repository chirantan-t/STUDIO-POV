'use client';
import { create } from 'zustand';

const defaultAdjustments = {
  exposure: 0,      // -2 to +2
  contrast: 0,      // -100 to +100
  highlights: 0,    // -100 to +100
  shadows: 0,       // -100 to +100
  vibrance: 0,      // -100 to +100
  saturation: 0,    // -100 to +100
  sharpening: 0,    // 0 to 100
  vignette: 0,      // 0 to 100
  grain: 0,         // 0 to 100
};

export const useEditorStore = create((set, get) => ({
  // ── Image state ──
  imageFile: null,
  imageSrc: null,
  imageLoaded: false,
  originalImageData: null,

  // ── Adjustments ──
  adjustments: { ...defaultAdjustments },

  // ── Canvas ──
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  canvasRef: null,

  // ── History ──
  history: [],
  historyIndex: -1,
  maxHistory: 50,

  // ── AI state ──
  aiProcessing: false,
  aiDetections: [],
  aiCaptions: null,
  aiEnhanceResults: null,

  // ── Mask state ──
  maskData: null,            // Uint8Array — per-pixel mask (0-255)
  maskEnabled: false,
  maskInverted: false,
  maskVisible: true,
  maskBrushSize: 40,
  maskBrushFeather: 8,
  maskBrushMode: 'paint',    // 'paint' or 'erase'
  maskOpacity: 0.4,
  maskImageWidth: 0,
  maskImageHeight: 0,

  // ── Actions: Image ──
  setImageFile: (file) => {
    const src = URL.createObjectURL(file);
    set({
      imageFile: file,
      imageSrc: src,
      imageLoaded: false,
      adjustments: { ...defaultAdjustments },
      history: [],
      historyIndex: -1,
      maskData: null,
      maskEnabled: false,
      aiDetections: [],
      aiCaptions: null,
      aiEnhanceResults: null,
    });
  },

  setImageLoaded: (loaded) => set({ imageLoaded: loaded }),
  setOriginalImageData: (data) => set({ originalImageData: data }),
  setCanvasRef: (ref) => set({ canvasRef: ref }),

  // ── Actions: Adjustments ──
  updateAdjustment: (key, value) => {
    const state = get();
    const newAdj = { ...state.adjustments, [key]: value };
    // Push current state to history
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ ...state.adjustments });
    if (newHistory.length > state.maxHistory) newHistory.shift();
    set({
      adjustments: newAdj,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  setAdjustments: (adj) => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ ...state.adjustments });
    if (newHistory.length > state.maxHistory) newHistory.shift();
    set({
      adjustments: { ...defaultAdjustments, ...adj },
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  resetAdjustments: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ ...state.adjustments });
    if (newHistory.length > state.maxHistory) newHistory.shift();
    set({
      adjustments: { ...defaultAdjustments },
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // ── Actions: History ──
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      set({
        adjustments: { ...state.history[state.historyIndex - 1] },
        historyIndex: state.historyIndex - 1,
      });
    } else if (state.historyIndex === 0) {
      set({
        adjustments: { ...defaultAdjustments },
        historyIndex: -1,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      set({
        adjustments: { ...state.history[state.historyIndex + 1] },
        historyIndex: state.historyIndex + 1,
      });
    }
  },

  // ── Actions: Zoom/Pan ──
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(5, z)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  // ── Actions: AI ──
  setAiProcessing: (val) => set({ aiProcessing: val }),
  setAiDetections: (d) => set({ aiDetections: d }),
  setAiCaptions: (c) => set({ aiCaptions: c }),
  setAiEnhanceResults: (r) => set({ aiEnhanceResults: r }),

  // ── Actions: Mask ──
  initMask: (width, height) => {
    const mask = new Uint8Array(width * height);
    set({
      maskData: mask,
      maskEnabled: true,
      maskVisible: true,
      maskImageWidth: width,
      maskImageHeight: height,
    });
    return mask;
  },

  setMaskData: (data) => set({ maskData: data }),

  clearMask: () => set({
    maskData: null,
    maskEnabled: false,
    maskInverted: false,
    maskVisible: true,
    aiDetections: [],
  }),

  invertMask: () => {
    const state = get();
    if (state.maskData) {
      const inverted = new Uint8Array(state.maskData.length);
      for (let i = 0; i < state.maskData.length; i++) {
        inverted[i] = 255 - state.maskData[i];
      }
      set({ maskData: inverted });
    }
    set({ maskInverted: !state.maskInverted });
  },

  toggleMaskVisible: () => set((s) => ({ maskVisible: !s.maskVisible })),
  setMaskBrushSize: (size) => set({ maskBrushSize: size }),
  setMaskBrushFeather: (feather) => set({ maskBrushFeather: feather }),
  setMaskBrushMode: (mode) => set({ maskBrushMode: mode }),
}));

export { defaultAdjustments };
