/**
 * UGC Factory Prompt Engine
 * Smart prompt generation for hyper-realistic AI content
 * 
 * Key principles:
 * - iPhone UGC aesthetic (not studio perfection)
 * - Natural imperfections (pores, asymmetry, flyaways)
 * - Product-focused but authentic
 * - Never mid-sentence breaks for dialogue
 */

import claude from './claude.js';

// ============================================================================
// REALISM MODIFIERS - Anti AI-Gloss techniques
// ============================================================================

const REALISM_MODIFIERS = {
  camera: [
    'shot on iPhone 15 Pro',
    'front-facing camera selfie',
    'natural smartphone camera quality',
    'unedited iPhone photo',
    'casual phone snapshot aesthetic'
  ],
  
  skin: [
    'natural skin texture with visible pores',
    'subtle skin imperfections',
    'real human skin with natural variations',
    'unretouched skin appearance',
    'authentic complexion with minor blemishes'
  ],
  
  lighting: [
    'natural window light',
    'slightly overexposed highlights near windows',
    'warm indoor ambient lighting',
    'soft diffused daylight',
    'real-world mixed lighting conditions'
  ],
  
  imperfections: [
    'flyaway hairs',
    'slight facial asymmetry',
    'natural fabric wrinkles',
    'lived-in environment',
    'authentic unposed moment'
  ],
  
  negative: [
    'no plastic skin',
    'no airbrushed appearance',
    'no artificial glossy look',
    'no 3D render aesthetic',
    'no perfect symmetry',
    'no studio lighting',
    'no over-saturated colors',
    'no AI-generated smoothness'
  ]
};

// ============================================================================
// CHARACTER PROMPT SYSTEM
// ============================================================================

const CHARACTER_SYSTEM_PROMPT = `You are a hyper-realistic UGC image prompt engineer. Your goal is to create prompts that produce images indistinguishable from real iPhone selfies/videos.

CRITICAL RULES:
1. Output must look like someone shot it on their iPhone, NOT like a professional photo
2. Include natural human imperfections (pores, asymmetry, flyaways, minor blemishes)
3. Avoid any "AI gloss" - no plastic skin, no perfect lighting, no over-saturation
4. Characters should look like real people scrolling through TikTok, not models
5. Environment should be lived-in and authentic (bedroom, apartment, bathroom mirror)
6. Products must be clearly visible but held/worn naturally
7. Expression should be neutral or slight natural smile (prevents mouth warping in video)

TECHNICAL SPECS TO INCLUDE:
- iPhone camera quality (front-facing selfie or third-person phone shot)
- 9:16 vertical aspect ratio
- Natural indoor lighting (window light, lamps)
- Zero bokeh, sharp focus across frame
- Real skin texture (visible pores, natural variations)

OUTPUT FORMAT:
Generate a single flowing paragraph prompt. No bullet points. No labels. Just the prompt.`;

/**
 * Build product context string from GPT-4 analysis or basic info
 */
function buildProductContext(product) {
  // If we have enriched GPT-4 analysis data
  if (product.benefits || product.visualFeatures) {
    let context = `PRODUCT: ${product.name}`;
    
    if (product.category) {
      context += `\nCategory: ${product.category}${product.subcategory ? ` > ${product.subcategory}` : ''}`;
    }
    
    if (product.visualFeatures) {
      const vf = product.visualFeatures;
      if (vf.colors?.length) context += `\nColors: ${vf.colors.join(', ')}`;
      if (vf.materials?.length) context += `\nMaterials: ${vf.materials.join(', ')}`;
      if (vf.designStyle) context += `\nDesign: ${vf.designStyle}`;
    }
    
    if (product.functionalFeatures?.length) {
      context += `\nKey Features: ${product.functionalFeatures.join('; ')}`;
    }
    
    if (product.benefits) {
      context += `\nPrimary Benefit: ${product.benefits.primary}`;
      if (product.benefits.secondary?.length) {
        context += `\nSecondary Benefits: ${product.benefits.secondary.join('; ')}`;
      }
      if (product.benefits.emotional?.length) {
        context += `\nEmotional Benefits: ${product.benefits.emotional.join('; ')}`;
      }
    }
    
    if (product.problemSolved) {
      context += `\nProblem Solved: ${product.problemSolved}`;
    }
    
    if (product.positioning?.usp) {
      context += `\nUSP: ${product.positioning.usp}`;
    }
    
    return context;
  }
  
  // Fallback to basic product info
  return `PRODUCT: ${product.name}${product.description ? `\nDescription: ${product.description}` : ''}`;
}

