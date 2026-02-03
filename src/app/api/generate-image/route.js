import { NextResponse } from 'next/server';
import gemini from '../../../lib/gemini.js';
import promptEngine from '../../../lib/prompt-engine.js';
import claude from '../../../lib/claude.js';

const MAX_RETRIES = 2;
const QC_THRESHOLD = 80;

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      referenceImages = [], 
      type = 'character', // 'character' or 'broll'
      context = {},
      enableQC = true 
    } = body;

    let currentPrompt = prompt;
    let attempts = 0;
    let lastResult = null;
    let lastAnalysis = null;

    while (attempts <= MAX_RETRIES) {
      attempts++;

      // Generate image
      const result = await gemini.generateImage(currentPrompt, {
        referenceImages,
        aspectRatio: '9:16',
        resolution: '2K'
      });

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error,
          attempts
        }, { status: 500 });
      }

      lastResult = result;

      // Skip QC if disabled or no image
      if (!enableQC || !result.images[0]?.base64) {
        break;
      }

      // Quality control check
      const analysis = await promptEngine.analyzeForQuality(
        result.images[0].base64,
        currentPrompt,
        { purpose: type, ...context }
      );

      lastAnalysis = analysis.analysis;

      // Check if passed QC
      if (analysis.analysis?.score >= QC_THRESHOLD || analysis.analysis?.passed) {
        break;
      }

      // If we've used all retries, exit
      if (attempts > MAX_RETRIES) {
        break;
      }

      // Generate corrected prompt for retry (using Sonnet for cost efficiency)
      if (analysis.analysis?.adjustedPrompt) {
        currentPrompt = analysis.analysis.adjustedPrompt;
      } else if (analysis.analysis?.issues?.length > 0) {
        const correctionResult = await promptEngine.generateCorrectedPrompt(
          currentPrompt,
          analysis.analysis.issues,
          context
        );
        if (correctionResult.success) {
          currentPrompt = correctionResult.content;
        }
      }
    }

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${lastResult.images[0]?.base64}`,
      prompt: currentPrompt,
      originalPrompt: prompt,
      attempts,
      qcPassed: lastAnalysis?.passed ?? true,
      qcScore: lastAnalysis?.score ?? 100,
      issues: lastAnalysis?.issues ?? []
    });

  } catch (error) {
    console.error('Generate image error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
