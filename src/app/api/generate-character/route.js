import { NextResponse } from 'next/server';
import promptEngine from '../../../lib/prompt-engine.js';
import gemini from '../../../lib/gemini.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { product, targetAudience, cameraView, productPosition, setting } = body;

    // Generate character prompt using Claude Opus
    const promptResult = await promptEngine.generateCharacterPrompt({
      product,
      targetAudience,
      productPosition,
      cameraView,
      setting
    });

    if (!promptResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: promptResult.error 
      }, { status: 500 });
    }

    // Optionally generate image if product image is provided
    let imageResult = null;
    if (product?.image) {
      // Extract base64 from data URL
      const base64Match = product.image.match(/base64,(.+)/);
      const productBase64 = base64Match ? base64Match[1] : null;

      if (productBase64) {
        imageResult = await gemini.generateImage(promptResult.prompt, {
          referenceImages: [{
            base64: productBase64,
            mimeType: 'image/png'
          }],
          aspectRatio: '9:16',
          resolution: '2K'
        });
      }
    }

    return NextResponse.json({
      success: true,
      prompt: promptResult.prompt,
      cameraView: promptResult.cameraView,
      productPosition: promptResult.productPosition,
      image: imageResult?.success ? `data:image/png;base64,${imageResult.images[0]?.base64}` : null
    });

  } catch (error) {
    console.error('Generate character error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
