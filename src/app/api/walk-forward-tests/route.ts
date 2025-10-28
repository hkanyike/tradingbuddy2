import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { walkForwardTests, mlModels, strategies } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const test = await db.select()
        .from(walkForwardTests)
        .where(and(
          eq(walkForwardTests.id, parseInt(id)),
          eq(walkForwardTests.userId, user.id)
        ))
        .limit(1);

      if (test.length === 0) {
        return NextResponse.json({ 
          error: 'Walk-forward test not found',
          code: 'TEST_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(test[0]);
    }

    // List with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const modelId = searchParams.get('modelId');
    const strategyId = searchParams.get('strategyId');
    const status = searchParams.get('status');

    let conditions = [eq(walkForwardTests.userId, user.id)];

    if (modelId && !isNaN(parseInt(modelId))) {
      conditions.push(eq(walkForwardTests.modelId, parseInt(modelId)));
    }

    if (strategyId && !isNaN(parseInt(strategyId))) {
      conditions.push(eq(walkForwardTests.strategyId, parseInt(strategyId)));
    }

    if (status) {
      const validStatuses = ['running', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      conditions.push(eq(walkForwardTests.status, status));
    }

    const tests = await db.select()
      .from(walkForwardTests)
      .where(and(...conditions))
      .orderBy(desc(walkForwardTests.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(tests);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { 
      name, 
      modelId, 
      strategyId, 
      trainWindowDays, 
      testWindowDays, 
      totalWindows,
      status,
      completedWindows
    } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!modelId) {
      return NextResponse.json({ 
        error: "Model ID is required",
        code: "MISSING_MODEL_ID" 
      }, { status: 400 });
    }

    if (!strategyId) {
      return NextResponse.json({ 
        error: "Strategy ID is required",
        code: "MISSING_STRATEGY_ID" 
      }, { status: 400 });
    }

    if (!trainWindowDays || trainWindowDays <= 0) {
      return NextResponse.json({ 
        error: "Train window days must be greater than 0",
        code: "INVALID_TRAIN_WINDOW" 
      }, { status: 400 });
    }

    if (!testWindowDays || testWindowDays <= 0) {
      return NextResponse.json({ 
        error: "Test window days must be greater than 0",
        code: "INVALID_TEST_WINDOW" 
      }, { status: 400 });
    }

    if (!totalWindows || totalWindows <= 0) {
      return NextResponse.json({ 
        error: "Total windows must be greater than 0",
        code: "INVALID_TOTAL_WINDOWS" 
      }, { status: 400 });
    }

    // Validate modelId exists
    const model = await db.select()
      .from(mlModels)
      .where(eq(mlModels.id, parseInt(modelId)))
      .limit(1);

    if (model.length === 0) {
      return NextResponse.json({ 
        error: "Model not found",
        code: "MODEL_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate strategyId exists and belongs to user - userId is now text
    const strategy = await db.select()
      .from(strategies)
      .where(and(
        eq(strategies.id, parseInt(strategyId)),
        eq(strategies.userId, user.id)
      ))
      .limit(1);

    if (strategy.length === 0) {
      return NextResponse.json({ 
        error: "Strategy not found or does not belong to user",
        code: "STRATEGY_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['running', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
    }

    const newTest = await db.insert(walkForwardTests)
      .values({
        name: name.trim(),
        modelId: parseInt(modelId),
        strategyId: parseInt(strategyId),
        userId: user.id,
        trainWindowDays: parseInt(trainWindowDays),
        testWindowDays: parseInt(testWindowDays),
        totalWindows: parseInt(totalWindows),
        completedWindows: completedWindows ? parseInt(completedWindows) : 0,
        status: status || 'running',
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newTest[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if test exists and belongs to user
    const existingTest = await db.select()
      .from(walkForwardTests)
      .where(and(
        eq(walkForwardTests.id, parseInt(id)),
        eq(walkForwardTests.userId, user.id)
      ))
      .limit(1);

    if (existingTest.length === 0) {
      return NextResponse.json({ 
        error: 'Walk-forward test not found',
        code: 'TEST_NOT_FOUND' 
      }, { status: 404 });
    }

    const { 
      completedWindows,
      avgInSampleSharpe,
      avgOutSampleSharpe,
      degradationRatio,
      totalReturn,
      maxDrawdown,
      resultsByWindow,
      status
    } = body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['running', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
    }

    // Validate resultsByWindow is valid JSON if provided
    if (resultsByWindow !== undefined && resultsByWindow !== null) {
      try {
        if (typeof resultsByWindow === 'string') {
          JSON.parse(resultsByWindow);
        } else if (typeof resultsByWindow !== 'object') {
          return NextResponse.json({ 
            error: "Results by window must be a valid JSON object",
            code: "INVALID_JSON" 
          }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ 
          error: "Results by window must be a valid JSON object",
          code: "INVALID_JSON" 
        }, { status: 400 });
      }
    }

    // Build update object
    const updates: any = {};

    if (completedWindows !== undefined) {
      updates.completedWindows = parseInt(completedWindows);
    }

    if (avgInSampleSharpe !== undefined) {
      updates.avgInSampleSharpe = parseFloat(avgInSampleSharpe);
    }

    if (avgOutSampleSharpe !== undefined) {
      updates.avgOutSampleSharpe = parseFloat(avgOutSampleSharpe);
    }

    if (totalReturn !== undefined) {
      updates.totalReturn = parseFloat(totalReturn);
    }

    if (maxDrawdown !== undefined) {
      updates.maxDrawdown = parseFloat(maxDrawdown);
    }

    if (resultsByWindow !== undefined) {
      updates.resultsByWindow = typeof resultsByWindow === 'string' 
        ? resultsByWindow 
        : JSON.stringify(resultsByWindow);
    }

    if (status !== undefined) {
      updates.status = status;
    }

    // Calculate degradation ratio if both sharpe ratios are provided
    if (degradationRatio !== undefined) {
      updates.degradationRatio = parseFloat(degradationRatio);
    } else if (avgInSampleSharpe !== undefined && avgOutSampleSharpe !== undefined) {
      const inSample = parseFloat(avgInSampleSharpe);
      const outSample = parseFloat(avgOutSampleSharpe);
      if (inSample !== 0) {
        updates.degradationRatio = outSample / inSample;
      }
    } else if (updates.avgInSampleSharpe !== undefined && updates.avgOutSampleSharpe !== undefined) {
      if (updates.avgInSampleSharpe !== 0) {
        updates.degradationRatio = updates.avgOutSampleSharpe / updates.avgInSampleSharpe;
      }
    }

    // Auto-set completedAt if status becomes completed or failed
    if (status === 'completed' || status === 'failed') {
      updates.completedAt = new Date().toISOString();
    }

    const updated = await db.update(walkForwardTests)
      .set(updates)
      .where(and(
        eq(walkForwardTests.id, parseInt(id)),
        eq(walkForwardTests.userId, user.id)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Walk-forward test not found',
        code: 'TEST_NOT_FOUND' 
      }, { status: 404 });
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if test exists and belongs to user
    const existingTest = await db.select()
      .from(walkForwardTests)
      .where(and(
        eq(walkForwardTests.id, parseInt(id)),
        eq(walkForwardTests.userId, user.id)
      ))
      .limit(1);

    if (existingTest.length === 0) {
      return NextResponse.json({ 
        error: 'Walk-forward test not found',
        code: 'TEST_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(walkForwardTests)
      .where(and(
        eq(walkForwardTests.id, parseInt(id)),
        eq(walkForwardTests.userId, user.id)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Walk-forward test not found',
        code: 'TEST_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Walk-forward test deleted successfully',
      data: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
