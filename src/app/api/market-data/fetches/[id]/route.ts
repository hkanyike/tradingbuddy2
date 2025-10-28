import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketDataFetches } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const fetchId = parseInt(id);

    const record = await db
      .select()
      .from(marketDataFetches)
      .where(eq(marketDataFetches.id, fetchId))
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json(
        { error: 'Fetch record not found', code: 'FETCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    const fetchRecord = record[0];

    // Parse symbols JSON string for better client readability
    let parsedSymbols;
    try {
      parsedSymbols = JSON.parse(fetchRecord.symbols);
    } catch {
      parsedSymbols = fetchRecord.symbols;
    }

    return NextResponse.json({
      ...fetchRecord,
      symbols: parsedSymbols,
    });
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const fetchId = parseInt(id);

    // Check if record exists
    const existing = await db
      .select()
      .from(marketDataFetches)
      .where(eq(marketDataFetches.id, fetchId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Fetch record not found', code: 'FETCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, recordsFetched, errorMessage, completedAt } = body;

    // Validate status if provided
    const validStatuses = ['pending', 'in_progress', 'success', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate recordsFetched if provided
    if (recordsFetched !== undefined) {
      if (
        typeof recordsFetched !== 'number' ||
        recordsFetched < 0 ||
        !Number.isInteger(recordsFetched)
      ) {
        return NextResponse.json(
          {
            error: 'recordsFetched must be a non-negative integer',
            code: 'INVALID_RECORDS_FETCHED',
          },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updates: Record<string, any> = {};

    if (status !== undefined) {
      updates.status = status;
    }

    if (recordsFetched !== undefined) {
      updates.recordsFetched = recordsFetched;
    }

    if (errorMessage !== undefined) {
      updates.errorMessage = errorMessage;
    }

    // Auto-set completedAt if status becomes success or failed
    if (
      status &&
      (status === 'success' || status === 'failed') &&
      completedAt === undefined &&
      !existing[0].completedAt
    ) {
      updates.completedAt = new Date().toISOString();
    } else if (completedAt !== undefined) {
      updates.completedAt = completedAt;
    }

    // If no fields to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_FIELDS_TO_UPDATE' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(marketDataFetches)
      .set(updates)
      .where(eq(marketDataFetches.id, fetchId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update fetch record', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    // Parse symbols for response
    let parsedSymbols;
    try {
      parsedSymbols = JSON.parse(updated[0].symbols);
    } catch {
      parsedSymbols = updated[0].symbols;
    }

    return NextResponse.json({
      ...updated[0],
      symbols: parsedSymbols,
    });
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const fetchId = parseInt(id);

    // Check if record exists
    const existing = await db
      .select()
      .from(marketDataFetches)
      .where(eq(marketDataFetches.id, fetchId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Fetch record not found', code: 'FETCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(marketDataFetches)
      .where(eq(marketDataFetches.id, fetchId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete fetch record', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    // Parse symbols for response
    let parsedSymbols;
    try {
      parsedSymbols = JSON.parse(deleted[0].symbols);
    } catch {
      parsedSymbols = deleted[0].symbols;
    }

    return NextResponse.json({
      message: 'Fetch record deleted successfully',
      deleted: {
        ...deleted[0],
        symbols: parsedSymbols,
      },
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}