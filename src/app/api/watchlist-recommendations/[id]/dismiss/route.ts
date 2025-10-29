import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { watchlistRecommendations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate ID parameter
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

    const recommendationId = parseInt(id);

    // Check if recommendation exists
    const existingRecommendation = await db
      .select()
      .from(watchlistRecommendations)
      .where(eq(watchlistRecommendations.id, recommendationId))
      .limit(1);

    if (existingRecommendation.length === 0) {
      return NextResponse.json(
        { 
          error: 'Recommendation not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Update recommendation to set dismissed = true
    const updatedRecommendation = await db
      .update(watchlistRecommendations)
      .set({
        dismissed: true
      })
      .where(eq(watchlistRecommendations.id, recommendationId))
      .returning();

    if (updatedRecommendation.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to dismiss recommendation',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedRecommendation[0], { status: 200 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}