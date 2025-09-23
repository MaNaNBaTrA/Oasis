import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image base64 data is required' },
        { status: 400 }
      );
    }

    if (!process.env.ROBOFLOW_API_KEY) {
      return NextResponse.json(
        { error: 'Roboflow API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      'https://serverless.roboflow.com/infer/workflows/arthur-occvc/small-object-detection-sahi',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: process.env.ROBOFLOW_API_KEY,
          inputs: {
            image: {
              type: 'base64',
              value: imageBase64,
            },
            model_id: 'arthur-occvc/helmet-glove-mask-vest-person-fmk3g/2',
            confidence: 0.75,
            overlap_threshold: 0.5,
            slice_height: 416,
            slice_width: 416,
            overlap_height_ratio: 0.2,
            overlap_width_ratio: 0.2
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Roboflow API error:', errorText);
      throw new Error(`Roboflow API error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in PPE detection:', error);
    return NextResponse.json(
      { error: 'Failed to process PPE detection' },
      { status: 500 }
    );
  }
}