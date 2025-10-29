import { NextRequest, NextResponse } from 'next/server';
import { modelService } from '@/lib/ml/model-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// GET /api/ml/models - Get all trained models
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const models = modelService.getModels();
    return NextResponse.json({ models }, { status: 200 });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/ml/models - Train a new model
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
    const { config, data } = body;

    if (!config || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: config, data', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Validate config
    const requiredConfigFields = ['name', 'type', 'algorithm', 'features', 'target'];
    for (const field of requiredConfigFields) {
      if (!config[field]) {
        return NextResponse.json(
          { error: `Missing required config field: ${field}`, code: 'INVALID_CONFIG' },
          { status: 400 }
        );
      }
    }

    // Validate data
    if (!Array.isArray(data.features) || !Array.isArray(data.targets)) {
      return NextResponse.json(
        { error: 'Data must contain features and targets arrays', code: 'INVALID_DATA' },
        { status: 400 }
      );
    }

    if (data.features.length !== data.targets.length) {
      return NextResponse.json(
        { error: 'Features and targets must have the same length', code: 'INVALID_DATA' },
        { status: 400 }
      );
    }

    const model = await modelService.trainModel(config, data);
    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    console.error('Error training model:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
