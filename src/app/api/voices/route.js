import { NextResponse } from 'next/server';
import elevenlabs from '../../../lib/elevenlabs.js';

export async function GET() {
  try {
    const voices = await elevenlabs.getVoices();

    // Filter and sort for UGC-appropriate voices
    const ugcVoices = voices
      .filter(v => 
        v.category === 'premade' || 
        v.category === 'professional' ||
        v.labels?.['use case']?.includes('conversational')
      )
      .map(v => ({
        id: v.id,
        name: v.name,
        category: v.category,
        description: v.labels?.description || '',
        accent: v.labels?.accent || 'American',
        gender: v.labels?.gender || 'unknown',
        age: v.labels?.age || 'adult',
        previewUrl: v.previewUrl
      }));

    return NextResponse.json({
      success: true,
      voices: ugcVoices,
      total: ugcVoices.length
    });

  } catch (error) {
    console.error('Get voices error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
