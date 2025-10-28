import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, like, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user by ID
    if (id) {
      // Validate ID is not empty
      if (!id || id.trim() === '') {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const userRecord = await db
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

      if (userRecord.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(userRecord[0], { status: 200 });
    }

    // List users with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let query = db.select().from(user).orderBy(desc(user.createdAt));

    if (search) {
      query = db
        .select()
        .from(user)
        .where(
          or(
            like(user.name, `%${search}%`),
            like(user.email, `%${search}%`)
          )
        )
        .orderBy(desc(user.createdAt));
    }

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
    const body = await request.json();
    const { email, name, portfolioBalance, riskTolerance, executionMode } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'EMAIL_EXISTS' },
        { status: 400 }
      );
    }

    // Note: Better Auth handles user creation with proper ID generation
    // This endpoint should generally not be used directly
    return NextResponse.json(
      { 
        error: 'Please use Better Auth registration endpoints to create users',
        code: 'USE_AUTH_ENDPOINTS'
      },
      { status: 400 }
    );
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, name, portfolioBalance, riskTolerance, executionMode } = body;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update object
    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    // Validate and add email if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
          { status: 400 }
        );
      }

      const sanitizedEmail = email.trim().toLowerCase();

      // Check if email already exists for another user
      const emailExists = await db
        .select()
        .from(user)
        .where(eq(user.email, sanitizedEmail))
        .limit(1);

      if (emailExists.length > 0 && emailExists[0].id !== id) {
        return NextResponse.json(
          { error: 'Email already exists', code: 'EMAIL_EXISTS' },
          { status: 400 }
        );
      }

      updates.email = sanitizedEmail;
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (portfolioBalance !== undefined) {
      updates.portfolioBalance = portfolioBalance;
    }

    if (riskTolerance !== undefined) {
      updates.riskTolerance = riskTolerance;
    }

    if (executionMode !== undefined) {
      updates.executionMode = executionMode;
    }

    // Update user
    const updatedUser = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser[0], { status: 200 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user
    const deletedUser = await db
      .delete(user)
      .where(eq(user.id, id))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete user', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        user: deletedUser[0],
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
