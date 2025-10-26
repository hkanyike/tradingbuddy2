import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { volatilityForecasts, mlModels, assets } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_FORECAST_TYPES = ['HAR_RV', 'GARCH', 'EWMA', 'IMPLIED'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const forecast = await db.select()
        .from(volatilityForecasts)
        .where(eq(volatilityForecasts.id, parseInt(id)))
        .limit(1);

      if (forecast.length === 0) {
        return NextResponse.json({ 
          error: 'Volatility forecast not found',
          code: 'FORECAST_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(forecast[0]);
    }

    // List with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const modelId = searchParams.get('modelId');
    const assetId = searchParams.get('assetId');
    const forecastType = searchParams.get('forecastType');
    const forecastHorizonDays = searchParams.get('forecastHorizonDays');

    let query = db.select().from(volatilityForecasts);

    // Build filter conditions
    const conditions = [];
    
    if (modelId) {
      const modelIdInt = parseInt(modelId);
      if (!isNaN(modelIdInt)) {
        conditions.push(eq(volatilityForecasts.modelId, modelIdInt));
      }
    }

    if (assetId) {
      const assetIdInt = parseInt(assetId);
      if (!isNaN(assetIdInt)) {
        conditions.push(eq(volatilityForecasts.assetId, assetIdInt));
      }
    }

    if (forecastType) {
      if (!VALID_FORECAST_TYPES.includes(forecastType)) {
        return NextResponse.json({ 
          error: `Invalid forecast type. Must be one of: ${VALID_FORECAST_TYPES.join(', ')}`,
          code: 'INVALID_FORECAST_TYPE' 
        }, { status: 400 });
      }
      conditions.push(eq(volatilityForecasts.forecastType, forecastType));
    }

    if (forecastHorizonDays) {
      const horizonDays = parseInt(forecastHorizonDays);
      if (!isNaN(horizonDays) && horizonDays > 0) {
        conditions.push(eq(volatilityForecasts.forecastHorizonDays, horizonDays));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(volatilityForecasts.timestamp))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      modelId,
      assetId,
      forecastType,
      forecastHorizonDays,
      forecastedVolatility,
      confidenceLower,
      confidenceUpper,
      timestamp,
      realizedVolatility,
      forecastError
    } = body;

    // Validate required fields
    if (!modelId) {
      return NextResponse.json({ 
        error: "modelId is required",
        code: "MISSING_MODEL_ID" 
      }, { status: 400 });
    }

    if (!assetId) {
      return NextResponse.json({ 
        error: "assetId is required",
        code: "MISSING_ASSET_ID" 
      }, { status: 400 });
    }

    if (!forecastType) {
      return NextResponse.json({ 
        error: "forecastType is required",
        code: "MISSING_FORECAST_TYPE" 
      }, { status: 400 });
    }

    if (!forecastHorizonDays) {
      return NextResponse.json({ 
        error: "forecastHorizonDays is required",
        code: "MISSING_FORECAST_HORIZON_DAYS" 
      }, { status: 400 });
    }

    if (forecastedVolatility === undefined || forecastedVolatility === null) {
      return NextResponse.json({ 
        error: "forecastedVolatility is required",
        code: "MISSING_FORECASTED_VOLATILITY" 
      }, { status: 400 });
    }

    if (confidenceLower === undefined || confidenceLower === null) {
      return NextResponse.json({ 
        error: "confidenceLower is required",
        code: "MISSING_CONFIDENCE_LOWER" 
      }, { status: 400 });
    }

    if (confidenceUpper === undefined || confidenceUpper === null) {
      return NextResponse.json({ 
        error: "confidenceUpper is required",
        code: "MISSING_CONFIDENCE_UPPER" 
      }, { status: 400 });
    }

    if (!timestamp) {
      return NextResponse.json({ 
        error: "timestamp is required",
        code: "MISSING_TIMESTAMP" 
      }, { status: 400 });
    }

    // Validate forecastType enum
    if (!VALID_FORECAST_TYPES.includes(forecastType)) {
      return NextResponse.json({ 
        error: `Invalid forecast type. Must be one of: ${VALID_FORECAST_TYPES.join(', ')}`,
        code: 'INVALID_FORECAST_TYPE' 
      }, { status: 400 });
    }

    // Validate forecastHorizonDays is positive
    if (forecastHorizonDays <= 0) {
      return NextResponse.json({ 
        error: "forecastHorizonDays must be greater than 0",
        code: "INVALID_FORECAST_HORIZON_DAYS" 
      }, { status: 400 });
    }

    // Validate confidence intervals
    if (confidenceLower >= forecastedVolatility || forecastedVolatility >= confidenceUpper) {
      return NextResponse.json({ 
        error: "Confidence interval must satisfy: confidenceLower < forecastedVolatility < confidenceUpper",
        code: "INVALID_CONFIDENCE_INTERVAL" 
      }, { status: 400 });
    }

    // Validate modelId exists
    const model = await db.select()
      .from(mlModels)
      .where(eq(mlModels.id, modelId))
      .limit(1);

    if (model.length === 0) {
      return NextResponse.json({ 
        error: "Model not found",
        code: "MODEL_NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate assetId exists
    const asset = await db.select()
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);

    if (asset.length === 0) {
      return NextResponse.json({ 
        error: "Asset not found",
        code: "ASSET_NOT_FOUND" 
      }, { status: 404 });
    }

    // Calculate forecastError if realizedVolatility is provided
    let calculatedForecastError = forecastError;
    if (realizedVolatility !== undefined && realizedVolatility !== null) {
      calculatedForecastError = Math.abs(realizedVolatility - forecastedVolatility);
    }

    // Insert new volatility forecast
    const newForecast = await db.insert(volatilityForecasts)
      .values({
        modelId,
        assetId,
        forecastType,
        forecastHorizonDays,
        forecastedVolatility,
        confidenceLower,
        confidenceUpper,
        timestamp,
        realizedVolatility: realizedVolatility ?? null,
        forecastError: calculatedForecastError ?? null,
      })
      .returning();

    return NextResponse.json(newForecast[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { realizedVolatility, forecastError } = body;

    // Check if forecast exists
    const existingForecast = await db.select()
      .from(volatilityForecasts)
      .where(eq(volatilityForecasts.id, parseInt(id)))
      .limit(1);

    if (existingForecast.length === 0) {
      return NextResponse.json({ 
        error: 'Volatility forecast not found',
        code: 'FORECAST_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      realizedVolatility?: number | null;
      forecastError?: number | null;
    } = {};

    if (realizedVolatility !== undefined) {
      updateData.realizedVolatility = realizedVolatility;
      
      // Auto-calculate forecastError if realizedVolatility provided
      updateData.forecastError = Math.abs(
        realizedVolatility - existingForecast[0].forecastedVolatility
      );
    } else if (forecastError !== undefined) {
      updateData.forecastError = forecastError;
    }

    // Perform update
    const updated = await db.update(volatilityForecasts)
      .set(updateData)
      .where(eq(volatilityForecasts.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if forecast exists
    const existingForecast = await db.select()
      .from(volatilityForecasts)
      .where(eq(volatilityForecasts.id, parseInt(id)))
      .limit(1);

    if (existingForecast.length === 0) {
      return NextResponse.json({ 
        error: 'Volatility forecast not found',
        code: 'FORECAST_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the forecast
    const deleted = await db.delete(volatilityForecasts)
      .where(eq(volatilityForecasts.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Volatility forecast deleted successfully',
      data: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}