import { NextRequest, NextResponse } from 'next/server';
import { createRLAgent, getRLAgent } from '@/lib/rl-agent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/rl/stats
 * Get RL agent statistics
 */
export async function GET(request: NextRequest) {
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

    const stats = agent.getStatistics();

    return NextResponse.json({
      ...stats,
      status: 'active',
      version: '1.0.0'
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching RL stats:', error);
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

