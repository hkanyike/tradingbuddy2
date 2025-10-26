import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/news/earnings-calendar
 * Fetch earnings calendar from Finnhub
 * Query params: from, to (optional date ranges), symbol (optional - specific symbol)
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
    const symbol = searchParams.get("symbol");
    
    // Default to current week
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 14); // Next 2 weeks

    const from = searchParams.get("from") || weekStart.toISOString().split("T")[0];
    const to = searchParams.get("to") || weekEnd.toISOString().split("T")[0];

    let url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${apiKey}`;
    
    // If symbol is provided, filter for that symbol
    if (symbol) {
      url += `&symbol=${symbol}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    const earningsData = await response.json();

    // Filter and format data
    const formattedData = formatEarningsData(earningsData, symbol);

    return NextResponse.json({
      success: true,
      from,
      to,
      symbol: symbol || "all",
      data: formattedData,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error fetching earnings calendar:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch earnings calendar" },
      { status: 500 }
    );
  }
}

function formatEarningsData(data: any, symbol?: string | null) {
  if (!data || !data.earningsCalendar) {
    return [];
  }

  let earnings = data.earningsCalendar;

  // Filter by symbol if provided
  if (symbol) {
    earnings = earnings.filter((e: any) => 
      e.symbol?.toLowerCase() === symbol.toLowerCase()
    );
  }

  // Sort by date
  earnings.sort((a: any, b: any) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Add additional metadata
  return earnings.map((e: any) => ({
    ...e,
    daysUntil: calculateDaysUntil(e.date),
    isUpcoming: new Date(e.date) > new Date(),
    impact: estimateImpact(e)
  }));
}

function calculateDaysUntil(dateStr: string): number {
  const earningsDate = new Date(dateStr);
  const today = new Date();
  const diffTime = earningsDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function estimateImpact(earnings: any): "high" | "medium" | "low" {
  // Estimate impact based on available data
  // This is a simple heuristic - can be improved with more data
  if (earnings.revenueEstimate || earnings.epsEstimate) {
    return "high";
  }
  return "medium";
}