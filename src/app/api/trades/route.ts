import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trades } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single trade by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const trade = await db.select()
        .from(trades)
        .where(and(
          eq(trades.id, parseInt(id)),
          eq(trades.userId, user.id)
        ))
        .limit(1);

      if (trade.length === 0) {
        return NextResponse.json({ 
          error: 'Trade not found',
          code: "TRADE_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(trade[0], { status: 200 });
    }

    // List trades with pagination - filtered by authenticated user
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const results = await db.select()
      .from(trades)
      .where(eq(trades.userId, user.id))
      .orderBy(desc(trades.executedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!body.assetId) {
      return NextResponse.json({ 
        error: "assetId is required",
        code: "MISSING_ASSET_ID" 
      }, { status: 400 });
    }

    if (!body.tradeType) {
      return NextResponse.json({ 
        error: "tradeType is required",
        code: "MISSING_TRADE_TYPE" 
      }, { status: 400 });
    }

    if (body.quantity === undefined || body.quantity === null) {
      return NextResponse.json({ 
        error: "quantity is required",
        code: "MISSING_QUANTITY" 
      }, { status: 400 });
    }

    // Validate tradeType
    const validTradeTypes = ['buy', 'sell', 'roll', 'hedge'];
    if (!validTradeTypes.includes(body.tradeType)) {
      return NextResponse.json({ 
        error: `tradeType must be one of: ${validTradeTypes.join(', ')}`,
        code: "INVALID_TRADE_TYPE" 
      }, { status: 400 });
    }

    // Prepare insert data with defaults and auto-generated fields (matching trades schema)
    const now = new Date().toISOString();
    const insertData = {
      userId: user.id,
      positionId: body.positionId || null,
      assetId: body.assetId,
      tradeType: body.tradeType,
      quantity: body.quantity,
      price: body.price || body.entryPrice || 0,
      commission: body.commission !== undefined ? body.commission : 0,
      pnl: body.pnl || body.realizedPnl || 0,
      executedAt: now,
      createdAt: now,
    };

    const newTrade = await db.insert(trades)
      .values(insertData)
      .returning();

    return NextResponse.json(newTrade[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if trade exists and belongs to user
    const existingTrade = await db.select()
      .from(trades)
      .where(and(
        eq(trades.id, parseInt(id)),
        eq(trades.userId, user.id)
      ))
      .limit(1);

    if (existingTrade.length === 0) {
      return NextResponse.json({ 
        error: 'Trade not found',
        code: "TRADE_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate tradeType if provided
    if (body.tradeType) {
      const validTradeTypes = ['buy', 'sell', 'roll', 'hedge'];
      if (!validTradeTypes.includes(body.tradeType)) {
        return NextResponse.json({ 
          error: `tradeType must be one of: ${validTradeTypes.join(', ')}`,
          code: "INVALID_TRADE_TYPE" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.strategyId !== undefined) updateData.strategyId = body.strategyId;
    if (body.assetId !== undefined) updateData.assetId = body.assetId;
    if (body.positionId !== undefined) updateData.positionId = body.positionId;
    if (body.tradeType !== undefined) updateData.tradeType = body.tradeType;
    if (body.positionType !== undefined) updateData.positionType = body.positionType;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.entryPrice !== undefined) updateData.entryPrice = body.entryPrice;
    if (body.exitPrice !== undefined) updateData.exitPrice = body.exitPrice;
    if (body.strikePrice !== undefined) updateData.strikePrice = body.strikePrice;
    if (body.expirationDate !== undefined) updateData.expirationDate = body.expirationDate;
    if (body.realizedPnl !== undefined) updateData.realizedPnl = body.realizedPnl;
    if (body.commission !== undefined) updateData.commission = body.commission;
    if (body.slippage !== undefined) updateData.slippage = body.slippage;
    if (body.closedAt !== undefined) updateData.closedAt = body.closedAt;

    const updated = await db.update(trades)
      .set(updateData)
      .where(eq(trades.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update trade',
        code: "UPDATE_FAILED" 
      }, { status: 500 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if trade exists and belongs to user
    const existingTrade = await db.select()
      .from(trades)
      .where(and(
        eq(trades.id, parseInt(id)),
        eq(trades.userId, user.id)
      ))
      .limit(1);

    if (existingTrade.length === 0) {
      return NextResponse.json({ 
        error: 'Trade not found',
        code: "TRADE_NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(trades)
      .where(eq(trades.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete trade',
        code: "DELETE_FAILED" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Trade deleted successfully',
      trade: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

