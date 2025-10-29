import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paperOrders, paperTradingAccounts, paperPositions, assets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface SpreadLeg {
  assetId: number;
  side: 'buy' | 'sell';
  quantity: number;
  strikePrice?: number;
  expirationDate?: string;
  optionType?: 'call' | 'put';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      paperAccountId, 
      spreadType,
      underlyingSymbol,
      legs,
      marketPrice,
    } = body;

    // Validate required fields
    if (!paperAccountId || !spreadType || !underlyingSymbol || !legs || !Array.isArray(legs) || legs.length === 0) {
      return NextResponse.json({ 
        error: "Missing required fields: paperAccountId, spreadType, underlyingSymbol, legs (array)",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    const accountId = parseInt(paperAccountId);
    if (isNaN(accountId) || accountId <= 0) {
      return NextResponse.json({ 
        error: "paperAccountId must be a valid positive integer",
        code: "INVALID_ACCOUNT_ID" 
      }, { status: 400 });
    }

    // Validate spread type
    const validSpreadTypes = ['straddle', 'strangle', 'calendar', 'iron_condor', 'butterfly', 'vertical'];
    if (!validSpreadTypes.includes(spreadType)) {
      return NextResponse.json({ 
        error: `spreadType must be one of: ${validSpreadTypes.join(', ')}`,
        code: "INVALID_SPREAD_TYPE" 
      }, { status: 400 });
    }

    // Check if paper account exists and is active
    const account = await db.select()
      .from(paperTradingAccounts)
      .where(eq(paperTradingAccounts.id, accountId))
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({ 
        error: "Paper trading account not found",
        code: "ACCOUNT_NOT_FOUND" 
      }, { status: 404 });
    }

    if (!account[0].isActive) {
      return NextResponse.json({ 
        error: "Paper trading account is not active",
        code: "ACCOUNT_NOT_ACTIVE" 
      }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();
    const executedLegs = [];
    let totalCost = 0;
    let totalCredit = 0;

    // Process each leg of the complex order
    for (const leg of legs) {
      const { assetId, side, quantity, strikePrice, expirationDate, optionType } = leg as SpreadLeg;

      // Validate leg fields
      if (!assetId || !side || !quantity) {
        return NextResponse.json({ 
          error: "Each leg must have assetId, side, and quantity",
          code: "INVALID_LEG_DATA" 
        }, { status: 400 });
      }

      // Verify asset exists
      const asset = await db.select()
        .from(assets)
        .where(eq(assets.id, assetId))
        .limit(1);

      if (asset.length === 0) {
        return NextResponse.json({ 
          error: `Asset with ID ${assetId} not found`,
          code: "ASSET_NOT_FOUND" 
        }, { status: 404 });
      }

      // Calculate option price with realistic pricing
      // For demo purposes, using Black-Scholes approximation
      const underlyingPrice = marketPrice || 100;
      const strike = strikePrice || underlyingPrice;
      const daysToExpiry = 30; // Default to 30 days
      const volatility = 0.3; // 30% IV
      
      // Simplified option pricing (intrinsic + time value)
      let optionPrice = 0;
      const intrinsicValue = optionType === 'call' 
        ? Math.max(underlyingPrice - strike, 0)
        : Math.max(strike - underlyingPrice, 0);
      const timeValue = Math.sqrt(daysToExpiry / 365) * volatility * underlyingPrice * 0.4;
      optionPrice = intrinsicValue + timeValue;

      // Apply bid-ask spread (1% slippage)
      const fillPrice = side === 'buy' 
        ? optionPrice * 1.01
        : optionPrice * 0.99;

      // Create order for this leg
      const legOrder = await db.insert(paperOrders)
        .values({
          paperAccountId: accountId,
          assetId: assetId,
          orderType: 'market',
          side: side,
          quantity: quantity,
          status: 'pending',
          filledQuantity: 0,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        })
        .returning();

      const legCost = fillPrice * quantity * 100; // Options are in contracts of 100

      if (side === 'buy') {
        totalCost += legCost;
      } else {
        totalCredit += legCost;
      }

      // Update order to filled
      await db.update(paperOrders)
        .set({
          status: 'filled',
          filledQuantity: quantity,
          filledPrice: fillPrice,
          filledAt: currentTimestamp,
          updatedAt: currentTimestamp,
        })
        .where(eq(paperOrders.id, legOrder[0].id));

      // Update or create position for this leg
      const existingPosition = await db.select()
        .from(paperPositions)
        .where(
          and(
            eq(paperPositions.paperAccountId, accountId),
            eq(paperPositions.assetId, assetId)
          )
        )
        .limit(1);

      if (existingPosition.length > 0) {
        const pos = existingPosition[0];
        const newQuantity = side === 'buy' 
          ? pos.quantity + quantity 
          : pos.quantity - quantity;

        if (newQuantity !== 0) {
          const totalValue = (pos.averageCost * pos.quantity) + (fillPrice * (side === 'buy' ? quantity : -quantity));
          const newAverageCost = totalValue / newQuantity;

          await db.update(paperPositions)
            .set({
              quantity: newQuantity,
              averageCost: Math.abs(newAverageCost),
              currentPrice: fillPrice,
              unrealizedPnl: (fillPrice - Math.abs(newAverageCost)) * newQuantity,
              lastUpdated: currentTimestamp,
            })
            .where(eq(paperPositions.id, pos.id));
        } else {
          // Position closed
          await db.delete(paperPositions)
            .where(eq(paperPositions.id, pos.id));
        }
      } else if (side === 'buy') {
        // Create new position for buy orders
        await db.insert(paperPositions)
          .values({
            paperAccountId: accountId,
            assetId: assetId,
            quantity: quantity,
            averageCost: fillPrice,
            currentPrice: fillPrice,
            unrealizedPnl: 0,
            realizedPnl: 0,
            lastUpdated: currentTimestamp,
          });
      }

      executedLegs.push({
        orderId: legOrder[0].id,
        assetId: assetId,
        symbol: asset[0].symbol,
        side: side,
        quantity: quantity,
        fillPrice: fillPrice,
        strikePrice: strikePrice,
        expirationDate: expirationDate,
        optionType: optionType,
        legCost: legCost,
      });
    }

    // Calculate net debit/credit
    const netCost = totalCost - totalCredit;
    const isDebitSpread = netCost > 0;

    // Check if sufficient funds for debit spreads
    if (isDebitSpread && account[0].cashBalance < netCost) {
      return NextResponse.json({ 
        error: "Insufficient funds for this spread order",
        code: "INSUFFICIENT_FUNDS",
        requiredFunds: netCost,
        availableFunds: account[0].cashBalance
      }, { status: 400 });
    }

    // Update account balance
    const newCashBalance = isDebitSpread 
      ? account[0].cashBalance - netCost
      : account[0].cashBalance + Math.abs(netCost);

    // Calculate total equity
    const allPositions = await db.select()
      .from(paperPositions)
      .where(eq(paperPositions.paperAccountId, accountId));

    let totalPositionValue = 0;
    for (const pos of allPositions) {
      totalPositionValue += (pos.currentPrice || pos.averageCost) * pos.quantity * 100;
    }

    const totalEquity = newCashBalance + totalPositionValue;
    const totalPnl = totalEquity - account[0].initialBalance;

    await db.update(paperTradingAccounts)
      .set({
        cashBalance: newCashBalance,
        totalEquity: totalEquity,
        totalPnl: totalPnl,
        updatedAt: currentTimestamp,
      })
      .where(eq(paperTradingAccounts.id, accountId));

    return NextResponse.json({
      message: "Complex order executed successfully",
      spreadType: spreadType,
      underlyingSymbol: underlyingSymbol,
      legs: executedLegs,
      execution: {
        netCost: isDebitSpread ? netCost : -Math.abs(netCost),
        isDebitSpread: isDebitSpread,
        totalCost: totalCost,
        totalCredit: totalCredit,
        newCashBalance: newCashBalance,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
