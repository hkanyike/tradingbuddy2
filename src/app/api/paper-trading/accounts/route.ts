import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paperTradingAccounts, user } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const account = await db.select()
        .from(paperTradingAccounts)
        .where(eq(paperTradingAccounts.id, parseInt(id)))
        .limit(1);

      if (account.length === 0) {
        return NextResponse.json({ 
          error: 'Paper trading account not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(account[0], { status: 200 });
    }

    // List query with optional userId filter - userId is now text
    let query = db.select()
      .from(paperTradingAccounts)
      .orderBy(desc(paperTradingAccounts.createdAt));

    if (userId) {
      const accounts = await query
        .where(eq(paperTradingAccounts.userId, userId))
        .limit(limit)
        .offset(offset);
      
      return NextResponse.json(accounts, { status: 200 });
    }

    const accounts = await query.limit(limit).offset(offset);
    return NextResponse.json(accounts, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: "INTERNAL_ERROR" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cashBalance, initialBalance } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (cashBalance === undefined || cashBalance === null) {
      return NextResponse.json({ 
        error: "cashBalance is required",
        code: "MISSING_CASH_BALANCE" 
      }, { status: 400 });
    }

    if (initialBalance === undefined || initialBalance === null) {
      return NextResponse.json({ 
        error: "initialBalance is required",
        code: "MISSING_INITIAL_BALANCE" 
      }, { status: 400 });
    }

    // Validate cashBalance is positive number
    if (typeof cashBalance !== 'number' || cashBalance <= 0) {
      return NextResponse.json({ 
        error: "cashBalance must be a positive number",
        code: "INVALID_CASH_BALANCE" 
      }, { status: 400 });
    }

    // Validate initialBalance is positive number
    if (typeof initialBalance !== 'number' || initialBalance <= 0) {
      return NextResponse.json({ 
        error: "initialBalance must be a positive number",
        code: "INVALID_INITIAL_BALANCE" 
      }, { status: 400 });
    }

    // Verify user exists - userId is now text
    const userExists = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Create new paper trading account
    const now = new Date().toISOString();
    const newAccount = await db.insert(paperTradingAccounts)
      .values({
        userId: userId,
        cashBalance: cashBalance,
        initialBalance: initialBalance,
        totalEquity: cashBalance,
        totalPnl: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newAccount[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: "INTERNAL_ERROR" 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id) {
      return NextResponse.json({ 
        error: "ID parameter is required",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if account exists
    const existingAccount = await db.select()
      .from(paperTradingAccounts)
      .where(eq(paperTradingAccounts.id, parseInt(id)))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json({ 
        error: 'Paper trading account not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { cashBalance, totalEquity, totalPnl, isActive } = body;

    // Validate cashBalance if provided
    if (cashBalance !== undefined) {
      if (typeof cashBalance !== 'number' || cashBalance <= 0) {
        return NextResponse.json({ 
          error: "cashBalance must be a positive number",
          code: "INVALID_CASH_BALANCE" 
        }, { status: 400 });
      }
    }

    // Validate totalEquity if provided
    if (totalEquity !== undefined) {
      if (typeof totalEquity !== 'number' || totalEquity <= 0) {
        return NextResponse.json({ 
          error: "totalEquity must be a positive number",
          code: "INVALID_TOTAL_EQUITY" 
        }, { status: 400 });
      }
    }

    // Validate totalPnl if provided
    if (totalPnl !== undefined && typeof totalPnl !== 'number') {
      return NextResponse.json({ 
        error: "totalPnl must be a number",
        code: "INVALID_TOTAL_PNL" 
      }, { status: 400 });
    }

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json({ 
        error: "isActive must be a boolean",
        code: "INVALID_IS_ACTIVE" 
      }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData: {
      cashBalance?: number;
      totalEquity?: number;
      totalPnl?: number;
      isActive?: boolean;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (cashBalance !== undefined) updateData.cashBalance = cashBalance;
    if (totalEquity !== undefined) updateData.totalEquity = totalEquity;
    if (totalPnl !== undefined) updateData.totalPnl = totalPnl;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update account
    const updatedAccount = await db.update(paperTradingAccounts)
      .set(updateData)
      .where(eq(paperTradingAccounts.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedAccount[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: "INTERNAL_ERROR" 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id) {
      return NextResponse.json({ 
        error: "ID parameter is required",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if account exists
    const existingAccount = await db.select()
      .from(paperTradingAccounts)
      .where(eq(paperTradingAccounts.id, parseInt(id)))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json({ 
        error: 'Paper trading account not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete account
    const deletedAccount = await db.delete(paperTradingAccounts)
      .where(eq(paperTradingAccounts.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Paper trading account deleted successfully',
      account: deletedAccount[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: "INTERNAL_ERROR" 
    }, { status: 500 });
  }
}