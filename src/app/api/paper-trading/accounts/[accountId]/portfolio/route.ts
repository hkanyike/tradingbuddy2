import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paperTradingAccounts, paperPositions, assets } from '@/db/schema';
import { eq, ne, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const includeClosedPositions = searchParams.get('includeClosedPositions') === 'true';

    // Validate accountId
    if (!accountId || isNaN(parseInt(accountId))) {
      return NextResponse.json({ 
        error: 'Valid account ID is required',
        code: 'INVALID_ACCOUNT_ID' 
      }, { status: 400 });
    }

    const parsedAccountId = parseInt(accountId);

    // Fetch paper trading account
    const account = await db.select()
      .from(paperTradingAccounts)
      .where(eq(paperTradingAccounts.id, parsedAccountId))
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({ 
        error: 'Paper trading account not found',
        code: 'ACCOUNT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Fetch positions with asset details
    let positionsQuery = db.select({
      id: paperPositions.id,
      assetId: paperPositions.assetId,
      symbol: assets.symbol,
      name: assets.name,
      sector: assets.sector,
      quantity: paperPositions.quantity,
      averageCost: paperPositions.averageCost,
      currentPrice: paperPositions.currentPrice,
      unrealizedPnl: paperPositions.unrealizedPnl,
      realizedPnl: paperPositions.realizedPnl,
      lastUpdated: paperPositions.lastUpdated,
    })
      .from(paperPositions)
      .leftJoin(assets, eq(paperPositions.assetId, assets.id))
      .where(eq(paperPositions.paperAccountId, parsedAccountId));

    // Filter out closed positions if requested
    if (!includeClosedPositions) {
      positionsQuery = positionsQuery.where(
        and(
          eq(paperPositions.paperAccountId, parsedAccountId),
          ne(paperPositions.quantity, 0)
        )
      );
    }

    const positions = await positionsQuery;

    // Calculate position metrics and portfolio summary
    let totalPositionValue = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;

    const enrichedPositions = positions.map(position => {
      const marketValue = (position.currentPrice || 0) * position.quantity;
      const totalPnl = (position.unrealizedPnl || 0) + (position.realizedPnl || 0);
      const costBasis = position.averageCost * position.quantity;
      const percentageReturn = costBasis !== 0 ? ((marketValue - costBasis) / costBasis) * 100 : 0;

      totalPositionValue += marketValue;
      totalUnrealizedPnl += (position.unrealizedPnl || 0);
      totalRealizedPnl += (position.realizedPnl || 0);

      return {
        id: position.id,
        assetId: position.assetId,
        symbol: position.symbol || '',
        name: position.name || '',
        sector: position.sector || '',
        quantity: position.quantity,
        averageCost: position.averageCost,
        currentPrice: position.currentPrice || 0,
        marketValue: marketValue,
        unrealizedPnl: position.unrealizedPnl || 0,
        realizedPnl: position.realizedPnl || 0,
        totalPnl: totalPnl,
        percentageReturn: percentageReturn,
        lastUpdated: position.lastUpdated,
      };
    });

    const totalCashBalance = account[0].cashBalance;
    const totalEquity = totalCashBalance + totalPositionValue;
    const totalPnl = totalUnrealizedPnl + totalRealizedPnl;
    const initialBalance = account[0].initialBalance;
    const percentageReturn = initialBalance !== 0 ? ((totalEquity - initialBalance) / initialBalance) * 100 : 0;

    return NextResponse.json({
      account: {
        id: account[0].id,
        userId: account[0].userId,
        cashBalance: account[0].cashBalance,
        initialBalance: account[0].initialBalance,
        totalEquity: account[0].totalEquity,
        totalPnl: account[0].totalPnl,
        isActive: account[0].isActive,
        createdAt: account[0].createdAt,
        updatedAt: account[0].updatedAt,
      },
      positions: enrichedPositions,
      summary: {
        totalPositionValue: totalPositionValue,
        totalCashBalance: totalCashBalance,
        totalEquity: totalEquity,
        totalPnl: totalPnl,
        percentageReturn: percentageReturn,
        numberOfPositions: enrichedPositions.filter(p => p.quantity !== 0).length,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}