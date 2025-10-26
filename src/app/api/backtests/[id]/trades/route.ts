import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { backtests, backtestTrades } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract and validate backtest ID
    const backtestId = params.id;
    if (!backtestId || isNaN(parseInt(backtestId))) {
      return NextResponse.json(
        { error: 'Valid backtest ID is required', code: 'INVALID_BACKTEST_ID' },
        { status: 400 }
      );
    }

    const parsedBacktestId = parseInt(backtestId);

    // Verify backtest exists and belongs to the authenticated user
    const backtest = await db
      .select()
      .from(backtests)
      .where(
        and(
          eq(backtests.id, parsedBacktestId),
          eq(backtests.userId, user.id)
        )
      )
      .limit(1);

    if (backtest.length === 0) {
      return NextResponse.json(
        { error: 'Backtest not found', code: 'BACKTEST_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const tradeType = searchParams.get('tradeType');
    const side = searchParams.get('side');
    const exitReason = searchParams.get('exitReason');

    // Build query with filters
    const conditions = [eq(backtestTrades.backtestId, parsedBacktestId)];

    if (tradeType) {
      const validTradeTypes = ['STOCK', 'OPTION', 'SPREAD', 'STRADDLE', 'STRANGLE', 'CALENDAR'];
      if (!validTradeTypes.includes(tradeType)) {
        return NextResponse.json(
          { 
            error: 'Invalid trade type. Must be one of: STOCK, OPTION, SPREAD, STRADDLE, STRANGLE, CALENDAR',
            code: 'INVALID_TRADE_TYPE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(backtestTrades.tradeType, tradeType));
    }

    if (side) {
      const validSides = ['BUY', 'SELL'];
      if (!validSides.includes(side)) {
        return NextResponse.json(
          { 
            error: 'Invalid side. Must be one of: BUY, SELL',
            code: 'INVALID_SIDE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(backtestTrades.side, side));
    }

    if (exitReason) {
      const validExitReasons = ['PROFIT_TARGET', 'STOP_LOSS', 'TIME_STOP', 'SIGNAL_EXIT'];
      if (!validExitReasons.includes(exitReason)) {
        return NextResponse.json(
          { 
            error: 'Invalid exit reason. Must be one of: PROFIT_TARGET, STOP_LOSS, TIME_STOP, SIGNAL_EXIT',
            code: 'INVALID_EXIT_REASON' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(backtestTrades.exitReason, exitReason));
    }

    // Execute query
    const trades = await db
      .select({
        id: backtestTrades.id,
        backtestId: backtestTrades.backtestId,
        assetId: backtestTrades.assetId,
        tradeType: backtestTrades.tradeType,
        side: backtestTrades.side,
        entryDate: backtestTrades.entryDate,
        exitDate: backtestTrades.exitDate,
        entryPrice: backtestTrades.entryPrice,
        exitPrice: backtestTrades.exitPrice,
        quantity: backtestTrades.quantity,
        commission: backtestTrades.commission,
        slippage: backtestTrades.slippage,
        pnl: backtestTrades.pnl,
        pnlPercentage: backtestTrades.pnlPercentage,
        maxAdverseExcursion: backtestTrades.maxAdverseExcursion,
        maxFavorableExcursion: backtestTrades.maxFavorableExcursion,
        holdDurationHours: backtestTrades.holdDurationHours,
        entrySignals: backtestTrades.entrySignals,
        exitReason: backtestTrades.exitReason,
        greeksAtEntry: backtestTrades.greeksAtEntry,
        greeksAtExit: backtestTrades.greeksAtExit,
      })
      .from(backtestTrades)
      .where(and(...conditions))
      .orderBy(desc(backtestTrades.entryDate))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(trades, { status: 200 });
  } catch (error) {
    console.error('GET /api/backtests/[id]/trades error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}