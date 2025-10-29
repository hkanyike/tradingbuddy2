import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { positions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const positionId = parseInt(id);
    if (isNaN(positionId)) {
      return NextResponse.json(
        { error: 'Invalid position ID', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Get the position to verify ownership
    const existingPosition = await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.id, positionId),
          eq(positions.userId, (session.user as any).id)
        )
      )
      .limit(1);

    if (existingPosition.length === 0) {
      return NextResponse.json(
        { error: 'Position not found or unauthorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Close the position by updating its status
    const now = new Date();
    await db
      .update(positions)
      .set({
        status: 'closed',
        closedAt: Math.floor(now.getTime() / 1000), // Convert to Unix timestamp
        updatedAt: Math.floor(now.getTime() / 1000) // Convert to Unix timestamp
      })
      .where(eq(positions.id, positionId));

    return NextResponse.json(
      { message: 'Position closed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error closing position:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
