import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ALPACA_API_KEY;
    const secretKey = process.env.ALPACA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: "Alpaca API credentials not configured" },
        { status: 500 }
      );
    }

    // Fetch latest quote from Alpaca
    const quoteResponse = await fetch(
      `https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`,
      {
        headers: {
          "APCA-API-KEY-ID": apiKey,
          "APCA-API-SECRET-KEY": secretKey,
        },
      }
    );

    if (!quoteResponse.ok) {
      console.error(`Alpaca quote error: ${quoteResponse.status}`);
      return NextResponse.json(
        { error: "Failed to fetch quote from Alpaca" },
        { status: quoteResponse.status }
      );
    }

    const quoteData = await quoteResponse.json();
    
    // Get the quote from response
    const quote = quoteData.quote;
    
    if (!quote) {
      return NextResponse.json(
        { error: "No quote data available" },
        { status: 404 }
      );
    }

    // Calculate mid price
    const bidPrice = quote.bp || quote.bid_price || 0;
    const askPrice = quote.ap || quote.ask_price || 0;
    const price = (bidPrice + askPrice) / 2;

    // Fetch previous close for change calculation
    let change = 0;
    let changePercent = 0;

    try {
      const barsResponse = await fetch(
        `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&limit=2`,
        {
          headers: {
            "APCA-API-KEY-ID": apiKey,
            "APCA-API-SECRET-KEY": secretKey,
          },
        }
      );

      if (barsResponse.ok) {
        const barsData = await barsResponse.json();
        const bars = barsData.bars;
        
        if (bars && bars.length > 0) {
          // Get the most recent close price
          const previousClose = bars[bars.length - 1].c;
          change = price - previousClose;
          changePercent = (change / previousClose) * 100;
        }
      }
    } catch (error) {
      console.warn("Could not fetch previous close for change calculation:", error);
    }

    return NextResponse.json({
      symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      bidPrice,
      askPrice,
      timestamp: quote.t || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching Alpaca quote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
