import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { watchlist, assets } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId query parameter is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const results = await db.select()
      .from(watchlist)
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.addedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, assetId, notes, aiRecommended } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!assetId) {
      return NextResponse.json({ 
        error: "Asset ID is required",
        code: "MISSING_ASSET_ID" 
      }, { status: 400 });
    }

    // Validate assetId is valid integer
    const parsedAssetId = parseInt(assetId);
    
    if (isNaN(parsedAssetId)) {
      return NextResponse.json({ 
        error: "Asset ID must be a valid integer",
        code: "INVALID_ASSET_ID" 
      }, { status: 400 });
    }

    // Check if asset exists
    const assetExists = await db.select()
      .from(assets)
      .where(eq(assets.id, parsedAssetId))
      .limit(1);

    if (assetExists.length === 0) {
      return NextResponse.json({ 
        error: "Asset not found",
        code: "ASSET_NOT_FOUND" 
      }, { status: 404 });
    }

    // Check if asset is already in user's watchlist (prevent duplicates)
    const existingWatchlistItem = await db.select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.assetId, parsedAssetId)
        )
      )
      .limit(1);

    if (existingWatchlistItem.length > 0) {
      return NextResponse.json({ 
        error: "Asset is already in watchlist",
        code: "DUPLICATE_WATCHLIST_ITEM" 
      }, { status: 400 });
    }

    // Create watchlist item
    const now = new Date().toISOString();
    const newWatchlistItem = await db.insert(watchlist)
      .values({
        userId: userId,
        assetId: parsedAssetId,
        addedAt: now,
        createdAt: now
      })
      .returning();

    return NextResponse.json(newWatchlistItem[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const parsedId = parseInt(id);

    // Check if watchlist item exists
    const existingItem = await db.select()
      .from(watchlist)
      .where(eq(watchlist.id, parsedId))
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json({ 
        error: "Watchlist item not found",
        code: "WATCHLIST_ITEM_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete the watchlist item
    const deleted = await db.delete(watchlist)
      .where(eq(watchlist.id, parsedId))
      .returning();

    return NextResponse.json({ 
      message: "Watchlist item removed successfully",
      deletedItem: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
