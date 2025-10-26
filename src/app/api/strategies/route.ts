import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { strategies } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const strategy = await db
        .select()
        .from(strategies)
        .where(and(
          eq(strategies.id, parseInt(id)),
          eq(strategies.userId, user.id)
        ))
        .limit(1);

      if (strategy.length === 0) {
        return NextResponse.json(
          { error: 'Strategy not found', code: 'STRATEGY_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(strategy[0], { status: 200 });
    }

    // List with pagination and search - filtered by authenticated user
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select().from(strategies).where(eq(strategies.userId, user.id));

    // Apply search filter
    if (search) {
      query = query.where(
        and(
          eq(strategies.userId, user.id),
          or(
            like(strategies.name, `%${search}%`),
            like(strategies.strategyType, `%${search}%`),
            like(strategies.description, `%${search}%`)
          )
        )
      );
    }

    // Apply sorting
    const sortColumn = sort === 'name' ? strategies.name : strategies.createdAt;
    query = order === 'asc' ? query.orderBy(sortColumn) : query.orderBy(desc(sortColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
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

    const { name, strategyType, description, isActive, config } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    // Prepare insert data with defaults and auto-generated fields
    const timestamp = new Date().toISOString();
    const insertData = {
      name: name.trim(),
      userId: user.id,
      strategyType: strategyType?.trim() || null,
      description: description?.trim() || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      config: config || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const newStrategy = await db
      .insert(strategies)
      .values(insertData)
      .returning();

    return NextResponse.json(newStrategy[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if strategy exists and belongs to user
    const existingStrategy = await db
      .select()
      .from(strategies)
      .where(and(
        eq(strategies.id, parseInt(id)),
        eq(strategies.userId, user.id)
      ))
      .limit(1);

    if (existingStrategy.length === 0) {
      return NextResponse.json(
        { error: 'Strategy not found', code: 'STRATEGY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, strategyType, description, isActive, config } = body;

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (strategyType !== undefined) {
      updateData.strategyType = strategyType?.trim() || null;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (config !== undefined) {
      updateData.config = config;
    }

    const updatedStrategy = await db
      .update(strategies)
      .set(updateData)
      .where(eq(strategies.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedStrategy[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if strategy exists and belongs to user
    const existingStrategy = await db
      .select()
      .from(strategies)
      .where(and(
        eq(strategies.id, parseInt(id)),
        eq(strategies.userId, user.id)
      ))
      .limit(1);

    if (existingStrategy.length === 0) {
      return NextResponse.json(
        { error: 'Strategy not found', code: 'STRATEGY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedStrategy = await db
      .delete(strategies)
      .where(eq(strategies.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Strategy deleted successfully',
        strategy: deletedStrategy[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}