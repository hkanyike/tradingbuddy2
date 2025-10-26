import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paperTradingAccounts, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, initialBalance } = body;

    // Validate required fields
    if (!userId || initialBalance === undefined || initialBalance === null) {
      return NextResponse.json(
        {
          error: 'Missing required fields: userId and initialBalance are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validate initialBalance is a positive number within allowed range
    const parsedBalance = parseFloat(initialBalance);
    if (
      isNaN(parsedBalance) ||
      parsedBalance < 1000 ||
      parsedBalance > 10000000
    ) {
      return NextResponse.json(
        {
          error:
            'initialBalance must be a number between $1,000 and $10,000,000',
          code: 'INVALID_INITIAL_BALANCE',
        },
        { status: 400 }
      );
    }

    // Check if user exists - userId is now text
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if user already has an active paper trading account - userId is now text
    const existingAccount = await db
      .select()
      .from(paperTradingAccounts)
      .where(
        and(
          eq(paperTradingAccounts.userId, userId),
          eq(paperTradingAccounts.isActive, true)
        )
      )
      .limit(1);

    if (existingAccount.length > 0) {
      return NextResponse.json(
        {
          error: 'User already has an active paper trading account',
          code: 'ACCOUNT_ALREADY_EXISTS',
        },
        { status: 400 }
      );
    }

    // Create new paper trading account
    const currentTimestamp = new Date().toISOString();
    const newAccount = await db
      .insert(paperTradingAccounts)
      .values({
        userId: userId,
        cashBalance: parsedBalance,
        initialBalance: parsedBalance,
        totalEquity: parsedBalance,
        totalPnl: 0,
        isActive: true,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Paper trading account initialized successfully',
        account: newAccount[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}