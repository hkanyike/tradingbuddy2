import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mlModels, mlPredictions, assets } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: modelId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Validate model ID
    if (!modelId) {
      return NextResponse.json(
        { 
          error: 'Valid model ID is required',
          code: 'INVALID_MODEL_ID'
        },
        { status: 400 }
      );
    }

    // Verify ML model exists (ID is string in schema)
    const model = await db.select()
      .from(mlModels)
      .where(eq(mlModels.id, modelId))
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
    const symbol = searchParams.get('symbol');

    // Build where conditions - mlPredictions uses modelId (string) and symbol (string)
    const conditions = [eq(mlPredictions.modelId, modelId)];

    // Add optional filters
    if (symbol) {
      conditions.push(eq(mlPredictions.symbol, symbol));
    }

    // Query predictions with filters
    const whereCondition = conditions.length > 1 
      ? and(...conditions) 
      : conditions[0];

    const predictions = await db.select()
      .from(mlPredictions)
      .where(whereCondition)
      .orderBy(desc(mlPredictions.createdAt))
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