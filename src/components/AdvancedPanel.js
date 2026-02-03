/**
 * AdvancedPanel Component
 * 
 * Reusable "power-user escape hatch" panel for each step.
 * Collapsible by default, reveals advanced controls when opened.
 */

'use client';

import { useState } from 'react';

/**
 * Main Advanced Panel wrapper
 */
export function AdvancedPanel({ 
  title = 'Advanced Options',
  isOpen,
  onToggle,
  children 
}) {
  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-gray-500 hover:text-black text-sm font-medium transition-colors"
      >
        <span className="text-xs">{isOpen ? '▼' : '▶'}</span>
        <span>⚙️ {title}</span>
      </button>

      {isOpen && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4 animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Model Selector Component
 */
export function ModelSelector({ 
  value, 
  onChange, 
  type = 'image',
  label = 'Model'
}) {
  const models = {
    image: [
      { id: 'gemini-3-pro', name: 'Gemini 3 Pro', desc: 'Best quality (default)' },
      { id: 'gemini-2-flash', name: 'Gemini 2 Flash', desc: 'Faster, good quality' },
      { id: 'dall-e-3', name: 'DALL-E 3', desc: 'OpenAI (coming soon)', disabled: true },
    ],
    video: [
      { id: 'veo-3.1', name: 'Veo 3.1', desc: 'Best for talking heads (default)' },
      { id: 'veo-3.0', name: 'Veo 3.0', desc: 'Faster, slightly lower quality' },
    ],
    animation: [
      { id: 'kling-v2-master', name: 'Kling v2 Master', desc: 'Highest quality (default)' },
      { id: 'kling-v1.5', name: 'Kling v1.5', desc: 'Faster, cheaper' },
    ],
    voice: [
      { id: 'eleven_multilingual_v2', name: 'Multilingual v2', desc: 'Best quality (default)' },
      { id: 'eleven_turbo_v2', name: 'Turbo v2', desc: 'Faster generation' },
    ]
  };

  const options = models[type] || models.image;

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input text-sm"
      >
        {options.map(model => (
          <option 
            key={model.id} 
            value={model.id}
            disabled={model.disabled}
          >
            {model.name} - {model.desc}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Aspect Ratio Selector
 */
export function AspectRatioSelector({ value, onChange }) {
  const ratios = [
    { id: '9:16', name: '9:16', desc: 'Vertical (TikTok/Reels)' },
    { id: '1:1', name: '1:1', desc: 'Square (Instagram)' },
    { id: '16:9', name: '16:9', desc: 'Horizontal (YouTube)' },
    { id: '4:5', name: '4:5', desc: 'Portrait (Instagram Feed)' },
  ];

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">Aspect Ratio</label>
      <div className="grid grid-cols-2 gap-2">
        {ratios.map(ratio => (
          <button
            key={ratio.id}
            onClick={() => onChange(ratio.id)}
            className={`p-2 rounded-lg border text-left text-sm transition-all ${
              value === ratio.id 
                ? 'border-black bg-black text-white' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">{ratio.name}</div>
            <div className={`text-xs ${value === ratio.id ? 'text-gray-300' : 'text-gray-500'}`}>
              {ratio.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Slider Parameter Control
 */
export function SliderParam({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 1, 
  step = 0.1,
  description 
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs text-gray-500">{label}</label>
        <span className="text-xs font-mono text-gray-700">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
      />
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}

/**
 * Duration Selector for video generation
 */
export function DurationSelector({ value, onChange, options = ['5', '8', '10'] }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">Duration</label>
      <div className="flex gap-2">
        {options.map(dur => (
          <button
            key={dur}
            onClick={() => onChange(dur)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              value === dur 
                ? 'border-black bg-black text-white' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {dur}s
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Prompt Editor with syntax highlighting hints
 */
export function PromptEditor({ 
  value, 
  onChange, 
  placeholder = 'Enter your custom prompt...',
  rows = 6,
  label = 'Custom Prompt'
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs text-gray-500">{label}</label>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          {showHelp ? 'Hide tips' : 'Prompt tips'}
        </button>
      </div>
      
      {showHelp && (
        <div className="mb-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
          <strong>Pro tips:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Include "shot on iPhone 15 Pro" for authentic UGC look</li>
            <li>Add "natural skin texture with visible pores" to avoid AI gloss</li>
            <li>Specify lighting: "window light", "ambient indoor lighting"</li>
            <li>Avoid: "perfect", "flawless", "professional" (triggers AI look)</li>
          </ul>
        </div>
      )}
      
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="textarea text-sm font-mono"
      />
    </div>
  );
}

/**
 * Upload Override - lets users upload their own asset instead of generating
 */
export function UploadOverride({ 
  onUpload, 
  accept = 'image/*',
  label = 'Or upload your own'
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpload({
        dataUrl: e.target.result,
        name: file.name,
        type: file.type,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          dragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('upload-override-input')?.click()}
      >
        <input
          id="upload-override-input"
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        <div className="text-gray-500 text-sm">
          <span className="text-lg">📁</span>
          <p className="mt-1">Drop file or click to upload</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Mode Toggle (Standard vs Pro)
 */
export function ModeToggle({ value, onChange, options }) {
  const defaultOptions = [
    { id: 'std', name: 'Standard', desc: 'Faster, cheaper' },
    { id: 'pro', name: 'Pro', desc: 'Higher quality' },
  ];

  const opts = options || defaultOptions;

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">Quality Mode</label>
      <div className="flex gap-2">
        {opts.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-1 p-3 rounded-lg border text-center transition-all ${
              value === opt.id 
                ? 'border-black bg-black text-white' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">{opt.name}</div>
            <div className={`text-xs mt-0.5 ${value === opt.id ? 'text-gray-300' : 'text-gray-500'}`}>
              {opt.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Negative Prompt Input
 */
export function NegativePrompt({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">
        Negative Prompt <span className="text-gray-400">(what to avoid)</span>
      </label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="plastic skin, airbrushed, blurry, distorted hands..."
        rows={2}
        className="textarea text-sm"
      />
    </div>
  );
}

/**
 * Quick Presets
 */
export function QuickPresets({ onSelect, presets }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">Quick Presets</label>
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.settings)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:border-gray-300 transition-all"
          >
            {preset.icon && <span className="mr-1">{preset.icon}</span>}
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AdvancedPanel;
