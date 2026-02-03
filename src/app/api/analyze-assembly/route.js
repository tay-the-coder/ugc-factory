import { NextResponse } from 'next/server';
import assemblyAnalyzer from '../../../lib/assembly-analyzer.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      script,
      segments,
      arollClips,
      brollClips,
      voiceoverUrl,
      productInfo
    } = body;

    if (!segments || segments.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Script segments are required' 
      }, { status: 400 });
    }

    // Analyze all assets with Gemini 3 Pro Thinking
    const result = await assemblyAnalyzer.analyzeForAssembly({
      script,
      segments,
      arollClips: arollClips || [],
      brollClips: brollClips || [],
      voiceoverUrl,
      productInfo
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    // Generate visual timeline
    const timeline = await assemblyAnalyzer.generateTimeline(
      result.analysis, 
      segments
    );

    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      timeline: timeline.success ? timeline.timeline : null,
      clipCount: result.clipCount
    });

  } catch (error) {
    console.error('Assembly analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
