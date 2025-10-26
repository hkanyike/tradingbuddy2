import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { backtests, backtestDailyMetrics } from '@/db/schema';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Validate backtest ID format
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid backtest ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const backtestId = parseInt(id);

    // Verify backtest exists and belongs to user
    const backtest = await db
      .select()
      .from(backtests)
      .where(and(eq(backtests.id, backtestId), eq(backtests.userId, user.id)))
      .limit(1);

    if (backtest.length === 0) {
      return NextResponse.json(
        { error: 'Backtest not found', code: 'BACKTEST_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '500'), 1000);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate date formats if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json(
        { error: 'Invalid startDate format. Expected YYYY-MM-DD', code: 'INVALID_START_DATE' },
        { status: 400 }
      );
    }
    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid endDate format. Expected YYYY-MM-DD', code: 'INVALID_END_DATE' },
        { status: 400 }
      );
    }

    // Build query with filters
    const conditions = [eq(backtestDailyMetrics.backtestId, backtestId)];

    if (startDate) {
      conditions.push(gte(backtestDailyMetrics.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(backtestDailyMetrics.date, endDate));
    }

    // Execute query with all filters, ordering, and pagination
    const metrics = await db
      .select()
      .from(backtestDailyMetrics)
      .where(and(...conditions))
      .orderBy(asc(backtestDailyMetrics.date))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('GET backtest metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}