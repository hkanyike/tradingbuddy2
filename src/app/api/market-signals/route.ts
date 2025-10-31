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
    const symbol = searchParams.get('symbol');
    const source = searchParams.get('source');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(marketSignals.symbol, `%${search}%`),
          like(marketSignals.signalType, `%${search}%`),
          like(marketSignals.source, `%${search}%`),
          like(marketSignals.reasoning, `%${search}%`)
        )
      );
    }

    if (signalType) {
      conditions.push(eq(marketSignals.signalType, signalType));
    }

    if (symbol) {
      conditions.push(eq(marketSignals.symbol, symbol));
    }

    if (source) {
      conditions.push(eq(marketSignals.source, source));
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
      symbol,
      signalType,
      strength,
      confidence,
      reasoning,
      source,
      expiresAt,
    } = body;

    // Validation: Required fields
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required', code: 'MISSING_SYMBOL' },
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
    const validSignalTypes = ['buy', 'sell', 'hold'];
    if (!validSignalTypes.includes(signalType)) {
      return NextResponse.json(
        {
          error: `Signal type must be one of: ${validSignalTypes.join(', ')}`,
          code: 'INVALID_SIGNAL_TYPE',
        },
        { status: 400 }
      );
    }

    // Validation: Strength must be between 0 and 1 if provided
    if (strength !== undefined && strength !== null) {
      const strengthVal = parseFloat(strength);
      if (isNaN(strengthVal) || strengthVal < 0 || strengthVal > 1) {
        return NextResponse.json(
          { error: 'Strength must be between 0 and 1', code: 'INVALID_STRENGTH' },
          { status: 400 }
        );
      }
    }

    // Validation: Confidence must be between 0 and 1 if provided
    if (confidence !== undefined && confidence !== null) {
      const confidenceVal = parseFloat(confidence);
      if (isNaN(confidenceVal) || confidenceVal < 0 || confidenceVal > 1) {
        return NextResponse.json(
          { error: 'Confidence must be between 0 and 1', code: 'INVALID_CONFIDENCE' },
          { status: 400 }
        );
      }
    }

    if (!reasoning) {
      return NextResponse.json(
        { error: 'Reasoning is required', code: 'MISSING_REASONING' },
        { status: 400 }
      );
    }

    if (!source) {
      return NextResponse.json(
        { error: 'Source is required', code: 'MISSING_SOURCE' },
        { status: 400 }
      );
    }

    // Prepare insert data with auto-generated fields
    const newSignal = await db
      .insert(marketSignals)
      .values({
        symbol: symbol.trim().toUpperCase(),
        signalType: signalType.trim(),
        strength: strength !== undefined ? parseFloat(strength) : 0.5,
        confidence: confidence !== undefined ? parseFloat(confidence) : 0.5,
        reasoning: reasoning.trim(),
        source: source.trim(),
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt || null,
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
      symbol,
      signalType,
      strength,
      confidence,
      reasoning,
      source,
      expiresAt,
    } = body;

    // Validation: If signalType is being updated, it must be valid
    if (signalType !== undefined) {
      const validSignalTypes = ['buy', 'sell', 'hold'];
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

    // Validation: Strength must be between 0 and 1 if provided
    if (strength !== undefined && strength !== null) {
      const strengthVal = parseFloat(strength);
      if (isNaN(strengthVal) || strengthVal < 0 || strengthVal > 1) {
        return NextResponse.json(
          { error: 'Strength must be between 0 and 1', code: 'INVALID_STRENGTH' },
          { status: 400 }
        );
      }
    }

    // Validation: Confidence must be between 0 and 1 if provided
    if (confidence !== undefined && confidence !== null) {
      const confidenceVal = parseFloat(confidence);
      if (isNaN(confidenceVal) || confidenceVal < 0 || confidenceVal > 1) {
        return NextResponse.json(
          { error: 'Confidence must be between 0 and 1', code: 'INVALID_CONFIDENCE' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: any = {};

    if (symbol !== undefined) updates.symbol = symbol.trim().toUpperCase();
    if (signalType !== undefined) updates.signalType = signalType.trim();
    if (strength !== undefined) updates.strength = strength !== null ? parseFloat(strength) : null;
    if (confidence !== undefined) updates.confidence = confidence !== null ? parseFloat(confidence) : null;
    if (reasoning !== undefined) updates.reasoning = reasoning.trim();
    if (source !== undefined) updates.source = source.trim();
    if (expiresAt !== undefined) updates.expiresAt = expiresAt || null;

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
