import { NextRequest, NextResponse } from 'next/server';
import { experimentTracker } from '@/lib/ml/experiment-tracking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// POST /api/ml/experiments/[id]/runs - Start new run
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id: experimentId } = await params;
    const body = await request.json();
    const { runName, parameters, tags } = body;

    if (!runName) {
      return NextResponse.json(
        { error: 'Run name is required', code: 'MISSING_RUN_NAME' },
        { status: 400 }
      );
    }

    const runId = await experimentTracker.startRun(
      experimentId,
      runName,
      parameters || {},
      tags || {}
    );

    return NextResponse.json({ runId }, { status: 201 });
  } catch (error) {
    console.error('Error starting run:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
