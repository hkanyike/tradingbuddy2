import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { positions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { 
      strategyId,
      assetId, 
      positionType, 
      quantity, 
      entryPrice,
      currentPrice,
      strikePrice,
      expirationDate,
      delta,
      gamma,
      theta,
      vega,
      iv,
      unrealizedPnl,
      stopLoss,
      takeProfit,
      status
    } = body;

    if (!assetId) {
      return NextResponse.json({ 
        error: "Asset ID is required",
        code: "MISSING_ASSET_ID" 
      }, { status: 400 });
    }

    if (!positionType || typeof positionType !== 'string' || positionType.trim() === '') {
      return NextResponse.json({ 
        error: "Position type is required",
        code: "MISSING_POSITION_TYPE" 
      }, { status: 400 });
    }

    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ 
        error: "Valid quantity is required",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    if (entryPrice === undefined || entryPrice === null || typeof entryPrice !== 'number' || entryPrice < 0) {
      return NextResponse.json({ 
        error: "Valid entry price is required",
        code: "INVALID_ENTRY_PRICE" 
      }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    const newPosition = await db.insert(positions)
      .values({
        userId: user.id,
        strategyId: strategyId || null,
        assetId: parseInt(assetId),
        positionType: positionType.trim(),
        quantity: parseInt(quantity),
        entryPrice: parseFloat(entryPrice),
        currentPrice: currentPrice !== undefined && currentPrice !== null ? parseFloat(currentPrice) : null,
        strikePrice: strikePrice !== undefined && strikePrice !== null ? parseFloat(strikePrice) : null,
        expirationDate: expirationDate || null,
        delta: delta !== undefined && delta !== null ? parseFloat(delta) : null,
        gamma: gamma !== undefined && gamma !== null ? parseFloat(gamma) : null,
        theta: theta !== undefined && theta !== null ? parseFloat(theta) : null,
        vega: vega !== undefined && vega !== null ? parseFloat(vega) : null,
        iv: iv !== undefined && iv !== null ? parseFloat(iv) : null,
        unrealizedPnl: unrealizedPnl !== undefined && unrealizedPnl !== null ? parseFloat(unrealizedPnl) : 0,
        stopLoss: stopLoss !== undefined && stopLoss !== null ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit !== undefined && takeProfit !== null ? parseFloat(takeProfit) : null,
        status: status || 'open',
        openedAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(newPosition[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
