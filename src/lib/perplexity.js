/**
 * Perplexity API Client v2.0
 * Now with Sonar Deep Research for real multi-step research
 * Full cost tracking integrated
 */

const API_KEY = process.env.PERPLEXITY_API_KEY;
const BASE_URL = 'https://api.perplexity.ai';
const PROJECT_NAME = 'ugc-factory';

// Model configuration
const MODELS = {
  deep: 'sonar-deep-research',      // Full deep research - expensive but thorough
  reasoning: 'sonar-reasoning-pro',  // Multi-step reasoning - mid-tier
  pro: 'sonar-pro',                  // Standard search - cheap
  basic: 'sonar',                    // Basic search - cheapest
};

// Pricing per 1M tokens / per query
const PRICING = {
  'sonar-deep-research': {
    input: 2,
    output: 8,
    citation: 2,
    reasoning: 3,
    searchQuery: 0.005, // $5 per 1K queries
  },
  'sonar-reasoning-pro': {
    input: 2,
    output: 8,
    requestFee: 0.006, // $6 per 1K requests (low context)
  },
  'sonar-pro': {
    input: 3,
    output: 15,
    requestFee: 0.006,
  },
  'sonar': {
    input: 1,
    output: 1,
    requestFee: 0.005,
  },
};

// Import centralized tracker
let tracker;
try {
  tracker = require('/root/clawd/lib/api-tracker');
} catch (e) {
  console.warn('[Perplexity] API tracker not available, using local logging');
  tracker = null;
}

/**
 * Calculate cost for a Perplexity API call
 */
function calculateCost(model, usage) {
  const prices = PRICING[model] || PRICING['sonar-pro'];
  let cost = 0;

  if (model === 'sonar-deep-research') {
    // Deep research has complex pricing
    cost += (usage.input_tokens || 0) * prices.input / 1000000;
    cost += (usage.output_tokens || 0) * prices.output / 1000000;
    cost += (usage.citation_tokens || 0) * prices.citation / 1000000;
    cost += (usage.reasoning_tokens || 0) * prices.reasoning / 1000000;
    cost += (usage.search_queries || 0) * prices.searchQuery;
  } else {
    // Standard models: tokens + request fee
    cost += (usage.input_tokens || 0) * prices.input / 1000000;
    cost += (usage.output_tokens || 0) * prices.output / 1000000;
    cost += prices.requestFee || 0;
  }

  return cost;
}

/**
 * Log API call to centralized tracker
 */
function logCall(model, usage, task, metadata = {}) {
  const cost = calculateCost(model, usage);
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    provider: 'perplexity',
    model,
    project: PROJECT_NAME,
    task,
    tokens: {
      input: usage.input_tokens || 0,
      output: usage.output_tokens || 0,
      citation: usage.citation_tokens || 0,
      reasoning: usage.reasoning_tokens || 0,
      total: (usage.input_tokens || 0) + (usage.output_tokens || 0) + 
             (usage.citation_tokens || 0) + (usage.reasoning_tokens || 0),
    },
    searchQueries: usage.search_queries || 0,
    cost,
    metadata,
  };

  // Log to centralized tracker
  if (tracker) {
    tracker.log({
      provider: 'perplexity',
      model,
      project: PROJECT_NAME,
      task,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cost,
      metadata: {
        ...metadata,
        citationTokens: usage.citation_tokens,
        reasoningTokens: usage.reasoning_tokens,
        searchQueries: usage.search_queries,
      },
    });
  }

  // Also log locally for debugging
  console.log(`[Perplexity] ${task} | ${model} | $${cost.toFixed(4)} | ${logEntry.tokens.total} tokens`);
  
  return { cost, ...logEntry };
}

/**
 * Core search function with cost tracking
 */
