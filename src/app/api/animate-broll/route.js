import { NextResponse } from 'next/server';
import kling from '../../../lib/kling.js';
import promptEngine from '../../../lib/prompt-engine.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      brollImage,
      segment,
      brollPrompt,
      customPrompt,
      mode = 'std',
      duration = '5'
    } = body;

    if (!brollImage) {
      return NextResponse.json({ 
        success: false, 
        error: 'B-roll image is required' 
      }, { status: 400 });
    }

    let klingPrompt = customPrompt;

    // Generate Kling prompt if not provided
    if (!klingPrompt && segment && brollPrompt) {
      const result = await promptEngine.generateKlingPrompts(
        [{ imagePrompt: brollPrompt }],
        [segment]
      );
      if (result.success && result.prompts[0]) {
        klingPrompt = result.prompts[0].klingPrompt;
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to generate Kling prompt' 
        }, { status: 500 });
      }
    }

    if (!klingPrompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Animation prompt is required' 
      }, { status: 400 });
    }

    // Extract base64
    const imageBase64 = brollImage.includes('base64,') 
      ? brollImage.split('base64,')[1]
      : brollImage;

    // Create Kling video task
    const result = await kling.generateVideo(imageBase64, klingPrompt, {
      mode,
      duration,
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
      taskId: result.taskId,
      status: result.status,
      prompt: klingPrompt,
      segment: segment?.segment
    });

  } catch (error) {
    console.error('Animate B-Roll error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET endpoint to check animation status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Task ID is required' 
      }, { status: 400 });
    }

    const status = await kling.getTaskStatus(taskId);

    return NextResponse.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('Check animation status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
