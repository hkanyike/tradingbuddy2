import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inviteCodes, user } from '@/db/schema';
import { eq, desc, and, or, gt, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const session = await getServerSession(authOptions),
  });

  if (!session) {
    return null;
  }

  return session.user;
}

// Helper function to check if user is admin
async function isUserAdmin(userId: string) {
  const userRecord = await db.select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userRecord.length === 0) {
    return false;
  }

  return userRecord[0].isAdmin === true;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    
    if (!authUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(authUser.id);
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { code, maxUses, expiresAt, isActive } = body;

    // Security check: reject if createdByUserId provided in body
    if ('createdByUserId' in body || 'created_by_user_id' in body || 'usedByUserId' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!code) {
      return NextResponse.json({ 
        error: "Invite code is required",
        code: "MISSING_CODE" 
      }, { status: 400 });
    }

    // Validate code format (trim and check length)
    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      return NextResponse.json({ 
        error: "Invite code cannot be empty",
        code: "INVALID_CODE" 
      }, { status: 400 });
    }

    // Validate maxUses if provided
    if (maxUses !== undefined) {
      const parsedMaxUses = parseInt(maxUses);
      if (isNaN(parsedMaxUses) || parsedMaxUses < 1) {
        return NextResponse.json({ 
          error: "maxUses must be a positive integer",
          code: "INVALID_MAX_USES" 
        }, { status: 400 });
      }
    }

    // Validate expiresAt if provided
    let expiresAtTimestamp = null;
    if (expiresAt) {
      const expiresDate = new Date(expiresAt);
      if (isNaN(expiresDate.getTime())) {
        return NextResponse.json({ 
          error: "expiresAt must be a valid ISO timestamp",
          code: "INVALID_EXPIRES_AT" 
        }, { status: 400 });
      }
      // Check if expiration is in the future
      if (expiresDate <= new Date()) {
        return NextResponse.json({ 
          error: "expiresAt must be in the future",
          code: "EXPIRES_AT_PAST" 
        }, { status: 400 });
      }
      expiresAtTimestamp = expiresDate;
    }

    // Check if code already exists
    const existingCode = await db.select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, trimmedCode))
      .limit(1);

    if (existingCode.length > 0) {
      return NextResponse.json({ 
        error: "Invite code already exists",
        code: "CODE_EXISTS" 
      }, { status: 400 });
    }

    // Create the invite code with authenticated user's ID
    const newInviteCode = await db.insert(inviteCodes)
      .values({
        code: trimmedCode,
        createdByUserId: authUser.id,
        maxUses: maxUses !== undefined ? parseInt(maxUses) : 1,
        currentUses: 0,
        expiresAt: expiresAtTimestamp,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newInviteCode[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    
    if (!authUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(authUser.id);
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Parse pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Parse filter parameters
    const isActiveParam = searchParams.get('isActive');
    const includeExpired = searchParams.get('includeExpired') === 'true';

    // Build query conditions
    const conditions = [];

    // Filter by isActive if provided
    if (isActiveParam !== null) {
      const isActiveValue = isActiveParam === 'true';
      conditions.push(eq(inviteCodes.isActive, isActiveValue));
    }

    // Filter out expired codes by default
    if (!includeExpired) {
      const now = new Date();
      conditions.push(
        or(
          gt(inviteCodes.expiresAt, now),
          isNull(inviteCodes.expiresAt)
        )
      );
    }

    // Build and execute query
    let query = db.select().from(inviteCodes);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(inviteCodes.createdAt))
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
