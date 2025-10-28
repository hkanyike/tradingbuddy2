import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session.user!;
}

// GET /api/admin/invite-codes
export async function GET(_req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !(user as any).isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  // TEMP placeholder: return empty list to satisfy types & build
  return NextResponse.json([]);
}

// POST /api/admin/invite-codes
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !(user as any).isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  // TEMP: echo body; replace with your real create logic
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, received: body });
}

