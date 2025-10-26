import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AlpacaAsset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    const apiKey = process.env.ALPACA_API_KEY;
    const secretKey = process.env.ALPACA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.error("Alpaca credentials missing");
      return NextResponse.json(
        { error: "Alpaca API credentials not configured" },
        { status: 500 }
      );
    }

    // Search using Alpaca's assets API with timeout
    const alpacaUrl = "https://paper-api.alpaca.markets/v2/assets";
    const params = new URLSearchParams({
      status: "active",
      asset_class: "us_equity",
    });

    console.log(`[Alpaca Search] Searching for: "${query}"`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${alpacaUrl}?${params}`, {
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Alpaca API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Alpaca error details:`, errorText);
      throw new Error(`Alpaca API error: ${response.status}`);
    }

    const allAssets: AlpacaAsset[] = await response.json();
    console.log(`[Alpaca Search] Fetched ${allAssets.length} total assets`);

    // Filter assets based on search query (symbol or name)
    const queryLower = query.toLowerCase().trim();
    const filteredAssets = allAssets
      .filter((asset) => {
        const matchesSymbol = asset.symbol.toLowerCase().includes(queryLower);
        const matchesName = asset.name.toLowerCase().includes(queryLower);
        return (matchesSymbol || matchesName) && asset.tradable && asset.status === "active";
      })
      .slice(0, 50); // Limit to 50 results

    console.log(`[Alpaca Search] Found ${filteredAssets.length} matches for "${query}"`);

    // Transform to our format
    const results = filteredAssets.map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      exchange: asset.exchange,
      assetClass: asset.class,
      tradable: asset.tradable,
      marginable: asset.marginable,
      shortable: asset.shortable,
    }));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error searching Alpaca assets:", error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Search request timed out. Please try again." },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to search assets" },
      { status: 500 }
    );
  }
}