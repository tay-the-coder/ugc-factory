import { NextResponse } from 'next/server';
import claude from '../../../lib/claude.js';

/**
 * POST /api/ai-generate
 * 
 * AI content generation for all fields
 * - mode: 'generate' (Opus 4.5) or 'iterate' (Sonnet 4.5)
 * - Generate: fresh content creation
 * - Iterate: refine/regenerate existing content
 */

const PROMPT_TEMPLATES = {
  // Product description
  description: {
    system: `You are a product copywriter. Write concise, benefit-focused product descriptions.
Keep it under 100 words. Focus on what makes the product valuable to the customer.
Don't use marketing fluff. Be specific and authentic.`,
    userTemplate: (ctx, guide) => `Write a product description for: ${ctx.productName || 'this product'}

${ctx.productInfo ? `Product info: ${ctx.productInfo}` : ''}
${guide ? `\nGuidance: ${guide}` : ''}

Write 2-3 sentences. Focus on benefits, not features.`
  },

  // Target audience
  audience: {
    system: `You are a marketing strategist. Define target audiences with specificity.
Include demographics, psychographics, and pain points.
Be specific - vague audiences don't convert.`,
    userTemplate: (ctx, guide) => `Define the target audience for: ${ctx.productName || 'this product'}

${ctx.productInfo ? `Product: ${ctx.productInfo}` : ''}
${ctx.productDescription ? `Description: ${ctx.productDescription}` : ''}
${guide ? `\nGuidance: ${guide}` : ''}

Format: Age range • Gender (if relevant) • Key characteristics • Pain points they have
Keep it under 50 words but be specific.`
  },

  // Script writing
  script: {
    system: `You are a UGC ad script writer creating for TikTok/Instagram. 

Write like a real person talking to camera - not an ad. Use:
- Conversational language (contractions, casual tone)
- Specific details from the research (real pain points, real language)
- Natural flow that sounds authentic
- A hook that stops the scroll
- One clear benefit/transformation
- Soft CTA

Target length: 30-60 seconds when read aloud (75-150 words).`,
    userTemplate: (ctx, guide) => `Write a UGC ad script for: ${ctx.productName || 'this product'}

${ctx.productDescription ? `Product: ${ctx.productDescription}` : ''}
${ctx.targetAudience ? `Target audience: ${ctx.targetAudience}` : ''}
${ctx.research ? `Research insights:\n${JSON.stringify(ctx.research, null, 2)}` : ''}
${ctx.productAnalysis ? `Product analysis:\n${JSON.stringify(ctx.productAnalysis, null, 2)}` : ''}
${guide ? `\nAdditional guidance: ${guide}` : ''}

Write a natural, conversational script that sounds like a real person discovered this product and wants to share it. Start with a hook that connects to a real pain point.`
  },

  // Hook line
  hook: {
    system: `You are a hook specialist for UGC ads. Write scroll-stopping first lines.

Hooks should:
- Pattern interrupt or create curiosity
- Speak directly to a specific pain point
- Sound like a real person, not an ad
- Make them NEED to watch more
- Be under 10 words ideally`,
    userTemplate: (ctx, guide) => `Write 5 hook options for a UGC ad about: ${ctx.productName || 'this product'}

${ctx.targetAudience ? `Audience: ${ctx.targetAudience}` : ''}
${ctx.research?.painPoints ? `Pain points from research: ${JSON.stringify(ctx.research.painPoints)}` : ''}
${ctx.research?.languagePatterns ? `Language patterns: ${JSON.stringify(ctx.research.languagePatterns)}` : ''}
${guide ? `\nGuidance: ${guide}` : ''}

Give me 5 different hook angles. Each should feel like something a real person would say to their phone camera.`
  },

  // Character prompt for image generation
  character: {
    system: `You are a creative director for AI image generation. Write prompts that generate realistic UGC-style photos.

Focus on:
- Natural, authentic poses (not model poses)
- Real-world settings with lived-in details
- Lighting that looks like phone/natural light
- Expressions that feel genuine
- Product integration that looks natural`,
    userTemplate: (ctx, guide) => `Create an image generation prompt for a UGC character.

Product: ${ctx.productName || 'the product'}
${ctx.productDescription ? `Description: ${ctx.productDescription}` : ''}
Target audience: ${ctx.targetAudience || 'general consumer'}
Camera view: ${ctx.cameraView || 'selfie'}
Product position: ${ctx.productPosition || 'holding'}
Setting: ${ctx.setting || 'bedroom'}
${guide ? `\nGuidance: ${guide}` : ''}

Write a detailed prompt that would generate a realistic, authentic-looking UGC creator photo. Make them look like a real customer, not a model.`
  },

  // B-roll scene description
  broll: {
    system: `You are a visual director for UGC ads. Describe B-roll scenes that PROVE script claims.
- Describe a single frozen moment (not motion)
- Include specific details about lighting, angle, environment
- Make it look like authentic iPhone footage
- Focus on product visibility`,
    userTemplate: (ctx, guide) => `Describe a B-roll image for this script line:

"${ctx.scriptLine || ctx.currentValue}"

${ctx.productInfo ? `Product: ${ctx.productInfo}` : ''}
${guide ? `\nGuidance: ${guide}` : ''}

Describe a single image that visually proves this claim. One paragraph.`
  },

  // Segment text (for individual script segments)
  segment: {
    system: `You are a UGC script editor. Write or improve individual script segments.
- Keep natural conversational tone
- Each segment should be 5-8 seconds when spoken
- Make sure it flows naturally`,
    userTemplate: (ctx, guide) => `${ctx.action === 'improve' ? 'Improve this segment' : 'Write a segment'} for a UGC ad.

${ctx.currentValue ? `Current: "${ctx.currentValue}"` : ''}
${ctx.previousSegment ? `Previous segment: "${ctx.previousSegment}"` : ''}
${ctx.segmentPurpose ? `Purpose: ${ctx.segmentPurpose}` : ''}
${guide ? `\nGuidance: ${guide}` : ''}

${ctx.action === 'improve' ? 'Rewrite to be more engaging and natural.' : 'Write a 5-8 second segment.'}`
  },

  // Iterate/refine existing content
  refine: {
    system: `You are refining existing content. Make targeted improvements while keeping the core message.
- Maintain the original intent
- Improve clarity, engagement, or naturalness as requested
- Keep similar length unless asked to change`,
    userTemplate: (ctx, guide) => `Refine this content:

"${ctx.currentValue}"

${guide ? `Changes requested: ${guide}` : 'Make it better - more natural, more engaging.'}

Provide the improved version only.`
  },

  // General fallback
  general: {
    system: `You are a helpful assistant for UGC ad creation. 
Be concise and practical. Focus on what converts.`,
    userTemplate: (ctx, guide) => `${ctx.task || 'Help me with this'}

${ctx.currentValue ? `Current content: ${ctx.currentValue}` : ''}
${guide ? `\nGuidance: ${guide}` : ''}

Be concise.`
  }
};

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      type = 'general',        // prompt type
      mode = 'generate',       // 'generate' (Opus) or 'iterate' (Sonnet)
      context = {},
      guidance = '',           // user guidance for generation
      currentValue = ''        // existing value to iterate on
    } = body;

    // Legacy support: map old field names
    const promptType = body.promptType || type;
    const guidingPoints = body.guidingPoints || guidance;

    // Get the template for this prompt type
    const template = PROMPT_TEMPLATES[promptType] || PROMPT_TEMPLATES.general;
    
    // Build the full context
    const fullContext = {
      ...context,
      currentValue
    };
    
    // Generate the user prompt
    const userPrompt = template.userTemplate(fullContext, guidingPoints);

    // Choose generation method based on mode
    let result;
    if (mode === 'iterate' && currentValue) {
      // Use Sonnet 4.5 for iterations
      result = await claude.iterate(template.system, userPrompt, {
        task: `iterate-${promptType}`
      });
    } else {
      // Use Opus 4.5 for fresh generation
      result = await claude.generate(template.system, userPrompt, {
        task: `generate-${promptType}`
      });
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

    // Clean up the response (remove quotes if wrapped)
    let text = result.content.trim();
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1);
    }

    return NextResponse.json({
      success: true,
      text,              // standardized output field
      content: text,     // legacy support
      model: result.model,
      mode,
      promptType
    });

  } catch (error) {
    console.error('AI generate error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
