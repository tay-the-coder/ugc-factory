import { NextResponse } from 'next/server';
import gemini from '../../../lib/gemini.js';
import promptEngine from '../../../lib/prompt-engine.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      characterImage,
      segment,
      characterContext,
      customPrompt
    } = body;

    if (!characterImage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Character image is required' 
      }, { status: 400 });
    }

    if (!segment?.text && !customPrompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Segment text or custom prompt is required' 
      }, { status: 400 });
    }

    let veoPrompt = customPrompt;

    // Generate Veo prompt if not provided
    if (!veoPrompt && segment) {
      const result = await promptEngine.generateVeoPrompts([segment], characterContext);
      if (result.success && result.prompts[0]) {
        veoPrompt = result.prompts[0].veoPrompt;
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to generate Veo prompt' 
        }, { status: 500 });
      }
    }

    // Extract base64 from data URL if needed
    const imageBase64 = characterImage.includes('base64,') 
      ? characterImage.split('base64,')[1]
      : characterImage;

    // Generate video with Veo 3.1
    const result = await gemini.generateVideo(veoPrompt, {
      referenceImage: {
        base64: imageBase64,
        mimeType: 'image/png'
      },
      duration: '8s',
      aspectRatio: '9:16'
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      prompt: veoPrompt,
      segment: segment?.segment
    });

  } catch (error) {
    console.error('Generate A-Roll error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