/**
 * Generate character/A-roll image prompt
 * Accepts either basic product info or enriched GPT-4 analysis
 */
export async function generateCharacterPrompt(input) {
  const {
    product,
    targetAudience,
    productPosition, // 'holding' or 'wearing'
    cameraView, // 'selfie' or 'third-person'
    setting = 'home'
  } = input;

  // Build rich product context from GPT-4 analysis if available
  const productContext = buildProductContext(product);

  const userPrompt = `Create a hyper-realistic UGC character prompt for:

${productContext}

TARGET AUDIENCE: ${targetAudience}

FRAMING:
- Camera: ${cameraView === 'selfie' ? 'Front-facing iPhone selfie (subject holding phone)' : 'Third-person shot (filmed by someone else with phone)'}
- Product: Subject is ${productPosition} the product
- Setting: ${setting}

The attached product image must be referenced exactly in the prompt. Generate a prompt that will create an image looking like authentic UGC content from a real person.

Remember: This should look like something you'd see scrolling TikTok - NOT a professional ad.`;

  const result = await claude.generate(CHARACTER_SYSTEM_PROMPT, userPrompt);
  
  if (!result.success) return result;

  // Enhance with anti-gloss modifiers
  let prompt = result.content;
  
  // Ensure key realism elements are present
  if (!prompt.toLowerCase().includes('iphone')) {
    prompt += ' Shot on iPhone 15 Pro, unedited.';
  }
  if (!prompt.toLowerCase().includes('pore') && !prompt.toLowerCase().includes('skin texture')) {
    prompt += ' Natural skin texture with visible pores.';
  }

  return {
    success: true,
    prompt,
    cameraView,
    productPosition
  };
}

// ============================================================================
// SCRIPT CHUNKING SYSTEM
// ============================================================================

const SCRIPT_SYSTEM_PROMPT = `You are a UGC script optimizer. Your job is to take a script and split it into segments that fit within 5-8 seconds of natural speaking time.

CRITICAL RULES:
1. NEVER break mid-sentence. Always split at natural pauses (periods, commas at breath points)
2. Each segment should be speakable in 5-8 seconds at natural pace
3. Rough guide: 12-18 words per segment at conversational speed
4. First segment is the HOOK - make it punchy and attention-grabbing
5. Maintain natural flow between segments
6. Keep the emotional arc intact

OUTPUT FORMAT:
Return a JSON array of segments:
[
  { "segment": 1, "text": "...", "type": "hook" },
  { "segment": 2, "text": "...", "type": "body" },
  ...
]`;

/**
 * Split script into speakable segments
 */
export async function chunkScript(fullScript) {
  const userPrompt = `Split this UGC ad script into 5-8 second segments:

"${fullScript}"

Remember: NEVER break mid-sentence. Natural pauses only.`;

  const result = await claude.generateJSON(SCRIPT_SYSTEM_PROMPT, userPrompt);
  
  if (!result.success) return result;

  return {
    success: true,
    segments: result.data,
    totalSegments: result.data.length
  };
}

// ============================================================================
// VEO A-ROLL PROMPT SYSTEM
// ============================================================================

const VEO_SYSTEM_PROMPT = `You are a Veo 3.1 video prompt specialist. Generate prompts that animate a static character image into realistic talking-head video.

CRITICAL RULES:
1. Start immediately with the subject speaking
2. Include accent specification in dialogue tag
3. Describe natural gestures that match speech
4. For SELFIE: Include subtle arm sway, handheld jitter
5. For THIRD-PERSON: Camera stays stable, subject moves naturally
6. Always end with: "Clean dialogue only. No background music."
7. If product is held, describe natural tilting/showing movements
8. Keep movements smooth and sustained for full clip duration

PROMPT STRUCTURE:
[Subject] speaks with a [accent] and says: "[dialogue]" [gesture description] [camera behavior] Clean dialogue only. No background music.`;

