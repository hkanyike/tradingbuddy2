import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketDataFetches } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

const VALID_STATUSES = ['pending', 'in_progress', 'success', 'failed'] as const;
const VALID_FETCH_TYPES = ['scheduled', 'manual', 'earnings_event'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const fetch = await db
        .select()
        .from(marketDataFetches)
        .where(eq(marketDataFetches.id, parseInt(id)))
        .limit(1);

      if (fetch.length === 0) {
        return NextResponse.json(
          { error: 'Market data fetch not found', code: 'FETCH_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(fetch[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const fetchType = searchParams.get('fetchType');

    // Build conditions array
    const conditions = [];
    
    // Apply status filter
    if (status) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(marketDataFetches.status, status));
    }

    // Apply fetchType filter
    if (fetchType) {
      if (!VALID_FETCH_TYPES.includes(fetchType as any)) {
        return NextResponse.json(
          {
            error: `Invalid fetch type. Must be one of: ${VALID_FETCH_TYPES.join(', ')}`,
            code: 'INVALID_FETCH_TYPE',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(marketDataFetches.fetchType, fetchType));
    }

    // Build and execute query
    const results = conditions.length > 0
      ? await db.select().from(marketDataFetches)
          .where(and(...conditions))
          .orderBy(desc(marketDataFetches.startedAt))
          .limit(limit)
          .offset(offset)
      : await db.select().from(marketDataFetches)
          .orderBy(desc(marketDataFetches.startedAt))
          .limit(limit)
          .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, recordsFetched, errorMessage, completedAt } = body;

    // Validate at least one field to update
    if (
      status === undefined &&
      recordsFetched === undefined &&
      errorMessage === undefined &&
      completedAt === undefined
    ) {
      return NextResponse.json(
        {
          error: 'At least one field to update is required',
          code: 'NO_UPDATE_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate recordsFetched if provided
    if (recordsFetched !== undefined) {
      if (
        typeof recordsFetched !== 'number' ||
        !Number.isInteger(recordsFetched) ||
        recordsFetched < 0
      ) {
        return NextResponse.json(
          {
            error: 'Records fetched must be a non-negative integer',
            code: 'INVALID_RECORDS_FETCHED',
          },
          { status: 400 }
        );
      }
    }

    // Check if record exists
    const existingFetch = await db
      .select()
      .from(marketDataFetches)
      .where(eq(marketDataFetches.id, parseInt(id)))
      .limit(1);

    if (existingFetch.length === 0) {
      return NextResponse.json(
        { error: 'Market data fetch not found', code: 'FETCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};

    if (status !== undefined) {
      updates.status = status;

      // Auto-set completedAt if status is success or failed and completedAt not provided
      if (
        (status === 'success' || status === 'failed') &&
        completedAt === undefined &&
        !existingFetch[0].completedAt
      ) {
        updates.completedAt = new Date().toISOString();
      }
    }

    if (recordsFetched !== undefined) {
      updates.recordsFetched = recordsFetched;
    }

    if (errorMessage !== undefined) {
      updates.errorMessage = errorMessage;
    }

    if (completedAt !== undefined) {
      updates.completedAt = completedAt;
    }

    // Perform update
    const updated = await db
      .update(marketDataFetches)
      .set(updates)
      .where(eq(marketDataFetches.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update market data fetch', code: 'UPDATE_FAILED' },
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

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingFetch = await db
      .select()
      .from(marketDataFetches)
      .where(eq(marketDataFetches.id, parseInt(id)))
      .limit(1);

    if (existingFetch.length === 0) {
      return NextResponse.json(
        { error: 'Market data fetch not found', code: 'FETCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the record
    const deleted = await db
      .delete(marketDataFetches)
      .where(eq(marketDataFetches.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete market data fetch', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Market data fetch deleted successfully',
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
