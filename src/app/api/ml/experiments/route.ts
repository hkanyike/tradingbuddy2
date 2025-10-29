import { NextRequest, NextResponse } from 'next/server';
import { experimentTracker } from '@/lib/ml/experiment-tracking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// GET /api/ml/experiments - Get all experiments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const experiments = experimentTracker.getAllExperiments();
    return NextResponse.json({ experiments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/ml/experiments - Create new experiment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, tags } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Experiment name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    const experimentId = await experimentTracker.createExperiment(
      name,
      description || '',
      tags || {}
    );

    return NextResponse.json({ experimentId }, { status: 201 });
  } catch (error) {
    console.error('Error creating experiment:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
