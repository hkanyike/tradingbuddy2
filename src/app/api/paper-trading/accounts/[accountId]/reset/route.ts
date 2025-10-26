import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paperTradingAccounts, paperPositions, paperOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    // Validate accountId parameter
    if (!accountId || isNaN(parseInt(accountId))) {
      return NextResponse.json(
        { 
          error: 'Valid account ID is required',
          code: 'INVALID_ACCOUNT_ID'
        },
        { status: 400 }
      );
    }

    const parsedAccountId = parseInt(accountId);

    // Fetch the account to verify it exists and get initialBalance
    const existingAccount = await db
      .select()
      .from(paperTradingAccounts)
      .where(eq(paperTradingAccounts.id, parsedAccountId))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json(
        { 
          error: 'Paper trading account not found',
          code: 'ACCOUNT_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const account = existingAccount[0];
    const initialBalance = account.initialBalance;

    // Delete all positions associated with the account
    const deletedPositions = await db
      .delete(paperPositions)
      .where(eq(paperPositions.paperAccountId, parsedAccountId))
      .returning();

    // Update all orders associated with the account to status 'canceled'
    const canceledOrders = await db
      .update(paperOrders)
      .set({
        status: 'canceled',
        updatedAt: new Date().toISOString()
      })
      .where(eq(paperOrders.paperAccountId, parsedAccountId))
      .returning();

    // Reset account values
    const resetAccount = await db
      .update(paperTradingAccounts)
      .set({
        cashBalance: initialBalance,
        totalEquity: initialBalance,
        totalPnl: 0,
        updatedAt: new Date().toISOString()
      })
      .where(eq(paperTradingAccounts.id, parsedAccountId))
      .returning();

    return NextResponse.json(
      {
        message: 'Paper trading account reset successfully',
        account: resetAccount[0],
        deletedPositions: deletedPositions.length,
        canceledOrders: canceledOrders.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}