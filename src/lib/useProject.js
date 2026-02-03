/**
 * useProject Hook - Project State Management with Persistence
 * 
 * Handles:
 * - LocalStorage persistence (survives refresh)
 * - Project versioning
 * - Auto-save
 * - Multiple project support
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ugc-factory-projects';
const CURRENT_PROJECT_KEY = 'ugc-factory-current';

const initialProjectState = {
  id: null,
  name: 'Untitled Project',
  createdAt: null,
  updatedAt: null,
  product: null,
  targetAudience: '',
  research: null,
  character: null,
  script: '',
  segments: [],
  arollClips: [],
  brollImages: [],
  brollAnimations: [],
  voiceovers: [],
  voiceId: null,
  // Advanced mode settings per step
  advancedSettings: {
    character: {
      model: 'gemini-3-pro',
      aspectRatio: '9:16',
      cfgScale: 0.5,
      customPrompt: null
    },
    aroll: {
      model: 'veo-3.1',
      duration: '8s'
    },
    broll: {
      model: 'gemini-3-pro',
      aspectRatio: '9:16'
    },
    animation: {
      model: 'kling-v2-master',
      mode: 'std',
      duration: '5',
      cfgScale: 0.5
    },
    voice: {
      speed: 1.0,
      stability: 0.5,
      similarityBoost: 0.75
    }
  }
};

/**
 * Generate unique project ID
 */
function generateId() {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load projects from localStorage
 */
function loadProjects() {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to load projects:', e);
    return {};
  }
}

/**
 * Save projects to localStorage
 */
function saveProjects(projects) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects:', e);
  }
}

/**
 * Load current project ID
 */
function loadCurrentProjectId() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CURRENT_PROJECT_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Save current project ID
 */
function saveCurrentProjectId(id) {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(CURRENT_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  } catch (e) {
    console.error('Failed to save current project ID:', e);
  }
}

/**
 * Main hook for project management
 */
export function useProject() {
  const [project, setProjectState] = useState(initialProjectState);
  const [projects, setProjectsState] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const allProjects = loadProjects();
    setProjectsState(allProjects);

    const currentId = loadCurrentProjectId();
    if (currentId && allProjects[currentId]) {
      setProjectState(allProjects[currentId]);
    } else {
      // Create new project if none exists
      const newProject = {
        ...initialProjectState,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProjectState(newProject);
    }
    setIsLoaded(true);
  }, []);

  // Auto-save project changes
  useEffect(() => {
    if (!isLoaded || !project.id) return;

    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString()
    };

    const updatedProjects = {
      ...projects,
      [project.id]: updatedProject
    };

    setProjectsState(updatedProjects);
    saveProjects(updatedProjects);
    saveCurrentProjectId(project.id);
  }, [project, isLoaded]);

  /**
   * Update project state
   */
  const setProject = useCallback((updater) => {
    setProjectState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...next, updatedAt: new Date().toISOString() };
    });
  }, []);

  /**
   * Update advanced settings for a specific step
   */
  const setAdvancedSettings = useCallback((step, settings) => {
    setProjectState(prev => ({
      ...prev,
      advancedSettings: {
        ...prev.advancedSettings,
        [step]: {
          ...prev.advancedSettings[step],
          ...settings
        }
      }
    }));
  }, []);

  /**
   * Create new project
   */
  const createProject = useCallback((name = 'Untitled Project') => {
    const newProject = {
      ...initialProjectState,
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjectState(newProject);
    return newProject;
  }, []);

  /**
   * Switch to existing project
   */
  const switchProject = useCallback((projectId) => {
    if (projects[projectId]) {
      setProjectState(projects[projectId]);
      saveCurrentProjectId(projectId);
    }
  }, [projects]);

  /**
   * Delete project
   */
  const deleteProject = useCallback((projectId) => {
    setProjectsState(prev => {
      const { [projectId]: deleted, ...remaining } = prev;
      
      // Save immediately
      saveProjects(remaining);
      
      // If deleting current project, switch to another or show empty state
      if (project?.id === projectId) {
        const otherIds = Object.keys(remaining);
        if (otherIds.length > 0) {
          // Switch to first remaining project
          const nextProject = remaining[otherIds[0]];
          setProjectState(nextProject);
          saveCurrentProjectId(nextProject.id);
        } else {
          // No projects left - set to null to show empty state
          setProjectState(null);
          saveCurrentProjectId(null);
        }
      }
      
      return remaining;
    });
  }, [project?.id]);

  /**
   * Duplicate project
   */
  const duplicateProject = useCallback((projectId) => {
    const source = projects[projectId];
    if (!source) return null;

    const newProject = {
      ...source,
      id: generateId(),
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedProjects = {
      ...projects,
      [newProject.id]: newProject
    };

    setProjectsState(updatedProjects);
    saveProjects(updatedProjects);
    setProjectState(newProject);

    return newProject;
  }, [projects]);

  /**
   * Rename current project
   */
  const renameProject = useCallback((name) => {
    setProjectState(prev => ({ ...prev, name }));
  }, []);

  /**
   * Reset current project to initial state
   */
  const resetProject = useCallback(() => {
    const resetState = {
      ...initialProjectState,
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: new Date().toISOString()
    };
    setProjectState(resetState);
  }, [project.id, project.name, project.createdAt]);

  /**
   * Get list of all projects (for project manager)
   */
  const projectList = Object.values(projects).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  return {
    // Current project
    project,
    setProject,
    isLoaded,

    // Advanced settings
    advancedSettings: project.advancedSettings,
    setAdvancedSettings,

    // Project management
    projectList,
    createProject,
    switchProject,
    deleteProject,
    duplicateProject,
    renameProject,
    resetProject
  };
}

/**
 * Hook for step-specific advanced mode state
 */
export function useAdvancedMode(stepName) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  
  // Persist advanced mode preference per step
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(`ugc-advanced-${stepName}`);
    if (stored === 'true') setIsAdvanced(true);
  }, [stepName]);

  const toggleAdvanced = useCallback(() => {
    setIsAdvanced(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`ugc-advanced-${stepName}`, String(next));
      }
      return next;
    });
  }, [stepName]);

  return [isAdvanced, toggleAdvanced];
}

export default useProject;
