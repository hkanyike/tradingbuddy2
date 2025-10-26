import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brokerConnections } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
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
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(brokerConnections)
      .where(and(
        eq(brokerConnections.id, parseInt(id)),
        eq(brokerConnections.userId, session.user.id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Broker connection not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(existing[0], { status: 200 });
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
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    // Verify ownership - userId is now text
    const existing = await db
      .select()
      .from(brokerConnections)
      .where(and(
        eq(brokerConnections.id, parseInt(id)),
        eq(brokerConnections.userId, session.user.id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Broker connection not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {};

    // Handle broker connection fields
    if (requestBody.brokerName !== undefined) {
      if (!requestBody.brokerName || typeof requestBody.brokerName !== 'string') {
        return NextResponse.json(
          { error: 'Broker name is required and must be a string', code: 'INVALID_BROKER_NAME' },
          { status: 400 }
        );
      }
      updates.brokerName = requestBody.brokerName.trim();
    }

    if (requestBody.apiKeyEncrypted !== undefined) {
      updates.apiKeyEncrypted = requestBody.apiKeyEncrypted;
    }

    if (requestBody.isPaperTrading !== undefined) {
      updates.isPaperTrading = Boolean(requestBody.isPaperTrading);
    }

    if (requestBody.isConnected !== undefined) {
      updates.isConnected = Boolean(requestBody.isConnected);
    }

    if (requestBody.lastConnectedAt !== undefined) {
      updates.lastConnectedAt = requestBody.lastConnectedAt;
    }

    updates.updatedAt = new Date().toISOString();

    const updated = await db
      .update(brokerConnections)
      .set(updates)
      .where(eq(brokerConnections.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update broker connection', code: 'UPDATE_FAILED' },
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
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Verify ownership - userId is now text
    const existing = await db
      .select()
      .from(brokerConnections)
      .where(and(
        eq(brokerConnections.id, parseInt(id)),
        eq(brokerConnections.userId, session.user.id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Broker connection not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(brokerConnections)
      .where(eq(brokerConnections.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete broker connection', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Broker connection deleted successfully',
        deleted: deleted[0],
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