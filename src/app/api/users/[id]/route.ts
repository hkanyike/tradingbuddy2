import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Validate ID is not empty
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    // Users can only access their own profile (unless admin in future)
    if (id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(userRecord[0], { status: 200 });
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

  try {
    const { id } = await params;

    // Validate ID is not empty
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    // Users can only update their own profile
    if (id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, name, portfolioBalance, riskTolerance, executionMode } = body;

    const updates: {
      email?: string;
      name?: string;
      portfolioBalance?: number;
      riskTolerance?: string;
      executionMode?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date()
    };

    if (email !== undefined) {
      if (!email || typeof email !== 'string' || !email.trim()) {
        return NextResponse.json(
          { 
            error: "Valid email is required",
            code: "INVALID_EMAIL" 
          },
          { status: 400 }
        );
      }
      updates.email = email.toLowerCase().trim();
    }

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { 
            error: "Valid name is required",
            code: "INVALID_NAME" 
          },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (portfolioBalance !== undefined) {
      if (typeof portfolioBalance !== 'number' || portfolioBalance < 0) {
        return NextResponse.json(
          { 
            error: "Portfolio balance must be a non-negative number",
            code: "INVALID_PORTFOLIO_BALANCE" 
          },
          { status: 400 }
        );
      }
      updates.portfolioBalance = portfolioBalance;
    }

    if (riskTolerance !== undefined) {
      const validRiskLevels = ['conservative', 'moderate', 'aggressive'];
      if (!validRiskLevels.includes(riskTolerance)) {
        return NextResponse.json(
          { 
            error: "Risk tolerance must be 'conservative', 'moderate', or 'aggressive'",
            code: "INVALID_RISK_TOLERANCE" 
          },
          { status: 400 }
        );
      }
      updates.riskTolerance = riskTolerance;
    }

    if (executionMode !== undefined) {
      const validModes = ['manual', 'semi-automatic', 'automatic'];
      if (!validModes.includes(executionMode)) {
        return NextResponse.json(
          { 
            error: "Execution mode must be 'manual', 'semi-automatic', or 'automatic'",
            code: "INVALID_EXECUTION_MODE" 
          },
          { status: 400 }
        );
      }
      updates.executionMode = executionMode;
    }

    const updatedUser = await db.update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning();

    return NextResponse.json(updatedUser[0], { status: 200 });
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

  try {
    const { id } = await params;

    // Validate ID is not empty
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    // Users can only delete their own profile
    if (id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const deletedUser = await db.delete(user)
      .where(eq(user.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        user: deletedUser[0]
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