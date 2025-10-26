import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { marketSignals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;
  
  try {
    const signals = await db
      .select()
      .from(marketSignals)
      .where(eq(marketSignals.assetId, parseInt(assetId)));

    return NextResponse.json(signals, { status: 200 });
  } catch (error) {
    console.error("Error fetching market signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch market signals" },
      { status: 500 }
    );
  }
}