// File: src/app/api/alerts/[id]/dismiss/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  context: { params: { id: string } } // <- Next 15 expects Promise here
) {
  // Await the params object to satisfy the generated type
  const { id } = await context.params;

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: mark alert `id` as dismissed for session.user.id
  // await db.update(...)

  return NextResponse.json({ ok: true, id }, { status: 200 });
}
