import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { positionId, alertType, title, message, severity, isRead, isDismissed } = body;

    // Validate required fields
    if (!alertType || !alertType.trim()) {
      return NextResponse.json({ 
        error: "alertType is required",
        code: "MISSING_ALERT_TYPE" 
      }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ 
        error: "title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ 
        error: "message is required",
        code: "MISSING_MESSAGE" 
      }, { status: 400 });
    }

    // Validate alertType enum
    const validAlertTypes = ['stop_loss', 'take_profit', 'risk_limit', 'setup', 'news'];
    if (!validAlertTypes.includes(alertType)) {
      return NextResponse.json({ 
        error: `alertType must be one of: ${validAlertTypes.join(', ')}`,
        code: "INVALID_ALERT_TYPE" 
      }, { status: 400 });
    }

    // Validate severity enum if provided
    const validSeverities = ['info', 'warning', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json({ 
        error: `severity must be one of: ${validSeverities.join(', ')}`,
        code: "INVALID_SEVERITY" 
      }, { status: 400 });
    }

    // Validate positionId if provided
    if (positionId !== null && positionId !== undefined) {
      if (isNaN(parseInt(positionId))) {
        return NextResponse.json({ 
          error: "positionId must be a valid integer",
          code: "INVALID_POSITION_ID" 
        }, { status: 400 });
      }
    }

    // Prepare insert data with authenticated user's text ID
    const insertData = {
      userId: user.id,
      positionId: positionId ? parseInt(positionId) : null,
      alertType: alertType.trim(),
      title: title.trim(),
      message: message.trim(),
      severity: severity || 'info',
      isRead: isRead !== undefined ? Boolean(isRead) : false,
      isDismissed: isDismissed !== undefined ? Boolean(isDismissed) : false,
      createdAt: new Date().toISOString()
    };

    const newAlert = await db.insert(alerts)
      .values(insertData)
      .returning();

    return NextResponse.json(newAlert[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

