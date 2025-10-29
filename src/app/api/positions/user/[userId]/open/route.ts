import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { positions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate that authenticated user can only access their own data
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const openPositions = await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.userId, userId),
          eq(positions.status, "open")
        )
      );

    return NextResponse.json(openPositions, { status: 200 });
  } catch (error) {
    console.error("Error fetching open positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch open positions" },
      { status: 500 }
    );
  }
}