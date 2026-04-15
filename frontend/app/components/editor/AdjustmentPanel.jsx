'use client';
import { useEditorStore } from '@/app/store/editorStore';

/**
 * A single slider control for an adjustment parameter.
 */
function Slider({ label, param, min, max, step = 1, displayFn }) {
  const value = useEditorStore((s) => s.adjustments[param]);
  const updateAdjustment = useEditorStore((s) => s.updateAdjustment);

  const display = displayFn ? displayFn(value) : value;

  return (
    <div className="slider-group">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => updateAdjustment(param, parseFloat(e.target.value))}
        id={`slider-${param}`}
      />
    </div>
  );
}

export default function AdjustmentPanel() {
  const resetAdjustments = useEditorStore((s) => s.resetAdjustments);

  return (
    <aside className="right-panel" id="adjustment-panel">
      <div className="panel-header">
        <h2>Adjustments</h2>
        <button
          className="btn btn-sm btn-ghost"
          onClick={resetAdjustments}
          id="reset-adjustments-btn"
        >
          Reset
        </button>
      </div>

      {/* Light Section */}
      <div className="panel-section">
        <div className="panel-section-title">Light</div>
        <Slider
          label="Exposure"
          param="exposure"
          min={-2}
          max={2}
          step={0.05}
          displayFn={(v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
        />
        <Slider label="Contrast" param="contrast" min={-100} max={100} />
        <Slider label="Highlights" param="highlights" min={-100} max={100} />
        <Slider label="Shadows" param="shadows" min={-100} max={100} />
      </div>

      {/* Color Section */}
      <div className="panel-section">
        <div className="panel-section-title">Color</div>
        <Slider label="Vibrance" param="vibrance" min={-100} max={100} />
        <Slider label="Saturation" param="saturation" min={-100} max={100} />
      </div>

      {/* Detail Section */}
      <div className="panel-section">
        <div className="panel-section-title">Detail</div>
        <Slider label="Sharpening" param="sharpening" min={0} max={100} />
      </div>

      {/* Effects Section */}
      <div className="panel-section">
        <div className="panel-section-title">Effects</div>
        <Slider label="Vignette" param="vignette" min={0} max={100} />
        <Slider label="Grain" param="grain" min={0} max={100} />
      </div>
    </aside>
  );
}
