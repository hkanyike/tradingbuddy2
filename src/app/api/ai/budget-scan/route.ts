import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { aiBudgetScanner, type BudgetScanRequest } from '@/lib/ai-budget-scanner';

// POST /api/ai/budget-scan - Get AI-powered contract recommendations based on budget
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
    const { budget, riskTolerance, strategy, maxPositions, timeHorizon } = body;

    // Validate required fields
    if (!budget || !riskTolerance || !strategy || !maxPositions || !timeHorizon) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: budget, riskTolerance, strategy, maxPositions, timeHorizon',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate budget
    if (typeof budget !== 'number' || budget < 100) {
      return NextResponse.json(
        { error: 'Budget must be at least $100', code: 'INVALID_BUDGET' },
        { status: 400 }
      );
    }

    if (budget > 1000000) {
      return NextResponse.json(
        { error: 'Budget cannot exceed $1,000,000', code: 'INVALID_BUDGET' },
        { status: 400 }
      );
    }

    // Validate risk tolerance
    if (!['low', 'medium', 'high'].includes(riskTolerance)) {
      return NextResponse.json(
        { error: 'Risk tolerance must be: low, medium, or high', code: 'INVALID_RISK' },
        { status: 400 }
      );
    }

    // Validate strategy
    if (!['growth', 'income', 'balanced'].includes(strategy)) {
      return NextResponse.json(
        { error: 'Strategy must be: growth, income, or balanced', code: 'INVALID_STRATEGY' },
        { status: 400 }
      );
    }

    // Validate max positions
    if (typeof maxPositions !== 'number' || maxPositions < 1 || maxPositions > 10) {
      return NextResponse.json(
        { error: 'Max positions must be between 1 and 10', code: 'INVALID_POSITIONS' },
        { status: 400 }
      );
    }

    // Validate time horizon
    if (!['1week', '1month', '3months'].includes(timeHorizon)) {
      return NextResponse.json(
        { error: 'Time horizon must be: 1week, 1month, or 3months', code: 'INVALID_HORIZON' },
        { status: 400 }
      );
    }

    // Build scan request
    const scanRequest: BudgetScanRequest = {
      budget,
      riskTolerance,
      strategy,
      maxPositions,
      timeHorizon
    };

    // Execute AI scan
    console.log(`🔍 Starting AI budget scan for user ${session.user.email}:`, scanRequest);
    const result = await aiBudgetScanner.scanMarket(scanRequest);
    console.log(`✅ Scan complete: ${result.recommendations.length} recommendations found`);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in AI budget scan:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

