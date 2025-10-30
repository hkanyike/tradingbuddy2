import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { backtests, strategies, mlModels } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const backtest = await db.select()
        .from(backtests)
        .where(and(eq(backtests.id, parseInt(id)), eq(backtests.userId, user.id)))
        .limit(1);

      if (backtest.length === 0) {
        return NextResponse.json({ error: 'Backtest not found' }, { status: 404 });
      }

      return NextResponse.json(backtest[0]);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const strategyId = searchParams.get('strategyId');
    const modelId = searchParams.get('modelId');
    const status = searchParams.get('status');

    let conditions = [eq(backtests.userId, user.id)];

    if (strategyId && !isNaN(parseInt(strategyId))) {
      conditions.push(eq(backtests.strategyId, parseInt(strategyId)));
    }

    if (modelId && !isNaN(parseInt(modelId))) {
      conditions.push(eq(backtests.modelId, parseInt(modelId)));
    }

    if (status && ['running', 'completed', 'failed'].includes(status)) {
      conditions.push(eq(backtests.status, status));
    }

    const results = await db.select()
      .from(backtests)
      .where(and(...conditions))
      .orderBy(desc(backtests.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { 
      name, 
      strategyId, 
      modelId,
      startDate, 
      endDate, 
      initialCapital, 
      configuration,
      status: providedStatus
    } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: "Name is required and must be a non-empty string",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!strategyId || isNaN(parseInt(strategyId))) {
      return NextResponse.json({ 
        error: "Valid strategy ID is required",
        code: "MISSING_STRATEGY_ID" 
      }, { status: 400 });
    }

    if (!startDate || typeof startDate !== 'string') {
      return NextResponse.json({ 
        error: "Start date is required",
        code: "MISSING_START_DATE" 
      }, { status: 400 });
    }

    if (!endDate || typeof endDate !== 'string') {
      return NextResponse.json({ 
        error: "End date is required",
        code: "MISSING_END_DATE" 
      }, { status: 400 });
    }

    if (!initialCapital || isNaN(parseFloat(initialCapital)) || parseFloat(initialCapital) <= 0) {
      return NextResponse.json({ 
        error: "Initial capital must be greater than 0",
        code: "INVALID_INITIAL_CAPITAL" 
      }, { status: 400 });
    }

    if (!configuration) {
      return NextResponse.json({ 
        error: "Configuration is required",
        code: "MISSING_CONFIGURATION" 
      }, { status: 400 });
    }

    let configJson;
    try {
      if (typeof configuration === 'string') {
        configJson = JSON.parse(configuration);
      } else if (typeof configuration === 'object') {
        configJson = configuration;
      } else {
        throw new Error('Invalid configuration format');
      }
    } catch (error) {
      return NextResponse.json({ 
        error: "Configuration must be valid JSON",
        code: "INVALID_CONFIGURATION_JSON" 
      }, { status: 400 });
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (isNaN(startDateTime.getTime())) {
      return NextResponse.json({ 
        error: "Invalid start date format",
        code: "INVALID_START_DATE" 
      }, { status: 400 });
    }

    if (isNaN(endDateTime.getTime())) {
      return NextResponse.json({ 
        error: "Invalid end date format",
        code: "INVALID_END_DATE" 
      }, { status: 400 });
    }

    if (startDateTime >= endDateTime) {
      return NextResponse.json({ 
        error: "Start date must be before end date",
        code: "INVALID_DATE_RANGE" 
      }, { status: 400 });
    }

    const strategy = await db.select()
      .from(strategies)
      .where(and(eq(strategies.id, parseInt(strategyId)), eq(strategies.userId, user.id)))
      .limit(1);

    if (strategy.length === 0) {
      return NextResponse.json({ 
        error: "Strategy not found or does not belong to user",
        code: "STRATEGY_NOT_FOUND" 
      }, { status: 404 });
    }

    if (modelId) {
      const model = await db.select()
        .from(mlModels)
        .where(eq(mlModels.id, String(modelId)))
        .limit(1);

      if (model.length === 0) {
        return NextResponse.json({ 
          error: "Model not found",
          code: "MODEL_NOT_FOUND" 
        }, { status: 404 });
      }
    }

    const validStatuses = ['running', 'completed', 'failed'];
    const finalStatus = providedStatus && validStatuses.includes(providedStatus) 
      ? providedStatus 
      : 'running';

    const newBacktest = await db.insert(backtests)
      .values({
        name: name.trim(),
        strategyId: parseInt(strategyId),
        modelId: modelId && !isNaN(parseInt(modelId)) ? parseInt(modelId) : null,
        userId: user.id,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        initialCapital: parseFloat(initialCapital),
        configuration: configJson,
        status: finalStatus,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newBacktest[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(backtests)
      .where(and(eq(backtests.id, parseInt(id)), eq(backtests.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Backtest not found' }, { status: 404 });
    }

    const {
      finalCapital,
      totalReturn,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      winRate,
      profitFactor,
      totalTrades,
      winningTrades,
      losingTrades,
      avgWin,
      avgLoss,
      totalCommissions,
      totalSlippage,
      status,
      errorMessage,
      completedAt
    } = body;

    const updates: any = {};

    if (finalCapital !== undefined) {
      if (isNaN(parseFloat(finalCapital))) {
        return NextResponse.json({ 
          error: "Final capital must be a valid number",
          code: "INVALID_FINAL_CAPITAL" 
        }, { status: 400 });
      }
      updates.finalCapital = parseFloat(finalCapital);
    }

    if (totalReturn !== undefined) {
      if (isNaN(parseFloat(totalReturn))) {
        return NextResponse.json({ 
          error: "Total return must be a valid number",
          code: "INVALID_TOTAL_RETURN" 
        }, { status: 400 });
      }
      updates.totalReturn = parseFloat(totalReturn);
    }

    if (sharpeRatio !== undefined) {
      if (isNaN(parseFloat(sharpeRatio))) {
        return NextResponse.json({ 
          error: "Sharpe ratio must be a valid number",
          code: "INVALID_SHARPE_RATIO" 
        }, { status: 400 });
      }
      updates.sharpeRatio = parseFloat(sharpeRatio);
    }

    if (sortinoRatio !== undefined) {
      if (isNaN(parseFloat(sortinoRatio))) {
        return NextResponse.json({ 
          error: "Sortino ratio must be a valid number",
          code: "INVALID_SORTINO_RATIO" 
        }, { status: 400 });
      }
      updates.sortinoRatio = parseFloat(sortinoRatio);
    }

    if (maxDrawdown !== undefined) {
      if (isNaN(parseFloat(maxDrawdown))) {
        return NextResponse.json({ 
          error: "Max drawdown must be a valid number",
          code: "INVALID_MAX_DRAWDOWN" 
        }, { status: 400 });
      }
      updates.maxDrawdown = parseFloat(maxDrawdown);
    }

    if (winRate !== undefined) {
      if (isNaN(parseFloat(winRate))) {
        return NextResponse.json({ 
          error: "Win rate must be a valid number",
          code: "INVALID_WIN_RATE" 
        }, { status: 400 });
      }
      updates.winRate = parseFloat(winRate);
    }

    if (profitFactor !== undefined) {
      if (isNaN(parseFloat(profitFactor))) {
        return NextResponse.json({ 
          error: "Profit factor must be a valid number",
          code: "INVALID_PROFIT_FACTOR" 
        }, { status: 400 });
      }
      updates.profitFactor = parseFloat(profitFactor);
    }

    if (totalTrades !== undefined) {
      if (isNaN(parseInt(totalTrades))) {
        return NextResponse.json({ 
          error: "Total trades must be a valid integer",
          code: "INVALID_TOTAL_TRADES" 
        }, { status: 400 });
      }
      updates.totalTrades = parseInt(totalTrades);
    }

    if (winningTrades !== undefined) {
      if (isNaN(parseInt(winningTrades))) {
        return NextResponse.json({ 
          error: "Winning trades must be a valid integer",
          code: "INVALID_WINNING_TRADES" 
        }, { status: 400 });
      }
      updates.winningTrades = parseInt(winningTrades);
    }

    if (losingTrades !== undefined) {
      if (isNaN(parseInt(losingTrades))) {
        return NextResponse.json({ 
          error: "Losing trades must be a valid integer",
          code: "INVALID_LOSING_TRADES" 
        }, { status: 400 });
      }
      updates.losingTrades = parseInt(losingTrades);
    }

    if (avgWin !== undefined) {
      if (isNaN(parseFloat(avgWin))) {
        return NextResponse.json({ 
          error: "Average win must be a valid number",
          code: "INVALID_AVG_WIN" 
        }, { status: 400 });
      }
      updates.avgWin = parseFloat(avgWin);
    }

    if (avgLoss !== undefined) {
      if (isNaN(parseFloat(avgLoss))) {
        return NextResponse.json({ 
          error: "Average loss must be a valid number",
          code: "INVALID_AVG_LOSS" 
        }, { status: 400 });
      }
      updates.avgLoss = parseFloat(avgLoss);
    }

    if (totalCommissions !== undefined) {
      if (isNaN(parseFloat(totalCommissions))) {
        return NextResponse.json({ 
          error: "Total commissions must be a valid number",
          code: "INVALID_TOTAL_COMMISSIONS" 
        }, { status: 400 });
      }
      updates.totalCommissions = parseFloat(totalCommissions);
    }

    if (totalSlippage !== undefined) {
      if (isNaN(parseFloat(totalSlippage))) {
        return NextResponse.json({ 
          error: "Total slippage must be a valid number",
          code: "INVALID_TOTAL_SLIPPAGE" 
        }, { status: 400 });
      }
      updates.totalSlippage = parseFloat(totalSlippage);
    }

    if (status !== undefined) {
      const validStatuses = ['running', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: "Status must be one of: running, completed, failed",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.status = status;

      if ((status === 'completed' || status === 'failed') && !completedAt) {
        updates.completedAt = new Date().toISOString();
      }
    }

    if (errorMessage !== undefined) {
      updates.errorMessage = errorMessage ? String(errorMessage) : null;
    }

    if (completedAt !== undefined) {
      if (completedAt) {
        const completedDate = new Date(completedAt);
        if (isNaN(completedDate.getTime())) {
          return NextResponse.json({ 
            error: "Invalid completed date format",
            code: "INVALID_COMPLETED_AT" 
          }, { status: 400 });
        }
        updates.completedAt = completedDate.toISOString();
      } else {
        updates.completedAt = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATE_FIELDS" 
      }, { status: 400 });
    }

    const updated = await db.update(backtests)
      .set(updates)
      .where(and(eq(backtests.id, parseInt(id)), eq(backtests.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Backtest not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(backtests)
      .where(and(eq(backtests.id, parseInt(id)), eq(backtests.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Backtest not found' }, { status: 404 });
    }

    const deleted = await db.delete(backtests)
      .where(and(eq(backtests.id, parseInt(id)), eq(backtests.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Backtest not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Backtest deleted successfully',
      backtest: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

