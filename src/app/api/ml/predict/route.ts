import { NextRequest, NextResponse } from 'next/server';
import { modelService } from '@/lib/ml/model-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// POST /api/ml/predict - Get model predictions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { modelId, features } = body;

    if (!modelId || !features) {
      return NextResponse.json(
        { error: 'Missing required fields: modelId, features', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    if (!Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Features must be an array', code: 'INVALID_FEATURES' },
        { status: 400 }
      );
    }

    const predictions = await modelService.getPredictions(modelId, features);
    return NextResponse.json({ predictions }, { status: 200 });
  } catch (error) {
    console.error('Error getting predictions:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
