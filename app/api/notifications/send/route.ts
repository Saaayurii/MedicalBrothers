import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { notificationEmitter } from '@/lib/events/notification-emitter';
import { Notification } from '@/lib/types/notification';
import { requireApiAuth } from '@/lib/api-auth';

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send a real-time notification
 *     description: Send a notification to a specific user via SSE
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userRole
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: number
 *               userRole:
 *                 type: string
 *                 enum: [patient, doctor, admin]
 *               type:
 *                 type: string
 *                 enum: [appointment, reminder, emergency, message]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  await connection();

  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { userId, userRole, type, title, message, data } = body;

    if (!userId || !userRole || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      userId: parseInt(userId),
      userRole,
      data: data || {},
      timestamp: new Date(),
    };

    notificationEmitter.emitNotification(notification);

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      notificationId: notification.id,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
