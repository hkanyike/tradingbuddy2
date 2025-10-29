import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { strategies } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
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
        eq(strategies.userId, session.id)
      ))
      .limit(1);

    if (strategy.length === 0) {
      return NextResponse.json(
        { error: 'Strategy not found', code: 'STRATEGY_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(strategy[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verify ownership - userId is now text
    const existingStrategy = await db
      .select()
      .from(strategies)
      .where(and(
        eq(strategies.id, parseInt(id)),
        eq(strategies.userId, session.id)
      ))
      .limit(1);

    if (existingStrategy.length === 0) {
      return NextResponse.json(
        { error: 'Strategy not found', code: 'STRATEGY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    if (body.strategyType !== undefined) {
      updateData.strategyType = body.strategyType;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }
    if (body.config !== undefined) {
      updateData.config = body.config;
    }

    const updated = await db
      .update(strategies)
      .set(updateData)
      .where(eq(strategies.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Verify ownership - userId is now text
    const existingStrategy = await db
      .select()
      .from(strategies)
      .where(and(
        eq(strategies.id, parseInt(id)),
        eq(strategies.userId, session.id)
      ))
      .limit(1);

    if (existingStrategy.length === 0) {
      return NextResponse.json(
        { error: 'Strategy not found', code: 'STRATEGY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(strategies)
      .where(eq(strategies.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Strategy deleted successfully',
        deleted: deleted[0],
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