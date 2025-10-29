import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { optionsQuotes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const symbol = searchParams.get('symbol');
    const expiration = searchParams.get('expiration');
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single record fetch by id
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(optionsQuotes)
        .where(eq(optionsQuotes.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List queries with filters
    let query = db.select().from(optionsQuotes);
    const conditions = [];

    // Filter by symbol
    if (symbol) {
      conditions.push(eq(optionsQuotes.symbol, symbol.toUpperCase().trim()));
    }

    // Filter by expiration date
    if (expiration) {
      conditions.push(eq(optionsQuotes.expirationDate, expiration));
    }

    // Filter by option type
    if (type) {
      const normalizedType = type.toLowerCase();
      if (normalizedType !== 'call' && normalizedType !== 'put') {
        return NextResponse.json(
          { error: 'Option type must be "call" or "put"', code: 'INVALID_OPTION_TYPE' },
          { status: 400 }
        );
      }
      conditions.push(eq(optionsQuotes.optionType, normalizedType));
    }

    // Apply all conditions and execute query
    const results = conditions.length > 0
      ? await query.where(and(...conditions))
          .orderBy(desc(optionsQuotes.timestamp))
          .limit(limit)
          .offset(offset)
      : await query
          .orderBy(desc(optionsQuotes.timestamp))
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const isBulkInsert = Array.isArray(body);
    const quotes = isBulkInsert ? body : [body];

    // Validate each quote
    const validatedQuotes = [];
    for (const quote of quotes) {
      // Required fields validation
      if (!quote.symbol || typeof quote.symbol !== 'string' || quote.symbol.trim() === '') {
        return NextResponse.json(
          { error: 'Symbol is required and must be non-empty string', code: 'MISSING_SYMBOL' },
          { status: 400 }
        );
      }

      if (!quote.optionSymbol || typeof quote.optionSymbol !== 'string') {
        return NextResponse.json(
          { error: 'Option symbol is required', code: 'MISSING_OPTION_SYMBOL' },
          { status: 400 }
        );
      }

      if (quote.strikePrice === undefined || quote.strikePrice === null) {
        return NextResponse.json(
          { error: 'Strike price is required', code: 'MISSING_STRIKE_PRICE' },
          { status: 400 }
        );
      }

      if (typeof quote.strikePrice !== 'number' || quote.strikePrice <= 0) {
        return NextResponse.json(
          { error: 'Strike price must be a positive number', code: 'INVALID_STRIKE_PRICE' },
          { status: 400 }
        );
      }

      if (!quote.expirationDate || typeof quote.expirationDate !== 'string') {
        return NextResponse.json(
          { error: 'Expiration date is required', code: 'MISSING_EXPIRATION_DATE' },
          { status: 400 }
        );
      }

      if (!quote.optionType || typeof quote.optionType !== 'string') {
        return NextResponse.json(
          { error: 'Option type is required', code: 'MISSING_OPTION_TYPE' },
          { status: 400 }
        );
      }

      const normalizedOptionType = quote.optionType.toLowerCase();
      if (normalizedOptionType !== 'call' && normalizedOptionType !== 'put') {
        return NextResponse.json(
          { error: 'Option type must be "call" or "put"', code: 'INVALID_OPTION_TYPE' },
          { status: 400 }
        );
      }

      if (!quote.timestamp || typeof quote.timestamp !== 'string') {
        return NextResponse.json(
          { error: 'Timestamp is required', code: 'MISSING_TIMESTAMP' },
          { status: 400 }
        );
      }

      // Validate numeric fields if provided
      const numericFields = ['bid', 'ask', 'lastPrice', 'impliedVolatility', 'delta', 'gamma', 'theta', 'vega', 'rho', 'underlyingPrice'];
      for (const field of numericFields) {
        if (quote[field] !== undefined && quote[field] !== null) {
          if (typeof quote[field] !== 'number' || isNaN(quote[field])) {
            return NextResponse.json(
              { error: `${field} must be a valid number`, code: 'INVALID_NUMERIC_FIELD' },
              { status: 400 }
            );
          }
        }
      }

      const integerFields = ['volume', 'openInterest'];
      for (const field of integerFields) {
        if (quote[field] !== undefined && quote[field] !== null) {
          if (!Number.isInteger(quote[field])) {
            return NextResponse.json(
              { error: `${field} must be an integer`, code: 'INVALID_INTEGER_FIELD' },
              { status: 400 }
            );
          }
        }
      }

      // Build validated quote object
      const validatedQuote: any = {
        symbol: quote.symbol.toUpperCase().trim(),
        optionSymbol: quote.optionSymbol.trim(),
        strikePrice: quote.strikePrice,
        expirationDate: quote.expirationDate.trim(),
        optionType: normalizedOptionType,
        timestamp: quote.timestamp.trim(),
        createdAt: new Date().toISOString(),
      };

      // Add optional fields if provided
      if (quote.bid !== undefined && quote.bid !== null) validatedQuote.bid = quote.bid;
      if (quote.ask !== undefined && quote.ask !== null) validatedQuote.ask = quote.ask;
      if (quote.lastPrice !== undefined && quote.lastPrice !== null) validatedQuote.lastPrice = quote.lastPrice;
      if (quote.volume !== undefined && quote.volume !== null) validatedQuote.volume = quote.volume;
      if (quote.openInterest !== undefined && quote.openInterest !== null) validatedQuote.openInterest = quote.openInterest;
      if (quote.impliedVolatility !== undefined && quote.impliedVolatility !== null) validatedQuote.impliedVolatility = quote.impliedVolatility;
      if (quote.delta !== undefined && quote.delta !== null) validatedQuote.delta = quote.delta;
      if (quote.gamma !== undefined && quote.gamma !== null) validatedQuote.gamma = quote.gamma;
      if (quote.theta !== undefined && quote.theta !== null) validatedQuote.theta = quote.theta;
      if (quote.vega !== undefined && quote.vega !== null) validatedQuote.vega = quote.vega;
      if (quote.rho !== undefined && quote.rho !== null) validatedQuote.rho = quote.rho;
      if (quote.underlyingPrice !== undefined && quote.underlyingPrice !== null) validatedQuote.underlyingPrice = quote.underlyingPrice;

      validatedQuotes.push(validatedQuote);
    }

    // Insert records
    const inserted = await db
      .insert(optionsQuotes)
      .values(validatedQuotes)
      .returning();

    return NextResponse.json(
      isBulkInsert ? inserted : inserted[0],
      { status: 201 }
    );
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(optionsQuotes)
      .where(eq(optionsQuotes.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate that immutable fields are not being updated
    const immutableFields = ['id', 'symbol', 'optionSymbol', 'strikePrice', 'expirationDate', 'optionType', 'createdAt'];
    for (const field of immutableFields) {
      if (field in body) {
        return NextResponse.json(
          { error: `Field "${field}" cannot be updated`, code: 'IMMUTABLE_FIELD' },
          { status: 400 }
        );
      }
    }

    // Build update object with only allowed fields
    const updates: any = {};

    // Validate and add numeric fields
    const numericFields = ['bid', 'ask', 'lastPrice', 'impliedVolatility', 'delta', 'gamma', 'theta', 'vega', 'rho', 'underlyingPrice'];
    for (const field of numericFields) {
      if (body[field] !== undefined && body[field] !== null) {
        if (typeof body[field] !== 'number' || isNaN(body[field])) {
          return NextResponse.json(
            { error: `${field} must be a valid number`, code: 'INVALID_NUMERIC_FIELD' },
            { status: 400 }
          );
        }
        updates[field] = body[field];
      }
    }

    // Validate and add integer fields
    const integerFields = ['volume', 'openInterest'];
    for (const field of integerFields) {
      if (body[field] !== undefined && body[field] !== null) {
        if (!Number.isInteger(body[field])) {
          return NextResponse.json(
            { error: `${field} must be an integer`, code: 'INVALID_INTEGER_FIELD' },
            { status: 400 }
          );
        }
        updates[field] = body[field];
      }
    }

    // Add timestamp if provided
    if (body.timestamp !== undefined && body.timestamp !== null) {
      if (typeof body.timestamp !== 'string') {
        return NextResponse.json(
          { error: 'Timestamp must be a string', code: 'INVALID_TIMESTAMP' },
          { status: 400 }
        );
      }
      updates.timestamp = body.timestamp.trim();
    }

    // Check if there are any fields to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    // Perform update
    const updated = await db
      .update(optionsQuotes)
      .set(updates)
      .where(eq(optionsQuotes.id, parseInt(id)))
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await db
      .select()
      .from(optionsQuotes)
      .where(eq(optionsQuotes.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Perform deletion
    const deleted = await db
      .delete(optionsQuotes)
      .where(eq(optionsQuotes.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Options quote deleted successfully',
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
