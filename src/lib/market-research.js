/**
 * Market Research Engine v3.0
 * Enhanced with Perplexity Deep Research + Cost Tracking
 * Falls back to Claude synthesis when Perplexity unavailable
 */

import claude from './claude.js';
import perplexity from './perplexity.js';

const USE_PERPLEXITY = !!process.env.PERPLEXITY_API_KEY;

// ============================================================================
// REDDIT RESEARCH
// ============================================================================

const REDDIT_SUBREDDITS = {
  general: ['dropship', 'Entrepreneur', 'ecommerce', 'smallbusiness'],
  beauty: ['SkincareAddiction', 'MakeupAddiction', 'beauty', '30PlusSkinCare', 'AsianBeauty'],
  fitness: ['fitness', 'homegym', 'bodyweightfitness', 'xxfitness', 'GYM'],
  tech: ['gadgets', 'BuyItForLife', 'technology', 'techdeals'],
  home: ['HomeImprovement', 'homeautomation', 'organization', 'CleaningTips', 'cozyplaces'],
  pets: ['dogs', 'cats', 'Pets', 'dogtraining'],
  wellness: ['Supplements', 'sleep', 'backpain', 'ChronicPain', 'Fibromyalgia', 'ADHD'],
  fashion: ['malefashionadvice', 'femalefashionadvice', 'streetwear', 'frugalmalefashion']
};

/**
 * Search Reddit for product-related discussions
 * Uses Perplexity Deep Research for real search
 */
export async function searchReddit(productName, category = 'general', supportingDocs = [], productAnalysis = null) {
  const subreddits = REDDIT_SUBREDDITS[category] || REDDIT_SUBREDDITS.general;
  
  // Try Perplexity Deep Research first
  if (USE_PERPLEXITY) {
    console.log('[Research] Using Perplexity Deep Research for Reddit...');
    const pplxResult = await perplexity.searchReddit(productName, category);
    
    if (pplxResult.success) {
      // Parse the deep research response into structured format
      const parsed = parseDeepResearchResponse(pplxResult.content, 'reddit');
      return { 
        success: true, 
        reddit: parsed,
        rawContent: pplxResult.content,
        source: 'perplexity-deep-research',
        model: pplxResult.model,
        citations: pplxResult.citations,
        cost: pplxResult.cost,
        duration: pplxResult.duration,
      };
    }
    console.log('[Research] Perplexity failed, falling back to Claude:', pplxResult.error);
  }

  // Fallback: Claude synthesis (with product analysis context)
  let analysisContext = '';
  if (productAnalysis) {
    analysisContext = `\n\nPRODUCT ANALYSIS:\n`;
    if (productAnalysis.name) analysisContext += `- Product: ${productAnalysis.name}\n`;
    if (productAnalysis.category) analysisContext += `- Category: ${productAnalysis.category}\n`;
    if (productAnalysis.benefits?.primary) analysisContext += `- Primary Benefit: ${productAnalysis.benefits.primary}\n`;
    if (productAnalysis.problemSolved) analysisContext += `- Problem Solved: ${productAnalysis.problemSolved}\n`;
    if (productAnalysis.targetDemographic?.painPoints) {
      analysisContext += `- Known Pain Points: ${productAnalysis.targetDemographic.painPoints.join(', ')}\n`;
    }
  }

  const analysisPrompt = `You are a Reddit research analyst. Based on your knowledge of Reddit discussions in ${subreddits.join(', ')}, 
generate detailed, realistic insights about "${productName}".

${analysisContext}

I need SPECIFIC, DETAILED insights - not generic marketing speak:

1. PAIN POINTS (10-15 items) - Specific frustrations with exact context
2. PRAISES (10-15 items) - What people genuinely love, with emotional language
3. COMMON QUESTIONS (10-15 items) - Real questions people ask before buying
4. OBJECTIONS (7-10 items) - What almost stops them from buying
5. LANGUAGE PATTERNS (15-20 phrases) - Exact phrases customers use naturally
6. TOP CONCERNS - The #1 thing that worries them

Return as JSON with these exact keys.`;

  const result = await claude.generateJSON(
    'You are an expert at understanding online communities and consumer psychology. Be specific and detailed.',
    analysisPrompt,
    { task: 'reddit-research-fallback' }
  );

  if (result.success) {
    return { 
      success: true, 
      reddit: result.data, 
      source: 'claude',
      model: result.model,
      cost: 0, // Claude cost tracked separately
    };
  }
  
  return { success: false, error: result.error };
}

