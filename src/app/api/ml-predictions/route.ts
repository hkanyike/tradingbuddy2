import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mlPredictions, mlModels, assets } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const PREDICTION_TYPES = [
  'iv_forecast',
  'volatility',
  'win_probability',
  'price_move',
  'spread_payoff'
] as const;

function validatePredictionType(type: string): boolean {
  return PREDICTION_TYPES.includes(type as any);
}

function validateConfidenceScore(score: number): boolean {
  return score >= 0 && score <= 1;
}

function validateISOTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString() === timestamp;
}

function validateJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const prediction = await db
        .select()
        .from(mlPredictions)
        .where(eq(mlPredictions.id, parseInt(id)))
        .limit(1);

      if (prediction.length === 0) {
        return NextResponse.json(
          { error: 'Prediction not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(prediction[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const modelId = searchParams.get('modelId');
    const symbol = searchParams.get('symbol');

    let query = db.select().from(mlPredictions);

    const conditions = [];

    if (modelId) {
      conditions.push(eq(mlPredictions.modelId, modelId));
    }

    if (symbol) {
      conditions.push(eq(mlPredictions.symbol, symbol));
    }

    const results = conditions.length > 0
      ? await query.where(and(...conditions))
          .orderBy(desc(mlPredictions.createdAt))
          .limit(limit)
          .offset(offset)
      : await query
          .orderBy(desc(mlPredictions.createdAt))
          .limit(limit)
          .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      modelId,
      symbol,
      prediction,
      confidence,
      features,
      actualValue,
      predictionError
    } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required', code: 'MISSING_MODEL_ID' },
        { status: 400 }
      );
    }

    if (!symbol) {
      return NextResponse.json(
        { error: 'symbol is required', code: 'MISSING_SYMBOL' },
        { status: 400 }
      );
    }

    if (prediction === undefined || prediction === null) {
      return NextResponse.json(
        { error: 'prediction is required', code: 'MISSING_PREDICTION' },
        { status: 400 }
      );
    }

    if (confidence === undefined || confidence === null) {
      return NextResponse.json(
        { error: 'confidence is required', code: 'MISSING_CONFIDENCE' },
        { status: 400 }
      );
    }

    if (!validateConfidenceScore(confidence)) {
      return NextResponse.json(
        { error: 'confidence must be between 0 and 1', code: 'INVALID_CONFIDENCE' },
        { status: 400 }
      );
    }

    // Verify model exists
    const model = await db
      .select()
      .from(mlModels)
      .where(eq(mlModels.id, modelId))
      .limit(1);

    if (model.length === 0) {
      return NextResponse.json(
        { error: 'Model not found', code: 'MODEL_NOT_FOUND' },
        { status: 404 }
      );
    }

    const featuresStr = features
      ? (typeof features === 'string' ? features : JSON.stringify(features))
      : null;

    if (featuresStr && !validateJSON(featuresStr)) {
      return NextResponse.json(
        { error: 'features must be valid JSON', code: 'INVALID_FEATURES' },
        { status: 400 }
      );
    }

    const newPrediction = await db
      .insert(mlPredictions)
      .values({
        modelId,
        symbol: symbol.toUpperCase(),
        prediction: parseFloat(prediction),
        confidence: parseFloat(confidence),
        features: featuresStr,
        actualValue: actualValue !== undefined && actualValue !== null ? parseFloat(actualValue) : null,
        predictionError: predictionError !== undefined && predictionError !== null ? parseFloat(predictionError) : null,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newPrediction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { actualValue, predictionError } = body;

    const existing = await db
      .select()
      .from(mlPredictions)
      .where(eq(mlPredictions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Prediction not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: any = {};

    if (actualValue !== undefined && actualValue !== null) {
      const actualValueFloat = parseFloat(actualValue);
      updates.actualValue = actualValueFloat;
      
      const calculatedError = Math.abs(actualValueFloat - existing[0].prediction);
      updates.predictionError = calculatedError;
    } else if (predictionError !== undefined && predictionError !== null) {
      updates.predictionError = parseFloat(predictionError);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(mlPredictions)
      .set(updates)
      .where(eq(mlPredictions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(mlPredictions)
      .where(eq(mlPredictions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Prediction not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(mlPredictions)
      .where(eq(mlPredictions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Prediction deleted successfully',
        prediction: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
