import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mlModels, mlTrainingRuns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    // Extract and validate model ID from URL params
    const { id: modelId } = await params;
    if (!modelId) {
      return NextResponse.json(
        { error: 'Valid model ID is required', code: 'INVALID_MODEL_ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const requestBody = await request.json();
    const {
      datasetStartDate,
      datasetEndDate,
      trainingSamples,
      validationSamples
    } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED'
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!datasetStartDate) {
      return NextResponse.json(
        { error: 'Dataset start date is required', code: 'MISSING_DATASET_START_DATE' },
        { status: 400 }
      );
    }

    if (!datasetEndDate) {
      return NextResponse.json(
        { error: 'Dataset end date is required', code: 'MISSING_DATASET_END_DATE' },
        { status: 400 }
      );
    }

    if (trainingSamples === undefined || trainingSamples === null) {
      return NextResponse.json(
        { error: 'Training samples count is required', code: 'MISSING_TRAINING_SAMPLES' },
        { status: 400 }
      );
    }

    if (validationSamples === undefined || validationSamples === null) {
      return NextResponse.json(
        { error: 'Validation samples count is required', code: 'MISSING_VALIDATION_SAMPLES' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (typeof trainingSamples !== 'number' || trainingSamples <= 0) {
      return NextResponse.json(
        { error: 'Training samples must be a positive number', code: 'INVALID_TRAINING_SAMPLES' },
        { status: 400 }
      );
    }

    if (typeof validationSamples !== 'number' || validationSamples <= 0) {
      return NextResponse.json(
        { error: 'Validation samples must be a positive number', code: 'INVALID_VALIDATION_SAMPLES' },
        { status: 400 }
      );
    }

    // Validate date format and logic
    const startDate = new Date(datasetStartDate);
    const endDate = new Date(datasetEndDate);

    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid dataset start date format', code: 'INVALID_START_DATE' },
        { status: 400 }
      );
    }

    if (isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid dataset end date format', code: 'INVALID_END_DATE' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'Dataset end date must be after start date', code: 'INVALID_DATE_RANGE' },
        { status: 400 }
      );
    }

    // Verify ML model exists (ID is string in schema)
    const model = await db
      .select()
      .from(mlModels)
      .where(eq(mlModels.id, modelId))
      .limit(1);

    if (model.length === 0) {
      return NextResponse.json(
        { error: 'ML model not found', code: 'MODEL_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create new training run record
    const runId = `${modelId}-${Date.now()}`;
    const newTrainingRun = await db
      .insert(mlTrainingRuns)
      .values({
        id: runId,
        modelId: modelId,
        experimentId: `exp-${Date.now()}`,
        runName: `Training run ${new Date().toISOString()}`,
        status: 'running',
        startTime: Date.now(),
        endTime: null,
        metrics: JSON.stringify({}),
        parameters: JSON.stringify({
          datasetStartDate,
          datasetEndDate,
          trainingSamples,
          validationSamples,
        }),
        tags: JSON.stringify({ userId: user.id }),
        artifacts: JSON.stringify([]),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newTrainingRun[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/ml-models/[id]/train error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}