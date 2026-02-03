import { NextResponse } from 'next/server';
import elevenlabs from '../../../lib/elevenlabs.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      text,
      voiceId,
      segments,
      stability = 0.5,
      similarityBoost = 0.75,
      style = 0.0
    } = body;

    // Handle single text or multiple segments
    const textsToProcess = segments || [{ text, segment: 1 }];

    if (!textsToProcess.length || !textsToProcess[0].text) {
      return NextResponse.json({ 
        success: false, 
        error: 'Text is required' 
      }, { status: 400 });
    }

    const results = [];

    for (const item of textsToProcess) {
      const result = await elevenlabs.textToSpeechBase64(item.text, {
        voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM', // Rachel default
        stability,
        similarityBoost,
        style
      });

      if (!result.success) {
        results.push({
          segment: item.segment,
          success: false,
          error: 'TTS generation failed'
        });
        continue;
      }

      results.push({
        segment: item.segment,
        text: item.text,
        success: true,
        audioBase64: result.audioBase64,
        contentType: result.contentType,
        estimatedDuration: elevenlabs.estimateDuration(item.text)
      });
    }

    const allSuccess = results.every(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      results,
      totalSegments: results.length,
      successCount: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Generate voice error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Estimate duration endpoint
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');

    if (!text) {
      return NextResponse.json({ 
        success: false, 
        error: 'Text parameter is required' 
      }, { status: 400 });
    }

    const duration = elevenlabs.estimateDuration(text);

    return NextResponse.json({
      success: true,
      text,
      estimatedDuration: duration,
      wordCount: text.split(/\s+/).length
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
