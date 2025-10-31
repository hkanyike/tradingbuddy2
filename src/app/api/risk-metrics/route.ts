import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { riskMetrics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

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

    // Prepare insert data with defaults (matching schema fields)
    const now = new Date().toISOString();
    const insertData = {
      userId: user.id,
      portfolioValue: body.portfolioValue ?? 0,
      totalPnl: body.totalPnl ?? 0,
      dailyPnl: body.dailyPnl ?? 0,
      sharpeRatio: body.sharpeRatio ?? null,
      maxDrawdown: body.maxDrawdown ?? null,
      var95: body.var95 ?? null,
      beta: body.beta ?? null,
      volatility: body.volatility ?? null,
      calculatedAt: now,
      createdAt: now
    };

    const newRecord = await db.insert(riskMetrics)
      .values(insertData)
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