/**
 * Parse deep research response into structured format
 */
function parseDeepResearchResponse(content, type) {
  const sections = {
    painPoints: [],
    praises: [],
    questions: [],
    objections: [],
    languagePatterns: [],
    topConcerns: [],
    customerProfiles: [],
    purchaseTriggers: [],
    transformations: { before: [], after: [] },
  };

  const lines = content.split('\n');
  let currentSection = null;
  let currentSubSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    
    // Detect section headers
    if (lower.includes('pain point') || lower.includes('frustrat') || lower.includes('complaint')) {
      currentSection = 'painPoints';
    } else if (lower.includes('love') || lower.includes('praise') || lower.includes('positive') || lower.includes('five-star') || lower.includes('5-star')) {
      currentSection = 'praises';
    } else if (lower.includes('question') || lower.includes('ask')) {
      currentSection = 'questions';
    } else if (lower.includes('objection') || lower.includes('hesitat') || lower.includes('concern') || lower.includes('negative')) {
      currentSection = 'objections';
    } else if (lower.includes('language') || lower.includes('phrase') || lower.includes('pattern')) {
      currentSection = 'languagePatterns';
    } else if (lower.includes('trigger') || lower.includes('decision') || lower.includes('made them buy')) {
      currentSection = 'purchaseTriggers';
    } else if (lower.includes('who is') || lower.includes('customer') || lower.includes('profile') || lower.includes('demographic')) {
      currentSection = 'customerProfiles';
    } else if (lower.includes('before') && lower.includes('after')) {
      currentSection = 'transformations';
      currentSubSection = 'before';
    } else if (currentSection === 'transformations' && lower.includes('after')) {
      currentSubSection = 'after';
    }

    // Extract bullet points and numbered items
    const bulletMatch = trimmed.match(/^[-•*]\s*(.+)/) || trimmed.match(/^\d+[.)]\s*(.+)/);
    if (bulletMatch && currentSection) {
      const text = bulletMatch[1].trim();
      if (text.length > 5) {
        if (currentSection === 'transformations' && currentSubSection) {
          if (sections.transformations[currentSubSection].length < 10) {
            sections.transformations[currentSubSection].push(text);
          }
        } else if (sections[currentSection] && sections[currentSection].length < 20) {
          sections[currentSection].push(text);
        }
      }
    }

    // Also capture quoted text as language patterns
    const quoteMatch = trimmed.match(/"([^"]+)"|'([^']+)'|"([^"]+)"/);
    if (quoteMatch && currentSection) {
      const quote = quoteMatch[1] || quoteMatch[2] || quoteMatch[3];
      if (quote && quote.length > 5 && sections.languagePatterns.length < 25) {
        if (!sections.languagePatterns.includes(quote)) {
          sections.languagePatterns.push(quote);
        }
      }
    }
  }

  // Store raw content for reference
  sections.rawContent = content;
  
  return sections;
}

// ============================================================================
// AMAZON REVIEW ANALYSIS
// ============================================================================

/**
 * Analyze Amazon review patterns for a product type
 */
