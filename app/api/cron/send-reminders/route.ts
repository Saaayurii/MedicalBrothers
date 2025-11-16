import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/cron/send-reminders:
 *   get:
 *     summary: Send pending reminders (Cron job)
 *     tags: [Cron Jobs]
 *     description: Automatically sends pending reminders that are scheduled for the current time or earlier
 *     responses:
 *       200:
 *         description: Reminders processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sent:
 *                   type: number
 *                 failed:
 *                   type: number
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();

    // Find all pending reminders that should be sent
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        patient: true,
        appointment: {
          include: {
            doctor: true,
          },
        },
      },
      take: 100, // Process 100 reminders at a time
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of pendingReminders) {
      try {
        // Send reminder based on type
        switch (reminder.reminderType) {
          case 'email':
            await sendEmailReminder(reminder);
            break;
          case 'sms':
            await sendSMSReminder(reminder);
            break;
          case 'push':
            await sendPushReminder(reminder);
            break;
        }

        // Update reminder status to sent
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);

        // Update reminder status to failed
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'failed',
          },
        });

        failedCount++;
      }
    }

    console.log(`Reminders processed: ${sentCount} sent, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: pendingReminders.length,
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}

// Helper functions for sending different types of reminders

async function sendEmailReminder(reminder: any) {
  // TODO: Implement email sending logic using a service like SendGrid, Resend, etc.
  console.log(`Sending email reminder to ${reminder.patient.email}:`, reminder.message);

  // For now, just log it
  // In production, integrate with an email service:
  // await emailService.send({
  //   to: reminder.patient.email,
  //   subject: 'Appointment Reminder',
  //   text: reminder.message,
  // });
}

async function sendSMSReminder(reminder: any) {
  // TODO: Implement SMS sending logic using a service like Twilio
  console.log(`Sending SMS reminder to ${reminder.patient.phone}:`, reminder.message);

  // For now, just log it
  // In production, integrate with an SMS service:
  // await smsService.send({
  //   to: reminder.patient.phone,
  //   message: reminder.message,
  // });
}

async function sendPushReminder(reminder: any) {
  // TODO: Implement push notification logic using web-push or Firebase
  console.log(`Sending push reminder to patient ${reminder.patient.id}:`, reminder.message);

  // For now, just log it
  // In production, integrate with push notification service:
  // await pushService.send({
  //   userId: reminder.patient.id,
  //   title: 'Appointment Reminder',
  //   body: reminder.message,
  // });
}
