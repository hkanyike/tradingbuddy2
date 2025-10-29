import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { optionsQuotes, marketDataFetches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchOptionsChain, fetchUnderlyingQuote } from "@/lib/alpaca";

/**
 * POST /api/alpaca/fetch-options
 * Fetches options chain from Alpaca and stores in database
 * 
 * Body: { symbol: string, expirationDate?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, expirationDate } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: "Missing required parameter: symbol" },
        { status: 400 }
      );
    }

    // Create a fetch record
    const [fetchRecord] = await db
      .insert(marketDataFetches)
      .values({
        fetchType: "options_chain",
        symbols: symbol.toUpperCase(),
        status: "in_progress",
        recordsFetched: 0,
        startedAt: new Date().toISOString(),
      })
      .returning();

    try {
      // Fetch options chain from Alpaca
      const optionsChain = await fetchOptionsChain(symbol, expirationDate);

      // Fetch underlying quote
      const underlyingQuote = await fetchUnderlyingQuote(symbol);

      // Store options quotes in database
      const insertedQuotes = [];
      for (const option of optionsChain) {
        const [quote] = await db
          .insert(optionsQuotes)
          .values({
            symbol: option.underlying_symbol,
            optionSymbol: option.symbol,
            optionType: option.option_type,
            strikePrice: option.strike_price,
            expirationDate: option.expiration_date,
            bid: option.bid,
            ask: option.ask,
            lastPrice: option.last,
            volume: option.volume,
            openInterest: option.open_interest || 0,
            impliedVolatility: option.implied_volatility,
            delta: option.delta,
            gamma: option.gamma,
            theta: option.theta,
            vega: option.vega,
            rho: option.rho,
            underlyingPrice: underlyingQuote.price,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          })
          .returning();
        
        insertedQuotes.push(quote);
      }

      // Update fetch record to completed
      await db
        .update(marketDataFetches)
        .set({
          status: "completed",
          recordsFetched: insertedQuotes.length,
          completedAt: new Date().toISOString(),
        })
        .where(eq(marketDataFetches.id, fetchRecord.id));

      return NextResponse.json({
        success: true,
        fetchId: fetchRecord.id,
        symbol: symbol.toUpperCase(),
        recordsInserted: insertedQuotes.length,
        underlyingPrice: underlyingQuote.price,
        expirationDate: expirationDate || "all",
        source: "alpaca",
      });
    } catch (error: any) {
      // Update fetch record to failed
      await db
        .update(marketDataFetches)
        .set({
          status: "failed",
          errorMessage: error.message,
          completedAt: new Date().toISOString(),
        })
        .where(eq(marketDataFetches.id, fetchRecord.id));

      throw error;
    }
  } catch (error: any) {
    console.error("Error fetching Alpaca options data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch options data" },
      { status: 500 }
    );
  }
}
