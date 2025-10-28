import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trades } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Fetch trade with ownership verification - userId is now text
    const trade = await db.select()
      .from(trades)
      .where(and(
        eq(trades.id, parseInt(id)),
        eq(trades.userId, session.user.id)
      ))
      .limit(1);

    if (trade.length === 0) {
      return NextResponse.json(
        { 
          error: 'Trade not found',
          code: 'TRADE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(trade[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}