export async function analyzeAmazonReviews(productName, productCategory, supportingDocs = [], productAnalysis = null) {
  
  // Try Perplexity Deep Research first
  if (USE_PERPLEXITY) {
    console.log('[Research] Using Perplexity Deep Research for Amazon reviews...');
    const pplxResult = await perplexity.searchAmazonReviews(productName, productCategory);
    
    if (pplxResult.success) {
      const parsed = parseDeepResearchResponse(pplxResult.content, 'amazon');
      return { 
        success: true, 
        amazon: {
          fiveStarThemes: {
            phrases: parsed.praises.slice(0, 10),
            emotions: parsed.languagePatterns.filter(p => 
              p.toLowerCase().includes('love') || 
              p.toLowerCase().includes('amazing') ||
              p.toLowerCase().includes('finally') ||
              p.toLowerCase().includes('game changer')
            ),
            benefits: parsed.praises.filter(p => p.length > 20).slice(0, 5),
          },
          lowRatingThemes: {
            complaints: parsed.painPoints.slice(0, 10),
            unmetExpectations: parsed.objections.slice(0, 5),
          },
          customerSignals: {
            lifeSituations: parsed.customerProfiles.slice(0, 5),
            demographics: parsed.customerProfiles.slice(5, 10),
            problems: parsed.painPoints.slice(0, 5),
          },
          purchaseTriggers: parsed.purchaseTriggers.slice(0, 10),
          objections: parsed.objections.slice(0, 7),
          transformations: parsed.transformations,
          languagePatterns: parsed.languagePatterns,
        },
        rawContent: pplxResult.content,
        source: 'perplexity-deep-research',
        model: pplxResult.model,
        citations: pplxResult.citations,
        cost: pplxResult.cost,
        duration: pplxResult.duration,
      };
    }
    console.log('[Research] Perplexity failed, falling back to Claude:', pplxResult.error);
  }

  // Fallback: Claude synthesis
  const analysisPrompt = `You are an Amazon review analyst. Generate realistic, detailed customer insights for "${productName}" (category: ${productCategory}).

Generate:

1. 5-STAR REVIEW THEMES (10-15 items) - What makes people LOVE it, with emotional language
2. 1-3 STAR REVIEW THEMES (10 items) - What specifically disappoints people
3. CUSTOMER SIGNALS - Who is buying (life situations, demographics, specific problems)
4. PURCHASE TRIGGERS (7-10 items) - What made them finally buy
5. OBJECTION THEMES (7-10 items) - What concerns they had before buying
6. TRANSFORMATION LANGUAGE - Before/after statements (10 each)

Return as JSON with detailed, specific insights.`;

  const result = await claude.generateJSON(
    'You are an expert at consumer psychology and review analysis.',
    analysisPrompt,
    { task: 'amazon-research-fallback' }
  );

  if (result.success) {
    return { 
      success: true, 
      amazon: result.data, 
      source: 'claude',
      model: result.model,
      cost: 0,
    };
  }
  
  return { success: false, error: result.error };
}

// ============================================================================
// AVATAR BUILDER
// ============================================================================

/**
 * Build detailed customer avatar from research data
 */
export async function buildCustomerAvatar(productName, targetAudience, redditData, amazonData, supportingDocs = []) {
  
  // Compile existing research as context
  const existingResearch = `
PAIN POINTS DISCOVERED:
${JSON.stringify(redditData?.painPoints || [], null, 2)}

WHAT CUSTOMERS LOVE:
${JSON.stringify(redditData?.praises || amazonData?.fiveStarThemes?.phrases || [], null, 2)}

PURCHASE TRIGGERS:
${JSON.stringify(amazonData?.purchaseTriggers || [], null, 2)}

LANGUAGE PATTERNS:
${JSON.stringify(redditData?.languagePatterns || amazonData?.languagePatterns || [], null, 2)}

CUSTOMER SIGNALS:
${JSON.stringify(amazonData?.customerSignals || {}, null, 2)}
  `;

  // Try Perplexity first
  if (USE_PERPLEXITY) {
    console.log('[Research] Using Perplexity Deep Research for avatar building...');
    const pplxResult = await perplexity.buildAvatar(productName, targetAudience || 'general consumer', existingResearch);
    
    if (pplxResult.success) {
      // Parse avatar from deep research response
      const avatar = parseAvatarFromDeepResearch(pplxResult.content, targetAudience);
      return { 
        success: true, 
        avatar,
        rawContent: pplxResult.content,
        source: 'perplexity-deep-research',
        model: pplxResult.model,
        cost: pplxResult.cost,
        duration: pplxResult.duration,
      };
    }
    console.log('[Research] Perplexity failed for avatar, falling back to Claude');
  }

  // Fallback: Claude synthesis with Opus 4.5
  const avatarPrompt = `Create a detailed customer avatar for "${productName}".

TARGET AUDIENCE: ${targetAudience}

RESEARCH INSIGHTS:
${existingResearch}

Create a SPECIFIC, NAMED avatar with:
1. DEMOGRAPHICS - Name, age, location, income, family, occupation
2. PSYCHOGRAPHICS - Values, fears, aspirations, frustrations  
3. THE PROBLEM - How they experience it, when it's worst, what they've tried
4. BUYING JOURNEY - Trigger, alternatives considered, objections, what convinced them
5. LANGUAGE PROFILE - How they describe the problem, phrases that resonate, search terms
6. DAY IN LIFE - Typical day, when problem is worst, failed solutions

Return as JSON with all these sections filled in detail.`;

  const result = await claude.generateJSON(
    'You are an expert at creating detailed customer personas that feel like real people.',
    avatarPrompt,
    { task: 'avatar-building' }
  );

  if (result.success) {
    return { 
      success: true, 
      avatar: result.data, 
      source: 'claude',
      model: result.model,
      cost: 0,
    };
  }
  
  return { success: false, error: result.error };
}

