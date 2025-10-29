import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketSignals, assets } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const signal = await db
        .select()
        .from(marketSignals)
        .where(eq(marketSignals.id, parseInt(id)))
        .limit(1);

      if (signal.length === 0) {
        return NextResponse.json(
          { error: 'Market signal not found', code: 'SIGNAL_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(signal[0], { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const signalType = searchParams.get('signalType');
    const strategyType = searchParams.get('strategyType');
    const isExecuted = searchParams.get('isExecuted');
    const assetId = searchParams.get('assetId');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(marketSignals.signalType, `%${search}%`),
          like(marketSignals.strategyType, `%${search}%`),
          like(marketSignals.recommendedAction, `%${search}%`)
        )
      );
    }

    if (signalType) {
      conditions.push(eq(marketSignals.signalType, signalType));
    }

    if (strategyType) {
      conditions.push(eq(marketSignals.strategyType, strategyType));
    }

    if (isExecuted !== null && isExecuted !== undefined) {
      const isExecutedBool = isExecuted === 'true' || isExecuted === '1';
      conditions.push(eq(marketSignals.isExecuted, isExecutedBool));
    }

    if (assetId) {
      if (!isNaN(parseInt(assetId))) {
        conditions.push(eq(marketSignals.assetId, parseInt(assetId)));
      }
    }

    // Build and execute query with conditions
    const results = conditions.length > 0
      ? await db.select().from(marketSignals)
          .where(and(...conditions))
          .orderBy(order === 'asc' ? asc(marketSignals.createdAt) : desc(marketSignals.createdAt))
          .limit(limit)
          .offset(offset)
      : await db.select().from(marketSignals)
          .orderBy(order === 'asc' ? asc(marketSignals.createdAt) : desc(marketSignals.createdAt))
          .limit(limit)
          .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assetId,
      signalType,
      strategyType,
      confidenceScore,
      recommendedAction,
      ivPremium,
      skew,
      termStructure,
      liquidityScore,
      riskRewardRatio,
      isExecuted,
      validUntil,
    } = body;

    // Validation: Required fields
    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required', code: 'MISSING_ASSET_ID' },
        { status: 400 }
      );
    }

    if (!signalType) {
      return NextResponse.json(
        { error: 'Signal type is required', code: 'MISSING_SIGNAL_TYPE' },
        { status: 400 }
      );
    }

    // Validation: Signal type must be valid
    const validSignalTypes = ['entry', 'exit', 'hedge'];
    if (!validSignalTypes.includes(signalType)) {
      return NextResponse.json(
        {
          error: `Signal type must be one of: ${validSignalTypes.join(', ')}`,
          code: 'INVALID_SIGNAL_TYPE',
        },
        { status: 400 }
      );
    }

    // Validation: assetId must be a valid integer
    if (isNaN(parseInt(assetId))) {
      return NextResponse.json(
        { error: 'Asset ID must be a valid integer', code: 'INVALID_ASSET_ID' },
        { status: 400 }
      );
    }

    // Validation: Check if asset exists
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

    // Validation: Confidence score must be between 0 and 1 if provided
    if (confidenceScore !== undefined && confidenceScore !== null) {
      const score = parseFloat(confidenceScore);
      if (isNaN(score) || score < 0 || score > 1) {
        return NextResponse.json(
          { error: 'Confidence score must be between 0 and 1', code: 'INVALID_CONFIDENCE_SCORE' },
          { status: 400 }
        );
      }
    }

    // Prepare insert data with auto-generated fields
    const newSignal = await db
      .insert(marketSignals)
      .values({
        assetId: parseInt(assetId),
        signalType: signalType.trim(),
        strategyType: strategyType ? strategyType.trim() : null,
        confidenceScore: confidenceScore !== undefined ? parseFloat(confidenceScore) : null,
        recommendedAction: recommendedAction ? recommendedAction.trim() : null,
        ivPremium: ivPremium !== undefined ? parseFloat(ivPremium) : null,
        skew: skew !== undefined ? parseFloat(skew) : null,
        termStructure: termStructure || null,
        liquidityScore: liquidityScore !== undefined ? parseFloat(liquidityScore) : null,
        riskRewardRatio: riskRewardRatio !== undefined ? parseFloat(riskRewardRatio) : null,
        isExecuted: isExecuted !== undefined ? Boolean(isExecuted) : false,
        validUntil: validUntil || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newSignal[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(marketSignals)
      .where(eq(marketSignals.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Market signal not found', code: 'SIGNAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      assetId,
      signalType,
      strategyType,
      confidenceScore,
      recommendedAction,
      ivPremium,
      skew,
      termStructure,
      liquidityScore,
      riskRewardRatio,
      isExecuted,
      validUntil,
    } = body;

    // Validation: If signalType is being updated, it must be valid
    if (signalType !== undefined) {
      const validSignalTypes = ['entry', 'exit', 'hedge'];
      if (!validSignalTypes.includes(signalType)) {
        return NextResponse.json(
          {
            error: `Signal type must be one of: ${validSignalTypes.join(', ')}`,
            code: 'INVALID_SIGNAL_TYPE',
          },
          { status: 400 }
        );
      }
    }

    // Validation: If assetId is being updated, validate it exists
    if (assetId !== undefined) {
      if (isNaN(parseInt(assetId))) {
        return NextResponse.json(
          { error: 'Asset ID must be a valid integer', code: 'INVALID_ASSET_ID' },
          { status: 400 }
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
    }

    // Validation: Confidence score must be between 0 and 1 if provided
    if (confidenceScore !== undefined && confidenceScore !== null) {
      const score = parseFloat(confidenceScore);
      if (isNaN(score) || score < 0 || score > 1) {
        return NextResponse.json(
          { error: 'Confidence score must be between 0 and 1', code: 'INVALID_CONFIDENCE_SCORE' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: any = {};

    if (assetId !== undefined) updates.assetId = parseInt(assetId);
    if (signalType !== undefined) updates.signalType = signalType.trim();
    if (strategyType !== undefined) updates.strategyType = strategyType ? strategyType.trim() : null;
    if (confidenceScore !== undefined) updates.confidenceScore = confidenceScore !== null ? parseFloat(confidenceScore) : null;
    if (recommendedAction !== undefined) updates.recommendedAction = recommendedAction ? recommendedAction.trim() : null;
    if (ivPremium !== undefined) updates.ivPremium = ivPremium !== null ? parseFloat(ivPremium) : null;
    if (skew !== undefined) updates.skew = skew !== null ? parseFloat(skew) : null;
    if (termStructure !== undefined) updates.termStructure = termStructure || null;
    if (liquidityScore !== undefined) updates.liquidityScore = liquidityScore !== null ? parseFloat(liquidityScore) : null;
    if (riskRewardRatio !== undefined) updates.riskRewardRatio = riskRewardRatio !== null ? parseFloat(riskRewardRatio) : null;
    if (isExecuted !== undefined) updates.isExecuted = Boolean(isExecuted);
    if (validUntil !== undefined) updates.validUntil = validUntil || null;

    const updated = await db
      .update(marketSignals)
      .set(updates)
      .where(eq(marketSignals.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update market signal', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(marketSignals)
      .where(eq(marketSignals.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Market signal not found', code: 'SIGNAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(marketSignals)
      .where(eq(marketSignals.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete market signal', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Market signal deleted successfully',
        deletedSignal: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}
