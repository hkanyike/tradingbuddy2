import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { positions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

// GET single position
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  
  const position = await db
    .select()
    .from(positions)
    .where(and(
      eq(positions.id, parseInt(id)),
      eq(positions.userId, session.user.id)
    ))
    .limit(1);

  if (position.length === 0) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  return NextResponse.json(position[0]);
}

// PUT (update) position
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  // Verify ownership - userId is now text
  const existing = await db
    .select()
    .from(positions)
    .where(and(
      eq(positions.id, parseInt(id)),
      eq(positions.userId, session.user.id)
    ))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  const updated = await db
    .update(positions)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(positions.id, parseInt(id)))
    .returning();

  return NextResponse.json(updated[0]);
}

// DELETE position
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // Verify ownership - userId is now text
  const existing = await db
    .select()
    .from(positions)
    .where(and(
      eq(positions.id, parseInt(id)),
      eq(positions.userId, session.user.id)
    ))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  await db.delete(positions).where(eq(positions.id, parseInt(id)));

  return NextResponse.json({ message: "Position deleted successfully" });
}