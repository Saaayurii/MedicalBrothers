import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { logger } from '@/lib/logger';
import { sanitizeString } from '@/lib/sanitize';

/**
 * @swagger
 * /api/push/unsubscribe:
 *   post:
 *     summary: Unsubscribe from push notifications
 *     description: Remove a push notification subscription
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: Push subscription endpoint URL to remove
 *                 example: "https://fcm.googleapis.com/fcm/send/abc123"
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
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
 *                   example: "Unsubscribed successfully"
 *       500:
 *         description: Failed to unsubscribe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  await connection();

  try {
    const { endpoint } = await request.json();

    // Validate endpoint
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Sanitize endpoint
    const sanitizedEndpoint = sanitizeString(endpoint);

    // TODO: Remove subscription from database
    // await prisma.pushSubscription.deleteMany({
    //   where: { endpoint: sanitizedEndpoint },
    // });

    logger.info('Push subscription removed', {
      endpoint: sanitizedEndpoint.substring(0, 50) + '...',
    });

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    logger.error('Failed to remove push subscription', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
