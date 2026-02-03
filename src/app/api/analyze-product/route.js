import { NextResponse } from 'next/server';
import openai from '../../../lib/openai.js';

/**
 * POST /api/analyze-product
 * Analyze product image(s) with GPT-4 Vision
 * Returns structured product data for Claude copywriting
 * 
 * Body:
 * - image: base64 string or data URL (single image)
 * - images: array of { base64, mimeType } (multiple angles)
 * - context: { brandName?, price?, productUrl?, additionalInfo? }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { image, images, context = {} } = body;

    // Validate input
    if (!image && (!images || images.length === 0)) {
      return NextResponse.json({
        success: false,
        error: 'No image provided. Send "image" (single) or "images" (array).'
      }, { status: 400 });
    }

    let result;

    if (images && images.length > 1) {
      // Multiple images - analyze all angles
      const processedImages = images.map(img => {
        // Handle data URLs
        if (typeof img === 'string') {
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            return { base64: match[2], mimeType: match[1] };
          }
          return { base64: img, mimeType: 'image/png' };
        }
        return img;
      });

      result = await openai.analyzeProductMultiImage(processedImages, context);
    } else {
      // Single image
      let imageBase64 = image || images[0];
      let mimeType = 'image/png';

      // Handle data URL format
      if (typeof imageBase64 === 'string') {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          imageBase64 = match[2];
        }
      } else if (imageBase64.base64) {
        mimeType = imageBase64.mimeType || 'image/png';
        imageBase64 = imageBase64.base64;
      }

      result = await openai.analyzeProduct(imageBase64, mimeType, context);
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        raw: result.raw
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product: result.product,
      usage: result.usage
    });

  } catch (error) {
    console.error('Analyze product error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