/**
 * Parse avatar from deep research response
 */
function parseAvatarFromDeepResearch(content, targetAudience) {
  // Extract structured data from the narrative response
  const avatar = {
    demographics: {
      name: extractPattern(content, /name[d]?\s*[:is]*\s*["']?([A-Z][a-z]+)/i) || 'Sarah',
      age: extractPattern(content, /(\d{2})\s*(?:years?\s*old|yo|-year)/i) || '32',
      location: extractPattern(content, /(?:lives?\s+in|from|located\s+in)\s+([^.,]+)/i) || 'suburban area',
      income: extractPattern(content, /(?:income|earns?|makes?)\s*[:of]*\s*\$?([\d,k]+)/i) || 'middle income',
      occupation: extractPattern(content, /(?:works?\s+as|occupation|job)\s*[:is]*\s*([^.,]+)/i) || 'working professional',
    },
    psychographics: {
      values: extractListFromContent(content, 'values'),
      fears: extractListFromContent(content, 'fears'),
      aspirations: extractListFromContent(content, 'aspirations') || extractListFromContent(content, 'goals'),
      frustrations: extractListFromContent(content, 'frustrations'),
    },
    problem: {
      experience: extractParagraph(content, 'problem') || extractParagraph(content, 'struggle'),
      worstMoment: extractParagraph(content, 'worst'),
      triedBefore: extractListFromContent(content, 'tried'),
    },
    buyingJourney: {
      trigger: extractParagraph(content, 'trigger'),
      alternatives: extractListFromContent(content, 'alternatives') || extractListFromContent(content, 'considered'),
      objections: extractListFromContent(content, 'objections'),
      convinced: extractParagraph(content, 'convinced') || extractParagraph(content, 'buy'),
    },
    languageProfile: {
      problemDescriptions: extractListFromContent(content, 'describe') || extractListFromContent(content, 'language'),
      resonantPhrases: extractQuotes(content),
      searchTerms: extractListFromContent(content, 'search'),
    },
    dayInLife: extractParagraph(content, 'day') || extractParagraph(content, 'typical'),
    rawContent: content,
  };

  return avatar;
}

function extractPattern(content, regex) {
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function extractListFromContent(content, keyword) {
  const results = [];
  const lines = content.split('\n');
  let inSection = false;
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes(keyword)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      const bulletMatch = line.match(/^[-•*]\s*(.+)/) || line.match(/^\d+[.)]\s*(.+)/);
      if (bulletMatch) {
        const text = bulletMatch[1].trim();
        if (text.length > 3) results.push(text);
      }
      // Stop if we hit a new header or empty lines
      if (line.match(/^#{1,3}\s/) || (line.trim() === '' && results.length > 0)) {
        break;
      }
    }
  }
  return results.length > 0 ? results : null;
}

function extractParagraph(content, keyword) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(keyword)) {
      // Check next few lines for paragraph content
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const text = lines[j].trim();
        if (text.length > 30 && !text.startsWith('-') && !text.startsWith('#')) {
          return text;
        }
      }
    }
  }
  return null;
}

function extractQuotes(content) {
  const quotes = [];
  const matches = content.matchAll(/"([^"]+)"|'([^']+)'|"([^"]+)"/g);
  for (const match of matches) {
    const quote = match[1] || match[2] || match[3];
    if (quote && quote.length > 5 && quote.length < 100) {
      quotes.push(quote);
    }
  }
  return quotes.slice(0, 15);
}

// ============================================================================
// CREATIVE ANGLES GENERATOR
// ============================================================================

/**
 * Generate creative angles and hooks based on research
 */