export async function search(query, options = {}) {
  const {
    model = MODELS.deep, // Default to deep research now
    returnCitations = true,
    maxTokens = 4000,
    systemPrompt = 'You are a thorough research assistant.',
    task = 'search',
  } = options;

  if (!API_KEY) {
    return { success: false, error: 'PERPLEXITY_API_KEY not set' };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: maxTokens,
        return_citations: returnCitations,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Perplexity API error: ${response.status} - ${error}` };
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    
    // Extract usage info
    const usage = data.usage || {
      input_tokens: 0,
      output_tokens: 0,
      citation_tokens: data.citations?.length ? data.citations.length * 100 : 0, // Estimate
      reasoning_tokens: 0,
      search_queries: data.citations?.length || 1,
    };

    // Log the call
    const costInfo = logCall(model, usage, task, { duration });
    
    return {
      success: true,
      content: data.choices?.[0]?.message?.content || '',
      citations: data.citations || [],
      usage,
      model: data.model || model,
      cost: costInfo.cost,
      duration,
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Deep Research - Reddit analysis
 * Uses sonar-deep-research for thorough multi-step research
 */
export async function searchReddit(productName, category) {
  const query = `Conduct deep research on Reddit discussions about "${productName}" and similar ${category} products.

I need you to thoroughly analyze multiple subreddits and threads to find:

## 1. PAIN POINTS (find 10-15)
What specific frustrations do people express? Look for:
- Exact complaints with context
- Emotional language they use
- Situations where the problem is worst
- What they've tried that didn't work

## 2. WHAT PEOPLE LOVE (find 10-15)
When they find a product that works:
- What specifically makes them happy?
- What phrases do they use to describe success?
- What "aha moments" do they mention?

## 3. PURCHASE TRIGGERS
- What makes someone finally decide to buy?
- What event or moment triggers the search?
- What comparisons do they make?

## 4. OBJECTIONS & HESITATIONS
- What almost stops them from buying?
- What concerns do they express?
- What negative experiences have made them skeptical?

## 5. LANGUAGE PATTERNS
Extract 15-20 EXACT phrases people use - the way they naturally talk about this problem. These should sound like real human speech, not marketing copy.

## 6. WHO IS TALKING
- Demographics hints (age, gender, life situation)
- What communities are most active on this topic
- Common scenarios/contexts

Include specific quotes when possible. I want to understand how real customers think and talk, not generic summaries.`;

  return await search(query, {
    model: MODELS.deep,
    systemPrompt: `You are a consumer research expert conducting deep Reddit research. 

Your job is to discover authentic customer insights - real pain points, real language, real emotions. Search through multiple threads and subreddits to find patterns.

Be specific and include real examples. Generic summaries are useless - I need actionable insights with the actual words customers use.

Structure your response clearly with headers and bullet points.`,
    maxTokens: 6000,
    task: 'reddit-research',
  });
}

/**
 * Deep Research - Amazon review analysis
 */
export async function searchAmazonReviews(productName, category) {
  const query = `Conduct deep research on Amazon reviews for "${productName}" and similar ${category} products.

Analyze what real customers write in their reviews:

## 1. FIVE-STAR REVIEW ANALYSIS
What makes people write glowing reviews?
- Specific benefits they mention
- Emotional language ("game changer", "finally", "life saver")
- Transformation stories (before vs after)
- Unexpected benefits they discovered

## 2. NEGATIVE REVIEW PATTERNS (1-3 stars)
What disappoints people?
- Specific complaints
- Expectation vs reality gaps
- Common failure modes
- Who the product doesn't work for

## 3. PURCHASE DECISION INSIGHTS
- Why did they choose this over alternatives?
- What convinced skeptics to try it?
- How long did they research before buying?
- What made them finally click "buy"?

## 4. CUSTOMER PROFILES
Who is actually buying?
- Life situations mentioned
- Problems they were trying to solve
- Demographics hints
- Use cases and contexts

## 5. LANGUAGE PATTERNS
Extract 15-20 exact phrases from reviews - how customers naturally describe:
- The problem
- The solution
- The transformation
- Their emotions

Include specific quotes. I need the authentic voice of the customer.`;

  return await search(query, {
    model: MODELS.deep,
    systemPrompt: `You are a consumer psychologist analyzing Amazon reviews.

Look for patterns in how real customers express themselves. Extract specific language, emotional cues, and decision drivers.

Focus on authentic voice - how customers actually talk, not how marketers think they talk.

Structure your response clearly with headers and bullet points.`,
    maxTokens: 6000,
    task: 'amazon-research',
  });
}

/**
 * Deep Research - Build customer avatar
 */
export async function buildAvatar(productName, targetAudience, existingResearch = '') {
  const query = `Based on research about "${productName}" targeting ${targetAudience}, build a detailed customer avatar.

${existingResearch ? `EXISTING RESEARCH:\n${existingResearch}\n\n` : ''}

Create a specific, named persona that represents the ideal customer. This should feel like a real person, not a marketing abstraction.

## DEMOGRAPHICS
- Name, age, location
- Income level, occupation
- Family situation
- Education background

## PSYCHOGRAPHICS
- Core values (what matters most to them)
- Fears and anxieties
- Aspirations and goals
- Frustrations in daily life

## THE PROBLEM
- How do they experience this problem?
- When is it worst?
- How does it affect their life/work/relationships?
- What have they tried before?

## BUYING JOURNEY
- What triggers the search?
- Where do they look for solutions?
- What criteria do they use to evaluate?
- What objections need to be overcome?
- What would make them buy immediately?

## LANGUAGE PROFILE
- How do they describe the problem (in their words)?
- What phrases would grab their attention?
- What tone resonates (casual, professional, urgent)?
- Words/phrases that would turn them off

## A DAY IN THEIR LIFE
Write a brief narrative of their typical day, highlighting when and how this problem shows up.

Make this avatar specific enough that we could write ads directly to them.`;

  return await search(query, {
    model: MODELS.deep,
    systemPrompt: `You are a customer research expert building detailed buyer personas.

Create avatars grounded in real behavior and psychology. Make them specific and human - with quirks, contradictions, and real motivations.

A good avatar should make it easy to write copy that resonates emotionally.`,
    maxTokens: 5000,
    task: 'avatar-research',
  });
}

/**
 * Generate hooks based on research insights
 * Uses reasoning model for creative generation (cheaper than deep research)
 */
export async function generateHooks(productName, painPoints, praises, avatar) {
  const query = `Generate 15-20 UGC video hooks for "${productName}" based on this research:

PAIN POINTS:
${painPoints}

WHAT CUSTOMERS LOVE:
${praises}

CUSTOMER AVATAR:
${avatar}

For each hook, create:
1. The exact opening line (first 3 seconds)
2. Visual suggestion (what's on screen)
3. Why it works (psychology)
4. Best format (talking head, POV, demo, etc.)

Mix these hook types:
- Problem-agitate hooks ("I was so frustrated with...")
- Curiosity hooks ("Nobody talks about this...")
- Social proof hooks ("Everyone keeps asking me...")
- Transformation hooks ("Before vs after...")
- Contrarian hooks ("Stop doing X...")
- Story hooks ("So this happened...")
- Question hooks ("Why does nobody...")

The hooks should sound like a real person talking to camera, not like an ad. Use the language patterns from the research.`;

  return await search(query, {
    model: MODELS.reasoning, // Use reasoning model for creative work
    systemPrompt: `You are a UGC creative director who specializes in scroll-stopping hooks.

Create hooks that sound authentic and relatable. Use the customer's own language. Make them curious, emotional, or challenged - never bored.

Each hook should work in the first 3 seconds of a video.`,
    maxTokens: 4000,
    task: 'hook-generation',
  });
}

/**
 * Quick search using cheaper model
 * Use for simple lookups that don't need deep research
 */
export async function quickSearch(query, task = 'quick-search') {
  return await search(query, {
    model: MODELS.pro,
    maxTokens: 2000,
    task,
  });
}

/**
 * Get current model being used and pricing info
 */
export function getModelInfo() {
  return {
    models: MODELS,
    pricing: PRICING,
    currentDefault: MODELS.deep,
  };
}

export default {
  search,
  searchReddit,
  searchAmazonReviews,
  buildAvatar,
  generateHooks,
  quickSearch,
  getModelInfo,
  MODELS,
  PRICING,
};
