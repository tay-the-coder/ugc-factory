import { NextResponse } from 'next/server';
import marketResearch from '../../../lib/market-research.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      productName, 
      productCategory = 'general',
      productAnalysis = null,
      targetAudience = '',
      supportingDocs = [],
      step = 'full' // 'full', 'reddit', 'amazon', 'avatar', 'angles'
    } = body;

    if (!productName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product name is required' 
      }, { status: 400 });
    }

    let result;

    switch (step) {
      case 'reddit':
        result = await marketResearch.searchReddit(
          productName, 
          productCategory, 
          supportingDocs, 
          productAnalysis
        );
        break;
      
      case 'amazon':
        result = await marketResearch.analyzeAmazonReviews(
          productName, 
          productCategory, 
          supportingDocs, 
          productAnalysis
        );
        break;
      
      case 'avatar':
        if (!body.redditData || !body.amazonData) {
          return NextResponse.json({ 
            success: false, 
            error: 'Reddit and Amazon data required for avatar building' 
          }, { status: 400 });
        }
        result = await marketResearch.buildCustomerAvatar(
          productName, 
          targetAudience, 
          body.redditData, 
          body.amazonData,
          supportingDocs
        );
        break;
      
      case 'angles':
        if (!body.avatar || !body.redditData || !body.amazonData) {
          return NextResponse.json({ 
            success: false, 
            error: 'Avatar and research data required for angles generation' 
          }, { status: 400 });
        }
        result = await marketResearch.generateCreativeAngles(
          productName,
          body.avatar,
          body.redditData,
          body.amazonData
        );
        break;
      
      case 'full':
      default:
        // Build product object with analysis if available
        const product = productAnalysis 
          ? { ...productAnalysis, name: productName }
          : productName;
        
        result = await marketResearch.runFullResearch(
          product, 
          productCategory, 
          targetAudience,
          supportingDocs
        );
        break;
    }

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        partial: result.partial 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Market research error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
