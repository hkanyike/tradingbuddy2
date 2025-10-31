import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketDataFetches } from '@/db/schema';

const VALID_FETCH_TYPES = ['scheduled', 'manual', 'earnings_event'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, fetchType = 'manual' } = body;

    // Validate symbols field
    if (!symbols) {
      return NextResponse.json(
        { 
          error: 'symbols field is required',
          code: 'MISSING_SYMBOLS'
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(symbols)) {
      return NextResponse.json(
        { 
          error: 'symbols must be an array',
          code: 'INVALID_SYMBOLS_TYPE'
        },
        { status: 400 }
      );
    }

    if (symbols.length === 0) {
      return NextResponse.json(
        { 
          error: 'symbols array cannot be empty',
          code: 'EMPTY_SYMBOLS_ARRAY'
        },
        { status: 400 }
      );
    }

    // Validate each symbol
    const invalidSymbols = symbols.filter(
      symbol => typeof symbol !== 'string' || symbol.trim().length === 0
    );

    if (invalidSymbols.length > 0) {
      return NextResponse.json(
        { 
          error: 'All symbols must be non-empty strings',
          code: 'INVALID_SYMBOL_VALUES'
        },
        { status: 400 }
      );
    }

    // Validate fetchType
    if (!VALID_FETCH_TYPES.includes(fetchType as any)) {
      return NextResponse.json(
        { 
          error: `fetchType must be one of: ${VALID_FETCH_TYPES.join(', ')}`,
          code: 'INVALID_FETCH_TYPE'
        },
        { status: 400 }
      );
    }

    // Normalize symbols: uppercase and trim
    const normalizedSymbols = symbols.map(symbol => 
      symbol.trim().toUpperCase()
    );

    // Create fetch job record
    const newJob = await db.insert(marketDataFetches)
      .values({
        createdAt: new Date().toISOString(),
        fetchType: fetchType as string,
        symbols: normalizedSymbols.join(','),
        status: 'in_progress',
        recordsFetched: 0,
        errorMessage: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Market data fetch job created successfully',
        job: newJob[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}
