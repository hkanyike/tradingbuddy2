import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paperPositions, paperTradingAccounts, assets } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const paperAccountId = searchParams.get('paperAccountId');

    // Single record fetch by ID
    if (id) {
      const positionId = parseInt(id);
      if (isNaN(positionId)) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const position = await db
        .select()
        .from(paperPositions)
        .where(eq(paperPositions.id, positionId))
        .limit(1);

      if (position.length === 0) {
        return NextResponse.json(
          { error: 'Position not found', code: 'POSITION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(position[0], { status: 200 });
    }

    // List query with pagination and optional filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select().from(paperPositions);

    // Filter by paperAccountId if provided
    if (paperAccountId) {
      const accountId = parseInt(paperAccountId);
      if (isNaN(accountId)) {
        return NextResponse.json(
          { error: 'Valid paper account ID is required', code: 'INVALID_ACCOUNT_ID' },
          { status: 400 }
        );
      }
      query = query.where(eq(paperPositions.paperAccountId, accountId));
    }

    const results = await query
      .orderBy(desc(paperPositions.lastUpdated))
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
    const { paperAccountId, assetId, quantity, averageCost, currentPrice } = body;

    // Validate required fields
    if (!paperAccountId) {
      return NextResponse.json(
        { error: 'Paper account ID is required', code: 'MISSING_PAPER_ACCOUNT_ID' },
        { status: 400 }
      );
    }

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required', code: 'MISSING_ASSET_ID' },
        { status: 400 }
      );
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'Quantity is required', code: 'MISSING_QUANTITY' },
        { status: 400 }
      );
    }

    if (averageCost === undefined || averageCost === null) {
      return NextResponse.json(
        { error: 'Average cost is required', code: 'MISSING_AVERAGE_COST' },
        { status: 400 }
      );
    }

    // Validate data types
    const parsedPaperAccountId = parseInt(paperAccountId);
    const parsedAssetId = parseInt(assetId);
    const parsedQuantity = parseInt(quantity);
    const parsedAverageCost = parseFloat(averageCost);

    if (isNaN(parsedPaperAccountId)) {
      return NextResponse.json(
        { error: 'Paper account ID must be a valid integer', code: 'INVALID_PAPER_ACCOUNT_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parsedAssetId)) {
      return NextResponse.json(
        { error: 'Asset ID must be a valid integer', code: 'INVALID_ASSET_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parsedQuantity)) {
      return NextResponse.json(
        { error: 'Quantity must be a valid integer', code: 'INVALID_QUANTITY' },
        { status: 400 }
      );
    }

    if (parsedQuantity === 0) {
      return NextResponse.json(
        { error: 'Quantity must be non-zero', code: 'QUANTITY_ZERO' },
        { status: 400 }
      );
    }

    if (isNaN(parsedAverageCost) || parsedAverageCost <= 0) {
      return NextResponse.json(
        { error: 'Average cost must be a positive number', code: 'INVALID_AVERAGE_COST' },
        { status: 400 }
      );
    }

    // Verify paper account exists
    const paperAccount = await db
      .select()
      .from(paperTradingAccounts)
      .where(eq(paperTradingAccounts.id, parsedPaperAccountId))
      .limit(1);

    if (paperAccount.length === 0) {
      return NextResponse.json(
        { error: 'Paper trading account not found', code: 'PAPER_ACCOUNT_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Verify asset exists
    const asset = await db
      .select()
      .from(assets)
      .where(eq(assets.id, parsedAssetId))
      .limit(1);

    if (asset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Calculate unrealized PnL if currentPrice is provided
    let unrealizedPnl = 0;
    let parsedCurrentPrice = null;

    if (currentPrice !== undefined && currentPrice !== null) {
      parsedCurrentPrice = parseFloat(currentPrice);
      if (!isNaN(parsedCurrentPrice)) {
        unrealizedPnl = (parsedCurrentPrice - parsedAverageCost) * parsedQuantity;
      }
    }

    const now = new Date().toISOString();

    // Create new position
    const newPosition = await db
      .insert(paperPositions)
      .values({
        paperAccountId: parsedPaperAccountId,
        assetId: parsedAssetId,
        quantity: parsedQuantity,
        averageCost: parsedAverageCost,
        currentPrice: parsedCurrentPrice,
        unrealizedPnl: unrealizedPnl,
        realizedPnl: 0,
        lastUpdated: now,
      })
      .returning();

    return NextResponse.json(newPosition[0], { status: 201 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const positionId = parseInt(id);
    if (isNaN(positionId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if position exists
    const existingPosition = await db
      .select()
      .from(paperPositions)
      .where(eq(paperPositions.id, positionId))
      .limit(1);

    if (existingPosition.length === 0) {
      return NextResponse.json(
        { error: 'Position not found', code: 'POSITION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { quantity, averageCost, currentPrice, unrealizedPnl, realizedPnl } = body;

    // Prepare update object
    const updates: any = {
      lastUpdated: new Date().toISOString(),
    };

    // Validate and add quantity if provided
    if (quantity !== undefined && quantity !== null) {
      const parsedQuantity = parseInt(quantity);
      if (isNaN(parsedQuantity)) {
        return NextResponse.json(
          { error: 'Quantity must be a valid integer', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }
      updates.quantity = parsedQuantity;
    }

    // Validate and add averageCost if provided
    if (averageCost !== undefined && averageCost !== null) {
      const parsedAverageCost = parseFloat(averageCost);
      if (isNaN(parsedAverageCost) || parsedAverageCost <= 0) {
        return NextResponse.json(
          { error: 'Average cost must be a positive number', code: 'INVALID_AVERAGE_COST' },
          { status: 400 }
        );
      }
      updates.averageCost = parsedAverageCost;
    }

    // Add currentPrice if provided
    if (currentPrice !== undefined && currentPrice !== null) {
      const parsedCurrentPrice = parseFloat(currentPrice);
      if (!isNaN(parsedCurrentPrice)) {
        updates.currentPrice = parsedCurrentPrice;

        // Recalculate unrealized PnL if we have all necessary data
        const finalQuantity = updates.quantity !== undefined 
          ? updates.quantity 
          : existingPosition[0].quantity;
        const finalAverageCost = updates.averageCost !== undefined 
          ? updates.averageCost 
          : existingPosition[0].averageCost;

        updates.unrealizedPnl = (parsedCurrentPrice - finalAverageCost) * finalQuantity;
      }
    }

    // Add unrealizedPnl if explicitly provided (and not recalculated above)
    if (unrealizedPnl !== undefined && unrealizedPnl !== null && updates.unrealizedPnl === undefined) {
      const parsedUnrealizedPnl = parseFloat(unrealizedPnl);
      if (!isNaN(parsedUnrealizedPnl)) {
        updates.unrealizedPnl = parsedUnrealizedPnl;
      }
    }

    // Add realizedPnl if provided
    if (realizedPnl !== undefined && realizedPnl !== null) {
      const parsedRealizedPnl = parseFloat(realizedPnl);
      if (!isNaN(parsedRealizedPnl)) {
        updates.realizedPnl = parsedRealizedPnl;
      }
    }

    // Update position
    const updatedPosition = await db
      .update(paperPositions)
      .set(updates)
      .where(eq(paperPositions.id, positionId))
      .returning();

    return NextResponse.json(updatedPosition[0], { status: 200 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const positionId = parseInt(id);
    if (isNaN(positionId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if position exists
    const existingPosition = await db
      .select()
      .from(paperPositions)
      .where(eq(paperPositions.id, positionId))
      .limit(1);

    if (existingPosition.length === 0) {
      return NextResponse.json(
        { error: 'Position not found', code: 'POSITION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete position
    const deletedPosition = await db
      .delete(paperPositions)
      .where(eq(paperPositions.id, positionId))
      .returning();

    return NextResponse.json(
      {
        message: 'Position deleted successfully',
        position: deletedPosition[0],
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