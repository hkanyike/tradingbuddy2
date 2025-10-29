import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { riskMetrics } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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

    const latestMetrics = await db
      .select()
      .from(riskMetrics)
      .where(eq(riskMetrics.userId, userId))
      .orderBy(desc(riskMetrics.calculatedAt))
      .limit(1);

    if (latestMetrics.length === 0) {
      // Return default values instead of 404
      return NextResponse.json({
        total_positions: 0,
        portfolio_delta: 0,
        portfolio_gamma: 0,
        portfolio_theta: 0,
        portfolio_vega: 0,
        max_loss: 0,
        buying_power_used: 0,
        risk_level: "low"
      }, { status: 200 });
    }

    // Map the database response to match the expected format
    const metric = latestMetrics[0];
    return NextResponse.json({
      total_positions: metric.totalExposure || 0,
      portfolio_delta: metric.netDelta || 0,
      portfolio_gamma: metric.netGamma || 0,
      portfolio_theta: metric.netTheta || 0,
      portfolio_vega: metric.netVega || 0,
      max_loss: metric.maxDrawdown || 0,
      buying_power_used: metric.portfolioHeat || 0,
      risk_level: (metric.portfolioHeat || 0) > 0.7 ? "high" : (metric.portfolioHeat || 0) > 0.4 ? "medium" : "low"
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching latest risk metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest risk metrics" },
      { status: 500 }
    );
  }
}