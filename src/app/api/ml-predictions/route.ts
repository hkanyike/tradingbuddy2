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
    const assetId = searchParams.get('assetId');
    const predictionType = searchParams.get('predictionType');

    let query = db.select().from(mlPredictions);

    const conditions = [];

    if (modelId) {
      const modelIdInt = parseInt(modelId);
      if (isNaN(modelIdInt)) {
        return NextResponse.json(
          { error: 'Invalid modelId', code: 'INVALID_MODEL_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(mlPredictions.modelId, modelIdInt));
    }

    if (assetId) {
      const assetIdInt = parseInt(assetId);
      if (isNaN(assetIdInt)) {
        return NextResponse.json(
          { error: 'Invalid assetId', code: 'INVALID_ASSET_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(mlPredictions.assetId, assetIdInt));
    }

    if (predictionType) {
      if (!validatePredictionType(predictionType)) {
        return NextResponse.json(
          {
            error: `Invalid predictionType. Must be one of: ${PREDICTION_TYPES.join(', ')}`,
            code: 'INVALID_PREDICTION_TYPE'
          },
          { status: 400 }
        );
      }
      conditions.push(eq(mlPredictions.predictionType, predictionType));
    }

    const results = conditions.length > 0
      ? await query.where(and(...conditions))
          .orderBy(desc(mlPredictions.timestamp))
          .limit(limit)
          .offset(offset)
      : await query
          .orderBy(desc(mlPredictions.timestamp))
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
      assetId,
      predictionType,
      predictedValue,
      confidenceScore,
      featureVector,
      timestamp,
      validUntil,
      actualValue,
      predictionError
    } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required', code: 'MISSING_MODEL_ID' },
        { status: 400 }
      );
    }

    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId is required', code: 'MISSING_ASSET_ID' },
        { status: 400 }
      );
    }

    if (!predictionType) {
      return NextResponse.json(
        { error: 'predictionType is required', code: 'MISSING_PREDICTION_TYPE' },
        { status: 400 }
      );
    }

    if (!validatePredictionType(predictionType)) {
      return NextResponse.json(
        {
          error: `Invalid predictionType. Must be one of: ${PREDICTION_TYPES.join(', ')}`,
          code: 'INVALID_PREDICTION_TYPE'
        },
        { status: 400 }
      );
    }

    if (predictedValue === undefined || predictedValue === null) {
      return NextResponse.json(
        { error: 'predictedValue is required', code: 'MISSING_PREDICTED_VALUE' },
        { status: 400 }
      );
    }

    if (confidenceScore === undefined || confidenceScore === null) {
      return NextResponse.json(
        { error: 'confidenceScore is required', code: 'MISSING_CONFIDENCE_SCORE' },
        { status: 400 }
      );
    }

    if (!validateConfidenceScore(confidenceScore)) {
      return NextResponse.json(
        { error: 'confidenceScore must be between 0 and 1', code: 'INVALID_CONFIDENCE_SCORE' },
        { status: 400 }
      );
    }

    if (!featureVector) {
      return NextResponse.json(
        { error: 'featureVector is required', code: 'MISSING_FEATURE_VECTOR' },
        { status: 400 }
      );
    }

    const featureVectorStr = typeof featureVector === 'string' 
      ? featureVector 
      : JSON.stringify(featureVector);

    if (!validateJSON(featureVectorStr)) {
      return NextResponse.json(
        { error: 'featureVector must be valid JSON', code: 'INVALID_FEATURE_VECTOR' },
        { status: 400 }
      );
    }

    if (!timestamp) {
      return NextResponse.json(
        { error: 'timestamp is required', code: 'MISSING_TIMESTAMP' },
        { status: 400 }
      );
    }

    if (!validateISOTimestamp(timestamp)) {
      return NextResponse.json(
        { error: 'timestamp must be a valid ISO 8601 timestamp', code: 'INVALID_TIMESTAMP' },
        { status: 400 }
      );
    }

    if (!validUntil) {
      return NextResponse.json(
        { error: 'validUntil is required', code: 'MISSING_VALID_UNTIL' },
        { status: 400 }
      );
    }

    if (!validateISOTimestamp(validUntil)) {
      return NextResponse.json(
        { error: 'validUntil must be a valid ISO 8601 timestamp', code: 'INVALID_VALID_UNTIL' },
        { status: 400 }
      );
    }

    const model = await db
      .select()
      .from(mlModels)
      .where(eq(mlModels.id, parseInt(modelId)))
      .limit(1);

    if (model.length === 0) {
      return NextResponse.json(
        { error: 'Model not found', code: 'MODEL_NOT_FOUND' },
        { status: 404 }
      );
    }

    const asset = await db
      .select()
      .from(assets)
      .where(eq(assets.id, parseInt(assetId)))
      .limit(1);

    if (asset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const newPrediction = await db
      .insert(mlPredictions)
      .values({
        modelId: parseInt(modelId),
        assetId: parseInt(assetId),
        predictionType,
        predictedValue: parseFloat(predictedValue),
        confidenceScore: parseFloat(confidenceScore),
        featureVector: featureVectorStr,
        timestamp,
        validUntil,
        actualValue: actualValue !== undefined && actualValue !== null ? parseFloat(actualValue) : null,
        predictionError: predictionError !== undefined && predictionError !== null ? parseFloat(predictionError) : null
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
      
      const calculatedError = Math.abs(actualValueFloat - existing[0].predictedValue);
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
