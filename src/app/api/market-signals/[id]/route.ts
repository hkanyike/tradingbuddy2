import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketSignals } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    // Fetch market signal by ID
    const signal = await db
      .select()
      .from(marketSignals)
      .where(eq(marketSignals.id, parseInt(id)))
      .limit(1);

    // Return 404 if market signal not found
    if (signal.length === 0) {
      return NextResponse.json(
        {
          error: 'Market signal not found',
          code: 'SIGNAL_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(signal[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}