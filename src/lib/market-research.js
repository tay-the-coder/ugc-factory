/**
 * Market Research Engine v4.0
 * Pure Claude Opus 4.5 - No external research APIs
 * Synthesizes product analysis + uploaded research documents
 */

import claude from './claude.js';

// ============================================================================
// RESEARCH SYNTHESIS
// ============================================================================

/**
 * Synthesize customer research from product analysis and uploaded documents
 * This is the main entry point - combines everything into actionable insights
 */
export async function synthesizeResearch(productAnalysis, supportingDocs = [], targetAudience = '') {
  console.log('[Research] Synthesizing research with Opus 4.5...');
  
  // Build context from all available sources
  let context = '';
  
  // Add product analysis
  if (productAnalysis) {
    context += `\n## PRODUCT ANALYSIS\n`;
    context += `Product: ${productAnalysis.name || 'Unknown'}\n`;
    context += `Category: ${productAnalysis.category || 'General'}\n`;
    if (productAnalysis.benefits?.primary) context += `Primary Benefit: ${productAnalysis.benefits.primary}\n`;
    if (productAnalysis.problemSolved) context += `Problem Solved: ${productAnalysis.problemSolved}\n`;
    if (productAnalysis.positioning?.usp) context += `USP: ${productAnalysis.positioning.usp}\n`;
    if (productAnalysis.targetDemographic) {
      context += `Target Demo: ${JSON.stringify(productAnalysis.targetDemographic)}\n`;
    }
  }
  
  // Add supporting documents (research, competitor info, etc.)
  if (supportingDocs && supportingDocs.length > 0) {
    context += `\n## RESEARCH DOCUMENTS\n`;
    supportingDocs.forEach((doc, i) => {
      const content = typeof doc.content === 'string' ? doc.content : (doc.data || '');
      context += `\n### Document ${i + 1}: ${doc.name}\n`;
      context += content.slice(0, 8000); // Limit per doc
      context += '\n';
    });
  }
  
  // Add any provided target audience info
  if (targetAudience) {
    context += `\n## TARGET AUDIENCE NOTES\n${targetAudience}\n`;
  }

  const synthesisPrompt = `You are a world-class UGC strategist and consumer psychologist. Analyze everything provided and create a comprehensive customer research brief.

${context}

Based on ALL the information above, create a detailed research synthesis:

## 1. CUSTOMER AVATAR
Create a specific, named persona:
- Demographics (name, age, location, income, occupation, family)
- Psychographics (values, fears, aspirations, daily frustrations)
- The specific problem/situation that leads them to this product
- What they've tried before that didn't work
- What would make them buy immediately

## 2. PAIN POINTS (15-20)
List specific frustrations the customer experiences. Be detailed and emotional - these should feel real, not generic.

## 3. PURCHASE TRIGGERS
What specific moments or events make someone finally decide to buy? What pushes them over the edge?

## 4. OBJECTIONS & HESITATIONS
What almost stops them from buying? What concerns need to be addressed?

## 5. LANGUAGE PATTERNS (20+)
Exact phrases the customer uses to describe:
- Their problem
- What they want
- How they feel
- What success looks like
These should sound like real human speech, not marketing copy.

## 6. TRANSFORMATION
- BEFORE: How they feel/what life is like before the product
- AFTER: How they feel/what life is like after

## 7. HOOK ANGLES (15+)
Generate scroll-stopping opening lines for UGC videos. Mix these types:
- Problem-agitate ("I was so tired of...")
- Curiosity ("Nobody tells you this about...")
- Social proof ("Everyone keeps asking...")
- Transformation ("Before vs after...")
- Contrarian ("Stop doing X...")
- Story ("So this happened...")

For each hook, include:
- The exact opening line (first 3 seconds)
- Why it works psychologically
- Suggested visual

## 8. IDEAL UGC CREATOR
Describe the perfect person to deliver this message:
- Age range, gender, vibe
- Speaking style (casual, professional, energetic, calm)
- Setting/background that resonates
- What makes them relatable to the target customer

Return as JSON with these exact sections.`;

  const result = await claude.generateJSON(
    `You are an expert UGC strategist who deeply understands consumer psychology. 
You create research that leads to high-converting video ads. 
Be specific, detailed, and authentic - generic insights are useless.
Every insight should be actionable for creating UGC content.`,
    synthesisPrompt,
    { task: 'research-synthesis', maxTokens: 8000 }
  );

  if (result.success) {
    return { 
      success: true, 
      research: {
        ...result.data,
        status: 'complete',
        source: 'claude-opus',
        model: result.model,
      }
    };
  }
  
  return { success: false, error: result.error };
}

/**
 * Generate creative angles from existing research
 */
export async function generateAngles(research, productName) {
  const anglesPrompt = `Based on this customer research for "${productName}", generate additional creative angles:

CUSTOMER AVATAR:
${JSON.stringify(research.customerAvatar || research.avatar, null, 2)}

PAIN POINTS:
${JSON.stringify(research.painPoints, null, 2)}

LANGUAGE PATTERNS:
${JSON.stringify(research.languagePatterns, null, 2)}

Generate:
1. 10 more HOOK ANGLES with opening lines and visuals
2. 5 PAIN POINT SCRIPTS - full opening sequences (first 10 seconds)
3. 5 TRANSFORMATION ANGLES - before/after framing
4. 5 OBJECTION BUSTERS - addressing concerns upfront
5. 3 STORY HOOKS - personal narrative openings

Each should sound like a real person talking to camera, not an ad.

Return as JSON.`;

  const result = await claude.generateJSON(
    'You are a UGC creative director who specializes in authentic, scroll-stopping content.',
    anglesPrompt,
    { task: 'angle-generation', maxTokens: 4000 }
  );

  if (result.success) {
    return { success: true, angles: result.data };
  }
  
  return { success: false, error: result.error };
}

/**
 * Quick target audience generation from product info only
 */
export async function quickAudienceGeneration(productName, productDescription, productAnalysis) {
  const prompt = `Based on this product, describe the ideal target customer in 2-3 sentences:

Product: ${productName}
Description: ${productDescription || 'N/A'}
Analysis: ${productAnalysis ? JSON.stringify(productAnalysis) : 'N/A'}

Format: [Age range] • [location/lifestyle] • who struggle with: [specific problems]

Be specific, not generic.`;

  const result = await claude.generate(
    'You are a marketing strategist.',
    prompt,
    { task: 'quick-audience', maxTokens: 200 }
  );

  if (result.success) {
    return { success: true, audience: result.content };
  }
  
  return { success: false, error: result.error };
}

// Legacy exports for compatibility
export const runFullResearch = synthesizeResearch;
export const searchReddit = () => ({ success: false, error: 'Deprecated - use synthesizeResearch' });
export const analyzeAmazonReviews = () => ({ success: false, error: 'Deprecated - use synthesizeResearch' });
export const buildCustomerAvatar = () => ({ success: false, error: 'Deprecated - use synthesizeResearch' });
export const generateCreativeAngles = generateAngles;

export default {
  synthesizeResearch,
  generateAngles,
  quickAudienceGeneration,
  // Legacy
  runFullResearch,
  searchReddit,
  analyzeAmazonReviews,
  buildCustomerAvatar,
  generateCreativeAngles,
};
