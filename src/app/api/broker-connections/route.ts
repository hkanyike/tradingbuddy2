import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brokerConnections } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const connection = await db.select()
        .from(brokerConnections)
        .where(eq(brokerConnections.id, parseInt(id)))
        .limit(1);

      if (connection.length === 0) {
        return NextResponse.json({ 
          error: 'Broker connection not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      // Verify ownership - userId is now text
      if (connection[0].userId !== user.id) {
        return NextResponse.json({ 
          error: 'Access denied',
          code: 'FORBIDDEN' 
        }, { status: 403 });
      }

      return NextResponse.json(connection[0], { status: 200 });
    }

    // List with pagination - only user's connections - userId is now text
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const connections = await db.select()
      .from(brokerConnections)
      .where(eq(brokerConnections.userId, user.id))
      .orderBy(desc(brokerConnections.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(connections, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    const { brokerName, apiKeyEncrypted, isPaperTrading, isConnected, lastConnectedAt } = body;

    // Validate required fields
    if (!brokerName) {
      return NextResponse.json({ 
        error: 'Broker name is required',
        code: 'MISSING_BROKER_NAME' 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedBrokerName = brokerName.trim();

    // Prepare insert data with authenticated user's text ID
    const now = new Date().toISOString();
    const insertData = {
      userId: user.id,
      brokerName: sanitizedBrokerName,
      apiKeyEncrypted: apiKeyEncrypted || null,
      isPaperTrading: isPaperTrading !== undefined ? isPaperTrading : true,
      isConnected: isConnected !== undefined ? isConnected : false,
      lastConnectedAt: lastConnectedAt || null,
      createdAt: now,
      updatedAt: now,
    };

    const newConnection = await db.insert(brokerConnections)
      .values(insertData)
      .returning();

    return NextResponse.json(newConnection[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user - userId is now text
    const existing = await db.select()
      .from(brokerConnections)
      .where(eq(brokerConnections.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Broker connection not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Verify ownership - userId is now text
    if (existing[0].userId !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.brokerName !== undefined) {
      updateData.brokerName = body.brokerName.trim();
    }
    if (body.apiKeyEncrypted !== undefined) {
      updateData.apiKeyEncrypted = body.apiKeyEncrypted;
    }
    if (body.isPaperTrading !== undefined) {
      updateData.isPaperTrading = body.isPaperTrading;
    }
    if (body.isConnected !== undefined) {
      updateData.isConnected = body.isConnected;
    }
    if (body.lastConnectedAt !== undefined) {
      updateData.lastConnectedAt = body.lastConnectedAt;
    }

    const updated = await db.update(brokerConnections)
      .set(updateData)
      .where(eq(brokerConnections.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Broker connection not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user - userId is now text
    const existing = await db.select()
      .from(brokerConnections)
      .where(eq(brokerConnections.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Broker connection not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Verify ownership - userId is now text
    if (existing[0].userId !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const deleted = await db.delete(brokerConnections)
      .where(eq(brokerConnections.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Broker connection not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Broker connection deleted successfully',
      data: deleted[0] 
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

