import { NextRequest, NextResponse } from 'next/server';
import { modelService } from '@/lib/ml/model-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * POST /api/ml/models/[id]/predict - Get predictions from a specific model
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const model = modelService.getModel(id);

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (model.status !== 'ready') {
      return NextResponse.json(
        { error: 'Model is not ready for predictions', code: 'MODEL_NOT_READY', status: model.status },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { features } = body;

    if (!features || !Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Missing or invalid features array', code: 'INVALID_FEATURES' },
        { status: 400 }
      );
    }

    const predictions = await modelService.getPredictions(id, features);

    return NextResponse.json({ 
      predictions,
      modelId: id,
      modelName: model.name,
      modelVersion: model.version,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting predictions:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