export async function generateCreativeAngles(productName, avatar, redditData, amazonData) {
  const painPointsStr = JSON.stringify(redditData?.painPoints || [], null, 2);
  const praisesStr = JSON.stringify(amazonData?.fiveStarThemes?.phrases || redditData?.praises || [], null, 2);
  const languageStr = JSON.stringify(redditData?.languagePatterns || amazonData?.languagePatterns || [], null, 2);
  const avatarStr = JSON.stringify(avatar, null, 2);

  // Try Perplexity for hook generation (uses reasoning model - cheaper)
  if (USE_PERPLEXITY) {
    console.log('[Research] Using Perplexity for hook generation...');
    const pplxResult = await perplexity.generateHooks(productName, painPointsStr, praisesStr, avatarStr);
    
    if (pplxResult.success) {
      // Parse hooks and structure with Claude for final output
      const structuredResult = await structureAnglesWithClaude(pplxResult.content, productName);
      return {
        success: true,
        angles: structuredResult.angles,
        rawHooks: pplxResult.content,
        source: 'perplexity+claude',
        cost: pplxResult.cost + (structuredResult.cost || 0),
      };
    }
  }
  
  // Direct Claude generation
  const anglesPrompt = `You are a UGC creative strategist. Generate hooks for "${productName}".

CUSTOMER AVATAR:
${avatarStr}

PAIN POINTS:
${painPointsStr}

LANGUAGE PATTERNS:
${languageStr}

WHAT CUSTOMERS LOVE:
${praisesStr}

Generate:
1. HOOK ANGLES (15 different) - Mix of problem, curiosity, social proof, transformation, controversy, story hooks
2. PAIN POINT SCRIPTS (10) - Opening lines hitting specific pain points
3. TRANSFORMATION ANGLES (7) - Before/after framing
4. SOCIAL PROOF ANGLES (5) - Using review language
5. OBJECTION BUSTERS (5) - Addressing concerns upfront

Each hook should include:
- The exact line to say
- Visual suggestion
- Why it works psychologically

Return as JSON.`;

  const result = await claude.generateJSON(
    'You are an expert at creating high-converting UGC ad scripts that sound authentic.',
    anglesPrompt,
    { task: 'angle-generation' }
  );

  if (result.success) {
    return { 
      success: true, 
      angles: result.data,
      source: 'claude',
      model: result.model,
      cost: 0,
    };
  }
  
  return { success: false, error: result.error };
}

/**
 * Structure raw hooks into proper format with Claude
 */
async function structureAnglesWithClaude(rawHooks, productName) {
  const structurePrompt = `Take these raw UGC hooks and structure them into a proper format.

RAW HOOKS:
${rawHooks}

Structure into JSON with:
{
  "hookAngles": [{ "angle": "...", "hookLine": "...", "whyItWorks": "...", "visualSuggestion": "...", "format": "..." }],
  "painPointScripts": [{ "painPoint": "...", "openingLine": "...", "followUp": "..." }],
  "transformationAngles": [{ "before": "...", "after": "...", "hookLine": "..." }],
  "socialProofAngles": [{ "reviewQuote": "...", "scriptOpening": "..." }],
  "objectionBusters": [{ "objection": "...", "counterScript": "..." }]
}

Extract and organize all the hooks from the raw content.`;

  const result = await claude.generateJSON(
    'You are organizing UGC hooks into a structured format.',
    structurePrompt,
    { task: 'angle-structuring' }
  );

  return {
    angles: result.success ? result.data : { hookAngles: [], painPointScripts: [] },
    cost: 0,
  };
}

// ============================================================================
// FULL RESEARCH PIPELINE
// ============================================================================

/**
 * Run complete market research pipeline with cost tracking
 */
