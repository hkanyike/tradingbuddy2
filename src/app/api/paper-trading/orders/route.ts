import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paperOrders, paperTradingAccounts, assets } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

const VALID_ORDER_TYPES = ['market', 'limit', 'stop'] as const;
const VALID_SIDES = ['buy', 'sell'] as const;
const VALID_STATUSES = ['pending', 'filled', 'partial', 'canceled', 'rejected'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const paperAccountId = searchParams.get('paperAccountId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status as any)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const order = await db.select()
        .from(paperOrders)
        .where(eq(paperOrders.id, parseInt(id)))
        .limit(1);

      if (order.length === 0) {
        return NextResponse.json({
          error: 'Paper order not found',
          code: 'ORDER_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(order[0]);
    }

    // List with filters
    let query = db.select().from(paperOrders);
    const conditions = [];

    if (paperAccountId) {
      if (isNaN(parseInt(paperAccountId))) {
        return NextResponse.json({
          error: 'Valid paperAccountId is required',
          code: 'INVALID_PAPER_ACCOUNT_ID'
        }, { status: 400 });
      }
      conditions.push(eq(paperOrders.paperAccountId, parseInt(paperAccountId)));
    }

    if (status) {
      conditions.push(eq(paperOrders.status, status));
    }

    const orders = conditions.length > 0
      ? await query.where(and(...conditions))
          .orderBy(desc(paperOrders.createdAt))
          .limit(limit)
          .offset(offset)
      : await query
          .orderBy(desc(paperOrders.createdAt))
          .limit(limit)
          .offset(offset);

    return NextResponse.json(orders);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperAccountId, assetId, orderType, side, quantity, limitPrice, stopPrice } = body;

    // Validate required fields
    if (!paperAccountId) {
      return NextResponse.json({
        error: 'paperAccountId is required',
        code: 'MISSING_PAPER_ACCOUNT_ID'
      }, { status: 400 });
    }

    if (!assetId) {
      return NextResponse.json({
        error: 'assetId is required',
        code: 'MISSING_ASSET_ID'
      }, { status: 400 });
    }

    if (!orderType) {
      return NextResponse.json({
        error: 'orderType is required',
        code: 'MISSING_ORDER_TYPE'
      }, { status: 400 });
    }

    if (!side) {
      return NextResponse.json({
        error: 'side is required',
        code: 'MISSING_SIDE'
      }, { status: 400 });
    }

    if (!quantity) {
      return NextResponse.json({
        error: 'quantity is required',
        code: 'MISSING_QUANTITY'
      }, { status: 400 });
    }

    // Validate paperAccountId is valid integer
    if (isNaN(parseInt(paperAccountId))) {
      return NextResponse.json({
        error: 'paperAccountId must be a valid integer',
        code: 'INVALID_PAPER_ACCOUNT_ID'
      }, { status: 400 });
    }

    // Validate assetId is valid integer
    if (isNaN(parseInt(assetId))) {
      return NextResponse.json({
        error: 'assetId must be a valid integer',
        code: 'INVALID_ASSET_ID'
      }, { status: 400 });
    }

    // Validate orderType
    if (!VALID_ORDER_TYPES.includes(orderType)) {
      return NextResponse.json({
        error: `orderType must be one of: ${VALID_ORDER_TYPES.join(', ')}`,
        code: 'INVALID_ORDER_TYPE'
      }, { status: 400 });
    }

    // Validate side
    if (!VALID_SIDES.includes(side)) {
      return NextResponse.json({
        error: `side must be one of: ${VALID_SIDES.join(', ')}`,
        code: 'INVALID_SIDE'
      }, { status: 400 });
    }

    // Validate quantity is positive integer
    if (isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      return NextResponse.json({
        error: 'quantity must be a positive integer',
        code: 'INVALID_QUANTITY'
      }, { status: 400 });
    }

    // Validate limit price for limit orders
    if (orderType === 'limit' && !limitPrice) {
      return NextResponse.json({
        error: 'limitPrice is required for limit orders',
        code: 'MISSING_LIMIT_PRICE'
      }, { status: 400 });
    }

    // Validate stop price for stop orders
    if (orderType === 'stop' && !stopPrice) {
      return NextResponse.json({
        error: 'stopPrice is required for stop orders',
        code: 'MISSING_STOP_PRICE'
      }, { status: 400 });
    }

    // Verify paper trading account exists
    const account = await db.select()
      .from(paperTradingAccounts)
      .where(eq(paperTradingAccounts.id, parseInt(paperAccountId)))
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({
        error: 'Paper trading account not found',
        code: 'ACCOUNT_NOT_FOUND'
      }, { status: 404 });
    }

    // Verify asset exists
    const asset = await db.select()
      .from(assets)
      .where(eq(assets.id, parseInt(assetId)))
      .limit(1);

    if (asset.length === 0) {
      return NextResponse.json({
        error: 'Asset not found',
        code: 'ASSET_NOT_FOUND'
      }, { status: 404 });
    }

    // Create the order
    const now = new Date().toISOString();
    const newOrder = await db.insert(paperOrders)
      .values({
        paperAccountId: parseInt(paperAccountId),
        assetId: parseInt(assetId),
        orderType,
        side,
        quantity: parseInt(quantity),
        limitPrice: limitPrice ? parseFloat(limitPrice) : null,
        stopPrice: stopPrice ? parseFloat(stopPrice) : null,
        status: 'pending',
        filledQuantity: 0,
        filledPrice: null,
        filledAt: null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newOrder[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await db.select()
      .from(paperOrders)
      .where(eq(paperOrders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({
        error: 'Paper order not found',
        code: 'ORDER_NOT_FOUND'
      }, { status: 404 });
    }

    const body = await request.json();
    const { status, filledQuantity, filledPrice, filledAt, limitPrice, stopPrice } = body;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Validate filledQuantity does not exceed quantity
    if (filledQuantity !== undefined) {
      if (isNaN(parseInt(filledQuantity)) || parseInt(filledQuantity) < 0) {
        return NextResponse.json({
          error: 'filledQuantity must be a non-negative integer',
          code: 'INVALID_FILLED_QUANTITY'
        }, { status: 400 });
      }

      if (parseInt(filledQuantity) > existingOrder[0].quantity) {
        return NextResponse.json({
          error: 'filledQuantity cannot exceed order quantity',
          code: 'FILLED_QUANTITY_EXCEEDS_QUANTITY'
        }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (status !== undefined) updates.status = status;
    if (filledQuantity !== undefined) updates.filledQuantity = parseInt(filledQuantity);
    if (filledPrice !== undefined) updates.filledPrice = filledPrice ? parseFloat(filledPrice) : null;
    if (filledAt !== undefined) updates.filledAt = filledAt;
    if (limitPrice !== undefined) updates.limitPrice = limitPrice ? parseFloat(limitPrice) : null;
    if (stopPrice !== undefined) updates.stopPrice = stopPrice ? parseFloat(stopPrice) : null;

    const updatedOrder = await db.update(paperOrders)
      .set(updates)
      .where(eq(paperOrders.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedOrder[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await db.select()
      .from(paperOrders)
      .where(eq(paperOrders.id, parseInt(id)))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({
        error: 'Paper order not found',
        code: 'ORDER_NOT_FOUND'
      }, { status: 404 });
    }

    const deleted = await db.delete(paperOrders)
      .where(eq(paperOrders.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Paper order deleted successfully',
      order: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
