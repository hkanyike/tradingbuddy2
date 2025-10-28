import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { riskMetrics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
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

    // Prepare insert data with defaults
    const insertData = {
      userId: user.id,
      totalExposure: body.totalExposure ?? 0,
      netDelta: body.netDelta ?? 0,
      netGamma: body.netGamma ?? 0,
      netTheta: body.netTheta ?? 0,
      netVega: body.netVega ?? 0,
      portfolioHeat: body.portfolioHeat ?? 0,
      maxDrawdown: body.maxDrawdown ?? 0,
      dailyPnl: body.dailyPnl ?? 0,
      sharpeRatio: body.sharpeRatio ?? null,
      sortinoRatio: body.sortinoRatio ?? null,
      winRate: body.winRate ?? null,
      calculatedAt: new Date().toISOString()
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
