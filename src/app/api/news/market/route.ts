import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/news/market
 * Fetch general market news from Finnhub
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Finnhub API key not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "general";

    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    const newsData = await response.json();

    return NextResponse.json({
      success: true,
      data: newsData,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error fetching market news:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch market news" },
      { status: 500 }
    );
  }
}