// File: src/app/api/test-auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name,
        isAdmin: (session.user as any).isAdmin ?? false,
      },
    });
  } catch (error) {
    console.error("test-auth error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

