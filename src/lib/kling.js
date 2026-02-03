/**
 * Kling AI API Client
 * Image-to-Video generation with JWT authentication
 */

import jwt from 'jsonwebtoken';

const BASE_URL = 'https://api.klingai.com';
const ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const SECRET_KEY = process.env.KLING_SECRET_KEY;

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Generate JWT token for Kling API authentication
 */
function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && tokenExpiry > now + 60) {
    return cachedToken;
  }

  const payload = {
    iss: ACCESS_KEY,
    exp: now + 1800, // 30 minutes
    nbf: now - 5
  };

  cachedToken = jwt.sign(payload, SECRET_KEY, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' }
  });
  tokenExpiry = now + 1800;

  return cachedToken;
}

/**
 * Make authenticated request to Kling API
 */
async function klingRequest(endpoint, method = 'GET', body = null) {
  const token = generateToken();
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Kling API error: ${response.status}`);
  }

  return data;
}

/**
 * Create image-to-video generation task
 */
export async function createVideoTask(options) {
  const {
    imageUrl = null,
    imageBase64 = null,
    prompt,
    negativePrompt = '',
    mode = 'std', // 'std' or 'pro'
    duration = '5', // '5' or '10' seconds
    aspectRatio = '9:16',
    cfgScale = 0.5
  } = options;

  const body = {
    model_name: 'kling-v2-master',
    mode,
    duration,
    aspect_ratio: aspectRatio,
    prompt,
    negative_prompt: negativePrompt,
    cfg_scale: cfgScale
  };

  // Add image (URL or base64)
  if (imageUrl) {
    body.image = imageUrl;
  } else if (imageBase64) {
    body.image = imageBase64;
  }

  const response = await klingRequest('/v1/videos/image2video', 'POST', body);
  
  return {
    taskId: response.data?.task_id,
    status: response.data?.task_status,
    message: response.message
  };
}

/**
 * Query task status
 */
export async function getTaskStatus(taskId) {
  const response = await klingRequest(`/v1/videos/image2video/${taskId}`);
  
  return {
    taskId: response.data?.task_id,
    status: response.data?.task_status, // 'submitted', 'processing', 'succeed', 'failed'
    videos: response.data?.task_result?.videos || [],
    createdAt: response.data?.created_at,
    updatedAt: response.data?.updated_at
  };
}

/**
 * Wait for task completion with polling
 */
export async function waitForCompletion(taskId, maxWaitMs = 300000, pollIntervalMs = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getTaskStatus(taskId);

    if (status.status === 'succeed') {
      return {
        success: true,
        videos: status.videos
      };
    }

    if (status.status === 'failed') {
      return {
        success: false,
        error: 'Video generation failed'
      };
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  return {
    success: false,
    error: 'Timeout waiting for video generation'
  };
}

/**
 * Generate video from image (convenience function)
 */
export async function generateVideo(imageBase64, prompt, options = {}) {
  try {
    const task = await createVideoTask({
      imageBase64,
      prompt,
      ...options
    });

    if (!task.taskId) {
      return { success: false, error: 'Failed to create task' };
    }

    // Return task ID for async processing
    // Client can poll for status
    return {
      success: true,
      taskId: task.taskId,
      status: task.status
    };
  } catch (error) {
    console.error('Kling video generation error:', error);
    return { success: false, error: error.message };
  }
}

export default { 
  createVideoTask, 
  getTaskStatus, 
  waitForCompletion, 
  generateVideo 
};
