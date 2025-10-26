import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const alertId = parseInt(id);

    // Verify ownership - userId is now text
    const existingAlert = await db.select()
      .from(alerts)
      .where(and(
        eq(alerts.id, alertId),
        eq(alerts.userId, session.user.id)
      ))
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json(
        { 
          error: 'Alert not found',
          code: 'ALERT_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const updatedAlert = await db.update(alerts)
      .set({ 
        isDismissed: true
      })
      .where(eq(alerts.id, alertId))
      .returning();

    if (updatedAlert.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update alert',
          code: 'UPDATE_FAILED' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAlert[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error 
      },
      { status: 500 }
    );
  }
}