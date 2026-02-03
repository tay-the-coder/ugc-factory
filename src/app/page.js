'use client';

import { useState, useRef, useEffect } from 'react';
import { useProject, useAdvancedMode } from '../lib/useProject.js';
import { 
  AdvancedPanel, 
  ModelSelector, 
  AspectRatioSelector, 
  SliderParam,
  DurationSelector,
  PromptEditor,
  UploadOverride,
  ModeToggle,
  NegativePrompt,
  QuickPresets
} from '../components/AdvancedPanel.js';
import { ARollCard, BRollCard, AnimationCard } from '../components/SegmentCard.js';
import { AIField } from '../components/AIField.js';

// Updated steps - merged Product & Research into one
const STEPS = [
  { id: 1, name: 'Product', description: 'Upload & research' },
  { id: 2, name: 'Character', description: 'Create your UGC creator' },
  { id: 3, name: 'Script', description: 'Write or generate script' },
  { id: 4, name: 'A-Roll', description: 'Generate talking head' },
  { id: 5, name: 'B-Roll', description: 'Create supporting scenes' },
  { id: 6, name: 'Animation', description: 'Bring B-roll to life' },
  { id: 7, name: 'Voice', description: 'Generate voiceover' },
  { id: 8, name: 'Export', description: 'Download your assets' }
];

// Product type mapping from category
const CATEGORY_TO_TYPE = {
  'skincare': 'usable',
  'beauty': 'usable',
  'cosmetic': 'usable',
  'makeup': 'usable',
  'wellness': 'usable',
  'health': 'usable',
  'supplement': 'holdable',
  'clothing': 'wearable',
  'fashion': 'wearable',
  'apparel': 'wearable',
  'accessory': 'wearable',
  'jewelry': 'wearable',
  'tech': 'holdable',
  'gadget': 'holdable',
  'electronic': 'holdable',
  'home': 'holdable',
  'kitchen': 'holdable',
  'fitness': 'holdable',
  'pet': 'holdable',
  'default': 'holdable'
};

function detectProductType(category) {
  if (!category) return 'holdable';
  const cat = category.toLowerCase();
  for (const [key, type] of Object.entries(CATEGORY_TO_TYPE)) {
    if (cat.includes(key)) return type;
  }
  return 'holdable';
}

