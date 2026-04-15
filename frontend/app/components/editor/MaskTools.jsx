'use client';
import { useEditorStore } from '@/app/store/editorStore';
import {
  HiPaintBrush,
  HiEyeSlash,
  HiEye,
  HiTrash,
  HiArrowsRightLeft,
} from 'react-icons/hi2';

/**
 * MaskTools — toolbar for editing the AI-generated mask.
 * Appears when a mask is active.
 */
export default function MaskTools() {
  const maskBrushMode = useEditorStore((s) => s.maskBrushMode);
  const maskBrushSize = useEditorStore((s) => s.maskBrushSize);
  const maskBrushFeather = useEditorStore((s) => s.maskBrushFeather);
  const maskVisible = useEditorStore((s) => s.maskVisible);
  const setMaskBrushMode = useEditorStore((s) => s.setMaskBrushMode);
  const setMaskBrushSize = useEditorStore((s) => s.setMaskBrushSize);
  const setMaskBrushFeather = useEditorStore((s) => s.setMaskBrushFeather);
  const toggleMaskVisible = useEditorStore((s) => s.toggleMaskVisible);
  const invertMask = useEditorStore((s) => s.invertMask);
  const clearMask = useEditorStore((s) => s.clearMask);

  return (
    <div className="mask-tools-bar fade-in" id="mask-tools">
      <div className="sidebar-section-title">Mask Tools</div>

      {/* Brush / Erase toggle */}
      <div className="mask-tools-row">
        <button
          className={`btn btn-sm ${maskBrushMode === 'paint' ? 'btn-active' : 'btn-ghost'}`}
          onClick={() => setMaskBrushMode('paint')}
          title="Paint Mask"
          id="mask-brush-btn"
        >
          <HiPaintBrush size={14} /> Brush
        </button>
        <button
          className={`btn btn-sm ${maskBrushMode === 'erase' ? 'btn-active' : 'btn-ghost'}`}
          onClick={() => setMaskBrushMode('erase')}
          title="Erase Mask"
          id="mask-erase-btn"
        >
          ✕ Erase
        </button>

        <div style={{ flex: 1 }} />

        <button
          className="btn btn-icon btn-sm btn-ghost"
          onClick={toggleMaskVisible}
          title={maskVisible ? 'Hide Mask' : 'Show Mask'}
          id="mask-visibility-btn"
        >
          {maskVisible ? <HiEye size={14} /> : <HiEyeSlash size={14} />}
        </button>
        <button
          className="btn btn-icon btn-sm btn-ghost"
          onClick={invertMask}
          title="Invert Mask"
          id="mask-invert-btn"
        >
          <HiArrowsRightLeft size={14} />
        </button>
        <button
          className="btn btn-icon btn-sm btn-danger"
          onClick={clearMask}
          title="Clear Mask"
          id="mask-clear-btn"
        >
          <HiTrash size={14} />
        </button>
      </div>

      {/* Brush size slider */}
      <div className="slider-group">
        <div className="slider-label">
          <span>Brush Size</span>
          <span className="slider-value">{maskBrushSize}px</span>
        </div>
        <input
          type="range"
          min={1}
          max={200}
          value={maskBrushSize}
          onChange={(e) => setMaskBrushSize(parseInt(e.target.value))}
          id="mask-brush-size-slider"
        />
      </div>

      {/* Feather slider */}
      <div className="slider-group">
        <div className="slider-label">
          <span>Feather</span>
          <span className="slider-value">{maskBrushFeather}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          value={maskBrushFeather}
          onChange={(e) => setMaskBrushFeather(parseInt(e.target.value))}
          id="mask-feather-slider"
        />
      </div>
    </div>
  );
}