/**
 * Generate Veo A-roll prompts for all segments
 */
export async function generateVeoPrompts(segments, characterContext) {
  const {
    cameraView,
    productPosition,
    accent = 'neutral American'
  } = characterContext;

  const prompts = [];

  for (const segment of segments) {
    const userPrompt = `Generate a Veo 3.1 prompt for this dialogue segment:

DIALOGUE: "${segment.text}"
CAMERA VIEW: ${cameraView}
PRODUCT POSITION: ${productPosition === 'holding' ? 'Subject is holding the product' : 'Subject is wearing the product'}
ACCENT: ${accent}
SEGMENT TYPE: ${segment.type}

Create a single-paragraph prompt starting with the subject speaking.`;

    const result = await claude.generate(VEO_SYSTEM_PROMPT, userPrompt);
    
    if (result.success) {
      prompts.push({
        segment: segment.segment,
        text: segment.text,
        veoPrompt: result.content
      });
    }
  }

  return { success: true, prompts };
}

// ============================================================================
// B-ROLL IMAGE PROMPT SYSTEM
// ============================================================================

const BROLL_SYSTEM_PROMPT = `You are a B-roll scene designer for UGC ads. Create image prompts that PROVE the claims made in the script.

CRITICAL RULES:
1. First B-roll is the SCROLL-STOPPER - most visually arresting moment
2. Each image must visually prove the script claim it's paired with
3. Same hyper-realistic iPhone aesthetic as A-roll
4. Product must be clearly visible and match reference exactly
5. Describe a SINGLE frozen peak-action moment
6. NO ambiguity - be specific and definitive
7. Include natural human elements (hands, partial body)
8. Real-world settings, lived-in environments

OUTPUT: Single paragraph prompt describing the static moment. Include lighting, texture, and composition.`;

/**
 * Generate B-roll image prompts for each segment
 */
export async function generateBrollPrompts(segments, productInfo, characterReference) {
  const prompts = [];

  for (const segment of segments) {
    const userPrompt = `Create a B-roll image prompt for this script segment:

SCRIPT LINE: "${segment.text}"
SEGMENT TYPE: ${segment.type}

PRODUCT: ${productInfo.name}
${productInfo.description || ''}
PRODUCT TYPE: ${productInfo.category} (${productInfo.interaction || 'holdable'})

The image should VISUALLY PROVE the claim in the script line.
Use iPhone UGC aesthetic. Real textures. Natural lighting.
The subject/hands should match the A-roll character reference.`;

    const result = await claude.generate(BROLL_SYSTEM_PROMPT, userPrompt);
    
    if (result.success) {
      prompts.push({
        segment: segment.segment,
        scriptLine: segment.text,
        imagePrompt: result.content,
        needsCharacterRef: true,
        needsProductRef: true
      });
    }
  }

  return { success: true, prompts };
}

// ============================================================================
// KLING ANIMATION PROMPT SYSTEM
// ============================================================================

const KLING_SYSTEM_PROMPT = `You are a Kling video director. Transform static B-roll images into cinematic motion.

CRITICAL FOR IMAGE-TO-VIDEO:
- ONLY describe motion - NEVER redescribe what's in the image
- Kling already sees the image, just tell it what to animate

PROMPTING STYLE:
Write like a film director giving instructions. One flowing paragraph. No labels.

INCLUDE:
1. Subject identification (brief - "the woman", "her hands", "the product")
2. Specific motion with SPEED: "slowly", "briskly", "gracefully"
3. Camera movement with POSITION: "tracking shot from side at 8-foot distance"
4. Motion ENDPOINT: always specify where motion settles (prevents 99% hangs)

RULES:
- Start with the subject's action
- Include motion speed for every movement
- Always specify camera type AND position
- End with where the motion settles: "then settles back into place"
- Keep motion motivated by real physics
- Ensure branding/logos remain stable and legible
- Limit to 3-4 motion elements max

OUTPUT: Single flowing paragraph. No bullet points. Just motion direction.`;

/**
 * Generate Kling animation prompts for B-roll images
 */
