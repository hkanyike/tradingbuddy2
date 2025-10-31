import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { marketSignals, assets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;
  
  try {
    // First, get the asset to find its symbol
    const asset = await db
      .select()
      .from(assets)
      .where(eq(assets.id, parseInt(assetId)))
      .limit(1);

    if (!asset.length) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    // Then get market signals by symbol
    const signals = await db
      .select()
      .from(marketSignals)
      .where(eq(marketSignals.symbol, asset[0].symbol));

    return NextResponse.json(signals, { status: 200 });
  } catch (error) {
    console.error("Error fetching market signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch market signals" },
      { status: 500 }
    );
  }
}