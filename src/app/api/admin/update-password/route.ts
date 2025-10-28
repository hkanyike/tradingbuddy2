import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { account } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, newPassword } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ 
        error: 'newPassword is required',
        code: 'MISSING_PASSWORD' 
      }, { status: 400 });
    }

    // Validate userId is a string
    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'Valid userId is required',
        code: 'INVALID_USER_ID' 
      }, { status: 400 });
    }

    // Validate newPassword is a string with minimum length
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long',
        code: 'INVALID_PASSWORD_LENGTH' 
      }, { status: 400 });
    }

    // Hash the password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Check if account exists for user with providerId "credential"
    const existingAccount = await db.select()
      .from(account)
      .where(and(
        eq(account.userId, userId),
        eq(account.providerId, 'credential')
      ))
      .limit(1);

    const currentTimestamp = new Date();

    if (existingAccount.length > 0) {
      // Update existing account
      const updated = await db.update(account)
        .set({
          password: hashedPassword,
          updatedAt: currentTimestamp
        })
        .where(and(
          eq(account.userId, userId),
          eq(account.providerId, 'credential')
        ))
        .returning();

      return NextResponse.json({
        message: 'Password updated successfully',
        accountId: updated[0].id
      }, { status: 200 });
    } else {
      // Create new account record
      const newAccount = await db.insert(account)
        .values({
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: 'credential',
          userId: userId,
          password: hashedPassword,
          accessToken: null,
          refreshToken: null,
          idToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          scope: null,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp
        })
        .returning();

      return NextResponse.json({
        message: 'Password created successfully',
        accountId: newAccount[0].id
      }, { status: 201 });
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

