import { NextRequest, NextResponse } from 'next/server';
import { newsSentimentEngine } from '@/lib/ml/news-sentiment-engine';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// GET /api/news/events?symbol=AAPL - Get upcoming events for a symbol
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required', code: 'MISSING_SYMBOL' },
        { status: 400 }
      );
    }

    const events = await newsSentimentEngine.getUpcomingEvents(symbol);
    
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('Error fetching news events:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