export async function generateKlingPrompts(brollPrompts, scriptSegments) {
  const prompts = [];

  for (let i = 0; i < brollPrompts.length; i++) {
    const broll = brollPrompts[i];
    const segment = scriptSegments[i];

    const userPrompt = `Create a Kling animation prompt for this B-roll image:

B-ROLL IMAGE CONTEXT (don't redescribe this, just know what's there): ${broll.imagePrompt}

CORRESPONDING SCRIPT LINE: "${segment.text}"

IMPORTANT: Only describe MOTION. Kling already sees the image.
Include:
- What moves and how fast (use words like "slowly", "briskly")
- Camera movement with position ("tracking from side at 6ft")
- Where the motion settles at the end

The motion should enhance/prove the script claim.
Single flowing paragraph. Motion instructions only.`;

    const result = await claude.generate(KLING_SYSTEM_PROMPT, userPrompt);
    
    if (result.success) {
      prompts.push({
        segment: segment.segment,
        scriptLine: segment.text,
        klingPrompt: result.content
      });
    }
  }

  return { success: true, prompts };
}

// ============================================================================
// QUALITY CONTROL PROMPT SYSTEM
// ============================================================================

const QC_SYSTEM_PROMPT = `You are a hyper-critical quality control analyst for UGC ad images. 
Your job is to identify ANY signs that an image looks AI-generated rather than authentic iPhone UGC.

CHECK FOR:
1. Plastic/waxy skin texture (AI gloss)
2. Overly symmetrical features
3. Distorted hands or fingers
4. Unnatural eye reflections
5. Product visibility and accuracy
6. Logo/text legibility
7. Lighting inconsistencies
8. Over-saturation or HDR look
9. Uncanny valley expressions
10. Background artifacts or distortions

SCORING:
- 90-100: Indistinguishable from real iPhone content
- 70-89: Minor issues, usable with awareness
- 50-69: Noticeable AI artifacts, needs regeneration
- Below 50: Major issues, must regenerate

OUTPUT JSON format with specific issues and targeted prompt fixes.`;

/**
 * Analyze generated image for quality issues
 */
export async function analyzeForQuality(imageBase64, originalPrompt, context) {
  const analysisPrompt = `Analyze this AI-generated image for authenticity issues.

ORIGINAL PROMPT: ${originalPrompt}

CONTEXT: ${context.purpose} (${context.segmentType || 'general'})

Check if this could pass as authentic iPhone UGC content.
Return JSON with score, specific issues, and exact prompt modifications to fix each issue.

{
  "score": 0-100,
  "passed": true/false (threshold: 80),
  "issues": [
    { "issue": "...", "severity": "high/medium/low", "location": "..." }
  ],
  "promptFixes": [
    { "original": "...", "replacement": "...", "reason": "..." }
  ],
  "regenerate": true/false,
  "adjustedPrompt": "full corrected prompt if regeneration needed"
}`;

  const result = await claude.analyzeImageWithClaude(imageBase64, analysisPrompt);
  
  if (!result.success) return result;

  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, analysis: JSON.parse(jsonMatch[0]) };
    }
  } catch (e) {
    // Parsing failed, return raw
  }

  return { success: true, analysis: { raw: result.content } };
}

/**
 * Generate corrected prompt for regeneration (using Sonnet for cost)
 */
export async function generateCorrectedPrompt(originalPrompt, issues, context) {
  const userPrompt = `Fix this image generation prompt based on quality issues found:

ORIGINAL PROMPT:
${originalPrompt}

ISSUES FOUND:
${issues.map(i => `- ${i.issue} (${i.severity})`).join('\n')}

Generate a corrected prompt that addresses ALL issues while maintaining the original intent.
Focus on adding anti-AI-gloss modifiers and natural imperfections.`;

  return await claude.generateSonnet(
    'You are a prompt repair specialist. Fix prompts to produce more realistic, less AI-looking images.',
    userPrompt
  );
}

export default {
  generateCharacterPrompt,
  chunkScript,
  generateVeoPrompts,
  generateBrollPrompts,
  generateKlingPrompts,
  analyzeForQuality,
  generateCorrectedPrompt,
  REALISM_MODIFIERS
};
