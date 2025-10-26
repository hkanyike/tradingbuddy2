import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paperOrders, paperTradingAccounts, paperPositions, assets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      paperAccountId, 
      assetId, 
      orderType, 
      side, 
      quantity, 
      marketPrice,
      limitPrice,
      stopPrice 
    } = body;

    // Validate required fields
    if (!paperAccountId || !assetId || !orderType || !side || !quantity || !marketPrice) {
      return NextResponse.json({ 
        error: "Missing required fields: paperAccountId, assetId, orderType, side, quantity, marketPrice",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    // Validate field types and values
    const accountId = parseInt(paperAccountId);
    const astId = parseInt(assetId);
    const qty = parseInt(quantity);
    const mktPrice = parseFloat(marketPrice);

    if (isNaN(accountId) || accountId <= 0) {
      return NextResponse.json({ 
        error: "paperAccountId must be a valid positive integer",
        code: "INVALID_ACCOUNT_ID" 
      }, { status: 400 });
    }

    if (isNaN(astId) || astId <= 0) {
      return NextResponse.json({ 
        error: "assetId must be a valid positive integer",
        code: "INVALID_ASSET_ID" 
      }, { status: 400 });
    }

    if (!['market', 'limit', 'stop'].includes(orderType)) {
      return NextResponse.json({ 
        error: "orderType must be 'market', 'limit', or 'stop'",
        code: "INVALID_ORDER_TYPE" 
      }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ 
        error: "side must be 'buy' or 'sell'",
        code: "INVALID_SIDE" 
      }, { status: 400 });
    }

    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ 
        error: "quantity must be a positive integer",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    if (isNaN(mktPrice) || mktPrice <= 0) {
      return NextResponse.json({ 
        error: "marketPrice must be a positive number",
        code: "INVALID_MARKET_PRICE" 
      }, { status: 400 });
    }

    // Validate conditional required fields
    if (orderType === 'limit') {
      if (!limitPrice) {
        return NextResponse.json({ 
          error: "limitPrice is required for limit orders",
          code: "MISSING_LIMIT_PRICE" 
        }, { status: 400 });
      }
      const lmtPrice = parseFloat(limitPrice);
      if (isNaN(lmtPrice) || lmtPrice <= 0) {
        return NextResponse.json({ 
          error: "limitPrice must be a positive number",
          code: "INVALID_LIMIT_PRICE" 
        }, { status: 400 });
      }
    }

    if (orderType === 'stop') {
      if (!stopPrice) {
        return NextResponse.json({ 
          error: "stopPrice is required for stop orders",
          code: "MISSING_STOP_PRICE" 
        }, { status: 400 });
      }
      const stpPrice = parseFloat(stopPrice);
      if (isNaN(stpPrice) || stpPrice <= 0) {
        return NextResponse.json({ 
          error: "stopPrice must be a positive number",
          code: "INVALID_STOP_PRICE" 
        }, { status: 400 });
      }
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

    // Check if asset exists
    const asset = await db.select()
      .from(assets)
      .where(eq(assets.id, astId))
      .limit(1);

    if (asset.length === 0) {
      return NextResponse.json({ 
        error: "Asset not found",
        code: "ASSET_NOT_FOUND" 
      }, { status: 404 });
    }

    const currentTimestamp = new Date().toISOString();

    // Create pending order
    const pendingOrder = await db.insert(paperOrders)
      .values({
        paperAccountId: accountId,
        assetId: astId,
        orderType,
        side,
        quantity: qty,
        limitPrice: limitPrice ? parseFloat(limitPrice) : null,
        stopPrice: stopPrice ? parseFloat(stopPrice) : null,
        status: 'pending',
        filledQuantity: 0,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      })
      .returning();

    const orderId = pendingOrder[0].id;

    // Calculate fill price based on order type and slippage
    let fillPrice: number;
    let shouldFill = true;
    let rejectReason = '';

    if (orderType === 'market') {
      // Market orders: Apply 0.1% slippage
      const slippageRate = 0.001;
      fillPrice = side === 'buy' 
        ? mktPrice * (1 + slippageRate)
        : mktPrice * (1 - slippageRate);
    } else if (orderType === 'limit') {
      const lmtPrice = parseFloat(limitPrice!);
      // Limit orders: Check if price condition is met
      if (side === 'buy' && mktPrice <= lmtPrice) {
        fillPrice = lmtPrice;
      } else if (side === 'sell' && mktPrice >= lmtPrice) {
        fillPrice = lmtPrice;
      } else {
        shouldFill = false;
        rejectReason = 'Limit price condition not met';
      }
    } else { // stop order
      const stpPrice = parseFloat(stopPrice!);
      // Stop orders: Check if trigger condition is met
      if (side === 'buy' && mktPrice >= stpPrice) {
        // Trigger and fill with 0.15% slippage
        fillPrice = mktPrice * 1.0015;
      } else if (side === 'sell' && mktPrice <= stpPrice) {
        // Trigger and fill with 0.15% slippage
        fillPrice = mktPrice * 0.9985;
      } else {
        shouldFill = false;
        rejectReason = 'Stop price not triggered';
      }
    }

    if (!shouldFill) {
      // Update order status to rejected
      await db.update(paperOrders)
        .set({
          status: 'rejected',
          updatedAt: currentTimestamp,
        })
        .where(eq(paperOrders.id, orderId));

      const code = orderType === 'limit' ? 'LIMIT_NOT_MET' : 'STOP_NOT_TRIGGERED';
      return NextResponse.json({ 
        error: rejectReason,
        code 
      }, { status: 400 });
    }

    let totalCost: number;
    let newCashBalance: number;
    let positionResult: any = null;
    const slippageAmount = Math.abs(fillPrice! - mktPrice);

    if (side === 'buy') {
      // BUY order execution
      totalCost = fillPrice! * qty;

      // Check if sufficient funds
      if (account[0].cashBalance < totalCost) {
        // Update order status to rejected
        await db.update(paperOrders)
          .set({
            status: 'rejected',
            updatedAt: currentTimestamp,
          })
          .where(eq(paperOrders.id, orderId));

        return NextResponse.json({ 
          error: "Insufficient funds for this order",
          code: "INSUFFICIENT_FUNDS" 
        }, { status: 400 });
      }

      // Deduct from cash balance
      newCashBalance = account[0].cashBalance - totalCost;

      // Update or create position
      const existingPosition = await db.select()
        .from(paperPositions)
        .where(and(
          eq(paperPositions.paperAccountId, accountId),
          eq(paperPositions.assetId, astId)
        ))
        .limit(1);

      if (existingPosition.length > 0) {
        // Update existing position with weighted average cost
        const pos = existingPosition[0];
        const totalQuantity = pos.quantity + qty;
        const totalValue = (pos.averageCost * pos.quantity) + (fillPrice! * qty);
        const newAverageCost = totalValue / totalQuantity;

        const updatedPosition = await db.update(paperPositions)
          .set({
            quantity: totalQuantity,
            averageCost: newAverageCost,
            currentPrice: mktPrice,
            unrealizedPnl: (mktPrice - newAverageCost) * totalQuantity,
            lastUpdated: currentTimestamp,
          })
          .where(eq(paperPositions.id, pos.id))
          .returning();

        positionResult = updatedPosition[0];
      } else {
        // Create new position
        const newPosition = await db.insert(paperPositions)
          .values({
            paperAccountId: accountId,
            assetId: astId,
            quantity: qty,
            averageCost: fillPrice!,
            currentPrice: mktPrice,
            unrealizedPnl: (mktPrice - fillPrice!) * qty,
            realizedPnl: 0,
            lastUpdated: currentTimestamp,
          })
          .returning();

        positionResult = newPosition[0];
      }

    } else {
      // SELL order execution
      // Check if position exists with sufficient quantity
      const existingPosition = await db.select()
        .from(paperPositions)
        .where(and(
          eq(paperPositions.paperAccountId, accountId),
          eq(paperPositions.assetId, astId)
        ))
        .limit(1);

      if (existingPosition.length === 0 || existingPosition[0].quantity < qty) {
        // Update order status to rejected
        await db.update(paperOrders)
          .set({
            status: 'rejected',
            updatedAt: currentTimestamp,
          })
          .where(eq(paperOrders.id, orderId));

        return NextResponse.json({ 
          error: "Insufficient position quantity for this sell order",
          code: "INSUFFICIENT_POSITION" 
        }, { status: 400 });
      }

      const pos = existingPosition[0];
      totalCost = fillPrice! * qty;

      // Calculate realized PnL
      const realizedPnl = (fillPrice! - pos.averageCost) * qty;

      // Add proceeds to cash balance
      newCashBalance = account[0].cashBalance + totalCost;

      // Update position
      const newQuantity = pos.quantity - qty;

      if (newQuantity === 0) {
        // Delete position if quantity becomes 0
        await db.delete(paperPositions)
          .where(eq(paperPositions.id, pos.id));
        positionResult = null;
      } else {
        // Update position
        const updatedPosition = await db.update(paperPositions)
          .set({
            quantity: newQuantity,
            currentPrice: mktPrice,
            unrealizedPnl: (mktPrice - pos.averageCost) * newQuantity,
            realizedPnl: pos.realizedPnl + realizedPnl,
            lastUpdated: currentTimestamp,
          })
          .where(eq(paperPositions.id, pos.id))
          .returning();

        positionResult = updatedPosition[0];
      }
    }

    // Update order status to filled
    const filledOrder = await db.update(paperOrders)
      .set({
        status: 'filled',
        filledQuantity: qty,
        filledPrice: fillPrice!,
        filledAt: currentTimestamp,
        updatedAt: currentTimestamp,
      })
      .where(eq(paperOrders.id, orderId))
      .returning();

    // Calculate total equity and PnL
    const allPositions = await db.select()
      .from(paperPositions)
      .where(eq(paperPositions.paperAccountId, accountId));

    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    let totalPositionValue = 0;

    for (const pos of allPositions) {
      totalUnrealizedPnl += pos.unrealizedPnl || 0;
      totalRealizedPnl += pos.realizedPnl || 0;
      totalPositionValue += (pos.currentPrice || pos.averageCost) * pos.quantity;
    }

    const totalEquity = newCashBalance + totalPositionValue;
    const totalPnl = totalEquity - account[0].initialBalance;

    // Update account
    await db.update(paperTradingAccounts)
      .set({
        cashBalance: newCashBalance,
        totalEquity,
        totalPnl,
        updatedAt: currentTimestamp,
      })
      .where(eq(paperTradingAccounts.id, accountId));

    return NextResponse.json({
      message: "Order executed successfully",
      order: filledOrder[0],
      execution: {
        fillPrice: fillPrice!,
        totalCost,
        slippage: slippageAmount,
        newCashBalance,
      },
      position: positionResult,
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}