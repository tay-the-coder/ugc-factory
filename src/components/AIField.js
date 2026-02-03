/**
 * AIField Component
 * 
 * Wraps any text input/textarea with AI generation and iteration buttons.
 * - Generate: Fresh content with Opus 4.5
 * - Iterate: Refine existing content with Sonnet 4.5
 */

'use client';

import { useState } from 'react';

// Dev mode - shows model info
const DEV_MODE = true;

export function AIField({
  value,
  onChange,
  placeholder,
  rows = 3,
  label,
  fieldType = 'textarea',
  context = {},
  generateEndpoint = '/api/ai-generate',
  promptType = 'general',
  disabled = false,
  showIterateButton = true // Show iterate/regenerate when there's content
}) {
  const [showGuide, setShowGuide] = useState(false);
  const [guideText, setGuideText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState('generate'); // 'generate' or 'iterate'
  const [lastModel, setLastModel] = useState(null); // Track last used model

  const handleGenerate = async (selectedMode = mode) => {
    setGenerating(true);
    setLastModel(null);
    try {
      const res = await fetch(generateEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: promptType,
          mode: selectedMode,
          context,
          guidance: guideText,
          currentValue: value
        })
      });
      
      const data = await res.json();
      if (data.success && (data.text || data.content)) {
        onChange(data.text || data.content);
        setShowGuide(false);
        setGuideText('');
        // Track model used in dev mode
        if (DEV_MODE && data.model) {
          setLastModel({ model: data.model, mode: data.mode, type: promptType });
        }
      } else {
        alert(`Generation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert(`Error: ${error.message}`);
    }
    setGenerating(false);
  };

  const hasContent = value && value.trim().length > 0;

  return (
    <div className="relative">
      {/* Dev Mode: Model Badge */}
      {DEV_MODE && lastModel && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-gray-900 text-cyan-400 rounded font-mono">
            {lastModel.mode === 'iterate' ? '🔄' : '✨'} {lastModel.model}
          </span>
          <span className="text-xs text-gray-400">
            {lastModel.type} • {lastModel.mode}
          </span>
        </div>
      )}
      
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <div className="flex gap-2">
            {/* Iterate button - shown when there's existing content */}
            {showIterateButton && hasContent && (
              <button
                type="button"
                onClick={() => {
                  setMode('iterate');
                  setShowGuide(true);
                }}
                disabled={disabled || generating}
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-all
                  bg-blue-50 text-blue-600 hover:bg-blue-100
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>🔄</span>
                <span>Iterate</span>
              </button>
            )}
            
            {/* Generate button */}
            <button
              type="button"
              onClick={() => {
                setMode('generate');
                setShowGuide(!showGuide);
              }}
              disabled={disabled || generating}
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-all ${
                showGuide && mode === 'generate'
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>✨</span>
              <span>{hasContent ? 'Regenerate' : 'Generate'}</span>
            </button>
          </div>
        </div>
      )}
      
      {/* AI Guide Panel */}
      {showGuide && (
        <div className={`mb-3 p-3 border rounded-xl animate-slide-up ${
          mode === 'iterate' 
            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
            : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'
        }`}>
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg">{mode === 'iterate' ? '🔄' : '💡'}</span>
            <div className="flex-1">
              <p className={`text-xs font-medium mb-1 ${mode === 'iterate' ? 'text-blue-800' : 'text-purple-800'}`}>
                {mode === 'iterate' ? 'What changes do you want?' : 'Guiding points (optional)'}
              </p>
              <p className={`text-xs ${mode === 'iterate' ? 'text-blue-600' : 'text-purple-600'}`}>
                {mode === 'iterate' 
                  ? 'Describe how to improve this content (uses fast Sonnet model)'
                  : 'Add notes to guide the AI, or leave blank for auto-generation (uses Opus model)'}
              </p>
            </div>
          </div>
          
          <textarea
            value={guideText}
            onChange={(e) => setGuideText(e.target.value)}
            placeholder={mode === 'iterate' 
              ? "e.g., Make it more casual, shorter, focus on pain point..."
              : "e.g., Focus on pain relief benefits, mention 30-day guarantee, casual tone..."}
            rows={2}
            className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none ${
              mode === 'iterate' 
                ? 'border-blue-200 placeholder-blue-300 focus:border-blue-400'
                : 'border-purple-200 placeholder-purple-300 focus:border-purple-400'
            }`}
          />
          
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setShowGuide(false);
                setGuideText('');
              }}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleGenerate(mode)}
              disabled={generating}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                generating 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : mode === 'iterate'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {generating ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === 'iterate' ? 'Iterating...' : 'Generating...'}
                </span>
              ) : (
                mode === 'iterate' ? 'Apply Changes' : 'Generate'
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* The actual field */}
      {fieldType === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled || generating}
          className={`textarea ${generating ? 'opacity-50' : ''}`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || generating}
          className={`input ${generating ? 'opacity-50' : ''}`}
        />
      )}
    </div>
  );
}

/**
 * Compact version - inline sparkle button with quick iterate
 */
export function AIFieldCompact({
  value,
  onChange,
  placeholder,
  rows = 2,
  context = {},
  promptType = 'general'
}) {
  const [generating, setGenerating] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideText, setGuideText] = useState('');
  const [mode, setMode] = useState('generate');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: promptType,
          mode,
          context,
          guidance: guideText,
          currentValue: value
        })
      });
      
      const data = await res.json();
      if (data.success && (data.text || data.content)) {
        onChange(data.text || data.content);
        setShowGuide(false);
        setGuideText('');
      }
    } catch (error) {
      console.error('AI generation error:', error);
    }
    setGenerating(false);
  };

  const hasContent = value && value.trim().length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="textarea pr-20"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {hasContent && (
            <button
              type="button"
              onClick={() => {
                setMode('iterate');
                setShowGuide(!showGuide);
              }}
              disabled={generating}
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-600 transition-all"
              title="Iterate on this"
            >
              🔄
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setMode('generate');
              setShowGuide(!showGuide);
            }}
            disabled={generating}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-purple-100 text-gray-500 hover:text-purple-600 transition-all"
            title={hasContent ? 'Regenerate' : 'Generate with AI'}
          >
            {generating ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span>✨</span>
            )}
          </button>
        </div>
      </div>
      
      {showGuide && (
        <div className={`mt-2 p-2 border rounded-lg ${
          mode === 'iterate' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
        }`}>
          <input
            type="text"
            value={guideText}
            onChange={(e) => setGuideText(e.target.value)}
            placeholder={mode === 'iterate' ? "What changes?" : "Guiding points (optional)..."}
            className={`w-full px-2 py-1 text-xs bg-white border rounded mb-2 ${
              mode === 'iterate' ? 'border-blue-200' : 'border-purple-200'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-xs text-gray-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className={`text-xs font-medium ${mode === 'iterate' ? 'text-blue-600' : 'text-purple-600'}`}
            >
              {mode === 'iterate' ? 'Apply' : 'Generate'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIField;
