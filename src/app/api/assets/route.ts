import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, assetTypes } from '@/db/schema';
import { eq, like, and, or, desc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single asset by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const asset = await db
        .select()
        .from(assets)
        .where(eq(assets.id, parseInt(id)))
        .limit(1);

      if (asset.length === 0) {
        return NextResponse.json(
          { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(asset[0], { status: 200 });
    }

    // List assets with pagination, search, and type filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const assetTypeIdParam = searchParams.get('assetTypeId');
    const typeParam = searchParams.get('type'); // Can be comma-separated: "stock,etf"

    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(assets.symbol, `%${search}%`),
          like(assets.name, `%${search}%`)
        )
      );
    }

    // Asset type ID filter (direct ID)
    if (assetTypeIdParam) {
      const typeIds = assetTypeIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (typeIds.length > 0) {
        if (typeIds.length === 1) {
          conditions.push(eq(assets.assetTypeId, typeIds[0]));
        } else {
          conditions.push(inArray(assets.assetTypeId, typeIds));
        }
      }
    }

    // Asset type name filter (e.g., "stock", "etf", "index")
    if (typeParam && !assetTypeIdParam) {
      const typeNames = typeParam.split(',').map(t => t.trim().toLowerCase());
      
      // Fetch matching asset type IDs
      const matchingTypes = await db
        .select()
        .from(assetTypes)
        .where(
          or(
            ...typeNames.map(typeName => 
              like(assetTypes.name, `%${typeName}%`)
            )
          )
        );

      if (matchingTypes.length > 0) {
        const typeIds = matchingTypes.map(t => t.id);
        if (typeIds.length === 1) {
          conditions.push(eq(assets.assetTypeId, typeIds[0]));
        } else {
          conditions.push(inArray(assets.assetTypeId, typeIds));
        }
      } else {
        // No matching types found, return empty array
        return NextResponse.json([], { status: 200 });
      }
    }

    // Build query
    let query = db.select().from(assets).orderBy(desc(assets.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, name, assetTypeId, sector, liquidityRank, isActive } = body;

    // Validate required fields
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required', code: 'MISSING_SYMBOL' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedSymbol = symbol.trim().toUpperCase();
    const sanitizedName = name.trim();

    // Check if symbol already exists
    const existingAsset = await db
      .select()
      .from(assets)
      .where(eq(assets.symbol, sanitizedSymbol))
      .limit(1);

    if (existingAsset.length > 0) {
      return NextResponse.json(
        { error: 'Asset with this symbol already exists', code: 'DUPLICATE_SYMBOL' },
        { status: 400 }
      );
    }

    // Validate assetTypeId if provided
    if (assetTypeId) {
      const assetTypeExists = await db
        .select()
        .from(assetTypes)
        .where(eq(assetTypes.id, parseInt(assetTypeId)))
        .limit(1);

      if (assetTypeExists.length === 0) {
        return NextResponse.json(
          { error: 'Asset type does not exist', code: 'INVALID_ASSET_TYPE' },
          { status: 400 }
        );
      }
    }

    // Create new asset
    const newAsset = await db
      .insert(assets)
      .values({
        symbol: sanitizedSymbol,
        name: sanitizedName,
        assetTypeId: assetTypeId ? parseInt(assetTypeId) : null,
        sector: sector?.trim() || null,
        liquidityRank: liquidityRank ? parseInt(liquidityRank) : null,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newAsset[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if asset exists
    const existingAsset = await db
      .select()
      .from(assets)
      .where(eq(assets.id, parseInt(id)))
      .limit(1);

    if (existingAsset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { symbol, name, assetTypeId, sector, liquidityRank, isActive } = body;

    // Prepare update object with only provided fields
    const updates: any = {};

    if (symbol !== undefined) {
      const sanitizedSymbol = symbol.trim().toUpperCase();
      
      // Check if new symbol conflicts with existing assets
      const symbolConflict = await db
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.symbol, sanitizedSymbol),
            eq(assets.id, parseInt(id))
          )
        )
        .limit(1);

      // If symbol exists and it's not the current asset
      if (symbolConflict.length === 0) {
        const otherAsset = await db
          .select()
          .from(assets)
          .where(eq(assets.symbol, sanitizedSymbol))
          .limit(1);
        
        if (otherAsset.length > 0) {
          return NextResponse.json(
            { error: 'Asset with this symbol already exists', code: 'DUPLICATE_SYMBOL' },
            { status: 400 }
          );
        }
      }

      updates.symbol = sanitizedSymbol;
    }

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (assetTypeId !== undefined) {
      if (assetTypeId !== null) {
        const assetTypeExists = await db
          .select()
          .from(assetTypes)
          .where(eq(assetTypes.id, parseInt(assetTypeId)))
          .limit(1);

        if (assetTypeExists.length === 0) {
          return NextResponse.json(
            { error: 'Asset type does not exist', code: 'INVALID_ASSET_TYPE' },
            { status: 400 }
          );
        }
        updates.assetTypeId = parseInt(assetTypeId);
      } else {
        updates.assetTypeId = null;
      }
    }

    if (sector !== undefined) {
      updates.sector = sector ? sector.trim() : null;
    }

    if (liquidityRank !== undefined) {
      updates.liquidityRank = liquidityRank ? parseInt(liquidityRank) : null;
    }

    if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    // Update asset
    const updatedAsset = await db
      .update(assets)
      .set(updates)
      .where(eq(assets.id, parseInt(id)))
      .returning();

    if (updatedAsset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAsset[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if asset exists
    const existingAsset = await db
      .select()
      .from(assets)
      .where(eq(assets.id, parseInt(id)))
      .limit(1);

    if (existingAsset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete asset
    const deletedAsset = await db
      .delete(assets)
      .where(eq(assets.id, parseInt(id)))
      .returning();

    if (deletedAsset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Asset deleted successfully',
        asset: deletedAsset[0],
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