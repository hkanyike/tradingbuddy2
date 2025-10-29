// Test endpoint to verify auth setup
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { user } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const userCount = await db.select().from(user).limit(1);
    
    // Test auth options
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      success: true,
      database: "connected",
      authOptions: "loaded",
      session: session ? "authenticated" : "not authenticated",
      userCount: userCount.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}