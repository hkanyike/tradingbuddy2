import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ typeId: string }> }
) {
  const { typeId } = await params;
  
  try {
    const assetsByType = await db
      .select()
      .from(assets)
      .where(eq(assets.assetTypeId, parseInt(typeId)));

    return NextResponse.json(assetsByType, { status: 200 });
  } catch (error) {
    console.error("Error fetching assets by type:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets by type" },
      { status: 500 }
    );
  }
}