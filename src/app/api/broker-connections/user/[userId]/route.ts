import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brokerConnections } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Authenticate user
    const user = await getCurrentUser(request);
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

    // Query broker connections for the specific user - userId is now text
    const connections = await db
      .select()
      .from(brokerConnections)
      .where(eq(brokerConnections.userId, userId))
      .orderBy(desc(brokerConnections.createdAt));

    // Return empty array if no connections found
    return NextResponse.json(connections, { status: 200 });
  } catch (error) {
    console.error('GET broker connections error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}