import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification, sendBulkNotifications, NotificationTemplates } from '@/lib/push-notifications';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userIds, template, templateData, customPayload } = body;

    // Authorization check (в production нужна проверка прав доступа)
    // TODO: Verify that the requester has permission to send notifications

    let subscriptions: any[] = [];

    // Get subscriptions from database
    if (userId) {
      // Single user notification
      /*
      subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: parseInt(userId) },
      });
      */
      console.log('Getting subscriptions for user:', userId);
    } else if (userIds && Array.isArray(userIds)) {
      // Multiple users notification
      /*
      subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: { in: userIds.map((id: string) => parseInt(id)) } },
      });
      */
      console.log('Getting subscriptions for users:', userIds);
    } else {
      return NextResponse.json(
        { error: 'Either userId or userIds must be provided' },
        { status: 400 }
      );
    }

    // Build notification payload
    let payload;
    if (customPayload) {
      payload = customPayload;
    } else if (template && templateData) {
      // Use predefined template
      switch (template) {
        case 'appointmentReminder':
          payload = NotificationTemplates.appointmentReminder(
            templateData.doctorName,
            templateData.time
          );
          break;
        case 'newMessage':
          payload = NotificationTemplates.newMessage(
            templateData.from,
            templateData.preview
          );
          break;
        case 'consultationReady':
          payload = NotificationTemplates.consultationReady(
            templateData.doctorName
          );
          break;
        case 'prescriptionReady':
          payload = NotificationTemplates.prescriptionReady();
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid template' },
            { status: 400 }
          );
      }
    } else {
      return NextResponse.json(
        { error: 'Either template or customPayload must be provided' },
        { status: 400 }
      );
    }

    // Send notifications
    if (subscriptions.length === 0) {
      console.log('No subscriptions found for the specified user(s)');
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No active subscriptions found',
      });
    }

    const result = await sendBulkNotifications(subscriptions, payload);

    return NextResponse.json({
      success: true,
      sent: result.success,
      failed: result.failed,
    });
  } catch (error: any) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
