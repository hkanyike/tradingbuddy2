import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { optionsQuotes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * GET /api/market-data/options-quotes/latest
 * Fetches the latest options quotes for a given symbol
 * Query params: symbol (required), limit (optional, default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!symbol) {
      return NextResponse.json(
        { error: "Missing required parameter: symbol" },
        { status: 400 }
      );
    }

    // Fetch latest options quotes for the symbol
    const quotes = await db
      .select()
      .from(optionsQuotes)
      .where(eq(optionsQuotes.symbol, symbol.toUpperCase()))
      .orderBy(desc(optionsQuotes.timestamp))
      .limit(limit);

    return NextResponse.json(quotes);
  } catch (error: any) {
    console.error("Error fetching options quotes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch options quotes" },
      { status: 500 }
    );
  }
}