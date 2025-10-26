import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paperTradingAccounts, paperOrders, paperPositions, assets } from '@/db/schema';
import { eq, desc, gte, lte, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');
    const side = searchParams.get('side');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate accountId
    if (!accountId || isNaN(parseInt(accountId))) {
      return NextResponse.json({ 
        error: "Valid account ID is required",
        code: "INVALID_ACCOUNT_ID" 
      }, { status: 400 });
    }

    const parsedAccountId = parseInt(accountId);

    // Fetch account details
    const account = await db.select()
      .from(paperTradingAccounts)
      .where(eq(paperTradingAccounts.id, parsedAccountId))
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({ 
        error: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Build orders query with filters
    const conditions = [eq(paperOrders.paperAccountId, parsedAccountId)];

    if (status) {
      conditions.push(eq(paperOrders.status, status));
    }

    if (side) {
      conditions.push(eq(paperOrders.side, side));
    }

    if (startDate) {
      conditions.push(gte(paperOrders.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(paperOrders.createdAt, endDate));
    }

    // Fetch orders with asset details
    const orders = await db.select({
      id: paperOrders.id,
      assetId: paperOrders.assetId,
      symbol: assets.symbol,
      name: assets.name,
      orderType: paperOrders.orderType,
      side: paperOrders.side,
      quantity: paperOrders.quantity,
      filledQuantity: paperOrders.filledQuantity,
      filledPrice: paperOrders.filledPrice,
      status: paperOrders.status,
      filledAt: paperOrders.filledAt,
      createdAt: paperOrders.createdAt,
    })
      .from(paperOrders)
      .innerJoin(assets, eq(paperOrders.assetId, assets.id))
      .where(and(...conditions))
      .orderBy(desc(paperOrders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(paperOrders)
      .where(and(...conditions));
    
    const total = totalCountResult[0]?.count || 0;

    // Fetch all positions for P&L calculation
    const positions = await db.select()
      .from(paperPositions)
      .where(eq(paperPositions.paperAccountId, parsedAccountId));

    // Calculate P&L metrics
    const totalRealizedPnl = positions.reduce((sum, pos) => sum + (pos.realizedPnl || 0), 0);
    const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0);
    
    // Count filled orders for trade statistics
    const filledOrders = await db.select()
      .from(paperOrders)
      .where(and(
        eq(paperOrders.paperAccountId, parsedAccountId),
        eq(paperOrders.status, 'filled')
      ));

    const totalTrades = filledOrders.length;
    
    // Calculate winning and losing trades based on realized P&L
    // Group buy and sell orders by asset to calculate trade P&L
    const tradesByAsset = new Map<number, { buys: typeof filledOrders, sells: typeof filledOrders }>();
    
    filledOrders.forEach(order => {
      if (!tradesByAsset.has(order.assetId)) {
        tradesByAsset.set(order.assetId, { buys: [], sells: [] });
      }
      const trades = tradesByAsset.get(order.assetId)!;
      if (order.side === 'buy') {
        trades.buys.push(order);
      } else {
        trades.sells.push(order);
      }
    });

    let winningTrades = 0;
    let losingTrades = 0;

    // Calculate P&L for each completed trade cycle
    tradesByAsset.forEach((trades) => {
      trades.sells.forEach(sell => {
        const matchingBuy = trades.buys.find(buy => 
          buy.filledQuantity && sell.filledQuantity && 
          buy.filledPrice && sell.filledPrice
        );
        if (matchingBuy && sell.filledPrice && matchingBuy.filledPrice) {
          const tradePnl = (sell.filledPrice - matchingBuy.filledPrice) * (sell.filledQuantity || 0);
          if (tradePnl > 0) {
            winningTrades++;
          } else if (tradePnl < 0) {
            losingTrades++;
          }
        }
      });
    });

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalCommission = totalTrades * 0.50;
    const totalPnl = totalRealizedPnl + totalUnrealizedPnl;
    const netPnl = totalPnl - totalCommission;

    const pnlSummary = {
      totalRealizedPnl,
      totalUnrealizedPnl,
      totalPnl,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: parseFloat(winRate.toFixed(2)),
      totalCommission,
      netPnl,
    };

    return NextResponse.json({
      account: account[0],
      orders,
      pnlSummary,
      pagination: {
        limit,
        offset,
        total,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}