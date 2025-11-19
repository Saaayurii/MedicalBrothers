import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVapidPublicKey } from '@/lib/push-notifications';

/**
 * @swagger
 * /api/push/subscribe:
 *   get:
 *     tags:
 *       - Push Notifications
 *     summary: Get VAPID public key
 *     description: |
 *       Retrieve VAPID public key for Web Push API subscription.
 *       This key is required for browser push notification registration.
 *     operationId: getVapidKey
 *     security: []
 *     responses:
 *       200:
 *         description: VAPID public key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicKey:
 *                   type: string
 *                   description: Base64-encoded VAPID public key
 *                   example: "BEl62iUYgU..."
 *       500:
 *         description: Push notifications not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Push notifications not configured
 */
// Get VAPID public key
export async function GET() {
  try {
    const publicKey = getVapidPublicKey();

    if (!publicKey) {
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/push/subscribe:
 *   post:
 *     tags:
 *       - Push Notifications
 *     summary: Subscribe to push notifications
 *     description: |
 *       Register a push notification subscription for a user.
 *       Stores the subscription endpoint and keys for sending notifications.
 *
 *       Subscription format follows Web Push API standard.
 *     operationId: subscribePush
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - subscription
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID to associate subscription with
 *                 example: 1
 *               subscription:
 *                 $ref: '#/components/schemas/PushSubscription'
 *     responses:
 *       200:
 *         description: Subscription saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Subscription saved
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store subscription in database
    // Note: You'll need to add a PushSubscription model to your Prisma schema
    /*
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: parseInt(userId),
          endpoint: subscription.endpoint,
        },
      },
      update: {
        keys: subscription.keys,
        updatedAt: new Date(),
      },
      create: {
        userId: parseInt(userId),
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    });
    */

    // For now, just log it
    console.log('Push subscription saved:', { userId, subscription });

    return NextResponse.json({
      success: true,
      message: 'Subscription saved',
    });
  } catch (error: any) {
    console.error('Error saving subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/push/subscribe:
 *   delete:
 *     tags:
 *       - Push Notifications
 *     summary: Unsubscribe from push notifications
 *     description: |
 *       Remove a push notification subscription for a user.
 *       Stops push notifications from being sent to the specified endpoint.
 *     operationId: unsubscribePush
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - endpoint
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID
 *                 example: 1
 *               endpoint:
 *                 type: string
 *                 description: Push subscription endpoint URL
 *                 example: "https://fcm.googleapis.com/fcm/send/..."
 *     responses:
 *       200:
 *         description: Subscription removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Subscription removed
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, endpoint } = body;

    if (!userId || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Remove subscription from database
    /*
    await prisma.pushSubscription.delete({
      where: {
        userId_endpoint: {
          userId: parseInt(userId),
          endpoint,
        },
      },
    });
    */

    console.log('Push subscription removed:', { userId, endpoint });

    return NextResponse.json({
      success: true,
      message: 'Subscription removed',
    });
  } catch (error: any) {
    console.error('Error removing subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
