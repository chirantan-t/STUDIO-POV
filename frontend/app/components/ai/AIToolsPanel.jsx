'use client';
import { useState } from 'react';
import { useEditorStore } from '@/app/store/editorStore';
import { generateMask, autoEnhance, generateCaption } from '@/app/lib/api';
import MaskTools from '@/app/components/editor/MaskTools';
import { HiSparkles, HiChatBubbleBottomCenterText } from 'react-icons/hi2';
import { HiScissors } from 'react-icons/hi2';
import { HiClipboardDocument } from 'react-icons/hi2';
import { HiArrowUpTray } from 'react-icons/hi2';

export default function AIToolsPanel() {
  const imageFile = useEditorStore((s) => s.imageFile);
  const imageLoaded = useEditorStore((s) => s.imageLoaded);
  const aiProcessing = useEditorStore((s) => s.aiProcessing);
  const setAiProcessing = useEditorStore((s) => s.setAiProcessing);
  const setAiDetections = useEditorStore((s) => s.setAiDetections);
  const setAiCaptions = useEditorStore((s) => s.setAiCaptions);
  const setAiEnhanceResults = useEditorStore((s) => s.setAiEnhanceResults);
  const aiCaptions = useEditorStore((s) => s.aiCaptions);
  const aiEnhanceResults = useEditorStore((s) => s.aiEnhanceResults);
  const aiDetections = useEditorStore((s) => s.aiDetections);
  const setAdjustments = useEditorStore((s) => s.setAdjustments);
  const maskEnabled = useEditorStore((s) => s.maskEnabled);
  const canvasRef = useEditorStore((s) => s.canvasRef);

  const [maskLoading, setMaskLoading] = useState(false);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedCaption, setCopiedCaption] = useState(null);

  const disabled = !imageFile || !imageLoaded;

  // ── AI Masking ──
  const handleMask = async () => {
    if (disabled) return;
    setMaskLoading(true);
    setError(null);
    setAiProcessing(true);

    try {
      const result = await generateMask(imageFile);

      if (result.status === 'success' && result.mask) {
        // Decode base64 mask PNG into pixel data
        const maskImg = new window.Image();
        maskImg.onload = () => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = result.width;
          tempCanvas.height = result.height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(maskImg, 0, 0);
          const maskImageData = tempCtx.getImageData(0, 0, result.width, result.height);

          // Extract grayscale mask into Uint8Array
          const maskArr = new Uint8Array(result.width * result.height);
          for (let i = 0; i < maskArr.length; i++) {
            maskArr[i] = maskImageData.data[i * 4]; // R channel
          }

          // Store mask in zustand
          const store = useEditorStore.getState();
          store.initMask(result.width, result.height);
          useEditorStore.setState({ maskData: maskArr });
          setAiDetections(result.detections || []);
        };
        maskImg.src = `data:image/png;base64,${result.mask}`;
      } else {
        setError('No subjects detected in the image.');
      }
    } catch (err) {
      console.error('AI Mask error:', err);
      setError(`Masking failed: ${err.message}`);
    } finally {
      setMaskLoading(false);
      setAiProcessing(false);
    }
  };

  // ── Auto Enhance ──
  const handleEnhance = async () => {
    if (disabled) return;
    setEnhanceLoading(true);
    setError(null);
    setAiProcessing(true);

    try {
      const result = await autoEnhance(imageFile);
      setAiEnhanceResults(result);

      // Apply suggested adjustments
      if (result.suggestions && result.suggestions.length > 0) {
        const newAdj = {};
        for (const s of result.suggestions) {
          if (['exposure', 'contrast', 'highlights', 'shadows', 'vibrance', 'saturation', 'sharpening'].includes(s.param)) {
            newAdj[s.param] = s.value;
          }
        }
        setAdjustments(newAdj);
      }
    } catch (err) {
      console.error('Auto Enhance error:', err);
      setError(`Enhance failed: ${err.message}`);
    } finally {
      setEnhanceLoading(false);
      setAiProcessing(false);
    }
  };

  // ── Caption Generation ──
  const handleCaption = async () => {
    if (disabled) return;
    setCaptionLoading(true);
    setError(null);
    setAiProcessing(true);

    try {
      const result = await generateCaption(imageFile);
      setAiCaptions(result);
    } catch (err) {
      console.error('Caption error:', err);
      setError(`Caption generation failed: ${err.message}`);
    } finally {
      setCaptionLoading(false);
      setAiProcessing(false);
    }
  };

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaption(type);
      setTimeout(() => setCopiedCaption(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <aside className="sidebar" id="ai-tools-panel">
      <div className="sidebar-header">
        <h2>✦ AI Tools</h2>
      </div>

      {/* Error display */}
      {error && (
        <div style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
          <div className="status-badge error">{error}</div>
        </div>
      )}

      {/* ── AI Masking ── */}
      <div className="sidebar-section">
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon mask">
              <HiScissors />
            </div>
            <div>
              <h3>AI Masking</h3>
              <p>Detect and mask the main subject</p>
            </div>
          </div>
          <button
            className="ai-tool-btn mask"
            onClick={handleMask}
            disabled={disabled || maskLoading}
            id="ai-mask-btn"
          >
            {maskLoading ? (
              <>
                <span className="spinner-inline" />
                Detecting...
              </>
            ) : (
              'Generate Mask'
            )}
          </button>

          {/* Detection results */}
          {aiDetections.length > 0 && (
            <div className="detection-list" style={{ marginTop: 8 }}>
              {aiDetections.map((d, i) => (
                <span className="detection-badge" key={i}>
                  {d.label} {Math.round(d.confidence * 100)}%
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Mask editing tools — show when mask is active */}
        {maskEnabled && <MaskTools />}
      </div>

      {/* ── Auto Enhance ── */}
      <div className="sidebar-section">
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon enhance">
              <HiSparkles />
            </div>
            <div>
              <h3>Auto Enhance</h3>
              <p>AI-powered image optimization</p>
            </div>
          </div>
          <button
            className="ai-tool-btn enhance"
            onClick={handleEnhance}
            disabled={disabled || enhanceLoading}
            id="ai-enhance-btn"
          >
            {enhanceLoading ? (
              <>
                <span className="spinner-inline" />
                Analyzing...
              </>
            ) : (
              'Enhance Image'
            )}
          </button>

          {/* Enhancement results */}
          {aiEnhanceResults?.suggestions && aiEnhanceResults.suggestions.length > 0 && (
            <div className="enhance-results fade-in">
              {aiEnhanceResults.suggestions.map((s, i) => (
                <div className="enhance-suggestion" key={i}>
                  <span className="param">{s.name}</span>
                  <span className="value">
                    {typeof s.value === 'number'
                      ? s.value > 0 ? `+${s.value}` : s.value
                      : s.value
                    }
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                ✓ Adjustments applied to sliders
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Caption Generation ── */}
      <div className="sidebar-section">
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon caption">
              <HiChatBubbleBottomCenterText />
            </div>
            <div>
              <h3>Caption Generation</h3>
              <p>Smart captions for your image</p>
            </div>
          </div>
          <button
            className="ai-tool-btn caption"
            onClick={handleCaption}
            disabled={disabled || captionLoading}
            id="ai-caption-btn"
          >
            {captionLoading ? (
              <>
                <span className="spinner-inline" />
                Generating...
              </>
            ) : (
              'Generate Captions'
            )}
          </button>

          {/* Caption results */}
          {aiCaptions && (
            <div className="caption-results fade-in">
              {[
                { key: 'descriptive', label: 'Descriptive' },
                { key: 'social', label: 'Social Media' },
                { key: 'seo', label: 'SEO' },
              ].map(({ key, label }) => (
                <div className="caption-card" key={key}>
                  <div className="caption-card-header">
                    <span className="caption-card-label">{label}</span>
                    <button
                      className="caption-card-copy"
                      onClick={() => handleCopy(aiCaptions[key], key)}
                      title="Copy to clipboard"
                    >
                      {copiedCaption === key ? '✓' : <HiClipboardDocument />}
                    </button>
                  </div>
                  <p>{aiCaptions[key]}</p>
                </div>
              ))}

              {aiCaptions.detectedObjects?.length > 0 && (
                <div className="detection-list">
                  {aiCaptions.detectedObjects.map((obj, i) => (
                    <span className="detection-badge" key={i}>{obj}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
