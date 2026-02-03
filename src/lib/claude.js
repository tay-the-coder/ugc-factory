/**
 * Claude API Client
 * 
 * MODELS:
 * - Opus 4.5: Main brain for all generation (hooks, scripts, prompts)
 * - Sonnet 4.5: Fast iterations and refinements
 * 
 * ALL CALLS ARE TRACKED via centralized API tracker
 */

import Anthropic from '@anthropic-ai/sdk';

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PROJECT_NAME = 'ugc-factory';

// Model configuration
const MODELS = {
  // Primary model - highest quality for initial generation
  primary: 'claude-opus-4-5-20250514',
  
  // Iteration model - fast refinements
  iterate: 'claude-sonnet-4-5-20250514',
  
  // Fallback if needed
  fallback: 'claude-sonnet-4-20250514'
};

// Import centralized tracker
let tracker;
try {
  tracker = require('/root/clawd/lib/api-tracker');
} catch (e) {
  console.warn('API tracker not available, calls will not be logged');
  tracker = { log: () => {} };
}

let client = null;

export function initClaude(apiKey = API_KEY) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  client = new Anthropic({ apiKey });
  return client;
}

/**
 * Log API call to centralized tracker
 */
function logCall(model, usage, task) {
  if (usage && tracker) {
    tracker.log({
      provider: 'anthropic',
      model,
      project: PROJECT_NAME,
      task,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      cacheWriteTokens: usage.cache_creation_input_tokens || 0,
    });
  }
}

/**
 * Generate with Opus 4.5 (primary brain)
 * Use for: hooks, scripts, character prompts, all creative generation
 */
export async function generate(systemPrompt, userPrompt, options = {}) {
  if (!client) initClaude();

  const {
    model = MODELS.primary,
    maxTokens = 4096,
    temperature = 0.7,
    task = 'generate'
  } = options;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    logCall(model, response.usage, task);

    return {
      success: true,
      content: response.content[0].text,
      usage: response.usage,
      model
    };
  } catch (error) {
    console.error('Claude generation error:', error);
    
    // Try fallback model if primary fails
    if (model === MODELS.primary) {
      console.log('Trying fallback model...');
      return generate(systemPrompt, userPrompt, {
        ...options,
        model: MODELS.fallback,
        task: `${task}-fallback`
      });
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Iterate with Sonnet 4.5 (fast refinements)
 * Use for: user-requested changes, regenerations, tweaks
 */
export async function iterate(systemPrompt, userPrompt, options = {}) {
  return generate(systemPrompt, userPrompt, {
    ...options,
    model: MODELS.iterate,
    task: options.task || 'iterate'
  });
}

/**
 * Generate with extended thinking for complex tasks
 */
export async function generateWithThinking(systemPrompt, userPrompt, options = {}) {
  if (!client) initClaude();

  const {
    model = MODELS.primary,
    maxTokens = 8192,
    thinkingBudget = 4096,
    task = 'generate-thinking'
  } = options;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      thinking: {
        type: 'enabled',
        budget_tokens: thinkingBudget
      },
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    logCall(model, response.usage, task);

    // Extract thinking and response
    let thinking = '';
    let content = '';
    
    for (const block of response.content) {
      if (block.type === 'thinking') {
        thinking = block.thinking;
      } else if (block.type === 'text') {
        content = block.text;
      }
    }

    return {
      success: true,
      content,
      thinking,
      usage: response.usage,
      model
    };
  } catch (error) {
    console.error('Claude thinking generation error:', error);
    // Fall back to regular generation
    return generate(systemPrompt, userPrompt, options);
  }
}

/**
 * Analyze image with Claude vision (Opus 4.5)
 */
export async function analyzeImage(imageBase64, analysisPrompt, options = {}) {
  if (!client) initClaude();

  const {
    model = MODELS.primary,
    maxTokens = 2048,
    task = 'image-analysis'
  } = options;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: analysisPrompt
          }
        ]
      }]
    });

    logCall(model, response.usage, task);

    return {
      success: true,
      content: response.content[0].text,
      usage: response.usage,
      model
    };
  } catch (error) {
    console.error('Claude image analysis error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * JSON structured output (Opus 4.5)
 */
export async function generateJSON(systemPrompt, userPrompt, options = {}) {
  const result = await generate(systemPrompt, userPrompt, {
    ...options,
    task: options.task || 'generate-json'
  });
  
  if (!result.success) return result;

  try {
    const jsonMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      result.content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const json = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return { success: true, data: json, raw: result.content, model: result.model };
    }

    return { success: false, error: 'No valid JSON in response', raw: result.content };
  } catch (error) {
    return { success: false, error: `JSON parse error: ${error.message}`, raw: result.content };
  }
}

/**
 * Iterate on JSON output (Sonnet 4.5)
 */
export async function iterateJSON(systemPrompt, userPrompt, options = {}) {
  const result = await iterate(systemPrompt, userPrompt, {
    ...options,
    task: options.task || 'iterate-json'
  });
  
  if (!result.success) return result;

  try {
    const jsonMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      result.content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const json = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return { success: true, data: json, raw: result.content, model: result.model };
    }

    return { success: false, error: 'No valid JSON in response', raw: result.content };
  } catch (error) {
    return { success: false, error: `JSON parse error: ${error.message}`, raw: result.content };
  }
}

// Legacy exports for compatibility
export const generateSonnet = iterate;
export const analyzeImageWithClaude = analyzeImage;

export default { 
  initClaude, 
  generate,
  iterate,
  generateWithThinking,
  analyzeImage,
  generateJSON,
  iterateJSON,
  // Legacy
  generateSonnet,
  analyzeImageWithClaude,
  // Model info
  MODELS
};
