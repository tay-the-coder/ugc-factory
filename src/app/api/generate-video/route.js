import { NextResponse } from 'next/server';
import kling from '../../../lib/kling.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      imageBase64, 
      prompt,
      mode = 'std',
      duration = '5'
    } = body;

    if (!imageBase64 || !prompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image and prompt are required' 
      }, { status: 400 });
    }

    // Create video generation task
    const result = await kling.generateVideo(imageBase64, prompt, {
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
      status: result.status
    });

  } catch (error) {
    console.error('Generate video error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET endpoint to check task status
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
    console.error('Check video status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
