import { NextResponse } from 'next/server';
import marketResearch from '../../../lib/market-research.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      productName, 
      productAnalysis = null,
      targetAudience = '',
      supportingDocs = [],
    } = body;

    if (!productName && !productAnalysis) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product name or analysis is required' 
      }, { status: 400 });
    }

    // Run the synthesis with Opus 4.5
    const result = await marketResearch.synthesizeResearch(
      productAnalysis || { name: productName },
      supportingDocs,
      targetAudience
    );

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      research: result.research
    });

  } catch (error) {
    console.error('Market research error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
