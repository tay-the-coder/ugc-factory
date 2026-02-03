/**
 * SegmentCard Components
 * 
 * Reusable cards for A-Roll, B-Roll, and Animation steps
 * that support per-card state (custom prompts, expansion, etc.)
 */

'use client';

import { useState } from 'react';
import { UploadOverride, PromptEditor } from './AdvancedPanel.js';

/**
 * A-Roll Segment Card
 */
export function ARollCard({ 
  segment, 
  clip, 
  isGenerating, 
  advancedMode,
  customPrompt,
  onCustomPromptChange,
  onGenerate 
}) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          segment.type === 'hook' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
          {segment.type === 'hook' ? '🪝 Hook' : `Segment ${segment.segment}`}
        </div>
        <div className="flex items-center gap-2">
          {clip && <span className="text-green-500 text-sm">✓</span>}
          {advancedMode && (
            <button 
              onClick={() => setShowCustom(!showCustom)}
              className="text-gray-400 hover:text-black text-sm"
              title="Custom prompt"
            >⚙️</button>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-4">"{segment.text}"</p>

      {advancedMode && showCustom && (
        <div className="mb-4">
          <textarea 
            className="textarea text-xs"
            rows={3}
            placeholder="Custom Veo prompt for this segment..."
            value={customPrompt || ''}
            onChange={(e) => onCustomPromptChange(e.target.value)}
          />
        </div>
      )}

      {clip?.videoUrl ? (
        <video src={clip.videoUrl} controls className="w-full rounded-lg mb-3" />
      ) : (
        <div className="aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center mb-3">
          {isGenerating ? (
            <div className="text-center">
              <svg className="animate-spin w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-gray-500">Generating...</span>
            </div>
          ) : (
            <span className="text-gray-400">Not generated</span>
          )}
        </div>
      )}

      <button className="btn-secondary w-full text-sm" 
        onClick={onGenerate}
        disabled={isGenerating}
        title="Kling AI Video">
        {clip ? 'Regenerate' : 'Generate'} <span className="text-xs opacity-60">(Kling)</span>
      </button>
    </div>
  );
}

/**
 * B-Roll Segment Card
 */
export function BRollCard({ 
  segment, 
  broll, 
  isGenerating, 
  advancedMode,
  customPrompt,
  onCustomPromptChange,
  onGenerate,
  onUpload
}) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">
          {segment.type === 'hook' ? '🪝 Hook' : `Seg ${segment.segment}`}
        </span>
        <div className="flex items-center gap-2">
          {broll && (
            <span className={`text-xs ${broll.qcScore >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
              {broll.uploaded ? '📁' : `QC: ${broll.qcScore}`}
            </span>
          )}
          {advancedMode && (
            <button 
              onClick={() => setShowCustom(!showCustom)}
              className="text-gray-400 hover:text-black text-xs"
            >⚙️</button>
          )}
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">"{segment.text}"</p>

      {advancedMode && showCustom && (
        <div className="mb-3 space-y-2">
          <textarea 
            className="textarea text-xs"
            rows={2}
            placeholder="Custom image prompt..."
            value={customPrompt || ''}
            onChange={(e) => onCustomPromptChange(e.target.value)}
          />
          <UploadOverride 
            onUpload={onUpload}
            label="Upload instead"
          />
        </div>
      )}

      {broll?.image ? (
        <img src={broll.image} alt={`B-roll ${segment.segment}`} 
          className="w-full aspect-[9/16] object-cover rounded-lg mb-3" />
      ) : (
        <div className="aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center mb-3">
          {isGenerating ? (
            <svg className="animate-spin w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <span className="text-xs text-gray-400">Empty</span>
          )}
        </div>
      )}

      <button className="btn-secondary w-full text-xs py-2" 
        onClick={onGenerate}
        disabled={isGenerating}
        title="Gemini Imagen 3">
        {broll ? 'Redo' : 'Generate'} <span className="opacity-60">(Imagen 3)</span>
      </button>
    </div>
  );
}

/**
 * Animation Segment Card
 */
export function AnimationCard({ 
  segment, 
  broll,
  animation, 
  isAnimating, 
  isPolling,
  advancedMode,
  customPrompt,
  onCustomPromptChange,
  onAnimate
}) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">Seg {segment.segment}</span>
        <div className="flex items-center gap-1">
          {animation && <span className="text-xs text-green-500">✓</span>}
          {isPolling && <span className="text-xs text-blue-500 animate-pulse">⏳</span>}
          {advancedMode && (
            <button 
              onClick={() => setShowCustom(!showCustom)}
              className="text-gray-400 hover:text-black text-xs"
            >⚙️</button>
          )}
        </div>
      </div>

      {advancedMode && showCustom && (
        <div className="mb-3">
          <textarea 
            className="textarea text-xs"
            rows={2}
            placeholder="Custom Kling motion prompt..."
            value={customPrompt || ''}
            onChange={(e) => onCustomPromptChange(e.target.value)}
          />
        </div>
      )}

      {animation?.videoUrl ? (
        <video src={animation.videoUrl} controls loop
          className="w-full aspect-[9/16] object-cover rounded-lg mb-3" />
      ) : broll?.image ? (
        <div className="relative">
          <img src={broll.image} alt="" 
            className={`w-full aspect-[9/16] object-cover rounded-lg mb-3 ${isAnimating ? 'opacity-50' : ''}`} />
          {isAnimating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 rounded-lg px-4 py-2">
                <svg className="animate-spin w-6 h-6 mx-auto text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs">Animating...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center mb-3">
          <span className="text-xs text-gray-400">No B-roll</span>
        </div>
      )}

      <button className="btn-secondary w-full text-xs py-2" 
        onClick={onAnimate}
        disabled={!broll || isAnimating}
        title="Kling AI Image-to-Video">
        {animation ? 'Re-animate' : isAnimating ? 'Processing...' : 'Animate'} <span className="opacity-60">(Kling)</span>
      </button>
    </div>
  );
}

export default { ARollCard, BRollCard, AnimationCard };
