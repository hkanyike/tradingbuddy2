import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mlModels, mlPredictions, assets } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const modelId = params.id;
    const searchParams = request.nextUrl.searchParams;

    // Validate model ID
    if (!modelId || isNaN(parseInt(modelId))) {
      return NextResponse.json(
        { 
          error: 'Valid model ID is required',
          code: 'INVALID_MODEL_ID'
        },
        { status: 400 }
      );
    }

    const parsedModelId = parseInt(modelId);

    // Verify ML model exists
    const model = await db.select()
      .from(mlModels)
      .where(eq(mlModels.id, parsedModelId))
      .limit(1);

    if (model.length === 0) {
      return NextResponse.json(
        { 
          error: 'ML model not found',
          code: 'MODEL_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const assetId = searchParams.get('assetId');
    const predictionType = searchParams.get('predictionType');

    // Build where conditions
    const conditions = [eq(mlPredictions.modelId, parsedModelId)];

    // Add optional filters
    if (assetId && !isNaN(parseInt(assetId))) {
      conditions.push(eq(mlPredictions.assetId, parseInt(assetId)));
    }

    if (predictionType) {
      const validTypes = ['iv_forecast', 'volatility', 'win_probability', 'price_move', 'spread_payoff'];
      if (validTypes.includes(predictionType)) {
        conditions.push(eq(mlPredictions.predictionType, predictionType));
      } else {
        return NextResponse.json(
          { 
            error: 'Invalid prediction type. Must be one of: iv_forecast, volatility, win_probability, price_move, spread_payoff',
            code: 'INVALID_PREDICTION_TYPE'
          },
          { status: 400 }
        );
      }
    }

    // Query predictions with filters
    const whereCondition = conditions.length > 1 
      ? and(...conditions) 
      : conditions[0];

    const predictions = await db.select()
      .from(mlPredictions)
      .where(whereCondition)
      .orderBy(desc(mlPredictions.timestamp))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(predictions, { status: 200 });

  } catch (error) {
    console.error('GET /api/ml-models/[id]/predictions error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}