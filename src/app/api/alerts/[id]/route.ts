import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const alert = await db.select()
      .from(alerts)
      .where(and(
        eq(alerts.id, parseInt(id)),
        eq(alerts.userId, session.userId)
      ))
      .limit(1);

    if (alert.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(alert[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verify ownership
    const existingAlert = await db.select()
      .from(alerts)
      .where(and(
        eq(alerts.id, parseInt(id)),
        eq(alerts.userId, session.userId)
      ))
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    const updates: any = {};

    if (body.userId !== undefined) updates.userId = body.userId;
    if (body.positionId !== undefined) updates.positionId = body.positionId;
    if (body.alertType !== undefined) {
      if (!body.alertType || body.alertType.trim() === '') {
        return NextResponse.json(
          { 
            error: 'Alert type is required',
            code: 'MISSING_ALERT_TYPE' 
          },
          { status: 400 }
        );
      }
      updates.alertType = body.alertType.trim();
    }
    if (body.title !== undefined) {
      if (!body.title || body.title.trim() === '') {
        return NextResponse.json(
          { 
            error: 'Title is required',
            code: 'MISSING_TITLE' 
          },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }
    if (body.message !== undefined) {
      if (!body.message || body.message.trim() === '') {
        return NextResponse.json(
          { 
            error: 'Message is required',
            code: 'MISSING_MESSAGE' 
          },
          { status: 400 }
        );
      }
      updates.message = body.message.trim();
    }
    if (body.severity !== undefined) updates.severity = body.severity;
    if (body.isRead !== undefined) updates.isRead = body.isRead;
    if (body.isDismissed !== undefined) updates.isDismissed = body.isDismissed;

    const updated = await db.update(alerts)
      .set(updates)
      .where(eq(alerts.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update alert' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingAlert = await db.select()
      .from(alerts)
      .where(and(
        eq(alerts.id, parseInt(id)),
        eq(alerts.userId, session.userId)
      ))
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    const deleted = await db.delete(alerts)
      .where(eq(alerts.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete alert' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Alert deleted successfully',
        alert: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}