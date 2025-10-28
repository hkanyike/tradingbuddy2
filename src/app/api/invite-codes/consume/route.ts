import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inviteCodes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body;

    // Validate required fields
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Invite code is required',
          code: 'MISSING_CODE'
        },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    // Find the invite code
    const inviteCodeRecord = await db.select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code.trim()))
      .limit(1);

    if (inviteCodeRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invite code not found',
          code: 'CODE_NOT_FOUND'
        },
        { status: 400 }
      );
    }

    const invite = inviteCodeRecord[0];

    // Validate the invite code is active
    if (!invite.isActive) {
      return NextResponse.json(
        { 
          error: 'Invite code is no longer active',
          code: 'CODE_INVALID'
        },
        { status: 400 }
      );
    }

    // Validate the invite code hasn't expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { 
          error: 'Invite code has expired',
          code: 'CODE_INVALID'
        },
        { status: 400 }
      );
    }

    // Validate the invite code hasn't reached max uses
    if (invite.currentUses >= invite.maxUses) {
      return NextResponse.json(
        { 
          error: 'Invite code has reached maximum uses',
          code: 'CODE_ALREADY_CONSUMED'
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: {
      currentUses: any;
      usedByUserId?: string;
    } = {
      currentUses: sql`${inviteCodes.currentUses} + 1`
    };

    // Set usedByUserId if this is the first use (null) or if it's a single-use code
    if (invite.usedByUserId === null) {
      updateData.usedByUserId = userId.trim();
    }

    // Update the invite code
    const updated = await db.update(inviteCodes)
      .set(updateData)
      .where(eq(inviteCodes.id, invite.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update invite code',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    const updatedInvite = updated[0];
    const remainingUses = updatedInvite.maxUses - updatedInvite.currentUses;

    return NextResponse.json({
      success: true,
      inviteCode: updatedInvite,
      remainingUses
    }, { status: 200 });

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
