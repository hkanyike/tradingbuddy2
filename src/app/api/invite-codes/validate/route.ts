import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inviteCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    // Validate required field
    if (!code) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'MISSING_CODE',
          message: 'Invite code is required',
        },
        { status: 400 }
      );
    }

    // Trim and normalize the code
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'INVALID_CODE',
          message: 'Invite code cannot be empty',
        },
        { status: 400 }
      );
    }

    // Fetch the invite code from database
    const inviteCodeRecords = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, normalizedCode))
      .limit(1);

    // Check if code exists
    if (inviteCodeRecords.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'CODE_NOT_FOUND',
          message: 'Invite code does not exist',
        },
        { status: 400 }
      );
    }

    const inviteCode = inviteCodeRecords[0];

    // Check if code is active
    if (!inviteCode.isActive) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'CODE_INACTIVE',
          message: 'This invite code has been deactivated',
        },
        { status: 400 }
      );
    }

    // Check if code has expired
    const now = new Date();
    if (inviteCode.expiresAt) {
      const expiresAtDate = new Date(inviteCode.expiresAt);
      if (!isNaN(expiresAtDate.getTime()) && expiresAtDate <= now) {
        return NextResponse.json(
          {
            valid: false,
            reason: 'CODE_EXPIRED',
            message: 'This invite code has expired',
          },
          { status: 400 }
        );
      }
    }

    // Check if code has remaining uses
    if (inviteCode.currentUses >= inviteCode.maxUses) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'CODE_MAX_USES_REACHED',
          message: 'This invite code has reached its maximum number of uses',
        },
        { status: 400 }
      );
    }

    // Code is valid
    return NextResponse.json(
      {
        valid: true,
        code: inviteCode.code,
        message: 'Invite code is valid',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
      },
      { status: 500 }
    );
  }
}
