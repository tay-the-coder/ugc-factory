/**
 * Google Gemini API Client
 * Handles Nano Banana Pro image generation and Veo 3.1 video generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_AI_API_KEY;

let genAI = null;

export function initGemini(apiKey = API_KEY) {
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

/**
 * Generate image with Nano Banana Pro
 * Supports reference images for product placement
 */
export async function generateImage(prompt, options = {}) {
  if (!genAI) initGemini();
  
  const {
    referenceImages = [],
    aspectRatio = '9:16',
    resolution = '2K'
  } = options;

  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-image-preview',
    generationConfig: {
      responseModalities: ['Text', 'Image']
    }
  });

  // Build content parts
  const contentParts = [{ text: prompt }];
  
  // Add reference images if provided
  for (const img of referenceImages) {
    if (img.base64) {
      contentParts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/png',
          data: img.base64
        }
      });
    }
  }

  try {
    const response = await model.generateContent(contentParts);
    const result = {
      success: false,
      images: [],
      text: null
    };

    for (const part of response.response.candidates[0].content.parts) {
      if (part.text) {
        result.text = part.text;
      } else if (part.inlineData) {
        result.images.push({
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        });
        result.success = true;
      }
    }

    return result;
  } catch (error) {
    console.error('Gemini image generation error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate video with Veo 3.1
 */
export async function generateVideo(prompt, options = {}) {
  if (!genAI) initGemini();

  const {
    referenceImage = null,
    duration = '8s',
    aspectRatio = '9:16'
  } = options;

  // Veo 3.1 through Gemini API
  const model = genAI.getGenerativeModel({
    model: 'veo-3.1',
    generationConfig: {
      responseModalities: ['Video']
    }
  });

  const contentParts = [{ text: prompt }];
  
  if (referenceImage?.base64) {
    contentParts.push({
      inlineData: {
        mimeType: referenceImage.mimeType || 'image/png',
        data: referenceImage.base64
      }
    });
  }

  try {
    const response = await model.generateContent(contentParts);
    // Video response handling
    const result = {
      success: false,
      videoUrl: null,
      text: null
    };

    for (const part of response.response.candidates[0].content.parts) {
      if (part.text) {
        result.text = part.text;
      } else if (part.fileData || part.inlineData) {
        result.videoUrl = part.fileData?.fileUri || part.inlineData?.data;
        result.success = true;
      }
    }

    return result;
  } catch (error) {
    console.error('Veo video generation error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyze image for quality control using Gemini vision
 */
export async function analyzeImage(imageBase64, criteria) {
  if (!genAI) initGemini();

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Analyze this AI-generated image for quality issues. Check for:
1. AI "gloss" or plastic-looking skin
2. Distorted hands or fingers
3. Product visibility and accuracy
4. Logo/text legibility
5. Unnatural lighting or shadows
6. Overall realism (does it look like iPhone footage?)

Specific criteria to check: ${criteria}

Respond in JSON format:
{
  "score": 0-100,
  "passed": true/false,
  "issues": ["list of specific issues"],
  "suggestions": ["specific prompt adjustments to fix issues"]
}`;

  try {
    const response = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: 'image/png', data: imageBase64 } }
    ]);

    const text = response.response.text();
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { score: 0, passed: false, issues: ['Could not analyze'], suggestions: [] };
  } catch (error) {
    console.error('Image analysis error:', error);
    return { score: 0, passed: false, issues: [error.message], suggestions: [] };
  }
}

export default { initGemini, generateImage, generateVideo, analyzeImage };
