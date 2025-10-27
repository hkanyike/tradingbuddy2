import { NextRequest, NextResponse } from 'next/server'
import type { RouteCtx } from '@/types/route-context'
import { db } from '@/db'
import { backtests, backtestTrades } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'

// Type the WHOLE context, then destructure in the handler
type RouteContext = RouteCtx<{ id: string }>

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // Auth
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Params (must await in Next 15)
    const { id } = await params
    const parsedBacktestId = Number(id)
    if (!id || Number.isNaN(parsedBacktestId)) {
      return NextResponse.json(
        { error: 'Valid backtest ID is required', code: 'INVALID_BACKTEST_ID' },
        { status: 400 }
      )
    }

    // Ensure the backtest exists and belongs to the user
    const bt = await db
      .select()
      .from(backtests)
      .where(and(eq(backtests.id, parsedBacktestId), eq(backtests.userId, user.id)))
      .limit(1)

    if (bt.length === 0) {
      return NextResponse.json(
        { error: 'Backtest not found', code: 'BACKTEST_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Query params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') ?? '100'), 500)
    const offset = Number(searchParams.get('offset') ?? '0')
    const tradeType = searchParams.get('tradeType') ?? undefined
    const side = searchParams.get('side') ?? undefined
    const exitReason = searchParams.get('exitReason') ?? undefined

    // Validate filters
    if (tradeType) {
      const valid = ['STOCK', 'OPTION', 'SPREAD', 'STRADDLE', 'STRANGLE', 'CALENDAR']
      if (!valid.includes(tradeType)) {
        return NextResponse.json(
          { error: 'Invalid trade type. Must be one of: ' + valid.join(', '), code: 'INVALID_TRADE_TYPE' },
          { status: 400 }
        )
      }
    }
    if (side) {
      const valid = ['BUY', 'SELL']
      if (!valid.includes(side)) {
        return NextResponse.json(
          { error: 'Invalid side. Must be one of: ' + valid.join(', '), code: 'INVALID_SIDE' },
          { status: 400 }
        )
      }
    }
    if (exitReason) {
      const valid = ['PROFIT_TARGET', 'STOP_LOSS', 'TIME_STOP', 'SIGNAL_EXIT']
      if (!valid.includes(exitReason)) {
        return NextResponse.json(
          { error: 'Invalid exit reason. Must be one of: ' + valid.join(', '), code: 'INVALID_EXIT_REASON' },
          { status: 400 }
        )
      }
    }

    // Build WHERE incrementally (keeps TS happy)
    let whereExpr = eq(backtestTrades.backtestId, parsedBacktestId)
    if (tradeType) whereExpr = and(whereExpr, eq(backtestTrades.tradeType, tradeType))
    if (side) whereExpr = and(whereExpr, eq(backtestTrades.side, side))
    if (exitReason) whereExpr = and(whereExpr, eq(backtestTrades.exitReason, exitReason))

    // Fetch trades
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
      .where(whereExpr)
      .orderBy(desc(backtestTrades.entryDate))
      .limit(limit)
      .offset(offset)

    return NextResponse.json(trades, { status: 200 })
  } catch (error) {
    console.error('GET /api/backtests/[id]/trades error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
