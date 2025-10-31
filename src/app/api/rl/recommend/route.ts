import { NextRequest, NextResponse } from 'next/server';
import { createRLAgent, getRLAgent } from '@/lib/rl-agent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * POST /api/rl/recommend
 * Get action recommendation from RL agent based on current state
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get or create RL agent
    let agent = getRLAgent();
    if (!agent) {
      agent = createRLAgent();
    }

    const body = await request.json();
    const { state } = body;

    if (!state) {
      return NextResponse.json(
        { error: 'Missing state parameter', code: 'MISSING_STATE' },
        { status: 400 }
      );
    }

    // Validate state structure
    const requiredFields = [
      'portfolioDelta', 'portfolioGamma', 'portfolioTheta', 'portfolioVega',
      'totalPositions', 'cashBalance', 'totalPnL', 'vixLevel', 'ivRank',
      'priceChange', 'volumeRatio'
    ];

    for (const field of requiredFields) {
      if (state[field] === undefined || state[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}`, code: 'INVALID_STATE' },
          { status: 400 }
        );
      }
    }

    const recommendation = agent.getRecommendation(state);

    return NextResponse.json({
      recommendation,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Error getting RL recommendation:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

