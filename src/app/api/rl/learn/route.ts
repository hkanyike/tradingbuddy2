import { NextRequest, NextResponse } from 'next/server';
import { createRLAgent, getRLAgent } from '@/lib/rl-agent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * POST /api/rl/learn
 * Feed trade outcome to RL agent for learning
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
    const { state, action, nextState, done } = body;

    if (!state || !action || !nextState) {
      return NextResponse.json(
        { error: 'Missing required fields: state, action, nextState', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Feed experience to agent
    agent.learn(state, action, nextState, done || false);

    // Get updated statistics
    const stats = agent.getStatistics();

    return NextResponse.json({
      success: true,
      stats,
      message: 'Experience recorded and agent updated'
    }, { status: 200 });

  } catch (error) {
    console.error('Error in RL learning:', error);
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