export async function runFullResearch(product, productCategory, targetAudience, supportingDocs = []) {
  const productName = typeof product === 'string' ? product : product.name;
  const category = typeof product === 'string' ? productCategory : (product.category || productCategory);
  const productAnalysis = typeof product === 'object' ? product : null;
  
  console.log(`[Research] Starting full research for "${productName}" (${category})`);
  console.log(`[Research] Perplexity Deep Research: ${USE_PERPLEXITY ? 'ENABLED' : 'DISABLED (using Claude fallback)'}`);
  
  const results = {
    status: 'running',
    steps: [],
    reddit: null,
    amazon: null,
    avatar: null,
    angles: null,
    productAnalysis: productAnalysis,
    sources: [],
    costs: {
      reddit: 0,
      amazon: 0,
      avatar: 0,
      angles: 0,
      total: 0,
    },
    durations: {},
  };

  try {
    // Step 1: Reddit Research
    results.steps.push({ step: 'reddit', status: 'running', message: 'Searching Reddit discussions...' });
    const redditResult = await searchReddit(productName, category, supportingDocs, productAnalysis);
    if (redditResult.success) {
      results.reddit = redditResult.reddit;
      results.sources.push({ 
        step: 'reddit', 
        source: redditResult.source, 
        model: redditResult.model,
        citations: redditResult.citations,
      });
      results.costs.reddit = redditResult.cost || 0;
      results.durations.reddit = redditResult.duration;
      
      // Merge with product analysis pain points if available
      if (productAnalysis?.targetDemographic?.painPoints) {
        results.reddit.painPoints = [
          ...(results.reddit.painPoints || []),
          ...productAnalysis.targetDemographic.painPoints
        ];
      }
      results.steps[0].status = 'complete';
      results.steps[0].cost = redditResult.cost;
    } else {
      results.steps[0].status = 'failed';
      results.steps[0].error = redditResult.error;
    }

    // Step 2: Amazon Review Analysis
    results.steps.push({ step: 'amazon', status: 'running', message: 'Analyzing Amazon reviews...' });
    const amazonResult = await analyzeAmazonReviews(productName, category, supportingDocs, productAnalysis);
    if (amazonResult.success) {
      results.amazon = amazonResult.amazon;
      results.sources.push({ 
        step: 'amazon', 
        source: amazonResult.source,
        model: amazonResult.model,
        citations: amazonResult.citations,
      });
      results.costs.amazon = amazonResult.cost || 0;
      results.durations.amazon = amazonResult.duration;
      results.steps[1].status = 'complete';
      results.steps[1].cost = amazonResult.cost;
    } else {
      results.steps[1].status = 'failed';
      results.steps[1].error = amazonResult.error;
    }

    // Step 3: Build Avatar
    results.steps.push({ step: 'avatar', status: 'running', message: 'Building customer avatar...' });
    const avatarResult = await buildCustomerAvatar(
      productName, 
      targetAudience, 
      results.reddit, 
      results.amazon,
      supportingDocs
    );
    if (avatarResult.success) {
      results.avatar = avatarResult.avatar;
      results.sources.push({ 
        step: 'avatar', 
        source: avatarResult.source,
        model: avatarResult.model,
      });
      results.costs.avatar = avatarResult.cost || 0;
      results.durations.avatar = avatarResult.duration;
      results.steps[2].status = 'complete';
      results.steps[2].cost = avatarResult.cost;
    } else {
      results.steps[2].status = 'failed';
      results.steps[2].error = avatarResult.error;
    }

    // Step 4: Generate Creative Angles
    results.steps.push({ step: 'angles', status: 'running', message: 'Generating creative angles...' });
    const anglesResult = await generateCreativeAngles(
      productName,
      results.avatar,
      results.reddit,
      results.amazon
    );
    if (anglesResult.success) {
      results.angles = anglesResult.angles;
      results.sources.push({ step: 'angles', source: anglesResult.source });
      results.costs.angles = anglesResult.cost || 0;
      results.steps[3].status = 'complete';
      results.steps[3].cost = anglesResult.cost;
    } else {
      results.steps[3].status = 'failed';
      results.steps[3].error = anglesResult.error;
    }

    // Calculate total cost
    results.costs.total = 
      results.costs.reddit + 
      results.costs.amazon + 
      results.costs.avatar + 
      results.costs.angles;

    results.status = 'complete';
    console.log(`[Research] Full research complete | Total cost: $${results.costs.total.toFixed(4)}`);
    return { success: true, research: results };

  } catch (error) {
    console.error('[Research] Fatal error:', error);
    results.status = 'failed';
    results.error = error.message;
    return { success: false, error: error.message, partial: results };
  }
}

export default {
  searchReddit,
  analyzeAmazonReviews,
  buildCustomerAvatar,
  generateCreativeAngles,
  runFullResearch,
};
