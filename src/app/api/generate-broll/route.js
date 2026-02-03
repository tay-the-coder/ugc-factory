import { NextResponse } from 'next/server';
import gemini from '../../../lib/gemini.js';
import promptEngine from '../../../lib/prompt-engine.js';
import claude from '../../../lib/claude.js';

const MAX_RETRIES = 2;
const QC_THRESHOLD = 75;

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      segment,
      productInfo,
      characterReference,
      productImage,
      customPrompt,
      enableQC = true
    } = body;

    if (!segment?.text && !customPrompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Segment text or custom prompt is required' 
      }, { status: 400 });
    }

    let imagePrompt = customPrompt;

    // Generate B-roll prompt if not provided
    if (!imagePrompt && segment) {
      const result = await promptEngine.generateBrollPrompts(
        [segment], 
        productInfo, 
        characterReference
      );
      if (result.success && result.prompts[0]) {
        imagePrompt = result.prompts[0].imagePrompt;
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to generate B-roll prompt' 
        }, { status: 500 });
      }
    }

    // Prepare reference images
    const referenceImages = [];
    
    if (productImage) {
      const base64 = productImage.includes('base64,') 
        ? productImage.split('base64,')[1]
        : productImage;
      referenceImages.push({
        base64,
        mimeType: 'image/png',
        label: 'product'
      });
    }

    if (characterReference) {
      const base64 = characterReference.includes('base64,') 
        ? characterReference.split('base64,')[1]
        : characterReference;
      referenceImages.push({
        base64,
        mimeType: 'image/png',
        label: 'character'
      });
    }

    let currentPrompt = imagePrompt;
    let attempts = 0;
    let lastResult = null;
    let lastAnalysis = null;

    // QC loop
    while (attempts <= MAX_RETRIES) {
      attempts++;

      // Generate image
      const result = await gemini.generateImage(currentPrompt, {
        referenceImages,
        aspectRatio: '9:16'
      });

      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error,
          attempts
        }, { status: 500 });
      }

      lastResult = result;

      // Skip QC if disabled
      if (!enableQC || !result.images[0]?.base64) {
        break;
      }

      // Quality control
      const analysis = await promptEngine.analyzeForQuality(
        result.images[0].base64,
        currentPrompt,
        { purpose: 'broll', segmentType: segment?.type }
      );

      lastAnalysis = analysis.analysis;

      if (analysis.analysis?.score >= QC_THRESHOLD || analysis.analysis?.passed) {
        break;
      }

      if (attempts > MAX_RETRIES) {
        break;
      }

      // Correct prompt for retry
      if (analysis.analysis?.adjustedPrompt) {
        currentPrompt = analysis.analysis.adjustedPrompt;
      } else if (analysis.analysis?.issues?.length > 0) {
        const correction = await promptEngine.generateCorrectedPrompt(
          currentPrompt,
          analysis.analysis.issues,
          { type: 'broll' }
        );
        if (correction.success) {
          currentPrompt = correction.content;
        }
      }
    }

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${lastResult.images[0]?.base64}`,
      prompt: currentPrompt,
      originalPrompt: imagePrompt,
      segment: segment?.segment,
      attempts,
      qcPassed: lastAnalysis?.passed ?? true,
      qcScore: lastAnalysis?.score ?? 100,
      issues: lastAnalysis?.issues ?? []
    });

  } catch (error) {
    console.error('Generate B-Roll error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
