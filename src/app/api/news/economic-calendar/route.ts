import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/news/economic-calendar
 * Fetch economic calendar events from Trading Economics API
 * Query params: from, to (optional date ranges)
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.TRADING_ECONOMICS_API_KEY;
    
    if (!apiKey) {
      console.warn("Trading Economics API key not configured. Using fallback data.");
      return getFallbackEconomicCalendar(request);
    }

    const { searchParams } = new URL(request.url);
    
    // Default to next 30 days
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 30);

    const from = searchParams.get("from") || today.toISOString().split("T")[0];
    const to = searchParams.get("to") || futureDate.toISOString().split("T")[0];
    const country = searchParams.get("country") || "united states"; // Default to US

    // Trading Economics API endpoint
    const response = await fetch(
      `https://api.tradingeconomics.com/calendar?c=${apiKey}&country=${country}&d1=${from}&d2=${to}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      console.warn(`Trading Economics API error: ${response.statusText}. Using fallback.`);
      return getFallbackEconomicCalendar(request);
    }

    const economicData = await response.json();

    // Format and prioritize events
    const formattedData = formatTradingEconomicsData(economicData);

    return NextResponse.json({
      success: true,
      from,
      to,
      country,
      data: formattedData,
      highImpactEvents: formattedData.filter((e: any) => 
        e.impact === "high" || e.impact === "critical"
      ),
      source: "trading_economics",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error fetching economic calendar:", error);
    return getFallbackEconomicCalendar(request);
  }
}

function getFallbackEconomicCalendar(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 30);

  const from = searchParams.get("from") || today.toISOString().split("T")[0];
  const to = searchParams.get("to") || futureDate.toISOString().split("T")[0];

  const fallbackData = generateFallbackEconomicData(from, to);
  
  return NextResponse.json({
    success: true,
    from,
    to,
    data: fallbackData,
    highImpactEvents: fallbackData.filter((e: any) => 
      e.impact === "high" || e.impact === "critical"
    ),
    source: "fallback_estimates",
    timestamp: new Date().toISOString(),
    note: "Configure TRADING_ECONOMICS_API_KEY for real-time economic calendar data."
  });
}

function formatTradingEconomicsData(data: any[]): any[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((event: any) => ({
    time: event.Date || event.DateTime,
    country: event.Country,
    event: event.Event,
    category: event.Category,
    importance: event.Importance,
    impact: determineImpact(event),
    actual: event.Actual,
    forecast: event.Forecast,
    previous: event.Previous,
    revised: event.Revised,
    teRelevance: event.TeRelevance,
    daysUntil: calculateDaysUntil(event.Date || event.DateTime),
    isUpcoming: new Date(event.Date || event.DateTime) > new Date(),
    marketRelevance: determineMarketRelevance(event)
  })).sort((a, b) => {
    const dateCompare = new Date(a.time).getTime() - new Date(b.time).getTime();
    if (dateCompare !== 0) return dateCompare;
    
    const impactOrder: any = { critical: 4, high: 3, medium: 2, low: 1 };
    return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
  });
}

function determineImpact(event: any): "critical" | "high" | "medium" | "low" {
  const importance = event.Importance || event.importance || 1;
  
  // Trading Economics uses 1-3 scale (3 = highest impact)
  if (importance === 3) return "critical";
  if (importance === 2) return "high";
  if (importance === 1) return "medium";
  
  return "low";
}

function determineMarketRelevance(event: any): "critical" | "high" | "medium" | "low" {
  const criticalEvents = ["FOMC", "Federal Funds Rate", "Interest Rate", "CPI", "Non-Farm Payrolls", "NFP", "GDP"];
  const highImpactEvents = ["Unemployment", "Retail Sales", "PCE", "PPI", "Consumer Confidence", "PMI"];

  const eventName = (event.Event || event.event || "").toLowerCase();

  if (criticalEvents.some(keyword => eventName.includes(keyword.toLowerCase()))) {
    return "critical";
  }
  
  if (highImpactEvents.some(keyword => eventName.includes(keyword.toLowerCase()))) {
    return "high";
  }

  return determineImpact(event);
}

function generateFallbackEconomicData(from: string, to: string): any[] {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const events: any[] = [];
  
  // Generate key economic events for the next 30 days
  const keyEvents = [
    { name: "FOMC Meeting", impact: "critical", country: "US", dayOfMonth: 1, time: "14:00" },
    { name: "CPI Release", impact: "critical", country: "US", dayOfMonth: 12, time: "08:30" },
    { name: "Non-Farm Payrolls", impact: "critical", country: "US", dayOfMonth: 5, time: "08:30" },
    { name: "Retail Sales", impact: "high", country: "US", dayOfMonth: 15, time: "08:30" },
    { name: "PPI Release", impact: "high", country: "US", dayOfMonth: 13, time: "08:30" },
    { name: "Consumer Confidence", impact: "high", country: "US", dayOfMonth: 28, time: "10:00" },
    { name: "Initial Jobless Claims", impact: "medium", country: "US", dayOfWeek: 4, time: "08:30" }
  ];
  
  let currentDate = new Date(fromDate);
  while (currentDate <= toDate) {
    for (const event of keyEvents) {
      if (event.dayOfMonth && currentDate.getDate() === event.dayOfMonth) {
        events.push({
          time: currentDate.toISOString().split("T")[0] + `T${event.time}:00Z`,
          country: event.country,
          event: event.name,
          impact: event.impact,
          actual: null,
          forecast: null,
          previous: null,
          daysUntil: calculateDaysUntil(currentDate.toISOString()),
          isUpcoming: currentDate > new Date(),
          marketRelevance: event.impact
        });
      }
      
      if (event.dayOfWeek && currentDate.getDay() === event.dayOfWeek) {
        events.push({
          time: currentDate.toISOString().split("T")[0] + `T${event.time}:00Z`,
          country: event.country,
          event: event.name,
          impact: event.impact,
          actual: null,
          forecast: null,
          previous: null,
          daysUntil: calculateDaysUntil(currentDate.toISOString()),
          isUpcoming: currentDate > new Date(),
          marketRelevance: event.impact
        });
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return events.sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );
}

function calculateDaysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}