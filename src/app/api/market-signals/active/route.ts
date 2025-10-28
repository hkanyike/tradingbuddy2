import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketSignals } from '@/db/schema';
import { eq, and, gt, or, isNull, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const currentTimestamp = new Date().toISOString();

    const activeSignals = await db
      .select()
      .from(marketSignals)
      .where(
        and(
          eq(marketSignals.isExecuted, false),
          or(
            gt(marketSignals.validUntil, currentTimestamp),
            isNull(marketSignals.validUntil)
          )
        )
      )
      .orderBy(desc(marketSignals.confidenceScore))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(activeSignals, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}
