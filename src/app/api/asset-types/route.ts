import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assetTypes } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const assetType = await db
        .select()
        .from(assetTypes)
        .where(eq(assetTypes.id, parseInt(id)))
        .limit(1);

      if (assetType.length === 0) {
        return NextResponse.json(
          { error: 'Asset type not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(assetType[0], { status: 200 });
    }

    // List with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let results;
    
    if (search) {
      results = await db
        .select()
        .from(assetTypes)
        .where(
          or(
            like(assetTypes.name, `%${search}%`),
            like(assetTypes.description, `%${search}%`)
          )
        )
        .limit(limit)
        .offset(offset);
    } else {
      results = await db
        .select()
        .from(assetTypes)
        .limit(limit)
        .offset(offset);
    }

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
    const { typeName, description } = body;

    // Validate required field
    if (!typeName || typeof typeName !== 'string' || typeName.trim() === '') {
      return NextResponse.json(
        { error: 'typeName is required and must be a non-empty string', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedTypeName = typeName.trim();
    const sanitizedDescription = description?.trim() || null;

    // Check for duplicate typeName
    const existingAssetType = await db
      .select()
      .from(assetTypes)
      .where(eq(assetTypes.name, sanitizedTypeName))
      .limit(1);

    if (existingAssetType.length > 0) {
      return NextResponse.json(
        { error: 'Asset type with this name already exists', code: 'DUPLICATE_TYPE_NAME' },
        { status: 400 }
      );
    }

    // Insert new asset type
    const newAssetType = await db
      .insert(assetTypes)
      .values({
        name: sanitizedTypeName,
        description: sanitizedDescription,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newAssetType[0], { status: 201 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(assetTypes)
      .where(eq(assetTypes.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Asset type not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { typeName, description } = body;

    // Build update object with only provided fields
    const updates: any = {};

    if (typeName !== undefined) {
      if (typeof typeName !== 'string' || typeName.trim() === '') {
        return NextResponse.json(
          { error: 'typeName must be a non-empty string', code: 'INVALID_TYPE_NAME' },
          { status: 400 }
        );
      }

      const sanitizedTypeName = typeName.trim();

      // Check for duplicate typeName (excluding current record)
      const duplicateCheck = await db
        .select()
        .from(assetTypes)
        .where(eq(assetTypes.name, sanitizedTypeName))
        .limit(1);

      if (duplicateCheck.length > 0 && duplicateCheck[0].id !== parseInt(id)) {
        return NextResponse.json(
          { error: 'Asset type with this name already exists', code: 'DUPLICATE_TYPE_NAME' },
          { status: 400 }
        );
      }

      updates.name = sanitizedTypeName;
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    // If no fields to update, return current record
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingRecord[0], { status: 200 });
    }

    // Update record
    const updated = await db
      .update(assetTypes)
      .set(updates)
      .where(eq(assetTypes.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(assetTypes)
      .where(eq(assetTypes.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Asset type not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete record
    const deleted = await db
      .delete(assetTypes)
      .where(eq(assetTypes.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Asset type deleted successfully',
        deletedRecord: deleted[0],
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
