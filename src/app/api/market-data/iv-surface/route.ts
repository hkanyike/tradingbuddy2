import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ivSurfaceSnapshots } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// GET method - Query IV surface snapshots
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const symbol = searchParams.get('symbol');
    const date = searchParams.get('date');
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(ivSurfaceSnapshots)
        .where(eq(ivSurfaceSnapshots.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'IV surface snapshot not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }

    // Query by symbol and date (required for surface queries)
    if (!symbol || !date) {
      return NextResponse.json({ 
        error: "Both 'symbol' and 'date' parameters are required",
        code: "MISSING_REQUIRED_PARAMETERS" 
      }, { status: 400 });
    }

    // Build query with filters
    let conditions = [
      eq(ivSurfaceSnapshots.symbol, symbol.toUpperCase().trim()),
      eq(ivSurfaceSnapshots.snapshotDate, date.trim())
    ];

    // Add option type filter if provided
    if (type) {
      const normalizedType = type.toLowerCase();
      if (normalizedType !== 'call' && normalizedType !== 'put') {
        return NextResponse.json({ 
          error: "Option type must be 'call' or 'put'",
          code: "INVALID_OPTION_TYPE" 
        }, { status: 400 });
      }
      conditions.push(eq(ivSurfaceSnapshots.optionType, normalizedType));
    }

    const results = await db.select()
      .from(ivSurfaceSnapshots)
      .where(and(...conditions))
      .orderBy(asc(ivSurfaceSnapshots.daysToExpiration), asc(ivSurfaceSnapshots.strikePrice))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// POST method - Create IV surface snapshot(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const isBulk = Array.isArray(body);
    const records = isBulk ? body : [body];

    // Validate all records
    const validatedRecords = [];
    for (const record of records) {
      const {
        symbol,
        snapshotDate,
        expirationDate,
        strikePrice,
        daysToExpiration,
        moneyness,
        impliedVolatility,
        optionType
      } = record;

      // Validate required fields
      if (!symbol || !snapshotDate || !expirationDate || 
          strikePrice === undefined || daysToExpiration === undefined || 
          moneyness === undefined || impliedVolatility === undefined || !optionType) {
        return NextResponse.json({ 
          error: "Missing required fields: symbol, snapshotDate, expirationDate, strikePrice, daysToExpiration, moneyness, impliedVolatility, optionType",
          code: "MISSING_REQUIRED_FIELDS" 
        }, { status: 400 });
      }

      // Validate option type
      const normalizedOptionType = optionType.toLowerCase().trim();
      if (normalizedOptionType !== 'call' && normalizedOptionType !== 'put') {
        return NextResponse.json({ 
          error: "Option type must be 'call' or 'put'",
          code: "INVALID_OPTION_TYPE" 
        }, { status: 400 });
      }

      // Validate strike price
      if (strikePrice <= 0) {
        return NextResponse.json({ 
          error: "Strike price must be positive",
          code: "INVALID_STRIKE_PRICE" 
        }, { status: 400 });
      }

      // Validate days to expiration
      if (daysToExpiration < 0 || !Number.isInteger(daysToExpiration)) {
        return NextResponse.json({ 
          error: "Days to expiration must be a non-negative integer",
          code: "INVALID_DAYS_TO_EXPIRATION" 
        }, { status: 400 });
      }

      // Validate moneyness
      if (moneyness <= 0) {
        return NextResponse.json({ 
          error: "Moneyness must be positive",
          code: "INVALID_MONEYNESS" 
        }, { status: 400 });
      }

      // Validate implied volatility (0 to 500%)
      if (impliedVolatility < 0 || impliedVolatility > 5) {
        return NextResponse.json({ 
          error: "Implied volatility must be between 0 and 5 (0-500%)",
          code: "INVALID_IMPLIED_VOLATILITY" 
        }, { status: 400 });
      }

      validatedRecords.push({
        symbol: symbol.toUpperCase().trim(),
        snapshotDate: snapshotDate.trim(),
        expirationDate: expirationDate.trim(),
        strikePrice: parseFloat(strikePrice),
        daysToExpiration: parseInt(daysToExpiration),
        moneyness: parseFloat(moneyness),
        impliedVolatility: parseFloat(impliedVolatility),
        optionType: normalizedOptionType,
        createdAt: new Date().toISOString()
      });
    }

    // Insert records
    const created = await db.insert(ivSurfaceSnapshots)
      .values(validatedRecords)
      .returning();

    return NextResponse.json(isBulk ? created : created[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// PUT method - Update IV surface snapshot
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
    
    // Check if record exists
    const existing = await db.select()
      .from(ivSurfaceSnapshots)
      .where(eq(ivSurfaceSnapshots.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'IV surface snapshot not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Build update object with allowed fields only
    const updates: any = {};

    // Validate and add moneyness if provided
    if (body.moneyness !== undefined) {
      if (body.moneyness <= 0) {
        return NextResponse.json({ 
          error: "Moneyness must be positive",
          code: "INVALID_MONEYNESS" 
        }, { status: 400 });
      }
      updates.moneyness = parseFloat(body.moneyness);
    }

    // Validate and add implied volatility if provided
    if (body.impliedVolatility !== undefined) {
      if (body.impliedVolatility < 0 || body.impliedVolatility > 5) {
        return NextResponse.json({ 
          error: "Implied volatility must be between 0 and 5 (0-500%)",
          code: "INVALID_IMPLIED_VOLATILITY" 
        }, { status: 400 });
      }
      updates.impliedVolatility = parseFloat(body.impliedVolatility);
    }

    // Validate and add days to expiration if provided
    if (body.daysToExpiration !== undefined) {
      if (body.daysToExpiration < 0 || !Number.isInteger(body.daysToExpiration)) {
        return NextResponse.json({ 
          error: "Days to expiration must be a non-negative integer",
          code: "INVALID_DAYS_TO_EXPIRATION" 
        }, { status: 400 });
      }
      updates.daysToExpiration = parseInt(body.daysToExpiration);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update. Allowed fields: moneyness, impliedVolatility, daysToExpiration",
        code: "NO_VALID_UPDATES" 
      }, { status: 400 });
    }

    const updated = await db.update(ivSurfaceSnapshots)
      .set(updates)
      .where(eq(ivSurfaceSnapshots.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// DELETE method - Delete IV surface snapshot(s)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const symbol = searchParams.get('symbol');
    const date = searchParams.get('date');

    // Delete by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const deleted = await db.delete(ivSurfaceSnapshots)
        .where(eq(ivSurfaceSnapshots.id, parseInt(id)))
        .returning();

      if (deleted.length === 0) {
        return NextResponse.json({ 
          error: 'IV surface snapshot not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json({ 
        message: 'IV surface snapshot deleted successfully',
        count: 1,
        deleted: deleted[0]
      });
    }

    // Bulk delete by symbol and date
    if (symbol && date) {
      const deleted = await db.delete(ivSurfaceSnapshots)
        .where(and(
          eq(ivSurfaceSnapshots.symbol, symbol.toUpperCase().trim()),
          eq(ivSurfaceSnapshots.snapshotDate, date)
        ))
        .returning();

      if (deleted.length === 0) {
        return NextResponse.json({ 
          error: 'No IV surface snapshots found for the specified symbol and date',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json({ 
        message: 'IV surface snapshots deleted successfully',
        count: deleted.length,
        deleted
      });
    }

    return NextResponse.json({ 
      error: "Either 'id' OR both 'symbol' and 'date' parameters are required",
      code: "MISSING_REQUIRED_PARAMETERS" 
    }, { status: 400 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}