// Dev mode toggle - shows model info for every generation
const DEV_MODE = true;

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const { 
    project, 
    setProject, 
    isLoaded,
    advancedSettings,
    setAdvancedSettings,
    projectList,
    createProject,
    switchProject,
    deleteProject,
    duplicateProject,
    renameProject,
    resetProject
  } = useProject();
  
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [devLogs, setDevLogs] = useState([]);
  
  // Global dev log function
  const addDevLog = (log) => {
    if (DEV_MODE) {
      setDevLogs(prev => [...prev.slice(-20), { ...log, timestamp: new Date().toISOString() }]);
    }
  };

  // Show loading state until project is loaded from localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-lg">U</span>
          </div>
          <p className="text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen if no project exists
  if (!project || !project.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">U</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-3">UGC Factory</h1>
          <p className="text-gray-600 mb-8">
            Create scroll-stopping UGC ads with AI. Upload your product, add your research, and let AI generate hooks, scripts, and visuals.
          </p>
          <button 
            onClick={() => {
              const name = prompt('Project name:', 'My First Project');
              if (name) {
                createProject(name);
              }
            }}
            className="px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors text-lg"
          >
            + Create Your First Project
          </button>
          <p className="text-xs text-gray-400 mt-6">
            All data is stored locally in your browser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-black">UGC Factory</h1>
              <p className="text-sm text-gray-500">AI-powered ad creation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Project name (editable) */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{project.name}</span>
              <button 
                onClick={() => {
                  const name = prompt('Project name:', project.name);
                  if (name) renameProject(name);
                }}
                className="text-gray-400 hover:text-black"
              >
                ✏️
              </button>
            </div>
            
            <button 
              className="btn-ghost"
              onClick={() => setShowProjectManager(!showProjectManager)}
            >
              Projects
            </button>
            <button className="btn-ghost">Templates</button>
            <button 
              className="btn-primary"
              onClick={() => {
                const name = prompt('New project name:', 'Untitled Project');
                if (name) {
                  createProject(name);
                  setCurrentStep(1);
                }
              }}
            >
              New Project
            </button>
          </div>
        </div>
        
        {/* Project Manager Dropdown */}
        {showProjectManager && (
          <div className="absolute right-6 top-16 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-black">Your Projects</h3>
              <p className="text-xs text-gray-500 mt-1">{projectList.length} projects</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {projectList.map(p => (
                <div 
                  key={p.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group ${
                    p.id === project.id ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => {
                    switchProject(p.id);
                    setShowProjectManager(false);
                  }}
                >
                  <div>
                    <div className="font-medium text-sm text-black flex items-center gap-2">
                      {p.name}
                      {p.id === project.id && <span className="text-xs text-green-500">●</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button 
                      className="p-1 hover:bg-gray-200 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateProject(p.id);
                      }}
                      title="Duplicate"
                    >
                      📋
                    </button>
                    <button 
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${p.name}"?`)) {
                          deleteProject(p.id);
                          setShowProjectManager(false);
                        }
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
              <div 
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <button
                  onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all z-10 bg-white
                    ${step.id === currentStep ? 'bg-black text-white ring-4 ring-gray-100' : ''}
                    ${step.id < currentStep ? 'bg-green-500 text-white' : ''}
                    ${step.id > currentStep ? 'bg-gray-100 text-gray-400' : ''}
                    ${step.id <= currentStep ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                  `}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </button>
                <span className={`
                  mt-2 text-xs font-medium
                  ${step.id === currentStep ? 'text-black' : 'text-gray-400'}
                `}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="animate-slide-up">
          {currentStep === 1 && (
            <ProductSetupStep 
              project={project} 
              setProject={setProject}
              onNext={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 2 && (
            <CharacterStep 
              project={project} 
              setProject={setProject}
              advancedSettings={advancedSettings.character}
              setAdvancedSettings={(s) => setAdvancedSettings('character', s)}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <ScriptStep 
              project={project} 
              setProject={setProject}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 4 && (
            <ARollStep 
              project={project} 
              setProject={setProject}
              advancedSettings={advancedSettings.aroll}
              setAdvancedSettings={(s) => setAdvancedSettings('aroll', s)}
              onNext={() => setCurrentStep(5)}
              onBack={() => setCurrentStep(3)}
            />
          )}
          {currentStep === 5 && (
            <BRollStep 
              project={project} 
              setProject={setProject}
              advancedSettings={advancedSettings.broll}
              setAdvancedSettings={(s) => setAdvancedSettings('broll', s)}
              onNext={() => setCurrentStep(6)}
              onBack={() => setCurrentStep(4)}
            />
          )}
          {currentStep === 6 && (
            <AnimationStep 
              project={project} 
              setProject={setProject}
              advancedSettings={advancedSettings.animation}
              setAdvancedSettings={(s) => setAdvancedSettings('animation', s)}
              onNext={() => setCurrentStep(7)}
              onBack={() => setCurrentStep(5)}
            />
          )}
          {currentStep === 7 && (
            <VoiceStep 
              project={project} 
              setProject={setProject}
              advancedSettings={advancedSettings.voice}
              setAdvancedSettings={(s) => setAdvancedSettings('voice', s)}
              onNext={() => setCurrentStep(8)}
              onBack={() => setCurrentStep(6)}
            />
          )}
          {currentStep === 8 && (
            <ExportStep 
              project={project}
              onBack={() => setCurrentStep(7)}
              onReset={() => {
                if (confirm('Start a new project? Your current project will be saved.')) {
                  createProject();
                  setCurrentStep(1);
                }
              }}
            />
          )}
        </div>
      </div>
      
      {/* Auto-save indicator */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-400">
        Auto-saved • {new Date(project.updatedAt).toLocaleTimeString()}
      </div>
      
      {/* Dev Mode Console */}
      {DEV_MODE && (
        <DevConsole logs={devLogs} onClear={() => setDevLogs([])} />
      )}
    </div>
  );
}

// ============================================================================
// DEV CONSOLE COMPONENT
// ============================================================================
function DevConsole({ logs, onClear }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-10 h-10 bg-gray-900 text-green-400 rounded-full flex items-center justify-center font-mono text-sm hover:bg-gray-800 z-50"
        title="Dev Console"
      >
        {isOpen ? '×' : '{ }'}
      </button>
      
      {/* Console Panel */}
      {isOpen && (
        <div className={`fixed right-4 bg-gray-900 text-white rounded-lg shadow-2xl z-40 font-mono text-xs overflow-hidden transition-all ${
          isMinimized ? 'bottom-16 w-80 h-12' : 'bottom-16 w-96 h-80'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-green-400">●</span>
              <span className="text-gray-300">Dev Console</span>
              <span className="text-gray-500">({logs.length})</span>
            </div>
            <div className="flex gap-2">
              <button onClick={onClear} className="text-gray-500 hover:text-white">Clear</button>
              <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-500 hover:text-white">
                {isMinimized ? '▲' : '▼'}
              </button>
            </div>
          </div>
          
          {/* Logs */}
          {!isMinimized && (
            <div className="p-3 h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No logs yet. Generate something to see model info.
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className={`p-2 rounded ${log.success ? 'bg-gray-800' : 'bg-red-900/30'}`}>
                      <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <span>{log.type === 'research' ? '🔬' : '✨'}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={log.success ? 'text-green-400' : 'text-red-400'}>
                          {log.success ? 'OK' : 'FAIL'}
                        </span>
                      </div>
                      {log.models && (
                        <div className="text-cyan-400">
                          {log.models.map((m, j) => (
                            <div key={j}>→ {m}</div>
                          ))}
                        </div>
                      )}
                      {log.model && (
                        <div className="text-cyan-400">→ {log.model}</div>
                      )}
                      {log.error && (
                        <div className="text-red-400">{log.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ============================================================================
// STEP 1: Product Setup (Merged Product + Research)
// ============================================================================
function ProductSetupStep({ project, setProject, onNext }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  
  // Product state
  const [productImages, setProductImages] = useState(project.product?.images || []);
  const [productName, setProductName] = useState(project.product?.name || '');
  const [productDescription, setProductDescription] = useState(project.product?.description || '');
  const [productCategory, setProductCategory] = useState(project.product?.category || 'holdable');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(project.product?.analysis || null);
  
  // Supporting documents
  const [supportingDocs, setSupportingDocs] = useState(project.product?.supportingDocs || []);
  
  // Research state
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [targetAudience, setTargetAudience] = useState(project.targetAudience || '');
  const [researching, setResearching] = useState(false);
  const [research, setResearch] = useState(project.research || null);
  const [researchProgress, setResearchProgress] = useState('');
  
  // Dev mode - research steps tracking
  const [researchSteps, setResearchSteps] = useState([]);
  const [devLogs, setDevLogs] = useState([]);
  
  // Advanced mode
  const [advancedMode, toggleAdvanced] = useAdvancedMode('product');

  const MAX_IMAGES = 10;
  const MAX_DOCS = 10;

  // Auto-save changes to project
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setProject(prev => ({
        ...prev,
        product: {
          ...prev.product,
          name: productName,
          description: productDescription,
          category: productCategory,
          images: productImages,
          image: productImages[0] || null,
          analysis: analysisResult,
          supportingDocs: supportingDocs
        },
        targetAudience,
        research
      }));
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [productImages, productName, productDescription, productCategory, targetAudience, analysisResult, supportingDocs, research]);

  // Image handling
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    processImages(files);
  };

  const processImages = (files) => {
    const remaining = MAX_IMAGES - productImages.length;
    const toProcess = files.slice(0, remaining);
    
    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImages(prev => [...prev, e.target.result].slice(0, MAX_IMAGES));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setAnalysisResult(null);
  };

  // Document handling
  const processDocuments = (files) => {
    const remaining = MAX_DOCS - supportingDocs.length;
    const toProcess = files.slice(0, remaining);
    
    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSupportingDocs(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result
        }].slice(0, MAX_DOCS));
      };
      // Read as text for text files, base64 for others
      if (file.type.includes('text') || file.type.includes('json')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const removeDoc = (index) => {
    setSupportingDocs(prev => prev.filter((_, i) => i !== index));
  };

  // Product analysis
  const analyzeProducts = async () => {
    if (productImages.length === 0) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: productImages,
          context: { brandName: productName }
        })
      });
      const data = await res.json();
      
      // Dev log
      setDevLogs(prev => [...prev, {
        type: 'product-analysis',
        timestamp: new Date().toISOString(),
        model: 'gpt-5.2 (OpenAI Vision)',
        success: data.success,
        error: data.error
      }]);
      if (data.success && data.product) {
        setAnalysisResult(data.product);
        const p = data.product;
        
        // Auto-fill product name
        if (p.name && !productName) setProductName(p.name);
        
        // Auto-detect product type from category
        if (p.category) {
          const detectedType = detectProductType(p.category);
          setProductCategory(detectedType);
        }
        
        // Build description from analysis
        const descParts = [];
        if (p.benefits?.primary) descParts.push(p.benefits.primary);
        if (p.functionalFeatures?.length) descParts.push(p.functionalFeatures.join('. '));
        if (p.positioning?.usp) descParts.push(`USP: ${p.positioning.usp}`);
        if (descParts.length && !productDescription) setProductDescription(descParts.join('. '));
        
        // Build target audience from demographics
        const demoParts = [];
        if (p.targetDemographic?.ageRange) demoParts.push(`Age ${p.targetDemographic.ageRange}`);
        if (p.targetDemographic?.gender && p.targetDemographic.gender !== 'all') {
          demoParts.push(p.targetDemographic.gender);
        }
        if (p.targetDemographic?.lifestyle?.length) {
          demoParts.push(p.targetDemographic.lifestyle.join(', '));
        }
        if (p.targetDemographic?.painPoints?.length) {
          demoParts.push(`who struggle with: ${p.targetDemographic.painPoints.join(', ')}`);
        }
        if (demoParts.length && !targetAudience) setTargetAudience(demoParts.join(' • '));
      } else {
        console.error('Analysis failed:', data.error);
        setAnalysisResult({ error: data.error || 'Analysis failed' });
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysisResult({ error: err.message });
    }
    setAnalyzing(false);
  };

  // Research Synthesis with Opus 4.5
  const runDeepResearch = async () => {
    setResearching(true);
    setResearchProgress('Analyzing product and documents with Opus 4.5...');

    try {
      const res = await fetch('/api/market-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName,
          productAnalysis: analysisResult,
          targetAudience: targetAudience,
          supportingDocs: supportingDocs.map(d => ({ name: d.name, content: d.data })),
        })
      });

      const data = await res.json();

      if (data.success && data.research) {
        // Log to dev console
        setDevLogs(prev => [...prev, {
          type: 'research',
          timestamp: new Date().toISOString(),
          model: data.research.model || 'claude-opus',
          success: true
        }]);
        
        setResearch(data.research);
        
        // Auto-fill target audience from research if available
        if (data.research.customerAvatar) {
          const av = data.research.customerAvatar;
          const audienceFromResearch = [];
          if (av.demographics?.age) audienceFromResearch.push(av.demographics.age);
          if (av.demographics?.location) audienceFromResearch.push(av.demographics.location);
          if (av.psychographics?.frustrations?.length) {
            audienceFromResearch.push(`who struggle with: ${av.psychographics.frustrations.slice(0, 2).join(', ')}`);
          }
          if (audienceFromResearch.length && !targetAudience) {
            setTargetAudience(audienceFromResearch.join(' • '));
          }
        }
        
        setResearchProgress('Research complete!');
      } else {
        // Mark all steps as failed
        steps.forEach(s => updateStep(s.id, { status: 'failed', error: data.error }));
        setResearchProgress(`Research failed: ${data.error}`);
        setDevLogs(prev => [...prev, {
          type: 'research',
          timestamp: new Date().toISOString(),
          error: data.error,
          success: false
        }]);
      }
    } catch (error) {
      console.error('Research error:', error);
      setResearchProgress(`Error: ${error.message}`);
      setDevLogs(prev => [...prev, {
        type: 'research',
        timestamp: new Date().toISOString(),
        error: error.message,
        success: false
      }]);
    }

    setResearching(false);
  };

  // Auto-fill everything with one click
  const [autoFilling, setAutoFilling] = useState(false);
  const autoFillAll = async () => {
    if (!productImages.length) {
      alert('Please upload at least one product image first');
      return;
    }
    
    setAutoFilling(true);
    
    try {
      // Step 1: Analyze product if not done
      if (!analysisResult) {
        setResearchProgress('Analyzing product with GPT 5.2...');
        await analyzeProducts();
      }
      
      // Step 2: Run research synthesis
      setResearchProgress('Synthesizing research with Opus 4.5...');
      await runDeepResearch();
      
      setResearchProgress('Auto-fill complete!');
    } catch (error) {
      console.error('Auto-fill error:', error);
      setResearchProgress(`Error: ${error.message}`);
    }
    
    setAutoFilling(false);
  };

  // Quick generate audience
  const quickGenerateAudience = async () => {
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'audience',
          context: {
            productName,
            productDescription,
            productInfo: analysisResult ? JSON.stringify(analysisResult) : ''
          }
        })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setTargetAudience(data.text);
      }
    } catch (err) {
      console.error('Failed to generate audience:', err);
    }
  };

  const handleSubmit = () => {
    setProject(prev => ({
      ...prev,
      product: {
        name: productName,
        description: productDescription,
        category: productCategory,
        images: productImages,
        image: productImages[0],
        analysis: analysisResult,
        supportingDocs: supportingDocs
      },
      targetAudience,
      research
    }));
    onNext();
  };

  const isValid = productImages.length > 0 && productName && (deepResearchEnabled ? research : targetAudience);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-black mb-2">Product Setup</h2>
        <p className="text-gray-500 mb-6">Upload your product and define your target audience</p>
        
        {/* Auto-fill Everything Button */}
        {productImages.length > 0 && (
          <button
            onClick={autoFillAll}
            disabled={autoFilling || analyzing || researching}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              autoFilling || analyzing || researching
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl'
            }`}
          >
            {autoFilling ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {researchProgress || 'Auto-filling...'}
              </span>
            ) : (
              <span className="flex flex-col items-center">
                <span>⚡ Auto-fill Everything</span>
                <span className="text-xs opacity-75 font-normal">GPT 5.2 + Opus 4.5</span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Product Images Upload */}
      <div className="card mb-6">
        <h3 className="font-semibold text-black mb-4">Product Images</h3>
        <div 
          className={`upload-zone ${dragActive ? 'upload-zone-active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => productImages.length < MAX_IMAGES && fileInputRef.current?.click()}
        >
          {productImages.length > 0 ? (
            <div className="w-full">
              <div className="grid grid-cols-5 gap-3 mb-4">
                {productImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                    <button 
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 text-sm font-bold"
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                    >×</button>
                  </div>
                ))}
                {productImages.length < MAX_IMAGES && (
                  <div 
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    <span className="text-2xl text-gray-400">+</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 text-center">{productImages.length}/{MAX_IMAGES} images</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Drop up to 10 product images here</p>
              <p className="text-gray-400 text-sm mt-1">or click to browse</p>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files?.length && processImages(Array.from(e.target.files))} />
        </div>

        {/* AI Analysis Button */}
        {productImages.length > 0 && (
          <div className="mt-4">
            <button
              onClick={analyzeProducts}
              disabled={analyzing}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                analyzing 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
              }`}
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing with AI...
                </span>
              ) : (
                <span className="flex flex-col items-center">
                  <span>✨ Analyze Product with AI</span>
                  <span className="text-xs opacity-75 font-normal">GPT 5.2 Vision</span>
                </span>
              )}
            </button>
            
            {analysisResult && !analysisResult.error && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                  <span>✓</span> Analysis Complete
                </div>
                <div className="text-sm text-green-600">
                  Detected: <strong>{analysisResult.name}</strong> ({analysisResult.category})
                  {analysisResult.positioning?.usp && (
                    <span className="block mt-1">USP: {analysisResult.positioning.usp}</span>
                  )}
                </div>
              </div>
            )}
            
            {analysisResult?.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="text-sm text-red-600">{analysisResult.error}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="card mb-6">
        <h3 className="font-semibold text-black mb-4">Product Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
            <input type="text" className="input" placeholder="e.g., Premium Heated Pad"
              value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type 
              {analysisResult?.category && (
                <span className="text-xs text-green-600 ml-2">(auto-detected from analysis)</span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'holdable', label: 'Holdable', desc: 'Bottles, devices, tools' },
                { id: 'wearable', label: 'Wearable', desc: 'Clothing, accessories' },
                { id: 'usable', label: 'Usable', desc: 'Applied or used on body' }
              ].map(cat => (
                <button key={cat.id}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    productCategory === cat.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setProductCategory(cat.id)}
                >
                  <div className="font-medium text-black">{cat.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <AIField
            label="Product Description (optional)"
            value={productDescription}
            onChange={setProductDescription}
            placeholder="Key features, benefits..."
            rows={3}
            promptType="description"
            context={{
              productName: productName,
              productInfo: analysisResult ? JSON.stringify(analysisResult) : ''
            }}
          />
        </div>
      </div>

      {/* Supporting Documents - with drag & drop */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-black">📁 Research Documents</h3>
          <span className="text-xs text-gray-500">{supportingDocs.length}/{MAX_DOCS} files</span>
        </div>
        
        <div 
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const files = Array.from(e.dataTransfer.files).filter(f => 
              f.type.includes('text') || f.name.endsWith('.txt') || f.name.endsWith('.md') || 
              f.name.endsWith('.json') || f.name.endsWith('.csv') || f.name.endsWith('.pdf')
            );
            if (files.length) processDocuments(files);
          }}
          onClick={() => docInputRef.current?.click()}
        >
          {supportingDocs.length > 0 ? (
            <div>
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {supportingDocs.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                    <span>📄</span>
                    <span className="max-w-32 truncate">{doc.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeDoc(idx); }}
                      className="text-gray-400 hover:text-red-500"
                    >×</button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">Drop more files or click to add</p>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">📄</div>
              <p className="text-gray-600 font-medium">Drop your Perplexity research, competitor analysis, or customer feedback</p>
              <p className="text-gray-400 text-sm mt-1">Supports .txt, .md, .json, .csv, .pdf</p>
            </>
          )}
        </div>
        <input 
          ref={docInputRef} 
          type="file" 
          accept=".txt,.pdf,.doc,.docx,.json,.csv,.md" 
          multiple 
          className="hidden"
          onChange={(e) => e.target.files?.length && processDocuments(Array.from(e.target.files))} 
        />
      </div>

      {/* Research Synthesis */}
      <div className="card mb-6">
        <div className="mb-4">
          <h3 className="font-semibold text-black">🧠 Research Synthesis</h3>
          <p className="text-sm text-gray-500 mt-1">
            Opus 4.5 analyzes your product + uploaded docs to create customer insights, hooks, and angles
          </p>
        </div>

        {!research ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              {supportingDocs.length > 0 ? (
                <>
                  <strong>{supportingDocs.length} document{supportingDocs.length > 1 ? 's' : ''} ready</strong> - Click below to synthesize your research with Claude Opus 4.5
                </>
              ) : (
                <>
                  <strong>Tip:</strong> Upload your Perplexity research, competitor analysis, or customer feedback above for better results
                </>
              )}
            </p>
            
            {/* Target Audience Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Target Audience (optional)</label>
                <button 
                  onClick={quickGenerateAudience}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  title="Uses Sonnet 4.5"
                >
                  ✨ Quick Generate <span className="opacity-60">(Sonnet)</span>
                </button>
              </div>
              <textarea 
                className="textarea text-sm" 
                rows={2}
                placeholder="e.g., Women 25-45 who struggle with back pain, work from home..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
            
            {researching && (
              <div className="bg-gray-900 rounded-xl p-4 text-white font-mono text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <span className="animate-pulse">●</span>
                  <span>Synthesizing with Opus 4.5...</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">{researchProgress}</div>
              </div>
            )}
            
            <button 
              onClick={runDeepResearch}
              disabled={researching || !productName}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                researching || !productName
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
              }`}
            >
              {researching ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Synthesizing...
                </span>
              ) : (
                <span className="flex flex-col items-center">
                  <span>🧠 Synthesize Research</span>
                  <span className="text-xs opacity-75 font-normal">Opus 4.5</span>
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <span>✓</span> Research Complete
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                <div>
                  <span className="text-gray-500">Pain Points</span>
                  <div className="font-medium text-black">{research.painPoints?.length || 0}</div>
                </div>
                <div>
                  <span className="text-gray-500">Hook Angles</span>
                  <div className="font-medium text-black">{research.hookAngles?.length || 0}</div>
                </div>
                <div>
                  <span className="text-gray-500">Language Patterns</span>
                  <div className="font-medium text-black">{research.languagePatterns?.length || 0}</div>
                </div>
              </div>
            </div>
            
            {/* Show avatar summary */}
            {research.customerAvatar && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium text-black mb-1">Customer Avatar</div>
                <div className="text-gray-600">
                  {research.customerAvatar.name || research.customerAvatar.demographics?.name}, {research.customerAvatar.age || research.customerAvatar.demographics?.age} - {research.customerAvatar.occupation || research.customerAvatar.demographics?.occupation}
                </div>
              </div>
            )}
            
            {/* Target audience from research */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience <span className="text-xs text-green-600">(from research)</span>
              </label>
              <textarea 
                className="textarea text-sm" 
                rows={2}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setResearch(null)}
              className="text-sm text-gray-500 hover:text-black"
            >
              ↻ Re-run research
            </button>
          </div>
        )}
      </div>

      {/* Advanced Options */}
      <AdvancedPanel 
        title="Advanced Options" 
        isOpen={advancedMode} 
        onToggle={toggleAdvanced}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
            <strong>Power user tip:</strong> Upload supporting documents like competitor analysis, 
            product specs, or brand guidelines to improve research quality.
          </div>
        </div>
      </AdvancedPanel>

      {/* Continue Button */}
      <div className="mt-8 flex justify-end">
        <button 
          className={`btn-primary ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isValid} 
          onClick={handleSubmit}
        >
          Continue to Character
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 2: Character Creation
// ============================================================================
function CharacterStep({ project, setProject, advancedSettings, setAdvancedSettings, onNext, onBack }) {
  const [cameraView, setCameraView] = useState(project.character?.cameraView || 'selfie');
  const [productPosition, setProductPosition] = useState(project.character?.productPosition || 'holding');
  const [setting, setSetting] = useState(project.character?.setting || 'bedroom');
  const [generating, setGenerating] = useState(false);
  const [characterPrompt, setCharacterPrompt] = useState(project.character?.prompt || '');
  const [characterImage, setCharacterImage] = useState(project.character?.image || null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [qcInfo, setQcInfo] = useState(null);
  const [advancedMode, toggleAdvanced] = useAdvancedMode('character');
  const [customPrompt, setCustomPrompt] = useState(advancedSettings?.customPrompt || '');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  // Auto-save character progress
  useEffect(() => {
    if (characterImage || characterPrompt) {
      const timeoutId = setTimeout(() => {
        setProject(prev => ({
          ...prev,
          character: {
            cameraView, productPosition, setting,
            prompt: useCustomPrompt ? customPrompt : characterPrompt,
            image: characterImage
          }
        }));
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [characterImage, characterPrompt, cameraView, productPosition, setting, customPrompt, useCustomPrompt]);

  const generateCharacter = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: project.product,
          targetAudience: project.targetAudience,
          cameraView,
          productPosition,
          setting
        })
      });
      const data = await res.json();
      if (data.success) {
        setCharacterPrompt(data.prompt);
        setCustomPrompt(data.prompt);
      }
    } catch (error) {
      console.error('Error generating character:', error);
    }
    setGenerating(false);
  };

  const generateImage = async () => {
    setGeneratingImage(true);
    setQcInfo(null);
    try {
      const promptToUse = useCustomPrompt && customPrompt ? customPrompt : characterPrompt;
      
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          referenceImages: project.product?.image ? [{
            base64: project.product.image.split('base64,')[1],
            mimeType: 'image/png'
          }] : [],
          type: 'character',
          context: { 
            cameraView, 
            productPosition, 
            setting,
            model: advancedSettings?.model || 'gemini-3-pro',
            aspectRatio: advancedSettings?.aspectRatio || '9:16'
          },
          enableQC: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setCharacterImage(data.image);
        setQcInfo({
          score: data.qcScore,
          passed: data.qcPassed,
          attempts: data.attempts,
          issues: data.issues
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
    }
    setGeneratingImage(false);
  };

  const handleUploadOverride = (file) => {
    setCharacterImage(file.dataUrl);
    setQcInfo({ score: 100, passed: true, attempts: 0, issues: [], uploaded: true });
  };

  const handleNext = () => {
    setProject(prev => ({
      ...prev,
      character: {
        cameraView, productPosition, setting,
        prompt: useCustomPrompt ? customPrompt : characterPrompt,
        image: characterImage
      }
    }));
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-black mb-2">Create Your UGC Creator</h2>
        <p className="text-gray-500">Design a character that matches your target audience</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Camera View</label>
            <div className="grid grid-cols-2 gap-3">
              <button className={`p-4 rounded-xl border-2 text-center transition-all ${
                cameraView === 'selfie' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                onClick={() => setCameraView('selfie')}>
                <div className="text-2xl mb-1">🤳</div>
                <div className="font-medium">Selfie</div>
              </button>
              <button className={`p-4 rounded-xl border-2 text-center transition-all ${
                cameraView === 'third-person' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                onClick={() => setCameraView('third-person')}>
                <div className="text-2xl mb-1">📱</div>
                <div className="font-medium">Third Person</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Product Position</label>
            <div className="grid grid-cols-2 gap-3">
              {['holding', 'wearing'].map(pos => (
                <button key={pos} className={`p-4 rounded-xl border-2 text-center transition-all ${
                  productPosition === pos ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                  onClick={() => setProductPosition(pos)}>
                  <div className="font-medium capitalize">{pos}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Setting</label>
            <select className="input" value={setting} onChange={(e) => setSetting(e.target.value)}>
              <option value="bedroom">Bedroom</option>
              <option value="bathroom">Bathroom Mirror</option>
              <option value="living-room">Living Room</option>
              <option value="kitchen">Kitchen</option>
              <option value="office">Home Office</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </div>

          <button className="btn-secondary w-full" onClick={generateCharacter} disabled={generating} title="Opus 4.5">
            {generating ? 'Generating...' : '1. Generate Prompt'} <span className="text-xs opacity-60">(Opus)</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-black mb-4">Character Prompt</h3>
            {characterPrompt ? (
              <textarea className="textarea text-sm" rows={6} value={characterPrompt}
                onChange={(e) => setCharacterPrompt(e.target.value)} />
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-400">
                Generate a prompt first
              </div>
            )}
          </div>

          {characterPrompt && (
            <button className="btn-primary w-full" onClick={generateImage} disabled={generatingImage} title="Gemini Imagen 3">
              {generatingImage ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : <><span>2. Generate Image</span> <span className="text-xs opacity-75 font-normal">(Imagen 3)</span></>}
            </button>
          )}

          {characterImage && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-black">Generated Character</h3>
                {qcInfo && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    qcInfo.passed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {qcInfo.uploaded ? 'Uploaded' : `QC: ${qcInfo.score}%`}
                  </span>
                )}
              </div>
              <img src={characterImage} alt="Character" className="w-full rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Advanced Panel */}
      <AdvancedPanel 
        title="Advanced Options" 
        isOpen={advancedMode} 
        onToggle={toggleAdvanced}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="useCustomPrompt"
              checked={useCustomPrompt}
              onChange={(e) => setUseCustomPrompt(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="useCustomPrompt" className="text-sm text-gray-700">
              Use custom prompt (full control)
            </label>
          </div>
          
          {useCustomPrompt && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Custom Character Prompt</label>
              <textarea
                className="textarea text-sm"
                rows={4}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Write your own character prompt..."
              />
            </div>
          )}
          
          <UploadOverride
            label="Or upload your own character image"
            onUpload={handleUploadOverride}
            accept="image/*"
          />
        </div>
      </AdvancedPanel>

      <div className="mt-8 flex justify-between">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button 
          className={`btn-primary ${!characterImage ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!characterImage}
          onClick={handleNext}
        >
          Continue to Script
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 3: Script Writing
// ============================================================================
function ScriptStep({ project, setProject, onNext, onBack }) {
  const [scriptType, setScriptType] = useState(project.script?.type || 'generated');
  const [script, setScript] = useState(project.script?.content || '');
  const [generating, setGenerating] = useState(false);
  const [segments, setSegments] = useState(project.script?.segments || []);
  const [advancedMode, toggleAdvanced] = useAdvancedMode('script');

  // Auto-save
  useEffect(() => {
    if (script || segments.length > 0) {
      const timeoutId = setTimeout(() => {
        setProject(prev => ({
          ...prev,
          script: { type: scriptType, content: script, segments }
        }));
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [script, segments, scriptType]);

  const generateScript = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'script',
          context: {
            productName: project.product?.name,
            productDescription: project.product?.description,
            targetAudience: project.targetAudience,
            research: project.research,
            productAnalysis: project.product?.analysis
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setScript(data.text);
      }
    } catch (error) {
      console.error('Error generating script:', error);
    }
    setGenerating(false);
  };

  const chunkScript = async () => {
    if (!script) return;
    try {
      const res = await fetch('/api/chunk-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script })
      });
      const data = await res.json();
      if (data.success && data.segments) {
        setSegments(data.segments);
      }
    } catch (error) {
      console.error('Error chunking script:', error);
    }
  };

  const handleNext = () => {
    setProject(prev => ({
      ...prev,
      script: { type: scriptType, content: script, segments }
    }));
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-black mb-2">Write Your Script</h2>
        <p className="text-gray-500">Create or generate the script for your UGC ad</p>
      </div>

      <div className="space-y-6">
        {/* Script Type Toggle */}
        <div className="flex gap-3">
          <button 
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              scriptType === 'generated' ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}
            onClick={() => setScriptType('generated')}
          >
            <div className="font-medium">✨ AI Generated</div>
            <div className="text-sm text-gray-500 mt-1">Based on your product & research</div>
          </button>
          <button 
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              scriptType === 'custom' ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}
            onClick={() => setScriptType('custom')}
          >
            <div className="font-medium">✍️ Write Your Own</div>
            <div className="text-sm text-gray-500 mt-1">Full creative control</div>
          </button>
        </div>

        {/* Generate Button */}
        {scriptType === 'generated' && (
          <button 
            className="btn-primary w-full"
            onClick={generateScript}
            disabled={generating}
            title="Opus 4.5"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Script...
              </span>
            ) : <><span>Generate Script with AI</span> <span className="text-xs opacity-75 font-normal">(Opus 4.5)</span></>}
          </button>
        )}

        {/* Script Editor */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-black">Script</h3>
            {script && (
              <span className="text-xs text-gray-500">{script.split(' ').length} words</span>
            )}
          </div>
          <textarea 
            className="textarea"
            rows={10}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Write your script here... Include [HOOK], [PROBLEM], [SOLUTION], [CTA] sections for best results."
          />
        </div>

        {/* Chunk into Segments */}
        {script && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-black">Script Segments</h3>
                <p className="text-sm text-gray-500 mt-1">Break into A-Roll and B-Roll sections</p>
              </div>
              <button 
                className="btn-secondary text-sm"
                onClick={chunkScript}
                title="Sonnet 4.5"
              >
                Auto-Chunk <span className="text-xs opacity-60">(Sonnet)</span>
              </button>
            </div>
            
            {segments.length > 0 ? (
              <div className="space-y-3">
                {segments.map((seg, i) => (
                  <div key={i} className={`p-3 rounded-lg ${
                    seg.type === 'aroll' ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        seg.type === 'aroll' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
                      }`}>
                        {seg.type === 'aroll' ? 'A-Roll' : 'B-Roll'}
                      </span>
                      <span className="text-xs text-gray-500">{seg.duration || '~5s'}</span>
                    </div>
                    <p className="text-sm">{seg.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Click "Auto-Chunk" to break your script into segments
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button 
          className={`btn-primary ${!script ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!script}
          onClick={handleNext}
        >
          Continue to A-Roll
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 4: A-Roll Generation
// ============================================================================
function ARollStep({ project, setProject, advancedSettings, setAdvancedSettings, onNext, onBack }) {
  const [generating, setGenerating] = useState(false);
  const [arollSegments, setArollSegments] = useState(project.aroll?.segments || []);
  
  const scriptSegments = project.script?.segments?.filter(s => s.type === 'aroll') || [];

  const generateARoll = async (segmentIndex) => {
    setGenerating(true);
    const segment = scriptSegments[segmentIndex];
    
    try {
      const res = await fetch('/api/generate-aroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: segment.text,
          characterImage: project.character?.image,
          characterPrompt: project.character?.prompt,
          model: advancedSettings?.model || 'kling-1.5',
          duration: advancedSettings?.duration || 5
        })
      });
      const data = await res.json();
      if (data.success) {
        setArollSegments(prev => {
          const updated = [...prev];
          updated[segmentIndex] = { ...segment, video: data.video, status: 'complete' };
          return updated;
        });
      }
    } catch (error) {
      console.error('Error generating A-Roll:', error);
    }
    setGenerating(false);
  };

  const handleNext = () => {
    setProject(prev => ({ ...prev, aroll: { segments: arollSegments } }));
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-black mb-2">Generate A-Roll</h2>
        <p className="text-gray-500">Create talking head videos for each script segment</p>
      </div>

      <div className="space-y-4">
        {scriptSegments.length > 0 ? (
          scriptSegments.map((segment, i) => (
            <ARollCard
              key={i}
              segment={segment}
              generated={arollSegments[i]}
              onGenerate={() => generateARoll(i)}
              generating={generating}
            />
          ))
        ) : (
          <div className="card text-center py-8">
            <p className="text-gray-500">No A-Roll segments found. Go back and chunk your script first.</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={handleNext}>
          Continue to B-Roll
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 5: B-Roll Generation
// ============================================================================
function BRollStep({ project, setProject, advancedSettings, setAdvancedSettings, onNext, onBack }) {
  const [generating, setGenerating] = useState(false);
  const [brollSegments, setBrollSegments] = useState(project.broll?.segments || []);
  
  const scriptSegments = project.script?.segments?.filter(s => s.type === 'broll') || [];

  const generateBRoll = async (segmentIndex) => {
    setGenerating(true);
    const segment = scriptSegments[segmentIndex];
    
    try {
      const res = await fetch('/api/generate-broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: segment.text,
          productImage: project.product?.image,
          model: advancedSettings?.model || 'gemini-3-pro',
          aspectRatio: advancedSettings?.aspectRatio || '9:16'
        })
      });
      const data = await res.json();
      if (data.success) {
        setBrollSegments(prev => {
          const updated = [...prev];
          updated[segmentIndex] = { ...segment, image: data.image, status: 'complete' };
          return updated;
        });
      }
    } catch (error) {
      console.error('Error generating B-Roll:', error);
    }
    setGenerating(false);
  };

  const handleNext = () => {
    setProject(prev => ({ ...prev, broll: { segments: brollSegments } }));
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-black mb-2">Generate B-Roll</h2>
        <p className="text-gray-500">Create supporting imagery for your ad</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {scriptSegments.length > 0 ? (
          scriptSegments.map((segment, i) => (
            <BRollCard
              key={i}
              segment={segment}
              generated={brollSegments[i]}
              onGenerate={() => generateBRoll(i)}
              generating={generating}
            />
          ))
        ) : (
          <div className="col-span-2 card text-center py-8">
            <p className="text-gray-500">No B-Roll segments found. Go back and chunk your script first.</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={handleNext}>
          Continue to Animation
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 6: Animation
// ============================================================================
function AnimationStep({ project, setProject, advancedSettings, setAdvancedSettings, onNext, onBack }) {
  const [generating, setGenerating] = useState(false);
  const [animations, setAnimations] = useState(project.animations?.segments || []);
  
  const brollSegments = project.broll?.segments || [];

  const animateBRoll = async (segmentIndex) => {
    setGenerating(true);
    const segment = brollSegments[segmentIndex];
    
    try {
      const res = await fetch('/api/animate-broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: segment.image,
          prompt: segment.text,
          model: advancedSettings?.model || 'kling-1.5',
          duration: advancedSettings?.duration || 5
        })
      });
      const data = await res.json();
      if (data.success) {
        setAnimations(prev => {
          const updated = [...prev];
          updated[segmentIndex] = { ...segment, video: data.video, status: 'complete' };
          return updated;
        });
      }
    } catch (error) {
      console.error('Error animating B-Roll:', error);
    }
    setGenerating(false);
  };

  const handleNext = () => {
    setProject(prev => ({ ...prev, animations: { segments: animations } }));
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-black mb-2">Animate B-Roll</h2>
        <p className="text-gray-500">Bring your B-Roll images to life with motion</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {brollSegments.length > 0 ? (
          brollSegments.map((segment, i) => (
            <AnimationCard
              key={i}
              segment={segment}
              animation={animations[i]}
              onAnimate={() => animateBRoll(i)}
              generating={generating}
            />
          ))
        ) : (
          <div className="col-span-2 card text-center py-8">
            <p className="text-gray-500">No B-Roll images to animate. Generate B-Roll first.</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={handleNext}>
          Continue to Voice
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 7: Voice Generation
// ============================================================================
function VoiceStep({ project, setProject, advancedSettings, setAdvancedSettings, onNext, onBack }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(project.voice?.voiceId || '');
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(project.voice?.audioUrl || null);
  const [loadingVoices, setLoadingVoices] = useState(true);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const res = await fetch('/api/voices');
      const data = await res.json();
      if (data.success) {
        setVoices(data.voices);
        if (!selectedVoice && data.voices.length > 0) {
          setSelectedVoice(data.voices[0].voice_id);
        }
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    }
    setLoadingVoices(false);
  };

  const generateVoice = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: project.script?.content,
          voiceId: selectedVoice,
          stability: advancedSettings?.stability || 0.5,
          similarity: advancedSettings?.similarity || 0.75
        })
      });
      const data = await res.json();
      if (data.success) {
        setAudioUrl(data.audioUrl);
      }
    } catch (error) {
      console.error('Error generating voice:', error);
    }
    setGenerating(false);
  };

  const handleNext = () => {
    setProject(prev => ({
      ...prev,
      voice: { voiceId: selectedVoice, audioUrl }
    }));
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-black mb-2">Generate Voiceover</h2>
        <p className="text-gray-500">Add a professional voice to your ad</p>
      </div>

      <div className="space-y-6">
        {/* Voice Selection */}
        <div className="card">
          <h3 className="font-semibold text-black mb-4">Select Voice</h3>
          {loadingVoices ? (
            <div className="text-center py-8 text-gray-500">Loading voices...</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {voices.slice(0, 9).map(voice => (
                <button
                  key={voice.voice_id}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedVoice === voice.voice_id 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVoice(voice.voice_id)}
                >
                  <div className="font-medium text-sm">{voice.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {voice.labels?.accent || 'Neutral'} • {voice.labels?.gender || 'Unknown'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Script Preview */}
        <div className="card">
          <h3 className="font-semibold text-black mb-4">Script to Voice</h3>
          <div className="p-4 bg-gray-50 rounded-lg text-sm">
            {project.script?.content || 'No script content'}
          </div>
        </div>

        {/* Generate Button */}
        <button 
          className="btn-primary w-full"
          onClick={generateVoice}
          disabled={generating || !selectedVoice}
          title="ElevenLabs TTS"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Voice...
            </span>
          ) : <><span>Generate Voiceover</span> <span className="text-xs opacity-75 font-normal">(ElevenLabs)</span></>}
        </button>

        {/* Audio Preview */}
        {audioUrl && (
          <div className="card">
            <h3 className="font-semibold text-black mb-4">Preview</h3>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={handleNext}>
          Continue to Export
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 8: Export
// ============================================================================
function ExportStep({ project, onBack, onReset }) {
  const [exporting, setExporting] = useState(false);
  
  const assets = [];
  if (project.character?.image) assets.push({ type: 'Character Image', url: project.character.image });
  if (project.aroll?.segments) {
    project.aroll.segments.forEach((s, i) => {
      if (s?.video) assets.push({ type: `A-Roll ${i + 1}`, url: s.video });
    });
  }
  if (project.broll?.segments) {
    project.broll.segments.forEach((s, i) => {
      if (s?.image) assets.push({ type: `B-Roll ${i + 1}`, url: s.image });
    });
  }
  if (project.animations?.segments) {
    project.animations.segments.forEach((s, i) => {
      if (s?.video) assets.push({ type: `Animation ${i + 1}`, url: s.video });
    });
  }
  if (project.voice?.audioUrl) assets.push({ type: 'Voiceover', url: project.voice.audioUrl });

  const downloadAsset = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-3xl font-bold text-black mb-2">Your Ad is Ready!</h2>
        <p className="text-gray-500">Download your assets and create your final ad</p>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-black mb-4">Generated Assets ({assets.length})</h3>
        <div className="space-y-3">
          {assets.map((asset, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{asset.type}</div>
              </div>
              <button 
                className="btn-secondary text-sm"
                onClick={() => downloadAsset(asset.url, `${asset.type.toLowerCase().replace(' ', '-')}.${asset.url.includes('video') ? 'mp4' : 'png'}`)}
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-black mb-4">Script</h3>
        <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
          {project.script?.content || 'No script'}
        </div>
      </div>

      <div className="flex gap-4">
        <button className="btn-secondary flex-1" onClick={onBack}>
          Back to Edit
        </button>
        <button className="btn-primary flex-1" onClick={onReset}>
          Start New Project
        </button>
      </div>
    </div>
  );
}
