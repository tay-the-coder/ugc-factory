import { NextResponse } from 'next/server';
import promptEngine from '../../../lib/prompt-engine.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { script } = body;

    if (!script) {
      return NextResponse.json({ 
        success: false, 
        error: 'Script is required' 
      }, { status: 400 });
    }

    // Split script into segments using Claude
    const result = await promptEngine.chunkScript(script);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      segments: result.segments,
      totalSegments: result.totalSegments
    });

  } catch (error) {
    console.error('Chunk script error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
