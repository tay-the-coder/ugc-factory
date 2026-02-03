/**
 * Assembly Analyzer
 * Uses Gemini 3 Pro Thinking to analyze finished clips and suggest editing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_AI_API_KEY;

let genAI = null;

function initGemini(apiKey = API_KEY) {
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

/**
 * Analyze all finished assets and generate assembly instructions
 * Uses Gemini 3 Pro with thinking enabled for deep analysis
 */
export async function analyzeForAssembly(assets) {
  if (!genAI) initGemini();

  const {
    script,
    segments,
    arollClips = [],  // Array of { segment, videoUrl, thumbnail }
    brollClips = [],  // Array of { segment, videoUrl, thumbnail }
    voiceoverUrl = null,
    productInfo
  } = assets;

  // Build content parts with all clips for analysis
  const contentParts = [];

  // Add the analysis prompt
  contentParts.push({
    text: `You are a professional video editor analyzing assets for a UGC ad. 
    
Analyze all the provided video clips and images, then create a detailed editing plan.

## SCRIPT
${segments.map((s, i) => `[Segment ${i + 1}${s.type === 'hook' ? ' - HOOK' : ''}]: "${s.text}"`).join('\n')}

## PRODUCT
${productInfo?.name || 'Unknown product'}
${productInfo?.description || ''}

## AVAILABLE ASSETS
- A-Roll clips: ${arollClips.length} talking head videos
- B-Roll clips: ${brollClips.length} supporting scene videos
- Voiceover: ${voiceoverUrl ? 'Yes' : 'No'}

I will attach thumbnails/frames from each clip for you to analyze.

## YOUR TASK
After analyzing the visual content of each clip, provide:

1. **TIMELINE** - Exact clip order with timestamps
   - Which clip plays when
   - Cut points (in/out times if visible issues)
   - B-roll insertion points

2. **TRANSITIONS** - Recommended transitions between clips
   - Where to use cuts vs. crossfades
   - Any jump cut opportunities

3. **PACING** - Tempo and rhythm suggestions
   - Where to speed up/slow down
   - Beat sync opportunities with voiceover

4. **B-ROLL OVERLAYS** - When to cut away from A-roll
   - Match B-roll to script claims
   - Duration of each B-roll insert

5. **AUDIO MIXING** - 
   - Voiceover timing
   - Natural audio from clips (keep/mute)
   - Music suggestions (genre, energy level)

6. **CAPTIONS** - 
   - Style recommendations
   - Key moments for text emphasis
   - Hook text treatment

7. **ISSUES & FIXES** -
   - Any clips that don't work well
   - Clips that need trimming
   - Reordering suggestions

8. **CAPCUT SPECIFIC** -
   - Template/preset suggestions
   - Effects to apply
   - Export settings

Provide the output as a structured editing guide that someone could follow step-by-step in CapCut.`
  });

  // Add A-roll thumbnails/frames
  for (let i = 0; i < arollClips.length; i++) {
    const clip = arollClips[i];
    if (clip.thumbnail) {
      contentParts.push({
        text: `\n[A-ROLL CLIP ${i + 1} - Segment ${clip.segment}]:`
      });
      contentParts.push({
        inlineData: {
          mimeType: 'image/png',
          data: clip.thumbnail.replace(/^data:image\/\w+;base64,/, '')
        }
      });
    }
  }

  // Add B-roll thumbnails/frames
  for (let i = 0; i < brollClips.length; i++) {
    const clip = brollClips[i];
    if (clip.thumbnail) {
      contentParts.push({
        text: `\n[B-ROLL CLIP ${i + 1} - Segment ${clip.segment}]:`
      });
      contentParts.push({
        inlineData: {
          mimeType: 'image/png',
          data: clip.thumbnail.replace(/^data:image\/\w+;base64,/, '')
        }
      });
    }
  }

  try {
    // Use Gemini 3 Pro with thinking for deep analysis
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-thinking',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    });

    const response = await model.generateContent(contentParts);
    const result = response.response.text();

    return {
      success: true,
      analysis: result,
      clipCount: {
        aroll: arollClips.length,
        broll: brollClips.length
      }
    };

  } catch (error) {
    console.error('Assembly analysis error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Generate a visual timeline representation
 */
export async function generateTimeline(analysis, segments) {
  if (!genAI) initGemini();

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Based on this editing analysis, create a simple ASCII timeline showing clip order:

${analysis}

SEGMENTS:
${segments.map((s, i) => `${i + 1}. "${s.text.substring(0, 50)}..."`).join('\n')}

Create a visual timeline like:
[0:00-0:03] A-ROLL 1 (Hook) | [0:03-0:05] B-ROLL 1 | [0:05-0:08] A-ROLL 2 | ...

Keep it simple and easy to follow.`;

  try {
    const response = await model.generateContent(prompt);
    return {
      success: true,
      timeline: response.response.text()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Analyze a single clip for quality/usability
 */
export async function analyzeClip(clipThumbnail, clipType, segmentText) {
  if (!genAI) initGemini();

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Analyze this ${clipType} video frame for a UGC ad.

Script line it should support: "${segmentText}"

Check:
1. Visual quality (focus, lighting, composition)
2. Does it match the script claim?
3. Product visibility (if applicable)
4. Expression/motion readiness
5. Any issues that would require re-generation?

Rate 1-10 and explain briefly.`;

  try {
    const response = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: 'image/png',
          data: clipThumbnail.replace(/^data:image\/\w+;base64,/, '')
        }
      }
    ]);

    return {
      success: true,
      analysis: response.response.text()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default {
  analyzeForAssembly,
  generateTimeline,
  analyzeClip
};
