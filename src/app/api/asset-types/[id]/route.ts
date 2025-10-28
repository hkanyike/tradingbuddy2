import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assetTypes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    const assetTypeId = parseInt(id);

    // Check if asset type exists
    const existingAssetType = await db
      .select()
      .from(assetTypes)
      .where(eq(assetTypes.id, assetTypeId))
      .limit(1);

    if (existingAssetType.length === 0) {
      return NextResponse.json(
        { error: 'Asset type not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { typeName, description } = body;

    // Validate required fields
    if (!typeName) {
      return NextResponse.json(
        { 
          error: "Type name is required",
          code: "MISSING_TYPE_NAME" 
        },
        { status: 400 }
      );
    }

    // Trim and sanitize inputs
    const sanitizedTypeName = typeName.trim();
    const sanitizedDescription = description?.trim();

    // Check if typeName is being changed to a name that already exists
    if (sanitizedTypeName !== existingAssetType[0].typeName) {
      const duplicateCheck = await db
        .select()
        .from(assetTypes)
        .where(eq(assetTypes.typeName, sanitizedTypeName))
        .limit(1);

      if (duplicateCheck.length > 0) {
        return NextResponse.json(
          { 
            error: "Asset type with this name already exists",
            code: "DUPLICATE_TYPE_NAME" 
          },
          { status: 400 }
        );
      }
    }

    // Update asset type
    const updated = await db
      .update(assetTypes)
      .set({
        typeName: sanitizedTypeName,
        description: sanitizedDescription
      })
      .where(eq(assetTypes.id, assetTypeId))
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    const assetTypeId = parseInt(id);

    // Check if asset type exists
    const existingAssetType = await db
      .select()
      .from(assetTypes)
      .where(eq(assetTypes.id, assetTypeId))
      .limit(1);

    if (existingAssetType.length === 0) {
      return NextResponse.json(
        { error: 'Asset type not found' },
        { status: 404 }
      );
    }

    // Delete asset type
    const deleted = await db
      .delete(assetTypes)
      .where(eq(assetTypes.id, assetTypeId))
      .returning();

    return NextResponse.json(
      {
        message: 'Asset type deleted successfully',
        deletedAssetType: deleted[0]
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