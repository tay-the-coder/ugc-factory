/**
 * OpenAI API Client
 * GPT-5.2 Vision for product image analysis
 * Extracts structured product data to feed into Claude copywriting
 * 
 * Model: gpt-5.2 - Strongest vision model, 2x better accuracy than GPT-4.1
 * - Cuts error rates in half on image understanding
 * - Better spatial/positional awareness
 * - $1.75/M input, $14/M output
 * - 400K context window
 */

import OpenAI from 'openai';

const API_KEY = process.env.OPENAI_API_KEY;

let client = null;

export function initOpenAI(apiKey = API_KEY) {
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  client = new OpenAI({ apiKey });
  return client;
}

// ============================================================================
// PRODUCT ANALYSIS SYSTEM
// ============================================================================

const PRODUCT_ANALYSIS_PROMPT = `You are a product analyst for e-commerce marketing. Analyze this product image and extract detailed information for ad copywriting.

EXTRACT THE FOLLOWING:

1. PRODUCT IDENTIFICATION
- Product name/type (what is this?)
- Category (skincare, tech, fitness, home, fashion, etc.)
- Subcategory if applicable

2. VISUAL FEATURES
- Key visual elements (colors, materials, size indicators)
- Design style (modern, minimalist, premium, playful, etc.)
- Quality indicators visible in image

3. FUNCTIONAL FEATURES
- What does this product do? (list 3-5 features)
- How is it used?
- What problem does it solve?

4. BENEFITS (translate features to user benefits)
- Primary benefit (the main reason someone buys this)
- Secondary benefits (3-5 additional benefits)
- Emotional benefits (how it makes users feel)

5. TARGET DEMOGRAPHIC
- Who would buy this? (age range, gender if relevant)
- Lifestyle indicators
- Pain points this addresses

6. MARKET POSITIONING
- Price point perception (budget/mid/premium/luxury)
- Competitor category (what does this compete with?)
- Unique selling proposition

7. AD COPY HOOKS
- 3 potential hook angles based on what you see
- Key phrases that would resonate

Return ONLY valid JSON, no markdown:
{
  "name": "product name",
  "category": "main category",
  "subcategory": "subcategory or null",
  "visualFeatures": {
    "colors": ["color1", "color2"],
    "materials": ["material1"],
    "designStyle": "style description",
    "qualityIndicators": ["indicator1", "indicator2"]
  },
  "functionalFeatures": ["feature1", "feature2", "feature3"],
  "usage": "how it's used",
  "problemSolved": "core problem it solves",
  "benefits": {
    "primary": "main benefit",
    "secondary": ["benefit1", "benefit2", "benefit3"],
    "emotional": ["feeling1", "feeling2"]
  },
  "targetDemographic": {
    "ageRange": "25-45",
    "gender": "all/female/male",
    "lifestyle": ["lifestyle trait1", "trait2"],
    "painPoints": ["pain1", "pain2"]
  },
  "positioning": {
    "pricePoint": "budget/mid/premium/luxury",
    "competitorCategory": "what it competes with",
    "usp": "unique selling proposition"
  },
  "adHooks": [
    {"angle": "angle name", "hook": "actual hook line"},
    {"angle": "angle name", "hook": "actual hook line"},
    {"angle": "angle name", "hook": "actual hook line"}
  ]
}`;

/**
 * Analyze product image with GPT-4 Vision
 * @param {string} imageBase64 - Base64 encoded image (without data URL prefix)
 * @param {string} mimeType - Image MIME type (default: image/png)
 * @param {object} context - Optional context (brand name, price, etc.)
 */
export async function analyzeProduct(imageBase64, mimeType = 'image/png', context = {}) {
  if (!client) initOpenAI();

  // Build context string if provided
  let contextStr = '';
  if (context.brandName) contextStr += `\nBRAND: ${context.brandName}`;
  if (context.price) contextStr += `\nPRICE: ${context.price}`;
  if (context.productUrl) contextStr += `\nPRODUCT URL: ${context.productUrl}`;
  if (context.additionalInfo) contextStr += `\nADDITIONAL INFO: ${context.additionalInfo}`;

  const prompt = contextStr 
    ? `${PRODUCT_ANALYSIS_PROMPT}\n\nCONTEXT PROVIDED:${contextStr}`
    : PRODUCT_ANALYSIS_PROMPT;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5.2',  // Strongest vision model - 2x better image accuracy
      max_completion_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return { success: false, error: 'Empty response from GPT-4' };
    }

    // Parse JSON from response
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return { 
          success: true, 
          product: data,
          usage: {
            promptTokens: response.usage?.prompt_tokens,
            completionTokens: response.usage?.completion_tokens,
            totalTokens: response.usage?.total_tokens
          }
        };
      }

      return { success: false, error: 'No valid JSON in response', raw: content };
    } catch (parseError) {
      return { success: false, error: `JSON parse error: ${parseError.message}`, raw: content };
    }

  } catch (error) {
    console.error('GPT-4 Vision analysis error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyze multiple product images (different angles)
 */
export async function analyzeProductMultiImage(images, context = {}) {
  if (!client) initOpenAI();

  const imageContent = images.map(img => ({
    type: 'image_url',
    image_url: {
      url: `data:${img.mimeType || 'image/png'};base64,${img.base64}`,
      detail: 'high'
    }
  }));

  let contextStr = '';
  if (context.brandName) contextStr += `\nBRAND: ${context.brandName}`;
  if (context.price) contextStr += `\nPRICE: ${context.price}`;

  const prompt = `${PRODUCT_ANALYSIS_PROMPT}

NOTE: Multiple images of the same product are provided. Analyze all angles to build a complete picture.${contextStr}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5.2',  // Strongest vision model - 2x better image accuracy
      max_completion_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: prompt }
          ]
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return { success: false, error: 'Empty response from GPT-4' };
    }

    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return { 
          success: true, 
          product: data,
          usage: response.usage
        };
      }

      return { success: false, error: 'No valid JSON in response', raw: content };
    } catch (parseError) {
      return { success: false, error: `JSON parse error: ${parseError.message}`, raw: content };
    }

  } catch (error) {
    console.error('GPT-4 Vision multi-image analysis error:', error);
    return { success: false, error: error.message };
  }
}

export default {
  initOpenAI,
  analyzeProduct,
  analyzeProductMultiImage
};
